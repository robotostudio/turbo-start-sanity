import Anthropic from "@anthropic-ai/sdk";
import { env } from "@workspace/env/server";
import { Logger } from "@workspace/logger";
import type { NextRequest } from "next/server";

const logger = new Logger("AskRoute");

const MAX_QUESTION_LENGTH = 500;
const MAX_CONTINUATIONS = 3;
const MCP_SERVER_NAME = "sanity-kb";
const REQUESTS_PER_MINUTE = 5;
const WINDOW_MS = 60_000;

// Per server instance only; use a Vercel Firewall rule for a global limit.
const recentRequests = new Map<string, number[]>();

const SYSTEM_PROMPT = `You answer visitor questions in the FAQ section of the Turbo Start Sanity website.
Use the knowledge base tools for every answer: call initial_context, then knowledge_base_read on the entries that fit the question.
Answer only from what those entries say. If they don't cover the question, say so plainly and suggest opening an issue on GitHub.
Reply with the answer only; don't announce or describe the tool calls.
Keep answers short: a few sentences, in plain text with no Markdown.`;

interface AskConfig {
  apiKey: string;
  endpoint: string;
  token: string;
}

function isRateLimited(ip: string) {
  const now = Date.now();
  for (const [key, times] of recentRequests) {
    if (now - (times.at(-1) ?? 0) >= WINDOW_MS) recentRequests.delete(key);
  }
  const recent = (recentRequests.get(ip) ?? []).filter(
    (time) => now - time < WINDOW_MS
  );
  const limited = recent.length >= REQUESTS_PER_MINUTE;
  if (!limited) recent.push(now);
  recentRequests.set(ip, recent);
  return limited;
}

async function readQuestion(req: NextRequest): Promise<string> {
  try {
    const body = (await req.json()) as { question?: unknown };
    return typeof body?.question === "string" ? body.question.trim() : "";
  } catch {
    return "";
  }
}

async function streamAnswer(
  config: AskConfig,
  question: string,
  signal: AbortSignal,
  onText: (text: string) => void
) {
  const client = new Anthropic({ apiKey: config.apiKey });
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: question },
  ];

  for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
    const stream = client.beta.messages.stream(
      {
        model: "claude-opus-5",
        max_tokens: 8000,
        betas: ["mcp-client-2025-11-20", "server-side-fallback-2026-07-01"],
        fallbacks: "default",
        output_config: { effort: "low" },
        system: SYSTEM_PROMPT,
        mcp_servers: [
          {
            type: "url",
            url: config.endpoint,
            name: MCP_SERVER_NAME,
            authorization_token: config.token,
          },
        ],
        tools: [{ type: "mcp_toolset", mcp_server_name: MCP_SERVER_NAME }],
        messages,
      },
      { signal }
    );
    stream.on("text", onText);
    const message = await stream.finalMessage();

    if (message.stop_reason === "refusal") {
      onText("Sorry, I can't answer that.");
      return;
    }
    if (message.stop_reason !== "pause_turn") return;
    messages.push({ role: "assistant", content: message.content });
  }
}

export async function POST(req: NextRequest) {
  const apiKey = env.ANTHROPIC_API_KEY;
  const endpoint = env.SANITY_CONTEXT_ENDPOINT;
  const token = env.SANITY_CONTEXT_TOKEN;
  if (!(apiKey && endpoint && token)) {
    return new Response("Asking isn't set up on this site yet.", {
      status: 503,
    });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (isRateLimited(ip)) {
    return Response.json(
      {
        error:
          "Too many questions in a short time. Please wait a minute and try again.",
      },
      { status: 429 }
    );
  }

  const question = await readQuestion(req);
  if (!question || question.length > MAX_QUESTION_LENGTH) {
    return new Response(
      `Ask a question of up to ${MAX_QUESTION_LENGTH} characters.`,
      { status: 400 }
    );
  }

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (text: string) => {
        if (!req.signal.aborted) controller.enqueue(encoder.encode(text));
      };
      try {
        await streamAnswer(
          { apiKey, endpoint, token },
          question,
          req.signal,
          send
        );
      } catch (error) {
        if (!req.signal.aborted) {
          logger.error("Ask request failed", error);
          send("Sorry, something went wrong. Please try again.");
        }
      } finally {
        if (!req.signal.aborted) controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Cache-Control": "no-store",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}

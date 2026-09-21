import { createMCPClient } from "@ai-sdk/mcp";
import { env } from "@workspace/env/server";
import { Logger } from "@workspace/logger";
import { isStepCount, streamText } from "ai";
import type { NextRequest } from "next/server";

const logger = new Logger("AskRoute");

const MAX_QUESTION_LENGTH = 500;
const MAX_STEPS = 10;
const REQUESTS_PER_MINUTE = 5;
const WINDOW_MS = 60_000;
const ERROR_MESSAGE = "Sorry, something went wrong. Please try again.";
const CUT_OFF_NOTE = "\n\n(The answer was cut off. Please try again.)";

// Per server instance only; use a Vercel Firewall rule for a global limit.
const recentRequests = new Map<string, number[]>();

const SYSTEM_PROMPT = `You answer visitor questions in the FAQ section of the Turbo Start Sanity website.
Use the knowledge base tools for every answer: call initial_context, then knowledge_base_read on the entries that fit the question.
Answer only from what those entries say. If they don't cover the question, say so plainly and suggest opening an issue on GitHub.
Reply with the answer only; don't announce or describe the tool calls.
Keep answers short: a few sentences, in plain text with no Markdown.`;

interface AskConfig {
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
): Promise<boolean> {
  const mcpClient = await createMCPClient({
    transport: {
      type: "http",
      url: config.endpoint,
      headers: { Authorization: `Bearer ${config.token}` },
    },
  });
  try {
    const result = streamText({
      model: "anthropic/claude-opus-5",
      maxOutputTokens: 8000,
      reasoning: "low",
      instructions: SYSTEM_PROMPT,
      tools: await mcpClient.tools(),
      stopWhen: isStepCount(MAX_STEPS),
      prompt: question,
      abortSignal: signal,
    });
    for await (const text of result.textStream) onText(text);

    const finishReason = await result.finishReason;
    if (finishReason === "content-filter") {
      onText("Sorry, I can't answer that.");
      return true;
    }
    return finishReason === "stop";
  } finally {
    await mcpClient.close();
  }
}

export async function POST(req: NextRequest) {
  const endpoint = env.SANITY_CONTEXT_ENDPOINT;
  const token = env.SANITY_CONTEXT_TOKEN;
  if (!(endpoint && token)) {
    return new Response("Asking isn't set up on this site yet.", {
      status: 503,
    });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",").at(-1)?.trim() || "local";
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
      let sentText = false;
      const send = (text: string) => {
        if (req.signal.aborted || !text) return;
        sentText = true;
        controller.enqueue(encoder.encode(text));
      };
      // A partial answer gets a cut-off note, never a glued-on error.
      const endEarly = () => send(sentText ? CUT_OFF_NOTE : ERROR_MESSAGE);
      try {
        const finished = await streamAnswer(
          { endpoint, token },
          question,
          req.signal,
          send
        );
        if (!finished) endEarly();
      } catch (error) {
        if (!req.signal.aborted) {
          logger.error("Ask request failed", error);
          endEarly();
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

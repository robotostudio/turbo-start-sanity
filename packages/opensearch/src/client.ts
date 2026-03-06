import { Client } from "@opensearch-project/opensearch";
import { opensearchEnv } from "./env";

let _client: Client | null = null;

export function getOpenSearchClient(): Client {
  if (_client) return _client;

  const { OPENSEARCH_URL, OPENSEARCH_USERNAME, OPENSEARCH_PASSWORD } =
    opensearchEnv;

  const hasAuth = OPENSEARCH_USERNAME && OPENSEARCH_PASSWORD;

  _client = new Client({
    node: OPENSEARCH_URL,
    ...(hasAuth && {
      auth: {
        username: OPENSEARCH_USERNAME,
        password: OPENSEARCH_PASSWORD,
      },
    }),
    ssl: {
      rejectUnauthorized: process.env.NODE_ENV === "production",
    },
  });

  return _client;
}

export async function isOpenSearchHealthy(): Promise<boolean> {
  try {
    const client = getOpenSearchClient();
    const response = await client.cluster.health({});
    const status = response.body?.status;
    return status === "green" || status === "yellow";
  } catch {
    return false;
  }
}

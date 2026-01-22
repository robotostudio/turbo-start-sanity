import { env } from "@workspace/env/server";
import { client } from "@workspace/sanity/client";
import { defineEnableDraftMode } from "next-sanity/draft-mode";

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: env.SANITY_API_READ_TOKEN }),
});

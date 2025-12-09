import { env } from "env";
import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { client } from "@/lib/sanity/client";

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token: env.SANITY_API_READ_TOKEN }),
});

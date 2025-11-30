import { defineEnableDraftMode } from "next-sanity/draft-mode";

import { client } from "@/lib/sanity/client";
import { token } from "@/lib/sanity/token";

export const { GET } = defineEnableDraftMode({
  client: client.withConfig({ token }),
});

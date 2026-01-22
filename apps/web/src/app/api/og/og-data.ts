import { client } from "@workspace/sanity/client";
import {
  queryBlogPageOGData,
  queryGenericPageOGData,
  queryHomePageOGData,
  querySlugPageOGData,
} from "@workspace/sanity/query";

import { handleErrors } from "@/utils";

export async function getHomePageOGData(id: string) {
  return await handleErrors(client.fetch(queryHomePageOGData, { id }));
}

export async function getSlugPageOGData(id: string) {
  return await handleErrors(client.fetch(querySlugPageOGData, { id }));
}

export async function getBlogPageOGData(id: string) {
  return await handleErrors(client.fetch(queryBlogPageOGData, { id }));
}

export async function getGenericPageOGData(id: string) {
  return await handleErrors(client.fetch(queryGenericPageOGData, { id }));
}

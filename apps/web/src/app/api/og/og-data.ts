import { client } from "@/lib/sanity/client";
import {
  queryGenericPageOGData,
  queryHomePageOGData,
  querySlugPageOGData,
} from "@/lib/sanity/query";
import { handleErrors } from "@/utils";

export async function getHomePageOGData(id: string) {
  return await handleErrors(client.fetch(queryHomePageOGData, { id }));
}

export async function getSlugPageOGData(id: string) {
  return await handleErrors(client.fetch(querySlugPageOGData, { id }));
}

export async function getGenericPageOGData(id: string) {
  return await handleErrors(client.fetch(queryGenericPageOGData, { id }));
}

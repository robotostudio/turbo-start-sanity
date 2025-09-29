import { client } from "./sanity/client";
import { queryRedirects } from "./sanity/query";

export const getRedirectData = async () => {
    const data = await client.fetch(queryRedirects);
    return data;
};
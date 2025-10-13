"use server";

import { draftMode } from "next/headers";

const DISABLE_DELAY = 1000;

export async function disableDraftMode() {
  const disable = (await draftMode()).disable();
  const delay = new Promise((resolve) => setTimeout(resolve, DISABLE_DELAY));
  await Promise.allSettled([disable, delay]);
}

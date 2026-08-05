import { blockSchemas } from "@workspace/sanity-blocks";

import { definitions } from "@/schemaTypes/definitions/index";
import { documents, singletons } from "@/schemaTypes/documents/index";

export const schemaTypes = [...documents, ...definitions, ...blockSchemas];

const schemaNames = documents.map(({ name }) => name);
export type SchemaType = (typeof schemaNames)[number];

/** Singleton names — one document each, so they can't be created ad hoc. */
export const singletonTypes = singletons.map(({ name }) => name);
export type SingletonType = (typeof singletonTypes)[number];

import { blockSchemas } from "@workspace/sanity-blocks";

import { definitions } from "@/schemaTypes/definitions/index";
import { documents, singletons } from "@/schemaTypes/documents/index";

export const schemaTypes = [...documents, ...definitions, ...blockSchemas];

export const schemaNames = [...documents].map((doc) => doc.name);

export type SchemaType = (typeof schemaNames)[number];

export const singletonType = singletons.map(({ name }) => name);

export type SingletonType = (typeof singletonType)[number];

export default schemaTypes;

import { author } from "@/schemaTypes/documents/author";
import { blog } from "@/schemaTypes/documents/blog";
import { blogIndex } from "@/schemaTypes/documents/blog-index";
import { faq } from "@/schemaTypes/documents/faq";
import { footer } from "@/schemaTypes/documents/footer";
import { homePage } from "@/schemaTypes/documents/home-page";
import { navbar } from "@/schemaTypes/documents/navbar";
import { page } from "@/schemaTypes/documents/page";
import { redirect } from "@/schemaTypes/documents/redirect";
import { settings } from "@/schemaTypes/documents/settings";
import { showcaseItem } from "@/schemaTypes/documents/showcase-item";
import { showcasePage } from "@/schemaTypes/documents/showcase-page";

export const singletons = [
  homePage,
  blogIndex,
  settings,
  footer,
  navbar,
  showcasePage,
];

export const documents = [
  blog,
  page,
  faq,
  author,
  showcaseItem,
  ...singletons,
  redirect,
];

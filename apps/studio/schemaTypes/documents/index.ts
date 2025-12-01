import { author } from "@documents/author";
import { blog } from "@documents/blog";
import { blogIndex } from "@documents/blog-index";
import { faq } from "@documents/faq";
import { footer } from "@documents/footer";
import { homePage } from "@documents/home-page";
import { navbar } from "@documents/navbar";
import { page } from "@documents/page";
import { redirect } from "@documents/redirect";
import { settings } from "@documents/settings";

export const singletons = [homePage, blogIndex, settings, footer, navbar];

export const documents = [blog, page, faq, author, ...singletons, redirect];

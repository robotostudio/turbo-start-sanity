import artist from './artist';
import { collection } from "./collection";
import { collectionIndex } from "./collection-index";
import { footer } from './footer';
import { homePage } from "./home-page";
import { navbar } from "./navbar";
import { page } from "./page";
import { redirect } from "./redirect";
import { settings } from "./settings";

export const singletons = [homePage, collectionIndex, settings, footer, navbar];

export const documents = [page, collection, artist, ...singletons, redirect];

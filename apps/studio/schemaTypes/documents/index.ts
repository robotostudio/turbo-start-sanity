import artist from './artist';
import { exhibition } from "./exhibition";
import { exhibitionIndex } from "./exhibition-index";
import { footer } from './footer';
import { homePage } from "./home-page";
import { navbar } from "./navbar";
import { page } from "./page";
import { redirect } from "./redirect";
import { settings } from "./settings";

export const singletons = [homePage, exhibitionIndex, settings, footer, navbar];

export const documents = [page, exhibition, artist, ...singletons, redirect];

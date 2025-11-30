import localFont from "next/font/local";

export const baseTwelveSerifSmallCaps = localFont({
  src: [
    {
      path: "./BaseTwelveSerifSmallcaps.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./BaseTwSerifSmallCapsRegular.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./BaseTwSansSmallCapsRegular.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./BaseTwelveSerifSCB.woff2",
      weight: "800",
      style: "normal",
    },
    {
      path: "./BaseTwelveSerifSCBI.woff2",
      weight: "900",
      style: "normal",
    },
    {
      path: "./BaseTwelveSerifSCI.woff2",
      weight: "900",
      style: "italic",
    },
    {
      path: "./BaseTwelveSerifSCI.woff",
      weight: "900",
      style: "italic",
    },
  ],
  variable: "--font-face-twelve-serif-small-caps",
});

export const baseTwelveSerif = localFont({
  src: [
    {
      path: "./BaseTwelveSerif.woff2",
      weight: "400",
      style: "normal",
    },
    {
      path: "./BaseTwelveSerifBold.woff2",
      weight: "700",
      style: "normal",
    },
    {
      path: "./BaseTwelveSerifRegular.woff2",
      weight: "500",
      style: "normal",
    },
    {
      path: "./BaseTwelveSerifBoldItalic.woff2",
      weight: "700",
      style: "italic",
    },
    {
      path: "./BaseTwelveSerifItalic.woff2",
      weight: "400",
      style: "italic",
    },
  ],
  variable: "--font-face-twelve-serif",
});

// AkzidenzGrotesk - ExtraBold.otf;
// AkzidenzGrotesk - ExtraBoldCond.otf;
// AkzidenzGrotesk - Medium.otf;
// AkzidenzGrotesk - Regular.otf;
// AkzidenzGrotesk - Super.otf;
// AkzidenzGrotesk - MediumCond.otf;
// AkzidenzGrotesk - MediumExtended.otf;
// AkzidenzGrotesk - Bold.otf;
// AkzidenzGrotesk - Cond.otf;
// AkzidenzGrotesk - Extended.otf;
// AkzidenzGrotesk - LightCond.otf;
// AkzidenzGrotesk - BoldCond.otf;

export const akzidenzGrotesk = localFont({
  src: [
    {
      path: "./AkzidenzGrotesk-ExtraBold.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-ExtraBoldCond.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-Super.otf",
      weight: "900",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-MediumCond.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-MediumExtended.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-Cond.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-Extended.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-LightCond.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "./AkzidenzGrotesk-BoldCond.otf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-face-akzidenz-grotesk",
});
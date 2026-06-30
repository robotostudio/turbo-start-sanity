/** biome-ignore-all lint/performance/noImgElement: OG image generation */
import { ImageResponse } from "next/og";
import type { ImageResponseOptions } from "next/server";

import type { Maybe } from "@/types";
import { getTitleCase } from "@/utils";
import { getOgMetaData } from "./og-config";
import {
  getBlogPageOGData,
  getGenericPageOGData,
  getHomePageOGData,
  getSlugPageOGData,
} from "./og-data";

const errorContent = (
  <div tw="flex flex-col w-full h-full items-center justify-center">
    <div tw=" flex w-full h-full items-center justify-center ">
      <h1 tw="text-white">Something went Wrong with image generation</h1>
    </div>
  </div>
);

type SeoImageRenderProps = {
  seoImage: string;
};

type ContentProps = Record<string, string>;

type DominantColorSeoImageRenderProps = {
  title?: Maybe<string>;
  _type?: Maybe<string>;
  siteTitle?: Maybe<string>;
};

const seoImageRender = ({ seoImage }: SeoImageRenderProps) => (
  <div tw="flex flex-col w-full h-full items-center justify-center">
    <img alt="SEO preview" height={630} src={seoImage} width={1200} />
  </div>
);

const dominantColorSeoImageRender = ({
  title,
  _type,
  siteTitle,
}: DominantColorSeoImageRenderProps) => (
  <div
    style={{ backgroundColor: "#0A0A0A", fontFamily: "Inter" }}
    tw="flex flex-col justify-between w-full h-full p-[70px]"
  >
    <div tw="flex items-center justify-between w-full">
      <div tw="flex text-white text-2xl font-semibold">
        {siteTitle ?? "Turbo Start"}
      </div>
      {_type && (
        <div
          style={{
            borderColor: "rgba(255,255,255,0.2)",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
          }}
          tw="flex border text-white px-6 py-3 rounded-full text-xl font-medium"
        >
          {getTitleCase(_type)}
        </div>
      )}
    </div>

    <h1
      style={{ lineHeight: 1.05 }}
      tw="flex text-7xl font-bold max-w-[85%] text-white"
    >
      {title ?? siteTitle ?? "Turbo Start"}
    </h1>
  </div>
);

const FONT_REGEX = /url\(([^)]+)\)/;

async function getTtfFont(
  family: string,
  axes: string[],
  value: number[]
): Promise<ArrayBuffer> {
  const familyParam = `${axes.join(",")}@${value.join(",")}`;

  // Get css style sheet with user agent Mozilla/5.0 Firefox/1.0 to ensure non-variable TTF is returned
  const cssCall = await fetch(
    `https://fonts.googleapis.com/css2?family=${family}:${familyParam}&display=swap`,
    {
      headers: {
        "User-Agent": "Mozilla/5.0 Firefox/1.0",
      },
    }
  );

  const css = await cssCall.text();
  const ttfUrl = css.match(FONT_REGEX)?.[1];

  if (!ttfUrl) {
    throw new Error("Failed to extract font URL from CSS");
  }

  return await fetch(ttfUrl).then((res) => res.arrayBuffer());
}

const getOptions = async ({
  width,
  height,
}: {
  width: number;
  height: number;
}): Promise<ImageResponseOptions> => {
  const [interRegular, interBold, interSemiBold] = await Promise.all([
    getTtfFont("Inter", ["wght"], [400]),
    getTtfFont("Inter", ["wght"], [700]),
    getTtfFont("Inter", ["wght"], [600]),
  ]);
  return {
    width,
    height,
    fonts: [
      {
        name: "Inter",
        data: interRegular,
        style: "normal",
        weight: 400,
      },
      {
        name: "Inter",
        data: interBold,
        style: "normal",
        weight: 700,
      },
      {
        name: "Inter",
        data: interSemiBold,
        style: "normal",
        weight: 600,
      },
    ],
  };
};

const getHomePageContent = async ({ id }: ContentProps) => {
  if (!id) {
    return;
  }
  const [result, err] = await getHomePageOGData(id);
  if (err || !result) {
    return;
  }
  if (result?.seoImage) {
    return seoImageRender({ seoImage: result.seoImage });
  }
  return dominantColorSeoImageRender(result);
};
const getSlugPageContent = async ({ id }: ContentProps) => {
  if (!id) {
    return;
  }
  const [result, err] = await getSlugPageOGData(id);
  if (err || !result) {
    return;
  }
  if (result?.seoImage) {
    return seoImageRender({ seoImage: result.seoImage });
  }
  return dominantColorSeoImageRender(result);
};

const getBlogPageContent = async ({ id }: ContentProps) => {
  if (!id) {
    return;
  }
  const [result, err] = await getBlogPageOGData(id);
  if (err || !result) {
    return;
  }
  if (result?.seoImage) {
    return seoImageRender({ seoImage: result.seoImage });
  }
  return dominantColorSeoImageRender(result);
};

const getGenericPageContent = async ({ id }: ContentProps) => {
  if (!id) {
    return;
  }
  const [result, err] = await getGenericPageOGData(id);
  if (err || !result) {
    return;
  }
  if (result?.seoImage) {
    return seoImageRender({ seoImage: result.seoImage });
  }
  return dominantColorSeoImageRender(result);
};

const block = {
  homePage: getHomePageContent,
  page: getSlugPageContent,
  blog: getBlogPageContent,
} as const;

export async function GET({ url }: Request): Promise<ImageResponse> {
  const { searchParams } = new URL(url);
  const type = searchParams.get("type") as keyof typeof block;
  const { width, height } = getOgMetaData(searchParams);
  const para = Object.fromEntries(searchParams.entries());
  const options = await getOptions({ width, height });
  const image = block[type] ?? getGenericPageContent;
  try {
    const content = await image(para);
    return new ImageResponse(content ? content : errorContent, options);
  } catch (_err) {
    return new ImageResponse(errorContent, options);
  }
}

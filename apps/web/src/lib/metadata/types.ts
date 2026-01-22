export type MetaTag = {
  property: string | undefined;
  content: string | undefined;
};

export type LinkTag = {
  rel: string | undefined;
  href: string | undefined;
};

export type ParsedHead = {
  metaTags: MetaTag[];
  title: string | undefined;
  linkTags: LinkTag[];
};

export type SiteMetadata = {
  title: string;
  description: string;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
  url: string;
};

export type MetadataResult =
  | { success: true; data: SiteMetadata }
  | { success: false; error: string; data: SiteMetadata };

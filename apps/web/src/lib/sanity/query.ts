import { defineQuery } from "next-sanity";

const imageFields = /* groq */ `
  "id": asset._ref,
  "preview": asset->metadata.lqip,
  hotspot {
    x,
    y
  },
  crop {
    bottom,
    left,
    right,
    top
  }
`;
// Base fragments for reusable query parts
const imageFragment = /* groq */ `
  image {
    ${imageFields}
  }
`;

const customLinkFragment = /* groq */ `
  ...customLink{
    openInNewTab,
    "href": select(
      type == "internal" => internal->slug.current,
      type == "external" => external,
      "#"
    ),
  }
`;

const markDefsFragment = /* groq */ `
  markDefs[]{
    ...,
    ${customLinkFragment}
  }
`;

const collectionCardFragment = /* groq */ `
  ...,
  _type,
  _id,
  title,
  description,
  "slug":slug.current,
  orderRank,
  ${imageFragment}
`;

const buttonsFragment = /* groq */ `
  buttons[]{
    text,
    variant,
    _key,
    _type,
    "openInNewTab": url.openInNewTab,
    "href": select(
      url.type == "internal" => url.internal->slug.current,
      url.type == "external" => url.external,
      url.href
    ),
  }
`;

// Page builder block fragments

const imageSectionBlock = /* groq */ `
  _type == "imageSection" => {
    ...,
    ${imageFragment}
  }
`;

const videoSectionBlock = /* groq */ `
  _type == "videoSection" => {
    ...,
    video{
      asset->{
        playbackId,
        status
      }
    }
  }
`;

const imageGalleryBlock = /* groq */ `
  _type == "imageGallery" => {
    ...,
    "images": images[]{
      ...,
      "image": {
        ${imageFields}
      },
      "caption": caption[]{
        ...,
        _type == "block" => {
          ...,
          ${markDefsFragment}
        }
      }
    }
  }
`;
const richTextFragment = /* groq */ `
  richText[]{
    ...,
    _type == "block" => {
      ...,
      ${markDefsFragment}
    },
    _type == "image" => {
      ...,
      ${imageFields},
      "caption": caption[]{
        ...,
        _type == "block" => {
          ...,
          ${markDefsFragment}
        }
      },
      variant
    },
    _type == "imageGallery" => {
      ...,
      ${imageGalleryBlock}
    }
  }
`;
const textSectionBlock = /* groq */ `
  _type == "textSection" => {
    ...,
    ${richTextFragment}
  }
`;

const collectionListingBlock = /* groq */ `
  _type == "collectionListing" => {
    ...,
    "collections": *[_type == "collection"] | order(orderRank asc){
      ${collectionCardFragment}
    }
  }
`;

const gridLayoutBlock = /* groq */ `
  _type == "gridLayout" => {
    ...,
    pageBuilder[]{
      ...,
      _type,
      ${imageSectionBlock},
      ${videoSectionBlock},
      ${imageGalleryBlock},
      ${textSectionBlock},
      ${collectionListingBlock}
    }
  }
`;

const pageBuilderFragment = /* groq */ `
  pageBuilder[]{
    ...,
    _type,
    ${gridLayoutBlock},
    ${imageSectionBlock},
    ${videoSectionBlock},
    ${imageGalleryBlock},
    ${textSectionBlock},
    ${collectionListingBlock}
  }
`;

/**
 * Query to extract a single image from a page document
 * This is used as a type reference only and not for actual data fetching
 * Helps with TypeScript inference for image objects
 */
export const queryImageType = defineQuery(`
  *[_type == "page" && defined(image)][0]{
    ${imageFragment}
  }.image
`);

export const queryHomePageData =
  defineQuery(`*[_type == "homePage" && _id == "homePage"][0]{
    ...,
    _id,
    _type,
    "slug": slug.current,
    title,
    description,
    showLatestExhibitions,
    ${pageBuilderFragment}
  }`);

export const querySlugPageData = defineQuery(`
  *[(_type == "page" || _type == "collection" || _type == "collectionIndex") && slug.current == $slug][0]{
    ...,
    "slug": slug.current,
    ${pageBuilderFragment}
  }
  `);

export const querySlugPagePaths = defineQuery(`
  *[(_type == "page" || _type == "collection") && defined(slug.current)].slug.current
`);

export const queryCollectionIndexPageData = defineQuery(`
  *[_type == "collectionIndex" && _id == "collectionIndex"][0]{
    ...,
    _id,
    _type,
    title,
    description,
    ${pageBuilderFragment},
    "slug": slug.current
  }
`);

const ogFieldsFragment = /* groq */ `
  _id,
  _type,
  "title": select(
    defined(ogTitle) => ogTitle,
    defined(seoTitle) => seoTitle,
    title
  ),
  "description": select(
    defined(ogDescription) => ogDescription,
    defined(seoDescription) => seoDescription,
    description
  ),
  "image": image.asset->url + "?w=566&h=566&dpr=2&fit=max",
  "dominantColor": image.asset->metadata.palette.dominant.background,
  "seoImage": seoImage.asset->url + "?w=1200&h=630&dpr=2&fit=max", 
  "logo": *[_type == "settings"][0].logo.asset->url + "?w=80&h=40&dpr=3&fit=max&q=100",
  "date": coalesce(date, _createdAt)
`;

export const queryHomePageOGData = defineQuery(`
  *[_type == "homePage" && _id == $id][0]{
    ${ogFieldsFragment}
  }
  `);

export const querySlugPageOGData = defineQuery(`
  *[(_type == "page" || _type == "collection") && _id == $id][0]{
    ${ogFieldsFragment}
  }
`);

export const queryGenericPageOGData = defineQuery(`
  *[ defined(slug.current) && _id == $id][0]{
    ${ogFieldsFragment}
  }
`);

export const queryFooterData = defineQuery(`
  *[_type == "footer" && _id == "footer"][0]{
    _id,
    subtitle,
    columns[]{
      _key,
      title,
      links[]{
        _key,
        name,
        "openInNewTab": url.openInNewTab,
        "href": select(
          url.type == "internal" => url.internal->slug.current,
          url.type == "external" => url.external,
          url.href
        ),
      }
    }
  }
`);

export const queryNavbarData = defineQuery(`
  *[_type == "navbar" && _id == "navbar"][0]{
    _id,
    columns[]{
      _key,
      _type == "navbarColumn" => {
        "type": "column",
        title,
        links[]{
          _key,
          name,
          icon,
          description,
          "openInNewTab": url.openInNewTab,
          "href": select(
            url.type == "internal" => url.internal->slug.current,
            url.type == "external" => url.external,
            url.href
          )
        }
      },
      _type == "navbarLink" => {
        "type": "link",
        name,
        description,
        "openInNewTab": url.openInNewTab,
        "href": select(
          url.type == "internal" => url.internal->slug.current,
          url.type == "external" => url.external,
          url.href
        )
      }
    },
    ${buttonsFragment},
  }
`);

export const querySitemapData = defineQuery(`{
  "slugPages": *[_type == "page" && defined(slug.current)]{
    "slug": slug.current,
    "lastModified": _updatedAt
  },
  "collectionPages": *[_type == "collection" && defined(slug.current)]{
    "slug": slug.current,
    "lastModified": _updatedAt
  }
}`);
export const queryGlobalSeoSettings = defineQuery(`
  *[_type == "settings"][0]{
    _id,
    _type,
    siteTitle,
    logo {
      ${imageFields}
    },
    siteDescription,
    socialLinks{
      linkedin,
      facebook,
      twitter,
      instagram,
      youtube
    }
  }
`);

export const querySettingsData = defineQuery(`
  *[_type == "settings"][0]{
    _id,
    _type,
    siteTitle,
    siteDescription,
    "logo": logo.asset->url + "?w=80&h=40&dpr=3&fit=max",
    "socialLinks": socialLinks,
    "contactEmail": contactEmail,
  }
`);

export const queryRedirects = defineQuery(`
  *[_type == "redirect" && status == "active" && defined(source.current) && defined(destination.current)]{
    "source":source.current, 
    "destination":destination.current, 
    "permanent" : permanent == "true"
  }
`);

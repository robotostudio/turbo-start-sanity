# Responsive Layout Components

Flexible React components for displaying images and content in responsive grid and masonry layouts.

## Installation

```bash
npm install responsive-layout-components
# or
pnpm add responsive-layout-components
# or
yarn add responsive-layout-components
```

## Peer Dependencies

This package requires the following peer dependencies:

- `react` (^18.0.0 || ^19.0.0)
- `react-dom` (^18.0.0 || ^19.0.0)
- `tailwindcss` (^3.0.0 || ^4.0.0)

Make sure these are installed in your project.

## Table of Contents

- [GridLayout](#gridlayout)
- [MasonryLayout](#masonrylayout)
- [Common Patterns](#common-patterns)

---

## GridLayout

A responsive grid layout component that automatically calculates the optimal number of columns based on the total number of items, ensuring the last row is as balanced as possible.

### Features

- **Auto-calculated columns**: Intelligently determines the best column count to minimize the difference between the last row and previous rows
- **Configurable range**: Set minimum and maximum column counts
- **Perfect division optimization**: Prefers column counts that divide evenly into the total item count

### Props

```typescript
interface GridLayoutProps {
  children: React.ReactNode;
  columns?: number; // Explicit column count (overrides auto-calculation)
  minColumns?: number; // Minimum columns (default: 4)
  maxColumns?: number; // Maximum columns (default: 9)
  gap?: number; // Gap between items in rem units (default: 1)
}
```

### Usage

#### Basic Usage

```tsx
import { GridLayout } from "responsive-layout-components";

<GridLayout>
  {images.map((image) => (
    <ImageItem key={image.id} image={image} />
  ))}
</GridLayout>
```

#### With Custom Column Range

```tsx
<GridLayout minColumns={3} maxColumns={6} gap={1.5}>
  {items.map((item) => (
    <ItemCard key={item.id} item={item} />
  ))}
</GridLayout>
```

#### Explicit Column Count

```tsx
<GridLayout columns={5} gap={2}>
  {products.map((product) => (
    <ProductCard key={product.id} product={product} />
  ))}
</GridLayout>
```

### How Auto-Calculation Works

The component uses an optimization algorithm to find the best column count:

1. **Perfect division check**: If any column count divides evenly into the total item count, it's selected immediately
2. **Difference minimization**: Otherwise, it tests all column counts within the min/max range and selects the one where the last row size is closest to the full row size
3. **Example**: For 31 items:
   - 4 columns: 7 full rows + 3 items (difference: 1)
   - 5 columns: 6 full rows + 1 item (difference: 4)
   - 6 columns: 5 full rows + 1 item (difference: 5)
   - **Result**: Selects 4 columns (smallest difference)

---

## MasonryLayout

A masonry (Pinterest-style) layout component that arranges items in rows where images maintain their aspect ratios and all items in a row have the same height.

### Features

- **Aspect ratio aware**: Uses image dimensions to calculate optimal widths
- **Equal row heights**: All items in the same row have the same height
- **Intelligent grouping**: Groups images into rows based on their aspect ratios
- **Auto-calculated columns**: Determines optimal column count when not specified
- **Fallback mode**: Works without image dimensions using a weight-based system

### Props

```typescript
interface ImageDimensions {
  width: number;
  height: number;
  aspectRatio?: number; // Optional, calculated from width/height if not provided
}

interface MasonryLayoutProps {
  children: React.ReactNode;
  columns?: number; // Explicit column count (overrides auto-calculation)
  gap?: number; // Gap between items in rem units (default: 0)
  imageDimensions?: ImageDimensions[]; // Array of image dimensions (recommended)
}
```

### Usage

#### Basic Usage (Without Dimensions)

```tsx
import { MasonryLayout } from "responsive-layout-components";

<MasonryLayout gap={1}>
  {images.map((image) => (
    <ImageItem key={image.id} image={image} />
  ))}
</MasonryLayout>
```

#### With Image Dimensions (Recommended)

```tsx
const images = [
  {id: 1, width: 1000, height: 1500},
  {id: 2, width: 1500, height: 1000},
  // ...
];

<MasonryLayout
  gap={1}
  imageDimensions={images.map((img) => ({
    width: img.width,
    height: img.height,
  }))}
>
  {images.map((image) => (
    <ImageItem key={image.id} image={image} />
  ))}
</MasonryLayout>
```

#### With Sanity Images

```tsx
import type {SanityImageAsset} from "@sanity/image-url/lib/types/types";

const sanityImages: SanityImageAsset[] = [
  /* ... */
];

<MasonryLayout
  gap={1.5}
  imageDimensions={sanityImages.map((img) => ({
    width: img.metadata?.dimensions?.width ?? 1000,
    height: img.metadata?.dimensions?.height ?? 1000,
    aspectRatio: img.metadata?.dimensions?.aspectRatio,
  }))}
>
  {sanityImages.map((image) => (
    <SanityImage key={image._id} image={image} />
  ))}
</MasonryLayout>
```

#### Explicit Column Count

```tsx
<MasonryLayout columns={4} gap={1}>
  {images.map((image) => (
    <ImageItem key={image.id} image={image} />
  ))}
</MasonryLayout>
```

### How It Works

#### With Image Dimensions (Recommended)

1. **Aspect ratio calculation**: Computes aspect ratios from provided dimensions
2. **Row grouping**: Groups images into rows based on their aspect ratios
   - Images are added to a row until the sum of aspect ratios would exceed the target width
   - Each row's total width equals 100% of the container
3. **Width distribution**: Within each row, each image's width is proportional to its aspect ratio
   - Formula: `width = (imageAspectRatio / sumOfAllAspectRatiosInRow) * 100%`
4. **Equal heights**: Since all images in a row share the same height and widths are proportional to aspect ratios, heights automatically match

#### Without Image Dimensions (Fallback)

When dimensions aren't provided, the component uses a weight-based system:

- Alternates between 1x and 2x column units for visual variety
- Groups items into rows that fill the available width
- Less optimal than dimension-aware mode but still functional

---

## Common Patterns

### Responsive Image Gallery

```tsx
import { GridLayout, MasonryLayout } from "responsive-layout-components";

function ImageGallery({images, layout = "grid"}) {
  const imageDimensions = images.map((img) => ({
    width: img.width,
    height: img.height,
  }));

  if (layout === "masonry") {
    return (
      <MasonryLayout gap={1} imageDimensions={imageDimensions}>
        {images.map((image) => (
          <ImageItem key={image.id} image={image} />
        ))}
      </MasonryLayout>
    );
  }

  return (
    <GridLayout gap={1}>
      {images.map((image) => (
        <ImageItem key={image.id} image={image} />
      ))}
    </GridLayout>
  );
}
```

### Product Grid with Custom Range

```tsx
<GridLayout
  minColumns={3}
  maxColumns={6}
  gap={2}
>
  {products.map((product) => (
    <ProductCard key={product.id} product={product} />
  ))}
</GridLayout>
```

### Photo Gallery with Aspect Ratios

```tsx
const photos = [
  {id: 1, url: "...", width: 2000, height: 1500},
  {id: 2, url: "...", width: 1500, height: 2000},
  // ...
];

<MasonryLayout
  gap={1.5}
  imageDimensions={photos.map((p) => ({
    width: p.width,
    height: p.height,
  }))}
>
  {photos.map((photo) => (
    <img
      key={photo.id}
      src={photo.url}
      alt={`Photo ${photo.id}`}
      className="w-full h-auto"
    />
  ))}
</MasonryLayout>
```

---

## Best Practices

### GridLayout

1. **Use auto-calculation**: Let the component optimize column count unless you have specific design requirements
2. **Set appropriate ranges**: Adjust `minColumns` and `maxColumns` based on your content type and screen sizes
3. **Consider content type**:
   - Product grids: 3-6 columns
   - Image galleries: 4-8 columns
   - Cards: 2-4 columns

### MasonryLayout

1. **Always provide dimensions**: For best results, pass `imageDimensions` prop with actual image dimensions
2. **Match array order**: Ensure `imageDimensions` array matches the order of `children`
3. **Use with images**: Designed specifically for images with varying aspect ratios
4. **Gap spacing**: Use `gap` prop for consistent spacing (default is 0)
5. **Sanity integration**: Extract dimensions from `metadata.dimensions` when using Sanity images

### Performance

- Both components use `React.memo` for optimization
- Calculations are memoized with `useMemo`
- Consider virtualizing for very large lists (100+ items)

---

## TypeScript Types

All types are exported from the package:

```typescript
import type {
  GridLayoutProps,
  MasonryLayoutProps,
  ImageDimensions,
} from "responsive-layout-components";
```

---

## License

MIT


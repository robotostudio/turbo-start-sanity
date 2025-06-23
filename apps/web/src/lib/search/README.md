# Blog Search System

A simple, modular blog search system that can be easily customized with different search providers.

## Quick Start

The search system is already integrated into the blog page with Sanity as the default provider. No additional setup is required to start using search functionality.

## Architecture

The search system consists of:

- **Types** (`types.ts`) - TypeScript interfaces for search results and options
- **Core Search Function** (`blog-search.ts`) - Generic search function that can be customized
- **Search Component** (`../components/blog-search.tsx`) - React component with search UI
- **API Route** (`../app/api/search/route.ts`) - Next.js API endpoint

## Customizing Search Providers

The system is designed to be easily customizable. Here's how to integrate different search providers:

### 1. Sanity (Default - Already Configured)

Uses Sanity's GROQ queries to search through blog content.

**Pros:**
- No additional setup required
- Uses existing Sanity infrastructure
- Free

**Cons:**
- Basic search capabilities
- No advanced features like faceted search or analytics

### 2. Algolia Integration

To use Algolia instead of Sanity:

#### Installation

```bash
npm install algoliasearch
```

#### Setup

1. Create an Algolia account at [algolia.com](https://www.algolia.com)
2. Get your Application ID and API Key
3. Add environment variables:

```env
NEXT_PUBLIC_ALGOLIA_APP_ID=your_app_id
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=your_search_key
ALGOLIA_ADMIN_KEY=your_admin_key
```

#### Replace the search function in `blog-search.ts`:

```typescript
import algoliasearch from 'algoliasearch'

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_KEY!
)
const index = client.initIndex('blogs')

export async function searchBlogs(options: BlogSearchOptions): Promise<BlogSearchResponse> {
  const startTime = Date.now()
  const { query, limit = 10, offset = 0 } = options

  if (!query || query.trim().length < 2) {
    return {
      results: [],
      total: 0,
      query: query?.trim() || '',
      processingTime: Date.now() - startTime
    }
  }

  try {
    const searchResults = await index.search(query.trim(), {
      hitsPerPage: limit,
      offset: offset
    })

    const results: BlogSearchResult[] = searchResults.hits.map((hit: any) => ({
      id: hit.objectID,
      title: hit.title,
      description: hit.description,
      excerpt: hit.excerpt,
      slug: hit.slug,
      url: `/blog/${hit.slug}`,
      image: hit.image ? {
        src: hit.image.src,
        alt: hit.image.alt
      } : undefined,
      publishedAt: hit.publishedAt,
      author: hit.author
    }))

    return {
      results,
      total: searchResults.nbHits,
      query: query.trim(),
      processingTime: Date.now() - startTime
    }
  } catch (error) {
    console.error('Algolia search error:', error)
    throw new Error('Failed to search blog posts')
  }
}
```

#### Index your content:

```typescript
// scripts/index-to-algolia.ts
import algoliasearch from 'algoliasearch'
import { sanityFetch } from '@/lib/sanity/live'

const client = algoliasearch(
  process.env.NEXT_PUBLIC_ALGOLIA_APP_ID!,
  process.env.ALGOLIA_ADMIN_KEY!
)
const index = client.initIndex('blogs')

async function indexBlogs() {
  // Fetch all blogs from Sanity
  const { data: blogs } = await sanityFetch({
    query: `*[_type == "blog" && !(_id in path("drafts.**"))] {
      _id,
      title,
      description,
      "slug": slug.current,
      publishedAt,
      "image": image.asset->{url, "alt": coalesce(altText, originalFilename)},
      "author": authors[0]->{name},
      "excerpt": array::join(string::split(pt::text(richText), "")[0..200], "") + "..."
    }`
  })

  const records = blogs.map(blog => ({
    objectID: blog._id,
    ...blog
  }))

  await index.saveObjects(records)
  console.log(`Indexed ${records.length} blog posts`)
}

indexBlogs()
```

**Pros:**
- Advanced search features (typo tolerance, faceted search, analytics)
- Fast and scalable
- Great developer experience

**Cons:**
- Additional cost
- Requires content indexing

### 3. Typesense Integration

To use Typesense:

#### Installation

```bash
npm install typesense
```

#### Setup

1. Set up Typesense server or use Typesense Cloud
2. Add environment variables:

```env
TYPESENSE_HOST=your_host
TYPESENSE_PORT=443
TYPESENSE_PROTOCOL=https
TYPESENSE_API_KEY=your_api_key
```

#### Replace the search function:

```typescript
import Typesense from 'typesense'

const client = new Typesense.Client({
  nodes: [{
    host: process.env.TYPESENSE_HOST!,
    port: parseInt(process.env.TYPESENSE_PORT!),
    protocol: process.env.TYPESENSE_PROTOCOL!
  }],
  apiKey: process.env.TYPESENSE_API_KEY!,
  connectionTimeoutSeconds: 2
})

export async function searchBlogs(options: BlogSearchOptions): Promise<BlogSearchResponse> {
  const startTime = Date.now()
  const { query, limit = 10, offset = 0 } = options

  if (!query || query.trim().length < 2) {
    return {
      results: [],
      total: 0,
      query: query?.trim() || '',
      processingTime: Date.now() - startTime
    }
  }

  try {
    const searchResults = await client
      .collections('blogs')
      .documents()
      .search({
        q: query.trim(),
        query_by: 'title,description,excerpt',
        per_page: limit,
        offset: offset
      })

    const results: BlogSearchResult[] = searchResults.hits!.map((hit: any) => ({
      id: hit.document.id,
      title: hit.document.title,
      description: hit.document.description,
      excerpt: hit.document.excerpt,
      slug: hit.document.slug,
      url: `/blog/${hit.document.slug}`,
      image: hit.document.image,
      publishedAt: hit.document.publishedAt,
      author: hit.document.author
    }))

    return {
      results,
      total: searchResults.found || 0,
      query: query.trim(),
      processingTime: Date.now() - startTime
    }
  } catch (error) {
    console.error('Typesense search error:', error)
    throw new Error('Failed to search blog posts')
  }
}
```

**Pros:**
- Open source
- Advanced search features
- Privacy-focused

**Cons:**
- Requires server setup
- Additional infrastructure

## Customizing the UI

The search component (`BlogSearch`) can be customized by:

1. **Styling** - Modify the CSS classes
2. **Layout** - Change the `SearchResultCard` component
3. **Behavior** - Adjust debounce timing, result limits, etc.

Example customization:

```typescript
// Custom result card with different layout
function SearchResultCard({ result }: { result: BlogSearchResult }) {
  return (
    <div className="p-6 bg-card rounded-xl border shadow-sm hover:shadow-md transition-shadow">
      <h3 className="text-xl font-bold mb-2">
        <Link href={result.url}>{result.title}</Link>
      </h3>
      {result.description && (
        <p className="text-muted-foreground mb-3">{result.description}</p>
      )}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        {result.publishedAt && (
          <time>{new Date(result.publishedAt).toDateString()}</time>
        )}
        {result.author && <span>by {result.author.name}</span>}
      </div>
    </div>
  )
}
```

## Advanced Features

### Search Analytics

To add search analytics, modify the search function to track queries:

```typescript
// Track search queries
analytics.track('Blog Search', {
  query: query.trim(),
  results_count: results.length,
  processing_time: processingTime
})
```

### Search Suggestions

Add search suggestions by implementing an autocomplete endpoint:

```typescript
// app/api/search/suggestions/route.ts
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get('q')
  
  // Return popular search terms or blog titles that match
  const suggestions = await getSuggestions(query)
  
  return NextResponse.json({ suggestions })
}
```

### Filters

Extend the search to support filters:

```typescript
// Add to BlogSearchOptions
interface BlogSearchOptions {
  query: string
  limit?: number
  offset?: number
  author?: string
  dateRange?: { from: string; to: string }
  tags?: string[]
}
```

## Performance Tips

1. **Debouncing** - The component already includes 300ms debouncing
2. **Caching** - Consider adding client-side caching for repeated searches
3. **Pagination** - Implement pagination for large result sets
4. **Loading States** - The component includes loading indicators

## Troubleshooting

### Common Issues

1. **No results showing** - Check that your blog content is published and not in drafts
2. **Search too slow** - Consider implementing search provider with better performance
3. **TypeScript errors** - Ensure your search results match the `BlogSearchResult` interface

### Debugging

Enable debug logging:

```typescript
// Add to blog-search.ts
const DEBUG = process.env.NODE_ENV === 'development'

if (DEBUG) {
  console.log('Search query:', searchTerm)
  console.log('Search results:', searchResult.data)
}
```

## Migration Guide

When switching between search providers:

1. Update the search function in `blog-search.ts`
2. Test the new implementation
3. Update environment variables
4. Index content if required (Algolia/Typesense)
5. Update documentation for your team 
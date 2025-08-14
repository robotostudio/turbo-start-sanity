import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@sanity/client';
import { AlgoliaIndexingService } from '@/lib/algolia/indexing';

// Sanity client configuration
const sanityClient = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || '',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',
  apiVersion: '2024-01-01',
});

// Query to get all blog posts
const blogQuery = `
  *[_type == "blog" && (seoHideFromLists != true)] | order(publishedAt desc) {
    _id,
    _type,
    _updatedAt,
    title,
    description,
    "slug": slug.current,
    publishedAt,
    "authors": authors[]->{
      name,
      position
    },
    "image": {
      "asset": {
        "url": asset->url
      },
      "altText": altText
    },
    orderRank,
    richText
  }
`;

export async function POST(request: NextRequest) {
  try {
    // Check if Algolia is configured
    if (!process.env.ALGOLIA_ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Algolia admin API key not configured' },
        { status: 500 }
      );
    }


    // Fetch all blog posts from Sanity
    const blogPosts = await sanityClient.fetch(blogQuery);
    
    if (!blogPosts || blogPosts.length === 0) {
      return NextResponse.json(
        { message: 'No blog posts found to index', count: 0 },
        { status: 200 }
      );
    }

    // Clear existing index
    await AlgoliaIndexingService.clearIndex();

    // Index all blog posts
    await AlgoliaIndexingService.indexBlogPosts(blogPosts);

    return NextResponse.json({
      message: 'Blog indexing completed successfully',
      count: blogPosts.length,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Blog indexing failed:', error);
    
    return NextResponse.json(
      { 
        error: 'Blog indexing failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Check if Algolia is configured
    if (!process.env.ALGOLIA_ADMIN_API_KEY) {
      return NextResponse.json(
        { error: 'Algolia admin API key not configured' },
        { status: 500 }
      );
    }

    // Get index statistics
    const stats = await AlgoliaIndexingService.getIndexStats();
    
    return NextResponse.json({
      message: 'Index statistics retrieved successfully',
      stats,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Failed to get index statistics:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to get index statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

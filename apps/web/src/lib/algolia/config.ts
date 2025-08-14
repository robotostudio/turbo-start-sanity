"use client";

import { createMemoryCache } from '@algolia/client-common';
import algoliasearch  from 'algoliasearch';

// Algolia configuration
export const algoliaConfig = {
  appId: process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
  searchApiKey: process.env.NEXT_PUBLIC_ALGOLIA_SEARCH_API_KEY || '',
  adminApiKey: process.env.ALGOLIA_ADMIN_API_KEY || '',
  indexName: process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'blog_posts',
};

// Create memory cache for responses
export const responsesCache = createMemoryCache();

// Initialize Algolia client for search (client-side)
export const searchClient = algoliasearch(
  algoliaConfig.appId,
  algoliaConfig.searchApiKey,
  {
    responsesCache,
  }
);

// Initialize Algolia client for admin operations (server-side only)
export const adminClient: any = algoliaConfig.adminApiKey 
  ? algoliasearch(algoliaConfig.appId, algoliaConfig.adminApiKey)
  : null;

// Note: lite client doesn't have initIndex method
// We'll use the search method directly instead

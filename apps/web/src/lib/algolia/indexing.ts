import algoliasearch from 'algoliasearch';
import type { AlgoliaBlogPost } from './types';

// Create admin client for indexing operations
const adminClient = process.env.ALGOLIA_ADMIN_API_KEY 
  ? algoliasearch(
      process.env.NEXT_PUBLIC_ALGOLIA_APP_ID || '',
      process.env.ALGOLIA_ADMIN_API_KEY
    )
  : null;

export class AlgoliaIndexingService {
  /**
   * Index a single blog post
   */
  static async indexBlogPost(blogPost: any): Promise<void> {
    if (!adminClient) {
      throw new Error('Admin API key not configured');
    }

    try {
      const algoliaPost: AlgoliaBlogPost = {
        objectID: blogPost._id,
        _id: blogPost._id,
        _type: 'blog',
        title: blogPost.title || '',
        description: blogPost.description || '',
        slug: blogPost.slug || '',
        publishedAt: blogPost.publishedAt || '',
        authorName: blogPost.authors?.[0]?.name || '',
        authorPosition: blogPost.authors?.[0]?.position || '',
        imageUrl: blogPost.image?.asset?.url || '',
        imageAlt: blogPost.image?.altText || '',
        content: this.extractTextContent(blogPost.richText),
        _updatedAt: blogPost._updatedAt || new Date().toISOString(),
      };

      const index = adminClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'blog_posts');
      await index.saveObject(algoliaPost);
      console.log(`Indexed blog post: ${algoliaPost.title}`);
    } catch (error) {
      console.error(`Failed to index blog post ${blogPost._id}:`, error);
      throw error;
    }
  }

  /**
   * Index multiple blog posts
   */
  static async indexBlogPosts(blogPosts: any[]): Promise<void> {
    if (!adminClient) {
      throw new Error('Admin API key not configured');
    }

    try {
      const algoliaPosts: AlgoliaBlogPost[] = blogPosts.map(blogPost => ({
        objectID: blogPost._id,
        _id: blogPost._id,
        _type: 'blog',
        title: blogPost.title || '',
        description: blogPost.description || '',
        slug: blogPost.slug || '',
        publishedAt: blogPost.publishedAt || '',
        authorName: blogPost.authors?.[0]?.name || '',
        authorPosition: blogPost.authors?.[0]?.position || '',
        imageUrl: blogPost.image?.asset?.url || '',
        imageAlt: blogPost.image?.asset?.altText || '',
        content: this.extractTextContent(blogPost.richText),
        _updatedAt: blogPost._updatedAt || new Date().toISOString(),
      }));

      const index = adminClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'blog_posts');
      await index.saveObjects(algoliaPosts);
      console.log(`Indexed ${algoliaPosts.length} blog posts`);
    } catch (error) {
      console.error('Failed to index blog posts:', error);
      throw error;
    }
  }

  /**
   * Delete a blog post from index
   */
  static async deleteBlogPost(objectID: string): Promise<void> {
    if (!adminClient) {
      throw new Error('Admin API key not configured');
    }

    try {
      const index = adminClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'blog_posts');
      await index.deleteObject(objectID);
      console.log(`Deleted blog post from index: ${objectID}`);
    } catch (error) {
      console.error(`Failed to delete blog post ${objectID}:`, error);
      throw error;
    }
  }

  /**
   * Clear entire index
   */
  static async clearIndex(): Promise<void> {
    if (!adminClient) {
      throw new Error('Admin API key not configured');
    }

    try {
      const index = adminClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'blog_posts');
      await index.clearObjects();
      console.log('Cleared Algolia index');
    } catch (error) {
      console.error('Failed to clear index:', error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  static async getIndexStats(): Promise<any> {
    if (!adminClient) {
      throw new Error('Admin API key not configured');
    }

    try {
      const index = adminClient.initIndex(process.env.NEXT_PUBLIC_ALGOLIA_INDEX_NAME || 'blog_posts');
      const stats = await index.getSettings();
      return stats;
    } catch (error) {
      console.error('Failed to get index stats:', error);
      throw error;
    }
  }

  /**
   * Extract text content from rich text blocks
   */
  private static extractTextContent(richText: any[]): string {
    if (!richText || !Array.isArray(richText)) return '';

    return richText
      .map(block => {
        if (block._type === 'block' && block.children) {
          return block.children
            .map((child: any) => child.text || '')
            .join(' ');
        }
        return '';
      })
      .join(' ')
      .trim();
  }
}

import { useCallback, useEffect, useState } from "react";
import { useClient } from "sanity";

export interface Page {
  _id: string;
  title: string;
  slug: string | null;
}

export interface TreeNode {
  type: "page" | "folder";
  title: string;
  _id?: string;
  slug: string;
  children: Record<string, TreeNode>;
  hasChildren: boolean;
}

interface UsePagesTreeReturn {
  pages: Page[];
  tree: Record<string, TreeNode>;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

/**
 * Builds a hierarchical tree structure from a flat list of pages based on their slugs.
 * The tree represents the nested structure of pages and folders.
 *
 * @param pages - An array of Page objects, each containing _id, title, and slug.
 * @returns A record representing the root of the hierarchical tree.
 */
const buildTree = (pages: Page[]): Record<string, TreeNode> => {
  // Initialize the root of the tree structure.
  const tree: Record<string, TreeNode> = {};

  /**
   * Helper function to ensure that a given path (array of segments) exists in the tree.
   * It creates intermediate folder nodes if they don't already exist.
   *
   * @param segments - An array of slug segments (e.g., ['about', 'team']).
   * @param fullPath - The complete slug path (e.g., '/about/team').
   */
  const ensurePath = (segments: string[], fullPath: string) => {
    // Start at the root of the tree.
    let currentLevel = tree;
    // Keep track of the current path being built for slug generation.
    let currentPath = "";

    // Iterate through each segment of the path.
    segments.forEach((segment, index) => {
      // Construct the current full path up to this segment.
      currentPath += (currentPath === "" ? "" : "/") + segment;
      // Check if this is the last segment in the path.
      const isLast = index === segments.length - 1;

      // If the current segment (node) does not exist at the current level, create it.
      if (!currentLevel[segment]) {
        currentLevel[segment] = {
          // Initially set type to 'folder'. It will be updated to 'page' in the second pass if it's an actual page.
          type: "folder",
          // Generate a title for the folder/page. 'Home' for the root, otherwise title-case the segment.
          title:
            segment === ""
              ? "Home"
              : segment.charAt(0).toUpperCase() +
                segment.slice(1).replace(/-/g, " "),
          // Generate the slug for this node.
          slug: currentPath === "" ? "/" : `/${currentPath}`,
          // Initialize children as an empty object.
          children: {},
          // Assume no children initially, updated if sub-segments exist.
          hasChildren: false,
        };
      }

      // If this is not the last segment, it means it's an intermediate folder.
      if (!isLast) {
        // Mark this node as having children.
        currentLevel[segment].hasChildren = true;
        // Move down to the children of the current segment to continue building the path.
        currentLevel = currentLevel[segment].children;
      }
    });
  };

  // First pass: Iterate through all pages to establish the complete folder structure.
  // This ensures all parent folders exist before attempting to place pages.
  pages.forEach((page) => {
    // Use the page's slug, default to '/' for the root.
    const slug = page.slug || "/";
    // Split the slug into segments, filtering out empty strings (e.g., from leading/trailing slashes).
    // If slug is '/', treat it as a single empty segment to represent the root.
    const segments = slug === "/" ? [""] : slug.split("/").filter(Boolean);
    // Ensure the path for this page (and its parent folders) exists in the tree.
    ensurePath(segments, slug);
  });

  // Second pass: Iterate through all pages again to mark actual pages and populate their specific data.
  // This updates the 'folder' nodes created in the first pass to 'page' nodes where appropriate.
  pages.forEach((page) => {
    // Use the page's slug, default to '/' for the root.
    const slug = page.slug || "/";
    // Split the slug into segments, filtering out empty strings.
    const segments = slug === "/" ? [""] : slug.split("/").filter(Boolean);

    // Start at the root of the tree for this page.
    let currentLevel = tree;
    // Traverse the tree using the segments.
    segments.forEach((segment, index) => {
      // Check if this is the last segment, indicating the actual page node.
      const isLast = index === segments.length - 1;

      // If it's the last segment, update the node with page-specific details.
      if (isLast) {
        // This is the actual page, so update its type, title, _id, and slug.
        // We spread existing properties to retain `children` and `hasChildren` if they were set.
        currentLevel[segment] = {
          ...currentLevel[segment],
          type: "page",
          title: page.title || "Untitled", // Use page's title, default to 'Untitled'.
          _id: page._id,
          slug: slug,
        };
      } else {
        // If not the last segment, move down to the children to continue traversal.
        currentLevel = currentLevel[segment].children;
      }
    });
  });

  // Return the fully constructed hierarchical tree.
  return tree;
};

export const usePagesTree = (): UsePagesTreeReturn => {
  const client = useClient({ apiVersion: "2023-01-01" });
  const [pages, setPages] = useState<Page[]>([]);
  const [tree, setTree] = useState<Record<string, TreeNode>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const fetchedPages = await client.fetch<Page[]>(`
        *[_type == "page"]{
          _id,
          title,
          "slug": slug.current,
          "versions": sanity::versionOf(_id),
        } | order(slug asc)
      `);

      setPages(fetchedPages);
      const newTree = buildTree(fetchedPages);
      setTree(newTree);
    } catch (err) {
      console.error("Error fetching pages:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch pages");
    } finally {
      setLoading(false);
    }
  }, [client]);

  // Initial fetch
  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  return {
    pages,
    tree,
    loading,
    error,
    refetch: fetchPages,
  };
};

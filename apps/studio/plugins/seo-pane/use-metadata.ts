import useSWR from "swr";

export type SiteMetadata = {
  title: string;
  description: string;
  image: string | null;
  favicon: string | null;
  siteName: string | null;
  url: string;
};

type MetadataResponse =
  | { success: true; data: SiteMetadata }
  | { success: false; error: string; data: SiteMetadata };

export type MetadataState =
  | { status: "idle"; refetch: () => void; isRefetching: boolean }
  | { status: "loading"; refetch: () => void; isRefetching: boolean }
  | { status: "error"; error: string; fallback: SiteMetadata; refetch: () => void; isRefetching: boolean }
  | { status: "success"; data: SiteMetadata; refetch: () => void; isRefetching: boolean };

function isValidMetadataResponse(data: unknown): data is MetadataResponse {
  if (typeof data !== "object" || data === null) return false;
  const obj = data as Record<string, unknown>;
  if (typeof obj.success !== "boolean") return false;
  if (obj.success) {
    return typeof obj.data === "object" && obj.data !== null;
  }
  return typeof obj.error === "string" && typeof obj.data === "object" && obj.data !== null;
}

const fetcher = async (url: string): Promise<MetadataResponse> => {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("Invalid JSON response");
  }
  if (!isValidMetadataResponse(data)) {
    throw new Error("Invalid response shape");
  }
  return data;
};

export function useMetadata(url: string | null, apiBase: string): MetadataState {
  const apiUrl = url
    ? `${apiBase}/api/metadata?url=${encodeURIComponent(url)}`
    : null;

  const { data, error, isLoading, isValidating, mutate } = useSWR<MetadataResponse>(apiUrl, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    dedupingInterval: 60000,
    errorRetryCount: 2,
  });

  const refetch = () => {
    mutate();
  };

  const isRefetching = isValidating && !isLoading;

  if (!url) {
    return { status: "idle", refetch, isRefetching: false };
  }

  if (isLoading) {
    return { status: "loading", refetch, isRefetching: false };
  }

  if (error) {
    return {
      status: "error",
      error: error.message || "Failed to fetch metadata",
      fallback: {
        title: url,
        description: "",
        image: null,
        favicon: null,
        siteName: null,
        url,
      },
      refetch,
      isRefetching,
    };
  }

  if (data) {
    if (data.success) {
      return { status: "success", data: data.data, refetch, isRefetching };
    }
    return {
      status: "error",
      error: data.error,
      fallback: data.data,
      refetch,
      isRefetching,
    };
  }

  return { status: "idle", refetch, isRefetching: false };
}

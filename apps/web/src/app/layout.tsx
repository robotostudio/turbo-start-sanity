import "@workspace/ui/globals.css";

import {
  type DynamicFetchOptions,
  getDynamicFetchOptions,
  SanityLive,
} from "@workspace/sanity/live";
import { Geist, Geist_Mono } from "next/font/google";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { Suspense } from "react";
import { preconnect, prefetchDNS } from "react-dom";

import { revalidateSyncTags } from "@/app/actions/revalidate";
import { CachedFooter, DynamicFooter } from "@/components/footer";
import { CombinedJsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { PreviewBar } from "@/components/preview-bar";
import { Providers } from "@/components/providers";
import { ScrollToTop } from "@/components/scroll-to-top";
import { StickyFooter } from "@/components/sticky-footer";
import { getGithubStars } from "@/lib/github-stars";
import { getNavigationData } from "@/lib/navigation";

const fontSans = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
});

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preconnect("https://cdn.sanity.io");
  prefetchDNS("https://cdn.sanity.io");
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          <ScrollToTop />
          <div id="notch-slot" />
          <div id="notch-snap" />
          <div
            className="relative"
            id="page-shell"
            style={{ marginBottom: "var(--footer-height)" }}
          >
            {/* Session-gated, not environment-gated, so the deployed Studio can
                edit the nav; the published fallback keeps real content in the
                static shell. */}
            <Suspense fallback={<PublishedNavbar />}>
              <DynamicNavbar />
            </Suspense>
            <div className="relative z-10 min-h-dvh bg-background pt-16 lg:-mt-16">
              {children}
            </div>
          </div>
          <StickyFooter>
            <Suspense
              fallback={<CachedFooter perspective="published" stega={false} />}
            >
              <DynamicFooter />
            </Suspense>
          </StickyFooter>
          {/* Reads draftMode(), so it must stay behind Suspense — otherwise the
              whole layout opts out of prerendering for every visitor. */}
          <Suspense fallback={null}>
            <LivePreviewLayer />
          </Suspense>
          <Suspense fallback={null}>
            <CombinedJsonLd includeOrganization includeWebsite />
          </Suspense>
        </Providers>
      </body>
    </html>
  );
}

/**
 * Live updates plus the Presentation overlay. The overlay renders wherever a
 * validated draft-mode session exists — production included — which is what
 * lets the deployed Studio preview the live site.
 */
async function LivePreviewLayer() {
  const { isEnabled: isDraftMode } = await draftMode();
  return (
    <>
      <SanityLive action={revalidateSyncTags} includeDrafts={isDraftMode} />
      {isDraftMode && (
        <>
          <PreviewBar />
          <VisualEditing />
        </>
      )}
    </>
  );
}

async function DynamicNavbar() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedNavbar perspective={perspective} stega={stega} />;
}

/** Static shell for the nav. A Suspense fallback renders in the parent, so it
 * may only await cached data — `getGithubStars` memoizes at runtime, so the
 * count arrives with DynamicNavbar instead. */
async function PublishedNavbar() {
  const { navbarData, settingsData } = await getNavigationData({
    perspective: "published",
    stega: false,
  });
  return <Navbar navbarData={navbarData} settingsData={settingsData} />;
}

async function CachedNavbar({ perspective, stega }: DynamicFetchOptions) {
  const { navbarData, settingsData } = await getNavigationData({
    perspective,
    stega,
  });
  const stars = await getGithubStars(navbarData?.gitHubUrl);

  return (
    <Navbar navbarData={navbarData} settingsData={settingsData} stars={stars} />
  );
}

import "@workspace/ui/globals.css";

import {
  DRAFTS_WITHOUT_SESSION,
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
  // In local dev, nav/footer follow drafts too (like page content), so draft
  // navbar/footer/settings edits are visible without a Presentation session.
  // Production stays static published.
  const showDrafts = DRAFTS_WITHOUT_SESSION;
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          <ScrollToTop />
          <div style={{ marginBottom: "var(--footer-height)" }}>
            {showDrafts ? (
              <Suspense
                fallback={
                  <CachedNavbar perspective="published" stega={false} />
                }
              >
                <DynamicNavbar />
              </Suspense>
            ) : (
              <CachedNavbar perspective="published" stega={false} />
            )}
            <div className="-mt-16 relative z-10 min-h-dvh bg-background pt-16">
              {children}
            </div>
          </div>
          <StickyFooter>
            {showDrafts ? (
              <Suspense
                fallback={
                  <CachedFooter perspective="published" stega={false} />
                }
              >
                <DynamicFooter />
              </Suspense>
            ) : (
              <CachedFooter perspective="published" stega={false} />
            )}
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

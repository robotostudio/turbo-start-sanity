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

import {
  CachedFooter,
  DynamicFooter,
  FooterSkeleton,
} from "@/components/footer";
import { CombinedJsonLd } from "@/components/json-ld";
import { Navbar, NavbarSkeleton } from "@/components/navbar";
import { PreviewBar } from "@/components/preview-bar";
import { Providers } from "@/components/providers";
import { getNavigationData } from "@/lib/navigation";
import { sanityLiveAction } from "@/lib/sanity-live-action";

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
  const { isEnabled: isDraftMode } = await draftMode();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} font-sans antialiased`}
      >
        <Providers>
          {isDraftMode ? (
            <Suspense fallback={<NavbarSkeleton />}>
              <DynamicNavbar />
            </Suspense>
          ) : (
            <CachedNavbar perspective="published" stega={false} />
          )}
          {children}
          {isDraftMode ? (
            <Suspense fallback={<FooterSkeleton />}>
              <DynamicFooter />
            </Suspense>
          ) : (
            <CachedFooter perspective="published" stega={false} />
          )}
          <SanityLive action={sanityLiveAction} includeDrafts={isDraftMode} />
          <Suspense fallback={null}>
            <CombinedJsonLd includeOrganization includeWebsite />
          </Suspense>
          {isDraftMode && (
            <>
              <PreviewBar />
              <VisualEditing />
            </>
          )}
        </Providers>
      </body>
    </html>
  );
}

async function DynamicNavbar() {
  const { perspective, stega } = await getDynamicFetchOptions();
  return <CachedNavbar perspective={perspective} stega={stega} />;
}

async function CachedNavbar({ perspective, stega }: DynamicFetchOptions) {
  "use cache";
  const { navbarData, settingsData } = await getNavigationData({
    perspective,
    stega,
  });
  return <Navbar navbarData={navbarData} settingsData={settingsData} />;
}

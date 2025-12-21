import "@workspace/ui/globals.css";

import { cn } from "@workspace/ui/lib/utils";
import { draftMode } from "next/headers";
import { VisualEditing } from "next-sanity/visual-editing";
import { Suspense } from "react";
import { preconnect, prefetchDNS } from "react-dom";

import { FooterServer, FooterSkeleton } from "@/components/footer";
import { CombinedJsonLd } from "@/components/json-ld";
import { Navbar } from "@/components/navbar";
import { PreviewBar } from "@/components/preview-bar";
import { Providers } from "@/components/providers";
import {
  akzidenzGrotesk,
  baseTwelveSerif,
  baseTwelveSerifSmallCaps,
} from "@/fonts";
import { getNavigationData } from "@/lib/navigation";
import { SanityLive } from "@/lib/sanity/live";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  preconnect("https://cdn.sanity.io");
  prefetchDNS("https://cdn.sanity.io");
  const nav = await getNavigationData();
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={cn(
          baseTwelveSerif.variable,
          baseTwelveSerifSmallCaps.variable,
          akzidenzGrotesk.variable,
          "font-sans antialiased"
        )}
      >
        <Providers>
          {children}
          <Suspense
            fallback={
              <FooterSkeleton>
                <p>&copy; {new Date().getFullYear()}. All rights reserved.</p>
              </FooterSkeleton>
            }
          >
            <FooterServer />
          </Suspense>
          <SanityLive />
          <CombinedJsonLd includeOrganization includeWebsite />
          {(await draftMode()).isEnabled && (
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

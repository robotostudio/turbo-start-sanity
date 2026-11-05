"use client";

import "@workspace/ui/globals.css";

import { Providers } from "@/components/providers";
import { fontMono, fontSans } from "@/lib/fonts";

import ErrorPage from "./error";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${fontSans.variable} ${fontMono.variable} bg-background font-sans antialiased`}
      >
        <title>Something went wrong</title>
        <Providers>
          <ErrorPage retry={retry} />
        </Providers>
      </body>
    </html>
  );
}

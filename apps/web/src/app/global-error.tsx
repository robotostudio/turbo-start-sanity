"use client";

import "@workspace/ui/globals.css";

import ErrorPage from "./error";

export default function GlobalError({ retry }: { retry: () => void }) {
  return (
    <html lang="en">
      <body className="bg-background font-sans antialiased">
        <title>Something went wrong</title>
        <ErrorPage retry={retry} />
      </body>
    </html>
  );
}

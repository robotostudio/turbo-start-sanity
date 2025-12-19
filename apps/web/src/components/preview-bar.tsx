"use client";
import { Logger } from "@workspace/logger";
import { useRouter } from "next/navigation";
import type { FC } from "react";
import { useTransition } from "react";

import { disableDraftMode } from "@/app/actions";

const logger = new Logger("PreviewBar");

export const PreviewBar: FC = () => {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const disable = () => {
    logger.info("Disabling draft mode");
    startTransition(async () => {
      await disableDraftMode();
      router.refresh();
    });
  };

  return (
    <div className="fixed right-0 bottom-1 left-0 z-10 px-2 md:bottom-2 md:px-4">
      <div className="mx-auto max-w-96 rounded-md border border-zinc-200 bg-zinc-100/80 p-2 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="flex items-center justify-between gap-2 p-2">
          <p className="mb-0 pb-0 text-base text-zinc-700 dark:text-zinc-300">
            Viewing the website in preview mode.
          </p>
          {pending ? (
            <span className="text-base text-zinc-500 dark:text-zinc-400">
              Disabling draft mode...
            </span>
          ) : (
            <button
              className="text-base text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
              onClick={disable}
              type="button"
            >
              Exit
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

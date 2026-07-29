"use client";

import { useEffect, useRef } from "react";

export const DISCLOSURE_ANIMATION_MS = 200;

const DISCLOSURE_TIMING: KeyframeAnimationOptions = {
  duration: DISCLOSURE_ANIMATION_MS,
  easing: "cubic-bezier(0.4, 0, 0.2, 1)",
};

/**
 * Animates a `<details>` element open/closed from a controlled `open` flag.
 *
 * Closed `<details>` content isn't rendered, so CSS transitions have no start
 * state on Safari/iOS. Instead the Web Animations API toggles `details.open`
 * first (open) or last (close) and animates a content wrapper's height, so it
 * works in every engine. Interrupted animations restart from the currently
 * rendered height rather than a stale endpoint.
 *
 * Attach `detailsRef` to the `<details>` and `contentRef` to an
 * `overflow-hidden` wrapper around the collapsible content. Render the
 * `<details>` with a fixed initial `open` attribute and drive later toggles
 * exclusively through the `open` argument (e.g. from a summary click handler
 * that calls `preventDefault`).
 */
export function useDisclosureAnimation(open: boolean) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<Animation | null>(null);
  const previousOpenRef = useRef(open);

  useEffect(() => {
    if (previousOpenRef.current === open) {
      return;
    }
    previousOpenRef.current = open;

    const details = detailsRef.current;
    const content = contentRef.current;
    if (!details) {
      return;
    }

    if (
      !content ||
      typeof content.animate !== "function" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      animationRef.current?.cancel();
      animationRef.current = null;
      details.open = open;
      return;
    }

    // Read the rendered start state before cancelling: a cancel snaps the
    // wrapper back to its natural size, losing the mid-animation height.
    // Height-only (no opacity fade): translucent content would let container
    // backgrounds (e.g. the TOC's dot grid) bleed through mid-animation.
    const startHeight = details.open ? content.offsetHeight : 0;
    animationRef.current?.cancel();

    if (open) {
      details.open = true;
      const targetHeight = content.offsetHeight;
      const animation = content.animate(
        [{ height: `${startHeight}px` }, { height: `${targetHeight}px` }],
        DISCLOSURE_TIMING
      );
      animation.onfinish = () => {
        animationRef.current = null;
      };
      animationRef.current = animation;
    } else {
      const animation = content.animate(
        [{ height: `${startHeight}px` }, { height: "0px" }],
        DISCLOSURE_TIMING
      );
      // Keep `details.open` true while collapsing so the content stays
      // rendered; a cancel (reopen) skips onfinish and leaves it open.
      animation.onfinish = () => {
        details.open = false;
        animationRef.current = null;
      };
      animationRef.current = animation;
    }
  }, [open]);

  useEffect(
    () => () => {
      animationRef.current?.cancel();
    },
    []
  );

  return { detailsRef, contentRef };
}

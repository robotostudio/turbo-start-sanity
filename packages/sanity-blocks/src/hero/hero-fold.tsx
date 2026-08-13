"use client";

import {
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { useTheme } from "next-themes";
import { useEffect, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

import type { HeroVideoData, HeroVideoVariant } from "./hero-video";

/** Height of the scroll room above the navbar, and so the furthest a pull
 * can open it. */
const FOLD = 140;
/** Matches the banner's own poster request, so the fold reuses that cache. */
const POSTER_WIDTH = 1440;
/**
 * The return ease, per 60Hz-frame of real time. Exponential like the
 * platform's rubber-band release: ~70ms half-life, at rest inside half a
 * second.
 */
const RETURN_DECAY = 0.85;
/**
 * Linear px-per-frame folded into the return. A pure exponential is
 * asymptotic — the last ~40px crawl for another half second — and this term
 * makes the tail actually land while being invisible at full stretch.
 */
const RETURN_STEP = 2;
/** The reference frame the two return rates are tuned against. */
const FRAME_MS = 16.7;
/** Scroll silence before the strip eases home. Scroll events tick every
 * frame while anything is moving, so a few frames of quiet is already the
 * gesture ending — any longer reads as the fold holding. */
const IDLE_MS = 60;
/** A pause this long between wheel events is a new gesture, not momentum. */
const GESTURE_GAP_MS = 150;

// Layout effect in the browser (adjust scroll before paint), plain effect on
// the server to avoid React's SSR "useLayoutEffect does nothing" warning.
const useIsomorphicLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect;

const posterOf = (variant?: HeroVideoVariant | null): SanityImageData | null =>
  variant?.poster?.id ? variant.poster : null;

/**
 * The banner flipped top-to-bottom, revealed by scrolling up past the navbar.
 *
 * Real scroll room rather than an overscroll takeover: the strip is ordinary
 * content above the page shell and the page rests one fold below the true
 * top, so pulling above the navbar is just scrolling. Nothing intercepts
 * wheel or touch — momentum and feel are the platform's own, and past the
 * strip's top the browser's native rubber-band takes over as usual. The only
 * scripted piece is the return: once the page falls still inside the strip,
 * it eases back to rest.
 */
export function HeroFold({
  video,
}: Readonly<{ video?: HeroVideoData | null }>) {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    // Static content, but reached through motion — reduced-motion keeps the
    // plain top of page (rendering the strip hidden would still add scroll
    // room, so it must not mount at all).
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setMounted(true);
    }
  }, []);

  // Same variant the banner is showing, or the light one over a dark hero
  // reads as a white wash instead of a fold of it. Blurred still rather than
  // the video: a poster is rasterised once, where a decoding video re-blurs
  // every frame.
  const poster =
    (resolvedTheme === "dark" ? posterOf(video?.dark) : null) ??
    posterOf(video?.light) ??
    posterOf(video?.dark);
  const slot = mounted ? document.getElementById("fold-slot") : null;
  const active = Boolean(slot && poster);

  useIsomorphicLayoutEffect(() => {
    if (!active) {
      return;
    }
    const root = document.documentElement;
    root.style.setProperty("--fold-height", `${FOLD}px`);
    // Scroll anchoring reacts to the strip's insertion (and to the return
    // ease moving content above the viewport) by shifting the scroll on its
    // own, stacking on top of the browser's restoration and the compensation
    // below in racy orders. With it off, every ordering converges.
    root.style.overflowAnchor = "none";

    // Ease back to rest once the page has actually stopped moving inside the
    // strip — a beat of scroll silence — NOT on `scrollend`, which macOS
    // withholds until the whole momentum tail dies and holds the fold open
    // for seconds. Starting only on a still page also means the ease never
    // fights a live scroll.
    let frame = 0;
    let lastAt = 0;
    let idle = 0;
    let held = false;
    const cancel = () => {
      cancelAnimationFrame(frame);
      frame = 0;
    };
    const step = (now: number) => {
      frame = 0;
      const dt = Math.min((now - lastAt) / FRAME_MS, 4);
      lastAt = now;
      const open = FOLD - window.scrollY;
      const next = open * RETURN_DECAY ** dt - RETURN_STEP * dt;
      if (next <= 0.5) {
        window.scrollTo(0, FOLD);
        return;
      }
      window.scrollTo(0, FOLD - next);
      frame = requestAnimationFrame(step);
    };
    const ease = () => {
      if (window.scrollY >= FOLD || frame || held) {
        return;
      }
      lastAt = performance.now();
      frame = requestAnimationFrame(step);
    };
    const arm = () => {
      clearTimeout(idle);
      if (window.scrollY < FOLD) {
        idle = window.setTimeout(ease, IDLE_MS);
      }
    };
    let lastY = FOLD;
    const onScroll = () => {
      // Scrolls the ease itself produces must not re-arm the watchdog.
      if (frame || held) {
        return;
      }
      const y = window.scrollY;
      const opening = y < lastY;
      lastY = y;
      // Take over the moment the pull stops deepening, and the instant it
      // bottoms out on a full reveal. Only a finger can open the fold
      // further, so either point is the release — sitting through the
      // momentum tail from there is what held it open for a beat. Fully open
      // has to be its own case: position stops changing there, so no further
      // scroll event would arrive to notice the apex.
      if (opening && y > 0) {
        arm();
        return;
      }
      clearTimeout(idle);
      ease();
    };
    // Only growing deltas are fingers. The momentum tail decays, and
    // cancelling on it would hold the fold open for as long as it ticks; a
    // grown delta at the top edge may scroll nothing (no scroll event), so
    // it re-arms the watchdog itself.
    let lastMag = 0;
    let lastWheelAt = 0;
    const onWheel = (event: WheelEvent) => {
      const now = performance.now();
      if (now - lastWheelAt > GESTURE_GAP_MS) {
        lastMag = 0;
      }
      lastWheelAt = now;
      const mag = Math.abs(event.deltaY);
      if (mag > lastMag) {
        cancel();
        arm();
      }
      lastMag = mag;
    };
    const onTouchStart = () => {
      held = true;
      cancel();
      clearTimeout(idle);
    };
    const onTouchEnd = () => {
      held = false;
      arm();
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });

    // Compensate the insertion so nothing visibly moves — anchored to where
    // the shell actually sits, never a blind +FOLD: on reload the browser
    // restores a scroll saved against a document that already had the strip,
    // and stacking FOLD on top of that restore landed a fold too deep. If
    // the page still rests short of the fold after this (a restore into the
    // open strip, a scroll-to-top that beat the mount), the watchdog eases
    // it home instead of parking open.
    const shell = document.getElementById("page-shell");
    const shellTop = shell ? shell.getBoundingClientRect().top : FOLD;
    window.scrollBy(0, Math.max(0, Math.min(FOLD, shellTop)));
    arm();

    return () => {
      cancel();
      clearTimeout(idle);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
      root.style.removeProperty("--fold-height");
      root.style.overflowAnchor = "";
      if (window.scrollY >= FOLD) {
        window.scrollBy(0, -FOLD);
      }
    };
  }, [active]);

  if (!(slot && poster)) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden="true"
      // z-10 like the page's own box: the pinned footer is a later `z-0`
      // sibling and would otherwise paint over the strip while it is open.
      className="relative z-10 overflow-hidden bg-background"
      style={{ height: FOLD }}
    >
      {/* Sized to the banner's own box and anchored to the strip's bottom:
          `object-cover` crops by box height, so any other box takes a
          different slice and the mirror stops lining up — at the banner's
          height the strip's bottom row is the banner's top row. */}
      <SanityImage
        alt=""
        className="absolute inset-x-0 bottom-0 h-[calc(100svh-var(--hero-copy))] w-full rounded-none! object-cover object-[50%_45%] blur-[26px]"
        image={poster}
        loading="lazy"
        style={{ transform: "scaleY(-1)" }}
        width={POSTER_WIDTH}
      />
      {/* Fades at the top only. The bottom is left clear so the clip runs
          straight into the navbar's own blur rather than meeting a dark band
          at the seam. */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/35 via-40% to-transparent" />
    </div>,
    slot
  );
}

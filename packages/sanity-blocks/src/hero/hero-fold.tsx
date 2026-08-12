"use client";

import {
  SanityImage,
  type SanityImageData,
} from "@workspace/sanity-blocks/internal/sanity-image";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import type { HeroVideoData, HeroVideoVariant } from "./hero-video";

const FOLD = 260;
const POSTER_WIDTH = 1440;
const CLAIM_AFTER = 8;

const RUBBER_C = 0.55;
const PULL_SCALE = 1;

const SETTLE_MS = 250;
const SETTLE_EASE = "cubic-bezier(0.19, 1, 0.22, 1)";
const RELEASE_DECAY = 0.85;

const WHEEL_DECAY = 0.5;
const WHEEL_EASE = 0.45;
const FRAME_MS = 16.7;

const COAST_AFTER = 4;
const GESTURE_GAP_MS = 100;

const pullDimension = () => window.innerHeight * PULL_SCALE;
const resist = (travel: number, dimension: number) =>
  (1 - 1 / ((travel * RUBBER_C) / dimension + 1)) * dimension;
const travelFor = (pull: number, dimension: number) => {
  const capped = Math.min(pull, dimension - 0.01);
  return (dimension / RUBBER_C) * (capped / (dimension - capped));
};

const posterOf = (variant?: HeroVideoVariant | null): SanityImageData | null =>
  variant?.poster?.id ? variant.poster : null;

export function HeroFold({
  video,
}: Readonly<{ video?: HeroVideoData | null }>) {
  const [mounted, setMounted] = useState(false);
  const foldRef = useRef<HTMLDivElement>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => setMounted(true), []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: gates on the portal
  useEffect(() => {
    const fold = foldRef.current;
    const shell = document.getElementById("page-shell");
    if (!(fold && shell)) {
      return;
    }

    let pull = 0;
    let startY: number | null = null;
    let claimed = false;
    let wheelTravel = 0;
    let wheelFrame = 0;

    let live = false;
    let footer: HTMLElement | null = null;
    const captureFooter = () => {
      footer = document.querySelector<HTMLElement>(".footer-pinned");
    };
    const setLive = (on: boolean) => {
      if (live === on) {
        return;
      }
      live = on;
      shell.style.willChange = on ? "transform" : "";
      fold.style.willChange = on ? "transform" : "";
      shell.style.overflowAnchor = on ? "none" : "";
      if (footer) {
        footer.style.visibility = on ? "hidden" : "";
      }
    };

    const paint = () => {
      setLive(pull > 0);
      shell.style.transform = pull ? `translate3d(0,${pull}px,0)` : "";
      fold.style.transform = `translate3d(0,${pull - FOLD}px,0)`;
    };
    const settle = () => {
      startY = null;
      claimed = false;
      if (!pull) {
        return;
      }
      const easing = `transform ${SETTLE_MS}ms ${SETTLE_EASE}`;
      shell.style.transition = easing;
      fold.style.transition = easing;
      pull = 0;
      shell.style.transform = "translate3d(0,0,0)";
      fold.style.transform = `translate3d(0,${-FOLD}px,0)`;
    };

    const takeOver = () => {
      if (!shell.style.transition) {
        return;
      }
      pull = new DOMMatrixReadOnly(getComputedStyle(shell).transform).m42;
      shell.style.transition = "";
      fold.style.transition = "";
      paint();
    };

    const onSettled = (event: TransitionEvent) => {
      if (event.propertyName !== "transform" || pull) {
        return;
      }
      shell.style.transition = "";
      fold.style.transition = "";
      shell.style.transform = "";
      setLive(false);
    };

    const onTouchStart = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (!touch || window.scrollY > 0) {
        startY = null;
        return;
      }
      cancelAnimationFrame(wheelFrame);
      wheelFrame = 0;
      wheelTravel = 0;
      captureFooter();
      claimed = pull > 0;
      takeOver();
      startY = touch.clientY - travelFor(pull, pullDimension());
    };

    const onTouchMove = (event: TouchEvent) => {
      const touch = event.touches[0];
      if (startY === null || !touch || window.scrollY > 0) {
        return;
      }
      const travel = touch.clientY - startY;
      if (travel <= 0) {
        if (!claimed) {
          startY = null;
          return;
        }
        event.preventDefault();
        if (pull) {
          pull = 0;
          paint();
        }
        window.scrollTo(0, -travel);
        return;
      }
      if (!(claimed || travel > CLAIM_AFTER)) {
        return;
      }
      claimed = true;
      event.preventDefault();
      pull = Math.min(resist(travel, pullDimension()), FOLD);
      paint();
    };

    let wheelAt = 0;
    const wheelStep = (now: number) => {
      wheelFrame = 0;
      const dt = Math.min((now - wheelAt) / FRAME_MS, 4);
      wheelAt = now;
      wheelTravel *= WHEEL_DECAY ** dt;
      const target =
        wheelTravel < 1
          ? 0
          : Math.min(resist(wheelTravel, pullDimension()), FOLD);
      if (target < pull) {
        pull *= RELEASE_DECAY ** dt;
        if (pull < 0.5) {
          wheelTravel = 0;
          pull = 0;
          paint();
          return;
        }
      } else {
        pull += (target - pull) * (1 - (1 - WHEEL_EASE) ** dt);
      }
      paint();
      wheelFrame = requestAnimationFrame(wheelStep);
    };
    let lastMag = 0;
    let lastEventAt = 0;
    let slowing = 0;
    let coasting = false;
    const fingersOn = (mag: number, now: number) => {
      if (now - lastEventAt > GESTURE_GAP_MS) {
        slowing = 0;
        coasting = false;
        lastMag = 0;
      }
      lastEventAt = now;
      if (coasting ? mag > lastMag * 2.5 : mag > lastMag) {
        slowing = 0;
        coasting = false;
      } else if (mag < lastMag && !coasting && ++slowing >= COAST_AFTER) {
        coasting = true;
        wheelTravel = 0;
      }
      lastMag = mag;
      return !coasting;
    };
    const onWheel = (event: WheelEvent) => {
      if (window.scrollY > 0 || event.deltaY >= 0) {
        return;
      }
      event.preventDefault();
      if (!wheelFrame) {
        captureFooter();
      }
      takeOver();
      if (fingersOn(-event.deltaY, performance.now())) {
        wheelTravel += -event.deltaY;
      }
      if (!wheelFrame) {
        wheelAt = performance.now();
        wheelFrame = requestAnimationFrame(wheelStep);
      }
    };

    shell.addEventListener("transitionend", onSettled);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", settle, { passive: true });
    window.addEventListener("touchcancel", settle, { passive: true });
    return () => {
      cancelAnimationFrame(wheelFrame);
      window.removeEventListener("wheel", onWheel);
      shell.removeEventListener("transitionend", onSettled);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", settle);
      window.removeEventListener("touchcancel", settle);
      shell.style.transform = "";
      shell.style.transition = "";
      setLive(false);
    };
  }, [mounted]);

  const poster =
    (resolvedTheme === "dark" ? posterOf(video?.dark) : null) ??
    posterOf(video?.light) ??
    posterOf(video?.dark);
  if (!(mounted && poster)) {
    return null;
  }

  return createPortal(
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-0 h-[260px] overflow-hidden bg-background motion-reduce:hidden"
      ref={foldRef}
      style={{ transform: `translate3d(0,${-FOLD}px,0)` }}
    >
      <SanityImage
        alt=""
        className="absolute inset-x-0 bottom-0 h-[calc(100svh-var(--hero-copy))] w-full rounded-none! object-cover object-[50%_45%] blur-[26px]"
        image={poster}
        loading="lazy"
        style={{ transform: "scaleY(-1)" }}
        width={POSTER_WIDTH}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background/35 via-40% to-transparent" />
    </div>,
    document.body
  );
}

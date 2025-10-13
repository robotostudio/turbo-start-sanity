import * as React from "react";

type MediaQueryResult = {
  matches: boolean;
  addEventListener: (
    type: string,
    listener: (event: MediaQueryListEvent) => void
  ) => void;
  removeEventListener: (
    type: string,
    listener: (event: MediaQueryListEvent) => void
  ) => void;
  addListener?: (listener: (event: MediaQueryListEvent) => void) => void;
  removeListener?: (listener: (event: MediaQueryListEvent) => void) => void;
};

export function useIsMobile(mobileScreenSize = 768) {
  const [isMobile, setIsMobile] = React.useState(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }
    return window.matchMedia(`(max-width: ${mobileScreenSize}px)`).matches;
  });

  const checkIsMobile = React.useCallback((event: MediaQueryListEvent) => {
    setIsMobile(event.matches);
  }, []);

  React.useEffect(() => {
    if (
      typeof window === "undefined" ||
      typeof window.matchMedia !== "function"
    ) {
      return;
    }

    const mediaListener: MediaQueryResult = window.matchMedia(
      `(max-width: ${mobileScreenSize}px)`
    );

    const attachListener = () => {
      if (mediaListener.addEventListener) {
        mediaListener.addEventListener("change", checkIsMobile);
      } else if (mediaListener.addListener) {
        mediaListener.addListener(checkIsMobile);
      }
    };

    const removeListener = () => {
      if (mediaListener.removeEventListener) {
        mediaListener.removeEventListener("change", checkIsMobile);
      } else if (mediaListener.removeListener) {
        mediaListener.removeListener(checkIsMobile);
      }
    };

    attachListener();
    return removeListener;
  }, [mobileScreenSize, checkIsMobile]);

  return isMobile;
}

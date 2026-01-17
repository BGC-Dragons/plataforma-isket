import { useEffect } from "react";

export function useViewportHeight() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const setAppHeight = () => {
      const viewportHeight =
        window.visualViewport?.height ?? window.innerHeight;
      document.documentElement.style.setProperty(
        "--app-height",
        `${viewportHeight}px`
      );
    };

    setAppHeight();

    window.addEventListener("resize", setAppHeight);
    window.visualViewport?.addEventListener("resize", setAppHeight);
    window.visualViewport?.addEventListener("scroll", setAppHeight);

    return () => {
      window.removeEventListener("resize", setAppHeight);
      window.visualViewport?.removeEventListener("resize", setAppHeight);
      window.visualViewport?.removeEventListener("scroll", setAppHeight);
    };
  }, []);
}

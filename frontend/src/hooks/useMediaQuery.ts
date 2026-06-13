import { useEffect, useState } from "react";

export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();

    const observer = new ResizeObserver(checkMobile);
    observer.observe(document.body);

    return () => {
      observer.disconnect();
    };
  }, []);

  return isMobile;
}

export function useIsTablet(): boolean {
  const [isTablet, setIsTablet] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const checkTablet = () => {
      const w = window.innerWidth;
      setIsTablet(w >= 768 && w < 1024);
    };

    checkTablet();

    const observer = new ResizeObserver(checkTablet);
    observer.observe(document.body);

    return () => {
      observer.disconnect();
    };
  }, []);

  return isTablet;
}

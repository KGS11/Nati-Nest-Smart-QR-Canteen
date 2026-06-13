import { useEffect, useState } from "react";

export function useBottomSafeArea(): string {
  const [safeArea, setSafeArea] = useState("0px");

  useEffect(() => {
    if (typeof window === "undefined") return;

    const div = document.createElement("div");
    div.style.position = "fixed";
    div.style.bottom = "0";
    div.style.height = "env(safe-area-inset-bottom, 0px)";
    div.style.visibility = "hidden";
    div.style.pointerEvents = "none";
    document.body.appendChild(div);

    const update = () => {
      const height = div.offsetHeight;
      setSafeArea(height ? `${height}px` : "0px");
    };

    update();
    window.addEventListener("resize", update);

    return () => {
      if (document.body.contains(div)) {
        document.body.removeChild(div);
      }
      window.removeEventListener("resize", update);
    };
  }, []);

  return safeArea;
}

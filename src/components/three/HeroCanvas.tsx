"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";

const BlueprintScene = dynamic(() => import("./BlueprintScene"), {
  ssr: false,
  loading: () => null,
});

function getInitialReducedMotion() {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getInitialVisible() {
  if (typeof document === "undefined") return true;
  return !document.hidden;
}

/**
 * Renders the 3D hero background client-side only (via dynamic ssr:false),
 * and keeps it paused whenever reduced motion is requested or the tab isn't
 * visible, so it never burns GPU/battery in the background.
 */
export default function HeroCanvas() {
  const [reducedMotion, setReducedMotion] = useState(getInitialReducedMotion);
  const [visible, setVisible] = useState(getInitialVisible);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMediaChange = () => setReducedMotion(media.matches);
    media.addEventListener("change", onMediaChange);

    const onVisibilityChange = () => setVisible(!document.hidden);
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      media.removeEventListener("change", onMediaChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  return (
    <div className="absolute inset-0 -z-10" aria-hidden="true">
      <BlueprintScene reducedMotion={reducedMotion || !visible} />
    </div>
  );
}

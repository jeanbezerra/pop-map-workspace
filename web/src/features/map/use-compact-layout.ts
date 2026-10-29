"use client";

import { useSyncExternalStore } from "react";

const compactLayoutQuery = "(max-width: 1099px)";

function subscribe(listener: () => void) {
  const media = window.matchMedia(compactLayoutQuery);
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}

export function useCompactLayout() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(compactLayoutQuery).matches, () => false);
}

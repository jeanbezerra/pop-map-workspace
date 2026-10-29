"use client";

import { useMemo, useSyncExternalStore } from "react";
import type { SearchHistoryItem } from "./model";

const storageKey = "pop-map:demo-sessions:v1";
const changeEvent = "pop-map:demo-sessions-updated";

function getSnapshot() {
  try { return localStorage.getItem(storageKey) ?? "[]"; } catch { return "[]"; }
}

function subscribe(listener: () => void) {
  window.addEventListener("storage", listener);
  window.addEventListener(changeEvent, listener);
  return () => { window.removeEventListener("storage", listener); window.removeEventListener(changeEvent, listener); };
}

export function parseHistory(raw: string): SearchHistoryItem[] {
  try {
    const value: unknown = JSON.parse(raw);
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is SearchHistoryItem => {
      if (!item || typeof item !== "object" || typeof item.id !== "string" || !item.id.trim()
        || typeof item.url !== "string" || typeof item.createdAt !== "string"
        || !["completed", "partial", "cancelled"].includes(item.outcome)) return false;
      try {
        const parsed = new URL(item.url);
        return ["http:", "https:"].includes(parsed.protocol) && !parsed.username && !parsed.password
          && item.url.length <= 2048 && new Date(item.createdAt).toISOString() === item.createdAt;
      } catch { return false; }
    }).slice(0, 20);
  } catch { return []; }
}

export function saveDemoSession(item: SearchHistoryItem) {
  try {
    const entries = parseHistory(getSnapshot()).filter((entry) => entry.id !== item.id);
    localStorage.setItem(storageKey, JSON.stringify([item, ...entries].slice(0, 20)));
    window.dispatchEvent(new Event(changeEvent));
    return true;
  } catch { return false; }
}

export function useDemoHistory() {
  const raw = useSyncExternalStore(subscribe, getSnapshot, () => "[]");
  return useMemo(() => parseHistory(raw), [raw]);
}

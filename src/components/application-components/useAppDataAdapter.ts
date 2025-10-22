"use client";

import React from "react";
import {useApplicationStore} from "@/stores/useApplicationStore";


function setByPath<T extends Record<string, any>>(obj: T, path: string[], value: any): T {
  if (!path.length) return obj;
  const out: any = Array.isArray(obj) ? [...obj] : {...obj};
  let cur: any = out;
  for (let i = 0; i < path.length - 1; i++) {
    const k = path[i];
    const next = cur[k];
    cur[k] = typeof next === "object" && next !== null ? (Array.isArray(next) ? [...next] : {...next}) : {};
    cur = cur[k];
  }
  cur[path[path.length - 1]] = value;
  return out;
}

export default function useAppDataAdapter() {
  // Use only types from the store via ReturnType
  type StoreState = ReturnType<typeof useApplicationStore>;
  const store = useApplicationStore() as StoreState;

  // Try to discover the application slice heuristically (common keys)
  const appData =
    (store as any).application ??
    (store as any).data ??
    (store as any).app ??
    {};

  const [data, setData] = React.useState<any>(appData);

  const save = (path: string[], value: string) => {
    setData((prev: any) => setByPath(prev, path, value));

    // If your store exposes an updater, call it safely.
    try {
      if (typeof (store as any).updateField === "function") {
        (store as any).updateField(path, value);
      } else if (typeof (store as any).setApplication === "function") {
        (store as any).setApplication((prev: any) => setByPath(prev, path, value));
      } else if (typeof (store as any).set === "function") {
        (store as any).set((s: any) => {
          const base =
            s.application ?? s.data ?? s.app ?? {};
          return { ...(s || {}), application: setByPath(base, path, value) };
        });
      }
    } catch {
      // no-op; local state already updated
    }
  };

  return {data, save};
}

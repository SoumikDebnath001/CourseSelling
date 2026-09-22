"use client";

import { useSyncExternalStore } from "react";

/**
 * One-shot "the initial page load has finished" signal, flipped by <AppLoader />
 * when the full-screen loader starts fading out. Entrance animations wait for it
 * so they play in front of the user instead of behind the loader. After the
 * first load it stays true, so client-side navigations animate immediately.
 */
let loaded = false;
const listeners = new Set<() => void>();

export function markAppLoaded() {
  if (loaded) return;
  loaded = true;
  listeners.forEach((cb) => cb());
  listeners.clear();
}

/** Run `cb` once the app has loaded (immediately if it already has). Returns an unsubscribe. */
export function whenAppLoaded(cb: () => void): () => void {
  if (loaded) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

const subscribe = (cb: () => void) => whenAppLoaded(cb);

/** React hook form of the signal. */
export function useAppLoaded() {
  return useSyncExternalStore(
    subscribe,
    () => loaded,
    () => false
  );
}

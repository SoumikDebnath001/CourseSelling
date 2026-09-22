"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Tracks whether an element is (near) the viewport.
 *
 * - `inView`: currently intersecting (use it to pause work while off-screen).
 * - `seen`: has intersected at least once (use it to lazy-mount heavy content).
 */
export function useInView<T extends Element>(rootMargin = "0px") {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  const [seen, setSeen] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      setSeen(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setSeen(true);
      },
      { rootMargin }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);

  return { ref, inView, seen };
}

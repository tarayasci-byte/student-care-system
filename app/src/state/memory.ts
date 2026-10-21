import { useCallback, useState } from 'react';

// In-memory drafts (half-filled forms, filters) that survive navigating between screens
// but are never written to storage. Cleared on logout.
const mem = new Map<string, unknown>();

export function useMemoryState<T>(key: string, init: T | (() => T)): [T, (u: T | ((prev: T) => T)) => void] {
  const [v, setV] = useState<T>(() => (mem.has(key) ? (mem.get(key) as T) : typeof init === 'function' ? (init as () => T)() : init));
  const set = useCallback((u: T | ((prev: T) => T)) => {
    setV((prev) => {
      const next = typeof u === 'function' ? (u as (p: T) => T)(prev) : u;
      mem.set(key, next);
      return next;
    });
  }, [key]);
  return [v, set];
}

export function clearMemoryState() {
  mem.clear();
}

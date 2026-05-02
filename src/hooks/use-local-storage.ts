'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Safely checks if localStorage is actually functional.
 * 
 * Node.js v22+ exposes `localStorage` as a global via the experimental
 * Web Storage API (--experimental-webstorage), but its methods like
 * `getItem` are NOT proper functions in that environment — they are
 * missing or bound to an incomplete implementation.
 * 
 * Checking `typeof window !== 'undefined'` is NOT sufficient because
 * Next.js 15 with Turbopack can leak server-side globals.
 * 
 * This function performs a live capability check.
 */
function isLocalStorageAvailable(): boolean {
  try {
    if (typeof localStorage === 'undefined') return false;
    if (typeof localStorage.getItem !== 'function') return false;
    // Perform a real read/write test
    const testKey = '__ls_test__';
    localStorage.setItem(testKey, '1');
    localStorage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

/**
 * A safe, SSR-compatible hook for reading and writing to localStorage.
 * Falls back to in-memory state when localStorage is unavailable
 * (e.g., during SSR, in Node.js v22+ with broken WebStorage globals,
 * or in private browsing with storage disabled).
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isHydrated, setIsHydrated] = useState(false);

  // On mount (client only), read the real value from localStorage
  useEffect(() => {
    setIsHydrated(true);
    if (!isLocalStorageAvailable()) return;
    try {
      const item = localStorage.getItem(key);
      if (item !== null) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Failed to read key "${key}":`, error);
    }
  }, [key]);

  // Persist value to localStorage whenever it changes (after hydration)
  useEffect(() => {
    if (!isHydrated) return;
    if (!isLocalStorageAvailable()) return;
    try {
      if (storedValue === undefined || storedValue === null) {
        localStorage.removeItem(key);
      } else {
        localStorage.setItem(key, JSON.stringify(storedValue));
      }
    } catch (error) {
      console.warn(`[useLocalStorage] Failed to write key "${key}":`, error);
    }
  }, [key, storedValue, isHydrated]);

  const setValue = useCallback((value: T | ((prev: T) => T)) => {
    setStoredValue((prev) => {
      const next = typeof value === 'function' ? (value as (prev: T) => T)(prev) : value;
      return next;
    });
  }, []);

  const removeValue = useCallback(() => {
    setStoredValue(initialValue);
    if (isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`[useLocalStorage] Failed to remove key "${key}":`, error);
      }
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue] as const;
}

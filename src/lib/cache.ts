/**
 * AASTU Focus Football Cup - Client-Side Cache & SWR (Stale-While-Revalidate) Engine
 * Provides instant frame-0 navigation, automatic background revalidation,
 * and zero-flash caching across all pages and components.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  staleAt: number;
  expiresAt: number;
}

// In-memory cache storage (persists across Next.js client-side route transitions)
const memoryCache = new Map<string, CacheEntry<any>>();

// Active in-flight requests to deduplicate concurrent requests for the exact same key
const inFlightRequests = new Map<string, Promise<any>>();

// Subscribers for revalidation updates
const cacheListeners = new Map<string, Set<(newData: any) => void>>();

// Default TTL configurations (in milliseconds)
export const DEFAULT_STALE_TIME = 60 * 1000; // 60 seconds (fresh window)
export const DEFAULT_CACHE_TIME = 15 * 60 * 1000; // 15 minutes (usable stale window)

// Helper to normalize cache keys
export function buildCacheKey(endpoint: string, params?: Record<string, any> | null): string {
  if (!params || Object.keys(params).length === 0) {
    return endpoint;
  }
  const cleanParams: Record<string, string> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') {
      cleanParams[k] = String(v);
    }
  }
  const qs = new URLSearchParams(cleanParams).toString();
  return qs ? `${endpoint}?${qs}` : endpoint;
}

export const apiCache = {
  /**
   * Retrieves data from memory cache (or sessionStorage fallback).
   */
  get<T = any>(key: string): T | null {
    const entry = memoryCache.get(key);
    const now = Date.now();

    if (entry) {
      if (now < entry.expiresAt) {
        return entry.data as T;
      }
      memoryCache.delete(key);
    }

    // Try sessionStorage fallback if in browser
    if (typeof window !== 'undefined') {
      try {
        const stored = sessionStorage.getItem(`ffc_cache_${key}`);
        if (stored) {
          const parsed: CacheEntry<T> = JSON.parse(stored);
          if (now < parsed.expiresAt) {
            memoryCache.set(key, parsed);
            return parsed.data;
          }
          sessionStorage.removeItem(`ffc_cache_${key}`);
        }
      } catch {
        // Ignore session storage errors
      }
    }

    return null;
  },

  /**
   * Checks if a valid (even if stale) cached entry exists.
   */
  has(key: string): boolean {
    return apiCache.get(key) !== null;
  },

  /**
   * Checks if the cached entry is considered stale (needs background revalidation).
   */
  isStale(key: string): boolean {
    const entry = memoryCache.get(key);
    if (!entry) return true;
    return Date.now() > entry.staleAt;
  },

  /**
   * Stores data in memory (and sessionStorage).
   */
  set<T = any>(key: string, data: T, staleTime = DEFAULT_STALE_TIME, cacheTime = DEFAULT_CACHE_TIME): void {
    const now = Date.now();
    const entry: CacheEntry<T> = {
      data,
      timestamp: now,
      staleAt: now + staleTime,
      expiresAt: now + cacheTime,
    };

    memoryCache.set(key, entry);

    // Persist to sessionStorage for instant warm start on navigation
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem(`ffc_cache_${key}`, JSON.stringify(entry));
      } catch {
        // Session storage might be full or disabled
      }
    }

    // Notify all active listeners of the update
    const listeners = cacheListeners.get(key);
    if (listeners) {
      listeners.forEach((listener) => {
        try {
          listener(data);
        } catch (err) {
          console.error('Cache listener error:', err);
        }
      });
    }
  },

  /**
   * Invalidate entries matching a substring or RegExp pattern.
   */
  invalidate(pattern: string | RegExp): void {
    const keysToDelete: string[] = [];
    for (const key of memoryCache.keys()) {
      const matches = typeof pattern === 'string' ? key.includes(pattern) : pattern.test(key);
      if (matches) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      memoryCache.delete(key);
      if (typeof window !== 'undefined') {
        try {
          sessionStorage.removeItem(`ffc_cache_${key}`);
        } catch {
          // Ignore
        }
      }
    }
  },

  /**
   * Invalidate common related cache domains on mutations.
   */
  invalidateMatches(): void {
    apiCache.invalidate('/matches');
    apiCache.invalidate('/standings');
    apiCache.invalidate('/statistics');
    apiCache.invalidate('/batches');
  },

  invalidateAnnouncements(): void {
    apiCache.invalidate('/announcements');
    apiCache.invalidate('/notifications');
  },

  invalidateMembers(): void {
    apiCache.invalidate('/members');
    apiCache.invalidate('/statistics');
  },

  /**
   * Clears entire client cache (e.g. on logout).
   */
  clear(): void {
    memoryCache.clear();
    if (typeof window !== 'undefined') {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < sessionStorage.length; i++) {
          const k = sessionStorage.key(i);
          if (k && k.startsWith('ffc_cache_')) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => sessionStorage.removeItem(k));
      } catch {
        // Ignore
      }
    }
  },

  /**
   * Subscribe to updates for a specific cache key.
   */
  subscribe(key: string, listener: (newData: any) => void): () => void {
    if (!cacheListeners.has(key)) {
      cacheListeners.set(key, new Set());
    }
    cacheListeners.get(key)!.add(listener);

    return () => {
      const set = cacheListeners.get(key);
      if (set) {
        set.delete(listener);
        if (set.size === 0) {
          cacheListeners.delete(key);
        }
      }
    };
  },

  /**
   * Deduplicated fetch helper: if a request for this key is already in flight,
   * reuse the pending promise rather than firing multiple identical HTTP requests.
   */
  async dedupe<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
    const existing = inFlightRequests.get(key);
    if (existing) {
      return existing as Promise<T>;
    }

    const promise = fetcher().finally(() => {
      inFlightRequests.delete(key);
    });

    inFlightRequests.set(key, promise);
    return promise;
  },
};

/**
 * Options for the useCachedData hook.
 */
export interface UseCachedDataOptions<T> {
  staleTime?: number;
  cacheTime?: number;
  initialData?: T;
  enabled?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: any) => void;
}

/**
 * useCachedData: Custom React Hook implementing Stale-While-Revalidate (SWR) caching.
 *
 * Characteristics:
 * 1. Frame 0 Instant Display: If cached data exists, `data` is initialized immediately
 *    and `loading` starts as `false`. Zero pulse skeleton flash on route returns!
 * 2. Background Revalidation: Silently checks if data has changed in the background
 *    and updates state smoothly without unmounting or jarring layout shifts.
 * 3. Request Deduplication: Merges identical concurrent requests into a single network call.
 * 4. Error-tolerant: Retains previously cached data if a background revalidation fails.
 */
export function useCachedData<T = any>(
  key: string | null,
  fetcher: () => Promise<T>,
  options: UseCachedDataOptions<T> = {}
) {
  const {
    staleTime = DEFAULT_STALE_TIME,
    cacheTime = DEFAULT_CACHE_TIME,
    initialData,
    enabled = true,
    onSuccess,
    onError,
  } = options;

  // Initialize data synchronously from cache for instant 0ms render
  const [data, setData] = useState<T | null>(() => {
    if (!key) return initialData ?? null;
    const cached = apiCache.get<T>(key);
    return cached !== null ? cached : initialData ?? null;
  });

  // Loading is only true if we don't already have cached or initial data
  const [loading, setLoading] = useState<boolean>(() => {
    if (!enabled || !key) return false;
    return apiCache.get(key) === null && initialData === undefined;
  });

  const [isRevalidating, setIsRevalidating] = useState<boolean>(false);
  const [error, setError] = useState<any>(null);

  // Keep fetcher reference updated
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const executeFetch = useCallback(
    async (isBackground = false) => {
      if (!key || !enabled) return;

      if (!isBackground) {
        setLoading(true);
      } else {
        setIsRevalidating(true);
      }

      setError(null);

      try {
        const freshData = await apiCache.dedupe(key, () => fetcherRef.current());
        apiCache.set(key, freshData, staleTime, cacheTime);
        setData(freshData);
        onSuccess?.(freshData);
      } catch (err: any) {
        setError(err);
        onError?.(err);
      } finally {
        setLoading(false);
        setIsRevalidating(false);
      }
    },
    [key, enabled, staleTime, cacheTime, onSuccess, onError]
  );

  // Subscribe to external cache updates (e.g. from mutations or other components)
  useEffect(() => {
    if (!key) return;
    const unsubscribe = apiCache.subscribe(key, (updatedData) => {
      setData(updatedData);
    });
    return unsubscribe;
  }, [key]);

  // Handle data fetching & revalidation
  useEffect(() => {
    if (!key || !enabled) return;

    const cached = apiCache.get<T>(key);
    if (cached !== null) {
      setData(cached);
      // If cached data is still fresh, no background fetch needed
      if (!apiCache.isStale(key)) {
        setLoading(false);
        return;
      }
      // If cached data is stale, revalidate in background without blocking UI
      executeFetch(true);
    } else {
      // First time visiting page: fetch normally
      executeFetch(false);
    }
  }, [key, enabled, executeFetch]);

  // Manual refresh helper (forces network fetch and updates cache)
  const refresh = useCallback(async () => {
    return executeFetch(false);
  }, [executeFetch]);

  return {
    data,
    loading,
    isRevalidating,
    error,
    refresh,
    setData,
  };
}

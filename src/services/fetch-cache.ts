/**
 * A small, self-contained HTTP/JSON cache used by the fetcher action.
 *
 * Responsibilities:
 *  - Cache successful (and failed) responses per `url + headers` for a short TTL,
 *    so multiple action instances pointing at the same endpoint - and rapid
 *    repeated triggers - reuse a single network round-trip instead of hammering it.
 *  - Coalesce concurrent identical requests behind a single in-flight promise.
 *  - Enforce a request timeout and a maximum response size.
 *
 * This is intentionally framework-agnostic and holds no Stream Deck state.
 */

const TIMEOUT_MS = 8000;
/** Hard cap on response body size to avoid runaway memory usage. */
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
/** Upper bound on distinct cache entries; oldest are pruned beyond this. */
const MAX_CACHE_ENTRIES = 200;

export interface FetchResult {
    /** Parsed JSON payload when the request succeeded. */
    data?: unknown;
    /** Human-readable error message when the request failed. */
    error?: string;
    /** True when the result was served from cache rather than the network. */
    fromCache: boolean;
}

interface CacheEntry {
    /** Timestamp (ms) of the last completed fetch backing `data`/`error`. */
    timestamp: number;
    data?: unknown;
    error?: string;
    /** In-flight request shared by concurrent callers, if any. */
    inflight?: Promise<FetchResult>;
}

export class FetchCache {
    private readonly store = new Map<string, CacheEntry>();

    /**
     * Returns a cached result when one exists and is younger than `maxAgeMs`,
     * otherwise performs a network fetch. Concurrent calls for the same key
     * share a single in-flight request.
     */
    async get(
        url: string,
        headers: Record<string, string> | undefined,
        maxAgeMs: number
    ): Promise<FetchResult> {
        const key = this.keyFor(url, headers);
        const now = Date.now();
        const entry = this.store.get(key);

        // Coalesce: if a request is already in flight, await it.
        if (entry?.inflight) {
            return entry.inflight;
        }

        // Fresh enough cache hit.
        if (entry && entry.timestamp > 0 && now - entry.timestamp < maxAgeMs) {
            return { data: entry.data, error: entry.error, fromCache: true };
        }

        const inflight = this.doFetch(url, headers);
        // Preserve any previous value so coalesced callers still see stale data
        // semantics while the new request resolves.
        this.store.set(key, {
            timestamp: entry?.timestamp ?? 0,
            data: entry?.data,
            error: entry?.error,
            inflight,
        });

        try {
            const result = await inflight;
            this.store.set(key, {
                timestamp: Date.now(),
                data: result.data,
                error: result.error,
            });
            return result;
        } finally {
            this.prune();
        }
    }

    private async doFetch(
        url: string,
        headers: Record<string, string> | undefined
    ): Promise<FetchResult> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const init: RequestInit = { signal: controller.signal, redirect: "follow" };
            if (headers) {
                init.headers = headers;
            }

            const res = await fetch(url, init);
            if (!res.ok) {
                return { error: `HTTP ${res.status}`, fromCache: false };
            }

            const contentLength = Number(res.headers.get("content-length"));
            if (Number.isFinite(contentLength) && contentLength > MAX_RESPONSE_BYTES) {
                return { error: "Response too large", fromCache: false };
            }

            const text = await res.text();
            if (text.length > MAX_RESPONSE_BYTES) {
                return { error: "Response too large", fromCache: false };
            }

            try {
                return { data: JSON.parse(text), fromCache: false };
            } catch {
                return { error: "Invalid JSON", fromCache: false };
            }
        } catch (err: unknown) {
            const name = (err as { name?: string })?.name;
            return {
                error: name === "AbortError" ? "Timeout" : "Network error",
                fromCache: false,
            };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private keyFor(url: string, headers: Record<string, string> | undefined): string {
        return headers ? `${url}\n${JSON.stringify(headers)}` : url;
    }

    /** Evicts the oldest entries once the cache exceeds its size cap. */
    private prune(): void {
        if (this.store.size <= MAX_CACHE_ENTRIES) {
            return;
        }
        const entries = [...this.store.entries()]
            .filter(([, e]) => e.inflight === undefined)
            .sort((a, b) => a[1].timestamp - b[1].timestamp);
        for (const [key] of entries) {
            if (this.store.size <= MAX_CACHE_ENTRIES) {
                break;
            }
            this.store.delete(key);
        }
    }
}

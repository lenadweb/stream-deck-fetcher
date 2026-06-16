const TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 200;

export interface FetchResult {
    text?: string;
    error?: string;
    fromCache: boolean;
}

interface CacheEntry {
    timestamp: number;
    text?: string;
    error?: string;
    inflight?: Promise<FetchResult>;
}

export class FetchCache {
    private readonly store = new Map<string, CacheEntry>();

    async get(
        url: string,
        headers: Record<string, string> | undefined,
        maxAgeMs: number
    ): Promise<FetchResult> {
        const key = this.keyFor(url, headers);
        const now = Date.now();
        const entry = this.store.get(key);

        if (entry?.inflight) {
            return entry.inflight;
        }

        if (entry && entry.timestamp > 0 && now - entry.timestamp < maxAgeMs) {
            return { text: entry.text, error: entry.error, fromCache: true };
        }

        const inflight = this.doFetch(url, headers);
        this.store.set(key, {
            timestamp: entry?.timestamp ?? 0,
            text: entry?.text,
            error: entry?.error,
            inflight,
        });

        try {
            const result = await inflight;
            this.store.set(key, {
                timestamp: Date.now(),
                text: result.text,
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

            return { text, fromCache: false };
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

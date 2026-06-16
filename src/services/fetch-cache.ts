const TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 200;

export interface FetchRequest {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
}

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

    async get(req: FetchRequest, maxAgeMs: number): Promise<FetchResult> {
        const key = this.keyFor(req);
        const now = Date.now();
        const entry = this.store.get(key);

        if (entry?.inflight) {
            return entry.inflight;
        }

        if (entry && entry.timestamp > 0 && now - entry.timestamp < maxAgeMs) {
            return { text: entry.text, error: entry.error, fromCache: true };
        }

        const inflight = this.doFetch(req);
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

    private async doFetch(req: FetchRequest): Promise<FetchResult> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);
        try {
            const method = (req.method || "GET").toUpperCase();
            const headers: Record<string, string> = { ...(req.headers || {}) };
            const init: RequestInit = { signal: controller.signal, redirect: "follow", method };

            const hasBody = req.body != null && req.body !== "" && method !== "GET" && method !== "HEAD";
            if (hasBody) {
                init.body = req.body;
                const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === "content-type");
                if (!hasContentType) {
                    headers["Content-Type"] = "application/json";
                }
            }
            if (Object.keys(headers).length > 0) {
                init.headers = headers;
            }

            const res = await fetch(req.url, init);
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

    private keyFor(req: FetchRequest): string {
        return JSON.stringify([
            req.url,
            (req.method || "GET").toUpperCase(),
            req.headers || null,
            req.body || null,
        ]);
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

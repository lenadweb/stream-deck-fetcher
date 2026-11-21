import http from "node:http";
import https from "node:https";
import zlib from "node:zlib";
import type { Readable } from "node:stream";

const TIMEOUT_MS = 8000;
const MAX_RESPONSE_BYTES = 5 * 1024 * 1024;
const MAX_CACHE_ENTRIES = 200;
const MAX_REDIRECTS = 5;

// Used only when a key has "Ignore certificate errors" enabled.
const insecureAgent = new https.Agent({ rejectUnauthorized: false, keepAlive: true });

export interface FetchRequest {
    url: string;
    method?: string;
    headers?: Record<string, string>;
    body?: string;
    insecure?: boolean;
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

interface RawResponse {
    status: number;
    text: string;
}

const TOO_LARGE = "TOO_LARGE";

function rawRequest(
    url: URL,
    method: string,
    headers: Record<string, string>,
    body: string | undefined,
    signal: AbortSignal,
    insecure: boolean,
    redirectsLeft: number = MAX_REDIRECTS,
): Promise<RawResponse> {
    return new Promise((resolve, reject) => {
        const isHttps = url.protocol === "https:";
        const lib = isHttps ? https : http;

        const h: Record<string, string> = { "accept-encoding": "gzip, deflate, br" };
        for (const [k, v] of Object.entries(headers)) h[k.toLowerCase()] = v;
        if (body !== undefined) h["content-length"] = String(Buffer.byteLength(body));

        const req = lib.request(
            url,
            { method, headers: h, agent: isHttps && insecure ? insecureAgent : undefined, signal },
            (res) => {
                const status = res.statusCode ?? 0;
                const location = res.headers.location;

                // Follow redirects (301 / 302 / 303 -> GET without body; 307 / 308 preserve)
                if (status >= 300 && status < 400 && location) {
                    res.resume();
                    if (redirectsLeft <= 0) return reject(new Error("Too many redirects"));
                    const next = new URL(location, url);
                    const keep = status === 307 || status === 308;
                    const nextHeaders = { ...headers };
                    if (!keep) {
                        for (const k of Object.keys(nextHeaders)) {
                            if (k.toLowerCase() === "content-type") delete nextHeaders[k];
                        }
                    }
                    return resolve(
                        rawRequest(
                            next,
                            keep ? method : "GET",
                            nextHeaders,
                            keep ? body : undefined,
                            signal,
                            insecure,
                            redirectsLeft - 1,
                        ),
                    );
                }

                const len = Number(res.headers["content-length"]);
                if (Number.isFinite(len) && len > MAX_RESPONSE_BYTES) {
                    req.destroy();
                    return reject(new Error(TOO_LARGE));
                }

                res.on("error", reject);
                let stream: Readable = res;
                const enc = String(res.headers["content-encoding"] || "").toLowerCase();
                if (enc === "gzip" || enc === "x-gzip") stream = res.pipe(zlib.createGunzip());
                else if (enc === "deflate") stream = res.pipe(zlib.createInflate());
                else if (enc === "br") stream = res.pipe(zlib.createBrotliDecompress());

                const chunks: Buffer[] = [];
                let size = 0;
                stream.on("data", (c: Buffer) => {
                    size += c.length;
                    if (size > MAX_RESPONSE_BYTES) {
                        req.destroy();
                        reject(new Error(TOO_LARGE));
                        return;
                    }
                    chunks.push(c);
                });
                stream.on("end", () => resolve({ status, text: Buffer.concat(chunks).toString("utf8") }));
                stream.on("error", reject);
            },
        );

        req.on("error", reject);
        if (body !== undefined) req.write(body);
        req.end();
    });
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

            const hasBody = req.body != null && req.body !== "" && method !== "GET" && method !== "HEAD";
            if (hasBody) {
                const hasContentType = Object.keys(headers).some((k) => k.toLowerCase() === "content-type");
                if (!hasContentType) {
                    headers["Content-Type"] = "application/json";
                }
            }

            const res = await rawRequest(
                new URL(req.url),
                method,
                headers,
                hasBody ? req.body : undefined,
                controller.signal,
                req.insecure === true,
            );

            if (res.status < 200 || res.status >= 300) {
                return { error: `HTTP ${res.status}`, fromCache: false };
            }
            return { text: res.text, fromCache: false };
        } catch (err: unknown) {
            const e = err as { name?: string; message?: string };
            let error = "Network error";
            if (e?.name === "AbortError" || e?.name === "TimeoutError") error = "Timeout";
            else if (e?.message === TOO_LARGE) error = "Response too large";
            return { error, fromCache: false };
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
            req.insecure === true,
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

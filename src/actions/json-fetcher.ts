import streamDeck, {
    action,
    SingletonAction,
    KeyDownEvent,
    WillAppearEvent,
    WillDisappearEvent,
    DidReceiveSettingsEvent,
    SendToPluginEvent,
} from "@elgato/streamdeck";
import { parse } from "node-html-parser";
import { FetcherSettings } from "../interfaces/settings";
import { ProgressBarRenderer } from "../ui/progress-bar-renderer";
import { FetchCache } from "../services/fetch-cache";
import { ScriptRunner } from "../services/script-runner";

interface CachedValue {
    value: string;
    isError: boolean;
}

@action({ UUID: "com.len.fetcher.action" })
export class JsonFetcherAction extends SingletonAction<FetcherSettings> {
    private static readonly MIN_INTERVAL_S = 5;
    private static readonly DEFAULT_INTERVAL_S = 12 * 60 * 60;
    private static readonly MANUAL_RATE_MS = 2000;
    /** Tests reuse a recent response so repeated presses iterate on the handler, not the endpoint. */
    private static readonly TEST_MAX_AGE_MS = 30000;
    /** A cache hit resolves in about a millisecond; waiting this long keeps the dot off those refreshes. */
    private static readonly LOADING_DOT_DELAY_MS = 150;

    private readonly intervals = new Map<string, NodeJS.Timeout>();
    private readonly controllers = new Map<string, string>();
    private readonly values = new Map<string, CachedValue>();
    private readonly lastManualFetch = new Map<string, number>();
    private readonly pending = new Set<string>();
    private readonly renderer = new ProgressBarRenderer();
    private readonly cache = new FetchCache();
    private readonly scripts = new ScriptRunner((level, args) => {
        const text = args.map((a) => (typeof a === "object" ? JSON.stringify(a) : String(a))).join(" ");
        streamDeck.logger[level === "log" ? "info" : level](`[handler] ${text}`);
    });

    override async onWillAppear(ev: WillAppearEvent<FetcherSettings>): Promise<void> {
        this.controllers.set(ev.action.id, ev.payload.controller);
        const settings = (ev.payload?.settings ?? {}) as FetcherSettings;
        await this.paint(ev, settings);
        this.startMonitoring(ev, settings.forceRefreshOnAppear === true);
    }

    override onWillDisappear(ev: WillDisappearEvent<FetcherSettings>): void {
        this.controllers.delete(ev.action.id);
        this.lastManualFetch.delete(ev.action.id);
        this.pending.delete(ev.action.id);
        this.stopMonitoring(ev.action.id);
    }

    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<FetcherSettings>): void {
        void this.paint(ev, (ev.payload?.settings ?? {}) as FetcherSettings);
        this.startMonitoring(ev);
    }

    override onKeyDown(ev: KeyDownEvent<FetcherSettings>): void {
        this.manualRefresh(ev);
    }

    override onDialDown(ev: any): void {
        this.manualRefresh(ev);
    }

    override onDialRotate(ev: any): void {
        this.manualRefresh(ev);
    }

    override onTouchTap(ev: any): void {
        this.manualRefresh(ev);
    }

    override async onSendToPlugin(ev: SendToPluginEvent<any, FetcherSettings>): Promise<void> {
        if ((ev.payload as any)?.event !== "test") {
            return;
        }
        const settings = ((ev.payload as any).settings ?? {}) as FetcherSettings;
        await streamDeck.ui.sendToPropertyInspector({
            event: "testResult",
            ...(await this.runTest(settings)),
        });
    }

    private async runTest(settings: FetcherSettings): Promise<Record<string, any>> {
        if (!settings.url) {
            return { ok: false, error: "Enter a URL first." };
        }

        try {
            const parsed = new URL(settings.url);
            if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
                throw new Error("bad protocol");
            }
        } catch {
            return { ok: false, error: "Invalid URL." };
        }

        let headers: Record<string, string> | undefined;
        try {
            headers = this.parseHeaders(settings);
        } catch {
            return { ok: false, error: "Headers must be a valid JSON object." };
        }

        const started = Date.now();
        const result = await this.cache.get(
            { url: settings.url, method: settings.method, headers, body: settings.body },
            JsonFetcherAction.TEST_MAX_AGE_MS
        );
        const elapsed = Date.now() - started;

        if (result.error) {
            return { ok: false, error: result.error, elapsed, cached: result.fromCache };
        }

        try {
            return {
                ok: true,
                value: this.buildDisplay(result.text || "", settings),
                elapsed,
                cached: result.fromCache,
            };
        } catch (err: any) {
            streamDeck.logger.error(`Test failed for ${settings.url}: ${err?.stack || String(err)}`);
            return { ok: false, error: err?.message || "Parse error", elapsed, cached: result.fromCache };
        }
    }

    private intervalSeconds(settings: FetcherSettings): number {
        const raw = typeof settings.pulling === "number" && Number.isFinite(settings.pulling)
            ? settings.pulling
            : JsonFetcherAction.DEFAULT_INTERVAL_S;
        return Math.max(JsonFetcherAction.MIN_INTERVAL_S, Math.floor(raw));
    }

    private startMonitoring(
        ev: WillAppearEvent<FetcherSettings> | DidReceiveSettingsEvent<FetcherSettings>,
        forceFirstRefresh = false
    ): void {
        const id = ev.action.id;
        this.stopMonitoring(id);

        const settings = (ev.payload?.settings ?? {}) as FetcherSettings;
        const intervalMs = this.intervalSeconds(settings) * 1000;
        const maxAgeMs = Math.max(0, intervalMs - 1000);

        // A forced refresh skips the cache entirely so the tile shows a fresh value the moment it appears.
        void this.refresh(ev, forceFirstRefresh ? 0 : maxAgeMs);

        const timer = setInterval(() => {
            void this.refresh(ev, maxAgeMs);
        }, intervalMs);
        this.intervals.set(id, timer);
    }

    private stopMonitoring(actionId: string): void {
        const timer = this.intervals.get(actionId);
        if (timer) {
            clearInterval(timer);
            this.intervals.delete(actionId);
        }
    }

    private manualRefresh(ev: any): void {
        const id = ev.action.id;
        const now = Date.now();
        const last = this.lastManualFetch.get(id) ?? 0;
        if (now - last < JsonFetcherAction.MANUAL_RATE_MS) {
            void this.paint(ev, (ev.payload?.settings ?? {}) as FetcherSettings);
            return;
        }
        this.lastManualFetch.set(id, now);
        void this.refresh(ev, JsonFetcherAction.MANUAL_RATE_MS);
    }

    private async refresh(ev: any, maxAgeMs: number): Promise<void> {
        const settings = (ev.payload?.settings ?? {}) as FetcherSettings;
        const themeColor = settings.themeColor || "cyan";
        const label = this.deriveLabel(settings);
        const icon = settings.icon || "none";
        const fontSize = settings.fontSize || "md";

        if (!settings.url) {
            await this.draw(ev, "Configure", label, false, "none", themeColor, fontSize);
            return;
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(settings.url);
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                throw new Error("Invalid protocol");
            }
        } catch {
            await this.draw(ev, "Invalid URL", label, true, icon, themeColor, fontSize);
            return;
        }

        let headers: Record<string, string> | undefined;
        try {
            headers = this.parseHeaders(settings);
        } catch {
            await this.draw(ev, "Headers Error", label, true, icon, themeColor, fontSize);
            return;
        }

        const result = await this.whilePending(ev, settings, () =>
            this.cache.get({ url: settings.url!, method: settings.method, headers, body: settings.body }, maxAgeMs)
        );

        if (result.error) {
            streamDeck.logger.error(`Fetch failed for ${settings.url}: ${result.error}`);
            this.values.set(ev.action.id, { value: result.error, isError: true });
            await this.paint(ev, settings);
            return;
        }

        try {
            const display = this.buildDisplay(result.text || "", settings);
            this.values.set(ev.action.id, { value: display, isError: false });
        } catch (err: any) {
            streamDeck.logger.error(`Extraction failed for ${settings.url}: ${err?.stack || String(err)}`);
            this.values.set(ev.action.id, { value: this.errorText(err), isError: true });
        }
        await this.paint(ev, settings);
    }

    /** Marks the action as loading and repaints, so a slow fetch shows the indicator dot. */
    private async whilePending<T>(ev: any, settings: FetcherSettings, work: () => Promise<T>): Promise<T> {
        const id = ev.action.id;
        const promise = work();
        const timer = setTimeout(() => {
            this.pending.add(id);
            void this.paint(ev, settings);
        }, JsonFetcherAction.LOADING_DOT_DELAY_MS);
        try {
            return await promise;
        } finally {
            clearTimeout(timer);
            this.pending.delete(id);
        }
    }

    private async paint(ev: any, settings: FetcherSettings): Promise<void> {
        const themeColor = settings.themeColor || "cyan";
        const label = this.deriveLabel(settings);
        const icon = settings.icon || "none";
        const fontSize = settings.fontSize || "md";
        const cached = this.values.get(ev.action.id);
        const isLoading = this.pending.has(ev.action.id);

        if (!cached) {
            const value = settings.url ? "Loading" : "Configure";
            await this.draw(ev, value, label, false, settings.url ? icon : "none", themeColor, fontSize, isLoading);
            return;
        }

        await this.draw(ev, cached.value, label, cached.isError, icon, themeColor, fontSize, isLoading);
    }

    private parseHeaders(settings: FetcherSettings): Record<string, string> | undefined {
        if (!settings.headers || !settings.headers.trim()) {
            return undefined;
        }
        const parsed = JSON.parse(settings.headers);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
            throw new Error("Headers must be a JSON object");
        }
        const headers: Record<string, string> = {};
        for (const [k, v] of Object.entries(parsed)) {
            headers[k] = String(v);
        }
        return headers;
    }

    private errorText(err: any): string {
        const raw = err?.message ? String(err.message) : "Parse error";
        const oneLine = raw.replace(/\s+/g, " ").trim();
        return oneLine.length > 40 ? `${oneLine.slice(0, 39)}\u2026` : oneLine;
    }

    private deriveLabel(settings: FetcherSettings): string {
        return settings.label ? settings.label : "";
    }

    private buildDisplay(text: string, settings: FetcherSettings): string {
        const formatter = settings.formatter || "none";

        if (settings.mode === "js") {
            return this.formatValue(this.scripts.run(settings.script || "", text), formatter);
        }

        const isHtml = settings.mode === "html";
        const expr = (isHtml ? settings.selector : settings.jsonPath) || "";

        if (/\{[^}]*\}/.test(expr)) {
            const context = isHtml ? parse(text) : this.parseJson(text);
            return expr.replace(/\{([^}]*)\}/g, (_match, inner) => {
                const key = String(inner).trim();
                const raw = isHtml ? this.queryHtml(context, key) : this.resolvePath(context, key);
                return this.formatValue(raw, formatter);
            });
        }

        const raw = isHtml ? this.extractHtml(text, expr) : this.extractJson(text, expr);
        return this.formatValue(raw, formatter);
    }

    private parseJson(text: string): unknown {
        try {
            return JSON.parse(text);
        } catch {
            throw new Error("Invalid JSON");
        }
    }

    private extractJson(text: string, path: string): unknown {
        return this.resolvePath(this.parseJson(text), path);
    }

    private extractHtml(text: string, selector: string): unknown {
        if (!selector) {
            throw new Error("No selector");
        }
        const value = this.queryHtml(parse(text), selector);
        if (value === null) {
            throw new Error("No match");
        }
        return value;
    }

    private queryHtml(root: any, selector: string): unknown {
        if (!selector) {
            return null;
        }
        let attribute = "";
        let query = selector;
        const at = selector.lastIndexOf("@");
        if (at > 0) {
            query = selector.slice(0, at).trim();
            attribute = selector.slice(at + 1).trim();
        }
        const el = root.querySelector(query);
        if (!el) {
            return null;
        }
        const value = attribute ? el.getAttribute(attribute) : el.text;
        return value === undefined || value === null ? null : value.trim();
    }

    private async draw(ev: any, value: string, label: string, isError: boolean, icon: string, themeColor: string, fontSize: string, isLoading = false): Promise<void> {
        try {
            const svg = this.renderer.render(value, label, isError, icon, themeColor, 144, 144, fontSize, isLoading);
            const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
            await ev.action.setImage(image);

            if (this.controllers.get(ev.action.id) === "Encoder") {
                const dialSvg = this.renderer.render(value, label, isError, icon, themeColor, 200, 100, fontSize, isLoading);
                const feedbackImage = `data:image/svg+xml;base64,${Buffer.from(dialSvg).toString("base64")}`;
                await (ev.action as any).setFeedback({ full_view: feedbackImage });
            }
        } catch (err) {
            streamDeck.logger.error(`Render/update failed: ${String(err)}`);
        }
    }

    private resolvePath(obj: any, path: string): any {
        if (!path) return obj;
        const parts = path.split(/\.|\[|\]/).filter(Boolean);
        let current = obj;
        for (const part of parts) {
            if (current == null) return undefined;
            current = current[part];
        }
        return current;
    }

    /** DOM nodes from an HTML response are circular, so stringify defensively. */
    private stringify(val: any): string {
        try {
            return JSON.stringify(val);
        } catch {
            return String(val);
        }
    }

    private formatValue(val: any, formatter: string): string {
        if (val === undefined || val === null) return "N/A";

        let str = typeof val === "object" ? this.stringify(val) : String(val);
        const num = parseFloat(str.replace(/[^0-9.-]/g, ""));

        switch (formatter) {
            case "integer":
                return isNaN(num) ? str : String(Math.round(num));
            case "percent":
                return isNaN(num) ? str : `${Math.round(num)}%`;
            case "currency":
                return isNaN(num) ? str : `$${num.toFixed(2)}`;
            case "currency_eur":
                return isNaN(num) ? str : `${num.toFixed(2)} €`;
            case "abbreviate":
                if (isNaN(num)) return str;
                if (num >= 1e6) return `${(num / 1e6).toFixed(1).replace(/\.0$/, "")}M`;
                if (num >= 1e3) return `${(num / 1e3).toFixed(1).replace(/\.0$/, "")}k`;
                return String(num);
            case "boolean_status":
                const isTrue = val === true || val === 1 || String(val).toLowerCase() === "true" || String(val).toLowerCase() === "ok" || String(val).toLowerCase() === "on";
                return isTrue ? "ON" : "OFF";
            case "uppercase":
                return str.toUpperCase();
            case "lowercase":
                return str.toLowerCase();
            case "none":
            default:
                return str;
        }
    }
}

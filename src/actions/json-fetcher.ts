import streamDeck, {
    action,
    SingletonAction,
    KeyDownEvent,
    WillAppearEvent,
    WillDisappearEvent,
    DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { parse } from "node-html-parser";
import { FetcherSettings } from "../interfaces/settings";
import { ProgressBarRenderer } from "../ui/progress-bar-renderer";
import { FetchCache } from "../services/fetch-cache";

interface CachedValue {
    raw: unknown;
    isError: boolean;
    error?: string;
}

@action({ UUID: "com.len.fetcher.action" })
export class JsonFetcherAction extends SingletonAction<FetcherSettings> {
    private static readonly MIN_INTERVAL_S = 5;
    private static readonly DEFAULT_INTERVAL_S = 12 * 60 * 60;
    private static readonly MANUAL_RATE_MS = 2000;

    private readonly intervals = new Map<string, NodeJS.Timeout>();
    private readonly controllers = new Map<string, string>();
    private readonly values = new Map<string, CachedValue>();
    private readonly lastManualFetch = new Map<string, number>();
    private readonly renderer = new ProgressBarRenderer();
    private readonly cache = new FetchCache();

    override async onWillAppear(ev: WillAppearEvent<FetcherSettings>): Promise<void> {
        this.controllers.set(ev.action.id, ev.payload.controller);
        await this.paint(ev, (ev.payload?.settings ?? {}) as FetcherSettings);
        this.startMonitoring(ev);
    }

    override onWillDisappear(ev: WillDisappearEvent<FetcherSettings>): void {
        this.controllers.delete(ev.action.id);
        this.lastManualFetch.delete(ev.action.id);
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

    private intervalSeconds(settings: FetcherSettings): number {
        const raw = typeof settings.pulling === "number" && Number.isFinite(settings.pulling)
            ? settings.pulling
            : JsonFetcherAction.DEFAULT_INTERVAL_S;
        return Math.max(JsonFetcherAction.MIN_INTERVAL_S, Math.floor(raw));
    }

    private startMonitoring(ev: WillAppearEvent<FetcherSettings> | DidReceiveSettingsEvent<FetcherSettings>): void {
        const id = ev.action.id;
        this.stopMonitoring(id);

        const settings = (ev.payload?.settings ?? {}) as FetcherSettings;
        const intervalMs = this.intervalSeconds(settings) * 1000;
        const maxAgeMs = Math.max(0, intervalMs - 1000);

        void this.refresh(ev, maxAgeMs);

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

        if (!settings.url) {
            await this.draw(ev, "Configure", label, false, "none", themeColor);
            return;
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(settings.url);
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                throw new Error("Invalid protocol");
            }
        } catch {
            await this.draw(ev, "Invalid URL", label, true, icon, themeColor);
            return;
        }

        let headers: Record<string, string> | undefined;
        if (settings.headers && settings.headers.trim()) {
            try {
                const parsed = JSON.parse(settings.headers);
                if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
                    throw new Error("not an object");
                }
                headers = {};
                for (const [k, v] of Object.entries(parsed)) {
                    headers[k] = String(v);
                }
            } catch {
                await this.draw(ev, "Headers Error", label, true, icon, themeColor);
                return;
            }
        }

        const result = await this.cache.get(settings.url, headers, maxAgeMs);

        if (result.error) {
            streamDeck.logger.error(`Fetch failed for ${settings.url}: ${result.error}`);
            this.values.set(ev.action.id, { raw: undefined, isError: true, error: result.error });
            await this.paint(ev, settings);
            return;
        }

        try {
            const rawVal = settings.mode === "html"
                ? this.extractHtml(result.text || "", settings.selector || "")
                : this.extractJson(result.text || "", settings.jsonPath || "");
            this.values.set(ev.action.id, { raw: rawVal, isError: false });
        } catch (err: any) {
            this.values.set(ev.action.id, { raw: undefined, isError: true, error: err?.message || "Parse error" });
        }
        await this.paint(ev, settings);
    }

    private async paint(ev: any, settings: FetcherSettings): Promise<void> {
        const themeColor = settings.themeColor || "cyan";
        const label = this.deriveLabel(settings);
        const icon = settings.icon || "none";
        const cached = this.values.get(ev.action.id);

        if (!cached) {
            const value = settings.url ? "Loading" : "Configure";
            await this.draw(ev, value, label, false, settings.url ? icon : "none", themeColor);
            return;
        }

        if (cached.isError) {
            await this.draw(ev, cached.error || "Error", label, true, icon, themeColor);
            return;
        }

        const displayValue = this.formatValue(cached.raw, settings.formatter || "none");
        await this.draw(ev, displayValue, label, false, icon, themeColor);
    }

    private deriveLabel(settings: FetcherSettings): string {
        return settings.label ? settings.label : "";
    }

    private extractJson(text: string, path: string): unknown {
        let data: unknown;
        try {
            data = JSON.parse(text);
        } catch {
            throw new Error("Invalid JSON");
        }
        return this.resolvePath(data, path);
    }

    private extractHtml(text: string, selector: string): unknown {
        if (!selector) {
            throw new Error("No selector");
        }

        let attribute = "";
        let query = selector;
        const at = selector.lastIndexOf("@");
        if (at > 0) {
            query = selector.slice(0, at).trim();
            attribute = selector.slice(at + 1).trim();
        }

        const root = parse(text);
        const el = root.querySelector(query);
        if (!el) {
            throw new Error("No match");
        }
        const value = attribute ? el.getAttribute(attribute) : el.text;
        return value === undefined || value === null ? null : value.trim();
    }

    private async draw(ev: any, value: string, label: string, isError: boolean, icon: string, themeColor: string): Promise<void> {
        try {
            const svg = this.renderer.render(value, label, isError, icon, themeColor, 144, 144);
            const image = `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
            await ev.action.setImage(image);

            if (this.controllers.get(ev.action.id) === "Encoder") {
                const dialSvg = this.renderer.render(value, label, isError, icon, themeColor, 200, 100);
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

    private formatValue(val: any, formatter: string): string {
        if (val === undefined || val === null) return "N/A";

        let str = typeof val === "object" ? JSON.stringify(val) : String(val);
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

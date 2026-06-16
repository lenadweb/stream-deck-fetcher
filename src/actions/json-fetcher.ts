import streamDeck, {
    action,
    SingletonAction,
    KeyDownEvent,
    WillAppearEvent,
    WillDisappearEvent,
    DidReceiveSettingsEvent,
} from "@elgato/streamdeck";
import { FetcherSettings } from "../interfaces/settings";
import { ProgressBarRenderer } from "../ui/progress-bar-renderer";
import { FetchCache } from "../services/fetch-cache";

interface RenderState {
    value: string;
    isError: boolean;
    label: string;
    icon: string;
}

@action({ UUID: "com.len.fetcher.action" })
export class JsonFetcherAction extends SingletonAction<FetcherSettings> {
    /** Minimum polling interval; protects target endpoints from abuse. */
    private static readonly MIN_INTERVAL_S = 5;
    private static readonly DEFAULT_INTERVAL_S = 12 * 60 * 60; // 12 hours
    /**
     * Minimum spacing between manual (key/dial/touch) refreshes. Repeated
     * presses within this window reuse the cached value instead of firing
     * a new request.
     */
    private static readonly MANUAL_RATE_MS = 2000;

    private readonly intervals = new Map<string, NodeJS.Timeout>();
    private readonly controllers = new Map<string, string>();
    private readonly lastResults = new Map<string, RenderState>();
    private readonly lastManualFetch = new Map<string, number>();
    private readonly renderer = new ProgressBarRenderer();
    private readonly cache = new FetchCache();

    override async onWillAppear(ev: WillAppearEvent<FetcherSettings>): Promise<void> {
        this.controllers.set(ev.action.id, ev.payload.controller);
        await this.redraw(ev);
        this.startMonitoring(ev);
    }

    override onWillDisappear(ev: WillDisappearEvent<FetcherSettings>): void {
        this.controllers.delete(ev.action.id);
        this.lastManualFetch.delete(ev.action.id);
        this.stopMonitoring(ev.action.id);
    }

    /**
     * Fired when the settings change in the Property Inspector. We restart
     * monitoring with the fresh settings snapshot carried by the event.
     *
     * IMPORTANT: never call `ev.action.getSettings()` anywhere in this action.
     * The SDK resolves it via a `didReceiveSettings` event, which re-enters
     * this handler and causes an unbounded request storm. The settings we need
     * are always available on `ev.payload.settings`.
     */
    override onDidReceiveSettings(ev: DidReceiveSettingsEvent<FetcherSettings>): void {
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
        // Accept cache slightly younger than the interval so that simultaneous
        // ticks across instances of the same URL share one request.
        const maxAgeMs = Math.max(0, intervalMs - 1000);

        // Kick off an immediate refresh, then schedule recurring ones.
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
            // Too soon: just re-show the last known value.
            void this.redraw(ev);
            return;
        }
        this.lastManualFetch.set(id, now);
        void this.refresh(ev, JsonFetcherAction.MANUAL_RATE_MS);
    }

    private async refresh(ev: any, maxAgeMs: number): Promise<void> {
        const settings = (ev.payload?.settings ?? {}) as FetcherSettings;

        if (!settings.url) {
            await this.draw(ev, "Configure", "Fetcher", false, "none");
            return;
        }

        let parsedUrl: URL;
        try {
            parsedUrl = new URL(settings.url);
            if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
                throw new Error("Invalid protocol");
            }
        } catch {
            await this.draw(ev, "Invalid URL", settings.label || "Fetcher", true, settings.icon || "none");
            return;
        }

        const label = settings.label || parsedUrl.hostname;
        const icon = settings.icon || "none";

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
                await this.draw(ev, "Headers Error", label, true, icon);
                return;
            }
        }

        const result = await this.cache.get(settings.url, headers, maxAgeMs);

        if (result.error) {
            streamDeck.logger.error(`Fetch failed for ${settings.url}: ${result.error}`);
            this.lastResults.set(ev.action.id, { value: result.error, isError: true, label, icon });
            await this.draw(ev, result.error, label, true, icon);
            return;
        }

        const rawVal = this.resolvePath(result.data, settings.jsonPath || "");
        const displayValue = this.formatValue(rawVal, settings.formatter || "none");
        this.lastResults.set(ev.action.id, { value: displayValue, isError: false, label, icon });
        await this.draw(ev, displayValue, label, false, icon);
    }

    private async redraw(ev: any): Promise<void> {
        const cached = this.lastResults.get(ev.action.id);
        if (cached) {
            await this.draw(ev, cached.value, cached.label, cached.isError, cached.icon);
            return;
        }
        const settings = (ev.payload?.settings ?? {}) as FetcherSettings;
        let label = settings.label || "Fetcher";
        if (!settings.label && settings.url) {
            try {
                label = new URL(settings.url).hostname;
            } catch {
                /* keep default */
            }
        }
        await this.draw(ev, "Loading", label, false, settings.icon || "none");
    }

    private async draw(ev: any, value: string, label: string, isError: boolean, icon: string): Promise<void> {
        const themeColor = ev.payload?.settings?.themeColor || "cyan";
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

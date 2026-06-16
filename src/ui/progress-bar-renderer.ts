import {
    Server,
    Database,
    Cloud,
    Cpu,
    HardDrive,
    Globe,
    Activity,
    Bell,
    Check,
    AlertTriangle,
    Clock,
    DollarSign,
    Euro,
    Percent,
    User,
    Heart,
    Star,
    Eye,
    Lock,
    Key,
    Settings,
    Wifi,
    RotateCw,
    Terminal,
    Code2,
    Info,
    HelpCircle,
    Search,
    Play,
    Pause,
    Square,
    Shield,
    Thermometer,
    Sun,
    Moon,
    TrendingUp,
    TrendingDown,
    Download,
    Upload,
    Mail,
    Phone,
    MapPin,
    Volume2,
    Battery,
    Trash2,
    Edit3
} from "lucide";

const lucideIcons: Record<string, any[]> = {
    server: Server,
    database: Database,
    cloud: Cloud,
    cpu: Cpu,
    hardDrive: HardDrive,
    globe: Globe,
    activity: Activity,
    bell: Bell,
    check: Check,
    alert: AlertTriangle,
    clock: Clock,
    dollar: DollarSign,
    euro: Euro,
    percent: Percent,
    user: User,
    heart: Heart,
    star: Star,
    eye: Eye,
    lock: Lock,
    key: Key,
    settings: Settings,
    wifi: Wifi,
    rotateCw: RotateCw,
    terminal: Terminal,
    code: Code2,
    info: Info,
    help: HelpCircle,
    search: Search,
    play: Play,
    pause: Pause,
    square: Square,
    shield: Shield,
    thermometer: Thermometer,
    sun: Sun,
    moon: Moon,
    trendingUp: TrendingUp,
    trendingDown: TrendingDown,
    download: Download,
    upload: Upload,
    mail: Mail,
    phone: Phone,
    mapPin: MapPin,
    volume: Volume2,
    battery: Battery,
    trash: Trash2,
    edit: Edit3
};

const themeGradients: Record<string, { start: string; stop: string }> = {
    cyan: { start: "#06b6d4", stop: "#3b82f6" },
    purple: { start: "#a855f7", stop: "#6366f1" },
    green: { start: "#10b981", stop: "#059669" },
    red: { start: "#ef4444", stop: "#dc2626" },
    orange: { start: "#f97316", stop: "#ea580c" },
    pink: { start: "#ec4899", stop: "#db2777" },
    blue: { start: "#2563eb", stop: "#1d4ed8" },
    yellow: { start: "#eab308", stop: "#ca8a04" },
    gray: { start: "#94a3b8", stop: "#475569" },
    white: { start: "#f8fafc", stop: "#cbd5e1" }
};

export class ProgressBarRenderer {
    render(
        value: string,
        label: string,
        isError: boolean,
        icon: string,
        themeColor: string,
        width: number,
        height: number
    ): string {
        const isDial = width === 200 && height === 100;
        const body = isDial
            ? this.renderDial(value, label, isError, icon, themeColor)
            : this.renderKey(value, label, isError, icon, themeColor);
        return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">${body}</svg>`;
    }

    private renderKey(value: string, label: string, isError: boolean, icon: string, themeColor: string): string {
        const colors = themeGradients[themeColor] || themeGradients.cyan;
        const bgGrad = this.bgGradient(colors);
        const neonGrad = isError
            ? `<linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ef4444" /><stop offset="100%" stop-color="#f43f5e" /></linearGradient>`
            : `<linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors.start}" /><stop offset="100%" stop-color="${colors.stop}" /></linearGradient>`;
        
        let elements = `<defs>${bgGrad}${neonGrad}</defs>`;
        elements += `<rect width="144" height="144" fill="url(#bg)" />`;
        
        const hasLabel = label.trim().length > 0;
        if (hasLabel) {
            const escapedLabel = this.escape(label.toUpperCase());
            elements += `<text x="72" y="28" font-family="system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="#94a3b8" text-anchor="middle">${escapedLabel}</text>`;
        }

        const centerY = hasLabel ? 82 : 72;
        elements += this.renderContent(value, isError, icon, colors, {
            cx: 72,
            centerY,
            minX: 10,
            maxWidth: 130,
            maxFont: 32,
            minFont: 10,
            iconSize: 24,
            iconGap: 6,
            maxHeight: hasLabel ? 92 : 120,
            lineHeightFactor: 1.15,
        });
        return elements;
    }

    private renderDial(value: string, label: string, isError: boolean, icon: string, themeColor: string): string {
        const colors = themeGradients[themeColor] || themeGradients.cyan;
        const bgGrad = this.bgGradient(colors);
        const neonGrad = isError
            ? `<linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ef4444" /><stop offset="100%" stop-color="#f43f5e" /></linearGradient>`
            : `<linearGradient id="neon" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${colors.start}" /><stop offset="100%" stop-color="${colors.stop}" /></linearGradient>`;
        
        let elements = `<defs>${bgGrad}${neonGrad}</defs>`;
        elements += `<rect width="200" height="100" fill="url(#bg)" />`;
        
        const hasLabel = label.trim().length > 0;
        if (hasLabel) {
            const escapedLabel = this.escape(label.toUpperCase());
            elements += `<text x="100" y="28" font-family="system-ui, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5" fill="#94a3b8" text-anchor="middle">${escapedLabel}</text>`;
        }

        const centerY = hasLabel ? 64 : 50;
        elements += this.renderContent(value, isError, icon, colors, {
            cx: 100,
            centerY,
            minX: 15,
            maxWidth: 180,
            maxFont: 38,
            minFont: 12,
            iconSize: 30,
            iconGap: 8,
            maxHeight: hasLabel ? 60 : 84,
            lineHeightFactor: 1.15,
        });
        return elements;
    }

    private renderContent(
        value: string,
        isError: boolean,
        icon: string,
        colors: { start: string; stop: string },
        geo: {
            cx: number;
            centerY: number;
            minX: number;
            maxWidth: number;
            maxFont: number;
            minFont: number;
            iconSize: number;
            iconGap: number;
            maxHeight: number;
            lineHeightFactor: number;
        }
    ): string {
        const charW = 0.62;
        const valueColor = isError ? "#ef4444" : colors.start;
        const hasIcon = !!icon && icon !== "none" && lucideIcons[icon] !== undefined;

        const explicit = value.replace(/\\n/g, "\n").split("\n").map((s) => s.trim());

        let fontSize = geo.maxFont;
        let lines: string[] = explicit;
        while (true) {
            const reserved = hasIcon && explicit.length === 1 ? geo.iconSize + geo.iconGap : 0;
            const avail = geo.maxWidth - reserved;
            lines = [];
            for (const ln of explicit) {
                for (const w of this.wrapLine(ln, avail, fontSize, charW)) {
                    lines.push(w);
                }
            }
            const widthBudget = geo.maxWidth - (hasIcon && lines.length === 1 ? geo.iconSize + geo.iconGap : 0);
            const widest = lines.reduce((m, l) => Math.max(m, l.length * fontSize * charW), 0);
            const height = lines.length * fontSize * geo.lineHeightFactor;
            if ((widest <= widthBudget && height <= geo.maxHeight) || fontSize <= geo.minFont) {
                break;
            }
            fontSize--;
        }

        if (hasIcon && lines.length === 1) {
            const text = lines[0];
            const textW = text.length * fontSize * charW;
            const totalW = geo.iconSize + geo.iconGap + textW;
            const startX = Math.max(geo.minX, geo.cx - totalW / 2);
            const iconColor = isError ? "#ef4444" : colors.start;
            const iconSvg = this.getIcon(icon, geo.iconSize, iconColor);
            const iconY = geo.centerY - geo.iconSize / 2;
            const textX = startX + geo.iconSize + geo.iconGap;
            const textY = geo.centerY + fontSize * 0.35;
            return `<g transform="translate(${this.round(startX)} ${this.round(iconY)})">${iconSvg}</g>`
                + `<text x="${this.round(textX)}" y="${this.round(textY)}" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="${valueColor}" text-anchor="start">${this.escape(text)}</text>`;
        }

        const lineHeight = fontSize * geo.lineHeightFactor;
        const totalH = lines.length * lineHeight;
        let out = "";
        for (let i = 0; i < lines.length; i++) {
            const y = geo.centerY - totalH / 2 + lineHeight * (i + 0.5) + fontSize * 0.35;
            out += `<text x="${geo.cx}" y="${this.round(y)}" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="${valueColor}" text-anchor="middle">${this.escape(lines[i])}</text>`;
        }
        return out;
    }

    private wrapLine(line: string, maxWidth: number, fontSize: number, charW: number): string[] {
        if (line === "") return [""];
        const maxChars = Math.max(1, Math.floor(maxWidth / (fontSize * charW)));
        const words = line.split(/\s+/).filter(Boolean);
        if (words.length === 0) return [""];
        const out: string[] = [];
        let cur = "";
        for (const w of words) {
            if (!cur) {
                cur = w;
            } else if ((cur + " " + w).length <= maxChars) {
                cur += " " + w;
            } else {
                out.push(cur);
                cur = w;
            }
        }
        if (cur) out.push(cur);
        return out;
    }

    private escape(s: string): string {
        return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    }

    private getIcon(name: string, size: number, color: string): string {
        const iconNode = lucideIcons[name];
        if (!iconNode) return "";
        
        const pathContent = iconNode.map(([tag, attrs]) => {
            const attrStr = Object.entries(attrs)
                .map(([k, v]) => `${k}="${v}"`)
                .join(" ");
            const fill = attrs.fill === "currentColor" ? color : (attrs.fill || "none");
            const stroke = attrs.stroke === "currentColor" ? color : (attrs.stroke || color);
            return `<${tag} ${attrStr} fill="${fill}" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />`;
        }).join("");

        const scale = this.round(size / 24);
        return `<g transform="scale(${scale})">${pathContent}</g>`;
    }

    private round(n: number): number {
        return Math.round(n * 100) / 100;
    }

    private bgGradient(colors: { start: string; stop: string }): string {
        const start = this.darken(colors.start, 0.16);
        const stop = this.darken(colors.stop, 0.1);
        return `<linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="${start}" /><stop offset="100%" stop-color="${stop}" /></linearGradient>`;
    }

    private darken(hex: string, factor: number): string {
        const h = hex.replace("#", "");
        const ch = (i: number) => {
            const v = Math.round(parseInt(h.slice(i, i + 2), 16) * factor);
            return Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
        };
        return `#${ch(0)}${ch(2)}${ch(4)}`;
    }
}

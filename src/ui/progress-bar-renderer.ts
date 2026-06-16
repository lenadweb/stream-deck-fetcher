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
        
        const escapedLabel = this.escape(label.toUpperCase());
        elements += `<text x="72" y="28" font-family="system-ui, sans-serif" font-size="10" font-weight="700" letter-spacing="1" fill="#94a3b8" text-anchor="middle">${escapedLabel}</text>`;
        
        const hasIcon = icon && icon !== "none" && lucideIcons[icon] !== undefined;
        const textLimit = hasIcon ? 100 : 130;
        const maxFontSize = 32;
        const fontSize = Math.max(12, Math.min(maxFontSize, Math.floor(textLimit / (value.length * 0.55 || 1))));
        const escapedValue = this.escape(value);
        const valueColor = isError ? "#ef4444" : colors.start;
        
        if (hasIcon) {
            const iconSize = 24;
            const gap = 6;
            const textW = value.length * fontSize * 0.55;
            const totalW = iconSize + gap + textW;
            const startX = Math.max(10, 72 - totalW / 2);
            
            const iconColor = isError ? "#ef4444" : colors.start;
            const iconSvg = this.getIcon(icon, iconSize, iconColor);
            const iconY = 82 - iconSize / 2;
            elements += `<g transform="translate(${this.round(startX)} ${this.round(iconY)})">${iconSvg}</g>`;
            
            const textX = startX + iconSize + gap;
            const textY = 82 + fontSize * 0.35;
            elements += `<text x="${this.round(textX)}" y="${this.round(textY)}" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="${valueColor}" text-anchor="start">${escapedValue}</text>`;
        } else {
            const textY = 82 + fontSize * 0.35;
            elements += `<text x="72" y="${this.round(textY)}" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="${valueColor}" text-anchor="middle">${escapedValue}</text>`;
        }
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
        
        const escapedLabel = this.escape(label.toUpperCase());
        elements += `<text x="100" y="28" font-family="system-ui, sans-serif" font-size="11" font-weight="700" letter-spacing="1.5" fill="#94a3b8" text-anchor="middle">${escapedLabel}</text>`;
        
        const hasIcon = icon && icon !== "none" && lucideIcons[icon] !== undefined;
        const textLimit = hasIcon ? 142 : 180;
        const maxFontSize = 38;
        const fontSize = Math.max(14, Math.min(maxFontSize, Math.floor(textLimit / (value.length * 0.55 || 1))));
        const escapedValue = this.escape(value);
        const valueColor = isError ? "#ef4444" : colors.start;
        
        if (hasIcon) {
            const iconSize = 30;
            const gap = 8;
            const textW = value.length * fontSize * 0.55;
            const totalW = iconSize + gap + textW;
            const startX = Math.max(15, 100 - totalW / 2);
            
            const iconColor = isError ? "#ef4444" : colors.start;
            const iconSvg = this.getIcon(icon, iconSize, iconColor);
            const iconY = 64 - iconSize / 2;
            elements += `<g transform="translate(${this.round(startX)} ${this.round(iconY)})">${iconSvg}</g>`;
            
            const textX = startX + iconSize + gap;
            const textY = 64 + fontSize * 0.35;
            elements += `<text x="${this.round(textX)}" y="${this.round(textY)}" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="${valueColor}" text-anchor="start">${escapedValue}</text>`;
        } else {
            const textY = 64 + fontSize * 0.35;
            elements += `<text x="100" y="${this.round(textY)}" font-family="system-ui, sans-serif" font-size="${fontSize}" font-weight="700" fill="${valueColor}" text-anchor="middle">${escapedValue}</text>`;
        }
        return elements;
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

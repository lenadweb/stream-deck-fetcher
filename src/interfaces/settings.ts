export interface FetcherSettings {
    url?: string;
    mode?: string;
    jsonPath?: string;
    selector?: string;
    label?: string;
    icon?: string;
    themeColor?: string;
    formatter?: string;
    headers?: string;
    pulling?: number;
    [key: string]: any;
}

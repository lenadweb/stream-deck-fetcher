export interface FetcherSettings {
    url?: string;
    jsonPath?: string;
    label?: string;
    icon?: string;
    themeColor?: string;
    formatter?: string;
    headers?: string;
    pulling?: number;
    [key: string]: any;
}

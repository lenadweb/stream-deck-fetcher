export interface FetcherSettings {
    url?: string;
    method?: string;
    body?: string;
    mode?: string;
    jsonPath?: string;
    selector?: string;
    script?: string;
    label?: string;
    icon?: string;
    themeColor?: string;
    fontSize?: string;
    formatter?: string;
    headers?: string;
    pulling?: number;
    [key: string]: any;
}

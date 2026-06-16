# Fetcher: JSON & HTML Monitor

A generic Stream Deck plugin that fetches a JSON payload from any HTTP/HTTPS endpoint, extracts a value via a JSON path, and displays it on keys and dials.

## Features

- **Two source types** — extract a value from a **JSON** response via a path, or from an **HTML** page via a CSS selector.
- **Keys and dials** — renders on standard keys (144×144) and Stream Deck+ encoders/dials (200×100).
- **JSON path resolution** — reads nested keys and array elements, e.g. `data.users[0].status`.
- **HTML selector extraction** — reads the first matching element's text, or an attribute via `selector@attr`.
- **Custom headers** — send authentication or other headers as a JSON object.
- **Value formatting** — integer, percentage, currency (USD/EUR), abbreviation (k/M), boolean status, upper/lowercase.
- **Icons and themes** — 45+ built-in icons and 10 color themes.
- **Polling with caching** — configurable interval; responses are cached and de-duplicated so multiple keys pointing at the same endpoint share a single request.
- **Manual refresh** — press a key, push/rotate a dial, or tap the touchscreen.

## Configuration

The Property Inspector is organised into three tabs:

**Data**

| Setting | Description |
| --- | --- |
| **URL** | HTTP/HTTPS endpoint to fetch. |
| **Source Type** | `JSON` to parse a JSON payload, or `HTML` to scrape a web page. |
| **JSON Path** | (JSON) Dot/bracket path to the value, e.g. `data.value` or `items[0].name`. |
| **CSS Selector** | (HTML) Selector for the value, e.g. `.price`. Append `@attr` to read an attribute, e.g. `meta[name=price]@content`. |

**Display**

| Setting | Description |
| --- | --- |
| **Label** | Custom label. If empty, no label is shown. |
| **Format** | How the resolved value is displayed. |
| **Icon** | Optional icon shown beside the value. |
| **Theme Color** | Accent color for the rendered tile. |

**Advanced**

| Setting | Description |
| --- | --- |
| **Headers** | Optional JSON object of request headers, e.g. `{"Authorization": "Bearer token"}`. |
| **Refresh Interval** | Polling interval in seconds (minimum 5, default 43200 = 12 hours). |

## Examples

See [EXAMPLES.md](EXAMPLES.md) for 100+ ready-to-use recipes — crypto & stock prices, GitHub stars, npm/Docker stats, live game players, weather & air quality, space data, service status, homelab metrics, and more.

## Development

```bash
npm install
npm run build      # one-off build
npm run watch      # rebuild and restart the plugin on change
```

## License

[MIT](LICENSE) © lenadweb
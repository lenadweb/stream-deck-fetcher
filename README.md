# JSON Fetcher — Stream Deck Plugin

A generic Stream Deck plugin that fetches a JSON payload from any HTTP/HTTPS endpoint, extracts a value via a JSON path, and displays it on keys and dials.

## Features

- **Keys and dials** — renders on standard keys (144×144) and Stream Deck+ encoders/dials (200×100).
- **JSON path resolution** — reads nested keys and array elements, e.g. `data.users[0].status`.
- **Custom headers** — send authentication or other headers as a JSON object.
- **Value formatting** — integer, percentage, currency (USD/EUR), abbreviation (k/M), boolean status, upper/lowercase.
- **Icons and themes** — 45+ built-in icons and 10 color themes.
- **Polling with caching** — configurable interval; responses are cached and de-duplicated so multiple keys pointing at the same endpoint share a single request.
- **Manual refresh** — press a key, push/rotate a dial, or tap the touchscreen.

## Configuration

Open the Property Inspector for the action and set:

| Setting | Description |
| --- | --- |
| **URL** | HTTP/HTTPS endpoint returning a JSON payload. |
| **Headers** | Optional JSON object of request headers, e.g. `{"Authorization": "Bearer token"}`. |
| **JSON Path** | Dot/bracket path to the value, e.g. `data.value` or `items[0].name`. |
| **Label** | Custom label. If empty, the URL hostname is used. |
| **Interval (s)** | Polling interval in seconds (minimum 5, default 43200 = 12 hours). |
| **Theme Color** | Accent color for the rendered tile. |
| **Format** | How the resolved value is displayed. |
| **Icon** | Optional icon shown beside the value. |

## Development

```bash
npm install
npm run build      # one-off build
npm run watch      # rebuild and restart the plugin on change
```

## License

[MIT](LICENSE) © lenadweb

Source: https://github.com/lenadweb/stream-deck-json-fetcher

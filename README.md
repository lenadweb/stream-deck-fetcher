# Fetcher: JSON & HTML Monitor

A generic Stream Deck plugin that fetches a JSON payload from any HTTP/HTTPS endpoint, extracts a value via a JSON path, and displays it on keys and dials.

## Features

- **Three source types** — extract a value from a **JSON** response via a path, from an **HTML** page via a CSS selector, or from either with a **custom JS handler**.
- **Keys and dials** — renders on standard keys (144×144) and Stream Deck+ encoders/dials (200×100).
- **JSON path resolution** — reads nested keys and array elements, e.g. `data.users[0].status`.
- **HTML selector extraction** — reads the first matching element's text, or an attribute via `selector@attr`.
- **JS handlers** — a small sandboxed function for anything a path can't express: rank in a list, counts, filtering, arithmetic across fields.
- **Custom headers** — send authentication or other headers as a JSON object.
- **Value formatting** — integer, percentage, currency (USD/EUR), abbreviation (k/M), boolean status, upper/lowercase.
- **Icons and themes** — 45+ built-in icons, 10 color themes, and five value sizes.
- **Polling with caching** — configurable interval; responses are cached and de-duplicated so multiple keys pointing at the same endpoint share a single request.
- **Manual refresh** — press a key, push/rotate a dial, or tap the touchscreen.
- **Test button** — try the URL and extraction from the Property Inspector and see the value (or the error) before leaving the panel.

## Configuration

The Property Inspector is organised into three tabs:

**Data**

| Setting | Description |
| --- | --- |
| **URL** | HTTP/HTTPS endpoint to fetch. |
| **Source Type** | `JSON` to parse a JSON payload, `HTML` to scrape a web page, or `JS` for a custom handler. |
| **JSON Path** | (JSON) Dot/bracket path to the value, e.g. `data.value` or `items[0].name`. |
| **CSS Selector** | (HTML) Selector for the value, e.g. `.price`. Append `@attr` to read an attribute, e.g. `meta[name=price]@content`. |
| **Handler** | (JS) A function taking `response` and returning the text to display. See [JS handlers](#js-handlers) below. |
| **Test** | Fetches the URL and runs the current extraction, showing the resulting value or the error inline. Works in all three modes and reuses a response for 30 s, so iterating on a handler doesn't re-hit the endpoint. |

**Display**

| Setting | Description |
| --- | --- |
| **Label** | Custom label. If empty, no label is shown. |
| **Format** | How the resolved value is displayed. |
| **Value Size** | Starting font size for the value, from Extra Small to Extra Large. Long values still shrink to fit. |
| **Icon** | Optional icon shown beside the value. |
| **Theme Color** | Accent color for the rendered tile. |

**Advanced**

| Setting | Description |
| --- | --- |
| **Headers** | Optional JSON object of request headers, e.g. `{"Authorization": "Bearer token"}`. |
| **Refresh Interval** | Polling interval in seconds (minimum 5, default 43200 = 12 hours). |

## JS handlers

When a path or a selector isn't enough, switch **Source Type** to `JS` and write a handler:

```js
// "what place am I in?" — the rank of a name among its neighbours
function handler(response) {
  const names = response.querySelectorAll('td.name').map(e => e.text.trim());
  return names.indexOf('nightowl') + 1;
}
```

- `response` is the **parsed JSON object** when the response body is JSON, and the **HTML root** otherwise — with `querySelector()`, `querySelectorAll()`, `.text`, `.textContent` and `.getAttribute()`.
- For HTML, `querySelector()`, `querySelectorAll()` and `document` are also available as bare globals, so browser-console habits carry over. `querySelectorAll()` returns a plain array — no `Array.from()` needed.
- `.textContent` keeps the whitespace around it in the markup; use `.text.trim()` or `.textContent.trim()` when comparing strings.
- Return the value to display. Label, icon and color stay under your control on the **Display** tab.
- Any function shape works: a named `function handler(response)`, an anonymous `function (response)`, or an arrow `response => …`. Define helpers alongside a named `handler` if you need them.
- The chosen **Format** is applied to the returned value; use `As Is` when the handler already formats it.
- `console.log` goes to the plugin log.

Handlers run in a `node:vm` context: synchronous only, no network and no filesystem access, aborted after 300 ms so a runaway loop can't hang the plugin. They are your own code, though — and because they live in the key's settings, they travel with an exported profile. Read a handler before importing a profile from someone else.

See [EXAMPLES.md](EXAMPLES.md#-js-mode-custom-handlers) for more recipes.

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
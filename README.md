# JSON Fetcher - Stream Deck Plugin

Generic Stream Deck plugin to fetch JSON payloads from a URL and extract a specific value using a JSON path to display it on Stream Deck keys and dials.

## Features

- **Keys and Dials**: Displays the fetched value on standard keys (144x144) and Stream Deck+ encoders/dials (200x100).
- **JSON Path Resolution**: Resolves nested keys and array elements (e.g. `data.users[0].status`).
- **Dynamic Progress Bar**: Option to render a sleek, circular (key) or horizontal (dial) progress bar if the value is a number.
- **Customizable Labels**: Label keys with custom text or let the plugin auto-generate the label from the URL hostname.

## Configuration

In the Stream Deck Property Inspector, configure the following settings:

1. **URL**: The HTTP/HTTPS endpoint returning a JSON payload.
2. **JSON Path**: The dot-notation path to the value (e.g. `data.value`).
3. **Label**: Override label text. If empty, the URL domain name is used.
4. **Show Progress**: If checked, and the resolved value is a number, a progress bar/circular ring is drawn.
5. **Max Value**: Used to calculate progress percentage (Default: 100).

## Development

```bash
npm install
npm run build
npm run watch
```

# Examples

A collection of real, useful things you can put on a key or dial with JSON Fetcher.

Each example lists the **Source Type** (JSON path or HTML selector), the **URL**, the field to extract, and a suggested **Format** / **Icon**. Replace placeholders like `<owner>/<repo>`, `<user>`, `<pkg>`, `<token>` with your own values.

> Tip: the default refresh interval is 12 hours. Lower it (e.g. 30–300 s) for volatile data like prices, and keep it high for slow-moving stats to respect rate limits.

---

## ⭐ GitHub

**Repository stars**
- URL: `https://api.github.com/repos/<owner>/<repo>`
- JSON Path: `stargazers_count` · Format: Abbreviate · Icon: Star

**Repository forks**
- URL: `https://api.github.com/repos/<owner>/<repo>`
- JSON Path: `forks_count` · Format: Abbreviate · Icon: Code

**Open issues + PRs**
- URL: `https://api.github.com/repos/<owner>/<repo>`
- JSON Path: `open_issues_count` · Format: Integer · Icon: Alert

**Watchers**
- URL: `https://api.github.com/repos/<owner>/<repo>`
- JSON Path: `subscribers_count` · Format: Integer · Icon: Eye

**Latest release tag**
- URL: `https://api.github.com/repos/<owner>/<repo>/releases/latest`
- JSON Path: `tag_name` · Format: As Is · Icon: Sync

**Your follower count**
- URL: `https://api.github.com/users/<user>`
- JSON Path: `followers` · Format: Abbreviate · Icon: User

> GitHub allows 60 unauthenticated requests/hour. For higher limits add a token in **Headers**: `{"Authorization": "Bearer <token>"}`.

---

## 💰 Crypto & Finance

**Bitcoin price (USD)**
- URL: `https://api.coinbase.com/v2/prices/BTC-USD/spot`
- JSON Path: `data.amount` · Format: Currency USD · Icon: Dollar

**Ethereum price (USD)**
- URL: `https://api.coinbase.com/v2/prices/ETH-USD/spot`
- JSON Path: `data.amount` · Format: Currency USD · Icon: Trending Up

**Bitcoin 24h change**
- URL: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`
- JSON Path: `bitcoin.usd_24h_change` · Format: Percentage · Icon: Activity

**Crypto Fear & Greed Index**
- URL: `https://api.alternative.me/fng/`
- JSON Path: `data[0].value` · Format: Integer · Icon: Activity

**Fear & Greed label** (e.g. "Greed")
- URL: `https://api.alternative.me/fng/`
- JSON Path: `data[0].value_classification` · Format: Uppercase · Icon: Info

**USD → EUR exchange rate**
- URL: `https://api.frankfurter.app/latest?from=USD&to=EUR`
- JSON Path: `rates.EUR` · Format: As Is · Icon: Euro

> Swap `from`/`to` for any fiat pair, e.g. `?from=EUR&to=GBP` → `rates.GBP`.

---

## 📦 Package Registries

**npm weekly downloads**
- URL: `https://api.npmjs.org/downloads/point/last-week/<pkg>`
- JSON Path: `downloads` · Format: Abbreviate · Icon: Download

**npm latest version**
- URL: `https://registry.npmjs.org/<pkg>/latest`
- JSON Path: `version` · Format: As Is · Icon: Code

**PyPI latest version**
- URL: `https://pypi.org/pypi/<pkg>/json`
- JSON Path: `info.version` · Format: As Is · Icon: Code

**PyPI weekly downloads**
- URL: `https://pypistats.org/api/packages/<pkg>/recent`
- JSON Path: `data.last_week` · Format: Abbreviate · Icon: Download

**Docker Hub pulls**
- URL: `https://hub.docker.com/v2/repositories/<owner>/<repo>/`
- JSON Path: `pull_count` · Format: Abbreviate · Icon: Cloud

**Docker Hub stars**
- URL: `https://hub.docker.com/v2/repositories/<owner>/<repo>/`
- JSON Path: `star_count` · Format: Integer · Icon: Star

---

## 🌦️ Weather (no API key — Open-Meteo)

> Coordinates below are Berlin (`52.52, 13.41`). Replace with your own.

**Current temperature**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m`
- JSON Path: `current.temperature_2m` · Format: Integer · Icon: Thermometer

**Wind speed**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=wind_speed_10m`
- JSON Path: `current.wind_speed_10m` · Format: Integer · Icon: Activity

**Relative humidity**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=relative_humidity_2m`
- JSON Path: `current.relative_humidity_2m` · Format: Percentage · Icon: Cloud

**Is it daytime?**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=is_day`
- JSON Path: `current.is_day` · Format: On / Off · Icon: Sun

---

## 🟢 Status & Uptime

**GitHub system status**
- URL: `https://www.githubstatus.com/api/v2/status.json`
- JSON Path: `status.description` · Format: As Is · Icon: Shield

**Any Statuspage.io service** (Cloudflare, Discord, OpenAI, Reddit…)
- URL: `https://<service>.statuspage.io/api/v2/status.json`
- JSON Path: `status.indicator` (`none` / `minor` / `major`) · Format: Uppercase · Icon: Shield

**Cloudflare status**
- URL: `https://www.cloudflarestatus.com/api/v2/status.json`
- JSON Path: `status.description` · Format: As Is · Icon: Cloud

---

## 🏠 Self-Hosted / Homelab

**Home Assistant — sensor state** (e.g. a temperature sensor)
- URL: `https://<ha-host>/api/states/sensor.<entity>`
- JSON Path: `state` · Format: As Is · Icon: Thermometer
- Headers: `{"Authorization": "Bearer <long-lived-token>"}`

**Home Assistant — device attribute** (e.g. battery level)
- URL: `https://<ha-host>/api/states/sensor.<entity>`
- JSON Path: `attributes.battery_level` · Format: Percentage · Icon: Battery
- Headers: `{"Authorization": "Bearer <long-lived-token>"}`

**Prometheus — instant query** (e.g. node up, CPU, memory)
- URL: `https://<prometheus>/api/v1/query?query=up`
- JSON Path: `data.result[0].value[1]` · Format: As Is · Icon: Activity

**Pi-hole — queries today**
- URL: `http://pi.hole/admin/api.php`
- JSON Path: `dns_queries_today` · Format: Abbreviate · Icon: Shield

**Pi-hole — % of ads blocked**
- URL: `http://pi.hole/admin/api.php`
- JSON Path: `ads_percentage_today` · Format: Percentage · Icon: Shield

**Pi-hole — enabled/disabled**
- URL: `http://pi.hole/admin/api.php`
- JSON Path: `status` · Format: On / Off · Icon: Shield

---

## 👥 Social & Content

**Reddit — subreddit subscribers**
- URL: `https://www.reddit.com/r/<subreddit>/about.json`
- JSON Path: `data.subscribers` · Format: Abbreviate · Icon: User
- Headers: `{"User-Agent": "streamdeck-fetcher"}` (Reddit blocks empty user agents)

**Reddit — active users right now**
- URL: `https://www.reddit.com/r/<subreddit>/about.json`
- JSON Path: `data.active_user_count` · Format: Abbreviate · Icon: Activity

**YouTube — subscriber count**
- URL: `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=<channelId>&key=<apiKey>`
- JSON Path: `items[0].statistics.subscriberCount` · Format: Abbreviate · Icon: User

**Hacker News — story score**
- URL: `https://hacker-news.firebaseio.com/v0/item/<itemId>.json`
- JSON Path: `score` · Format: Integer · Icon: Trending Up

---

## 🌐 Network & Space

**Your public IP**
- URL: `https://api.ipify.org?format=json`
- JSON Path: `ip` · Format: As Is · Icon: Globe

**Your IP's country**
- URL: `https://ipapi.co/json/`
- JSON Path: `country_name` · Format: As Is · Icon: Map Pin

**ISS orbital velocity (km/h)**
- URL: `https://api.wheretheiss.at/v1/satellites/25544`
- JSON Path: `velocity` · Format: Integer · Icon: Activity

**ISS altitude (km)**
- URL: `https://api.wheretheiss.at/v1/satellites/25544`
- JSON Path: `altitude` · Format: Integer · Icon: Trending Up

---

## 🕸️ HTML Mode (CSS selectors)

Use **Source Type: HTML** when there is no API. The plugin returns the first matching element's text, or an attribute with `selector@attr`.

**Page title**
- URL: any page
- Selector: `title` · Format: As Is

**Open Graph title** (article/video headline)
- URL: any page
- Selector: `meta[property='og:title']@content` · Format: As Is

**Product price** (shops emitting Open Graph product tags)
- URL: a product page
- Selector: `meta[property='product:price:amount']@content` · Format: Currency USD · Icon: Dollar

**Hacker News — current top story**
- URL: `https://news.ycombinator.com/`
- Selector: `.titleline a` · Format: As Is · Icon: Info

**Generic price element on a page**
- URL: any page
- Selector: `.price` (or `#price`, `[data-price]`) · Format: Currency USD · Icon: Dollar

> HTML scraping is best-effort: if the site changes its markup, update the selector. Prefer a JSON API when one exists.

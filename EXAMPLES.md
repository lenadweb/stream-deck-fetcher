# Examples

100+ real, useful (and a few delightfully weird) things you can put on a Stream Deck key or dial with Fetcher: JSON & HTML Monitor.

Each entry lists the **URL**, the field to extract (**JSON Path** or **CSS Selector**), and a suggested **Format** / **Icon**. Replace placeholders like `<owner>/<repo>`, `<user>`, `<pkg>`, `<token>`, `<key>` with your own values.

**Notes that apply throughout**
- Most endpoints below need **no API key**. Where a key/token is required it is called out.
- The default refresh interval is 12 hours. Lower it (30–300 s) for live data like prices/players, keep it high for slow stats to respect rate limits.
- A few endpoints return a **bare number** (e.g. block height) — in that case leave **JSON Path empty**.
- "Random" endpoints (facts, jokes, quotes) return something new every fetch — fun on a short interval.

---

## 💰 Crypto

**Bitcoin price (USD)**
- URL: `https://api.coinbase.com/v2/prices/BTC-USD/spot`
- JSON Path: `data.amount` · Format: Currency USD · Icon: Dollar

**Ethereum price (USD)**
- URL: `https://api.coinbase.com/v2/prices/ETH-USD/spot`
- JSON Path: `data.amount` · Format: Currency USD · Icon: Trending Up

**Any coin price (CoinGecko)**
- URL: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd`
- JSON Path: `bitcoin.usd` · Format: Currency USD · Icon: Dollar

**Bitcoin 24h change**
- URL: `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true`
- JSON Path: `bitcoin.usd_24h_change` · Format: Percentage · Icon: Activity

**Total crypto market cap (USD)**
- URL: `https://api.coingecko.com/api/v3/global`
- JSON Path: `data.total_market_cap.usd` · Format: Abbreviate · Icon: Globe

**Crypto market cap 24h change**
- URL: `https://api.coingecko.com/api/v3/global`
- JSON Path: `data.market_cap_change_percentage_24h_usd` · Format: Percentage · Icon: Activity

**Bitcoin dominance**
- URL: `https://api.coingecko.com/api/v3/global`
- JSON Path: `data.market_cap_percentage.btc` · Format: Percentage · Icon: Percent

**Number of active cryptocurrencies**
- URL: `https://api.coingecko.com/api/v3/global`
- JSON Path: `data.active_cryptocurrencies` · Format: Abbreviate · Icon: Database

**#1 trending coin right now**
- URL: `https://api.coingecko.com/api/v3/search/trending`
- JSON Path: `coins[0].item.name` · Format: As Is · Icon: Trending Up

**Crypto Fear & Greed (value)**
- URL: `https://api.alternative.me/fng/?limit=1`
- JSON Path: `data[0].value` · Format: Integer · Icon: Activity

**Crypto Fear & Greed (label)**
- URL: `https://api.alternative.me/fng/?limit=1`
- JSON Path: `data[0].value_classification` · Format: Uppercase · Icon: Info

**BTC → USD exchange rate (Coinbase)**
- URL: `https://api.coinbase.com/v2/exchange-rates?currency=BTC`
- JSON Path: `data.rates.USD` · Format: Currency USD · Icon: Dollar

**Bitcoin price (Blockchain.info)**
- URL: `https://api.blockchain.info/stats`
- JSON Path: `market_price_usd` · Format: Currency USD · Icon: Dollar

**Bitcoin transactions today**
- URL: `https://api.blockchain.info/stats`
- JSON Path: `n_tx` · Format: Abbreviate · Icon: Activity

**Bitcoin block height**
- URL: `https://api.blockchain.info/stats`
- JSON Path: `n_blocks_total` · Format: Integer · Icon: Database

**Bitcoin network hash rate**
- URL: `https://api.blockchain.info/stats`
- JSON Path: `hash_rate` · Format: Abbreviate · Icon: CPU

**Recommended BTC fee (sat/vB)**
- URL: `https://mempool.space/api/v1/fees/recommended`
- JSON Path: `fastestFee` · Format: Integer · Icon: Activity

**Latest BTC block height (mempool)**
- URL: `https://mempool.space/api/blocks/tip/height`
- JSON Path: *(leave empty)* · Format: Integer · Icon: Database

---

## 📈 Stocks, Gold & FX

> Yahoo Finance is unofficial and may occasionally rate-limit — keep the interval modest.

**Stock price (e.g. AAPL)**
- URL: `https://query1.finance.yahoo.com/v8/finance/chart/AAPL`
- JSON Path: `chart.result[0].meta.regularMarketPrice` · Format: Currency USD · Icon: Trending Up

**Index / ETF (e.g. S&P 500 `^GSPC`)**
- URL: `https://query1.finance.yahoo.com/v8/finance/chart/%5EGSPC`
- JSON Path: `chart.result[0].meta.regularMarketPrice` · Format: Integer · Icon: Activity

**Gold spot (futures `GC=F`)**
- URL: `https://query1.finance.yahoo.com/v8/finance/chart/GC=F`
- JSON Path: `chart.result[0].meta.regularMarketPrice` · Format: Currency USD · Icon: Star

**52-week high (e.g. AAPL)**
- URL: `https://query1.finance.yahoo.com/v8/finance/chart/AAPL`
- JSON Path: `chart.result[0].meta.fiftyTwoWeekHigh` · Format: Currency USD · Icon: Trending Up

**USD → EUR exchange rate**
- URL: `https://api.frankfurter.dev/v1/latest?base=USD&symbols=EUR`
- JSON Path: `rates.EUR` · Format: As Is · Icon: Euro

**Any fiat pair (e.g. EUR → GBP)**
- URL: `https://api.frankfurter.dev/v1/latest?base=EUR&symbols=GBP`
- JSON Path: `rates.GBP` · Format: As Is · Icon: Dollar

---

## ⭐ GitHub

> Unauthenticated GitHub API allows 60 requests/hour. For more, add **Headers**: `{"Authorization": "Bearer <token>"}`.

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

**Your public repo count**
- URL: `https://api.github.com/users/<user>`
- JSON Path: `public_repos` · Format: Integer · Icon: Database

**Your remaining API rate limit**
- URL: `https://api.github.com/rate_limit`
- JSON Path: `resources.core.remaining` · Format: Integer · Icon: Activity

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

## 🎮 Gaming & Chess

**Live players in a Steam game** (appid `730` = CS2, `570` = Dota 2, `578080` = PUBG)
- URL: `https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/?appid=730`
- JSON Path: `response.player_count` · Format: Abbreviate · Icon: Activity

**Lichess blitz rating**
- URL: `https://lichess.org/api/user/<username>`
- JSON Path: `perfs.blitz.rating` · Format: Integer · Icon: Activity

**Lichess bullet rating**
- URL: `https://lichess.org/api/user/<username>`
- JSON Path: `perfs.bullet.rating` · Format: Integer · Icon: Play

**Pokémon base XP (just for fun)**
- URL: `https://pokeapi.co/api/v2/pokemon/pikachu`
- JSON Path: `base_experience` · Format: Integer · Icon: Star

---

## 🌦️ Weather & Air Quality (no key — Open-Meteo)

> Coordinates below are Berlin (`52.52, 13.41`). Replace with yours.

**Current temperature**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=temperature_2m`
- JSON Path: `current.temperature_2m` · Format: Integer · Icon: Thermometer

**Feels-like temperature**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=apparent_temperature`
- JSON Path: `current.apparent_temperature` · Format: Integer · Icon: Thermometer

**Wind speed**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=wind_speed_10m`
- JSON Path: `current.wind_speed_10m` · Format: Integer · Icon: Activity

**Relative humidity**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=relative_humidity_2m`
- JSON Path: `current.relative_humidity_2m` · Format: Percentage · Icon: Cloud

**Is it daytime?**
- URL: `https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&current=is_day`
- JSON Path: `current.is_day` · Format: On / Off · Icon: Sun

**Air quality (European AQI)**
- URL: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.52&longitude=13.41&current=european_aqi`
- JSON Path: `current.european_aqi` · Format: Integer · Icon: Cloud

**PM2.5 particulates**
- URL: `https://air-quality-api.open-meteo.com/v1/air-quality?latitude=52.52&longitude=13.41&current=pm2_5`
- JSON Path: `current.pm2_5` · Format: Integer · Icon: Alert

---

## ⚡ Energy, Earth & Sky

**UK grid carbon intensity (gCO₂/kWh)**
- URL: `https://api.carbonintensity.org.uk/intensity`
- JSON Path: `data[0].intensity.actual` · Format: Integer · Icon: Activity

**UK grid carbon level** (low / moderate / high)
- URL: `https://api.carbonintensity.org.uk/intensity`
- JSON Path: `data[0].intensity.index` · Format: Uppercase · Icon: Shield

**Earthquakes worldwide this week (M4.5+)**
- URL: `https://earthquake.usgs.gov/fdsnws/event/1/count?format=geojson&starttime=NOW-7days&minmagnitude=4.5`
- JSON Path: `count` · Format: Integer · Icon: Alert

**Today's sunrise time**
- URL: `https://api.sunrise-sunset.org/json?lat=52.52&lng=13.41&formatted=0`
- JSON Path: `results.sunrise` · Format: As Is · Icon: Sun

**Length of day (seconds)**
- URL: `https://api.sunrise-sunset.org/json?lat=52.52&lng=13.41&formatted=0`
- JSON Path: `results.day_length` · Format: Abbreviate · Icon: Clock

---

## 🚀 Space & Science

**People currently in space**
- URL: `http://api.open-notify.org/astros.json`
- JSON Path: `number` · Format: Integer · Icon: User

**ISS latitude (live)**
- URL: `http://api.open-notify.org/iss-now.json`
- JSON Path: `iss_position.latitude` · Format: As Is · Icon: Globe

**ISS longitude (live)**
- URL: `http://api.open-notify.org/iss-now.json`
- JSON Path: `iss_position.longitude` · Format: As Is · Icon: Map Pin

**ISS orbital speed (km/h)**
- URL: `https://api.wheretheiss.at/v1/satellites/25544`
- JSON Path: `velocity` · Format: Integer · Icon: Activity

**ISS altitude (km)**
- URL: `https://api.wheretheiss.at/v1/satellites/25544`
- JSON Path: `altitude` · Format: Integer · Icon: Trending Up

**Near-Earth asteroids passing today**
- URL: `https://api.nasa.gov/neo/rest/v1/feed/today?detailed=false&api_key=DEMO_KEY`
- JSON Path: `element_count` · Format: Integer · Icon: Alert
- Note: `DEMO_KEY` is shared/rate-limited — get a free key at api.nasa.gov.

---

## 🟢 Service Status

**GitHub system status**
- URL: `https://www.githubstatus.com/api/v2/status.json`
- JSON Path: `status.description` · Format: As Is · Icon: Shield

**Cloudflare status**
- URL: `https://www.cloudflarestatus.com/api/v2/status.json`
- JSON Path: `status.description` · Format: As Is · Icon: Cloud

**Any Statuspage.io service** (Discord, OpenAI, Reddit, Atlassian…)
- URL: `https://<service>.statuspage.io/api/v2/status.json`
- JSON Path: `status.indicator` (`none` / `minor` / `major`) · Format: Uppercase · Icon: Shield

---

## 🏠 Self-Hosted / Homelab

**Home Assistant — sensor state**
- URL: `https://<ha-host>/api/states/sensor.<entity>`
- JSON Path: `state` · Format: As Is · Icon: Thermometer
- Headers: `{"Authorization": "Bearer <long-lived-token>"}`

**Home Assistant — device battery**
- URL: `https://<ha-host>/api/states/sensor.<entity>`
- JSON Path: `attributes.battery_level` · Format: Percentage · Icon: Battery
- Headers: `{"Authorization": "Bearer <long-lived-token>"}`

**Prometheus — instant query** (CPU, memory, `up`, anything)
- URL: `https://<prometheus>/api/v1/query?query=up`
- JSON Path: `data.result[0].value[1]` · Format: As Is · Icon: Activity

**Pi-hole — DNS queries today**
- URL: `http://pi.hole/admin/api.php`
- JSON Path: `dns_queries_today` · Format: Abbreviate · Icon: Shield

**Pi-hole — % of ads blocked**
- URL: `http://pi.hole/admin/api.php`
- JSON Path: `ads_percentage_today` · Format: Percentage · Icon: Shield

**Pi-hole — enabled / disabled**
- URL: `http://pi.hole/admin/api.php`
- JSON Path: `status` · Format: On / Off · Icon: Shield

---

## 👥 Social & Content

**Reddit — subreddit subscribers**
- URL: `https://www.reddit.com/r/<subreddit>/about.json`
- JSON Path: `data.subscribers` · Format: Abbreviate · Icon: User
- Headers: `{"User-Agent": "streamdeck-fetcher"}` (Reddit blocks empty/blocked user agents)

**Reddit — users online now**
- URL: `https://www.reddit.com/r/<subreddit>/about.json`
- JSON Path: `data.active_user_count` · Format: Abbreviate · Icon: Activity

**YouTube — subscriber count**
- URL: `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=<channelId>&key=<apiKey>`
- JSON Path: `items[0].statistics.subscriberCount` · Format: Abbreviate · Icon: User

**Hacker News — story score**
- URL: `https://hacker-news.firebaseio.com/v0/item/<itemId>.json`
- JSON Path: `score` · Format: Integer · Icon: Trending Up

**Hacker News — current #1 story id**
- URL: `https://hacker-news.firebaseio.com/v0/topstories.json`
- JSON Path: `[0]` · Format: As Is · Icon: Info

---

## 🏆 Sports

**Formula 1 — next race name**
- URL: `https://api.jolpi.ca/ergast/f1/current/next.json`
- JSON Path: `MRData.RaceTable.Races[0].raceName` · Format: As Is · Icon: Activity

**Formula 1 — next race date**
- URL: `https://api.jolpi.ca/ergast/f1/current/next.json`
- JSON Path: `MRData.RaceTable.Races[0].date` · Format: As Is · Icon: Clock

**Premier League — current leader** (TheSportsDB free key `3`)
- URL: `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=4328&s=2024-2025`
- JSON Path: `table[0].strTeam` · Format: As Is · Icon: Star

**Premier League — leader's points**
- URL: `https://www.thesportsdb.com/api/v1/json/3/lookuptable.php?l=4328&s=2024-2025`
- JSON Path: `table[0].intPoints` · Format: Integer · Icon: Trending Up

---

## 🌍 World & Open Data

**Country population** (World Bank, e.g. US)
- URL: `https://api.worldbank.org/v2/country/US/indicator/SP.POP.TOTL?format=json&per_page=1&mrnev=1`
- JSON Path: `[1][0].value` · Format: Abbreviate · Icon: User

**Current time in a timezone**
- URL: `https://timeapi.io/api/Time/current/zone?timeZone=Europe/London`
- JSON Path: `time` · Format: As Is · Icon: Clock

**Day of the week somewhere**
- URL: `https://timeapi.io/api/Time/current/zone?timeZone=Asia/Tokyo`
- JSON Path: `dayOfWeek` · Format: As Is · Icon: Clock

**Next public holiday (by country)**
- URL: `https://date.nager.at/api/v3/NextPublicHolidays/US`
- JSON Path: `[0].name` · Format: As Is · Icon: Bell

**Next public holiday date**
- URL: `https://date.nager.at/api/v3/NextPublicHolidays/US`
- JSON Path: `[0].date` · Format: As Is · Icon: Clock

**Your public IP**
- URL: `https://api.ipify.org?format=json`
- JSON Path: `ip` · Format: As Is · Icon: Globe

**Your city (by IP)**
- URL: `https://ipinfo.io/json`
- JSON Path: `city` · Format: As Is · Icon: Map Pin

**Your ISP / network (by IP)**
- URL: `https://ipinfo.io/json`
- JSON Path: `org` · Format: As Is · Icon: WiFi

---

## 🎲 Fun & Random

**Random useless fact**
- URL: `https://uselessfacts.jsph.pl/api/v2/facts/random`
- JSON Path: `text` · Format: As Is · Icon: Info

**Random advice**
- URL: `https://api.adviceslip.com/advice`
- JSON Path: `slip.advice` · Format: As Is · Icon: Help

**Random cat fact**
- URL: `https://catfact.ninja/fact`
- JSON Path: `fact` · Format: As Is · Icon: Heart

**Random dog fact**
- URL: `https://dogapi.dog/api/v2/facts`
- JSON Path: `data[0].attributes.body` · Format: As Is · Icon: Heart

**Chuck Norris joke**
- URL: `https://api.chucknorris.io/jokes/random`
- JSON Path: `value` · Format: As Is · Icon: Star

**Random programming/pun joke**
- URL: `https://v2.jokeapi.dev/joke/Any?type=single`
- JSON Path: `joke` · Format: As Is · Icon: Code

**Kanye West wisdom**
- URL: `https://api.kanye.rest/`
- JSON Path: `quote` · Format: As Is · Icon: Star

**Trivia question of the moment**
- URL: `https://opentdb.com/api.php?amount=1&type=multiple`
- JSON Path: `results[0].question` · Format: As Is · Icon: Help

**Word definition (dictionary)**
- URL: `https://api.dictionaryapi.dev/api/v2/entries/en/serendipity`
- JSON Path: `[0].meanings[0].definitions[0].definition` · Format: As Is · Icon: Search

**Word pronunciation (IPA)**
- URL: `https://api.dictionaryapi.dev/api/v2/entries/en/serendipity`
- JSON Path: `[0].phonetic` · Format: As Is · Icon: Info

**Urban Dictionary definition**
- URL: `https://api.urbandictionary.com/v0/define?term=yolo`
- JSON Path: `list[0].definition` · Format: As Is · Icon: Search

**Predicted age for a name**
- URL: `https://api.agify.io?name=michael`
- JSON Path: `age` · Format: Integer · Icon: User

**Predicted gender for a name**
- URL: `https://api.genderize.io?name=alice`
- JSON Path: `gender` · Format: Uppercase · Icon: User

**Total breweries in the database**
- URL: `https://api.openbrewerydb.org/v1/breweries/meta`
- JSON Path: `total` · Format: Abbreviate · Icon: Database

**Wikipedia article summary** (e.g. Bitcoin)
- URL: `https://en.wikipedia.org/api/rest_v1/page/summary/Bitcoin`
- JSON Path: `extract` · Format: As Is · Icon: Info

---

## 🕸️ HTML Mode (CSS selectors)

Use **Source Type: HTML** when there is no API. The plugin returns the first matching element's text, or an attribute with `selector@attr`.

**Page title**
- URL: any page
- Selector: `title` · Format: As Is

**Open Graph title** (article / video headline)
- URL: any page
- Selector: `meta[property='og:title']@content` · Format: As Is

**Product price** (shops emitting Open Graph product tags)
- URL: a product page
- Selector: `meta[property='product:price:amount']@content` · Format: Currency USD · Icon: Dollar

**Hacker News — current top story headline**
- URL: `https://news.ycombinator.com/`
- Selector: `.titleline a` · Format: As Is · Icon: Info

**Generic price element on a page**
- URL: any page
- Selector: `.price` (or `#price`, `[data-price]`) · Format: Currency USD · Icon: Dollar

> HTML scraping is best-effort: if the site changes its markup, update the selector. Prefer a JSON API when one exists.

---

## 🧠 JS Mode (custom handlers)

Use **Source Type: JS** when a path or a selector can't express what you need — ranking, counting, filtering, arithmetic across several fields.

Write a function that takes `response` and returns what to show:

- `response` is the **parsed JSON object** when the body is JSON;
- otherwise it's the **HTML root**, with `querySelector()` / `querySelectorAll()`. Elements expose `.text`, `.getAttribute(name)`, `.innerHTML`.

Label, icon, color and format stay on the **Display** tab. Handlers are synchronous, have no network access, and are aborted after 300 ms. `console.log` goes to the plugin log.

**Your position in a leaderboard**
```js
function handler(response) {
  const names = response.querySelectorAll('td.name').map(e => e.text.trim());
  return names.indexOf('lenadweb') + 1;
}
```

**Position in a JSON list**
```js
function handler(response) {
  const index = response.results.findIndex(r => r.name === 'lenadweb');
  return index + 1;
}
```

**Count matching rows**
```js
function handler(response) {
  return response.querySelectorAll('tr.incident.open').length;
}
```

**Sum a column across a JSON array**
```js
function handler(response) {
  return response.items.reduce((total, i) => total + i.amount, 0);
}
```

**Filter, then count**
```js
function handler(response) {
  return response.results.filter(r => r.status === 'failed').length;
}
```

**Combine several fields**
```js
function handler(response) {
  return `${response.used}/${response.total}`;
}
```

**Percentage from two fields**
```js
function handler(response) {
  return Math.round(100 * response.used / response.total) + '%';
}
```

**The largest item's name**
```js
function handler(response) {
  return response.items.sort((a, b) => b.value - a.value)[0].name;
}
```

**Pull a number out of free text with a regex**
```js
function handler(response) {
  const m = response.querySelector('.summary').text.match(/(\d+)\s+online/);
  return m ? m[1] : 'N/A';
}
```

**How many components are down**
```js
function handler(response) {
  const down = response.components.filter(c => c.status !== 'operational').length;
  return down ? down + ' down' : 'OK';
}
```

**Time until a date**
```js
function handler(response) {
  const days = Math.ceil((new Date(response.launch_date) - Date.now()) / 86400000);
  return days + 'd';
}
```

**Helpers alongside a named handler**
```js
function pct(a, b) {
  return Math.round(100 * a / b) + '%';
}

function handler(response) {
  return pct(response.used, response.total);
}
```

> An arrow works too when it's a one-liner: `response => response.items.length`.
> Set **Format: As Is** when the handler already returns a formatted string — otherwise the chosen formatter runs on top of it.

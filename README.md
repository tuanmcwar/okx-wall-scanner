# OKX Wall Scanner V1

Node.js >= 18.

1. Copy `.env.example` to `.env` and fill `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`.
2. Run `npm install`.
3. Run `npm start`.

The scanner polls OKX USDT-settled linear SWAP order books, detects large levels relative to average notional within ±PRICE_RANGE_PERCENT of mid-price, and sends Telegram alerts immediately. Repeat history is in RAM only.

`SCAN_INTERVAL_MS` is the delay **after the complete scan**, not a fixed wall-clock schedule.

Order book values are resting liquidity snapshots, not filled trades. The CoinGlass URL is a convenience link and its OKX symbol format may vary depending on CoinGlass support.
# okx-wall-scanner

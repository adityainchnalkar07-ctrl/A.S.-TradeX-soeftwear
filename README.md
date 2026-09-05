# AS TradeX V1

Real-time crypto market analysis dashboard.

## V1 features

- Live BTC/USDT, ETH/USDT and SOL/USDT prices from Binance public WebSocket data
- Live price chart
- EMA 9 and EMA 20
- RSI 14
- Rule-based bullish / bearish / neutral market read
- Long Watch / Short Watch / Wait setup state
- Manual execution panel
- Responsive dark dashboard

## Run locally

Requirements: Node.js 20+

```bash
npm install
npm run dev
```

Open the local URL shown by Next.js.

## Deploy

Import this GitHub repository into Vercel. Vercel should detect the Next.js project automatically.

## Important

V1 is an analysis tool, not an automated trading bot. It does not place trades. Market data and signals can be delayed, incomplete, or wrong. This software is not financial advice.

## Roadmap

V2 can add exchange APIs, historical candles, multi-timeframe market structure, liquidity/volume analysis, configurable risk management, alerts, and an optional AI/LLM analysis layer.

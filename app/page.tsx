"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { createTickerStream, fetchKlines, type BinanceKline } from "../lib/binance";

const TradingChart = dynamic(() => import("../components/TradingChart"), { ssr: false });
const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT", "BNBUSDT", "XRPUSDT", "DOGEUSDT", "ADAUSDT", "AVAXUSDT"];
const intervals = ["1m", "5m", "15m", "1h", "4h", "1d"];

type Ticker = { price: number; change: number; high: number; low: number; volume: number };

function ema(values: number[], period: number) {
  if (!values.length) return 0;
  const k = 2 / (period + 1); let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}
function rsi(values: number[], period = 14) {
  if (values.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) { const d = values[i] - values[i - 1]; if (d >= 0) gains += d; else losses -= d; }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period); return 100 - 100 / (1 + rs);
}

export default function Home() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [interval, setIntervalValue] = useState("15m");
  const [candles, setCandles] = useState<BinanceKline[]>([]);
  const [ticker, setTicker] = useState<Ticker | null>(null);
  const [status, setStatus] = useState("CONNECTING");
  const [lastUpdate, setLastUpdate] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus("LOADING"); setCandles([]); setTicker(null);
    fetchKlines(symbol, interval, 300).then(data => { if (!cancelled) setCandles(data); }).catch(() => { if (!cancelled) setStatus("ERROR"); });
    const ws = createTickerStream(symbols);
    ws.onopen = () => { if (!cancelled) setStatus("LIVE"); };
    ws.onerror = () => { if (!cancelled) setStatus("ERROR"); };
    ws.onclose = () => { if (!cancelled) setStatus("OFFLINE"); };
    ws.onmessage = event => {
      try { const d = JSON.parse(event.data); const s = d.data?.s ?? d.s; if (s !== symbol) return; setTicker({ price:Number(d.data?.c ?? d.c), change:Number(d.data?.P ?? d.P), high:Number(d.data?.h ?? d.h), low:Number(d.data?.l ?? d.l), volume:Number(d.data?.v ?? d.v) }); setLastUpdate(Date.now()); } catch { /* ignore malformed stream messages */ }
    };
    const klineWs = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@kline_${interval}`);
    klineWs.onmessage = event => {
      try {
        const d = JSON.parse(event.data); const k = d.k;
        const candle: BinanceKline = { openTime:Number(k.t), open:Number(k.o), high:Number(k.h), low:Number(k.l), close:Number(k.c), volume:Number(k.v), closeTime:Number(k.T) };
        setCandles(prev => { const next = [...prev]; const i = next.findIndex(x => x.openTime === candle.openTime); if (i >= 0) next[i] = candle; else next.push(candle); return next.slice(-300); }); setLastUpdate(Date.now());
      } catch { /* ignore malformed kline */ }
    };
    klineWs.onerror = () => { if (!cancelled) setStatus("ERROR"); };
    return () => { cancelled = true; ws.close(); klineWs.close(); };
  }, [symbol, interval]);

  const closes = candles.map(c => c.close);
  const e9 = ema(closes, 9), e20 = ema(closes, 20), e50 = ema(closes, 50), r = rsi(closes);
  const trend = e9 > e20 && e20 > e50 ? "BULLISH" : e9 < e20 && e20 < e50 ? "BEARISH" : "NEUTRAL";
  const setup = useMemo(() => trend === "BULLISH" && r < 70 ? "LONG WATCH" : trend === "BEARISH" && r > 30 ? "SHORT WATCH" : "WAIT", [trend, r]);
  const price = ticker?.price ?? closes.at(-1) ?? 0;

  return <main className="shell">
    <header className="topbar"><div><div className="brand">AS <span>TradeX</span></div><div className="sub">REAL-TIME CRYPTO MARKET INTELLIGENCE</div></div><div className="status"><i className={status === "LIVE" ? "live" : ""}/>{status}</div></header>
    <section className="controls">{symbols.map(s => <button key={s} className={symbol === s ? "active" : ""} onClick={() => setSymbol(s)}>{s.replace("USDT", "/USDT")}</button>)}</section>
    <section className="controls">{intervals.map(i => <button key={i} className={interval === i ? "active" : ""} onClick={() => setIntervalValue(i)}>{i}</button>)}</section>
    <section className="grid">
      <div className="card chart-card"><div className="card-head"><b>{symbol.replace("USDT", "/USDT")}</b><strong>{price ? `$${price.toLocaleString(undefined,{maximumFractionDigits:2})}` : "—"}</strong></div><div className="chart"><TradingChart candles={candles}/></div></div>
      <div className="card"><h3>MARKET READ</h3><div className={`signal ${trend.toLowerCase()}`}>{trend}</div><p className="muted">Live exchange data with EMA trend alignment and RSI momentum context.</p><div className="metric"><span>SETUP</span><b>{setup}</b></div><div className="metric"><span>RSI (14)</span><b>{r.toFixed(1)}</b></div><div className="metric"><span>EMA 9</span><b>{e9 ? e9.toFixed(2) : "—"}</b></div><div className="metric"><span>EMA 20</span><b>{e20 ? e20.toFixed(2) : "—"}</b></div><div className="metric"><span>EMA 50</span><b>{e50 ? e50.toFixed(2) : "—"}</b></div></div>
      <div className="card"><h3>LIVE MARKET STATS</h3><div className="metric"><span>24H CHANGE</span><b>{ticker ? `${ticker.change.toFixed(2)}%` : "—"}</b></div><div className="metric"><span>24H HIGH</span><b>{ticker?.high ? `$${ticker.high.toLocaleString()}` : "—"}</b></div><div className="metric"><span>24H LOW</span><b>{ticker?.low ? `$${ticker.low.toLocaleString()}` : "—"}</b></div><div className="metric"><span>24H VOLUME</span><b>{ticker?.volume ? ticker.volume.toLocaleString(undefined,{maximumFractionDigits:0}) : "—"}</b></div><div className="metric"><span>LAST UPDATE</span><b>{lastUpdate ? new Date(lastUpdate).toLocaleTimeString() : "—"}</b></div></div>
    </section>
    <footer>AS TradeX • Binance public market data • Manual execution only • Not financial advice</footer>
  </main>;
}

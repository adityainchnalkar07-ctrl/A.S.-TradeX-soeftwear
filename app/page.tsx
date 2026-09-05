"use client";

import { useEffect, useMemo, useState } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

type Tick = { time: string; price: number };
const symbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"];

function ema(values: number[], period: number) {
  if (!values.length) return 0;
  const k = 2 / (period + 1);
  let e = values[0];
  for (let i = 1; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

function rsi(values: number[], period = 14) {
  if (values.length < period + 1) return 50;
  let gains = 0, losses = 0;
  for (let i = values.length - period; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  if (losses === 0) return 100;
  const rs = (gains / period) / (losses / period);
  return 100 - 100 / (1 + rs);
}

export default function Home() {
  const [symbol, setSymbol] = useState("BTCUSDT");
  const [ticks, setTicks] = useState<Tick[]>([]);
  const [status, setStatus] = useState("CONNECTING");

  useEffect(() => {
    setTicks([]);
    setStatus("CONNECTING");
    const ws = new WebSocket(`wss://stream.binance.com:9443/ws/${symbol.toLowerCase()}@ticker`);
    ws.onopen = () => setStatus("LIVE");
    ws.onerror = () => setStatus("ERROR");
    ws.onclose = () => setStatus("OFFLINE");
    ws.onmessage = (event) => {
      const d = JSON.parse(event.data);
      const price = Number(d.c);
      const time = new Date(Number(d.E)).toLocaleTimeString();
      setTicks(prev => [...prev.slice(-59), { time, price }]);
    };
    return () => ws.close();
  }, [symbol]);

  const prices = ticks.map(x => x.price);
  const price = prices.at(-1) ?? 0;
  const e9 = ema(prices.slice(-60), 9);
  const e20 = ema(prices.slice(-60), 20);
  const r = rsi(prices.slice(-60));
  const trend = e9 > e20 && r >= 50 ? "BULLISH" : e9 < e20 && r <= 50 ? "BEARISH" : "NEUTRAL";
  const setup = useMemo(() => {
    if (trend === "BULLISH" && r < 70) return "LONG WATCH";
    if (trend === "BEARISH" && r > 30) return "SHORT WATCH";
    return "WAIT";
  }, [trend, r]);

  return (
    <main className="shell">
      <header className="topbar">
        <div><div className="brand">AS <span>TradeX</span></div><div className="sub">REAL-TIME CRYPTO AI ANALYSIS • V1</div></div>
        <div className="status"><i className={status === "LIVE" ? "live" : ""} /> {status}</div>
      </header>

      <section className="controls">
        {symbols.map(s => <button key={s} className={symbol === s ? "active" : ""} onClick={() => setSymbol(s)}>{s.replace("USDT", "/USDT")}</button>)}
      </section>

      <section className="grid">
        <div className="card chart-card">
          <div className="card-head"><b>{symbol.replace("USDT", "/USDT")}</b><strong>${price ? price.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "—"}</strong></div>
          <div className="chart"><ResponsiveContainer width="100%" height="100%"><LineChart data={ticks}><CartesianGrid strokeDasharray="3 3" opacity={0.15}/><XAxis dataKey="time" hide/><YAxis domain={["auto", "auto"]} orientation="right"/><Tooltip/><Line type="monotone" dataKey="price" dot={false} strokeWidth={2}/></LineChart></ResponsiveContainer></div>
        </div>

        <div className="card">
          <h3>AI MARKET READ</h3>
          <div className={`signal ${trend.toLowerCase()}`}>{trend}</div>
          <p className="muted">V1 combines EMA 9/20 and RSI as a rule-based analysis aid. It does not guarantee trading outcomes.</p>
          <div className="metric"><span>SETUP</span><b>{setup}</b></div>
          <div className="metric"><span>RSI (14)</span><b>{r.toFixed(1)}</b></div>
          <div className="metric"><span>EMA 9</span><b>{e9 ? e9.toFixed(2) : "—"}</b></div>
          <div className="metric"><span>EMA 20</span><b>{e20 ? e20.toFixed(2) : "—"}</b></div>
        </div>

        <div className="card">
          <h3>EXECUTION PANEL</h3>
          <div className="execution">
            <div><span>BIAS</span><b>{trend}</b></div><div><span>ENTRY</span><b>{price ? `$${price.toFixed(2)}` : "WAITING"}</b></div><div><span>STOP LOSS</span><b>Configure</b></div><div><span>TAKE PROFIT</span><b>Configure</b></div><div><span>R:R</span><b>1 : 2 target</b></div>
          </div>
          <button className="primary" onClick={() => alert("Signal saved locally — execution remains manual.")}>SAVE SETUP</button>
        </div>
      </section>

      <footer>AS TradeX V1 • Public market data • Manual execution only • Not financial advice</footer>
    </main>
  );
}

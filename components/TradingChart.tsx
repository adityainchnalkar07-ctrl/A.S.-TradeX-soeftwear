"use client";

import { useEffect, useRef } from "react";
import { CandlestickSeries, ColorType, createChart, IChartApi, ISeriesApi, Time } from "lightweight-charts";
import type { BinanceKline } from "../lib/binance";

export default function TradingChart({ candles }: { candles: BinanceKline[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const seriesRef = useRef<ISeriesApi<"Candlestick"> | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: "#0b111c" }, textColor: "#8d9ab0" },
      grid: { vertLines: { color: "#172132" }, horzLines: { color: "#172132" } },
      width: ref.current.clientWidth, height: ref.current.clientHeight,
      rightPriceScale: { borderColor: "#263248" }, timeScale: { borderColor: "#263248", timeVisible: true },
    });
    const series = chart.addSeries(CandlestickSeries, {
      upColor: "#31d158", downColor: "#ff5c70", borderVisible: false,
      wickUpColor: "#31d158", wickDownColor: "#ff5c70"
    });
    chartRef.current = chart; seriesRef.current = series;
    const resize = () => { if (ref.current) chart.applyOptions({ width: ref.current.clientWidth, height: ref.current.clientHeight }); };
    window.addEventListener("resize", resize);
    return () => { window.removeEventListener("resize", resize); chart.remove(); chartRef.current = null; seriesRef.current = null; };
  }, []);

  useEffect(() => {
    if (!seriesRef.current || !candles.length) return;
    seriesRef.current.setData(candles.map(c => ({ time: Math.floor(c.openTime / 1000) as Time, open: c.open, high: c.high, low: c.low, close: c.close })));
    chartRef.current?.timeScale().fitContent();
  }, [candles]);

  return <div ref={ref} style={{ width: "100%", height: "100%" }} />;
}

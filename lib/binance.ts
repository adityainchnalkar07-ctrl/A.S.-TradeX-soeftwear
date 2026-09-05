export type BinanceKline = {
  openTime: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  closeTime: number;
};

const REST_BASE = "https://api.binance.com";
const WS_BASE = "wss://stream.binance.com:9443/ws";

export async function fetchKlines(symbol: string, interval: string, limit = 300): Promise<BinanceKline[]> {
  const url = `${REST_BASE}/api/v3/klines?symbol=${encodeURIComponent(symbol)}&interval=${encodeURIComponent(interval)}&limit=${limit}`;
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Binance REST error: ${response.status}`);
  const rows = await response.json();
  if (!Array.isArray(rows)) throw new Error("Invalid Binance kline response");
  return rows.map((row: unknown[]) => ({
    openTime: Number(row[0]), open: Number(row[1]), high: Number(row[2]),
    low: Number(row[3]), close: Number(row[4]), volume: Number(row[5]), closeTime: Number(row[6])
  })).filter((c: BinanceKline) => [c.open,c.high,c.low,c.close,c.volume].every(Number.isFinite));
}

export function createKlineStream(symbol: string, interval: string) {
  return new WebSocket(`${WS_BASE}/${symbol.toLowerCase()}@kline_${interval}`);
}

export function createTickerStream(symbols: string[]) {
  const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join("/");
  return new WebSocket(`${WS_BASE}/${streams}`);
}

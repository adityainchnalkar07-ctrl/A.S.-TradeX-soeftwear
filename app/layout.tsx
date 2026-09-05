import "./globals.css";

export const metadata = {
  title: "AS TradeX",
  description: "Real-time crypto market analysis dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body>{children}</body></html>;
}

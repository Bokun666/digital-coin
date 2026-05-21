import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DigitalCoin",
  description: "加密货币手动交易辅助、风险控制与复盘系统",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}

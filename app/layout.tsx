import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMART Team Goals",
  description: "チームが自律的に課題を発見し、SMARTの指針に基づいたゴールを設定・達成するプラットフォーム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}

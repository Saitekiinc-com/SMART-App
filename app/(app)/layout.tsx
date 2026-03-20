/**
 * 認証後エリアのレイアウト
 * 各ページで components/AppHeader を共通ヘッダーとして使用。
 * モーダル（S-08, S-10）は各画面の state で表示制御。
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}

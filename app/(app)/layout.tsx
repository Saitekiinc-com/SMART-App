/**
 * 認証後エリアのレイアウト
 * ヘッダー・認証ガード。モーダル（S-08, S-10）は state で表示制御
 */
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {/* AppHeader をここに配置 */}
      {children}
    </>
  );
}

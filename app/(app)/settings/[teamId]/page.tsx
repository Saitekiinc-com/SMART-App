/**
 * S-09: チーム設定
 * TeamSettingsContent（リーダーのみ）
 */
export default function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <main>
      <p>チーム設定（S-09）</p>
    </main>
  );
}

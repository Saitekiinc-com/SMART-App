/**
 * S-02: 招待受諾画面
 * InviteAcceptCard。未ログイン時は S-01 へ誘導
 */
export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  return (
    <main>
      <p>招待受諾（S-02）</p>
    </main>
  );
}

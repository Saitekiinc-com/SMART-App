/**
 * S-04: チームダッシュボード
 * GoalList, DashboardSummary, FAB 等
 */
export default function DashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  return (
    <main>
      <p>ダッシュボード（S-04）</p>
    </main>
  );
}

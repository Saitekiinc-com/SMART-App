/**
 * S-04: チームダッシュボード（ワイヤーフレーム準拠）
 * チーム名・ゴール一覧を API/DB から取得して表示
 */
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";

const STATUS_LABEL: Record<string, string> = {
  TODO: "未着手",
  IN_PROGRESS: "進行中",
  DONE: "完了",
};

const STATUS_STYLE: Record<string, string> = {
  TODO: "bg-orange-100 text-orange-800",
  IN_PROGRESS: "bg-green-100 text-green-800",
  DONE: "bg-blue-100 text-blue-800",
};

export default async function DashboardPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const { teamId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    redirect("/login");
  }

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId, userId: user.id } },
  });
  if (!membership) {
    notFound();
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true },
  });
  if (!team) {
    notFound();
  }

  const goalsRaw = await prisma.smartGoal.findMany({
    where: { teamId },
    include: {
      _count: { select: { votes: true, approaches: true } },
      approaches: { select: { completed: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const goals = goalsRaw.map((g) => {
    const approachCompleted = g.approaches.filter((a) => a.completed).length;
    return {
      id: g.id,
      title: g.title,
      status: g.status,
      voteCount: g._count.votes,
      approachTotal: g._count.approaches,
      approachCompleted,
    };
  });

  const inProgress = goals.filter((g) => g.status === "IN_PROGRESS").length;
  const done = goals.filter((g) => g.status === "DONE").length;
  const total = goals.length;
  const achievedRate = total > 0 ? Math.round((done / total) * 100) : 0;

  return (
    <div className="w-full max-w-3xl min-h-screen mx-auto bg-white border border-gray-300 shadow-sm relative">
      <AppHeader
        leftContent={
          <span className="text-sm font-semibold truncate max-w-[180px]" title={team.name}>
            {team.name}
          </span>
        }
        teamId={teamId}
        showSettingsLink={membership.role === "leader"}
      />

      <main className="p-4 pb-20">
        <p className="text-xs text-gray-400 mb-2">画面ID: S-04</p>
        <h1 className="text-lg font-semibold text-gray-800 mb-4">チームダッシュボード</h1>

        <div className="bg-gray-100 rounded-lg p-4 mb-5 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">サマリー</p>
          <p className="text-sm">
            進行中: {inProgress}件　完了: {done}件　達成率: {achievedRate}%
          </p>
        </div>

        <div className="flex gap-2 mb-3">
          <span className="text-xs py-1.5 px-2.5 border border-gray-300 rounded">すべて</span>
          <span className="text-xs py-1.5 px-2.5 border border-gray-200 rounded text-gray-400">未着手</span>
          <span className="text-xs py-1.5 px-2.5 border border-gray-200 rounded text-gray-400">進行中</span>
          <span className="text-xs py-1.5 px-2.5 border border-gray-200 rounded text-gray-400">完了</span>
        </div>

        <div className="space-y-3">
          {goals.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">ゴールがありません。右下の + から作成できます。</p>
          ) : (
            goals.map((g) => (
              <Link
                key={g.id}
                href={`/goals/${g.id}`}
                className="block border border-gray-300 rounded-lg p-3.5 cursor-pointer hover:bg-gray-50"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="text-sm font-semibold">{g.title}</span>
                  <span
                    className={`text-[11px] py-0.5 px-2 rounded shrink-0 ${STATUS_STYLE[g.status] ?? "bg-gray-100 text-gray-800"}`}
                  >
                    {STATUS_LABEL[g.status] ?? g.status}
                  </span>
                </div>
                <p className="text-xs text-gray-500">
                  投票: {g.voteCount}票　アプローチ進捗: {g.approachCompleted}/{g.approachTotal}
                </p>
              </Link>
            ))
          )}
        </div>
      </main>

      <Link
        href={`/dashboard/${teamId}/goals/new`}
        className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-gray-800 text-white flex items-center justify-center text-2xl shadow-lg"
        aria-label="新規ゴール"
      >
        +
      </Link>
    </div>
  );
}

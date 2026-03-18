/**
 * S-04: チームダッシュボード（ワイヤーフレーム準拠）
 * チーム名・ゴール一覧を API/DB から取得して表示
 */
import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { AppHeader } from "@/components/AppHeader";
import { FilterSortUI } from "@/components/ui/FilterSortUI";
import { VoteUI } from "@/components/ui/VoteUI";

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
  searchParams,
}: {
  params: Promise<{ teamId: string }>;
  searchParams: Promise<{ status?: string; sort?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const { teamId } = await params;
  const sp = await searchParams;

  const statusFilter = sp.status ?? "ALL";
  const sortBy = sp.sort ?? "votes_desc";

  const allowedStatus = new Set(["ALL", "TODO", "IN_PROGRESS", "DONE"]);
  const safeStatusFilter = allowedStatus.has(statusFilter) ? statusFilter : "ALL";

  const allowedSort = new Set(["votes_desc", "votes_asc", "deadline_asc", "createdAt_desc"]);
  const safeSortBy = allowedSort.has(sortBy) ? sortBy : "votes_desc";

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
  });

  const goalIds = goalsRaw.map((g) => g.id);
  const userVotes = await prisma.vote.findMany({
    where: {
      userId: user.id,
      goalId: { in: goalIds },
    },
    select: { goalId: true },
  });
  const votedSet = new Set(userVotes.map((v) => v.goalId));

  const allGoals = goalsRaw.map((g) => {
    const approachCompleted = g.approaches.filter((a) => a.completed).length;
    return {
      id: g.id,
      title: g.title,
      status: g.status,
      voteCount: g._count.votes,
      approachTotal: g._count.approaches,
      approachCompleted,
      deadline: g.deadline,
      createdAt: g.createdAt,
      hasVoted: votedSet.has(g.id),
    };
  });

  // サマリーはフィルターに影響されない（全ゴール基準）
  const inProgress = allGoals.filter((g) => g.status === "IN_PROGRESS").length;
  const done = allGoals.filter((g) => g.status === "DONE").length;
  const total = allGoals.length;
  const achievedRate = total > 0 ? Math.round((done / total) * 100) : 0;

  // 表示する一覧はフィルター/ソートを反映
  let goals = allGoals;
  if (safeStatusFilter !== "ALL") {
    goals = goals.filter((g) => g.status === safeStatusFilter);
  }

  goals.sort((a, b) => {
    if (safeSortBy === "votes_desc") {
      return b.voteCount - a.voteCount || b.createdAt.getTime() - a.createdAt.getTime();
    }
    if (safeSortBy === "votes_asc") {
      return a.voteCount - b.voteCount || b.createdAt.getTime() - a.createdAt.getTime();
    }
    if (safeSortBy === "deadline_asc") {
      return a.deadline.getTime() - b.deadline.getTime() || b.createdAt.getTime() - a.createdAt.getTime();
    }
    // createdAt_desc
    return b.createdAt.getTime() - a.createdAt.getTime();
  });

  return (
    <div className="w-full max-w-3xl min-h-screen mx-auto bg-white border border-gray-300 shadow-sm relative">
      <AppHeader
        variant="dashboard"
        teamName={team.name}
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

        <FilterSortUI teamId={teamId} status={safeStatusFilter} sortBy={safeSortBy} />

        <div className="space-y-3">
          {goals.length === 0 ? (
            <p className="text-sm text-gray-500 py-4">ゴールがありません。右下の「ゴール追加」から作成できます。</p>
          ) : (
            goals.map((g) => (
              <div
                key={g.id}
                className="border border-gray-300 rounded-lg p-3.5 hover:bg-gray-50 flex items-start gap-3"
              >
                <Link
                  href={`/goals/${g.id}`}
                  className="flex-1 min-w-0"
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
                    アプローチ進捗: {g.approachCompleted}/{g.approachTotal}
                  </p>
                </Link>
                <VoteUI goalId={g.id} status={g.status} voteCount={g.voteCount} hasVoted={g.hasVoted} />
              </div>
            ))
          )}
        </div>
      </main>

      <Link
        href={`/dashboard/${teamId}/goals/new`}
        className="absolute bottom-6 right-6 py-3 px-4 rounded-lg bg-gray-800 text-white text-sm font-medium shadow-lg hover:bg-gray-700"
        aria-label="ゴール追加"
      >
        ゴール追加
      </Link>
    </div>
  );
}

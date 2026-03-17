"use client";

/**
 * S-06: ゴール詳細
 * 表示・投票・アプローチチェックリスト・ステータス変更・編集・削除
 */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

type Goal = {
  id: string;
  teamId: string;
  title: string;
  specific: string;
  measurable: string;
  achievable: boolean;
  relevant: string;
  deadline: string;
  status: string;
  voteCount: number;
  hasVoted: boolean;
  canEdit: boolean;
  approaches: { id: string; content: string; completed: boolean; sortOrder: number }[];
};

export default function GoalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.goalId as string;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  async function fetchGoal() {
    setError("");
    const res = await fetch(`/api/goals/${goalId}`);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError((data.error as string) || "取得に失敗しました");
      setGoal(null);
      return;
    }
    const data = await res.json();
    setGoal(data);
  }

  useEffect(() => {
    fetchGoal();
  }, [goalId]);

  async function handleVote() {
    if (!goal || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/votes`, {
        method: goal.hasVoted ? "DELETE" : "POST",
      });
      if (res.ok) await fetchGoal();
      else {
        const data = await res.json().catch(() => ({}));
        setError((data.error as string) || "操作に失敗しました");
      }
    } finally {
      setActionLoading(false);
    }
  }

  async function handleToggleApproach(approachId: string, current: boolean) {
    if (!goal || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/goals/${goalId}/approaches/${approachId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !current }),
      });
      if (res.ok) await fetchGoal();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleStatusChange(status: string) {
    if (!goal || !goal.canEdit || actionLoading) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/goals/${goalId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) await fetchGoal();
    } finally {
      setActionLoading(false);
    }
  }

  async function handleDelete() {
    if (!goal || !goal.canEdit || actionLoading) return;
    if (!confirm("このゴールを削除しますか？")) return;
    setActionLoading(true);
    try {
      const res = await fetch(`/api/goals/${goalId}`, { method: "DELETE" });
      if (res.ok) {
        router.push(`/dashboard/${goal.teamId}`);
        return;
      }
      const data = await res.json().catch(() => ({}));
      setError((data.error as string) || "削除に失敗しました");
    } finally {
      setActionLoading(false);
    }
  }

  if (!goal && !error) {
    return (
      <div className="w-full max-w-3xl min-h-screen mx-auto bg-white border border-gray-300 shadow-sm p-4">
        <p className="text-sm text-gray-500">読み込み中…</p>
      </div>
    );
  }

  if (error && !goal) {
    return (
      <div className="w-full max-w-3xl min-h-screen mx-auto bg-white border border-gray-300 shadow-sm p-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/teams" className="mt-2 inline-block text-sm text-gray-600 underline">
          チーム一覧へ
        </Link>
      </div>
    );
  }

  if (!goal) {
    return null;
  }

  const approachCompleted = goal.approaches.filter((a) => a.completed).length;
  const approachTotal = goal.approaches.length;
  const progressPercent = approachTotal > 0 ? Math.round((approachCompleted / approachTotal) * 100) : 0;

  return (
    <div className="w-full max-w-3xl min-h-screen mx-auto bg-white border border-gray-300 shadow-sm">
      <AppHeader
        leftContent={
          <Link href={`/dashboard/${goal.teamId}`} className="text-sm text-gray-700 hover:underline">
            ← 戻る
          </Link>
        }
      />

      <main className="p-4">
        <p className="text-xs text-gray-400 mb-2">画面ID: S-06</p>

        <div className="mb-5">
          <div className="flex justify-between items-start mb-3">
            <h1 className="text-lg font-semibold text-gray-800">{goal.title}</h1>
            <span
              className={`text-[11px] py-1 px-2 rounded shrink-0 ${STATUS_STYLE[goal.status] ?? "bg-gray-100 text-gray-800"}`}
            >
              {STATUS_LABEL[goal.status] ?? goal.status}
            </span>
          </div>
          <div className="text-[13px] text-gray-600 mb-4 space-y-1">
            <p><span className="text-gray-500">Specific:</span> {goal.specific}</p>
            <p><span className="text-gray-500">Measurable:</span> {goal.measurable}</p>
            <p><span className="text-gray-500">Achievable:</span> {goal.achievable ? "はい" : "いいえ"}</p>
            <p><span className="text-gray-500">Relevant:</span> {goal.relevant}</p>
            <p><span className="text-gray-500">期限:</span> {goal.deadline}</p>
          </div>

          <div className="bg-gray-100 rounded-lg py-3 px-3 mb-4 border border-gray-200">
            <p className="text-xs text-gray-500 mb-2">投票</p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleVote}
                disabled={actionLoading}
                className="py-2 px-4 border border-gray-800 rounded text-[13px] hover:bg-gray-200 disabled:opacity-50"
              >
                {goal.hasVoted ? "投票を取り消す" : "投票する"}
              </button>
              <span className="text-[13px]">{goal.voteCount}票</span>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">
              アプローチチェックリスト　進捗 {approachCompleted}/{approachTotal} ({progressPercent}%)
            </p>
            <ul className="list-none p-0 m-0 border-t border-gray-200">
              {goal.approaches.map((a) => (
                <li
                  key={a.id}
                  className="py-2 border-b border-gray-200 text-[13px] flex items-center gap-2"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleApproach(a.id, a.completed)}
                    disabled={actionLoading}
                    className="shrink-0 disabled:opacity-50"
                    aria-label={a.completed ? "未完了にする" : "完了にする"}
                  >
                    {a.completed ? "☑ " : "☐ "}
                  </button>
                  <span className={a.completed ? "text-gray-500 line-through" : ""}>{a.content}</span>
                </li>
              ))}
            </ul>
            {goal.approaches.length === 0 && (
              <p className="text-[13px] text-gray-400 py-2">アプローチはまだありません</p>
            )}
          </div>

          {goal.canEdit && (
            <>
              <p className="text-xs text-gray-500 mb-2">ステータス変更</p>
              <div className="flex gap-2 mb-4">
                {(["TODO", "IN_PROGRESS", "DONE"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => handleStatusChange(s)}
                    disabled={actionLoading || goal.status === s}
                    className={`py-1.5 px-3 rounded text-xs disabled:opacity-50 ${
                      goal.status === s
                        ? "bg-gray-800 text-white"
                        : "border border-gray-300 hover:bg-gray-100"
                    }`}
                  >
                    {STATUS_LABEL[s]}
                  </button>
                ))}
              </div>

              <div className="flex gap-3">
                <Link
                  href={`/goals/${goalId}/edit`}
                  className="py-2 px-4 border border-gray-800 rounded text-[13px] hover:bg-gray-100"
                >
                  編集
                </Link>
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="py-2 px-4 border border-red-600 text-red-600 rounded text-[13px] bg-white hover:bg-red-50 disabled:opacity-50"
                >
                  削除
                </button>
              </div>
              <p className="mt-2 text-[11px] text-gray-400">※ 編集・削除は作成者またはリーダーのみ表示</p>
            </>
          )}
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-2" role="alert">
            {error}
          </p>
        )}
      </main>
    </div>
  );
}

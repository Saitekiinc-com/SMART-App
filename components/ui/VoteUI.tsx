"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type Props = {
  goalId: string;
  status: string; // TODO | IN_PROGRESS | DONE
  voteCount: number;
  hasVoted: boolean;
};

export function VoteUI({ goalId, status, voteCount: initialVoteCount, hasVoted: initialHasVoted }: Props) {
  const router = useRouter();
  const [voteCount, setVoteCount] = useState(initialVoteCount);
  const [hasVoted, setHasVoted] = useState(initialHasVoted);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVoteCount(initialVoteCount);
    setHasVoted(initialHasVoted);
  }, [initialVoteCount, initialHasVoted]);

  const disabled = loading || status !== "TODO";

  async function handleVote() {
    if (disabled) return;
    setLoading(true);
    try {
      const method = hasVoted ? "DELETE" : "POST";
      const res = await fetch(`/api/goals/${goalId}/votes`, { method });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert((data?.error as string) || "操作に失敗しました");
        return;
      }

      // 楽観的更新（最終的には router.refresh で整合を取る）
      setHasVoted((prev) => !prev);
      setVoteCount((prev) => Math.max(0, prev + (hasVoted ? -1 : 1)));
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={handleVote}
        disabled={disabled}
        className={`py-1.5 px-3 rounded text-xs border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
          hasVoted ? "bg-gray-800 text-white border-gray-800 hover:bg-gray-700" : "bg-white text-gray-800 border-gray-300 hover:bg-gray-100"
        }`}
        aria-label={hasVoted ? "投票を取り消す" : "投票する"}
      >
        {loading ? "..." : hasVoted ? "投票取消" : "投票"}
      </button>
      <span className="text-[12px] whitespace-nowrap text-gray-600">{voteCount}票</span>
    </div>
  );
}


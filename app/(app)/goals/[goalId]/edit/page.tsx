"use client";

/**
 * S-07: ゴール編集
 * 既存ゴールの SMART 項目・アプローチを編集して PUT で保存
 */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { useEffect, useState } from "react";

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
  canEdit: boolean;
  approaches: { id: string; content: string; completed: boolean; sortOrder: number }[];
};

export default function GoalEditPage() {
  const params = useParams();
  const router = useRouter();
  const goalId = params.goalId as string;
  const [goal, setGoal] = useState<Goal | null>(null);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [achievable, setAchievable] = useState(true);
  const [relevant, setRelevant] = useState("");
  const [deadline, setDeadline] = useState("");
  const [approaches, setApproaches] = useState<string[]>([""]);

  useEffect(() => {
    async function load() {
      const res = await fetch(`/api/goals/${goalId}`);
      if (!res.ok) {
        setError("ゴールを取得できませんでした");
        return;
      }
      const data = await res.json();
      setGoal(data);
      setTitle(data.title ?? "");
      setSpecific(data.specific ?? "");
      setMeasurable(data.measurable ?? "");
      setAchievable(data.achievable ?? true);
      setRelevant(data.relevant ?? "");
      setDeadline(data.deadline ?? "");
      setApproaches(
        data.approaches?.length > 0
          ? data.approaches.map((a: { content: string }) => a.content)
          : [""]
      );
    }
    load();
  }, [goalId]);

  function addApproach() {
    setApproaches((prev) => [...prev, ""]);
  }

  function removeApproach(index: number) {
    setApproaches((prev) => prev.filter((_, i) => i !== index));
  }

  function setApproachAt(index: number, value: string) {
    setApproaches((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!goal?.canEdit) return;
    setError("");
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return;
    }
    if (title.trim().length > 100) {
      setError("タイトルは100文字以内にしてください");
      return;
    }
    if (!specific.trim()) setError("具体的（Specific）を入力してください");
    else if (!measurable.trim()) setError("測定可能（Measurable）を入力してください");
    else if (!relevant.trim()) setError("関連性（Relevant）を入力してください");
    else if (!deadline.trim()) setError("期限を入力してください");
    else if (Number.isNaN(new Date(deadline).getTime())) setError("有効な日付を入力してください");
    else {
      setSubmitting(true);
      try {
        const res = await fetch(`/api/goals/${goalId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: title.trim(),
            specific: specific.trim(),
            measurable: measurable.trim(),
            achievable,
            relevant: relevant.trim(),
            deadline: deadline.trim(),
            approaches: approaches
              .map((c) => c.trim())
              .filter(Boolean)
              .map((content) => ({ content })),
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (res.ok) {
          router.push(`/goals/${goalId}`);
          return;
        }
        setError((data.error as string) || "保存に失敗しました");
      } finally {
        setSubmitting(false);
      }
    }
  }

  if (!goal && !error) {
    return (
      <div className="w-full max-w-3xl min-h-screen mx-auto bg-white p-4">
        <p className="text-sm text-gray-500">読み込み中…</p>
      </div>
    );
  }

  if (error && !goal) {
    return (
      <div className="w-full max-w-3xl min-h-screen mx-auto bg-white p-4">
        <p className="text-sm text-red-600">{error}</p>
        <Link href="/teams" className="mt-2 inline-block text-sm underline">チーム一覧へ</Link>
      </div>
    );
  }

  if (goal && !goal.canEdit) {
    return (
      <div className="w-full max-w-3xl min-h-screen mx-auto bg-white p-4">
        <p className="text-sm text-gray-600">編集する権限がありません。</p>
        <Link href={`/goals/${goalId}`} className="mt-2 inline-block text-sm text-indigo-600 underline">
          ゴール詳細へ戻る
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl min-h-screen mx-auto bg-white border border-gray-300 shadow-sm">
      <AppHeader
        leftContent={
          <Link href={`/goals/${goalId}`} className="text-sm text-gray-700 hover:underline">
            ← 戻る
          </Link>
        }
      />

      <main className="p-4">
        <p className="text-xs text-gray-400 mb-2">画面ID: S-07</p>
        <h1 className="text-lg font-semibold text-gray-800 mb-4">ゴール編集</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs mb-1 text-gray-600">タイトル</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              className="w-full py-2 px-2.5 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600">具体的（Specific）</label>
            <textarea
              value={specific}
              onChange={(e) => setSpecific(e.target.value)}
              rows={2}
              className="w-full py-2 px-2.5 border border-gray-300 rounded text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600">測定可能（Measurable）</label>
            <textarea
              value={measurable}
              onChange={(e) => setMeasurable(e.target.value)}
              rows={2}
              className="w-full py-2 px-2.5 border border-gray-300 rounded text-sm resize-none"
            />
          </div>
          <div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={achievable}
                onChange={(e) => setAchievable(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300"
              />
              <span className="text-sm text-gray-700">達成可能（Achievable）</span>
            </label>
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600">関連性（Relevant）</label>
            <textarea
              value={relevant}
              onChange={(e) => setRelevant(e.target.value)}
              rows={2}
              className="w-full py-2 px-2.5 border border-gray-300 rounded text-sm resize-none"
            />
          </div>
          <div>
            <label className="block text-xs mb-1 text-gray-600">期限</label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full py-2 px-2.5 border border-gray-300 rounded text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-2">アプローチ（手順）</p>
            {approaches.map((content, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={content}
                  onChange={(e) => setApproachAt(i, e.target.value)}
                  placeholder={`手順 ${i + 1}`}
                  maxLength={200}
                  className="flex-1 py-2 px-2.5 border border-gray-300 rounded text-sm"
                />
                <button
                  type="button"
                  onClick={() => removeApproach(i)}
                  disabled={approaches.length <= 1}
                  className="py-2 px-3 text-gray-500 hover:text-red-600 disabled:opacity-40 text-sm"
                >
                  削除
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addApproach}
              className="text-sm text-gray-600 border border-dashed border-gray-300 rounded py-2 px-3 w-full hover:bg-gray-50"
            >
              + 手順を追加
            </button>
          </div>

          {error && (
            <p className="text-sm text-red-600" role="alert">{error}</p>
          )}

          <div className="flex gap-3 pt-2">
            <Link
              href={`/goals/${goalId}`}
              className="py-2.5 px-5 bg-white border border-gray-300 rounded text-sm"
            >
              キャンセル
            </Link>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 py-2.5 bg-gray-800 text-white rounded text-sm disabled:opacity-50"
            >
              {submitting ? "保存中…" : "保存する"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}

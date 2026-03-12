/**
 * S-03: チーム選択（ワイヤーフレーム準拠）
 * 所属チーム一覧を GET /api/teams で取得し、選択時にダッシュボードへ遷移
 */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type TeamItem = { id: string; name: string; role: "leader" | "member" };

export default function TeamSelectPage() {
  const router = useRouter();
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createName, setCreateName] = useState("");
  const [createDescription, setCreateDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchTeams = async () => {
    const res = await fetch("/api/teams");
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error ?? "チーム一覧の取得に失敗しました");
    }
    const data = await res.json();
    return data.teams ?? [];
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const list = await fetchTeams();
        if (cancelled) return;
        setTeams(list);
        if (list.length === 1) {
          router.replace(`/dashboard/${list[0].id}`);
          return;
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "エラーが発生しました");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  const roleLabel = (role: string) => (role === "leader" ? "リーダー" : "メンバー");

  async function handleCreateTeam(e: React.FormEvent) {
    e.preventDefault();
    setCreateError(null);
    const name = createName.trim();
    if (!name) {
      setCreateError("チーム名を入力してください");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description: createDescription.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCreateError(data.error ?? "チームの作成に失敗しました");
        return;
      }
      router.push(`/dashboard/${data.id}`);
    } catch {
      setCreateError("チームの作成に失敗しました");
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 px-4 py-4">
      <div className="w-full max-w-[400px] mx-auto bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
        <p className="text-xs text-gray-400 mb-2">画面ID: S-03</p>
        <h1 className="text-xl font-semibold text-gray-800 mb-6">チーム選択</h1>

        <p className="text-xs text-gray-500 mb-3">
          所属チームから1つ選択 → そのチームのダッシュボードへ
        </p>

        {loading && (
          <p className="text-sm text-gray-500 py-4">読み込み中…</p>
        )}
        {error && (
          <p className="text-sm text-red-600 py-2">{error}</p>
        )}
        {!loading && !error && teams.length === 0 && (
          <>
            <p className="text-sm text-gray-500 py-2">
              所属チームがありません。チームを作成するか、招待リンクから参加してください。
            </p>
            <form onSubmit={handleCreateTeam} className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50 space-y-3">
              <h2 className="text-sm font-medium text-gray-700">チームを作成</h2>
              {createError && (
                <p className="text-sm text-red-600">{createError}</p>
              )}
              <div>
                <label htmlFor="team-name" className="block text-xs text-gray-600 mb-1">チーム名（必須）</label>
                <input
                  id="team-name"
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="例: 開発チーム"
                  maxLength={50}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  disabled={creating}
                />
              </div>
              <div>
                <label htmlFor="team-desc" className="block text-xs text-gray-600 mb-1">説明（任意）</label>
                <textarea
                  id="team-desc"
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="チームの説明"
                  maxLength={200}
                  rows={2}
                  className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  disabled={creating}
                />
              </div>
              <button
                type="submit"
                disabled={creating || !createName.trim()}
                className="w-full rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                {creating ? "作成中…" : "作成してダッシュボードへ"}
              </button>
            </form>
          </>
        )}
        {!loading && teams.length > 0 && (
          <ul className="list-none p-0 m-0 space-y-2">
            {teams.map((team) => (
              <li key={team.id}>
                <Link
                  href={`/dashboard/${team.id}`}
                  className="block border border-gray-300 rounded-md py-4 px-4 bg-gray-50 hover:bg-gray-100 cursor-pointer"
                >
                  <span className="text-base font-medium">{team.name}</span>
                  <span className="text-xs text-gray-500 block mt-1">
                    {roleLabel(team.role)}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
        <p className="text-[11px] text-gray-400 mt-4">
          ※ 所属1チームの場合は自動でダッシュボードへ移動します
        </p>
      </div>
    </main>
  );
}

"use client";

/**
 * S-02: 招待受諾画面（ワイヤーフレーム準拠）
 * InviteAcceptCard。招待情報を取得して表示し、「参加する」で受諾。未ログイン時は S-01 へ誘導
 */
import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type InviteInfo = {
  teamId: string;
  teamName: string;
  inviterName: string;
};

export default function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);
  const router = useRouter();
  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    if (!token) {
      setError("招待リンクが不正です");
      setLoading(false);
      return;
    }

    // ログイン状態を判定（NextAuth セッション）
    fetch("/api/auth/session")
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json().catch(() => null);
      })
      .then((session) => {
        setIsAuthed(!!session?.user);
      })
      .catch(() => setIsAuthed(false));

    fetch(`/api/invites/${encodeURIComponent(token)}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.teamId && data.teamName != null && data.inviterName != null) {
          setInvite({
            teamId: data.teamId,
            teamName: data.teamName,
            inviterName: data.inviterName,
          });
          setError(null);
        } else {
          setError(data.error ?? "招待が見つかりません");
        }
      })
      .catch(() => setError("読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, [token]);

  function handleCancel() {
    // 「前の画面へ戻る」（履歴がなければチーム選択へフォールバック）
    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }
    router.push("/teams");
  }

  async function handleAccept() {
    if (!token || !invite) return;
    if (!isAuthed) {
      // 未ログイン時は誘導リンクへ（設計書方針）
      router.push(`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
      return;
    }
    if (!confirm("参加しますか？")) return;
    setAcceptError(null);
    setAccepting(true);
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(token)}/accept`, {
        method: "POST",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setAcceptError(data.error ?? "参加に失敗しました");
        return;
      }
      router.push(`/dashboard/${invite.teamId}`);
    } catch {
      setAcceptError("通信エラーです");
    } finally {
      setAccepting(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
      <div className="w-full max-w-3xl bg-white border border-gray-300 rounded-lg p-6 shadow-sm">
        <p className="text-xs text-gray-400 mb-2">画面ID: S-02</p>
        <h1 className="text-xl font-semibold text-gray-800 mb-6">招待受諾画面</h1>

        {loading && (
          <p className="text-sm text-gray-500">読み込み中…</p>
        )}

        {error && !invite && !loading && (
          <div className="mb-6">
            <p className="text-sm text-red-600 mb-4">{error}</p>
            <Link href="/teams" className="text-indigo-600 underline text-sm">
              チーム一覧へ
            </Link>
          </div>
        )}

        {invite && !loading && (
          <div className="border border-gray-200 rounded-lg p-5 mb-6 bg-gray-50">
            <p className="text-xs text-gray-500 mb-2">チーム名</p>
            <p className="text-lg font-semibold text-gray-800 mb-4">{invite.teamName}</p>
            <p className="text-xs text-gray-500 mb-2">招待者</p>
            <p className="text-sm text-gray-800 mb-5">
              {invite.inviterName} さんから招待されています
            </p>
            {acceptError && (
              <p className="text-sm text-red-600 mb-2" role="alert">
                {acceptError}
              </p>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCancel}
                disabled={accepting}
                className="flex-1 py-3 bg-white text-gray-800 rounded border border-gray-300 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
              >
                キャンセル
              </button>
              {isAuthed ? (
                <button
                  type="button"
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-1 py-3 bg-gray-800 text-white rounded border-none text-sm font-medium disabled:opacity-50"
                >
                  {accepting ? "参加処理中…" : "参加する"}
                </button>
              ) : (
                <Link
                  href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
                  className="flex-1 inline-flex items-center justify-center py-3 bg-gray-800 text-white rounded border-none text-sm font-medium hover:bg-gray-700 disabled:opacity-50"
                >
                  ログインして参加
                </Link>
              )}
            </div>
          </div>
        )}

        {!isAuthed && (
          <p className="text-xs text-gray-400 text-center">
            未ログインの場合は
            <Link
              href={`/login?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`}
              className="text-indigo-600 underline ml-1"
            >
              サインアップ／ログインへ
            </Link>
            リンクで S-01 へ誘導
          </p>
        )}
      </div>
    </main>
  );
}

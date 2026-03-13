"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { InviteLinkModal } from "@/components/invite/InviteLinkModal";
import { NotificationTrigger } from "@/components/notifications/NotificationTrigger";

type MemberItem = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: "leader" | "member";
};

interface TeamSettingsClientProps {
  teamId: string;
  teamName: string;
}

export function TeamSettingsClient({ teamId, teamName }: TeamSettingsClientProps) {
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteUrl, setInviteUrl] = useState<string | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  const [members, setMembers] = useState<MemberItem[]>([]);
  const [membersLoading, setMembersLoading] = useState(true);
  const [membersError, setMembersError] = useState("");
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [promotingUserId, setPromotingUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [teamId]);

  async function handleOpenInviteModal() {
    setInviteError(null);
    setInviteLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/invites`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setInviteError(data.error ?? "招待リンクの生成に失敗しました");
        return;
      }
      setInviteUrl(data.inviteUrl ?? null);
      setShowInviteModal(true);
    } catch {
      setInviteError("通信エラーです");
    } finally {
      setInviteLoading(false);
    }
  }

  function handleCloseInviteModal() {
    setShowInviteModal(false);
    setInviteUrl(null);
  }

  async function fetchMembers() {
    setMembersError("");
    setMembersLoading(true);
    try {
      const res = await fetch(`/api/teams/${teamId}/members`);
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setMembersError((data.error as string) ?? "メンバーを取得できませんでした");
        setMembers([]);
        return;
      }
      const data = await res.json();
      setMembers(data.members ?? []);
    } finally {
      setMembersLoading(false);
    }
  }

  async function handleRemoveMember(userId: string) {
    if (!confirm("このメンバーをチームから削除しますか？")) return;
    setDeletingUserId(userId);
    setMembersError("");
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMembersError((data.error as string) ?? "削除に失敗しました");
        return;
      }
      await fetchMembers();
    } finally {
      setDeletingUserId(null);
    }
  }

  async function handlePromoteToLeader(userId: string) {
    if (!confirm("このメンバーをリーダーにしますか？自分はメンバーになります。")) return;
    setPromotingUserId(userId);
    setMembersError("");
    try {
      const res = await fetch(`/api/teams/${teamId}/members/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: "leader" }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMembersError((data.error as string) ?? "変更に失敗しました");
        return;
      }
      await fetchMembers();
    } finally {
      setPromotingUserId(null);
    }
  }

  return (
    <div className="w-full max-w-[400px] min-h-screen mx-auto bg-white border border-gray-300 shadow-sm">
      {showInviteModal && inviteUrl && (
        <InviteLinkModal inviteUrl={inviteUrl} onClose={handleCloseInviteModal} />
      )}
      <header className="flex items-center justify-between py-3 px-4 border-b border-gray-200">
        <Link href={`/dashboard/${teamId}`} className="text-sm text-gray-700">
          ← 戻る
        </Link>
        <div className="flex gap-3">
          <NotificationTrigger />
          <span className="w-8 h-8 flex items-center justify-center text-lg" title="ユーザー" aria-hidden>👤</span>
        </div>
      </header>

      <main className="p-4">
        <p className="text-xs text-gray-400 mb-2">画面ID: S-09　※リーダーのみアクセス可</p>
        <h1 className="text-lg font-semibold text-gray-800 mb-5">チーム設定</h1>

        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">チーム情報</p>
          <div className="mb-3">
            <label className="block text-xs mb-1">チーム名</label>
            <input
              type="text"
              value={teamName}
              readOnly
              className="w-full py-2.5 px-2.5 border border-gray-300 rounded box-border"
            />
          </div>
          <button
            type="button"
            className="py-2 px-4 bg-gray-800 text-white rounded text-[13px]"
          >
            保存
          </button>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-3">メンバー一覧</p>
          {membersLoading && (
            <p className="text-sm text-gray-500 py-2">読み込み中…</p>
          )}
          {membersError && (
            <p className="text-sm text-red-600 py-2" role="alert">{membersError}</p>
          )}
          {!membersLoading && !membersError && (
            <ul className="list-none p-0 m-0 border border-gray-200 rounded-lg overflow-hidden">
              {members.map((m) => (
                <li
                  key={m.id}
                  className="py-3 px-4 border-b border-gray-200 last:border-b-0 flex justify-between items-center"
                >
                  <span>{m.name || m.email}</span>
                  {m.role === "leader" ? (
                    <span className="text-[11px] text-gray-500">リーダー</span>
                  ) : (
                    <span className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handlePromoteToLeader(m.userId)}
                        disabled={promotingUserId === m.userId}
                        className="py-1 px-2 text-[11px] border border-gray-600 text-gray-700 rounded bg-white hover:bg-gray-50 disabled:opacity-50"
                      >
                        {promotingUserId === m.userId ? "変更中…" : "リーダーにする"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(m.userId)}
                        disabled={deletingUserId === m.userId}
                        className="py-1 px-2 text-[11px] border border-red-600 text-red-600 rounded bg-white hover:bg-red-50 disabled:opacity-50"
                      >
                        {deletingUserId === m.userId ? "削除中…" : "削除"}
                      </button>
                    </span>
                  )}
                </li>
              ))}
            </ul>
          )}
          {!membersLoading && !membersError && members.length === 0 && (
            <p className="text-sm text-gray-500 py-2">メンバーがいません</p>
          )}
        </div>

        {inviteError && (
          <p className="text-sm text-red-600 mb-2" role="alert">
            {inviteError}
          </p>
        )}
        <button
          type="button"
          className="w-full py-3 bg-white border border-gray-800 rounded text-sm disabled:opacity-50"
          onClick={handleOpenInviteModal}
          disabled={inviteLoading}
        >
          {inviteLoading ? "生成中…" : "招待リンクを生成"}
        </button>
      </main>
    </div>
  );
}

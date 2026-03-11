"use client";
/**
 * S-09: チーム設定（ワイヤーフレーム準拠）
 * TeamSettingsContent。リーダーのみ。招待リンク生成で S-10 モーダルを表示
 */
import Link from "next/link";
import { use, useState } from "react";
import { InviteLinkModal } from "@/components/invite/InviteLinkModal";

export default function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = use(params);
  const [showInviteModal, setShowInviteModal] = useState(false);
  return (
    <div className="w-full max-w-[400px] min-h-screen mx-auto bg-white border border-gray-300 shadow-sm">
      {showInviteModal && <InviteLinkModal onClose={() => setShowInviteModal(false)} />}
      <header className="flex items-center justify-between py-3 px-4 border-b border-gray-200">
        <Link href={`/dashboard/${teamId}`} className="text-sm text-gray-700">
          ← 戻る
        </Link>
        <div className="flex gap-3">
          <span className="w-6 h-6 border border-gray-300 rounded" />
          <span className="w-6 h-6 border border-gray-300 rounded-full" />
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
              defaultValue="〇〇チーム"
              readOnly
              className="w-full py-2.5 px-2.5 border border-gray-300 rounded box-border"
            />
          </div>
          <button
            type="button"
            className="py-2.5 px-4 bg-gray-800 text-white rounded text-[13px]"
          >
            保存
          </button>
        </div>

        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-3">メンバー一覧</p>
          <ul className="list-none p-0 m-0 border border-gray-200 rounded-lg overflow-hidden">
            <li className="py-3 px-4 border-b border-gray-200 flex justify-between items-center">
              <span>山田 太郎</span>
              <span className="text-[11px] text-gray-500">リーダー</span>
            </li>
            <li className="py-3 px-4 border-b border-gray-200 flex justify-between items-center">
              <span>佐藤 花子</span>
              <button className="py-1 px-2 text-[11px] border border-red-600 text-red-600 rounded bg-white">
                削除
              </button>
            </li>
            <li className="py-3 px-4 flex justify-between items-center">
              <span>鈴木 一郎</span>
              <button className="py-1 px-2 text-[11px] border border-red-600 text-red-600 rounded bg-white">
                削除
              </button>
            </li>
          </ul>
        </div>

        <button
          type="button"
          className="w-full py-3 bg-white border border-gray-800 rounded text-sm"
          onClick={() => setShowInviteModal(true)}>
          招待リンクを生成
        </button>
      </main>
    </div>
  );
}

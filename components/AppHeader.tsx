"use client";

import Link from "next/link";
import { NotificationTrigger } from "@/components/notifications/NotificationTrigger";

/**
 * 認証後画面で共通のヘッダー（02_共通UIコンポーネント定義の AppHeader）
 * 左: 各ページで渡す内容（チーム名 or 戻るリンクなど）
 * 右: 通知・チーム切替・チーム追加・設定リンク（リーダー時のみ）
 */
export type AppHeaderProps = {
  /** 左側に表示する内容（チーム名 or 「← 戻る」リンクなど） */
  leftContent: React.ReactNode;
  /** 設定リンクを表示する場合の teamId（リーダー時のみ表示） */
  teamId?: string;
  /** 設定リンクを表示するか（リーダーのとき true） */
  showSettingsLink?: boolean;
};

export function AppHeader({
  leftContent,
  teamId,
  showSettingsLink = false,
}: AppHeaderProps) {
  return (
    <header className="flex items-center justify-between py-3 px-4 border-b border-gray-200 bg-white">
      <div className="min-w-0 flex-1">{leftContent}</div>
      <div className="flex items-center gap-3 shrink-0">
        <NotificationTrigger />
        <Link
          href="/teams"
          className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
          title="チーム切替"
          aria-label="チーム切替"
        >
          <span className="text-lg" aria-hidden>👤</span>
        </Link>
        <Link
          href="/teams?create=1"
          className="text-[11px] text-indigo-600 hover:underline whitespace-nowrap"
          title="新しいチームを作成"
        >
          チームを追加
        </Link>
        {showSettingsLink && teamId && (
          <Link
            href={`/settings/${teamId}`}
            className="text-[11px] text-gray-500 hover:underline whitespace-nowrap"
          >
            設定（リーダーのみ）
          </Link>
        )}
      </div>
    </header>
  );
}

"use client";

import Link from "next/link";
import { NotificationTrigger } from "@/components/notifications/NotificationTrigger";
import { signOut } from "next-auth/react";

/**
 * 認証後画面で共通のヘッダー（02_共通UIコンポーネント定義の AppHeader）
 * 左: 各ページで渡す内容（チーム名 or 戻るリンクなど）
 * 右: 通知・チーム切替・チーム追加・設定リンク（リーダー時のみ）
 *
 * サーバーコンポーネントからは variant + データのみ渡す（JSX は渡さない）。
 * クライアントからは getBackHeaderProps などで leftContent を渡してもよい。
 */
export type AppHeaderProps =
  | {
      variant: "dashboard";
      teamName: string;
      teamId: string;
      showSettingsLink: boolean;
      leftContent?: never;
    }
  | {
      variant: "back";
      backHref: string;
      leftContent?: never;
    }
  | {
      variant?: never;
      /** 左側に表示する内容（クライアントで getBackHeaderProps などから渡す） */
      leftContent: React.ReactNode;
      teamId?: string;
      showSettingsLink?: boolean;
    };

export function AppHeader(props: AppHeaderProps) {
  const teamId =
    props.variant === "dashboard"
      ? props.teamId
      : "teamId" in props
        ? props.teamId
        : undefined;
  const showSettingsLink =
    props.variant === "dashboard"
      ? props.showSettingsLink
      : "showSettingsLink" in props
        ? props.showSettingsLink ?? false
        : false;

  const leftContent =
    props.variant === "dashboard"
      ? (
          <span
            className="text-sm font-semibold truncate max-w-[180px]"
            title={props.teamName}
          >
            {props.teamName}
          </span>
        )
      : props.variant === "back"
        ? (
            <Link
              href={props.backHref}
              className="text-sm text-gray-700 hover:underline"
            >
              ← 戻る
            </Link>
          )
        : props.leftContent;

  return (
    <header className="flex items-center justify-between py-3 px-4 border-b border-gray-200 bg-white">
      <div className="min-w-0 flex-1">{leftContent}</div>
      <div className="flex items-center gap-2 shrink-0">
        <NotificationTrigger />
        <Link
          href="/teams"
          className="inline-block py-1.5 px-2.5 text-[11px] font-medium text-white bg-indigo-600 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-indigo-600 rounded whitespace-nowrap transition-colors"
          title="チーム切替"
        >
          チーム切替
        </Link>
        {showSettingsLink && (
          <Link
            href="/teams?create=1"
            className="inline-block py-1.5 px-2.5 text-[11px] font-medium text-white bg-indigo-600 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-indigo-600 rounded whitespace-nowrap transition-colors"
            title="新しいチームを作成"
          >
            チームを追加
          </Link>
        )}
        {showSettingsLink && teamId && (
          <Link
            href={`/settings/${teamId}`}
            className="inline-block py-1.5 px-2.5 text-[11px] font-medium text-white bg-indigo-600 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-indigo-600 rounded whitespace-nowrap transition-colors"
          >
            チーム設定
          </Link>
        )}
        <button
          type="button"
          onClick={() => {
            const ok = confirm("ログアウトしますか？");
            if (!ok) return;
            signOut();
          }}
          className="inline-block py-1.5 px-2.5 text-[11px] font-medium text-gray-800 bg-gray-100 hover:bg-gray-200 border border-transparent hover:border-gray-300 rounded whitespace-nowrap transition-colors"
          title="ログアウト"
        >
          ログアウト
        </button>
      </div>
    </header>
  );
}

// --- props 組み立てヘルパー（呼び出し側で使い回し用） ---

/** ダッシュボード用: チーム名 + 設定リンク（リーダー時） */
export function getDashboardHeaderProps(
  teamName: string,
  teamId: string,
  isLeader: boolean
): AppHeaderProps {
  return {
    leftContent: (
      <span
        className="text-sm font-semibold truncate max-w-[180px]"
        title={teamName}
      >
        {teamName}
      </span>
    ),
    teamId,
    showSettingsLink: isLeader,
  };
}

/** 戻るリンク用: ゴール詳細・編集・設定など */
export function getBackHeaderProps(backHref: string): AppHeaderProps {
  return {
    leftContent: (
      <Link href={backHref} className="text-sm text-gray-700 hover:underline">
        ← 戻る
      </Link>
    ),
  };
}

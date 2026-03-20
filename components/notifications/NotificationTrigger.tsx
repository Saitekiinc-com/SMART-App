"use client";

import { useState, useEffect, useCallback } from "react";
import { NotificationListModal } from "./NotificationListModal";

/**
 * ヘッダー用: 通知アイコンクリックで S-08 モーダルを表示。
 * 未読がある場合は赤丸に白数字で件数を表示。
 */
export function NotificationTrigger() {
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const POLL_MS = 3000000; // 未読数を定期的に更新する間隔（30秒）

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (!res.ok) return;
      const data = await res.json();
      const list = data.notifications ?? [];
      const count = list.filter((n: { read?: boolean }) => !n.read).length;
      setUnreadCount(count);
    } catch {
      setUnreadCount(0);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // モーダルを開いている間はバッジを消したままにしたいので、開いていないときだけ未読数をポーリングする
  useEffect(() => {
    if (open) return;
    const id = window.setInterval(() => {
      fetchUnreadCount();
    }, POLL_MS);
    return () => {
      window.clearInterval(id);
    };
  }, [open, fetchUnreadCount, POLL_MS]);

  function handleClose() {
    setOpen(false);
    fetchUnreadCount(); // モーダル閉じたあと未読数を更新
  }

  const badgeLabel = unreadCount > 99 ? "99+" : unreadCount;

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          setUnreadCount(0); // 開いた時点でバッジを消す
        }}
        className="relative w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        title="通知"
        aria-label={unreadCount > 0 ? `通知一覧を開く（未読${unreadCount}件）` : "通知一覧を開く"}
      >
        <span className="text-lg" aria-hidden>🔔</span>
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[14px] h-[14px] px-1 flex items-center justify-center text-[10px] font-bold text-white bg-red-500 rounded-full"
            aria-hidden
          >
            {badgeLabel}
          </span>
        )}
      </button>
      {open && <NotificationListModal onClose={handleClose} />}
    </>
  );
}

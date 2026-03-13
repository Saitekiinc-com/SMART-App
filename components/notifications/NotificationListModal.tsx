"use client";

/**
 * S-08: 通知一覧モーダル
 * GET /api/notifications で取得、クリックで既読・ゴール詳細へ
 */
import Link from "next/link";
import { useEffect, useState } from "react";

interface NotificationListModalProps {
  onClose?: () => void;
}

type NotificationItem = {
  id: string;
  type: string;
  message: string;
  goalId: string | null;
  read: boolean;
  createdAt: string;
};

function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHour = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);
  if (diffMin < 1) return "たった今";
  if (diffMin < 60) return `${diffMin}分前`;
  if (diffHour < 24) return `${diffHour}時間前`;
  if (diffDay === 1) return "昨日";
  if (diffDay < 7) return `${diffDay}日前`;
  return date.toLocaleDateString("ja-JP");
}

export function NotificationListModal({ onClose }: NotificationListModalProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchList() {
      setError("");
      const res = await fetch("/api/notifications");
      if (!res.ok) {
        setError("通知を取得できませんでした");
        setLoading(false);
        return;
      }
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setLoading(false);
    }
    fetchList();
  }, []);

  async function markAsRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  }

  function handleItemClick(n: NotificationItem) {
    if (!n.read) markAsRead(n.id);
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 box-border z-50">
      <div className="w-full max-w-[360px] bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center py-4 px-4 border-b border-gray-200">
          <h2 className="text-base font-semibold m-0">通知一覧</h2>
          <button
            type="button"
            onClick={onClose}
            className="py-1 px-2 border border-gray-300 rounded text-xs hover:bg-gray-100"
          >
            閉じる
          </button>
        </div>
        <div className="max-h-80 overflow-y-auto">
          {loading && (
            <div className="py-6 px-4 text-center text-sm text-gray-500">
              読み込み中…
            </div>
          )}
          {error && (
            <div className="py-4 px-4 text-sm text-red-600">{error}</div>
          )}
          {!loading && !error && notifications.length === 0 && (
            <div className="py-6 px-4 text-center text-sm text-gray-500">
              通知はありません
            </div>
          )}
          {!loading &&
            notifications.map((n) => {
              const content = (
                <div
                  className={`py-3.5 px-4 border-b border-gray-200 cursor-pointer hover:bg-gray-50 ${
                    !n.read ? "bg-gray-50" : ""
                  }`}
                  onClick={() => handleItemClick(n)}
                >
                  <p className="m-0 mb-1 text-[13px] font-medium">{n.message}</p>
                  <p className="m-0 text-[11px] text-gray-400">
                    {n.read ? "既読" : "未読"}　{formatRelativeTime(n.createdAt)}
                  </p>
                </div>
              );
              if (n.goalId) {
                return (
                  <Link
                    key={n.id}
                    href={`/goals/${n.goalId}`}
                    onClick={() => {
                      handleItemClick(n);
                      onClose?.();
                    }}
                  >
                    {content}
                  </Link>
                );
              }
              return <div key={n.id}>{content}</div>;
            })}
        </div>
        <p className="m-0 py-3 px-4 text-[11px] text-gray-400 border-t border-gray-200">
          画面ID: S-08　通知クリック→ゴール詳細へ　閉じる→元画面に留まる
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { NotificationListModal } from "./NotificationListModal";

/**
 * ヘッダー用: 通知アイコンクリックで S-08 モーダルを表示
 */
export function NotificationTrigger() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded"
        title="通知"
        aria-label="通知一覧を開く"
      >
        <span className="text-lg" aria-hidden>🔔</span>
      </button>
      {open && <NotificationListModal onClose={() => setOpen(false)} />}
    </>
  );
}

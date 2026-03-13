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
        className="w-6 h-6 border border-gray-300 rounded flex items-center justify-center hover:bg-gray-100"
        title="通知"
        aria-label="通知一覧を開く"
      >
        <span className="sr-only">通知</span>
      </button>
      {open && <NotificationListModal onClose={() => setOpen(false)} />}
    </>
  );
}

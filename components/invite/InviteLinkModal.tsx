"use client";

/**
 * S-10: 招待リンク生成モーダル（ワイヤーフレーム準拠）
 * チーム設定から「招待リンクを生成」で表示。閉じる→チーム設定に留まる
 */
import { useState } from "react";

interface InviteLinkModalProps {
  onClose?: () => void;
  inviteUrl: string;
}

export function InviteLinkModal({ onClose, inviteUrl }: InviteLinkModalProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-start justify-center p-6 box-border z-50">
      <div className="w-full max-w-[360px] bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="flex justify-between items-center py-4 px-4 border-b border-gray-200">
          <h2 className="text-base font-semibold m-0">招待リンク</h2>
          <button
            type="button"
            onClick={onClose}
            className="py-1 px-2 border border-gray-300 rounded text-xs"
          >
            閉じる
          </button>
        </div>
        <div className="p-4">
          <p className="m-0 mb-2 text-xs text-gray-500">招待URL</p>
          <div className="py-3 px-3 bg-gray-100 border border-gray-200 rounded text-xs break-all mb-3">
            {inviteUrl}
          </div>
          <button
            type="button"
            onClick={handleCopy}
            className="w-full py-3 bg-gray-800 text-white rounded text-sm"
          >
            {copied ? "コピーしました" : "コピー"}
          </button>
          <p className="mt-3 m-0 text-[11px] text-gray-400">有効期限: 7日間</p>
        </div>
        <p className="m-0 py-3 px-4 text-[11px] text-gray-400 border-t border-gray-200">
          画面ID: S-10　閉じる→チーム設定に留まる
        </p>
      </div>
    </div>
  );
}

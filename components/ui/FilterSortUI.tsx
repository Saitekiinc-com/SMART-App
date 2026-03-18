"use client";

import { useRouter } from "next/navigation";

const STATUS_OPTIONS = [
  { value: "ALL", label: "すべて" },
  { value: "TODO", label: "未着手" },
  { value: "IN_PROGRESS", label: "進行中" },
  { value: "DONE", label: "完了" },
] as const;

const SORT_OPTIONS = [
  { value: "votes_desc", label: "投票数順（多い）" },
  { value: "votes_asc", label: "投票数順（少ない）" },
  { value: "deadline_asc", label: "期限が近い順" },
  { value: "createdAt_desc", label: "新しい順" },
] as const;

type Props = {
  teamId: string;
  status: string; // ALL | TODO | IN_PROGRESS | DONE
  sortBy: string; // votes_desc | votes_asc | deadline_asc | createdAt_desc
};

export function FilterSortUI({ teamId, status, sortBy }: Props) {
  const router = useRouter();

  function push(nextStatus: string, nextSort: string) {
    const params = new URLSearchParams();
    params.set("status", nextStatus);
    params.set("sort", nextSort);
    router.push(`/dashboard/${teamId}?${params.toString()}`);
  }

  return (
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex flex-wrap gap-2">
        {STATUS_OPTIONS.map((opt) => {
          const active = status === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => push(opt.value, sortBy)}
              className={`text-xs py-1.5 px-2.5 border rounded ${
                active ? "border-gray-300 bg-gray-50 text-gray-800" : "border-gray-200 text-gray-400"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>

      <div className="flex items-center gap-2">
        <select
          value={sortBy}
          onChange={(e) => push(status, e.target.value)}
          className="text-xs py-1.5 px-2.5 border border-gray-300 rounded bg-white focus:outline-none"
          aria-label="並び替え"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}


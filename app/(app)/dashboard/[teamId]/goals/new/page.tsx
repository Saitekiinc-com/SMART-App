"use client";

/**
 * S-05: SMARTゴール作成ウィザード
 * 6ステップのフォーム・送信・作成後はゴール詳細へ遷移
 */
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";

const STEPS = [
  { label: "具体的（Specific）", key: "specific" },
  { label: "測定可能（Measurable）", key: "measurable" },
  { label: "達成可能（Achievable）", key: "achievable" },
  { label: "関連性（Relevant）", key: "relevant" },
  { label: "期限", key: "deadline" },
  { label: "アプローチ", key: "approaches" },
];

export default function NewGoalWizardPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = params.teamId as string;

  const [step, setStep] = useState(0);
  const [title, setTitle] = useState("");
  const [specific, setSpecific] = useState("");
  const [measurable, setMeasurable] = useState("");
  const [achievable, setAchievable] = useState(true);
  const [relevant, setRelevant] = useState("");
  const [deadline, setDeadline] = useState("");
  const [approaches, setApproaches] = useState<string[]>([""]);

  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function addApproach() {
    setApproaches((prev) => [...prev, ""]);
  }

  function removeApproach(index: number) {
    setApproaches((prev) => prev.filter((_, i) => i !== index));
  }

  function setApproachAt(index: number, value: string) {
    setApproaches((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
  }

  function validateStep(): boolean {
    setError("");
    if (step === 0) {
      const t = title.trim();
      const s = specific.trim();
      if (!t) {
        setError("タイトルを入力してください");
        return false;
      }
      if (t.length > 100) {
        setError("タイトルは100文字以内にしてください");
        return false;
      }
      if (!s) {
        setError("具体的な内容を入力してください");
        return false;
      }
    }
    if (step === 1) {
      if (!measurable.trim()) {
        setError("測定可能（Measurable）を入力してください");
        return false;
      }
    }
    if (step === 3) {
      if (!relevant.trim()) {
        setError("関連性（Relevant）を入力してください");
        return false;
      }
    }
    if (step === 4) {
      const d = deadline.trim();
      if (!d) {
        setError("期限を入力してください");
        return false;
      }
      const date = new Date(d);
      if (Number.isNaN(date.getTime())) {
        setError("有効な日付を入力してください");
        return false;
      }
    }
    return true;
  }

  function validateAll(): boolean {
    setError("");
    if (!title.trim()) {
      setError("タイトルを入力してください");
      return false;
    }
    if (title.trim().length > 100) {
      setError("タイトルは100文字以内にしてください");
      return false;
    }
    if (!specific.trim()) {
      setError("具体的な内容を入力してください");
      return false;
    }
    if (!measurable.trim()) {
      setError("測定可能（Measurable）を入力してください");
      return false;
    }
    if (!relevant.trim()) {
      setError("関連性（Relevant）を入力してください");
      return false;
    }
    const d = deadline.trim();
    if (!d) {
      setError("期限を入力してください");
      return false;
    }
    if (Number.isNaN(new Date(d).getTime())) {
      setError("有効な日付を入力してください");
      return false;
    }
    return true;
  }

  async function handleSubmit() {
    if (!validateAll()) return;
    setError("");
    setSubmitting(true);
    try {
      const body = {
        title: title.trim(),
        specific: specific.trim(),
        measurable: measurable.trim(),
        achievable,
        relevant: relevant.trim(),
        deadline: deadline.trim(),
        approaches: approaches
          .map((c) => c.trim())
          .filter(Boolean)
          .map((content) => ({ content })),
      };
      const res = await fetch(`/api/teams/${teamId}/goals`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError((data.error as string) || "作成に失敗しました");
        return;
      }
      const goalId = data.id as string;
      router.push(`/goals/${goalId}`);
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (step < 5) {
      if (!validateStep()) return;
      setStep((s) => s + 1);
    } else {
      handleSubmit();
    }
  }

  const currentStep = step + 1;
  const isLastStep = step === 5;

  return (
    <div className="w-full max-w-3xl min-h-screen mx-auto bg-white border border-gray-300 shadow-sm">
      <header className="py-3 px-4 border-b border-gray-200">
        <Link href={`/dashboard/${teamId}`} className="text-sm text-gray-700 hover:underline">
          ← 戻る
        </Link>
      </header>

      <main className="p-4">
        <p className="text-xs text-gray-400 mb-2">画面ID: S-05</p>
        <h1 className="text-lg font-semibold text-gray-800 mb-4">SMARTゴール作成ウィザード</h1>

        <div className="mb-6">
          <p className="text-xs text-gray-500 mb-2">ステップ {currentStep} / 6</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <span
                key={i}
                className={`flex-1 h-1 rounded-sm ${i <= currentStep ? "bg-gray-800" : "bg-gray-200"}`}
              />
            ))}
          </div>
        </div>

        {/* Step 0: タイトル・具体的 */}
        {step === 0 && (
          <>
            <p className="text-xs text-gray-500 mb-2">1. 具体的（Specific）</p>
            <div className="space-y-4 mb-5">
              <div>
                <label className="block text-xs mb-1 text-gray-600">ゴールのタイトル</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="例: 〇〇を達成する"
                  maxLength={100}
                  className="w-full py-2.5 px-2.5 border border-gray-300 rounded box-border text-sm"
                />
                <p className="text-[11px] text-gray-400 mt-0.5">{title.length}/100文字</p>
              </div>
              <div>
                <label className="block text-xs mb-1 text-gray-600">具体的な内容</label>
                <textarea
                  value={specific}
                  onChange={(e) => setSpecific(e.target.value)}
                  placeholder="何を、どのように行うか具体的に"
                  rows={3}
                  className="w-full py-2.5 px-2.5 border border-gray-300 rounded box-border text-sm resize-none"
                />
              </div>
            </div>
          </>
        )}

        {/* Step 1: 測定可能 */}
        {step === 1 && (
          <>
            <p className="text-xs text-gray-500 mb-2">2. 測定可能（Measurable）</p>
            <div className="mb-5">
              <label className="block text-xs mb-1 text-gray-600">どうやって達成を測りますか？</label>
              <textarea
                value={measurable}
                onChange={(e) => setMeasurable(e.target.value)}
                placeholder="数値や指標で測定できるように"
                rows={3}
                className="w-full py-2.5 px-2.5 border border-gray-300 rounded box-border text-sm resize-none"
              />
            </div>
          </>
        )}

        {/* Step 2: 達成可能 */}
        {step === 2 && (
          <>
            <p className="text-xs text-gray-500 mb-2">3. 達成可能（Achievable）</p>
            <div className="mb-5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={achievable}
                  onChange={(e) => setAchievable(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">現実的に達成可能だと思う</span>
              </label>
              <p className="text-[11px] text-gray-400 mt-2">期限とリソースを考慮して、達成可能か確認してください。</p>
            </div>
          </>
        )}

        {/* Step 3: 関連性 */}
        {step === 3 && (
          <>
            <p className="text-xs text-gray-500 mb-2">4. 関連性（Relevant）</p>
            <div className="mb-5">
              <label className="block text-xs mb-1 text-gray-600">チームや自分にとってなぜ重要ですか？</label>
              <textarea
                value={relevant}
                onChange={(e) => setRelevant(e.target.value)}
                placeholder="目的や意義"
                rows={3}
                className="w-full py-2.5 px-2.5 border border-gray-300 rounded box-border text-sm resize-none"
              />
            </div>
          </>
        )}

        {/* Step 4: 期限 */}
        {step === 4 && (
          <>
            <p className="text-xs text-gray-500 mb-2">5. 期限</p>
            <div className="mb-5">
              <label className="block text-xs mb-1 text-gray-600">達成期限</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full py-2.5 px-2.5 border border-gray-300 rounded box-border text-sm"
              />
            </div>
          </>
        )}

        {/* Step 5: アプローチ */}
        {step === 5 && (
          <>
            <p className="text-xs text-gray-500 mb-2">6. アプローチ（手順）</p>
            <div className="mb-5 space-y-3">
              <p className="text-xs text-gray-600">達成のための手順を追加してください（任意・複数可）</p>
              {approaches.map((content, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="text"
                    value={content}
                    onChange={(e) => setApproachAt(i, e.target.value)}
                    placeholder={`手順 ${i + 1}`}
                    maxLength={200}
                    className="flex-1 py-2 px-2.5 border border-gray-300 rounded text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => removeApproach(i)}
                    disabled={approaches.length <= 1}
                    className="py-2 px-3 text-gray-500 hover:text-red-600 disabled:opacity-40 text-sm"
                    aria-label="削除"
                  >
                    削除
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addApproach}
                className="text-sm text-gray-600 border border-dashed border-gray-300 rounded py-2 px-3 w-full hover:bg-gray-50"
              >
                + 手順を追加
              </button>
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-red-600 mb-3" role="alert">
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={step === 0}
            className="py-2.5 px-5 bg-white border border-gray-300 rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
          >
            戻る
          </button>
          <button
            type="button"
            onClick={goNext}
            disabled={submitting}
            className="flex-1 py-2.5 bg-gray-800 text-white rounded text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-700"
          >
            {submitting ? "作成中…" : isLastStep ? "作成する" : "次へ"}
          </button>
        </div>
        <Link
          href={`/dashboard/${teamId}`}
          className="block w-full mt-3 py-2.5 text-center text-gray-400 text-[13px] hover:text-gray-600"
        >
          キャンセル
        </Link>
      </main>
    </div>
  );
}

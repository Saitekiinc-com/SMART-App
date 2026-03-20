/**
 * S-09 用チームフォームバリデーション（作成・更新共通）
 * 08_純粋関数の設計
 */
const NAME_MAX = 50;
const DESCRIPTION_MAX = 200;

export function validateTeamForm(data: {
  name?: string | null;
  description?: string | null;
}): { valid: boolean; error?: string } {
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) return { valid: false, error: "チーム名を入力してください" };
  if (name.length > NAME_MAX) {
    return { valid: false, error: `チーム名は${NAME_MAX}文字以内にしてください` };
  }
  if (
    typeof data.description === "string" &&
    data.description.trim().length > DESCRIPTION_MAX
  ) {
    return { valid: false, error: `説明は${DESCRIPTION_MAX}文字以内にしてください` };
  }
  return { valid: true };
}

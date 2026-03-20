/**
 * POST /api/auth/signup
 * S-01 サインアップ（メール・パスワードでユーザー登録）
 */
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

const EMAIL_MAX = 255;
const NAME_MAX = 100;
const PASSWORD_MIN = 8;

export async function POST(request: Request) {
  let body: { email?: string; password?: string; name?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストが不正です" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  const name = typeof body.name === "string" ? body.name.trim() : email.split("@")[0] || "ユーザー";

  if (!email) {
    return Response.json({ error: "メールアドレスを入力してください" }, { status: 400 });
  }
  if (email.length > EMAIL_MAX) {
    return Response.json({ error: "メールアドレスが長すぎます" }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: "メールアドレスの形式が正しくありません" }, { status: 400 });
  }
  if (password.length < PASSWORD_MIN) {
    return Response.json({ error: `パスワードは${PASSWORD_MIN}文字以上にしてください` }, { status: 400 });
  }
  if (name.length > NAME_MAX) {
    return Response.json({ error: `名前は${NAME_MAX}文字以内にしてください` }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return Response.json({ error: "このメールアドレスはすでに登録されています" }, { status: 409 });
  }

  const passwordHash = await hashPassword(password);
  await prisma.user.create({
    data: {
      email,
      name: name || email.split("@")[0],
      passwordHash,
    },
  });

  return Response.json({ message: "登録しました。ログインしてください。" });
}

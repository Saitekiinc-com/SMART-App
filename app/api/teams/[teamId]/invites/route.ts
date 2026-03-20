import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "node:crypto";
const INVITE_EXPIRES_DAYS = 7;
/**
 * GET /api/teams/{teamId}/invites
 * まだ使わないので一旦 TODO のままにしておきます。
 */
export async function GET() {
  return Response.json({ message: "TODO: implement" }, { status: 501 });
}
/**
 * POST /api/teams/{teamId}/invites
 * 招待リンクを生成して invitations に保存し、招待URLを返す。
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  // 1. 認証チェック
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }
  // 2. URL の teamId を取り出す（Next.js 15 では params が Promise）
  const { teamId } = await context.params;
  if (!teamId) {
    return Response.json({ error: "teamId が必要です" }, { status: 400 });
  }
  // 3. ログインユーザーを DB から取得
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return Response.json(
      { error: "ユーザーがDBに登録されていません" },
      { status: 404 }
    );
  }
  // 4. チームとメンバー権限を確認（このチームのメンバーでないと招待できない）
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    include: {
      members: {
        where: { userId: user.id },
      },
    },
  });
  if (!team) {
    return Response.json({ error: "チームが見つかりません" }, { status: 404 });
  }
  if (team.members.length === 0) {
    return Response.json(
      { error: "このチームのメンバーではありません" },
      { status: 403 }
    );
  }
  // 5. 招待用トークンを生成
  const token = crypto.randomBytes(32).toString("hex");
  // 6. 有効期限（今日から 7 日後）
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + INVITE_EXPIRES_DAYS);
  // 7. invitations に 1 行追加
  await prisma.invitation.create({
    data: {
      token,
      teamId,
      inviterId: user.id,
      expiresAt,
    },
  });
  // 8. 返す用の招待URLを組み立てる
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const normalizedBase = baseUrl.replace(/\/$/, ""); // 末尾の / を消す
  const inviteUrl = `${normalizedBase}/invite/${token}`;
  // 9. JSON で返す
  return Response.json({
    token,
    inviteUrl,
    expiresAt: expiresAt.toISOString(),
  });
}
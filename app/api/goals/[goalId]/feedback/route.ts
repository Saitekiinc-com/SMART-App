/**
 * POST /api/goals/{goalId}/feedback
 * S-06 完了時フィードバック保存
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ goalId: string }> };

export async function POST(request: Request, context: Context) {
  const { goalId } = await context.params;

  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return Response.json({ error: "ユーザーがDBに登録されていません" }, { status: 404 });
  }

  const goal = await prisma.smartGoal.findUnique({
    where: { id: goalId },
    select: { teamId: true, status: true, ownerId: true, title: true },
  });
  if (!goal) {
    return Response.json({ error: "ゴールが見つかりません" }, { status: 404 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: { teamId_userId: { teamId: goal.teamId, userId: user.id } },
  });
  if (!membership) {
    return Response.json({ error: "このゴールにアクセスする権限がありません" }, { status: 403 });
  }

  if (goal.status !== "DONE") {
    return Response.json({ error: "フィードバックは完了(DONE)のときのみ保存できます" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSONの形式が不正です" }, { status: 400 });
  }

  const o = body as Record<string, unknown>;
  const content = typeof o?.content === "string" ? o.content.trim() : "";
  if (!content) {
    return Response.json({ error: "フィードバックを入力してください" }, { status: 400 });
  }
  if (content.length > 2000) {
    return Response.json({ error: "フィードバックは2000文字以内にしてください" }, { status: 400 });
  }

  await prisma.goalFeedback.upsert({
    where: { goalId },
    update: { content },
    create: { goalId, userId: user.id, content },
  });

  return Response.json({ ok: true });
}

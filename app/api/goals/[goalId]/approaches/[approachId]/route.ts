/**
 * PATCH /api/goals/{goalId}/approaches/{approachId} - アプローチの完了状態をトグル
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getAuthAndApproach(goalId: string, approachId: string) {
  const session = await auth();
  if (!session?.user?.email) {
    return { error: "ログインしてください", status: 401 as const };
  }
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return { error: "ユーザーがDBに登録されていません", status: 404 as const };
  }
  const approach = await prisma.approach.findFirst({
    where: { id: approachId, goalId },
    select: { id: true, completed: true },
  });
  if (!approach) {
    return { error: "アプローチが見つかりません", status: 404 as const };
  }
  const goal = await prisma.smartGoal.findUnique({
    where: { id: goalId },
    select: { teamId: true },
  });
  if (!goal) {
    return { error: "ゴールが見つかりません", status: 404 as const };
  }
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId: goal.teamId, userId: user.id },
    },
  });
  if (!membership) {
    return { error: "このゴールにアクセスする権限がありません", status: 403 as const };
  }
  return { approach };
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ goalId: string; approachId: string }> }
) {
  const { goalId, approachId } = await context.params;
  const result = await getAuthAndApproach(goalId, approachId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSONの形式が不正です" }, { status: 400 });
  }
  const completed = (body as Record<string, unknown>)?.completed;
  if (typeof completed !== "boolean") {
    return Response.json({ error: "completed は true または false を指定してください" }, { status: 400 });
  }
  await prisma.approach.update({
    where: { id: approachId },
    data: { completed },
  });
  return Response.json({ ok: true });
}

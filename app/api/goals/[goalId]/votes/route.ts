/**
 * POST /api/goals/{goalId}/votes - 投票する
 * DELETE /api/goals/{goalId}/votes - 投票を解除する
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getAuthAndAccess(goalId: string) {
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
  const goal = await prisma.smartGoal.findUnique({
    where: { id: goalId },
    select: { id: true, teamId: true },
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
    return { error: "このゴールに投票する権限がありません", status: 403 as const };
  }
  return { user, goalId };
}

export async function POST(_request: Request, context: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await context.params;
  const result = await getAuthAndAccess(goalId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { user } = result;
  const existing = await prisma.vote.findUnique({
    where: { goalId_userId: { goalId, userId: user.id } },
  });
  if (existing) {
    return Response.json({ error: "すでに投票済みです" }, { status: 400 });
  }
  const goal = await prisma.smartGoal.findUnique({
    where: { id: goalId },
    select: { title: true, owner: { select: { userId: true } } },
  });
  if (!goal) {
    return Response.json({ error: "ゴールが見つかりません" }, { status: 404 });
  }
  const ownerUserId = goal.owner.userId;
  await prisma.$transaction([
    prisma.vote.create({
      data: { goalId, userId: user.id },
    }),
    prisma.smartGoal.update({
      where: { id: goalId },
      data: { voteCount: { increment: 1 } },
    }),
  ]);
  if (ownerUserId !== user.id) {
    const message = `${user.name}さんが「${goal.title}」に投票しました`;
    await prisma.notification.create({
      data: {
        userId: ownerUserId,
        type: "VOTE",
        message: message.slice(0, 500),
        goalId: goalId,
      },
    });
  }
  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ goalId: string }> }) {
  const { goalId } = await context.params;
  const result = await getAuthAndAccess(goalId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { user } = result;
  const existing = await prisma.vote.findUnique({
    where: { goalId_userId: { goalId, userId: user.id } },
  });
  if (!existing) {
    return Response.json({ error: "投票していません" }, { status: 400 });
  }
  await prisma.$transaction([
    prisma.vote.delete({
      where: { goalId_userId: { goalId, userId: user.id } },
    }),
    prisma.smartGoal.update({
      where: { id: goalId },
      data: { voteCount: { decrement: 1 } },
    }),
  ]);
  return Response.json({ ok: true });
}

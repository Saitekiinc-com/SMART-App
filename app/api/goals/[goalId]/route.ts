/**
 * GET /api/goals/{goalId} - ゴール詳細取得
 * PUT /api/goals/{goalId} - ゴール更新（オーナーまたはリーダーのみ）
 * PATCH /api/goals/{goalId} - ステータス更新（オーナーまたはリーダーのみ）
 * DELETE /api/goals/{goalId} - ゴール削除（オーナーまたはリーダーのみ）
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

type Context = { params: Promise<{ goalId: string }> };

async function getAuthAndMembership(goalId: string) {
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
    include: {
      team: { select: { id: true } },
      approaches: { orderBy: { sortOrder: "asc" } },
      feedback: { select: { content: true } },
      _count: { select: { votes: true } },
    },
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
  const hasVoted = await prisma.vote.findUnique({
    where: {
      goalId_userId: { goalId, userId: user.id },
    },
  });
  const canEdit = goal.ownerId === membership.id || membership.role === "leader";
  return {
    user,
    goal,
    membership,
    hasVoted: !!hasVoted,
    canEdit,
  };
}

export async function GET(_request: Request, context: Context) {
  const { goalId } = await context.params;
  const result = await getAuthAndMembership(goalId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { goal, hasVoted, canEdit } = result;
  return Response.json({
    id: goal.id,
    teamId: goal.teamId,
    title: goal.title,
    specific: goal.specific,
    measurable: goal.measurable,
    achievable: goal.achievable,
    relevant: goal.relevant,
    deadline: goal.deadline.toISOString().slice(0, 10),
    status: goal.status,
    voteCount: goal._count.votes,
    feedback: goal.feedback?.content ?? null,
    hasVoted,
    canEdit,
    approaches: goal.approaches.map((a) => ({
      id: a.id,
      content: a.content,
      completed: a.completed,
      sortOrder: a.sortOrder,
    })),
  });
}

const TITLE_MAX = 100;
const APPROACH_CONTENT_MAX = 200;

export async function PUT(request: Request, context: Context) {
  const { goalId } = await context.params;
  const result = await getAuthAndMembership(goalId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  if (!result.canEdit) {
    return Response.json({ error: "編集権限がありません" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSONの形式が不正です" }, { status: 400 });
  }
  const o = body as Record<string, unknown>;
  const title = typeof o?.title === "string" ? o.title.trim() : "";
  const specific = typeof o?.specific === "string" ? o.specific.trim() : "";
  const measurable = typeof o?.measurable === "string" ? o.measurable.trim() : "";
  const achievable = o?.achievable === true;
  const relevant = typeof o?.relevant === "string" ? o.relevant.trim() : "";
  const deadlineStr = typeof o?.deadline === "string" ? o.deadline.trim() : "";
  const approachesInput = Array.isArray(o?.approaches) ? o.approaches : [];

  if (!title || title.length > TITLE_MAX) {
    return Response.json(
      { error: title ? `タイトルは${TITLE_MAX}文字以内` : "タイトルを入力してください" },
      { status: 400 }
    );
  }
  if (!specific) {
    return Response.json({ error: "具体的（Specific）を入力してください" }, { status: 400 });
  }
  if (!measurable) {
    return Response.json({ error: "測定可能（Measurable）を入力してください" }, { status: 400 });
  }
  if (!relevant) {
    return Response.json({ error: "関連性（Relevant）を入力してください" }, { status: 400 });
  }
  const deadline = new Date(deadlineStr);
  if (Number.isNaN(deadline.getTime())) {
    return Response.json({ error: "期限を正しい日付で指定してください" }, { status: 400 });
  }

  const approachContents: string[] = [];
  for (let i = 0; i < approachesInput.length; i++) {
    const a = approachesInput[i];
    const content =
      typeof a === "object" && a !== null && typeof (a as Record<string, unknown>).content === "string"
        ? (a as Record<string, string>).content.trim()
        : "";
    if (content.length > APPROACH_CONTENT_MAX) {
      return Response.json(
        { error: `アプローチ${i + 1}は${APPROACH_CONTENT_MAX}文字以内にしてください` },
        { status: 400 }
      );
    }
    approachContents.push(content);
  }

  await prisma.$transaction(async (tx) => {
    await tx.smartGoal.update({
      where: { id: goalId },
      data: {
        title,
        specific,
        measurable,
        achievable,
        relevant,
        deadline,
      },
    });
    await tx.approach.deleteMany({ where: { goalId } });
    if (approachContents.length > 0) {
      await tx.approach.createMany({
        data: approachContents.map((content, i) => ({
          goalId,
          content: content || "(未入力)",
          sortOrder: i,
        })),
      });
    }
  });

  return Response.json({ ok: true });
}

export async function PATCH(request: Request, context: Context) {
  const { goalId } = await context.params;
  const result = await getAuthAndMembership(goalId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  if (!result.canEdit) {
    return Response.json({ error: "ステータス変更の権限がありません" }, { status: 403 });
  }
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSONの形式が不正です" }, { status: 400 });
  }
  const status = (body as Record<string, unknown>)?.status;
  if (status !== "TODO" && status !== "IN_PROGRESS" && status !== "DONE") {
    return Response.json({ error: "status は TODO / IN_PROGRESS / DONE のいずれかを指定してください" }, { status: 400 });
  }
  await prisma.smartGoal.update({
    where: { id: goalId },
    data: { status },
  });

  // F-013: ステータス変更 → 所有者とリーダーへ。ゴール完了(DONE) → チーム全員へ
  const STATUS_LABEL: Record<string, string> = {
    TODO: "未着手",
    IN_PROGRESS: "進行中",
    DONE: "完了",
  };
  const goalWithOwner = await prisma.smartGoal.findUnique({
    where: { id: goalId },
    select: { title: true, teamId: true, owner: { select: { userId: true } } },
  });
  if (goalWithOwner) {
    const teamId = goalWithOwner.teamId;
    const ownerUserId = goalWithOwner.owner.userId;
    const members = await prisma.teamMember.findMany({
      where: { teamId },
      select: { userId: true, role: true },
    });
    const changerId = result.user.id;
    const excludeChanger = (id: string) => id !== changerId;
    const title = goalWithOwner.title;
    const statusLabel = STATUS_LABEL[status] ?? status;

    if (status === "DONE") {
      const message = `「${title}」が完了しました`.slice(0, 500);
      const recipientIds = members.map((m) => m.userId).filter(excludeChanger);
      if (recipientIds.length > 0) {
        await prisma.notification.createMany({
          data: recipientIds.map((userId) => ({
            userId,
            type: "GOAL_COMPLETED",
            message,
            goalId,
          })),
        });
      }
    } else {
      const message = `「${title}」のステータスが${statusLabel}に変更されました`.slice(0, 500);
      const leaderIds = members.filter((m) => m.role === "leader").map((m) => m.userId);
      const recipientIds = [ownerUserId, ...leaderIds].filter((id, i, arr) => arr.indexOf(id) === i).filter(excludeChanger);
      if (recipientIds.length > 0) {
        await prisma.notification.createMany({
          data: recipientIds.map((userId) => ({
            userId,
            type: "STATUS_CHANGED",
            message,
            goalId,
          })),
        });
      }
    }
  }

  return Response.json({ ok: true });
}

export async function DELETE(_request: Request, context: Context) {
  const { goalId } = await context.params;
  const result = await getAuthAndMembership(goalId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  if (!result.canEdit) {
    return Response.json({ error: "削除権限がありません" }, { status: 403 });
  }
  await prisma.smartGoal.delete({ where: { id: goalId } });
  return Response.json({ ok: true });
}

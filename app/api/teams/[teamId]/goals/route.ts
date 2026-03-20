/**
 * GET /api/teams/{teamId}/goals
 * S-04 ゴール一覧取得（認証済みかつそのチームのメンバーのみ）
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const { teamId } = await context.params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return Response.json({ error: "ユーザーがDBに登録されていません" }, { status: 404 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: user.id },
    },
  });
  if (!membership) {
    return Response.json({ error: "このチームに参加していません" }, { status: 403 });
  }

  const goals = await prisma.smartGoal.findMany({
    where: { teamId },
    include: {
      _count: { select: { votes: true, approaches: true } },
      approaches: { select: { completed: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const list = goals.map((g) => {
    const approachCompleted = g.approaches.filter((a) => a.completed).length;
    return {
      id: g.id,
      title: g.title,
      status: g.status,
      voteCount: g._count.votes,
      approachTotal: g._count.approaches,
      approachCompleted,
    };
  });

  return Response.json({ goals: list });
}

const TITLE_MAX = 100;
const APPROACH_CONTENT_MAX = 200;

/** POST: ゴール作成（認証済み・チームメンバー、オーナーは自分） */
export async function POST(
  request: Request,
  context: { params: Promise<{ teamId: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const { teamId } = await context.params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return Response.json({ error: "ユーザーがDBに登録されていません" }, { status: 404 });
  }

  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: user.id },
    },
  });
  if (!membership) {
    return Response.json({ error: "このチームに参加していません" }, { status: 403 });
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

  if (!title) {
    return Response.json({ error: "タイトルを入力してください" }, { status: 400 });
  }
  if (title.length > TITLE_MAX) {
    return Response.json({ error: `タイトルは${TITLE_MAX}文字以内にしてください` }, { status: 400 });
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
    return Response.json({ error: "期限（deadline）を正しい日付で指定してください" }, { status: 400 });
  }

  const approachContents: string[] = [];
  for (let i = 0; i < approachesInput.length; i++) {
    const a = approachesInput[i];
    const content = typeof a === "object" && a !== null && typeof (a as Record<string, unknown>).content === "string"
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

  const goal = await prisma.smartGoal.create({
    data: {
      teamId,
      title,
      specific,
      measurable,
      achievable,
      relevant,
      deadline,
      ownerId: membership.id,
      status: "TODO",
    },
  });

  if (approachContents.length > 0) {
    await prisma.approach.createMany({
      data: approachContents.map((content, i) => ({
        goalId: goal.id,
        content: content || "(未入力)",
        sortOrder: i,
      })),
    });
  }

  // F-013: 新ゴール作成 → チーム全員（作成者以外）に通知
  const creatorName = user.name ?? session.user?.name ?? "メンバー";
  const message = `${creatorName}さんが「${goal.title}」を新規作成しました`.slice(0, 500);
  const teamMembers = await prisma.teamMember.findMany({
    where: { teamId },
    select: { userId: true },
  });
  const recipientIds = teamMembers.filter((m) => m.userId !== user.id).map((m) => m.userId);
  if (recipientIds.length > 0) {
    await prisma.notification.createMany({
      data: recipientIds.map((userId) => ({
        userId,
        type: "GOAL_CREATED",
        message,
        goalId: goal.id,
      })),
    });
  }

  return Response.json({ id: goal.id }, { status: 201 });
}

/**
 * GET /api/teams/{teamId}
 * PUT /api/teams/{teamId}
 * S-09 チーム情報取得・更新
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

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, name: true, description: true },
  });
  if (!team) {
    return Response.json({ error: "チームが見つかりません" }, { status: 404 });
  }

  return Response.json({
    id: team.id,
    name: team.name,
    description: team.description ?? undefined,
  });
}

export async function PUT() {
  return Response.json({ message: "TODO: implement" }, { status: 501 });
}

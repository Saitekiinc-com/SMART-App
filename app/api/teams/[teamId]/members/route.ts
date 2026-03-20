/**
 * GET /api/teams/{teamId}/members
 * S-09 メンバー一覧取得（そのチームのメンバーのみアクセス可）
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

  const myMembership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: user.id },
    },
  });
  if (!myMembership) {
    return Response.json({ error: "このチームに参加していません" }, { status: 403 });
  }

  const members = await prisma.teamMember.findMany({
    where: { teamId },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const list = members.map((m) => ({
    id: m.id,
    userId: m.userId,
    name: m.user.name,
    email: m.user.email,
    role: m.role as "leader" | "member",
  }));

  return Response.json({ members: list });
}

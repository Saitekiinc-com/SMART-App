import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/invites/{token}/accept
 * S-02 招待受諾。ログイン中のユーザーをチームに追加し、招待を使用済みにする。
 */
export async function POST(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const session = await auth();
  if (!session?.user?.email) {
    return Response.json({ error: "ログインしてください" }, { status: 401 });
  }

  const { token } = await context.params;
  if (!token) {
    return Response.json({ error: "token が必要です" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    return Response.json({ error: "ユーザーが見つかりません" }, { status: 404 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: { team: true },
  });

  if (!invitation) {
    return Response.json({ error: "招待が見つかりません" }, { status: 404 });
  }
  if (invitation.used) {
    return Response.json({ error: "この招待はすでに使用されています" }, { status: 400 });
  }
  if (new Date() > invitation.expiresAt) {
    return Response.json({ error: "招待の有効期限が切れています" }, { status: 400 });
  }

  const existingMember = await prisma.teamMember.findFirst({
    where: { teamId: invitation.teamId, userId: user.id },
  });
  if (existingMember) {
    return Response.json(
      { error: "すでにこのチームに参加しています", teamId: invitation.teamId },
      { status: 400 }
    );
  }

  await prisma.$transaction([
    prisma.teamMember.create({
      data: {
        teamId: invitation.teamId,
        userId: user.id,
        role: "member",
      },
    }),
    prisma.invitation.update({
      where: { id: invitation.id },
      data: { used: true, usedAt: new Date() },
    }),
  ]);

  return Response.json({
    teamId: invitation.teamId,
    message: "チームに参加しました",
  });
}

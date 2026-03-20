import { prisma } from "@/lib/prisma";

/**
 * GET /api/invites/{token}
 * S-02 招待情報取得。token で招待を検索し、チーム名・招待者名を返す。無効・期限切れは 404。
 */
export async function GET(
  _request: Request,
  context: { params: Promise<{ token: string }> }
) {
  const { token } = await context.params;
  if (!token) {
    return Response.json({ error: "token が必要です" }, { status: 400 });
  }

  const invitation = await prisma.invitation.findUnique({
    where: { token },
    include: {
      team: { select: { id: true, name: true } },
      inviter: { select: { id: true, name: true } },
    },
  });

  if (!invitation) {
    return Response.json({ error: "招待が見つかりません" }, { status: 404 });
  }
  if (invitation.used) {
    return Response.json({ error: "この招待はすでに使用されています" }, { status: 404 });
  }
  if (new Date() > invitation.expiresAt) {
    return Response.json({ error: "招待の有効期限が切れています" }, { status: 404 });
  }

  return Response.json({
    teamId: invitation.team.id,
    teamName: invitation.team.name,
    inviterName: invitation.inviter.name,
  });
}

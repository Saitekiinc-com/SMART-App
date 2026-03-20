/**
 * DELETE /api/teams/{teamId}/members/{userId}
 * PATCH /api/teams/{teamId}/members/{userId}
 * S-09 メンバー削除（リーダーのみ）・ロール変更
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

async function getAuthAndLeader(teamId: string) {
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
  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: user.id },
    },
  });
  if (!membership) {
    return { error: "このチームに参加していません", status: 403 as const };
  }
  if (membership.role !== "leader") {
    return { error: "リーダーのみ実行できます", status: 403 as const };
  }
  return { user, membership };
}

/** メンバーをチームから削除（リーダーは自分自身を削除できない） */
export async function DELETE(
  _request: Request,
  context: { params: Promise<{ teamId: string; userId: string }> }
) {
  const { teamId, userId: targetUserId } = await context.params;
  const result = await getAuthAndLeader(teamId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { user } = result;

  if (targetUserId === user.id) {
    return Response.json({ error: "自分自身を削除することはできません" }, { status: 400 });
  }

  const targetMembership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: targetUserId },
    },
  });
  if (!targetMembership) {
    return Response.json({ error: "該当メンバーが見つかりません" }, { status: 404 });
  }

  await prisma.teamMember.delete({
    where: {
      teamId_userId: { teamId, userId: targetUserId },
    },
  });

  return Response.json({ ok: true });
}

/** メンバーのロールを変更（リーダーのみ）。1チーム1リーダーとするため、他をリーダーにした場合は自分は member に降格 */
export async function PATCH(
  request: Request,
  context: { params: Promise<{ teamId: string; userId: string }> }
) {
  const { teamId, userId: targetUserId } = await context.params;
  const result = await getAuthAndLeader(teamId);
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { user: currentUser } = result;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "JSONの形式が不正です" }, { status: 400 });
  }
  const role = (body as Record<string, unknown>)?.role;
  if (role !== "leader" && role !== "member") {
    return Response.json({ error: "role は leader または member を指定してください" }, { status: 400 });
  }

  const targetMembership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: targetUserId },
    },
  });
  if (!targetMembership) {
    return Response.json({ error: "該当メンバーが見つかりません" }, { status: 404 });
  }

  if (role === "leader") {
    await prisma.$transaction([
      prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId: currentUser.id } },
        data: { role: "member" },
      }),
      prisma.teamMember.update({
        where: { teamId_userId: { teamId, userId: targetUserId } },
        data: { role: "leader" },
      }),
    ]);
  } else {
    await prisma.teamMember.update({
      where: { teamId_userId: { teamId, userId: targetUserId } },
      data: { role: "member" },
    });
  }

  return Response.json({ ok: true });
}

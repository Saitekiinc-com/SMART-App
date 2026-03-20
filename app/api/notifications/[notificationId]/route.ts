/**
 * PATCH /api/notifications/{notificationId}
 * S-08 通知を既読にする（本人のみ）
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ notificationId: string }> }
) {
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
  const { notificationId } = await context.params;
  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId: user.id },
  });
  if (!notification) {
    return Response.json({ error: "通知が見つかりません" }, { status: 404 });
  }
  await prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
  return Response.json({ ok: true });
}

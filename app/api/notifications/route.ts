/**
 * GET /api/notifications
 * S-08 ログインユーザーの通知一覧取得（未読・既読、新しい順）
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
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
  const list = await prisma.notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      type: true,
      message: true,
      goalId: true,
      read: true,
      createdAt: true,
    },
  });
  const notifications = list.map((n) => ({
    id: n.id,
    type: n.type,
    message: n.message,
    goalId: n.goalId,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));
  return Response.json({ notifications });
}

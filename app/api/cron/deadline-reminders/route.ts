/**
 * 期限リマインダー通知（F-013）
 * 7日前: 所有者のみ / 3日前・当日: 所有者とリーダー
 * Vercel Cron や外部 cron から 1 日 1 回呼ぶ想定（例: GET /api/cron/deadline-reminders?secret=xxx）
 */
import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function addDays(d: Date, days: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + days);
  return out;
}

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret");
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayKey = toDateKey(now);
  const d7Key = toDateKey(addDays(now, 7));
  const d3Key = toDateKey(addDays(now, 3));

  const goals = await prisma.smartGoal.findMany({
    where: { status: { not: "DONE" } },
    include: {
      owner: { select: { userId: true } },
      team: {
        include: {
          members: {
            where: { role: "leader" },
            select: { userId: true },
          },
        },
      },
    },
  });

  let created = 0;
  for (const goal of goals) {
    const deadlineKey = toDateKey(goal.deadline);
    const ownerUserId = goal.owner.userId;
    const leaderIds = goal.team.members.map((m) => m.userId);
    const title = goal.title.slice(0, 100);

    if (deadlineKey === d7Key) {
      const exists = await prisma.notification.findFirst({
        where: { goalId: goal.id, type: "DEADLINE_7" },
      });
      if (!exists) {
        const message = `「${title}」の期限が7日後（${d7Key}）です`.slice(0, 500);
        await prisma.notification.create({
          data: { userId: ownerUserId, type: "DEADLINE_7", message, goalId: goal.id },
        });
        created++;
      }
    }

    if (deadlineKey === d3Key) {
      const exists = await prisma.notification.findFirst({
        where: { goalId: goal.id, type: "DEADLINE_3" },
      });
      if (!exists) {
        const message = `「${title}」の期限が3日後（${d3Key}）です`.slice(0, 500);
        const recipientIds = [ownerUserId, ...leaderIds].filter((id, i, arr) => arr.indexOf(id) === i);
        for (const userId of recipientIds) {
          await prisma.notification.create({
            data: { userId, type: "DEADLINE_3", message, goalId: goal.id },
          });
          created++;
        }
      }
    }

    if (deadlineKey === todayKey) {
      const exists = await prisma.notification.findFirst({
        where: { goalId: goal.id, type: "DEADLINE_0" },
      });
      if (!exists) {
        const message = `「${title}」の期限は今日（${todayKey}）です`.slice(0, 500);
        const recipientIds = [ownerUserId, ...leaderIds].filter((id, i, arr) => arr.indexOf(id) === i);
        for (const userId of recipientIds) {
          await prisma.notification.create({
            data: { userId, type: "DEADLINE_0", message, goalId: goal.id },
          });
          created++;
        }
      }
    }
  }

  return Response.json({ ok: true, created });
}

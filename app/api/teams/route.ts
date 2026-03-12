/**
 * GET /api/teams - S-03 所属チーム一覧取得
 * POST /api/teams - チーム作成（作成者をリーダーで登録）
 */
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { validateTeamForm } from "@/lib/validation/team";

const NAME_MAX = 50;
const DESCRIPTION_MAX = 200;

async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.email) return { error: "ログインしてください", status: 401 as const };
  let user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    const name = (session.user.name as string) ?? session.user.email.split("@")[0];
    user = await prisma.user.upsert({
      where: { email: session.user.email },
      create: { name, email: session.user.email, passwordHash: "__OAUTH_NO_PASSWORD__" },
      update: {},
    });
  }
  return { user };
}

export async function GET() {
  const result = await getCurrentUser();
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { user } = result;
  const memberships = await prisma.teamMember.findMany({
    where: { userId: user.id },
    include: {
      team: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const teams = memberships.map((m) => ({
    id: m.team.id,
    name: m.team.name,
    role: m.role as "leader" | "member",
  }));

  return Response.json({ teams });
}

export async function POST(request: Request) {
  const result = await getCurrentUser();
  if ("error" in result) {
    return Response.json({ error: result.error }, { status: result.status });
  }
  const { user } = result;

  let body: { name?: string; description?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "リクエストボディが不正です" }, { status: 400 });
  }
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const description = typeof body.description === "string" ? body.description.trim() || undefined : undefined;
  const validation = validateTeamForm({ name: name || null, description: description ?? null });
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: 400 });
  }
  if (name.length > NAME_MAX) {
    return Response.json({ error: `チーム名は${NAME_MAX}文字以内にしてください` }, { status: 400 });
  }
  if (description && description.length > DESCRIPTION_MAX) {
    return Response.json({ error: `説明は${DESCRIPTION_MAX}文字以内にしてください` }, { status: 400 });
  }

  const team = await prisma.team.create({
    data: {
      name,
      description,
      createdById: user.id,
      members: {
        create: { userId: user.id, role: "leader" },
      },
    },
    include: { members: true },
  });

  return Response.json({
    id: team.id,
    name: team.name,
    description: team.description ?? null,
    createdAt: team.createdAt.toISOString(),
  });
}

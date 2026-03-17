/**
 * S-09: チーム設定（リーダーのみアクセス可）
 * リーダーでない場合はダッシュボードへリダイレクト
 */
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { TeamSettingsClient } from "./TeamSettingsClient";

export default async function TeamSettingsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.email) {
    redirect("/login");
  }

  const { teamId } = await params;

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
  });
  if (!user) {
    redirect("/login");
  }

  const membership = await prisma.teamMember.findUnique({
    where: {
      teamId_userId: { teamId, userId: user.id },
    },
  });
  if (!membership) {
    redirect(`/dashboard/${teamId}`);
  }
  if (membership.role !== "leader") {
    redirect(`/dashboard/${teamId}`);
  }

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { name: true, description: true },
  });
  if (!team) {
    redirect(`/dashboard/${teamId}`);
  }

  return (
    <TeamSettingsClient
      teamId={teamId}
      teamName={team.name}
      teamDescription={team.description ?? ""}
    />
  );
}

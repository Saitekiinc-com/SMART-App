import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * DB 接続確認用（開発時のみ使用想定）
 * GET /api/dev/db-check で User を 1 件取得し、接続ができるか確認する
 */
export async function GET() {
  try {
    const user = await prisma.user.findFirst();
    return NextResponse.json({
      ok: true,
      message: "DB接続OK",
      user: user ?? null,
    });
  } catch (e) {
    console.error("[db-check]", e);
    return NextResponse.json(
      { ok: false, message: "DB接続エラー", error: String(e) },
      { status: 500 }
    );
  }
}

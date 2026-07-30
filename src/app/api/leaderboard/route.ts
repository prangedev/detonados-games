import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const users = await db.user.findMany({
    orderBy: { xp: "desc" },
    take: 50,
    select: { id: true, name: true, email: true, xp: true, level: true },
  });

  return NextResponse.json({ users });
}

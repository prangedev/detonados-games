import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { db } from "@/lib/db";
import { ensureNotificationPreferences } from "@/lib/notifications";
import { grantAchievement } from "@/lib/achievements";

const RegisterSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(8).max(72),
});

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const { name, email, password } = parsed.data;

  const existing = await db.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "E-mail já cadastrado." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: { name, email, passwordHash },
  });

  await ensureNotificationPreferences(user.id);
  await grantAchievement(user.id, "first-login");

  return NextResponse.json({ id: user.id }, { status: 201 });
}

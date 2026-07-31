import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUserRole } from "@/lib/current-user";
import { hasAtLeastRole } from "@/lib/roles";
import { getThemeAccent, getShiftHours, setSetting, setShiftHours, setApiKeyOverride, getGeminiApiKey } from "@/lib/site-settings";
import { SHIFTS, type ShiftType } from "@/lib/constants";

export async function GET() {
  const role = await getCurrentUserRole();
  if (!hasAtLeastRole(role, "ADMIN")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const [themeAccent, shiftHours, geminiApiKey] = await Promise.all([
    getThemeAccent(),
    getShiftHours(),
    getGeminiApiKey(),
  ]);

  return NextResponse.json({
    themeAccent,
    shiftHours,
    resendKeyConfigured: Boolean(process.env.RESEND_API_KEY),
    vapidConfigured: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY),
    geminiKeyConfigured: Boolean(geminiApiKey),
  });
}

const SettingsSchema = z.object({
  themeAccent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  shiftHours: z.object({
    MORNING: z.number().min(0).max(23),
    AFTERNOON: z.number().min(0).max(23),
    EVENING: z.number().min(0).max(23),
  }),
  resendApiKey: z.string().optional(),
  geminiApiKey: z.string().optional(),
});

export async function PUT(req: Request) {
  const role = await getCurrentUserRole();
  if (!hasAtLeastRole(role, "ADMIN")) {
    return NextResponse.json({ error: "Sem permissão." }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = SettingsSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  }

  const data = parsed.data;

  await setSetting("theme.accent", data.themeAccent);

  const hours: Record<ShiftType, number> = {} as Record<ShiftType, number>;
  for (const shift of SHIFTS) {
    hours[shift] = data.shiftHours[shift];
  }
  await setShiftHours(hours);

  if (data.resendApiKey) {
    await setApiKeyOverride("RESEND_API_KEY", data.resendApiKey);
  }

  if (data.geminiApiKey) {
    await setApiKeyOverride("GEMINI_API_KEY", data.geminiApiKey);
  }

  return NextResponse.json({ ok: true });
}

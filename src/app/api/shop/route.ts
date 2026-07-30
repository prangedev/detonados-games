import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { getAvailablePoints } from "@/lib/points";

export async function GET() {
  const userId = await getCurrentUserId();

  const items = await db.shopItem.findMany({ where: { available: true }, orderBy: { cost: "asc" } });

  const [owned, points, user] = await Promise.all([
    userId ? db.userPurchase.findMany({ where: { userId }, select: { itemId: true } }) : Promise.resolve([]),
    userId ? getAvailablePoints(userId) : Promise.resolve(0),
    userId
      ? db.user.findUnique({
          where: { id: userId },
          select: { nameColor: true, equippedFrame: true, equippedAvatar: true },
        })
      : Promise.resolve(null),
  ]);

  const ownedIds = new Set(owned.map((o) => o.itemId));

  return NextResponse.json({
    points,
    items: items.map((item) => ({
      key: item.key,
      name: item.name,
      description: item.description,
      type: item.type,
      cost: item.cost,
      value: item.value,
      owned: ownedIds.has(item.id),
      equipped:
        (item.type === "NAME_COLOR" && user?.nameColor === item.value) ||
        (item.type === "FRAME" && user?.equippedFrame === item.value) ||
        (item.type === "AVATAR" && user?.equippedAvatar === item.value),
    })),
  });
}

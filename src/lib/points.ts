import { db } from "./db";
import { XP_PER_POINT } from "./constants";

/** Pontos totais já gerados pelo XP acumulado (nunca diminui). */
export function totalPointsEarned(xp: number): number {
  return Math.floor(xp / XP_PER_POINT);
}

/** Pontos disponíveis para gastar agora. */
export async function getAvailablePoints(userId: string): Promise<number> {
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { xp: true, pointsSpent: true },
  });
  if (!user) return 0;
  return Math.max(0, totalPointsEarned(user.xp) - user.pointsSpent);
}

export interface PurchaseResult {
  ok: boolean;
  error?: string;
}

/**
 * Compra um item da loja: debita os pontos e registra a posse. Não repete
 * a compra se o usuário já tem o item (idempotente/seguro contra duplo
 * clique).
 */
export async function purchaseItem(userId: string, itemKey: string): Promise<PurchaseResult> {
  const item = await db.shopItem.findUnique({ where: { key: itemKey } });
  if (!item || !item.available) return { ok: false, error: "Item indisponível." };

  const already = await db.userPurchase.findUnique({
    where: { userId_itemId: { userId, itemId: item.id } },
  });
  if (already) return { ok: false, error: "Você já tem esse item." };

  const available = await getAvailablePoints(userId);
  if (available < item.cost) return { ok: false, error: "Pontos insuficientes." };

  await db.$transaction([
    db.user.update({ where: { id: userId }, data: { pointsSpent: { increment: item.cost } } }),
    db.userPurchase.create({ data: { userId, itemId: item.id } }),
  ]);

  return { ok: true };
}

/** Equipa um item já comprado (moldura, cor de nome ou avatar). */
export async function equipItem(userId: string, itemKey: string): Promise<PurchaseResult> {
  const item = await db.shopItem.findUnique({ where: { key: itemKey } });
  if (!item) return { ok: false, error: "Item não encontrado." };

  const owned = await db.userPurchase.findUnique({
    where: { userId_itemId: { userId, itemId: item.id } },
  });
  if (!owned) return { ok: false, error: "Você ainda não tem esse item." };

  const field =
    item.type === "FRAME" ? "equippedFrame" : item.type === "NAME_COLOR" ? "nameColor" : "equippedAvatar";

  await db.user.update({ where: { id: userId }, data: { [field]: item.value } });

  return { ok: true };
}

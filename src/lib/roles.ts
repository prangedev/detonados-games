export const ROLES = ["USER", "MODERATOR", "ADMIN"] as const;
export type RoleType = (typeof ROLES)[number];

export const ROLE_RANK: Record<RoleType, number> = {
  USER: 0,
  MODERATOR: 1,
  ADMIN: 2,
};

export const ROLE_LABELS: Record<RoleType, string> = {
  USER: "Usuário",
  MODERATOR: "Moderador",
  ADMIN: "Administrador",
};

function normalizeRole(role: string | null | undefined): RoleType {
  return (ROLES as readonly string[]).includes(role ?? "") ? (role as RoleType) : "USER";
}

/**
 * Verifica se um papel atende ou supera o papel mínimo exigido.
 * ADMIN > MODERATOR > USER — cada nível acima herda as permissões do
 * nível abaixo (um ADMIN também pode fazer tudo que um MODERATOR pode).
 */
export function hasAtLeastRole(role: string | null | undefined, min: RoleType): boolean {
  return ROLE_RANK[normalizeRole(role)] >= ROLE_RANK[min];
}

export function isModerator(role: string | null | undefined): boolean {
  return hasAtLeastRole(role, "MODERATOR");
}

export function isAdmin(role: string | null | undefined): boolean {
  return hasAtLeastRole(role, "ADMIN");
}

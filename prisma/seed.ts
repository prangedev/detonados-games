import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

// Credenciais do administrador padrão criado pelo seed, só para
// desenvolvimento local. Troque a senha (ou o usuário) pelo painel de
// administração depois do primeiro login.
const DEFAULT_ADMIN_EMAIL = "admin@detonados.games";
const DEFAULT_ADMIN_PASSWORD = "admin123456";

const ACHIEVEMENTS = [
  {
    key: "first-login",
    name: "Primeiro Acesso",
    description: "Criou sua conta em Detonados Games.",
    rarity: "COMUM",
    xpReward: 10,
  },
  {
    key: "first-game-viewed",
    name: "Explorador",
    description: "Visitou a página de um jogo pela primeira vez.",
    rarity: "COMUM",
    xpReward: 10,
  },
  {
    key: "hardware-check-done",
    name: "Diagnóstico Completo",
    description: "Testou a compatibilidade do seu PC pela primeira vez.",
    rarity: "COMUM",
    xpReward: 15,
  },
  {
    key: "first-comment",
    name: "Primeira Contribuição",
    description: "Deixou seu primeiro comentário em um jogo.",
    rarity: "COMUM",
    xpReward: 10,
  },
  {
    key: "first-like",
    name: "Curtiu Pra Valer",
    description: "Curtiu um jogo pela primeira vez.",
    rarity: "COMUM",
    xpReward: 10,
  },
  {
    key: "first-save",
    name: "Guardando pra Depois",
    description: "Salvou um jogo pela primeira vez.",
    rarity: "COMUM",
    xpReward: 10,
  },
  {
    key: "first-rating",
    name: "Crítico Iniciante",
    description: "Avaliou um jogo pela primeira vez.",
    rarity: "COMUM",
    xpReward: 10,
  },
  {
    key: "resenhista",
    name: "Resenhista",
    description: "Comentou em 20 jogos diferentes.",
    rarity: "RARA",
    xpReward: 80,
  },
  {
    key: "colecionador",
    name: "Colecionador",
    description: "Salvou 10 jogos na sua lista.",
    rarity: "RARA",
    xpReward: 60,
  },
  {
    key: "critico",
    name: "Crítico Renomado",
    description: "Avaliou 10 jogos diferentes.",
    rarity: "RARA",
    xpReward: 60,
  },
  {
    key: "fan-club",
    name: "Fã-Clube",
    description: "Curtiu 25 jogos diferentes.",
    rarity: "EPICA",
    xpReward: 120,
  },
  {
    key: "level-5",
    name: "Veterano",
    description: "Alcançou o nível 5.",
    rarity: "RARA",
    xpReward: 50,
  },
  {
    key: "level-10",
    name: "Mestre dos Detonados",
    description: "Alcançou o nível 10.",
    rarity: "EPICA",
    xpReward: 150,
  },
  {
    key: "level-20",
    name: "Lenda Viva",
    description: "Alcançou o nível 20.",
    rarity: "LENDARIA",
    xpReward: 500,
  },
];

// Jogos de exemplo para a loja não ficar vazia antes do primeiro sync com a
// Steam (rode `npm run sync:steam` para popular com dados reais).
const SAMPLE_GAMES = [
  {
    slug: "hollow-knight-367520",
    steamAppId: 367520,
    title: "Hollow Knight",
    coverImage: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg",
    headerImage: "https://cdn.akamai.steamstatic.com/steam/apps/367520/header.jpg",
    shortDescription:
      "Um exigente jogo de ação e aventura 2D ambientado em um vasto reino de insetos e heróis.",
    platforms: JSON.stringify(["PC", "SWITCH", "PS4", "XBOX_ONE"]),
    genres: JSON.stringify(["Ação", "Aventura", "Indie"]),
    minRequirements: JSON.stringify({ os: "Windows 7", cpu: "Intel Core i3", gpu: "GeForce GTX 260", ramGb: 4, storageGb: 9 }),
    recRequirements: JSON.stringify({ os: "Windows 10", cpu: "Intel Core i5", gpu: "GeForce GTX 460", ramGb: 8, storageGb: 9 }),
    protonDbTier: "platinum",
    detonado: "Guia em construção: dicas de progressão, mapa e chefes principais em breve.",
  },
  {
    slug: "stardew-valley-413150",
    steamAppId: 413150,
    title: "Stardew Valley",
    coverImage: "https://cdn.akamai.steamstatic.com/steam/apps/413150/header.jpg",
    headerImage: "https://cdn.akamai.steamstatic.com/steam/apps/413150/header.jpg",
    shortDescription: "Você herdou a velha fazenda do seu avô. Comece uma nova vida no campo!",
    platforms: JSON.stringify(["PC", "MOBILE", "SWITCH", "PS4", "XBOX_ONE"]),
    genres: JSON.stringify(["Simulação", "RPG", "Indie"]),
    minRequirements: JSON.stringify({ os: "Windows Vista", cpu: "2 Ghz", gpu: "256mb placa de vídeo", ramGb: 2, storageGb: 1 }),
    recRequirements: JSON.stringify({ os: "Windows 10", cpu: "Intel Core i5", gpu: "GeForce GTX 660", ramGb: 4, storageGb: 1 }),
    mobileRequirements: JSON.stringify({ iosVersion: "12.0", androidVersion: "Android 8.0 ou superior", ramGb: 2, storageGb: 1, estimated: true }),
    protonDbTier: "platinum",
    detonado: "Guia em construção: dicas de cultivo, relacionamentos e minas em breve.",
  },
];

const DEFAULT_SETTINGS: Record<string, string> = {
  "theme.accent": "#F2231E",
  "schedule.shiftHours": JSON.stringify({ MORNING: 9, AFTERNOON: 15, EVENING: 21 }),
  "site.name": "Detonados Games",
};

// Loja de pontos (100 XP = 1 Ponto). "Avatares animados" hoje são um
// conjunto de ícones predefinidos, não upload de GIF — ver README.
const SHOP_ITEMS = [
  { key: "color-red", name: "Nome Vermelho", description: "Cor de nome", type: "NAME_COLOR", cost: 5, value: "#F2231E" },
  { key: "color-blue", name: "Nome Azul", description: "Cor de nome", type: "NAME_COLOR", cost: 5, value: "#4D9CFF" },
  { key: "color-mint", name: "Nome Verde-água", description: "Cor de nome", type: "NAME_COLOR", cost: 5, value: "#35E7C6" },
  { key: "color-purple", name: "Nome Roxo", description: "Cor de nome", type: "NAME_COLOR", cost: 10, value: "#B562FF" },
  { key: "color-gold", name: "Nome Dourado", description: "Cor de nome", type: "NAME_COLOR", cost: 15, value: "#FFB84D" },
  { key: "frame-bronze", name: "Moldura Bronze", description: "Borda do avatar", type: "FRAME", cost: 10, value: "#B87333" },
  { key: "frame-silver", name: "Moldura Prata", description: "Borda do avatar", type: "FRAME", cost: 20, value: "#C0C0C0" },
  { key: "frame-fire", name: "Moldura em Chamas", description: "Borda do avatar", type: "FRAME", cost: 30, value: "#F2231E" },
  { key: "frame-gold", name: "Moldura Dourada", description: "Borda do avatar", type: "FRAME", cost: 40, value: "#FFD700" },
  { key: "avatar-controller", name: "Avatar Controle", description: "Ícone de perfil", type: "AVATAR", cost: 8, value: "🎮" },
  { key: "avatar-fire", name: "Avatar Fogo", description: "Ícone de perfil", type: "AVATAR", cost: 8, value: "🔥" },
  { key: "avatar-alien", name: "Avatar Alien", description: "Ícone de perfil", type: "AVATAR", cost: 12, value: "👾" },
  { key: "avatar-skull", name: "Avatar Caveira", description: "Ícone de perfil", type: "AVATAR", cost: 12, value: "💀" },
  { key: "avatar-dragon", name: "Avatar Dragão", description: "Ícone de perfil", type: "AVATAR", cost: 25, value: "🐉" },
  { key: "avatar-crown", name: "Avatar Coroa", description: "Ícone de perfil", type: "AVATAR", cost: 25, value: "👑" },
];

async function main() {
  for (const achievement of ACHIEVEMENTS) {
    await db.achievement.upsert({
      where: { key: achievement.key },
      update: achievement,
      create: achievement,
    });
  }

  for (const game of SAMPLE_GAMES) {
    await db.game.upsert({
      where: { slug: game.slug },
      update: game,
      create: { ...game, releaseStatus: "PUBLISHED" },
    });
  }

  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    await db.siteSetting.upsert({
      where: { key },
      update: {},
      create: { key, value },
    });
  }

  for (const item of SHOP_ITEMS) {
    await db.shopItem.upsert({
      where: { key: item.key },
      update: item,
      create: item,
    });
  }

  const passwordHash = await bcrypt.hash(DEFAULT_ADMIN_PASSWORD, 10);
  await db.user.upsert({
    where: { email: DEFAULT_ADMIN_EMAIL },
    update: { role: "ADMIN" },
    create: {
      email: DEFAULT_ADMIN_EMAIL,
      name: "Admin",
      passwordHash,
      role: "ADMIN",
    },
  });

  console.log(
    `Seed concluído: ${ACHIEVEMENTS.length} conquistas, ${SAMPLE_GAMES.length} jogos de exemplo, ${SHOP_ITEMS.length} itens na loja.`
  );
  console.log(`Login de administrador: ${DEFAULT_ADMIN_EMAIL} / ${DEFAULT_ADMIN_PASSWORD} (troque depois do primeiro login)`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

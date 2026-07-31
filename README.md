# Detona Games (versão local)

Loja/portal de detonados de jogos — Next.js 14 (App Router) + TypeScript +
Tailwind CSS, feito para rodar **inteiramente na sua máquina**: frontend,
backend (API routes) e banco de dados (SQLite) juntos, sem depender de
Vercel, GitHub ou qualquer serviço externo.

## Como rodar (Windows) — jeito rápido

1. Extraia o `.zip` em qualquer pasta.
2. Dê duplo clique em **`START.bat`**.

O script verifica automaticamente tudo o que é necessário e corrige o que
faltar, nessa ordem:

1. Estrutura de pastas do projeto
2. Node.js instalado e na versão mínima (instala sozinho se faltar)
3. Arquivo `.env` (cria a partir do `.env.example` e gera segredos aleatórios)
4. Dependências do `npm install` (instala/atualiza)
5. Banco de dados SQLite (`prisma generate` + `db push` + seed de conquistas
   e jogos de exemplo)
6. **Reverifica tudo do zero** depois de qualquer instalação/atualização
7. Só então inicia **Backend + Banco de Dados + Frontend juntos**, e abre o
   navegador em `http://localhost:3000`

Pode rodar `START.bat` quantas vezes quiser — cada etapa é idempotente
(não duplica nem quebra nada se já estiver tudo pronto).

Para parar tudo, feche a janela ou pressione `CTRL+C` nela.

> **Sobre a instalação automática do Node.js:** o script tenta instalar via
> `winget` e, se não conseguir, baixa o instalador oficial de nodejs.org e
> roda silenciosamente. Isso pode pedir permissão de administrador (UAC) —
> é normal. Se por algum motivo a instalação automática falhar (política de
> grupo restritiva, antivírus corporativo, etc.), o script avisa e mostra o
> link para instalar manualmente; depois disso, só rodar `START.bat` de novo.
> Se preferir, você pode simplesmente instalar o Node.js 20+ você mesmo
> antes ([nodejs.org](https://nodejs.org)) — o script detecta e pula essa
> etapa.

## Login de administrador

O seed cria uma conta ADMIN automaticamente:

```
E-mail: admin@detonados.games
Senha:  admin123456
```

Troque a senha assim que possível: crie sua própria conta pelo cadastro
normal, promova-a a **Administrador** em `/admin/users` (usando a conta
padrão acima) e passe a usar só a sua. Não existe uma tela de "esqueci minha
senha" ainda — para trocar a senha da conta padrão, edite o hash diretamente
pelo Prisma Studio (`npm run db:studio`) ou rode `npx tsx prisma/seed.ts`
depois de mudar `DEFAULT_ADMIN_PASSWORD` em `prisma/seed.ts`.

| Papel | Pode fazer |
|---|---|
| **Usuário** | Navegar, comentar, usar o verificador de hardware, ganhar XP/conquistas — sem acesso ao painel |
| **Moderador** | Tudo do Usuário + moderar/ocultar comentários + editar jogos existentes (corrigir textos, specs, imagem) |
| **Administrador** | Tudo do Moderador + criar/excluir jogos + gerenciar papéis de usuários + configurações do site (tema, horários dos turnos, chave da Resend) |

O painel fica em **`/admin`** (aparece um link "Painel" no cabeçalho para
quem é Moderador ou Administrador).

## Como rodar (macOS/Linux ou manualmente no Windows)

```bash
npm install
cp .env.example .env      # no Windows: copy .env.example .env
npm run setup              # prisma generate + db push + seed
npm run dev:all            # frontend + backend + agendador local juntos
```

Ou, se preferir sem o agendador de jogos em segundo plano:

```bash
npm run dev
```

Acesse **http://localhost:3000**.

## O que roda junto quando você inicia

`npm run dev:all` (chamado pelo `START.bat`) sobe dois processos ao mesmo
tempo, com logs coloridos e prefixados no mesmo terminal:

- **NEXT** — o Next.js (frontend + todas as rotas de API/backend + acesso
  ao banco via Prisma)
- **SCHEDULER** — `src/scripts/local-scheduler.ts`, que substitui os Cron
  Jobs da Vercel: publica os jogos agendados nos turnos (09h/15h/21h) e
  sincroniza com a Steam todo dia às 03h, sem precisar de nenhum serviço
  externo.

Para popular o catálogo com dados reais da Steam manualmente (sem esperar o
horário do agendador):

```bash
npm run sync:steam
```

Isso busca jogos populares, requisitos e o tier do ProtonDB, e distribui
automaticamente 2 jogos por turno (manhã/tarde/noite) nos próximos dias. O
agendador local publica esses jogos quando o turno chega.

## Stack

- **Next.js 14** (App Router, Server Components + Route Handlers)
- **TypeScript** + **Tailwind CSS**
- **Prisma** + **SQLite** local (`prisma/dev.db`)
- **NextAuth.js** (login por e-mail/senha, sessão em JWT)
- **next-intl** — pt-BR, en, es, fr, de, ja, ko
- **node-cron** — agendador local (substitui o Cron Jobs da Vercel)
- **Resend** (e-mail) e **web-push** (notificações push) — opcionais
- APIs públicas da Steam + SteamSpy + ProtonDB para o catálogo

## Funcionalidades

- Loja mobile-first com a identidade visual da logo Detona Games: busca,
  seletor de idioma com bandeiras, grid de jogos, filtro por plataforma,
  página de detonado
- Pop-up de escolha de plataforma por jogo — requisitos de PC (real, via
  Steam) e de Mobile (versão de iOS real via App Store + estimativa de
  RAM/armazenamento) só aparecem depois da escolha
- Verificador de compatibilidade de hardware sob demanda (CPU/GPU/RAM →
  Bom/Atenção/Ruim), sem poluir a tela por padrão
- Curtir, avaliar (1-5 estrelas) e salvar cada jogo, além de comentar —
  jogos salvos aparecem na aba "Detonados Salvos" do perfil
- Login/registro, XP com barra estilo HUD, níveis, conquistas com raridade
  (Comum/Rara/Épica/Lendária), ranking global
- XP por login diário (15, uma vez por dia), por comentar/avaliar cada jogo
  pela primeira vez (50 cada) e por desbloquear conquistas
- Loja de Pontos (100 XP = 1 Ponto): troque por cor de nome, moldura de
  avatar e ícones de perfil
- Feed com jogos recém-publicados + recomendações por gênero, com peso maior
  para curtidas/salvos do que visualizações simples — funciona até para
  quem não está logado, via cookie de interesse (ver `/faq`)
- Jogos Grátis (`/free-games`): ofertas por tempo limitado na Steam, Epic
  Games, GOG, PlayStation e Xbox, via API pública da GamerPower
- FAQ (`/faq`) com as principais dúvidas, incluindo o uso de cookies
- Comentários por jogo, com moderação (ocultar/restaurar) para
  Moderadores e Administradores
- Papéis de usuário — **Usuário / Moderador / Administrador** — com painel
  de administração completo (`/admin`): gerenciar jogos, usuários,
  comentários e configurações do site (tema, horários de publicação, chave
  de e-mail)
- Cache de leitura (`unstable_cache`) na home e no ranking, invalidado
  automaticamente quando um jogo é criado/editado/excluído
- 7 idiomas com detecção automática do navegador
- Notificações in-app (polling), e-mail e web push, com página de preferências
- Agendamento automático de novos jogos, 2 por turno

## Decisões de arquitetura (transparência)

1. **Sem Puppeteer.** O catálogo usa as APIs públicas em JSON da Steam e da
   SteamSpy (`src/lib/steam.ts`) em vez de um navegador headless — mais
   simples de rodar localmente, sem precisar baixar um Chromium separado.
2. **"Tempo real" das notificações in-app é polling** (a cada ~20s), não
   WebSocket. Simples e suficiente para uso local; para várias abas/usuários
   simultâneos em produção, um provedor como Pusher/Ably seria o próximo passo.
3. **Comparação de CPU/GPU usa uma tabela de "tiers" curada manualmente**
   (`src/lib/hardware-tiers.json`), não um banco de benchmarks real — é uma
   boa estimativa, não uma medição exata. O app deixa isso explícito para
   quem usa o verificador.
4. **SQLite local é o banco definitivo aqui**, não um substituto temporário —
   já que tudo roda na sua máquina, não existe o problema de "filesystem
   efêmero" que existiria num deploy serverless.
5. **Requisitos de Mobile são parcialmente estimados.** Não existe uma API
   pública estruturada com specs de RAM/CPU para jogos mobile como a da
   Steam para PC. O que dá pra obter de fonte oficial é a versão mínima de
   iOS, via API pública da Apple (iTunes Lookup) — isso é buscado de
   verdade. RAM, armazenamento e a versão mínima de Android são estimativas
   calculadas a partir dos requisitos de PC do mesmo jogo, e a interface
   deixa isso explícito, nunca apresenta como fato.
6. **A cor de destaque do tema é editável em runtime** (`/admin/settings`)
   sem precisar recompilar: ela vira uma variável CSS (`--color-brand`)
   injetada no `<html>` a partir do banco, e o Tailwind referencia essa
   variável em vez de um valor fixo.
7. **Moderador pode editar jogos, mas não criar nem excluir** — só
   Administrador tem esses dois. Isso segue à risca a distinção pedida:
   Moderador "corrige posts", Administrador tem "poder total".
8. **"Avatares animados" da loja são um conjunto de ícones (emoji)
   predefinidos**, não upload de GIF/vídeo — implementar upload e hospedagem
   de avatares animados de verdade é um escopo bem maior (armazenamento,
   moderação de conteúdo, limites de tamanho). Moldura e cor de nome são
   valores reais (hex) aplicados via CSS.
9. **O cookie de interesses (`dg_interests`) é first-party e local** — guarda
   só uma contagem por gênero, em texto simples, sem terceiros, sem
   publicidade. Existe pra alimentar as recomendações do Feed mesmo para
   quem não está logado. Detalhado em `/faq`.
10. **Jogos Grátis usa a API pública da GamerPower**, sem chave necessária.
    O resgate sempre redireciona pro site oficial da loja — o app nunca
    processa códigos de resgate diretamente.
11. **A logo e a paleta vieram da arte enviada** (`public/logo.png` e os
    ícones do app): a cor de destaque padrão (`#F2231E`) foi extraída por
    amostragem de pixel da própria imagem, não escolhida à mão.

## Estrutura de pastas

```
START.bat                 # duplo clique pra rodar tudo (Windows)
tools/windows/bootstrap.ps1  # script que o START.bat chama
public/logo.png            # logo enviada (usada no header, login, favicon)
src/
  app/
    [locale]/
      admin/               # painel de administração (Moderador/Administrador)
      feed/                # feed + recomendações
      shop/                # loja de pontos
      free-games/          # jogos grátis (GamerPower)
      faq/                 # perguntas frequentes
      games/[slug]/         # página de detonado (curtir/avaliar/salvar/comentar)
      ...                   # home, login, perfil, ranking...
    api/
      admin/                # rotas do painel (jogos, usuários, config)
      games/[id]/comments/  # comentários
      games/[id]/like|rating|save/  # interações do jogo
      shop/                 # comprar/equipar itens
      ...                    # auth, registro, hardware-check...
  components/
    admin/                  # formulário de jogo, seletor de papel, nav...
    comments-section.tsx
    game-interactions.tsx   # curtir, avaliar, salvar
    interest-tracker.tsx    # cookie de interesses por gênero
    game-platform-panel.tsx  # pop-up de plataforma + specs condicionais
  i18n/                     # roteamento e configuração do next-intl
  messages/                 # traduções (pt-BR, en, es, fr, de, ja, ko)
  lib/
    roles.ts                # sistema de papéis USER/MODERATOR/ADMIN
    site-settings.ts         # configurações editáveis pelo painel
    mobile-requirements.ts   # requisitos estimados de Mobile
    recommendations.ts       # feed/recomendações por gênero (peso curtir/salvar > ver)
    points.ts                # loja de pontos (comprar/equipar)
    cache.ts                 # cache de leitura (unstable_cache)
    free-games.ts            # integração com a API da GamerPower
    ...                      # Prisma client, auth, XP, conquistas, Steam...
  scripts/
    sync-steam-games.ts     # sincronização com a Steam
    local-scheduler.ts      # agendador local (substitui Vercel Cron)
prisma/
  schema.prisma
  seed.ts
```

## Comandos úteis

| Comando | O que faz |
|---|---|
| `npm run dev:all` | Frontend + backend + agendador local (o que o START.bat usa) |
| `npm run dev` | Só o Next.js, sem o agendador |
| `npm run setup` | prisma generate + db push + seed, tudo de uma vez |
| `npm run sync:steam` | Busca jogos populares da Steam agora, sem esperar o agendador |
| `npm run db:studio` | Abre o Prisma Studio (interface visual do banco) |
| `npm run generate:vapid` | Gera as chaves para ativar notificações push |

## Notificações por e-mail e push (opcional)

Sem `RESEND_API_KEY` ou chaves VAPID no `.env`, os envios de e-mail/push
viram no-ops silenciosos — o app funciona normalmente, só não envia. Para
ativar: crie uma conta gratuita em [resend.com](https://resend.com) para o
`RESEND_API_KEY`, e rode `npm run generate:vapid` para as chaves de push.

## Se algo der errado

- **START.bat fecha sozinho sem mostrar erro**: dê duplo clique de novo — o
  final do script sempre pausa a janela com `pause`. Se ainda fechar rápido,
  abra um `cmd.exe`, navegue até a pasta do projeto e rode `START.bat`
  manualmente para ver a mensagem completa.
- **"npm install falhou"**: geralmente é falta de conexão com a internet ou
  um antivírus bloqueando. Verifique a conexão e rode `START.bat` de novo.
- **Porta 3000 ocupada**: o Next.js escolhe outra porta automaticamente —
  veja a URL exata impressa no terminal (ex.: `http://localhost:3001`).
- **Quer recomeçar o banco do zero**: apague `prisma/dev.db` e rode
  `START.bat` (ou `npm run setup`) de novo.

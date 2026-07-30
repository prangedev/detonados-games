#Requires -Version 5.1
<#
    Detonados Games - Bootstrap local (Windows)
    ---------------------------------------------
    Este script e chamado pelo START.bat. Ele:
      1. Confere a estrutura de pastas do projeto
      2. Confere/instala o Node.js (versao minima) se necessario
      3. Confere/cria o arquivo .env (gerando segredos aleatorios)
      4. Instala/atualiza as dependencias (npm install)
      5. Gera o Prisma Client, sincroniza o schema e roda o seed
      6. Refaz uma verificacao final de tudo
      7. Inicia o Backend + Banco de Dados + Frontend juntos (npm run dev:all)

    Pode ser executado quantas vezes quiser: tudo aqui e idempotente.
#>

$ErrorActionPreference = "Stop"
$MinNodeMajor = 20
$NodeInstallerUrl = "https://nodejs.org/dist/v20.18.1/node-v20.18.1-x64.msi"

# O script fica em <projeto>\tools\windows\bootstrap.ps1
$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
Set-Location $ProjectRoot

# --------------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------------
function Write-Step($msg) { Write-Host ""; Write-Host "==> $msg" -ForegroundColor Cyan }
function Write-Ok($msg) { Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "    [!!] $msg" -ForegroundColor Yellow }
function Write-Fail($msg) { Write-Host "    [XX] $msg" -ForegroundColor Red }

function Stop-WithError($msg) {
    Write-Fail $msg
    Write-Host ""
    Read-Host "Pressione ENTER para sair"
    exit 1
}

function Test-CommandExists($name) {
    return [bool](Get-Command $name -ErrorAction SilentlyContinue)
}

function Get-NodeMajorVersion {
    try {
        $v = (node -v) -replace "^v", ""
        return [int]($v.Split(".")[0])
    } catch {
        return 0
    }
}

function Refresh-Path {
    $machinePath = [System.Environment]::GetEnvironmentVariable("Path", "Machine")
    $userPath = [System.Environment]::GetEnvironmentVariable("Path", "User")
    $env:Path = "$env:Path;$machinePath;$userPath"
}

function Test-PortInUse([int]$port) {
    try {
        $client = New-Object System.Net.Sockets.TcpClient
        $client.Connect("127.0.0.1", $port)
        $client.Close()
        return $true
    } catch {
        return $false
    }
}

function New-RandomSecret {
    $bytes = New-Object byte[] 32
    [System.Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($bytes)
    return [Convert]::ToBase64String($bytes)
}

function Ensure-EnvKey($envFile, $key, $defaultValue) {
    $content = Get-Content $envFile -Raw
    if ($content -notmatch "(?m)^\s*$key\s*=") {
        Add-Content $envFile "`n$key=`"$defaultValue`""
        Write-Warn "Variavel ausente adicionada ao .env: $key"
    }
}

function Ensure-SecretGenerated($envFile, $key) {
    $content = Get-Content $envFile -Raw
    if ($content -match "$key=`"troque-por-um-segredo-aleatorio`"") {
        $secret = New-RandomSecret
        (Get-Content $envFile) -replace "$key=`".*`"", "$key=`"$secret`"" | Set-Content $envFile
        Write-Ok "Segredo aleatorio gerado para $key."
    }
}

Write-Host "============================================================" -ForegroundColor DarkCyan
Write-Host "  DETONADOS GAMES - Preparando ambiente local" -ForegroundColor DarkCyan
Write-Host "============================================================" -ForegroundColor DarkCyan

# --------------------------------------------------------------------------
# 1. Estrutura de diretorios
# --------------------------------------------------------------------------
Write-Step "Verificando estrutura de diretorios..."

$requiredDirs = @("src", "src\app", "src\lib", "prisma", "public")
$dirsOk = $true
foreach ($dir in $requiredDirs) {
    $full = Join-Path $ProjectRoot $dir
    if (Test-Path $full) {
        Write-Ok "OK: $dir"
    } else {
        Write-Fail "Faltando: $dir"
        $dirsOk = $false
    }
}
if (-not $dirsOk) {
    Stop-WithError "O projeto parece incompleto. Extraia o .zip novamente mantendo a estrutura de pastas."
}

# --------------------------------------------------------------------------
# 2. Node.js
# --------------------------------------------------------------------------
Write-Step "Verificando Node.js (minimo: v$MinNodeMajor)..."

$nodeOk = $false
if (Test-CommandExists "node") {
    $currentMajor = Get-NodeMajorVersion
    if ($currentMajor -ge $MinNodeMajor) {
        Write-Ok "Node.js $(node -v) encontrado."
        $nodeOk = $true
    } else {
        Write-Warn "Node.js $(node -v) encontrado, mas a versao minima e v$MinNodeMajor. Sera atualizado."
    }
} else {
    Write-Warn "Node.js nao encontrado."
}

if (-not $nodeOk) {
    Write-Host "    Instalando Node.js automaticamente (pode levar 1-2 minutos)..."
    $installedNow = $false

    if (Test-CommandExists "winget") {
        try {
            Write-Host "    Tentando via winget..."
            winget install OpenJS.NodeJS.LTS -e --silent --accept-package-agreements --accept-source-agreements 2>$null | Out-Null
            Refresh-Path
            if ((Test-CommandExists "node") -and ((Get-NodeMajorVersion) -ge $MinNodeMajor)) {
                $installedNow = $true
            }
        } catch {
            Write-Warn "winget nao concluiu a instalacao. Tentando metodo alternativo..."
        }
    }

    if (-not $installedNow) {
        try {
            $installer = Join-Path $env:TEMP "node-lts-installer.msi"
            Write-Host "    Baixando instalador oficial do Node.js..."
            Invoke-WebRequest -Uri $NodeInstallerUrl -OutFile $installer -UseBasicParsing
            Write-Host "    Instalando (uma janela do Windows pode pedir permissao de administrador)..."
            Start-Process msiexec.exe -ArgumentList "/i `"$installer`" /qn /norestart" -Wait
            Remove-Item $installer -ErrorAction SilentlyContinue
            Refresh-Path
            if ((Test-CommandExists "node") -and ((Get-NodeMajorVersion) -ge $MinNodeMajor)) {
                $installedNow = $true
            }
        } catch {
            Write-Warn "Falha no download/instalacao automatica: $($_.Exception.Message)"
        }
    }

    if ($installedNow) {
        Write-Ok "Node.js $(node -v) instalado com sucesso."
    } else {
        Write-Host ""
        Stop-WithError "Nao foi possivel instalar o Node.js automaticamente. Baixe manualmente em https://nodejs.org/ (versao LTS), instale, e rode START.bat novamente."
    }
}

if (-not (Test-CommandExists "npm")) {
    Stop-WithError "npm nao foi encontrado mesmo com o Node.js instalado. Reinstale o Node.js manualmente em https://nodejs.org/ e rode START.bat novamente."
}
Write-Ok "npm $(npm -v) encontrado."

# --------------------------------------------------------------------------
# 3. Arquivo .env
# --------------------------------------------------------------------------
Write-Step "Verificando arquivo .env..."

$envPath = Join-Path $ProjectRoot ".env"
$envExamplePath = Join-Path $ProjectRoot ".env.example"

if (-not (Test-Path $envPath)) {
    Write-Warn ".env nao encontrado. Criando a partir de .env.example..."
    Copy-Item $envExamplePath $envPath
}

Ensure-EnvKey $envPath "DATABASE_URL" "file:./dev.db"
Ensure-EnvKey $envPath "NEXTAUTH_URL" "http://localhost:3000"
Ensure-EnvKey $envPath "NEXTAUTH_SECRET" "troque-por-um-segredo-aleatorio"
Ensure-EnvKey $envPath "CRON_SECRET" "troque-por-um-segredo-aleatorio"
Ensure-EnvKey $envPath "RESEND_API_KEY" ""
Ensure-EnvKey $envPath "EMAIL_FROM" "Detonados Games <notificacoes@detonados.games>"
Ensure-EnvKey $envPath "NEXT_PUBLIC_VAPID_PUBLIC_KEY" ""
Ensure-EnvKey $envPath "VAPID_PRIVATE_KEY" ""

Ensure-SecretGenerated $envPath "NEXTAUTH_SECRET"
Ensure-SecretGenerated $envPath "CRON_SECRET"

Write-Ok ".env configurado."

# --------------------------------------------------------------------------
# 4. Dependencias (npm install)
# --------------------------------------------------------------------------
Write-Step "Verificando/instalando dependencias do projeto..."

if (-not (Test-Path (Join-Path $ProjectRoot "node_modules"))) {
    Write-Warn "node_modules nao encontrado - instalacao completa sera feita agora."
} else {
    Write-Host "    node_modules encontrado - verificando se ha atualizacoes..."
}

npm install --no-fund --no-audit
if ($LASTEXITCODE -ne 0) {
    Stop-WithError "npm install falhou. Verifique sua conexao com a internet e rode START.bat novamente."
}
Write-Ok "Dependencias instaladas/atualizadas."

# --------------------------------------------------------------------------
# 5. Banco de dados (Prisma + SQLite)
# --------------------------------------------------------------------------
Write-Step "Configurando banco de dados (Prisma + SQLite)..."

npx prisma generate
if ($LASTEXITCODE -ne 0) { Stop-WithError "prisma generate falhou." }
Write-Ok "Prisma Client gerado."

npx prisma db push --accept-data-loss
if ($LASTEXITCODE -ne 0) { Stop-WithError "prisma db push falhou." }
Write-Ok "Schema do banco sincronizado (prisma\dev.db)."

npx tsx prisma/seed.ts
if ($LASTEXITCODE -ne 0) { Stop-WithError "Seed do banco falhou." }
Write-Ok "Conquistas e jogos de exemplo garantidos no banco."

# --------------------------------------------------------------------------
# 6. Verificacao final (refeita do zero, com tudo ja instalado/atualizado)
# --------------------------------------------------------------------------
Write-Step "Verificacao final..."

$finalChecks = [ordered]@{
    "Node.js >= v$MinNodeMajor"     = ((Get-NodeMajorVersion) -ge $MinNodeMajor)
    "npm disponivel"                = (Test-CommandExists "npm")
    "Dependencias instaladas"       = (Test-Path (Join-Path $ProjectRoot "node_modules\next"))
    "Prisma Client gerado"          = (Test-Path (Join-Path $ProjectRoot "node_modules\.prisma\client\index.js"))
    "Banco de dados SQLite criado"  = (Test-Path (Join-Path $ProjectRoot "prisma\dev.db"))
    "Arquivo .env configurado"      = (Test-Path $envPath)
}

$allPass = $true
foreach ($name in $finalChecks.Keys) {
    if ($finalChecks[$name]) {
        Write-Ok $name
    } else {
        Write-Fail $name
        $allPass = $false
    }
}

if (-not $allPass) {
    Stop-WithError "Um ou mais itens falharam na verificacao final. Corrija os erros acima e rode START.bat novamente."
}

Write-Host ""
Write-Host "Tudo certo! 100% verificado." -ForegroundColor Green

# --------------------------------------------------------------------------
# 7. Inicializacao: Backend + Banco de Dados + Frontend
# --------------------------------------------------------------------------
Write-Step "Iniciando Backend + Banco de Dados + Frontend..."

if (Test-PortInUse 3000) {
    Write-Warn "A porta 3000 ja esta em uso. O Next.js vai escolher outra porta automaticamente - confira a URL exata no terminal abaixo."
} else {
    Start-Job -ScriptBlock {
        Start-Sleep -Seconds 4
        Start-Process "http://localhost:3000"
    } | Out-Null
    Write-Ok "O navegador vai abrir automaticamente em http://localhost:3000"
}

Write-Host ""
Write-Host "Detonados Games esta rodando (Next.js + agendador local)." -ForegroundColor Green
Write-Host "Pressione CTRL+C nesta janela para encerrar tudo." -ForegroundColor DarkGray
Write-Host ""

npm run dev:all

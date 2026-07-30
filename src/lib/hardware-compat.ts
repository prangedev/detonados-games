import tiersData from "./hardware-tiers.json";
import type { HardwareVerdict } from "./constants";

export interface ParsedRequirements {
  os?: string;
  cpu?: string;
  gpu?: string;
  ramGb?: number;
  storageGb?: number;
}

/**
 * A Steam devolve os requisitos como um bloco de HTML solto (tags <ul>/<li>
 * com formatação inconsistente entre jogos). Aqui removemos as tags e
 * extraímos os campos mais comuns via regex. Como o texto é livre, isso é
 * uma heurística — não um parser garantido para 100% dos jogos.
 */
export function parseHtmlRequirements(html: string): ParsedRequirements {
  const text = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/li>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&");

  const grab = (label: string) => {
    const match = text.match(new RegExp(`${label}:\\s*([^\\n]+)`, "i"));
    return match?.[1]?.trim();
  };

  const os = grab("OS");
  const cpu = grab("Processor");
  const gpu = grab("Graphics");
  const storageText = grab("Storage");
  const ramText = grab("Memory");

  const ramMatch = ramText?.match(/(\d+)\s*GB/i);
  const storageMatch = storageText?.match(/(\d+)\s*GB/i);

  return {
    os,
    cpu,
    gpu,
    ramGb: ramMatch ? Number(ramMatch[1]) : undefined,
    storageGb: storageMatch ? Number(storageMatch[1]) : undefined,
  };
}

function findComponentTier(name: string | undefined, db: Record<string, number>): number | null {
  if (!name) return null;
  const normalized = name.toLowerCase();
  let best: number | null = null;
  for (const [key, score] of Object.entries(db)) {
    if (normalized.includes(key.toLowerCase())) {
      if (best === null || score > best) best = score;
    }
  }
  return best;
}

export function lookupCpuTier(name: string): number | null {
  return findComponentTier(name, tiersData.cpus);
}

export function lookupGpuTier(name: string): number | null {
  return findComponentTier(name, tiersData.gpus);
}

export const KNOWN_CPUS = Object.keys(tiersData.cpus);
export const KNOWN_GPUS = Object.keys(tiersData.gpus);

export interface UserHardware {
  cpu: string;
  gpu: string;
  ramGb: number;
}

export interface CompatibilityResult {
  verdict: HardwareVerdict;
  ramOk: { min: boolean; rec: boolean };
  cpuOk: { min: boolean; rec: boolean };
  gpuOk: { min: boolean; rec: boolean };
  notes: string[];
}

/**
 * Compara o hardware informado pelo usuário com os requisitos mínimos e
 * recomendados do jogo.
 *
 * Limitação importante (documentada de propósito): a comparação de CPU/GPU
 * usa uma tabela de "tiers" curada manualmente (src/lib/hardware-tiers.json),
 * não um banco de benchmarks real como PassMark/UserBenchmark — esses exigem
 * acesso pago ou scraping fora dos termos de uso. Para produção, o ideal é
 * integrar uma API de benchmarks licenciada nesse mesmo ponto do código.
 */
export function compareHardware(
  user: UserHardware,
  min: ParsedRequirements | null,
  rec: ParsedRequirements | null
): CompatibilityResult {
  const notes: string[] = [];

  const userCpuTier = lookupCpuTier(user.cpu);
  const userGpuTier = lookupGpuTier(user.gpu);

  if (userCpuTier === null) notes.push("CPU não reconhecida na base de comparação; resultado pode ser impreciso.");
  if (userGpuTier === null) notes.push("GPU não reconhecida na base de comparação; resultado pode ser impreciso.");

  const minCpuTier = lookupCpuTier(min?.cpu ?? "");
  const minGpuTier = lookupGpuTier(min?.gpu ?? "");
  const recCpuTier = lookupCpuTier(rec?.cpu ?? "");
  const recGpuTier = lookupGpuTier(rec?.gpu ?? "");

  const ramOkMin = min?.ramGb ? user.ramGb >= min.ramGb : true;
  const ramOkRec = rec?.ramGb ? user.ramGb >= rec.ramGb : ramOkMin;

  const cpuOkMin = minCpuTier !== null && userCpuTier !== null ? userCpuTier >= minCpuTier : true;
  const cpuOkRec =
    recCpuTier !== null && userCpuTier !== null ? userCpuTier >= recCpuTier : cpuOkMin;

  const gpuOkMin = minGpuTier !== null && userGpuTier !== null ? userGpuTier >= minGpuTier : true;
  const gpuOkRec =
    recGpuTier !== null && userGpuTier !== null ? userGpuTier >= recGpuTier : gpuOkMin;

  const meetsMin = ramOkMin && cpuOkMin && gpuOkMin;
  const meetsRec = ramOkRec && cpuOkRec && gpuOkRec;

  let verdict: HardwareVerdict = "BAD";
  if (meetsRec) verdict = "GOOD";
  else if (meetsMin) verdict = "WARNING";

  return {
    verdict,
    ramOk: { min: ramOkMin, rec: ramOkRec },
    cpuOk: { min: cpuOkMin, rec: cpuOkRec },
    gpuOk: { min: gpuOkMin, rec: gpuOkRec },
    notes,
  };
}

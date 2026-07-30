import type { ParsedRequirements } from "@/lib/hardware-compat";
import type { PlatformType } from "@/lib/constants";

export interface GameSummary {
  id: string;
  slug: string;
  title: string;
  coverImage: string | null;
  platforms: PlatformType[];
  protonDbTier: string | null;
}

export interface GameDetail extends GameSummary {
  headerImage: string | null;
  shortDescription: string | null;
  detonado: string | null;
  genres: string[];
  minRequirements: ParsedRequirements | null;
  recRequirements: ParsedRequirements | null;
}

export async function fetchProtonDbTier(appId: number): Promise<string | null> {
  try {
    const res = await fetch(
      `https://www.protondb.com/api/v1/reports/summaries/${appId}.json`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { tier?: string };
    return data.tier ?? null;
  } catch {
    return null;
  }
}

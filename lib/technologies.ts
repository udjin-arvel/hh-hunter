export const TECHNOLOGY_NAME_MAX_CHARS = 80;
export const TECHNOLOGIES_MAX_COUNT = 20;

export function normalizeTechnologyName(value: string): string | null {
  const trimmed = value.trim();

  if (!trimmed || trimmed.length > TECHNOLOGY_NAME_MAX_CHARS) {
    return null;
  }

  return trimmed;
}

export function cleanTechnologiesFromModel(values: unknown): string[] {
  if (!Array.isArray(values)) {
    return [];
  }

  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of values) {
    if (typeof item !== "string") {
      continue;
    }

    const normalized = normalizeTechnologyName(item);

    if (!normalized) {
      continue;
    }

    const key = normalized.toLocaleLowerCase("ru");

    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    result.push(normalized);

    if (result.length >= TECHNOLOGIES_MAX_COUNT) {
      break;
    }
  }

  return result;
}

export function mergeTechnologiesToStudy(existing: string[], incoming: string[]): string[] {
  const byKey = new Map<string, string>();

  for (const name of existing) {
    const normalized = normalizeTechnologyName(name);

    if (!normalized) {
      continue;
    }

    byKey.set(normalized.toLocaleLowerCase("ru"), normalized);
  }

  for (const name of incoming) {
    const normalized = normalizeTechnologyName(name);

    if (!normalized) {
      continue;
    }

    const key = normalized.toLocaleLowerCase("ru");

    if (!byKey.has(key)) {
      byKey.set(key, normalized);
    }
  }

  return [...byKey.values()];
}

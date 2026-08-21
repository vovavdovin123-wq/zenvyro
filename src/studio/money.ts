/** Upper bound so a phone / name / concatenated digits cannot enter the studio average. */
export const MAX_MONEY_RUB = 99_999_999;

/** Parse a budget/price fragment. Dots and commas in 15.000 / 15,000 are thousands. `к`/`k`/`тыс` = ×1000. */
export function parseMoney(raw: string | undefined | null): number | undefined {
  if (!raw) return undefined;
  const compact = raw.replace(/\s+/g, "").toLowerCase();
  if (!compact) return undefined;

  const withSuffix = compact.match(/(\d[\d.,]*)(тыс|к|k)(?![\p{L}\p{N}])/iu);
  if (withSuffix) {
    const base = parseGroupedDigits(withSuffix[1]);
    return saneMoney(base !== undefined ? base * 1000 : undefined);
  }

  const match = compact.match(/(?<!\d)(\d{1,3}(?:[.,]\d{3})+|\d{1,8})(?!\d)/);
  if (!match) return undefined;
  return saneMoney(parseGroupedDigits(match[1]));
}

function parseGroupedDigits(value: string): number | undefined {
  if (/^\d{1,3}([.,]\d{3})+$/.test(value)) {
    const n = Number(value.replace(/[.,]/g, ""));
    return Number.isFinite(n) && n > 0 ? n : undefined;
  }
  if (!/^\d{1,8}$/.test(value)) return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function saneMoney(value: number | undefined) {
  if (value === undefined || value > MAX_MONEY_RUB) return undefined;
  return value;
}

export function hasPhrase(haystack: string, needle: string) {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}_])${escaped}(?![\\p{L}\\p{N}_])`, "iu").test(haystack);
}

export function hasStopPhrase(haystack: string, needle: string) {
  const escaped = needle.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(?<![\\p{L}\\p{N}_])(?<!не\\s)${escaped}(?![\\p{L}\\p{N}_])`, "iu").test(haystack);
}

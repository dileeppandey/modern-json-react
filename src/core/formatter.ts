import type { IndentationType } from '../types/editor';

/**
 * Pretty-print JSON text with the given indentation.
 * Returns the original text if it cannot be parsed.
 */
export function formatJson(text: string, indent: IndentationType = 2): string {
  try {
    const parsed = JSON.parse(text);
    const space = indent === 'tab' ? '\t' : indent;
    return JSON.stringify(parsed, null, space);
  } catch {
    return text;
  }
}

/**
 * Minify JSON text (remove all whitespace).
 */
export function minifyJson(text: string): string {
  try {
    return JSON.stringify(JSON.parse(text));
  } catch {
    return text;
  }
}

/**
 * Sort object keys in JSON text.
 * @param order - "asc" for ascending, "desc" for descending, or a custom comparator.
 */
export function sortJsonKeys(
  text: string,
  order: 'asc' | 'desc' | ((a: string, b: string) => number) = 'asc',
  indent: IndentationType = 2
): string {
  try {
    const parsed = JSON.parse(text);
    const sorted = deepSortKeys(parsed, order);
    const space = indent === 'tab' ? '\t' : indent;
    return JSON.stringify(sorted, null, space);
  } catch {
    return text;
  }
}

function deepSortKeys(
  value: unknown,
  order: 'asc' | 'desc' | ((a: string, b: string) => number)
): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => deepSortKeys(item, order));
  }

  if (value !== null && typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const comparator =
      typeof order === 'function'
        ? order
        : order === 'desc'
          ? (a: string, b: string) => b.localeCompare(a)
          : (a: string, b: string) => a.localeCompare(b);

    const sorted: Record<string, unknown> = {};
    const keys = Object.keys(obj).sort(comparator);
    for (const key of keys) {
      sorted[key] = deepSortKeys(obj[key], order);
    }
    return sorted;
  }

  return value;
}

/**
 * Compute document statistics from a JSON value.
 */
export interface JsonStats {
  properties: number;
  arrays: number;
  totalNodes: number;
  maxDepth: number;
  byteSize: number;
}

export function computeStats(value: unknown, text?: string): JsonStats {
  const stats: JsonStats = {
    properties: 0,
    arrays: 0,
    totalNodes: 0,
    maxDepth: 0,
    byteSize: text ? new TextEncoder().encode(text).length : 0,
  };

  function walk(val: unknown, depth: number) {
    stats.totalNodes++;
    stats.maxDepth = Math.max(stats.maxDepth, depth);

    if (Array.isArray(val)) {
      stats.arrays++;
      val.forEach((item) => walk(item, depth + 1));
    } else if (val !== null && typeof val === 'object') {
      const keys = Object.keys(val as Record<string, unknown>);
      stats.properties += keys.length;
      keys.forEach((key) => walk((val as Record<string, unknown>)[key], depth + 1));
    }
  }

  if (value !== undefined) {
    walk(value, 0);
  }
  return stats;
}

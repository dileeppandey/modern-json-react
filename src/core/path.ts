/**
 * JSONPath and dot-notation utilities.
 */

/**
 * Get a value from a nested object using a dot-notation path.
 * Supports array indexing: "items[0].name" or "items.0.name"
 */
export function getByPath(obj: unknown, path: string): unknown {
  if (path === '$' || path === '') return obj;

  const segments = parsePath(path);
  let current: unknown = obj;

  for (const segment of segments) {
    if (current === null || current === undefined) return undefined;

    if (Array.isArray(current)) {
      const index = parseInt(segment, 10);
      if (isNaN(index)) return undefined;
      current = current[index];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[segment];
    } else {
      return undefined;
    }
  }

  return current;
}

/**
 * Set a value in a nested object using a dot-notation path.
 * Returns a new object (immutable operation).
 */
export function setByPath(obj: unknown, path: string, value: unknown): unknown {
  if (path === '$' || path === '') return value;

  const segments = parsePath(path);
  return setBySegments(obj, segments, 0, value);
}

function setBySegments(
  current: unknown,
  segments: string[],
  index: number,
  value: unknown
): unknown {
  if (index === segments.length) return value;

  const segment = segments[index];

  if (Array.isArray(current)) {
    const arrIndex = parseInt(segment, 10);
    const newArr = [...current];
    newArr[arrIndex] = setBySegments(current[arrIndex], segments, index + 1, value);
    return newArr;
  }

  if (typeof current === 'object' && current !== null) {
    return {
      ...(current as Record<string, unknown>),
      [segment]: setBySegments(
        (current as Record<string, unknown>)[segment],
        segments,
        index + 1,
        value
      ),
    };
  }

  // Current is a primitive but path goes deeper — create object
  const nextSegment = segments[index + 1];
  const isArrayIndex = nextSegment !== undefined && /^\d+$/.test(nextSegment);
  const container = isArrayIndex ? [] : {};
  return {
    [segment]: setBySegments(container, segments, index + 1, value),
  };
}

/**
 * Delete a key from a nested object by path.
 * Returns a new object (immutable operation).
 */
export function deleteByPath(obj: unknown, path: string): unknown {
  if (path === '$' || path === '') return undefined;

  const segments = parsePath(path);
  return deleteBySegments(obj, segments, 0);
}

function deleteBySegments(current: unknown, segments: string[], index: number): unknown {
  if (index === segments.length - 1) {
    const segment = segments[index];

    if (Array.isArray(current)) {
      const arrIndex = parseInt(segment, 10);
      return current.filter((_, i) => i !== arrIndex);
    }

    if (typeof current === 'object' && current !== null) {
      const { [segment]: _, ...rest } = current as Record<string, unknown>;
      return rest;
    }

    return current;
  }

  const segment = segments[index];

  if (Array.isArray(current)) {
    const arrIndex = parseInt(segment, 10);
    const newArr = [...current];
    newArr[arrIndex] = deleteBySegments(current[arrIndex], segments, index + 1);
    return newArr;
  }

  if (typeof current === 'object' && current !== null) {
    return {
      ...(current as Record<string, unknown>),
      [segment]: deleteBySegments(
        (current as Record<string, unknown>)[segment],
        segments,
        index + 1
      ),
    };
  }

  return current;
}

/**
 * Parse a JSONPath or dot-notation string into segments.
 * "$." prefix is stripped. Brackets are converted to dot notation.
 * E.g., "$.store.book[0].author" → ["store", "book", "0", "author"]
 */
export function parsePath(path: string): string[] {
  // Strip leading "$." or "$"
  let normalized = path.replace(/^\$\.?/, '');
  // Convert bracket notation to dot notation: [0] → .0, ["key"] → .key
  normalized = normalized.replace(/\[(\d+)\]/g, '.$1');
  normalized = normalized.replace(/\["([^"]+)"\]/g, '.$1');
  normalized = normalized.replace(/\['([^']+)'\]/g, '.$1');

  return normalized.split('.').filter((s) => s !== '');
}

/**
 * Build a JSONPath string from segments.
 */
export function buildPath(segments: (string | number)[]): string {
  if (segments.length === 0) return '$';
  return '$.' + segments.map((s) => (typeof s === 'number' ? `[${s}]` : s)).join('.');
}

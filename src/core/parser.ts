import type { ParseError } from '../types/editor';

/** Result of a JSON parse attempt */
export interface ParseResult {
  value: unknown;
  error: ParseError | null;
}

/**
 * Parse a JSON string with detailed error location info.
 * Uses native JSON.parse but enhances error messages with line/column.
 */
export function parseJson(text: string): ParseResult {
  if (text.trim() === '') {
    return { value: undefined, error: null };
  }

  try {
    const value = JSON.parse(text);
    return { value, error: null };
  } catch (e) {
    const error = extractParseError(e as SyntaxError, text);
    return { value: undefined, error };
  }
}

/**
 * Extract line, column, and offset from a SyntaxError thrown by JSON.parse.
 * Different engines format the error message differently.
 */
function extractParseError(err: SyntaxError, text: string): ParseError {
  const message = err.message;

  // V8 (Chrome/Node): "... at position 42" or "... at line 3 column 5"
  let offset = -1;
  let line = 1;
  let column = 1;

  const posMatch = message.match(/at position (\d+)/);
  const lineColMatch = message.match(/at line (\d+) column (\d+)/);

  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
    offset = getOffsetFromLineCol(text, line, column);
  } else if (posMatch) {
    offset = parseInt(posMatch[1], 10);
    const loc = getLineColFromOffset(text, offset);
    line = loc.line;
    column = loc.column;
  }

  // Clean up the message for display
  const cleanMessage = message
    .replace(/^JSON\.parse: /, '')
    .replace(/ at position \d+.*$/, '')
    .replace(/ at line \d+ column \d+.*$/, '');

  return {
    message: cleanMessage || 'Invalid JSON',
    line,
    column,
    offset: Math.max(0, offset),
  };
}

/** Convert a character offset to line/column (both 1-based). */
export function getLineColFromOffset(
  text: string,
  offset: number,
): { line: number; column: number } {
  let line = 1;
  let lastNewline = -1;

  for (let i = 0; i < offset && i < text.length; i++) {
    if (text[i] === '\n') {
      line++;
      lastNewline = i;
    }
  }

  return { line, column: offset - lastNewline };
}

/** Convert line/column (1-based) to a character offset. */
export function getOffsetFromLineCol(text: string, line: number, column: number): number {
  let currentLine = 1;
  for (let i = 0; i < text.length; i++) {
    if (currentLine === line) {
      return i + column - 1;
    }
    if (text[i] === '\n') {
      currentLine++;
    }
  }
  return text.length;
}

/**
 * Stringify a value to formatted JSON text.
 */
export function stringifyJson(value: unknown, indent: number | string = 2): string {
  if (value === undefined) return '';
  try {
    return JSON.stringify(value, null, indent);
  } catch {
    return '';
  }
}

/**
 * Check if a string is valid JSON without returning the parsed value.
 */
export function isValidJson(text: string): boolean {
  try {
    JSON.parse(text);
    return true;
  } catch {
    return false;
  }
}

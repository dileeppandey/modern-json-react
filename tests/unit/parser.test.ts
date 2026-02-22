import { describe, it, expect } from 'vitest';
import {
  parseJson,
  stringifyJson,
  isValidJson,
  getLineColFromOffset,
  getOffsetFromLineCol,
} from '../../src/core/parser';

describe('parseJson', () => {
  it('parses a valid JSON object', () => {
    const result = parseJson('{"name": "John", "age": 30}');
    expect(result.error).toBeNull();
    expect(result.value).toEqual({ name: 'John', age: 30 });
  });

  it('parses a valid JSON array', () => {
    const result = parseJson('[1, 2, 3]');
    expect(result.error).toBeNull();
    expect(result.value).toEqual([1, 2, 3]);
  });

  it('parses primitive JSON values', () => {
    expect(parseJson('"hello"').value).toBe('hello');
    expect(parseJson('42').value).toBe(42);
    expect(parseJson('true').value).toBe(true);
    expect(parseJson('false').value).toBe(false);
    expect(parseJson('null').value).toBeNull();
  });

  it('handles empty string gracefully', () => {
    const result = parseJson('');
    expect(result.error).toBeNull();
    expect(result.value).toBeUndefined();
  });

  it('handles whitespace-only string', () => {
    const result = parseJson('   \n\t  ');
    expect(result.error).toBeNull();
    expect(result.value).toBeUndefined();
  });

  it('reports error for invalid JSON', () => {
    const result = parseJson('{"name": }');
    expect(result.error).not.toBeNull();
    expect(result.error!.message).toBeTruthy();
    expect(result.value).toBeUndefined();
  });

  it('reports error for trailing comma', () => {
    const result = parseJson('{"a": 1,}');
    expect(result.error).not.toBeNull();
  });

  it('reports error for single quotes', () => {
    const result = parseJson("{'name': 'John'}");
    expect(result.error).not.toBeNull();
  });

  it('reports error for unquoted keys', () => {
    const result = parseJson('{name: "John"}');
    expect(result.error).not.toBeNull();
  });

  it('parses nested objects', () => {
    const json = '{"a": {"b": {"c": 1}}}';
    const result = parseJson(json);
    expect(result.error).toBeNull();
    expect(result.value).toEqual({ a: { b: { c: 1 } } });
  });

  it('parses unicode strings', () => {
    const result = parseJson('{"emoji": "\\u0048\\u0065\\u006C\\u006C\\u006F"}');
    expect(result.error).toBeNull();
    expect((result.value as Record<string, string>).emoji).toBe('Hello');
  });

  it('parses escaped characters in strings', () => {
    const result = parseJson('{"text": "line1\\nline2\\ttab"}');
    expect(result.error).toBeNull();
    expect((result.value as Record<string, string>).text).toBe('line1\nline2\ttab');
  });

  it('handles large numbers within safe range', () => {
    const result = parseJson('9007199254740991');
    expect(result.error).toBeNull();
    expect(result.value).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('parses floating point numbers', () => {
    const result = parseJson('3.14159');
    expect(result.error).toBeNull();
    expect(result.value).toBeCloseTo(3.14159);
  });

  it('parses scientific notation', () => {
    const result = parseJson('1.5e10');
    expect(result.error).toBeNull();
    expect(result.value).toBe(1.5e10);
  });

  it('parses negative numbers', () => {
    const result = parseJson('-42');
    expect(result.error).toBeNull();
    expect(result.value).toBe(-42);
  });

  it('reports error location for multiline JSON', () => {
    const json = `{
  "name": "John",
  "age": ,
  "city": "NYC"
}`;
    const result = parseJson(json);
    expect(result.error).not.toBeNull();
    expect(result.error!.line).toBeGreaterThan(0);
  });
});

describe('stringifyJson', () => {
  it('formats with default 2-space indent', () => {
    const result = stringifyJson({ a: 1 });
    expect(result).toBe('{\n  "a": 1\n}');
  });

  it('formats with 4-space indent', () => {
    const result = stringifyJson({ a: 1 }, 4);
    expect(result).toBe('{\n    "a": 1\n}');
  });

  it('formats with tab indent', () => {
    const result = stringifyJson({ a: 1 }, '\t');
    expect(result).toBe('{\n\t"a": 1\n}');
  });

  it('returns empty string for undefined', () => {
    expect(stringifyJson(undefined)).toBe('');
  });

  it('handles circular references gracefully', () => {
    const obj: Record<string, unknown> = {};
    obj.self = obj;
    expect(stringifyJson(obj)).toBe('');
  });
});

describe('isValidJson', () => {
  it('returns true for valid JSON', () => {
    expect(isValidJson('{"a": 1}')).toBe(true);
    expect(isValidJson('[1,2,3]')).toBe(true);
    expect(isValidJson('"hello"')).toBe(true);
    expect(isValidJson('null')).toBe(true);
  });

  it('returns false for invalid JSON', () => {
    expect(isValidJson('{a: 1}')).toBe(false);
    expect(isValidJson('undefined')).toBe(false);
    expect(isValidJson('')).toBe(false);
  });
});

describe('getLineColFromOffset', () => {
  it('converts offset to line/column for single line', () => {
    const result = getLineColFromOffset('hello', 3);
    expect(result).toEqual({ line: 1, column: 4 });
  });

  it('converts offset to line/column for multiline', () => {
    const text = 'line1\nline2\nline3';
    expect(getLineColFromOffset(text, 7)).toEqual({ line: 2, column: 2 });
    expect(getLineColFromOffset(text, 12)).toEqual({ line: 3, column: 1 });
  });

  it('handles offset at start', () => {
    expect(getLineColFromOffset('hello', 0)).toEqual({ line: 1, column: 1 });
  });
});

describe('getOffsetFromLineCol', () => {
  it('converts line/column to offset', () => {
    const text = 'line1\nline2\nline3';
    expect(getOffsetFromLineCol(text, 1, 1)).toBe(0);
    expect(getOffsetFromLineCol(text, 2, 1)).toBe(6);
    expect(getOffsetFromLineCol(text, 3, 1)).toBe(12);
  });
});

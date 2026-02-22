import { describe, it, expect } from 'vitest';
import { formatJson, minifyJson, sortJsonKeys, computeStats } from '../../src/core/formatter';

describe('formatJson', () => {
  it('formats compact JSON with 2-space indent', () => {
    const result = formatJson('{"a":1,"b":2}');
    expect(result).toBe('{\n  "a": 1,\n  "b": 2\n}');
  });

  it('formats with 4-space indent', () => {
    const result = formatJson('{"a":1}', 4);
    expect(result).toBe('{\n    "a": 1\n}');
  });

  it('formats with tab indent', () => {
    const result = formatJson('{"a":1}', 'tab');
    expect(result).toBe('{\n\t"a": 1\n}');
  });

  it('returns original text for invalid JSON', () => {
    const invalid = '{bad json}';
    expect(formatJson(invalid)).toBe(invalid);
  });

  it('formats nested structures', () => {
    const result = formatJson('{"a":{"b":[1,2]}}');
    expect(result).toContain('\n');
    expect(result).toContain('"b"');
  });
});

describe('minifyJson', () => {
  it('removes whitespace from formatted JSON', () => {
    const formatted = '{\n  "a": 1,\n  "b": 2\n}';
    expect(minifyJson(formatted)).toBe('{"a":1,"b":2}');
  });

  it('returns original text for invalid JSON', () => {
    const invalid = '{bad}';
    expect(minifyJson(invalid)).toBe(invalid);
  });
});

describe('sortJsonKeys', () => {
  it('sorts keys alphabetically ascending', () => {
    const json = '{"c":3,"a":1,"b":2}';
    const result = JSON.parse(sortJsonKeys(json, 'asc'));
    const keys = Object.keys(result);
    expect(keys).toEqual(['a', 'b', 'c']);
  });

  it('sorts keys alphabetically descending', () => {
    const json = '{"a":1,"c":3,"b":2}';
    const result = JSON.parse(sortJsonKeys(json, 'desc'));
    const keys = Object.keys(result);
    expect(keys).toEqual(['c', 'b', 'a']);
  });

  it('sorts nested object keys recursively', () => {
    const json = '{"b":{"z":1,"a":2},"a":1}';
    const result = sortJsonKeys(json, 'asc');
    const parsed = JSON.parse(result);
    expect(Object.keys(parsed)).toEqual(['a', 'b']);
    expect(Object.keys(parsed.b)).toEqual(['a', 'z']);
  });

  it('supports custom comparator', () => {
    const json = '{"banana":1,"apple":2,"cherry":3}';
    const result = sortJsonKeys(json, (a, b) => a.length - b.length);
    const keys = Object.keys(JSON.parse(result));
    expect(keys).toEqual(['apple', 'banana', 'cherry']);
  });

  it('returns original text for invalid JSON', () => {
    expect(sortJsonKeys('{bad}')).toBe('{bad}');
  });
});

describe('computeStats', () => {
  it('computes stats for a simple object', () => {
    const stats = computeStats({ name: 'John', age: 30 });
    expect(stats.properties).toBe(2);
    expect(stats.arrays).toBe(0);
    expect(stats.totalNodes).toBe(3); // root + 2 properties
    expect(stats.maxDepth).toBe(1);
  });

  it('computes stats with arrays', () => {
    const stats = computeStats({ items: [1, 2, 3] });
    expect(stats.properties).toBe(1);
    expect(stats.arrays).toBe(1);
    expect(stats.totalNodes).toBe(5); // root + items key + 3 array items
  });

  it('computes stats with nested objects', () => {
    const stats = computeStats({ a: { b: { c: 1 } } });
    expect(stats.maxDepth).toBe(3);
  });

  it('computes byte size when text is provided', () => {
    const text = '{"a": 1}';
    const stats = computeStats({ a: 1 }, text);
    expect(stats.byteSize).toBe(8);
  });

  it('handles undefined value', () => {
    const stats = computeStats(undefined);
    expect(stats.totalNodes).toBe(0);
    expect(stats.properties).toBe(0);
  });

  it('handles null value', () => {
    const stats = computeStats(null);
    expect(stats.totalNodes).toBe(1);
    expect(stats.properties).toBe(0);
  });
});

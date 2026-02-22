import { describe, it, expect } from 'vitest';
import { getByPath, setByPath, deleteByPath, parsePath, buildPath } from '../../src/core/path';

describe('parsePath', () => {
  it('parses simple dot notation', () => {
    expect(parsePath('$.name')).toEqual(['name']);
    expect(parsePath('$.address.city')).toEqual(['address', 'city']);
  });

  it('parses bracket notation with indices', () => {
    expect(parsePath('$.items[0]')).toEqual(['items', '0']);
    expect(parsePath('$.items[0].name')).toEqual(['items', '0', 'name']);
  });

  it('strips leading $', () => {
    expect(parsePath('$')).toEqual([]);
    expect(parsePath('$.foo')).toEqual(['foo']);
  });

  it('handles paths without $ prefix', () => {
    expect(parsePath('name')).toEqual(['name']);
    expect(parsePath('a.b.c')).toEqual(['a', 'b', 'c']);
  });

  it('handles quoted bracket notation', () => {
    expect(parsePath('$["key"]')).toEqual(['key']);
    expect(parsePath("$['key']")).toEqual(['key']);
  });
});

describe('buildPath', () => {
  it('builds path from segments', () => {
    expect(buildPath([])).toBe('$');
    expect(buildPath(['name'])).toBe('$.name');
    expect(buildPath(['items', 0])).toBe('$.items.[0]');
  });
});

describe('getByPath', () => {
  const data = {
    name: 'John',
    address: { city: 'NYC', zip: '10001' },
    items: [{ id: 1 }, { id: 2 }],
  };

  it('gets root value', () => {
    expect(getByPath(data, '$')).toBe(data);
  });

  it('gets top-level property', () => {
    expect(getByPath(data, '$.name')).toBe('John');
  });

  it('gets nested property', () => {
    expect(getByPath(data, '$.address.city')).toBe('NYC');
  });

  it('gets array element', () => {
    expect(getByPath(data, '$.items[0]')).toEqual({ id: 1 });
  });

  it('gets nested property in array element', () => {
    expect(getByPath(data, '$.items[1].id')).toBe(2);
  });

  it('returns undefined for missing path', () => {
    expect(getByPath(data, '$.nonexistent')).toBeUndefined();
    expect(getByPath(data, '$.address.country')).toBeUndefined();
  });

  it('returns undefined for null/undefined input', () => {
    expect(getByPath(null, '$.name')).toBeUndefined();
    expect(getByPath(undefined, '$.name')).toBeUndefined();
  });
});

describe('setByPath', () => {
  it('sets root value', () => {
    expect(setByPath({}, '$', 42)).toBe(42);
  });

  it('sets top-level property', () => {
    const result = setByPath({ a: 1 }, '$.a', 2) as Record<string, unknown>;
    expect(result.a).toBe(2);
  });

  it('sets nested property (immutably)', () => {
    const original = { address: { city: 'NYC' } };
    const result = setByPath(original, '$.address.city', 'LA') as Record<string, any>;
    expect(result.address.city).toBe('LA');
    expect(original.address.city).toBe('NYC'); // original unchanged
  });

  it('sets array element', () => {
    const result = setByPath([1, 2, 3], '$[1]', 99) as number[];
    expect(result).toEqual([1, 99, 3]);
  });

  it('adds new property to object', () => {
    const result = setByPath({ a: 1 }, '$.b', 2) as Record<string, unknown>;
    expect(result).toEqual({ a: 1, b: 2 });
  });
});

describe('deleteByPath', () => {
  it('deletes top-level property', () => {
    const result = deleteByPath({ a: 1, b: 2 }, '$.a') as Record<string, unknown>;
    expect(result).toEqual({ b: 2 });
  });

  it('deletes nested property', () => {
    const result = deleteByPath(
      { address: { city: 'NYC', zip: '10001' } },
      '$.address.zip'
    ) as any;
    expect(result.address).toEqual({ city: 'NYC' });
  });

  it('deletes array element', () => {
    const result = deleteByPath([1, 2, 3], '$[1]') as number[];
    expect(result).toEqual([1, 3]);
  });

  it('returns undefined for root deletion', () => {
    expect(deleteByPath({ a: 1 }, '$')).toBeUndefined();
  });
});

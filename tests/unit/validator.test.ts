import { describe, it, expect } from 'vitest';
import { validateSchema } from '../../src/core/validator';

describe('validateSchema', () => {
  describe('type validation', () => {
    it('validates string type', () => {
      const schema = { type: 'string' };
      expect(validateSchema('hello', schema).valid).toBe(true);
      expect(validateSchema(42, schema).valid).toBe(false);
    });

    it('validates number type', () => {
      const schema = { type: 'number' };
      expect(validateSchema(42, schema).valid).toBe(true);
      expect(validateSchema(3.14, schema).valid).toBe(true);
      expect(validateSchema('42', schema).valid).toBe(false);
    });

    it('validates integer type', () => {
      const schema = { type: 'integer' };
      expect(validateSchema(42, schema).valid).toBe(true);
      expect(validateSchema(3.14, schema).valid).toBe(false);
    });

    it('validates boolean type', () => {
      const schema = { type: 'boolean' };
      expect(validateSchema(true, schema).valid).toBe(true);
      expect(validateSchema(false, schema).valid).toBe(true);
      expect(validateSchema(1, schema).valid).toBe(false);
    });

    it('validates null type', () => {
      const schema = { type: 'null' };
      expect(validateSchema(null, schema).valid).toBe(true);
      expect(validateSchema('', schema).valid).toBe(false);
    });

    it('validates object type', () => {
      const schema = { type: 'object' };
      expect(validateSchema({}, schema).valid).toBe(true);
      expect(validateSchema([], schema).valid).toBe(false);
    });

    it('validates array type', () => {
      const schema = { type: 'array' };
      expect(validateSchema([], schema).valid).toBe(true);
      expect(validateSchema({}, schema).valid).toBe(false);
    });

    it('validates union types', () => {
      const schema = { type: ['string', 'number'] };
      expect(validateSchema('hello', schema).valid).toBe(true);
      expect(validateSchema(42, schema).valid).toBe(true);
      expect(validateSchema(true, schema).valid).toBe(false);
    });
  });

  describe('enum validation', () => {
    it('accepts valid enum values', () => {
      const schema = { enum: ['red', 'green', 'blue'] };
      expect(validateSchema('red', schema).valid).toBe(true);
      expect(validateSchema('yellow', schema).valid).toBe(false);
    });

    it('handles numeric enums', () => {
      const schema = { enum: [1, 2, 3] };
      expect(validateSchema(2, schema).valid).toBe(true);
      expect(validateSchema(4, schema).valid).toBe(false);
    });
  });

  describe('string validation', () => {
    it('validates minLength', () => {
      const schema = { type: 'string', minLength: 3 };
      expect(validateSchema('abc', schema).valid).toBe(true);
      expect(validateSchema('ab', schema).valid).toBe(false);
    });

    it('validates maxLength', () => {
      const schema = { type: 'string', maxLength: 5 };
      expect(validateSchema('hello', schema).valid).toBe(true);
      expect(validateSchema('hello!', schema).valid).toBe(false);
    });

    it('validates pattern', () => {
      const schema = { type: 'string', pattern: '^[a-z]+$' };
      expect(validateSchema('hello', schema).valid).toBe(true);
      expect(validateSchema('Hello', schema).valid).toBe(false);
    });
  });

  describe('number validation', () => {
    it('validates minimum', () => {
      const schema = { type: 'number', minimum: 0 };
      expect(validateSchema(0, schema).valid).toBe(true);
      expect(validateSchema(5, schema).valid).toBe(true);
      expect(validateSchema(-1, schema).valid).toBe(false);
    });

    it('validates maximum', () => {
      const schema = { type: 'number', maximum: 100 };
      expect(validateSchema(100, schema).valid).toBe(true);
      expect(validateSchema(101, schema).valid).toBe(false);
    });

    it('validates exclusiveMinimum', () => {
      const schema = { type: 'number', exclusiveMinimum: 0 };
      expect(validateSchema(1, schema).valid).toBe(true);
      expect(validateSchema(0, schema).valid).toBe(false);
    });

    it('validates exclusiveMaximum', () => {
      const schema = { type: 'number', exclusiveMaximum: 100 };
      expect(validateSchema(99, schema).valid).toBe(true);
      expect(validateSchema(100, schema).valid).toBe(false);
    });

    it('validates multipleOf', () => {
      const schema = { type: 'number', multipleOf: 5 };
      expect(validateSchema(15, schema).valid).toBe(true);
      expect(validateSchema(12, schema).valid).toBe(false);
    });
  });

  describe('array validation', () => {
    it('validates minItems', () => {
      const schema = { type: 'array', minItems: 2 };
      expect(validateSchema([1, 2], schema).valid).toBe(true);
      expect(validateSchema([1], schema).valid).toBe(false);
    });

    it('validates maxItems', () => {
      const schema = { type: 'array', maxItems: 3 };
      expect(validateSchema([1, 2, 3], schema).valid).toBe(true);
      expect(validateSchema([1, 2, 3, 4], schema).valid).toBe(false);
    });

    it('validates uniqueItems', () => {
      const schema = { type: 'array', uniqueItems: true };
      expect(validateSchema([1, 2, 3], schema).valid).toBe(true);
      expect(validateSchema([1, 2, 2], schema).valid).toBe(false);
    });

    it('validates item schemas', () => {
      const schema = { type: 'array', items: { type: 'string' } };
      expect(validateSchema(['a', 'b'], schema).valid).toBe(true);
      expect(validateSchema(['a', 1], schema).valid).toBe(false);
    });
  });

  describe('object validation', () => {
    it('validates required properties', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
        required: ['name'],
      };
      expect(validateSchema({ name: 'John', age: 30 }, schema).valid).toBe(true);
      expect(validateSchema({ name: 'John' }, schema).valid).toBe(true);
      expect(validateSchema({ age: 30 }, schema).valid).toBe(false);
    });

    it('validates property schemas', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          age: { type: 'number', minimum: 0 },
        },
      };
      expect(validateSchema({ name: 'John', age: 30 }, schema).valid).toBe(true);
      expect(validateSchema({ name: 'John', age: -1 }, schema).valid).toBe(false);
    });

    it('validates additionalProperties: false', () => {
      const schema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        additionalProperties: false,
      };
      expect(validateSchema({ name: 'John' }, schema).valid).toBe(true);
      expect(validateSchema({ name: 'John', extra: true }, schema).valid).toBe(false);
    });

    it('validates minProperties', () => {
      const schema = { type: 'object', minProperties: 2 };
      expect(validateSchema({ a: 1, b: 2 }, schema).valid).toBe(true);
      expect(validateSchema({ a: 1 }, schema).valid).toBe(false);
    });

    it('validates maxProperties', () => {
      const schema = { type: 'object', maxProperties: 2 };
      expect(validateSchema({ a: 1, b: 2 }, schema).valid).toBe(true);
      expect(validateSchema({ a: 1, b: 2, c: 3 }, schema).valid).toBe(false);
    });
  });

  describe('nested validation', () => {
    it('validates deeply nested structures', () => {
      const schema = {
        type: 'object',
        properties: {
          address: {
            type: 'object',
            properties: {
              city: { type: 'string' },
              zip: { type: 'string', pattern: '^\\d{5}$' },
            },
            required: ['city'],
          },
        },
      };

      expect(
        validateSchema(
          { address: { city: 'NYC', zip: '10001' } },
          schema
        ).valid
      ).toBe(true);

      const result = validateSchema(
        { address: { zip: 'invalid' } },
        schema
      );
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThanOrEqual(1);
    });

    it('reports correct paths for nested errors', () => {
      const schema = {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: { price: { type: 'number', minimum: 0 } },
            },
          },
        },
      };

      const result = validateSchema(
        { items: [{ price: 10 }, { price: -5 }] },
        schema
      );

      expect(result.valid).toBe(false);
      const priceError = result.errors.find((e) => e.path.includes('[1]'));
      expect(priceError).toBeDefined();
      expect(priceError!.path).toContain('price');
    });
  });

  describe('error details', () => {
    it('includes schema keyword in errors', () => {
      const schema = { type: 'string', minLength: 5 };
      const result = validateSchema('hi', schema);
      expect(result.errors[0].schemaKeyword).toBe('minLength');
    });

    it('includes actual value in errors', () => {
      const schema = { type: 'number', minimum: 10 };
      const result = validateSchema(5, schema);
      expect(result.errors[0].actualValue).toBe(5);
    });

    it('includes JSONPath in errors', () => {
      const schema = {
        type: 'object',
        properties: { name: { type: 'number' } },
      };
      const result = validateSchema({ name: 'text' }, schema);
      expect(result.errors[0].path).toBe('$.name');
    });
  });
});

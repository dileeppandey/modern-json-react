import type {
  ValidationError,
  ValidationResult,
  JSONSchema,
  CustomValidator,
  ValidationSeverity,
} from '../types/validation';

/**
 * Validate a parsed JSON value against a JSON Schema (Draft-07 compatible subset).
 * This is a built-in lightweight validator — for full draft support, users can
 * supply an Ajv-based CustomValidator.
 */
export function validateSchema(
  value: unknown,
  schema: JSONSchema,
  path: string = '$',
): ValidationResult {
  const errors: ValidationError[] = [];

  if (value === undefined || value === null) {
    if (schema.type && schema.type !== 'null') {
      errors.push(makeError(`Expected type "${schema.type}", got null`, path, 'type', schema.type));
    }
    return { valid: errors.length === 0, errors };
  }

  // Type validation
  if (schema.type) {
    const actualType = getJsonType(value);
    const allowedTypes = Array.isArray(schema.type) ? schema.type : [schema.type];
    // Per JSON Schema spec, "integer" is a subtype of "number"
    const typeMatches =
      allowedTypes.includes(actualType) ||
      (actualType === 'integer' && allowedTypes.includes('number'));
    if (!typeMatches) {
      errors.push(
        makeError(
          `Expected type "${allowedTypes.join(' | ')}", got "${actualType}"`,
          path,
          'type',
          schema.type,
          value,
        ),
      );
    }
  }

  // Enum validation
  if (schema.enum && Array.isArray(schema.enum)) {
    if (!schema.enum.some((e) => deepEqual(e, value))) {
      errors.push(
        makeError(
          `Value must be one of: ${schema.enum.map((e) => JSON.stringify(e)).join(', ')}`,
          path,
          'enum',
          schema.enum,
          value,
        ),
      );
    }
  }

  // String validations
  if (typeof value === 'string') {
    if (schema.minLength !== undefined && value.length < (schema.minLength as number)) {
      errors.push(
        makeError(
          `String must be at least ${schema.minLength} characters`,
          path,
          'minLength',
          schema.minLength,
          value,
        ),
      );
    }
    if (schema.maxLength !== undefined && value.length > (schema.maxLength as number)) {
      errors.push(
        makeError(
          `String must be at most ${schema.maxLength} characters`,
          path,
          'maxLength',
          schema.maxLength,
          value,
        ),
      );
    }
    if (schema.pattern) {
      const re = new RegExp(schema.pattern as string);
      if (!re.test(value)) {
        errors.push(
          makeError(
            `String must match pattern "${schema.pattern}"`,
            path,
            'pattern',
            schema.pattern,
            value,
          ),
        );
      }
    }
  }

  // Number validations
  if (typeof value === 'number') {
    if (schema.minimum !== undefined && value < (schema.minimum as number)) {
      errors.push(
        makeError(`Value must be >= ${schema.minimum}`, path, 'minimum', schema.minimum, value),
      );
    }
    if (schema.maximum !== undefined && value > (schema.maximum as number)) {
      errors.push(
        makeError(`Value must be <= ${schema.maximum}`, path, 'maximum', schema.maximum, value),
      );
    }
    if (schema.exclusiveMinimum !== undefined && value <= (schema.exclusiveMinimum as number)) {
      errors.push(
        makeError(
          `Value must be > ${schema.exclusiveMinimum}`,
          path,
          'exclusiveMinimum',
          schema.exclusiveMinimum,
          value,
        ),
      );
    }
    if (schema.exclusiveMaximum !== undefined && value >= (schema.exclusiveMaximum as number)) {
      errors.push(
        makeError(
          `Value must be < ${schema.exclusiveMaximum}`,
          path,
          'exclusiveMaximum',
          schema.exclusiveMaximum,
          value,
        ),
      );
    }
    if (schema.multipleOf !== undefined && value % (schema.multipleOf as number) !== 0) {
      errors.push(
        makeError(
          `Value must be a multiple of ${schema.multipleOf}`,
          path,
          'multipleOf',
          schema.multipleOf,
          value,
        ),
      );
    }
  }

  // Array validations
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < (schema.minItems as number)) {
      errors.push(
        makeError(
          `Array must have at least ${schema.minItems} items`,
          path,
          'minItems',
          schema.minItems,
          value,
        ),
      );
    }
    if (schema.maxItems !== undefined && value.length > (schema.maxItems as number)) {
      errors.push(
        makeError(
          `Array must have at most ${schema.maxItems} items`,
          path,
          'maxItems',
          schema.maxItems,
          value,
        ),
      );
    }
    if (
      schema.uniqueItems &&
      new Set(value.map((v: unknown) => JSON.stringify(v))).size !== value.length
    ) {
      errors.push(makeError('Array items must be unique', path, 'uniqueItems', true, value));
    }
    // Validate items against item schema
    if (schema.items && !Array.isArray(schema.items)) {
      value.forEach((item, index) => {
        const result = validateSchema(item, schema.items as JSONSchema, `${path}[${index}]`);
        errors.push(...result.errors);
      });
    }
  }

  // Object validations
  if (isPlainObject(value)) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);

    if (schema.required && Array.isArray(schema.required)) {
      for (const req of schema.required as string[]) {
        if (!(req in obj)) {
          errors.push(
            makeError(`Missing required property "${req}"`, path, 'required', schema.required),
          );
        }
      }
    }

    if (schema.minProperties !== undefined && keys.length < (schema.minProperties as number)) {
      errors.push(
        makeError(
          `Object must have at least ${schema.minProperties} properties`,
          path,
          'minProperties',
          schema.minProperties,
          value,
        ),
      );
    }

    if (schema.maxProperties !== undefined && keys.length > (schema.maxProperties as number)) {
      errors.push(
        makeError(
          `Object must have at most ${schema.maxProperties} properties`,
          path,
          'maxProperties',
          schema.maxProperties,
          value,
        ),
      );
    }

    // Validate each property
    if (schema.properties) {
      const props = schema.properties as Record<string, JSONSchema>;
      for (const key of keys) {
        if (props[key]) {
          const result = validateSchema(obj[key], props[key], `${path}.${key}`);
          errors.push(...result.errors);
        } else if (schema.additionalProperties === false) {
          errors.push(
            makeError(
              `Unexpected property "${key}"`,
              `${path}.${key}`,
              'additionalProperties',
              false,
              obj[key],
            ),
          );
        }
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Run custom validators on a value.
 */
export async function runCustomValidators(
  value: unknown,
  validators: CustomValidator[],
  path: string = '$',
): Promise<ValidationError[]> {
  const results = await Promise.all(validators.map((v) => v(value, path)));
  return results.flat();
}

// --- Helpers ---

function getJsonType(value: unknown): string {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'integer' : 'number';
  }
  return typeof value;
}

function makeError(
  message: string,
  path: string,
  schemaKeyword: string,
  schemaRule?: unknown,
  actualValue?: unknown,
  severity: ValidationSeverity = 'error',
): ValidationError {
  return { message, path, severity, schemaKeyword, schemaRule, actualValue };
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return typeof val === 'object' && val !== null && !Array.isArray(val);
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a === null || b === null) return false;
  if (typeof a !== 'object') return false;
  return JSON.stringify(a) === JSON.stringify(b);
}

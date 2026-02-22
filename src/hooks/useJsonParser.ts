import { useState, useEffect, useCallback, useRef } from 'react';
import { parseJson, stringifyJson } from '../core/parser';
import { validateSchema, runCustomValidators } from '../core/validator';
import type { ParseError } from '../types/editor';
import type { ValidationError, JSONSchema, CustomValidator } from '../types/validation';

interface UseJsonParserOptions {
  /** JSON Schema for validation */
  schema?: JSONSchema;
  /** Custom validators */
  validators?: CustomValidator[];
  /** Debounce interval in ms */
  debounce?: number;
}

interface UseJsonParserResult {
  /** The current raw text */
  text: string;
  /** The parsed value (undefined if invalid) */
  parsedValue: unknown;
  /** Parse error, if any */
  parseError: ParseError | null;
  /** Validation errors from schema + custom validators */
  validationErrors: ValidationError[];
  /** Whether the text is valid JSON */
  isValid: boolean;
  /** Update the raw text */
  setText: (text: string) => void;
  /** Update from a parsed value */
  setValue: (value: unknown) => void;
  /** Format the current text */
  format: (indent?: number | string) => void;
}

/**
 * Hook that manages JSON parsing and validation state.
 */
export function useJsonParser(
  initialValue?: unknown,
  options: UseJsonParserOptions = {}
): UseJsonParserResult {
  const { schema, validators, debounce = 300 } = options;

  const [text, setText] = useState<string>(() =>
    initialValue !== undefined ? stringifyJson(initialValue) : ''
  );
  const [parsedValue, setParsedValue] = useState<unknown>(initialValue);
  const [parseError, setParseError] = useState<ParseError | null>(null);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);

  const debounceTimer = useRef<ReturnType<typeof setTimeout>>();

  // Parse text whenever it changes
  useEffect(() => {
    const result = parseJson(text);
    setParsedValue(result.value);
    setParseError(result.error);

    // Run validation if parsing succeeded
    if (!result.error && result.value !== undefined) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);

      debounceTimer.current = setTimeout(async () => {
        let errors: ValidationError[] = [];

        if (schema) {
          const schemaResult = validateSchema(result.value, schema);
          errors = [...schemaResult.errors];
        }

        if (validators && validators.length > 0) {
          const customErrors = await runCustomValidators(result.value, validators);
          errors = [...errors, ...customErrors];
        }

        setValidationErrors(errors);
      }, debounce);
    } else {
      setValidationErrors([]);
    }

    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, [text, schema, validators, debounce]);

  const handleSetText = useCallback((newText: string) => {
    setText(newText);
  }, []);

  const handleSetValue = useCallback((value: unknown) => {
    const newText = stringifyJson(value);
    setText(newText);
  }, []);

  const format = useCallback(
    (indent: number | string = 2) => {
      if (parsedValue !== undefined) {
        setText(stringifyJson(parsedValue, indent));
      }
    },
    [parsedValue]
  );

  return {
    text,
    parsedValue,
    parseError,
    validationErrors,
    isValid: parseError === null && validationErrors.length === 0,
    setText: handleSetText,
    setValue: handleSetValue,
    format,
  };
}

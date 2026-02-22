/** Severity level for validation messages */
export type ValidationSeverity = 'error' | 'warning' | 'info';

/** A validation error/warning with location and context */
export interface ValidationError {
  /** Human-readable error message */
  message: string;
  /** JSONPath to the offending value (e.g., "$.address.zip") */
  path: string;
  /** Severity level */
  severity: ValidationSeverity;
  /** Line number in the raw text (1-based, if available) */
  line?: number;
  /** Column number in the raw text (1-based, if available) */
  column?: number;
  /** The JSON Schema keyword that failed (e.g., "minimum", "required") */
  schemaKeyword?: string;
  /** The schema rule that was violated */
  schemaRule?: unknown;
  /** The actual value that failed validation */
  actualValue?: unknown;
}

/** JSON Schema type — kept intentionally loose for broad draft support */
export type JSONSchema = Record<string, unknown> & {
  type?: string | string[];
  properties?: Record<string, JSONSchema>;
  items?: JSONSchema | JSONSchema[];
  required?: string[];
  $ref?: string;
  $schema?: string;
};

/** Custom validator function — returns an array of errors (empty = valid) */
export type CustomValidator = (
  value: unknown,
  path: string
) => ValidationError[] | Promise<ValidationError[]>;

/** Result from the validation engine */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

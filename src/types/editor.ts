import type { ValidationError, JSONSchema, CustomValidator } from './validation';
import type { ThemeConfig } from '../themes/types';

/** Editing mode for the JSON editor */
export type EditorMode = 'code' | 'tree' | 'split';

/** When to trigger validation */
export type ValidationMode = 'onChange' | 'onBlur' | 'onSubmit' | 'manual';

/** Indentation configuration */
export type IndentationType = 2 | 4 | 'tab';

/** Props for the root JsonEditor component */
export interface JsonEditorProps {
  /** The JSON value — can be a parsed object or a raw JSON string */
  value?: unknown;
  /** Called when the JSON value changes */
  onChange?: (value: unknown, rawText: string) => void;

  /** Active editing mode */
  mode?: EditorMode;
  /** Called when the user switches modes */
  onModeChange?: (mode: EditorMode) => void;

  /** JSON Schema for validation (Draft-07, 2019-09, 2020-12) */
  schema?: JSONSchema;
  /** Custom validator functions */
  validators?: CustomValidator[];
  /** When to run validation */
  validationMode?: ValidationMode;
  /** Called when validation completes */
  onValidate?: (errors: ValidationError[]) => void;

  /** Theme: preset name, "auto" (follows OS), or custom config */
  theme?: 'light' | 'dark' | 'auto' | ThemeConfig;
  /** Editor height — CSS value or pixel number */
  height?: string | number;

  /** If true, editor is read-only */
  readOnly?: boolean;
  /** Enable search bar */
  searchable?: boolean;
  /** Enable key sorting */
  sortable?: boolean;
  /** Indentation style */
  indentation?: IndentationType;
  /** Show line numbers in code mode */
  lineNumbers?: boolean;
  /** Enable bracket matching */
  bracketMatching?: boolean;

  /** Max document size in bytes — shows warning above this */
  maxSize?: number;
  /** Enable virtual scrolling ("auto" enables for large docs) */
  virtualize?: boolean | 'auto';

  /** Called on parse/render errors */
  onError?: (error: Error) => void;
  /** Called when editor gains focus */
  onFocus?: () => void;
  /** Called when editor loses focus */
  onBlur?: () => void;

  /** Additional CSS class on the root element */
  className?: string;
  /** Inline styles on the root element */
  style?: React.CSSProperties;
  /** Accessible label for the editor */
  'aria-label'?: string;
}

/** Internal editor state shared across sub-components */
export interface EditorState {
  /** The raw JSON text */
  text: string;
  /** The parsed value (undefined if parse error) */
  parsedValue: unknown;
  /** Current parse error, if any */
  parseError: ParseError | null;
  /** Schema validation errors */
  validationErrors: ValidationError[];
  /** Current cursor position */
  cursor: CursorPosition;
  /** Current selection range */
  selection: SelectionRange | null;
  /** Whether the document has been modified */
  isDirty: boolean;
}

/** Position in the text */
export interface CursorPosition {
  line: number;
  column: number;
  offset: number;
}

/** A range of selected text */
export interface SelectionRange {
  start: CursorPosition;
  end: CursorPosition;
}

/** A JSON parse error with location info */
export interface ParseError {
  message: string;
  line: number;
  column: number;
  offset: number;
}

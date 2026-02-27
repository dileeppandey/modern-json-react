// Main component
export { JsonEditor } from './JsonEditor';

// Types
export type {
  JsonEditorProps,
  EditorMode,
  ValidationMode,
  IndentationType,
  EditorState,
  CursorPosition,
  SelectionRange,
  ParseError,
} from './types/editor';

export type {
  ValidationError,
  ValidationResult,
  ValidationSeverity,
  JSONSchema,
  CustomValidator,
} from './types/validation';

export type { JsonNodeType, TreeNode, TreeAction, ContextMenuItem } from './types/tree';

export type { ThemeConfig } from './themes/types';

// Themes
export { lightTheme } from './themes/light';
export { darkTheme } from './themes/dark';

// Core utilities (for advanced users)
export { parseJson, stringifyJson, isValidJson } from './core/parser';
export { validateSchema, runCustomValidators } from './core/validator';
export { formatJson, minifyJson, sortJsonKeys, computeStats } from './core/formatter';
export { getByPath, setByPath, deleteByPath, parsePath, buildPath } from './core/path';

// Hooks (for custom editor builds)
export { useJsonParser } from './hooks/useJsonParser';
export { useUndoRedo } from './hooks/useUndoRedo';
export { useSearch } from './hooks/useSearch';
export { useContainerWidth } from './hooks/useContainerWidth';

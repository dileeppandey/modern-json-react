/** Full theme configuration using CSS custom property values */
export interface ThemeConfig {
  /** Theme name identifier */
  name: string;

  /** Editor background */
  bg: string;
  /** Default text color */
  fg: string;
  /** Borders and dividers */
  border: string;

  /** Line number gutter background */
  gutterBg: string;
  /** Line number text */
  gutterFg: string;

  /** Text selection background */
  selection: string;
  /** Cursor color */
  cursor: string;

  /** Syntax: object keys */
  keyColor: string;
  /** Syntax: string values */
  stringColor: string;
  /** Syntax: number values */
  numberColor: string;
  /** Syntax: booleans */
  booleanColor: string;
  /** Syntax: null */
  nullColor: string;
  /** Syntax: brackets and braces */
  bracketColor: string;
  /** Matching bracket highlight */
  bracketMatchBg: string;

  /** Error indicator color */
  errorColor: string;
  /** Warning indicator color */
  warningColor: string;
  /** Success indicator color */
  successColor: string;

  /** Tree connector lines */
  treeLine: string;
  /** Tree hovered node background */
  treeHover: string;
  /** Tree selected node background */
  treeSelected: string;
  /** Type badge background */
  typeBadgeBg: string;
}

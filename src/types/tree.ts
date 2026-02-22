/** The type of a JSON value node */
export type JsonNodeType = 'string' | 'number' | 'boolean' | 'null' | 'object' | 'array';

/** A node in the JSON tree representation */
export interface TreeNode {
  /** Unique identifier for this node */
  id: string;
  /** The key name (for object properties) or index (for array items) */
  key: string | number;
  /** The value at this node */
  value: unknown;
  /** The type of the value */
  type: JsonNodeType;
  /** JSONPath from root (e.g., "$.address.city") */
  path: string;
  /** Depth in the tree (0 = root) */
  depth: number;
  /** Whether this node is expanded (for objects/arrays) */
  expanded: boolean;
  /** Child nodes (for objects/arrays) */
  children: TreeNode[];
  /** Number of descendant nodes (for display purposes) */
  descendantCount: number;
  /** Parent node ID (null for root) */
  parentId: string | null;
}

/** Action types for tree editing operations */
export type TreeAction =
  | { type: 'SET_VALUE'; nodeId: string; value: unknown }
  | { type: 'SET_KEY'; nodeId: string; key: string }
  | { type: 'SET_TYPE'; nodeId: string; newType: JsonNodeType }
  | { type: 'DELETE_NODE'; nodeId: string }
  | { type: 'ADD_CHILD'; parentId: string; key: string; value: unknown }
  | { type: 'MOVE_NODE'; nodeId: string; targetParentId: string; targetIndex: number }
  | { type: 'DUPLICATE_NODE'; nodeId: string }
  | { type: 'TOGGLE_EXPAND'; nodeId: string }
  | { type: 'EXPAND_ALL' }
  | { type: 'COLLAPSE_ALL' };

/** Context menu item definition */
export interface ContextMenuItem {
  label: string;
  icon?: string;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
}

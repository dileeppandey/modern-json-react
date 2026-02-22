import React, { useMemo, useCallback, useState } from 'react';
import { TreeNodeComponent, type TreeNodeData } from './TreeNode';
import { setByPath, deleteByPath } from '../../core/path';
import type { JsonNodeType } from '../../types/tree';

export interface TreeEditorProps {
  value: unknown;
  onChange: (value: unknown) => void;
  readOnly: boolean;
  className?: string;
}

let nodeIdCounter = 0;

/**
 * Tree-based visual editor for JSON data.
 * Converts a JSON value into a navigable tree with inline editing.
 */
export const TreeEditor: React.FC<TreeEditorProps> = ({
  value,
  onChange,
  readOnly,
  className = '',
}) => {
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set(['$']));

  // Build tree structure from the JSON value
  const tree = useMemo(() => {
    nodeIdCounter = 0;
    return buildTree(value, '$', 'root', 0, expandedPaths);
  }, [value, expandedPaths]);

  const handleToggle = useCallback((id: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      // Find the path for this id — we encode path in the id
      const path = id;
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  const handleValueChange = useCallback(
    (path: string, newValue: unknown) => {
      const updated = setByPath(value, path, newValue);
      onChange(updated);
    },
    [value, onChange]
  );

  const handleKeyChange = useCallback(
    (path: string, oldKey: string, newKey: string) => {
      // Rename: delete old key, set new key with the same value
      const segments = path.split('.');
      const parentPath = segments.slice(0, -1).join('.') || '$';
      const currentValue = getNestedValue(value, path);
      let updated = deleteByPath(value, path);
      const newPath = parentPath === '$' ? `$.${newKey}` : `${parentPath}.${newKey}`;
      updated = setByPath(updated, newPath, currentValue);
      onChange(updated);
    },
    [value, onChange]
  );

  const handleDelete = useCallback(
    (path: string) => {
      const updated = deleteByPath(value, path);
      onChange(updated);
    },
    [value, onChange]
  );

  const handleTypeChange = useCallback(
    (path: string, newType: JsonNodeType) => {
      const defaults: Record<JsonNodeType, unknown> = {
        string: '',
        number: 0,
        boolean: false,
        null: null,
        object: {},
        array: [],
      };
      const updated = setByPath(value, path, defaults[newType]);
      onChange(updated);
    },
    [value, onChange]
  );

  const handleAddProperty = useCallback(() => {
    if (value === undefined || value === null) {
      onChange({});
      return;
    }
    if (typeof value === 'object' && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      let newKey = 'newKey';
      let counter = 1;
      while (newKey in obj) {
        newKey = `newKey${counter++}`;
      }
      onChange({ ...obj, [newKey]: '' });
    } else if (Array.isArray(value)) {
      onChange([...value, '']);
    }
  }, [value, onChange]);

  if (tree === null) {
    return (
      <div className={`mjr-tree-editor mjr-tree-editor--empty ${className}`}>
        <p className="mjr-tree-editor__empty-msg">No valid JSON to display</p>
        {!readOnly && (
          <button className="mjr-tree-editor__add-btn" onClick={() => onChange({})}>
            + Create empty object
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={`mjr-tree-editor ${className}`}
      role="tree"
      aria-label="JSON tree editor"
      data-testid="tree-editor"
    >
      <TreeNodeComponent
        node={tree}
        onToggle={handleToggle}
        onValueChange={handleValueChange}
        onKeyChange={handleKeyChange}
        onDelete={handleDelete}
        onTypeChange={handleTypeChange}
        readOnly={readOnly}
      />

      {!readOnly && (
        <button
          className="mjr-tree-editor__add-root"
          onClick={handleAddProperty}
          data-testid="add-property"
        >
          + Add property
        </button>
      )}
    </div>
  );
};

// --- Tree building helpers ---

function buildTree(
  value: unknown,
  path: string,
  key: string | number,
  depth: number,
  expandedPaths: Set<string>
): TreeNodeData | null {
  if (value === undefined) return null;

  const type = getType(value);
  const expanded = expandedPaths.has(path);
  const id = path; // Use path as id for simplicity

  const node: TreeNodeData = {
    id,
    key,
    value,
    type,
    path,
    depth,
    expanded,
    children: [],
    childCount: 0,
  };

  if (type === 'object' && value !== null) {
    const obj = value as Record<string, unknown>;
    const keys = Object.keys(obj);
    node.childCount = keys.length;
    if (expanded) {
      node.children = keys.map((k) =>
        buildTree(obj[k], `${path}.${k}`, k, depth + 1, expandedPaths)
      ).filter(Boolean) as TreeNodeData[];
    }
  } else if (type === 'array') {
    const arr = value as unknown[];
    node.childCount = arr.length;
    if (expanded) {
      node.children = arr.map((item, i) =>
        buildTree(item, `${path}[${i}]`, i, depth + 1, expandedPaths)
      ).filter(Boolean) as TreeNodeData[];
    }
  }

  return node;
}

function getType(value: unknown): JsonNodeType {
  if (value === null) return 'null';
  if (Array.isArray(value)) return 'array';
  const t = typeof value;
  if (t === 'string') return 'string';
  if (t === 'number') return 'number';
  if (t === 'boolean') return 'boolean';
  if (t === 'object') return 'object';
  return 'string';
}

function getNestedValue(obj: unknown, path: string): unknown {
  const segments = path.replace(/^\$\.?/, '').replace(/\[(\d+)\]/g, '.$1').split('.').filter(Boolean);
  let current = obj;
  for (const seg of segments) {
    if (current === null || current === undefined) return undefined;
    if (Array.isArray(current)) {
      current = current[parseInt(seg, 10)];
    } else if (typeof current === 'object') {
      current = (current as Record<string, unknown>)[seg];
    }
  }
  return current;
}

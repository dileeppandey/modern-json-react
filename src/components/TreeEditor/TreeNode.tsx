import React, { useState, useCallback } from 'react';
import type { JsonNodeType } from '../../types/tree';

export interface TreeNodeData {
  id: string;
  key: string | number;
  value: unknown;
  type: JsonNodeType;
  path: string;
  depth: number;
  expanded: boolean;
  children: TreeNodeData[];
  childCount: number;
}

export interface TreeNodeProps {
  node: TreeNodeData;
  onToggle: (id: string) => void;
  onValueChange: (path: string, value: unknown) => void;
  onKeyChange: (path: string, oldKey: string, newKey: string) => void;
  onDelete: (path: string) => void;
  onTypeChange: (path: string, newType: JsonNodeType) => void;
  readOnly: boolean;
}

const TYPE_LABELS: Record<JsonNodeType, string> = {
  string: 'str',
  number: 'num',
  boolean: 'bool',
  null: 'null',
  object: 'obj',
  array: 'arr',
};

const TYPE_DEFAULTS: Record<JsonNodeType, unknown> = {
  string: '',
  number: 0,
  boolean: false,
  null: null,
  object: {},
  array: [],
};

export const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  onToggle,
  onValueChange,
  onKeyChange,
  onDelete,
  onTypeChange,
  readOnly,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [editKey, setEditKey] = useState('');

  const isExpandable = node.type === 'object' || node.type === 'array';

  const handleToggle = useCallback(() => {
    if (isExpandable) {
      onToggle(node.id);
    }
  }, [isExpandable, node.id, onToggle]);

  const handleStartEdit = useCallback(() => {
    if (readOnly || isExpandable) return;
    setEditValue(node.type === 'string' ? String(node.value) : JSON.stringify(node.value));
    setIsEditing(true);
  }, [readOnly, isExpandable, node.value, node.type]);

  const handleFinishEdit = useCallback(() => {
    setIsEditing(false);
    let newValue: unknown;

    if (node.type === 'string') {
      newValue = editValue;
    } else if (node.type === 'number') {
      const num = Number(editValue);
      newValue = isNaN(num) ? node.value : num;
    } else if (node.type === 'boolean') {
      newValue = editValue === 'true';
    } else if (node.type === 'null') {
      newValue = null;
    } else {
      try {
        newValue = JSON.parse(editValue);
      } catch {
        newValue = node.value;
      }
    }

    onValueChange(node.path, newValue);
  }, [editValue, node.type, node.value, node.path, onValueChange]);

  const handleKeyEdit = useCallback(() => {
    if (readOnly || typeof node.key === 'number') return;
    setEditKey(String(node.key));
    setIsEditingKey(true);
  }, [readOnly, node.key]);

  const handleFinishKeyEdit = useCallback(() => {
    setIsEditingKey(false);
    if (editKey !== String(node.key)) {
      onKeyChange(node.path, String(node.key), editKey);
    }
  }, [editKey, node.key, node.path, onKeyChange]);

  const handleTypeChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const newType = e.target.value as JsonNodeType;
      onTypeChange(node.path, newType);
    },
    [node.path, onTypeChange]
  );

  const renderValue = () => {
    if (isEditing) {
      return (
        <input
          className="mjr-tree-node__edit-input"
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onBlur={handleFinishEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFinishEdit();
            if (e.key === 'Escape') setIsEditing(false);
          }}
          autoFocus
          aria-label={`Edit value for ${node.key}`}
          data-testid={`edit-value-${node.path}`}
        />
      );
    }

    if (isExpandable) {
      const symbol = node.type === 'object' ? '{}' : '[]';
      return (
        <span className="mjr-tree-node__preview">
          {node.expanded ? '' : `${symbol}`}
          {!node.expanded && (
            <span className="mjr-tree-node__count">
              ({node.childCount} {node.childCount === 1 ? 'item' : 'items'})
            </span>
          )}
        </span>
      );
    }

    return (
      <span
        className={`mjr-tree-node__value mjr-tree-node__value--${node.type}`}
        onDoubleClick={handleStartEdit}
        role="button"
        tabIndex={0}
        aria-label={`Value: ${formatDisplayValue(node.value, node.type)}. Double-click to edit.`}
        data-testid={`value-${node.path}`}
      >
        {formatDisplayValue(node.value, node.type)}
      </span>
    );
  };

  return (
    <div
      className="mjr-tree-node"
      role="treeitem"
      aria-expanded={isExpandable ? node.expanded : undefined}
      aria-level={node.depth + 1}
      aria-label={`${node.key}: ${node.type}`}
      style={{ paddingLeft: `${node.depth * 20}px` }}
      data-testid={`tree-node-${node.path}`}
    >
      {/* Expand/collapse arrow */}
      <span
        className={`mjr-tree-node__arrow ${isExpandable ? 'mjr-tree-node__arrow--expandable' : ''} ${node.expanded ? 'mjr-tree-node__arrow--expanded' : ''}`}
        onClick={handleToggle}
        aria-hidden="true"
      >
        {isExpandable ? (node.expanded ? '\u25BC' : '\u25B6') : '\u00A0'}
      </span>

      {/* Key */}
      {isEditingKey ? (
        <input
          className="mjr-tree-node__key-input"
          value={editKey}
          onChange={(e) => setEditKey(e.target.value)}
          onBlur={handleFinishKeyEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFinishKeyEdit();
            if (e.key === 'Escape') setIsEditingKey(false);
          }}
          autoFocus
          aria-label={`Edit key name`}
        />
      ) : (
        <span
          className="mjr-tree-node__key"
          onDoubleClick={handleKeyEdit}
          data-testid={`key-${node.path}`}
        >
          {typeof node.key === 'number' ? node.key : `"${node.key}"`}
        </span>
      )}

      <span className="mjr-tree-node__colon" aria-hidden="true">:</span>

      {/* Value */}
      {renderValue()}

      {/* Type badge */}
      {!readOnly ? (
        <select
          className="mjr-tree-node__type-badge"
          value={node.type}
          onChange={handleTypeChange}
          aria-label={`Type for ${node.key}`}
          data-testid={`type-${node.path}`}
        >
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>{label}</option>
          ))}
        </select>
      ) : (
        <span className="mjr-tree-node__type-badge-ro">
          {TYPE_LABELS[node.type]}
        </span>
      )}

      {/* Delete button */}
      {!readOnly && (
        <button
          className="mjr-tree-node__delete"
          onClick={() => onDelete(node.path)}
          aria-label={`Delete ${node.key}`}
          title="Delete"
          data-testid={`delete-${node.path}`}
        >
          \u2715
        </button>
      )}

      {/* Children */}
      {isExpandable && node.expanded && node.children.length > 0 && (
        <div role="group" className="mjr-tree-node__children">
          {node.children.map((child) => (
            <TreeNodeComponent
              key={child.id}
              node={child}
              onToggle={onToggle}
              onValueChange={onValueChange}
              onKeyChange={onKeyChange}
              onDelete={onDelete}
              onTypeChange={onTypeChange}
              readOnly={readOnly}
            />
          ))}
        </div>
      )}
    </div>
  );
};

function formatDisplayValue(value: unknown, type: JsonNodeType): string {
  if (type === 'null') return 'null';
  if (type === 'string') return `"${String(value)}"`;
  if (type === 'boolean') return String(value);
  if (type === 'number') return String(value);
  return '';
}

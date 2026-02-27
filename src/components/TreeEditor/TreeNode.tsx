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
  searchQuery?: string;
  searchCaseSensitive?: boolean;
}

const TYPE_LABELS: Record<JsonNodeType, string> = {
  string: 'str',
  number: 'num',
  boolean: 'bool',
  null: 'null',
  object: 'obj',
  array: 'arr',
};

/** Color classes for type badges */
const TYPE_COLORS: Record<JsonNodeType, string> = {
  string: 'mjr-badge--string',
  number: 'mjr-badge--number',
  boolean: 'mjr-badge--boolean',
  null: 'mjr-badge--null',
  object: 'mjr-badge--object',
  array: 'mjr-badge--array',
};

export const TreeNodeComponent: React.FC<TreeNodeProps> = ({
  node,
  onToggle,
  onValueChange,
  onKeyChange,
  onDelete,
  onTypeChange,
  readOnly,
  searchQuery = '',
  searchCaseSensitive = false,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState('');
  const [isEditingKey, setIsEditingKey] = useState(false);
  const [editKey, setEditKey] = useState('');

  const isExpandable = node.type === 'object' || node.type === 'array';

  const handleToggle = useCallback(() => {
    if (isExpandable) onToggle(node.id);
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
      onTypeChange(node.path, e.target.value as JsonNodeType);
    },
    [node.path, onTypeChange],
  );

  // --- Render pieces ---

  const renderArrow = () => (
    <button
      className={`mjr-tree__arrow ${isExpandable ? 'mjr-tree__arrow--expandable' : ''}`}
      onClick={handleToggle}
      tabIndex={isExpandable ? 0 : -1}
      aria-hidden={!isExpandable}
      aria-label={isExpandable ? (node.expanded ? 'Collapse' : 'Expand') : undefined}
    >
      {isExpandable ? (
        <svg
          className={`mjr-tree__chevron ${node.expanded ? 'mjr-tree__chevron--open' : ''}`}
          width="12"
          height="12"
          viewBox="0 0 12 12"
          fill="none"
        >
          <path
            d="M4.5 2.5L8 6L4.5 9.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <span className="mjr-tree__arrow-spacer" />
      )}
    </button>
  );

  const renderKey = () => {
    if (isEditingKey) {
      return (
        <input
          className="mjr-tree__input mjr-tree__input--key"
          value={editKey}
          onChange={(e) => setEditKey(e.target.value)}
          onBlur={handleFinishKeyEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleFinishKeyEdit();
            if (e.key === 'Escape') setIsEditingKey(false);
          }}
          autoFocus
          aria-label="Edit key name"
        />
      );
    }

    const keyStr = String(node.key);
    const keyContent = searchQuery
      ? highlightText(keyStr, searchQuery, searchCaseSensitive)
      : keyStr;

    return (
      <span
        className={`mjr-tree__key ${typeof node.key !== 'number' && !readOnly ? 'mjr-tree__key--editable' : ''}`}
        onDoubleClick={handleKeyEdit}
        data-testid={`key-${node.path}`}
      >
        {typeof node.key === 'number' ? (
          <span className="mjr-tree__index">{node.key}</span>
        ) : (
          <>
            {'"'}
            <span className="mjr-tree__key-text">{keyContent}</span>
            {'"'}
          </>
        )}
      </span>
    );
  };

  const renderValue = () => {
    if (isEditing) {
      return (
        <input
          className="mjr-tree__input mjr-tree__input--value"
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
      const open = node.type === 'object' ? '{' : '[';
      const close = node.type === 'object' ? '}' : ']';
      return (
        <span className="mjr-tree__preview">
          <span className="mjr-tree__bracket">{open}</span>
          {!node.expanded && (
            <>
              <span className="mjr-tree__ellipsis">
                {node.childCount} {node.childCount === 1 ? 'item' : 'items'}
              </span>
              <span className="mjr-tree__bracket">{close}</span>
            </>
          )}
        </span>
      );
    }

    const display = formatDisplayValue(node.value, node.type);
    const displayContent = searchQuery
      ? highlightText(display, searchQuery, searchCaseSensitive)
      : display;

    return (
      <span
        className={`mjr-tree__value mjr-tree__value--${node.type} ${!readOnly ? 'mjr-tree__value--editable' : ''}`}
        onDoubleClick={handleStartEdit}
        role="button"
        tabIndex={0}
        aria-label={`Value: ${display}. Double-click to edit.`}
        data-testid={`value-${node.path}`}
      >
        {displayContent}
      </span>
    );
  };

  const renderBadge = () => {
    const colorClass = TYPE_COLORS[node.type];

    if (!readOnly) {
      return (
        <select
          className={`mjr-tree__badge ${colorClass}`}
          value={node.type}
          onChange={handleTypeChange}
          aria-label={`Type for ${node.key}`}
          data-testid={`type-${node.path}`}
        >
          {Object.entries(TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
      );
    }

    return (
      <span className={`mjr-tree__badge mjr-tree__badge--ro ${colorClass}`}>
        {TYPE_LABELS[node.type]}
      </span>
    );
  };

  const renderActions = () => {
    if (readOnly) return null;

    return (
      <div className="mjr-tree__actions">
        <button
          className="mjr-tree__delete"
          onClick={() => onDelete(node.path)}
          aria-label={`Delete ${node.key}`}
          title="Delete"
          data-testid={`delete-${node.path}`}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path
              d="M9 3L3 9M3 3l6 6"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </div>
    );
  };

  const renderClosingBracket = () => {
    if (!isExpandable || !node.expanded) return null;
    const close = node.type === 'object' ? '}' : ']';
    return (
      <div className="mjr-tree__close-bracket">
        <span className="mjr-tree__bracket">{close}</span>
      </div>
    );
  };

  return (
    <div
      className="mjr-tree-node"
      role="treeitem"
      aria-expanded={isExpandable ? node.expanded : undefined}
      aria-level={node.depth + 1}
      aria-label={`${node.key}: ${node.type}`}
      data-testid={`tree-node-${node.path}`}
    >
      {/* The row: arrow + key + colon + value + badge + actions */}
      <div className="mjr-tree__row">
        {renderArrow()}

        <div className="mjr-tree__content">
          {renderKey()}
          <span className="mjr-tree__colon" aria-hidden="true">
            {':'}
          </span>
          {renderValue()}
          {renderBadge()}
        </div>

        {renderActions()}
      </div>

      {/* Children (indented) */}
      {isExpandable && node.expanded && node.children.length > 0 && (
        <div role="group" className="mjr-tree__children">
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
              searchQuery={searchQuery}
              searchCaseSensitive={searchCaseSensitive}
            />
          ))}
          {renderClosingBracket()}
        </div>
      )}

      {/* Closing bracket when no children */}
      {isExpandable && node.expanded && node.children.length === 0 && (
        <div className="mjr-tree__children">{renderClosingBracket()}</div>
      )}
    </div>
  );
};

/**
 * Highlights occurrences of a search query within text by wrapping them in <mark> tags.
 */
function highlightText(text: string, query: string, caseSensitive: boolean): React.ReactNode {
  if (!query || !text) return text;

  try {
    const flags = caseSensitive ? 'g' : 'gi';
    const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(${escaped})`, flags);
    const parts = text.split(regex);

    if (parts.length === 1) return text;

    return parts.map((part, i) => {
      if (regex.test(part)) {
        // Reset lastIndex after test
        regex.lastIndex = 0;
        return (
          <mark key={i} className="mjr-tree__match" data-testid="tree-search-match">
            {part}
          </mark>
        );
      }
      return part;
    });
  } catch {
    return text;
  }
}

function formatDisplayValue(value: unknown, type: JsonNodeType): string {
  if (type === 'null') return 'null';
  if (type === 'string') {
    const str = String(value);
    // Truncate long strings in tree view
    if (str.length > 80) return `"${str.slice(0, 77)}..."`;
    return `"${str}"`;
  }
  if (type === 'boolean') return String(value);
  if (type === 'number') return String(value);
  return '';
}

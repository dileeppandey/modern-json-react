import React from 'react';
import type { EditorMode } from '../../types/editor';

export interface ToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onFormat: () => void;
  searchable: boolean;
  isSearchOpen: boolean;
  onToggleSearch: () => void;
  readOnly: boolean;
  className?: string;
}

const MODE_OPTIONS: { value: EditorMode; label: string }[] = [
  { value: 'code', label: 'Code' },
  { value: 'tree', label: 'Tree' },
  { value: 'split', label: 'Split' },
];

export const Toolbar: React.FC<ToolbarProps> = ({
  mode,
  onModeChange,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onFormat,
  searchable,
  isSearchOpen,
  onToggleSearch,
  readOnly,
  className = '',
}) => {
  return (
    <div className={`mjr-toolbar ${className}`} role="toolbar" aria-label="Editor controls">
      {/* Mode Switcher */}
      <div className="mjr-toolbar__modes" role="tablist" aria-label="Editor mode">
        {MODE_OPTIONS.map(({ value, label }) => (
          <button
            key={value}
            role="tab"
            aria-selected={mode === value}
            className={`mjr-toolbar__mode-btn ${mode === value ? 'mjr-toolbar__mode-btn--active' : ''}`}
            onClick={() => onModeChange(value)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mjr-toolbar__separator" aria-hidden="true" />

      {/* Search Toggle */}
      {searchable && (
        <button
          className={`mjr-toolbar__btn ${isSearchOpen ? 'mjr-toolbar__btn--active' : ''}`}
          onClick={onToggleSearch}
          aria-label="Toggle search"
          aria-pressed={isSearchOpen}
          title="Search (Ctrl+F)"
        >
          &#x1F50D;
        </button>
      )}

      <div className="mjr-toolbar__separator" aria-hidden="true" />

      {/* Undo / Redo */}
      {!readOnly && (
        <>
          <button
            className="mjr-toolbar__btn"
            onClick={onUndo}
            disabled={!canUndo}
            aria-label="Undo"
            title="Undo (Ctrl+Z)"
          >
            &#x21B6;
          </button>
          <button
            className="mjr-toolbar__btn"
            onClick={onRedo}
            disabled={!canRedo}
            aria-label="Redo"
            title="Redo (Ctrl+Shift+Z)"
          >
            &#x21B7;
          </button>
        </>
      )}

      {/* Format */}
      {!readOnly && (
        <button
          className="mjr-toolbar__btn"
          onClick={onFormat}
          aria-label="Format document"
          title="Format (Ctrl+Shift+P)"
        >
          { '{ }' }
        </button>
      )}
    </div>
  );
};

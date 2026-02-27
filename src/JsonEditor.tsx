import React, { useCallback, useState, useEffect, useMemo, useRef } from 'react';
import { Toolbar } from './components/Toolbar/Toolbar';
import { SearchBar } from './components/SearchBar/SearchBar';
import { CodeEditor } from './components/CodeEditor/CodeEditor';
import { TreeEditor } from './components/TreeEditor/TreeEditor';
import { StatusBar } from './components/StatusBar/StatusBar';
import { useJsonParser } from './hooks/useJsonParser';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useSearch } from './hooks/useSearch';
import { useContainerWidth } from './hooks/useContainerWidth';
import { computeStats } from './core/formatter';
import { lightTheme } from './themes/light';
import { darkTheme } from './themes/dark';
import type { JsonEditorProps, EditorMode, CursorPosition } from './types/editor';
import type { ThemeConfig } from './themes/types';

/** Breakpoints based on container width (not viewport) */
const BREAKPOINT_SM = 480;
const BREAKPOINT_MD = 768;

/**
 * A production-grade JSON editor React component.
 *
 * Supports code editing, tree editing, split view, JSON Schema validation,
 * undo/redo, search, theming, and full keyboard accessibility.
 */
export const JsonEditor: React.FC<JsonEditorProps> = ({
  value: externalValue,
  onChange,
  mode: controlledMode,
  onModeChange,
  schema,
  validators,
  validationMode = 'onChange',
  onValidate,
  theme = 'light',
  height = 400,
  readOnly = false,
  searchable = true,
  sortable: _sortable = true,
  indentation = 2,
  lineNumbers = true,
  bracketMatching = true,
  maxSize: _maxSize,
  virtualize: _virtualize = 'auto',
  onError: _onError,
  onFocus,
  onBlur,
  className = '',
  style,
  'aria-label': ariaLabel = 'JSON Editor',
}) => {
  // Mode state (uncontrolled fallback)
  const [internalMode, setInternalMode] = useState<EditorMode>('code');
  const mode = controlledMode ?? internalMode;
  const handleModeChange = useCallback(
    (newMode: EditorMode) => {
      if (onModeChange) onModeChange(newMode);
      else setInternalMode(newMode);
    },
    [onModeChange],
  );

  // JSON parser + validation
  const parser = useJsonParser(externalValue, {
    schema,
    validators,
    debounce: validationMode === 'onChange' ? 300 : undefined,
  });

  // Undo/redo
  const history = useUndoRedo(parser.text, { maxHistory: 100 });

  // Sync external value changes
  useEffect(() => {
    if (externalValue !== undefined) {
      const text =
        typeof externalValue === 'string'
          ? externalValue
          : JSON.stringify(externalValue, null, indentation === 'tab' ? '\t' : indentation);
      if (text !== parser.text) {
        parser.setText(text);
        history.reset(text);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalValue]);

  // Notify parent of changes
  const handleTextChange = useCallback(
    (text: string) => {
      parser.setText(text);
      history.set(text);

      if (onChange) {
        try {
          const parsed = JSON.parse(text);
          onChange(parsed, text);
        } catch {
          // Pass raw text even if invalid — parent can check parseError
          onChange(undefined, text);
        }
      }
    },
    [parser, history, onChange],
  );

  const handleTreeChange = useCallback(
    (newValue: unknown) => {
      const indent = indentation === 'tab' ? '\t' : indentation;
      const text = JSON.stringify(newValue, null, indent);
      handleTextChange(text);
    },
    [handleTextChange, indentation],
  );

  // Notify parent of validation
  useEffect(() => {
    if (onValidate) {
      onValidate(parser.validationErrors);
    }
  }, [parser.validationErrors, onValidate]);

  // Search
  const search = useSearch(parser.text);

  // Cursor
  const [cursor, setCursor] = useState<CursorPosition>({ line: 1, column: 1, offset: 0 });

  // Stats
  const stats = useMemo(
    () => (parser.parsedValue !== undefined ? computeStats(parser.parsedValue, parser.text) : null),
    [parser.parsedValue, parser.text],
  );

  // Theme resolution
  const resolvedTheme = useMemo((): ThemeConfig => {
    if (typeof theme === 'object') return theme;
    if (theme === 'dark') return darkTheme;
    if (theme === 'auto') {
      if (
        typeof window !== 'undefined' &&
        window.matchMedia?.('(prefers-color-scheme: dark)').matches
      ) {
        return darkTheme;
      }
      return lightTheme;
    }
    return lightTheme;
  }, [theme]);

  // CSS custom properties from theme
  const themeVars = useMemo(() => {
    const vars: Record<string, string> = {};
    vars['--mjr-bg'] = resolvedTheme.bg;
    vars['--mjr-fg'] = resolvedTheme.fg;
    vars['--mjr-border'] = resolvedTheme.border;
    vars['--mjr-gutter-bg'] = resolvedTheme.gutterBg;
    vars['--mjr-gutter-fg'] = resolvedTheme.gutterFg;
    vars['--mjr-selection'] = resolvedTheme.selection;
    vars['--mjr-cursor'] = resolvedTheme.cursor;
    vars['--mjr-key'] = resolvedTheme.keyColor;
    vars['--mjr-string'] = resolvedTheme.stringColor;
    vars['--mjr-number'] = resolvedTheme.numberColor;
    vars['--mjr-boolean'] = resolvedTheme.booleanColor;
    vars['--mjr-null'] = resolvedTheme.nullColor;
    vars['--mjr-bracket'] = resolvedTheme.bracketColor;
    vars['--mjr-bracket-match'] = resolvedTheme.bracketMatchBg;
    vars['--mjr-error'] = resolvedTheme.errorColor;
    vars['--mjr-warning'] = resolvedTheme.warningColor;
    vars['--mjr-success'] = resolvedTheme.successColor;
    vars['--mjr-tree-line'] = resolvedTheme.treeLine;
    vars['--mjr-tree-hover'] = resolvedTheme.treeHover;
    vars['--mjr-tree-selected'] = resolvedTheme.treeSelected;
    vars['--mjr-type-badge-bg'] = resolvedTheme.typeBadgeBg;
    return vars;
  }, [resolvedTheme]);

  // Keyboard shortcuts (global)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        history.undo();
        // Sync parser with undone state
        const undoneText = history.current;
        if (undoneText !== undefined) {
          parser.setText(undoneText as string);
        }
      }

      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        history.redo();
        const redoneText = history.current;
        if (redoneText !== undefined) {
          parser.setText(redoneText as string);
        }
      }

      if (mod && e.key === 'f') {
        e.preventDefault();
        if (searchable) search.open();
      }

      if (e.key === 'Escape') {
        search.close();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [history, parser, search, searchable]);

  // Responsive container measurement
  const containerRef = useRef<HTMLDivElement>(null);
  const containerWidth = useContainerWidth(containerRef);

  const isSmall = containerWidth > 0 && containerWidth <= BREAKPOINT_SM;
  const isMedium = containerWidth > 0 && containerWidth <= BREAKPOINT_MD;

  // Build responsive class names
  const sizeClass = isSmall ? 'mjr-editor--sm' : isMedium ? 'mjr-editor--md' : '';
  const shouldStackSplit = mode === 'split' && isMedium;

  const heightStyle = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      ref={containerRef}
      className={`mjr-editor ${sizeClass} ${className}`.trim()}
      style={{ ...themeVars, height: heightStyle, ...style } as React.CSSProperties}
      role="application"
      aria-label={ariaLabel}
      onFocus={onFocus}
      onBlur={onBlur}
      data-testid="json-editor"
    >
      <Toolbar
        mode={mode}
        onModeChange={handleModeChange}
        canUndo={history.canUndo}
        canRedo={history.canRedo}
        onUndo={() => {
          history.undo();
        }}
        onRedo={() => {
          history.redo();
        }}
        onFormat={() => parser.format(indentation === 'tab' ? '\t' : indentation)}
        searchable={searchable}
        isSearchOpen={search.isActive}
        onToggleSearch={() => (search.isActive ? search.close() : search.open())}
        readOnly={readOnly}
      />

      {search.isActive && (
        <SearchBar
          query={search.query}
          onQueryChange={search.setQuery}
          matches={search.matches}
          currentMatchIndex={search.currentMatchIndex}
          totalMatches={search.totalMatches}
          onNext={search.goToNext}
          onPrevious={search.goToPrevious}
          onClose={search.close}
          options={search.options}
          onOptionsChange={search.setOptions}
        />
      )}

      <div
        className={`mjr-editor__content ${shouldStackSplit ? 'mjr-editor__content--responsive-stack' : ''}`}
      >
        {(mode === 'code' || mode === 'split') && (
          <div className={`mjr-editor__panel ${mode === 'split' ? 'mjr-editor__panel--half' : ''}`}>
            <CodeEditor
              value={parser.text}
              onChange={handleTextChange}
              parseError={parser.parseError}
              readOnly={readOnly}
              lineNumbers={isSmall ? false : lineNumbers}
              bracketMatching={bracketMatching}
              searchMatches={search.matches}
              currentMatchIndex={search.currentMatchIndex}
              onCursorChange={setCursor}
            />
          </div>
        )}

        {(mode === 'tree' || mode === 'split') && (
          <div className={`mjr-editor__panel ${mode === 'split' ? 'mjr-editor__panel--half' : ''}`}>
            <TreeEditor
              value={parser.parsedValue}
              onChange={handleTreeChange}
              readOnly={readOnly}
              searchQuery={search.isActive ? search.query : ''}
              searchCaseSensitive={search.options.caseSensitive}
            />
          </div>
        )}
      </div>

      <StatusBar
        parseError={parser.parseError}
        validationErrors={parser.validationErrors}
        cursor={cursor}
        stats={stats}
      />
    </div>
  );
};

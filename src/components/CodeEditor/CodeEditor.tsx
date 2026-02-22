import React, { useRef, useCallback, useEffect, useMemo } from 'react';
import type { ParseError, CursorPosition } from '../../types/editor';
import type { SearchMatch } from '../../hooks/useSearch';

export interface CodeEditorProps {
  value: string;
  onChange: (value: string) => void;
  parseError: ParseError | null;
  readOnly: boolean;
  lineNumbers: boolean;
  bracketMatching: boolean;
  searchMatches: SearchMatch[];
  currentMatchIndex: number;
  onCursorChange: (pos: CursorPosition) => void;
  className?: string;
}

/**
 * Syntax-highlighted code editor for JSON.
 * Uses a contentEditable approach with a textarea overlay for input,
 * keeping the implementation dependency-free.
 */
export const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  parseError,
  readOnly,
  lineNumbers,
  searchMatches,
  currentMatchIndex,
  onCursorChange,
  className = '',
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const lines = useMemo(() => value.split('\n'), [value]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      if (readOnly) return;
      onChange(e.target.value);
    },
    [onChange, readOnly]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (readOnly) return;

      // Tab key inserts 2 spaces
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const indent = '  ';

        const newValue = value.substring(0, start) + indent + value.substring(end);
        onChange(newValue);

        // Restore cursor after indent
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + indent.length;
        });
      }

      // Auto-close brackets
      if (e.key === '{' || e.key === '[' || e.key === '"') {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const closeChar = e.key === '{' ? '}' : e.key === '[' ? ']' : '"';

        // Only auto-close if no text is selected
        if (start === end) {
          e.preventDefault();
          const newValue =
            value.substring(0, start) + e.key + closeChar + value.substring(end);
          onChange(newValue);

          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = start + 1;
          });
        }
      }
    },
    [value, onChange, readOnly]
  );

  const handleCursorMove = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const pos = textarea.selectionStart;
    const textBefore = value.substring(0, pos);
    const linesBefore = textBefore.split('\n');
    const line = linesBefore.length;
    const column = linesBefore[linesBefore.length - 1].length + 1;

    onCursorChange({ line, column, offset: pos });
  }, [value, onCursorChange]);

  // Syntax highlight the JSON text
  const highlightedLines = useMemo(() => {
    return lines.map((line, idx) => {
      const lineNum = idx + 1;
      const isErrorLine = parseError?.line === lineNum;

      return (
        <div
          key={idx}
          className={`mjr-code__line ${isErrorLine ? 'mjr-code__line--error' : ''}`}
        >
          {lineNumbers && (
            <span className="mjr-code__line-number" aria-hidden="true">
              {lineNum}
            </span>
          )}
          <span className="mjr-code__line-content">
            {highlightJsonLine(line)}
          </span>
        </div>
      );
    });
  }, [lines, lineNumbers, parseError]);

  return (
    <div className={`mjr-code-editor ${className}`}>
      {/* Highlighted display layer */}
      <div className="mjr-code__display" aria-hidden="true">
        {highlightedLines}
      </div>

      {/* Editable textarea (transparent, on top) */}
      <textarea
        ref={textareaRef}
        className="mjr-code__textarea"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onKeyUp={handleCursorMove}
        onClick={handleCursorMove}
        readOnly={readOnly}
        spellCheck={false}
        autoCapitalize="off"
        autoComplete="off"
        autoCorrect="off"
        aria-label="JSON code editor"
        aria-multiline="true"
        aria-readonly={readOnly}
        data-testid="code-editor-textarea"
      />

      {/* Error tooltip */}
      {parseError && (
        <div
          className="mjr-code__error-tooltip"
          role="alert"
          style={{ top: `${(parseError.line - 1) * 1.5}em` }}
        >
          Line {parseError.line}, Col {parseError.column}: {parseError.message}
        </div>
      )}
    </div>
  );
};

/**
 * Simple JSON syntax highlighter — tokenizes a single line.
 */
function highlightJsonLine(line: string): React.ReactNode[] {
  const tokens: React.ReactNode[] = [];
  let i = 0;
  let key = 0;

  while (i < line.length) {
    const ch = line[i];

    // Whitespace
    if (ch === ' ' || ch === '\t') {
      let ws = '';
      while (i < line.length && (line[i] === ' ' || line[i] === '\t')) {
        ws += line[i];
        i++;
      }
      tokens.push(<span key={key++}>{ws}</span>);
      continue;
    }

    // Strings
    if (ch === '"') {
      let str = '"';
      i++;
      while (i < line.length) {
        if (line[i] === '\\') {
          str += line[i] + (line[i + 1] || '');
          i += 2;
          continue;
        }
        str += line[i];
        if (line[i] === '"') {
          i++;
          break;
        }
        i++;
      }

      // Check if this is a key (followed by colon)
      const rest = line.substring(i).trimStart();
      const isKey = rest.startsWith(':');

      tokens.push(
        <span key={key++} className={isKey ? 'mjr-syn-key' : 'mjr-syn-string'}>
          {str}
        </span>
      );
      continue;
    }

    // Numbers
    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      let num = '';
      while (i < line.length && /[\d.eE+\-]/.test(line[i])) {
        num += line[i];
        i++;
      }
      tokens.push(
        <span key={key++} className="mjr-syn-number">{num}</span>
      );
      continue;
    }

    // Booleans
    if (line.substring(i, i + 4) === 'true') {
      tokens.push(<span key={key++} className="mjr-syn-boolean">true</span>);
      i += 4;
      continue;
    }
    if (line.substring(i, i + 5) === 'false') {
      tokens.push(<span key={key++} className="mjr-syn-boolean">false</span>);
      i += 5;
      continue;
    }

    // Null
    if (line.substring(i, i + 4) === 'null') {
      tokens.push(<span key={key++} className="mjr-syn-null">null</span>);
      i += 4;
      continue;
    }

    // Brackets and structural characters
    if (ch === '{' || ch === '}' || ch === '[' || ch === ']') {
      tokens.push(<span key={key++} className="mjr-syn-bracket">{ch}</span>);
      i++;
      continue;
    }

    // Colon and comma
    tokens.push(<span key={key++} className="mjr-syn-punctuation">{ch}</span>);
    i++;
  }

  return tokens;
}

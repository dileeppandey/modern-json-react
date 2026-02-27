import React from 'react';
import type { ParseError, CursorPosition } from '../../types/editor';
import type { ValidationError } from '../../types/validation';
import type { JsonStats } from '../../core/formatter';

export interface StatusBarProps {
  parseError: ParseError | null;
  validationErrors: ValidationError[];
  cursor: CursorPosition;
  stats: JsonStats | null;
  className?: string;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  parseError,
  validationErrors,
  cursor,
  stats,
  className = '',
}) => {
  const hasErrors = parseError !== null;
  const hasWarnings = validationErrors.length > 0;

  let statusIcon: string;
  let statusText: string;
  let statusClass: string;

  if (hasErrors) {
    statusIcon = '\u2715'; // ✕
    statusText = `Invalid JSON (line ${parseError.line})`;
    statusClass = 'mjr-status--error';
  } else if (hasWarnings) {
    statusIcon = '\u26A0'; // ⚠
    statusText = `${validationErrors.length} validation ${validationErrors.length === 1 ? 'issue' : 'issues'}`;
    statusClass = 'mjr-status--warning';
  } else {
    statusIcon = '\u2713'; // ✓
    statusText = 'Valid JSON';
    statusClass = 'mjr-status--valid';
  }

  return (
    <div
      className={`mjr-status-bar ${statusClass} ${className}`}
      role="status"
      aria-live="polite"
      aria-atomic="true"
    >
      <span className="mjr-status-bar__indicator">
        <span className="mjr-status-bar__icon" aria-hidden="true">
          {statusIcon}
        </span>
        <span className="mjr-status-bar__text">{statusText}</span>
      </span>

      <span className="mjr-status-bar__separator" aria-hidden="true">
        |
      </span>

      <span className="mjr-status-bar__cursor">
        Ln {cursor.line}, Col {cursor.column}
      </span>

      {stats && (
        <>
          <span className="mjr-status-bar__separator" aria-hidden="true">
            |
          </span>
          <span className="mjr-status-bar__stats">
            {stats.properties} {stats.properties === 1 ? 'property' : 'properties'}
            {stats.arrays > 0 && `, ${stats.arrays} ${stats.arrays === 1 ? 'array' : 'arrays'}`}
          </span>
        </>
      )}

      {stats && stats.byteSize > 0 && (
        <>
          <span className="mjr-status-bar__separator" aria-hidden="true">
            |
          </span>
          <span className="mjr-status-bar__size">{formatBytes(stats.byteSize)}</span>
        </>
      )}
    </div>
  );
};

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

import React, { useRef, useEffect, useCallback } from 'react';
import type { SearchMatch } from '../../hooks/useSearch';

export interface SearchBarProps {
  query: string;
  onQueryChange: (query: string) => void;
  matches: SearchMatch[];
  currentMatchIndex: number;
  totalMatches: number;
  onNext: () => void;
  onPrevious: () => void;
  onClose: () => void;
  options: {
    caseSensitive?: boolean;
    useRegex?: boolean;
  };
  onOptionsChange: (opts: { caseSensitive?: boolean; useRegex?: boolean }) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  query,
  onQueryChange,
  currentMatchIndex,
  totalMatches,
  onNext,
  onPrevious,
  onClose,
  options,
  onOptionsChange,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when mounted
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (e.shiftKey) {
          onPrevious();
        } else {
          onNext();
        }
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    },
    [onNext, onPrevious, onClose],
  );

  const matchLabel =
    totalMatches === 0
      ? query
        ? 'No results'
        : ''
      : `${currentMatchIndex + 1} of ${totalMatches}`;

  return (
    <div className="mjr-search" role="search" aria-label="Search in editor">
      <div className="mjr-search__input-group">
        {/* Search icon */}
        <svg
          className="mjr-search__icon"
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>

        <input
          ref={inputRef}
          className="mjr-search__input"
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search..."
          aria-label="Search query"
          spellCheck={false}
          autoComplete="off"
        />

        {/* Match counter */}
        {query && (
          <span className="mjr-search__count" aria-live="polite">
            {matchLabel}
          </span>
        )}
      </div>

      {/* Option toggles */}
      <div className="mjr-search__options">
        <button
          className={`mjr-search__option-btn ${options.caseSensitive ? 'mjr-search__option-btn--active' : ''}`}
          onClick={() => onOptionsChange({ caseSensitive: !options.caseSensitive })}
          aria-pressed={options.caseSensitive}
          title="Match case"
          aria-label="Match case"
        >
          Aa
        </button>
        <button
          className={`mjr-search__option-btn ${options.useRegex ? 'mjr-search__option-btn--active' : ''}`}
          onClick={() => onOptionsChange({ useRegex: !options.useRegex })}
          aria-pressed={options.useRegex}
          title="Use regular expression"
          aria-label="Use regular expression"
        >
          .*
        </button>
      </div>

      {/* Navigation */}
      <div className="mjr-search__nav">
        <button
          className="mjr-search__nav-btn"
          onClick={onPrevious}
          disabled={totalMatches === 0}
          aria-label="Previous match"
          title="Previous match (Shift+Enter)"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="18 15 12 9 6 15" />
          </svg>
        </button>
        <button
          className="mjr-search__nav-btn"
          onClick={onNext}
          disabled={totalMatches === 0}
          aria-label="Next match"
          title="Next match (Enter)"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
      </div>

      {/* Close */}
      <button
        className="mjr-search__close"
        onClick={onClose}
        aria-label="Close search"
        title="Close (Escape)"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
};

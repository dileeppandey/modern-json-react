import { useState, useCallback, useMemo } from 'react';

export interface SearchMatch {
  /** Line number (1-based) */
  line: number;
  /** Column start (0-based) */
  columnStart: number;
  /** Column end (0-based) */
  columnEnd: number;
  /** The matched text */
  matchText: string;
  /** JSONPath if in tree mode */
  path?: string;
}

interface UseSearchOptions {
  caseSensitive?: boolean;
  useRegex?: boolean;
  searchKeys?: boolean;
  searchValues?: boolean;
}

interface UseSearchResult {
  query: string;
  setQuery: (q: string) => void;
  matches: SearchMatch[];
  currentMatchIndex: number;
  totalMatches: number;
  goToNext: () => void;
  goToPrevious: () => void;
  options: UseSearchOptions;
  setOptions: (opts: Partial<UseSearchOptions>) => void;
  isActive: boolean;
  open: () => void;
  close: () => void;
}

/**
 * Hook for managing search state across the editor.
 */
export function useSearch(text: string): UseSearchResult {
  const [query, setQuery] = useState('');
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0);
  const [isActive, setIsActive] = useState(false);
  const [options, setOptionsState] = useState<UseSearchOptions>({
    caseSensitive: false,
    useRegex: false,
    searchKeys: true,
    searchValues: true,
  });

  const matches = useMemo(() => {
    if (!query || !text) return [];

    try {
      const flags = options.caseSensitive ? 'g' : 'gi';
      const pattern = options.useRegex ? query : escapeRegex(query);
      const regex = new RegExp(pattern, flags);

      const results: SearchMatch[] = [];
      const lines = text.split('\n');

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx];
        let match: RegExpExecArray | null;

        // Reset lastIndex for each line
        regex.lastIndex = 0;
        while ((match = regex.exec(line)) !== null) {
          results.push({
            line: lineIdx + 1,
            columnStart: match.index,
            columnEnd: match.index + match[0].length,
            matchText: match[0],
          });
          // Prevent infinite loops on zero-length matches
          if (match.index === regex.lastIndex) regex.lastIndex++;
        }
      }

      return results;
    } catch {
      // Invalid regex
      return [];
    }
  }, [query, text, options.caseSensitive, options.useRegex]);

  const goToNext = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((i) => (i + 1) % matches.length);
  }, [matches.length]);

  const goToPrevious = useCallback(() => {
    if (matches.length === 0) return;
    setCurrentMatchIndex((i) => (i - 1 + matches.length) % matches.length);
  }, [matches.length]);

  const setOptions = useCallback((opts: Partial<UseSearchOptions>) => {
    setOptionsState((prev) => ({ ...prev, ...opts }));
    setCurrentMatchIndex(0);
  }, []);

  const open = useCallback(() => setIsActive(true), []);
  const close = useCallback(() => {
    setIsActive(false);
    setQuery('');
    setCurrentMatchIndex(0);
  }, []);

  return {
    query,
    setQuery: (q: string) => {
      setQuery(q);
      setCurrentMatchIndex(0);
    },
    matches,
    currentMatchIndex,
    totalMatches: matches.length,
    goToNext,
    goToPrevious,
    options,
    setOptions,
    isActive,
    open,
    close,
  };
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

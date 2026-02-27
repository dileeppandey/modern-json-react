import { useState, useCallback, useRef } from 'react';

interface UndoRedoOptions {
  /** Maximum number of history entries */
  maxHistory?: number;
  /** Time window (ms) for grouping consecutive actions */
  groupingInterval?: number;
}

interface UndoRedoState<T> {
  current: T;
  canUndo: boolean;
  canRedo: boolean;
  historyLength: number;
  set: (value: T) => void;
  undo: () => void;
  redo: () => void;
  reset: (value: T) => void;
}

/**
 * A hook providing undo/redo history management with time-based grouping.
 */
export function useUndoRedo<T>(initialValue: T, options: UndoRedoOptions = {}): UndoRedoState<T> {
  const { maxHistory = 100, groupingInterval = 300 } = options;

  // Use refs for the mutable history so we can read/write atomically
  const historyRef = useRef<T[]>([initialValue]);
  const positionRef = useRef(0);
  const lastUpdateTime = useRef<number>(0);

  // State just for triggering re-renders
  const [, forceUpdate] = useState(0);
  const rerender = useCallback(() => forceUpdate((n) => n + 1), []);

  const current = historyRef.current[positionRef.current];

  const set = useCallback(
    (value: T) => {
      const now = Date.now();
      const shouldGroup = now - lastUpdateTime.current < groupingInterval;
      lastUpdateTime.current = now;

      const prev = historyRef.current;
      const pos = positionRef.current;

      let newHistory: T[];
      let newPos: number;

      if (shouldGroup && pos > 0) {
        // Replace the current entry (grouping consecutive fast edits)
        newHistory = [...prev.slice(0, pos), value];
        newPos = pos;
      } else {
        // Add a new entry after current position
        newHistory = [...prev.slice(0, pos + 1), value];
        newPos = pos + 1;
      }

      // Trim to max history
      if (newHistory.length > maxHistory) {
        const trimCount = newHistory.length - maxHistory;
        newHistory = newHistory.slice(trimCount);
        newPos = newPos - trimCount;
      }

      historyRef.current = newHistory;
      positionRef.current = Math.max(0, newPos);
      rerender();
    },
    [maxHistory, groupingInterval, rerender],
  );

  const undo = useCallback(() => {
    if (positionRef.current > 0) {
      positionRef.current -= 1;
      rerender();
    }
  }, [rerender]);

  const redo = useCallback(() => {
    if (positionRef.current < historyRef.current.length - 1) {
      positionRef.current += 1;
      rerender();
    }
  }, [rerender]);

  const reset = useCallback(
    (value: T) => {
      historyRef.current = [value];
      positionRef.current = 0;
      lastUpdateTime.current = 0;
      rerender();
    },
    [rerender],
  );

  return {
    current,
    canUndo: positionRef.current > 0,
    canRedo: positionRef.current < historyRef.current.length - 1,
    historyLength: historyRef.current.length,
    set,
    undo,
    redo,
    reset,
  };
}

import { useState, useEffect, useCallback, type RefObject } from 'react';

/**
 * Observes the width of a container element using ResizeObserver.
 * Returns the current width so components can adapt their layout
 * based on actual available space (container queries approach).
 */
export function useContainerWidth(ref: RefObject<HTMLElement | null>): number {
  const [width, setWidth] = useState(0);

  const updateWidth = useCallback(() => {
    if (ref.current) {
      setWidth(ref.current.clientWidth);
    }
  }, [ref]);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    updateWidth();

    if (typeof ResizeObserver !== 'undefined') {
      const observer = new ResizeObserver(() => updateWidth());
      observer.observe(el);
      return () => observer.disconnect();
    }

    // Fallback for older browsers
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, [ref, updateWidth]);

  return width;
}

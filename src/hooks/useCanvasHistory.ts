import { useCallback, useState } from 'react';

interface HistoryStack<T> {
  past: T[];
  present: T;
  future: T[];
}

export function useCanvasHistory<T>(initialState: T, maxEntries = 35) {
  const [stack, setStack] = useState<HistoryStack<T>>({
    past: [],
    present: initialState,
    future: [],
  });

  const pushState = useCallback(
    (nextState: T | ((prev: T) => T)) => {
      setStack((curr) => {
        const resolved =
          typeof nextState === 'function'
            ? (nextState as (prev: T) => T)(curr.present)
            : nextState;
        if (JSON.stringify(resolved) === JSON.stringify(curr.present)) {
          return curr;
        }
        const nextPast = [...curr.past, curr.present].slice(-maxEntries);
        return {
          past: nextPast,
          present: resolved,
          future: [],
        };
      });
    },
    [maxEntries]
  );

  /** Updates present without pushing an undo step (useful during continuous slider drags) */
  const replacePresent = useCallback((nextState: T | ((prev: T) => T)) => {
    setStack((curr) => ({
      ...curr,
      present:
        typeof nextState === 'function'
          ? (nextState as (prev: T) => T)(curr.present)
          : nextState,
    }));
  }, []);

  const undo = useCallback(() => {
    setStack((curr) => {
      if (curr.past.length === 0) return curr;
      const previous = curr.past[curr.past.length - 1];
      return {
        past: curr.past.slice(0, -1),
        present: previous,
        future: [curr.present, ...curr.future].slice(0, maxEntries),
      };
    });
  }, [maxEntries]);

  const redo = useCallback(() => {
    setStack((curr) => {
      if (curr.future.length === 0) return curr;
      const next = curr.future[0];
      return {
        past: [...curr.past, curr.present].slice(-maxEntries),
        present: next,
        future: curr.future.slice(1),
      };
    });
  }, [maxEntries]);

  const resetHistory = useCallback((freshState: T) => {
    setStack({
      past: [],
      present: freshState,
      future: [],
    });
  }, []);

  return {
    state: stack.present,
    canUndo: stack.past.length > 0,
    canRedo: stack.future.length > 0,
    pushState,
    replacePresent,
    undo,
    redo,
    resetHistory,
  };
}

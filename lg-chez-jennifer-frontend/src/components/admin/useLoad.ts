"use client";

import { useCallback, useEffect, useState } from "react";

/** Charge une ressource de l'API admin ; `reload()` la relit. */
export function useLoad<T>(load: () => Promise<T>, key: string = "") {
  const [state, setState] = useState<{ data?: T; error?: string; key?: string; at: number }>({ at: 0 });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let live = true;
    load().then(
      (data) => live && setState({ data, key, at: Date.now() }),
      (err: Error) => live && setState((s) => ({ ...s, error: err.message, key, at: Date.now() })),
    );
    return () => {
      live = false;
    };
    // `load` est recréé à chaque rendu : `key` décrit ce qui doit déclencher un rechargement
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, tick]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  /** `at` : heure du dernier chargement, sert de « maintenant » stable au rendu. */
  return { data: state.data, error: state.error, at: state.at, loading: state.key !== key || (!state.data && !state.error), reload };
}

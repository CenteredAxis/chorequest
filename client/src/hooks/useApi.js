import { useState, useEffect, useCallback } from 'react';

// Simple data fetching hook with loading/error/refetch
export function useApi(fetchFn, deps = []) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => { load(); }, [load]);

  return { data, loading, error, refetch: load };
}

// Poll an API endpoint every intervalMs
export function usePolling(fetchFn, intervalMs, deps = []) {
  const { data, loading, error, refetch } = useApi(fetchFn, deps);

  useEffect(() => {
    if (!intervalMs) return;
    const id = setInterval(refetch, intervalMs);
    return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refetch, intervalMs]);

  return { data, loading, error, refetch };
}

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UseApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: any) => void;
}

/**
 * Custom hook for making API calls with loading and error states
 * 
 * @example
 * const { execute, loading, error } = useApi(LeadsAPI.getAll);
 * 
 * const fetchLeads = async () => {
 *   const data = await execute();
 *   console.log(data);
 * };
 */
export function useApi<T extends (...args: any[]) => Promise<any>>(
  apiFunction: T,
  options?: UseApiOptions
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { logout } = useAuth();

  const execute = useCallback(
    async (...args: Parameters<T>): Promise<Awaited<ReturnType<T>> | null> => {
      setLoading(true);
      setError(null);

      try {
        const result = await apiFunction(...args);
        options?.onSuccess?.(result);
        return result;
      } catch (err: any) {
        // Handle 401 - Unauthorized (token expired or invalid)
        if (err.status === 401 || err.statusCode === 401) {
          logout();
          return null;
        }

        const errorMessage = err.message || err.body?.message || 'An error occurred';
        setError(errorMessage);
        options?.onError?.(err);
        return null;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction, options, logout]
  );

  const reset = useCallback(() => {
    setError(null);
    setLoading(false);
  }, []);

  return { execute, loading, error, reset };
}

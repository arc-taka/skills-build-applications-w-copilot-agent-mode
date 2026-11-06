import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type ApiState<T> =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'success'; data: T };

export function useApiData<T>(path: string) {
  const [state, setState] = useState<ApiState<T>>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    getJson<T>(path).then(
      (data) => {
        if (active) setState({ status: 'success', data });
      },
      (error: unknown) => {
        if (active) {
          setState({
            status: 'error',
            message: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      },
    );
    return () => {
      active = false;
    };
  }, [path]);

  return state;
}

export function ApiStatus({ state, label }: { state: ApiState<unknown>; label: string }) {
  if (state.status === 'loading') return <p role="status">Loading {label}...</p>;
  if (state.status === 'error') return <p role="alert">Unable to load {label}: {state.message}</p>;
  return null;
}

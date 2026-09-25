import { useState, useCallback, useEffect } from 'react';
import { clearLegacyToken, fetchCurrentUser, logout as doLogout, onUnauthorized } from '../lib/auth';

// status: 'loading' | 'authenticated' | 'unauthenticated'
export function useAuth() {
  const [state, setState] = useState({ status: 'loading', user: null, error: null });

  useEffect(() => {
    clearLegacyToken();
    let cancelled = false;
    fetchCurrentUser()
      .then((user) => {
        if (!cancelled) setState({ status: user ? 'authenticated' : 'unauthenticated', user, error: null });
      })
      .catch(() => {
        if (!cancelled) setState({ status: 'unauthenticated', user: null, error: 'server_error' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Any API call answering 401 (expired or revoked session) drops back to the login screen.
  useEffect(() => onUnauthorized(() => setState({ status: 'unauthenticated', user: null, error: null })), []);

  const logout = useCallback(async () => {
    try {
      await doLogout();
    } finally {
      setState({ status: 'unauthenticated', user: null, error: null });
    }
  }, []);

  return { ...state, logout };
}

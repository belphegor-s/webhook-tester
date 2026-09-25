import { useState, useCallback } from 'react';
import { authFetch } from '../lib/auth';

const API_BASE = '/api';

const readError = async (response, fallback) => {
  const body = await response.json().catch(() => null);
  return new Error(body?.error || fallback);
};

export function useApiKeys() {
  const [keys, setKeys] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchKeys = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE}/keys`);
      if (!response.ok) throw await readError(response, 'Failed to load API keys');
      const data = await response.json();
      setKeys(data?.data ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  // Resolves with the created key including its one-time plaintext `key`.
  const createKey = useCallback(async (name) => {
    const response = await authFetch(`${API_BASE}/keys`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    if (!response.ok) throw await readError(response, 'Failed to create API key');

    const created = await response.json();
    const { key: _plaintext, ...row } = created;
    setKeys((prev) => [row, ...prev]);
    return created;
  }, []);

  const revokeKey = useCallback(async (id) => {
    const response = await authFetch(`${API_BASE}/keys/${id}`, { method: 'DELETE' });
    if (!response.ok) throw await readError(response, 'Failed to revoke API key');
    setKeys((prev) => prev.filter((k) => k.id !== id));
  }, []);

  return { keys, loading, fetchKeys, createKey, revokeKey };
}

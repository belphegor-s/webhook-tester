import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../lib/auth';

const API_BASE = '/api';

export function useWebhooks() {
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(10);

  const fetchWebhooks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE}/webhooks?limit=${limit}&offset=${page * limit}`);
      const data = await response.json();
      setWebhooks(data?.data ?? []);
      setTotalPages(data?.totalPages ?? 0);
    } catch (error) {
      console.error('Failed to fetch webhooks:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  const createWebhook = async (formData) => {
    try {
      const response = await authFetch(`${API_BASE}/webhooks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error?.error || 'Failed to create webhook');
      }

      await fetchWebhooks();
      return await response.json();
    } catch (error) {
      console.error('Failed to create webhook:', error);
      throw error;
    }
  };

  const deleteWebhook = async (id) => {
    try {
      const response = await authFetch(`${API_BASE}/webhooks/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete webhook');
      }

      await fetchWebhooks();
    } catch (error) {
      console.error('Failed to delete webhook:', error);
      throw error;
    }
  };

  // Optimistically flips is_active, rolling back if the API rejects the change.
  const setWebhookActive = async (id, isActive) => {
    const apply = (value) => setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, is_active: value } : w)));
    apply(isActive ? 1 : 0);

    try {
      const response = await authFetch(`${API_BASE}/webhooks/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: isActive }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.error || 'Failed to update webhook');
      }

      const updated = await response.json();
      setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
      return updated;
    } catch (error) {
      apply(isActive ? 0 : 1);
      console.error('Failed to update webhook:', error);
      throw error;
    }
  };

  // Updates name and/or description.
  const updateWebhook = async (id, fields) => {
    const response = await authFetch(`${API_BASE}/webhooks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fields),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => null);
      throw new Error(error?.error || 'Failed to update webhook');
    }

    const updated = await response.json();
    setWebhooks((prev) => prev.map((w) => (w.id === id ? { ...w, ...updated } : w)));
    return updated;
  };

  useEffect(() => {
    fetchWebhooks();
  }, [fetchWebhooks]);

  return {
    webhooks,
    loading,
    totalPages,
    page,
    setPage,
    fetchWebhooks,
    createWebhook,
    deleteWebhook,
    setWebhookActive,
    updateWebhook,
  };
}

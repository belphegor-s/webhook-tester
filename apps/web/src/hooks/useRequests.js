import { useState, useEffect, useCallback, useRef } from 'react';
import { authFetch } from '../lib/auth';

const API_BASE = '/api';

// `poll` refreshes page one every 5s; turned off while the realtime stream is live.
export function useRequests(webhookEndpoint, { poll = true } = {}) {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [limit] = useState(20);

  const pollingInterval = useRef(null);

  const fetchRequests = useCallback(async (showLoader = true) => {
    if (!webhookEndpoint) return;
    if (showLoader) setLoading(true);

    try {
      const response = await authFetch(
        `${API_BASE}/webhooks/${webhookEndpoint}/requests?limit=${limit}&offset=${page * limit}`
      );
      const data = await response.json();
      setRequests(data?.data ?? []);
      setTotalPages(data?.totalPages ?? 0);
    } catch (error) {
      console.error('Failed to fetch requests:', error);
      throw error;
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [webhookEndpoint, page, limit]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  useEffect(() => {
    if (!webhookEndpoint || page !== 0 || !poll) {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
      return;
    }

    pollingInterval.current = setInterval(() => {
      fetchRequests(false);
    }, 5000);

    return () => {
      if (pollingInterval.current) clearInterval(pollingInterval.current);
    };
  }, [webhookEndpoint, page, poll, fetchRequests]);

  return {
    requests,
    loading,
    totalPages,
    page,
    setPage,
    fetchRequests,
  };
}

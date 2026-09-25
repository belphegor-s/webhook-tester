import { useState, useEffect, useCallback } from 'react';
import { authFetch } from '../lib/auth';

const API_BASE = '/api/admin';
const USERS_PER_PAGE = 20;

const getJson = async (url, fallback) => {
  const response = await authFetch(url);
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || fallback);
  }
  return response.json();
};

// Platform totals and the 14-day request series.
export function useAdminOverview() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOverview = useCallback(async () => {
    setLoading(true);
    try {
      setOverview(await getJson(`${API_BASE}/overview`, 'Failed to load overview'));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOverview();
  }, [fetchOverview]);

  return { overview, loading, error, refresh: fetchOverview };
}

// Paginated user list with a server-side search on login/email.
export function useAdminUsers(search) {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // A new search starts from the first page.
  useEffect(() => setPage(0), [search]);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: USERS_PER_PAGE, offset: page * USERS_PER_PAGE });
      if (search) params.set('q', search);
      const data = await getJson(`${API_BASE}/users?${params}`, 'Failed to load users');
      setUsers(data?.data ?? []);
      setTotal(data?.total ?? 0);
      setTotalPages(data?.totalPages ?? 0);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return { users, total, totalPages, page, setPage, loading, error, refresh: fetchUsers };
}

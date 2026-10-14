'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { SessionSummary, PaginatedSessions } from '@/types';

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function SessionsPage() {
  const [data, setData] = useState<PaginatedSessions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  const fetchSessions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await api.getSessions(page, 20, search || undefined);
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load sessions');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sessions</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data ? `${data.total} total sessions` : 'Loading...'}
          </p>
        </div>
        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Search by session ID..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-300 transition-all"
          />
          <button
            type="submit"
            className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 px-3 py-2 rounded-lg transition-colors"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => {
                setSearchInput('');
                setSearch('');
                setPage(1);
              }}
              className="text-sm text-gray-400 hover:text-gray-600"
            >
              Clear
            </button>
          )}
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button onClick={fetchSessions} className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && !error && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="px-4 py-4 border-b border-gray-50 animate-pulse flex items-center gap-4">
              <div className="h-4 bg-gray-100 rounded w-32"></div>
              <div className="h-4 bg-gray-100 rounded w-12 ml-auto"></div>
              <div className="h-4 bg-gray-100 rounded w-12"></div>
              <div className="h-4 bg-gray-100 rounded w-12"></div>
              <div className="h-4 bg-gray-100 rounded w-24"></div>
            </div>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && data && data.sessions.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#868e96" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">
            {search ? 'No matching sessions' : 'No sessions yet'}
          </h3>
          <p className="text-sm text-gray-500">
            {search
              ? `No sessions found matching "${search}"`
              : 'Visit the demo page to start generating events.'}
          </p>
        </div>
      )}

      {/* Table */}
      {!loading && !error && data && data.sessions.length > 0 && (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/50">
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Session ID</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Total Events</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Page Views</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Clicks</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">First Event</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session: SessionSummary) => (
                  <tr
                    key={session.session_id}
                    className="border-b border-gray-50 last:border-0 hover:bg-blue-50/30 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/sessions/${session.session_id}`}
                        className="font-mono text-xs text-brand-600 hover:text-brand-700 hover:underline"
                        title={session.session_id}
                      >
                        {session.session_id.length > 20
                          ? `${session.session_id.slice(0, 8)}...${session.session_id.slice(-4)}`
                          : session.session_id}
                      </Link>
                    </td>
                    <td className="text-right px-4 py-3 text-gray-700 font-medium">
                      {session.total_events}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-500">{session.page_views}</td>
                    <td className="text-right px-4 py-3 text-gray-500">{session.clicks}</td>
                    <td className="text-right px-4 py-3 text-gray-400 text-xs">
                      {formatDate(session.first_event_at)}
                    </td>
                    <td className="text-right px-4 py-3 text-gray-400 text-xs">
                      {formatDate(session.last_event_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">
                Page {data.page} of {data.totalPages}
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= data.totalPages}
                  className="text-sm font-medium text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed px-3 py-1.5 rounded-lg transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

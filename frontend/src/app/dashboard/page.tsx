'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { OverviewMetrics, SessionSummary } from '@/types';

function MetricCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: number | null;
  icon: React.ReactNode;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      <div className="text-2xl font-semibold text-gray-900">
        {value !== null ? value.toLocaleString() : '—'}
      </div>
    </div>
  );
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        setError(null);
        const [metricsData, sessionsData] = await Promise.all([
          api.getOverview(),
          api.getSessions(1, 5),
        ]);
        setMetrics(metricsData);
        setSessions(sessionsData.sessions);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
          <p className="text-sm text-gray-500 mt-1">Loading analytics data...</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
              <div className="h-4 bg-gray-100 rounded w-20 mb-4"></div>
              <div className="h-8 bg-gray-100 rounded w-16"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <div className="bg-white rounded-xl border border-red-200 p-8 text-center">
          <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-3">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f03e3e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="m15 9-6 6" /><path d="m9 9 6 6" />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-1">Failed to load data</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="text-sm font-medium text-brand-600 hover:text-brand-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Overview</h1>
        <p className="text-sm text-gray-500 mt-1">Real-time analytics summary</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          label="Total Sessions"
          value={metrics?.total_sessions ?? null}
          color="bg-blue-50"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#4c6ef5" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /></svg>}
        />
        <MetricCard
          label="Total Events"
          value={metrics?.total_events ?? null}
          color="bg-purple-50"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#7950f2" strokeWidth="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg>}
        />
        <MetricCard
          label="Page Views"
          value={metrics?.page_views ?? null}
          color="bg-green-50"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#37b24d" strokeWidth="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>}
        />
        <MetricCard
          label="Clicks"
          value={metrics?.clicks ?? null}
          color="bg-orange-50"
          icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59f00" strokeWidth="2"><circle cx="12" cy="12" r="1" /><path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" /></svg>}
        />
      </div>

      {/* Recent Sessions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-gray-900">Recent Sessions</h2>
          <Link
            href="/dashboard/sessions"
            className="text-sm text-brand-600 hover:text-brand-700 font-medium"
          >
            View all →
          </Link>
        </div>
        {sessions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#868e96" strokeWidth="1.5">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-1">No sessions yet</h3>
            <p className="text-sm text-gray-500 mb-4">
              Visit the demo page to generate analytics events.
            </p>
            <Link
              href="/demo"
              className="text-sm font-medium text-brand-600 hover:text-brand-700"
            >
              Open Demo →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100">
                  <th className="text-left font-medium text-gray-500 px-4 py-3">Session ID</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Events</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Views</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Clicks</th>
                  <th className="text-right font-medium text-gray-500 px-4 py-3">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session) => (
                  <tr
                    key={session.session_id}
                    className="border-b border-gray-50 last:border-0 hover:bg-gray-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/sessions/${session.session_id}`}
                        className="font-mono text-xs text-brand-600 hover:text-brand-700"
                        title={session.session_id}
                      >
                        {session.session_id.slice(0, 8)}...
                      </Link>
                    </td>
                    <td className="text-right px-4 py-3 text-gray-700">{session.total_events}</td>
                    <td className="text-right px-4 py-3 text-gray-700">{session.page_views}</td>
                    <td className="text-right px-4 py-3 text-gray-700">{session.clicks}</td>
                    <td className="text-right px-4 py-3 text-gray-500 text-xs">
                      {formatDate(session.last_event_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

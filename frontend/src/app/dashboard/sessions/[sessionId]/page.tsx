'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { EventData } from '@/types';

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

function EventIcon({ type }: { type: string }) {
  if (type === 'page_view') {
    return (
      <div className="w-8 h-8 rounded-full bg-blue-50 border-2 border-blue-200 flex items-center justify-center flex-shrink-0">
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4c6ef5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </div>
    );
  }
  return (
    <div className="w-8 h-8 rounded-full bg-orange-50 border-2 border-orange-200 flex items-center justify-center flex-shrink-0">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f59f00" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="1" />
        <path d="M12 2v4m0 12v4M4.93 4.93l2.83 2.83m8.48 8.48 2.83 2.83M2 12h4m12 0h4M4.93 19.07l2.83-2.83m8.48-8.48 2.83-2.83" />
      </svg>
    </div>
  );
}

export default function SessionDetailPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [events, setEvents] = useState<EventData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchEvents() {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getSessionEvents(sessionId);
        setEvents(data.events);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load session events');
      } finally {
        setLoading(false);
      }
    }
    if (sessionId) fetchEvents();
  }, [sessionId]);

  const pageViews = events.filter((e) => e.event_type === 'page_view').length;
  const clicks = events.filter((e) => e.event_type === 'click').length;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/sessions" className="hover:text-gray-900 transition-colors">
          Sessions
        </Link>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m9 18 6-6-6-6" />
        </svg>
        <span className="font-mono text-xs text-gray-700" title={sessionId}>
          {sessionId.length > 20 ? `${sessionId.slice(0, 12)}...` : sessionId}
        </span>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Session Journey</h1>
        <p className="text-sm text-gray-500 mt-1 font-mono">{sessionId}</p>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-white rounded-xl border border-red-200 p-6 text-center">
          <p className="text-sm text-red-600 mb-2">{error}</p>
          <button onClick={() => window.location.reload()} className="text-sm font-medium text-brand-600">
            Retry
          </button>
        </div>
      )}

      {/* Loading */}
      {loading && !error && (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex gap-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-100"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-32"></div>
                <div className="h-3 bg-gray-100 rounded w-48"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && !error && events.length === 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <h3 className="text-sm font-medium text-gray-900 mb-1">No events found</h3>
          <p className="text-sm text-gray-500">This session has no recorded events.</p>
        </div>
      )}

      {/* Content */}
      {!loading && !error && events.length > 0 && (
        <>
          {/* Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Total Events</p>
              <p className="text-lg font-semibold text-gray-900">{events.length}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Page Views</p>
              <p className="text-lg font-semibold text-blue-600">{pageViews}</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4">
              <p className="text-xs text-gray-500 mb-1">Clicks</p>
              <p className="text-lg font-semibold text-orange-500">{clicks}</p>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-900 mb-6">Event Timeline</h2>
            <div className="space-y-0">
              {events.map((event, index) => (
                <div key={event._id || index} className="flex gap-4 relative">
                  {/* Timeline Line */}
                  {index < events.length - 1 && (
                    <div className="absolute left-4 top-8 w-px h-full bg-gray-100" style={{ transform: 'translateX(-50%)' }}></div>
                  )}

                  <EventIcon type={event.event_type} />

                  <div className="flex-1 pb-6">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          event.event_type === 'page_view'
                            ? 'bg-blue-50 text-blue-700'
                            : 'bg-orange-50 text-orange-700'
                        }`}>
                          {event.event_type === 'page_view' ? 'Page View' : 'Click'}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatTimestamp(event.timestamp)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        <span className="text-gray-400">URL:</span>{' '}
                        <span className="font-mono">{event.page_url}</span>
                      </p>
                      {event.coordinates && (
                        <p className="text-xs text-gray-500">
                          <span className="text-gray-400">Coordinates:</span>{' '}
                          <span className="font-mono">
                            ({event.coordinates.x}, {event.coordinates.y})
                          </span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

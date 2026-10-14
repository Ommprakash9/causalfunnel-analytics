'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
                <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
                <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">CausalFunnel</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/demo" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">
              Demo
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors">
              Dashboard
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-6xl mx-auto px-6">
        <div className="pt-24 pb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-100 mb-6">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500"></div>
            <span className="text-xs font-medium text-brand-700">Analytics Platform</span>
          </div>
          <h1 className="text-5xl font-bold text-gray-900 tracking-tight leading-tight max-w-2xl">
            Understand how users interact with your website
          </h1>
          <p className="mt-5 text-lg text-gray-500 max-w-xl leading-relaxed">
            Track page views, analyze click patterns, and visualize user journeys — all with a lightweight JavaScript SDK.
          </p>
          <div className="mt-8 flex items-center gap-4">
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-medium text-white bg-gray-900 hover:bg-gray-800 px-5 py-2.5 rounded-lg transition-colors">
              Open Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14" /><path d="m12 5 7 7-7 7" />
              </svg>
            </Link>
            <Link href="/demo" className="inline-flex items-center gap-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 hover:border-gray-300 hover:bg-gray-50 px-5 py-2.5 rounded-lg transition-colors">
              Try Demo
            </Link>
          </div>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-24">
          <div className="p-6 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4c6ef5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Page View Tracking</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Automatically capture every page view with session context, URL, and precise timestamps.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#37b24d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Click Analytics</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Record every click with viewport coordinates. Visualize patterns using interactive heatmaps.
            </p>
          </div>
          <div className="p-6 rounded-xl border border-gray-100 hover:border-gray-200 transition-colors">
            <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center mb-4">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#7950f2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect width="18" height="18" x="3" y="3" rx="2" />
                <path d="M3 9h18" /><path d="M9 21V9" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">Session Journeys</h3>
            <p className="text-sm text-gray-500 leading-relaxed">
              Follow individual user sessions through a chronological event timeline.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

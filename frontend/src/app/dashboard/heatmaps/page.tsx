'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import type { HeatmapClick } from '@/types';

export default function HeatmapsPage() {
  const [pages, setPages] = useState<string[]>([]);
  const [selectedPage, setSelectedPage] = useState<string>('');
  const [clicks, setClicks] = useState<HeatmapClick[]>([]);
  const [totalClicks, setTotalClicks] = useState<number>(0);
  const [loadingPages, setLoadingPages] = useState<boolean>(true);
  const [loadingHeatmap, setLoadingHeatmap] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [heatmapError, setHeatmapError] = useState<string | null>(null);
  const [pointRadius, setPointRadius] = useState<number>(24);
  const [showCoordinatesTable, setShowCoordinatesTable] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Fetch distinct pages
  useEffect(() => {
    async function fetchPages() {
      try {
        setLoadingPages(true);
        setError(null);
        const data = await api.getPages();
        setPages(data.pages);
        if (data.pages.length > 0) {
          setSelectedPage(data.pages[0]);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch tracked pages');
      } finally {
        setLoadingPages(false);
      }
    }
    fetchPages();
  }, []);

  // Fetch heatmap data when selectedPage changes
  useEffect(() => {
    if (!selectedPage) {
      setClicks([]);
      setTotalClicks(0);
      return;
    }

    async function fetchHeatmap() {
      try {
        setLoadingHeatmap(true);
        setHeatmapError(null);
        const data = await api.getHeatmap(selectedPage, 5000);
        setClicks(data.clicks || []);
        setTotalClicks(data.total || 0);
      } catch (err) {
        setHeatmapError(err instanceof Error ? err.message : 'Failed to load click heatmap data');
        setClicks([]);
        setTotalClicks(0);
      } finally {
        setLoadingHeatmap(false);
      }
    }

    fetchHeatmap();
  }, [selectedPage]);

  // Render heatmap dots on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Viewport canvas dimensions
    const width = canvas.width;
    const height = canvas.height;

    // Clear background
    ctx.clearRect(0, 0, width, height);

    // Draw background subtle grid lines
    ctx.strokeStyle = '#f1f3f5';
    ctx.lineWidth = 1;
    const gridSize = 40;
    for (let x = 0; x <= width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y <= height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (clicks.length === 0) return;

    // First pass: Draw radial gradient glow for each click point
    clicks.forEach((click) => {
      const { x, y } = click.coordinates;
      if (x < 0 || y < 0 || x > width || y > height) return;

      const gradient = ctx.createRadialGradient(x, y, 2, x, y, pointRadius);
      gradient.addColorStop(0, 'rgba(239, 68, 68, 0.45)');   // Red center
      gradient.addColorStop(0.4, 'rgba(249, 115, 22, 0.25)'); // Orange
      gradient.addColorStop(0.8, 'rgba(234, 179, 8, 0.12)');  // Yellow
      gradient.addColorStop(1, 'rgba(234, 179, 8, 0)');

      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(x, y, pointRadius, 0, Math.PI * 2);
      ctx.fill();
    });

    // Second pass: Draw crisp focal dot
    clicks.forEach((click) => {
      const { x, y } = click.coordinates;
      if (x < 0 || y < 0 || x > width || y > height) return;

      ctx.fillStyle = '#dc2626';
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [clicks, pointRadius]);

  // Coordinate boundaries calculation
  const maxCoords = clicks.reduce(
    (acc, cur) => ({
      x: Math.max(acc.x, cur.coordinates?.x || 0),
      y: Math.max(acc.y, cur.coordinates?.y || 0),
    }),
    { x: 0, y: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Click Heatmaps</h1>
        <p className="text-sm text-gray-500 mt-1">
          Visual coordinate density of user click interactions recorded in MongoDB
        </p>
      </div>

      {/* Page Selector & Controls Bar */}
      <div className="bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-col sm:flex-row sm:items-center gap-3">
            <label htmlFor="page-select" className="text-xs font-semibold uppercase text-gray-500 whitespace-nowrap">
              Tracked Page:
            </label>
            {loadingPages ? (
              <div className="h-9 w-64 bg-gray-100 rounded animate-pulse"></div>
            ) : pages.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No tracked pages yet. Visit the demo page first.</p>
            ) : (
              <select
                id="page-select"
                value={selectedPage}
                onChange={(e) => setSelectedPage(e.target.value)}
                className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-800 font-mono focus:outline-none focus:ring-2 focus:ring-brand-100 focus:border-brand-400 max-w-md w-full"
              >
                {pages.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Radius:</span>
              <input
                type="range"
                min="12"
                max="48"
                value={pointRadius}
                onChange={(e) => setPointRadius(Number(e.target.value))}
                className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-brand-600"
              />
              <span className="text-xs text-gray-500 font-mono w-6">{pointRadius}px</span>
            </div>

            <button
              onClick={() => setShowCoordinatesTable(!showCoordinatesTable)}
              className="text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors"
            >
              {showCoordinatesTable ? 'Hide Coordinates' : 'View Coordinates'}
            </button>
          </div>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Heatmap Error Banner */}
      {heatmapError && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          {heatmapError}
        </div>
      )}

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Total Recorded Clicks</p>
          <p className="text-xl font-bold text-gray-900">{totalClicks.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Active Visualized Points</p>
          <p className="text-xl font-bold text-brand-600">{clicks.length.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-xs text-gray-500 mb-1">Max Coordinate Extent</p>
          <p className="text-xl font-bold font-mono text-gray-700">
            {clicks.length > 0 ? `(${maxCoords.x}px, ${maxCoords.y}px)` : '—'}
          </p>
        </div>
      </div>

      {/* Heatmap Visual Canvas */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-900">Scatter Density Canvas</h2>
            <span className="text-xs text-gray-400 font-mono">(1200 x 800 viewport grid)</span>
          </div>

          <div className="flex items-center gap-3 text-xs text-gray-500">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block"></span>
              <span>High Density</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block"></span>
              <span>Moderate</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-200 inline-block"></span>
              <span>Low</span>
            </div>
          </div>
        </div>

        {loadingHeatmap ? (
          <div className="w-full h-[600px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin mb-3"></div>
            <p className="text-sm text-gray-500">Loading click data...</p>
          </div>
        ) : clicks.length === 0 ? (
          <div className="w-full h-[450px] flex flex-col items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200 p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 8v4" />
                <path d="M12 16h.01" />
              </svg>
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No click events for this page</h3>
            <p className="text-xs text-gray-500 max-w-sm mb-4">
              Clicks will appear here once visitors interact with this webpage. Click below to generate sample clicks on the demo page.
            </p>
            <a
              href="/demo"
              className="text-xs font-medium text-white bg-brand-600 hover:bg-brand-700 px-4 py-2 rounded-lg transition-colors"
            >
              Open Demo Page
            </a>
          </div>
        ) : (
          <div className="overflow-x-auto border border-gray-200 rounded-lg bg-white p-2">
            <canvas
              ref={canvasRef}
              width={1200}
              height={800}
              className="border border-gray-100 rounded max-w-full h-auto bg-slate-50/60"
            />
          </div>
        )}
      </div>

      {/* Raw Coordinates Table View */}
      {showCoordinatesTable && clicks.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Raw Click Data Points</h3>
          <div className="max-h-72 overflow-y-auto border border-gray-100 rounded-lg">
            <table className="w-full text-xs font-mono">
              <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                <tr>
                  <th className="text-left px-3 py-2 text-gray-500">Session ID</th>
                  <th className="text-right px-3 py-2 text-gray-500">X Coordinate</th>
                  <th className="text-right px-3 py-2 text-gray-500">Y Coordinate</th>
                  <th className="text-right px-3 py-2 text-gray-500">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {clicks.slice(0, 100).map((c, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-3 py-1.5 text-gray-700">{c.session_id}</td>
                    <td className="px-3 py-1.5 text-right text-brand-600 font-semibold">{c.coordinates.x}px</td>
                    <td className="px-3 py-1.5 text-right text-brand-600 font-semibold">{c.coordinates.y}px</td>
                    <td className="px-3 py-1.5 text-right text-gray-400">
                      {new Date(c.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {clicks.length > 100 && (
            <p className="text-xs text-gray-400 mt-2 text-right">
              Showing first 100 of {clicks.length} data points
            </p>
          )}
        </div>
      )}
    </div>
  );
}

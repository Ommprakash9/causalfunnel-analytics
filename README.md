# CausalFunnel User Analytics

A lightweight, production-grade analytics platform that captures user interactions (page views and mouse clicks with viewport-relative coordinates) via a standalone JavaScript SDK, stores events in MongoDB, and presents real-time behavioral insights through an analytics dashboard.

---

## 1. Project Overview

CausalFunnel User Analytics is built for performance and zero host-application interference. The tracking SDK operates independently of any UI framework, transmitting interaction telemetry to a REST backend backed by MongoDB. The analytics dashboard derives real-time metrics, chronological user session journeys, and visual scatter heatmaps using native MongoDB aggregation pipelines.

---

## 2. Feature List

- **Standalone Tracking SDK**: Vanilla JavaScript IIFE (~2 KB minified), zero runtime dependencies, non-blocking asynchronous transmission with `navigator.sendBeacon` and `fetch` fallbacks.
- **Session Persistence**: Automatic UUID generation with `crypto.randomUUID()` and `localStorage` persistence across page navigations.
- **Page View & Click Tracking**: Automated initial `page_view` capture and document-wide `click` event interception with exact `clientX` / `clientY` viewport coordinates.
- **Privacy & Safety Shield**: Password input fields and sensitive form elements are ignored. Network failures fail silently without crashing the host site. Duplicate tracker initialization is prevented via global guards.
- **MongoDB Aggregation**: Session summaries (first/last activity, event counts, page views, clicks) are derived from raw event documents.
- **Interactive Dashboard**:
  - **Overview**: Real-time KPI metric cards (Total Sessions, Events, Page Views, Clicks) and recent session activity.
  - **Sessions Explorer**: Searchable, paginated sessions table sorted by most recent activity.
  - **Session Journey Timeline**: Chronological event timeline detailing every action, URL, timestamp, and click coordinate.
  - **Click Heatmap Canvas**: Scatter density canvas with adjustable radius, density indicators, coordinate extent calculation, and raw coordinates inspection table.
- **Realistic E-Commerce Demo**: A full e-commerce storefront (`/demo`) with products, interactive add-to-cart buttons, and a live SDK testing toolbar showing the active session ID.

---

## 3. Technology Stack

- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express 4, TypeScript, Mongoose 8
- **Database**: MongoDB Atlas / MongoDB Community 7.0+
- **Tracker**: Pure Vanilla JavaScript (ES2015+), bundled with esbuild
- **Testing**: Vitest, Supertest, JSDOM, MongoDB Memory Server

---

## 4. Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Browser Client                       │
├─────────────────────────┬──────────────────────────────┤
│     Host / Demo App     │     Standalone Tracker       │
│     (http://.../demo)   │     (tracker.js ~2 KB)       │
└────────────┬────────────┴──────────────┬───────────────┘
             │                           │ (sendBeacon / POST)
             ▼                           ▼
┌────────────────────────────────────────────────────────┐
│              Express.js Backend (Port 5001)            │
│  - /api/events (validation, sanitize)                  │
│  - /api/sessions (aggregation pipeline)                │
│  - /api/sessions/:id/events (chronological journey)    │
│  - /api/heatmap (page-filtered click coordinates)      │
│  - /api/pages (distinct tracked pages)                 │
│  - /api/overview (global KPI stats)                    │
│  - /api/health (database connectivity check)           │
│  - /tracker.js (static SDK script distribution)        │
└────────────────────────────┬───────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│                 MongoDB Event Collection               │
│  - Schema: session_id, event_type, page_url,           │
│            timestamp, coordinates {x, y}               │
│  - Indexes: compound & single field                    │
└────────────────────────────────────────────────────────┘
                             │
                             ▼
┌────────────────────────────────────────────────────────┐
│              Next.js Dashboard (Port 3000)             │
│  - /dashboard (Overview KPIs & Recent Activity)        │
│  - /dashboard/sessions (Paginated Session Table)       │
│  - /dashboard/sessions/[id] (Chronological Journey)    │
│  - /dashboard/heatmaps (Canvas Scatter Plot)           │
└────────────────────────────────────────────────────────┘
```

---

## 5. Repository Structure

```
causalfunnel-analytics/
|-- backend/
|   |-- src/
|   |   |-- config/          # Environment & MongoDB connection management
|   |   |-- controllers/     # Express route handlers
|   |   |-- middleware/      # Error handler & event payload validation
|   |   |-- models/          # Mongoose Event schema with coordinate validation
|   |   |-- routes/          # REST API route declarations
|   |   |-- services/        # Business logic & MongoDB aggregation pipelines
|   |   |-- app.ts           # Express application factory & middleware setup
|   |   |-- server.ts        # Server entry point with graceful shutdown
|   |-- tests/
|   |   |-- api.test.ts      # 26 automated unit & integration tests
|   |-- .env.example
|   |-- package.json
|   |-- tsconfig.json
|
|-- frontend/
|   |-- src/
|   |   |-- app/
|   |   |   |-- page.tsx                # Landing page
|   |   |   |-- layout.tsx              # Root HTML & styling layout
|   |   |   |-- dashboard/
|   |   |   |   |-- layout.tsx          # Dashboard layout with top navigation
|   |   |   |   |-- page.tsx            # KPI Overview & recent sessions
|   |   |   |   |-- sessions/
|   |   |   |   |   |-- page.tsx        # Searchable, paginated sessions table
|   |   |   |   |   |-- [sessionId]/
|   |   |   |   |   |   |-- page.tsx    # Chronological session event journey
|   |   |   |   |-- heatmaps/
|   |   |   |   |   |-- page.tsx        # Canvas click heatmap scatter plot
|   |   |   |-- demo/
|   |   |   |   |-- page.tsx            # Realistic e-commerce storefront testing surface
|   |   |-- lib/
|   |   |   |-- api.ts                  # Typed client API sdk
|   |   |-- types/
|   |   |   |-- index.ts                # TypeScript data interfaces
|   |-- public/
|   |   |-- tracker.js                  # Static mirror of tracking SDK
|   |-- .env.example
|   |-- package.json
|
|-- tracker/
|   |-- src/
|   |   |-- tracker.js       # Standalone tracking SDK source
|   |-- dist/
|   |   |-- tracker.js       # Minified IIFE bundle
|   |-- tests/
|   |   |-- tracker.test.js  # 12 Vitest JSDOM tests
|   |-- build.js             # esbuild configuration
|   |-- package.json
|
|-- package.json             # Root npm workspaces configuration
|-- .gitignore
|-- README.md
```

---

## 6. Prerequisites

- **Node.js**: v18.0.0 or later (v20+ recommended)
- **npm**: v9.0.0 or later
- **MongoDB**: Local MongoDB instance (`mongodb://127.0.0.1:27017`) or a free [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

---

## 7. Environment Variables

### Backend (`backend/.env`):
```env
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://127.0.0.1:27017/causalfunnel_analytics
FRONTEND_URL=http://localhost:3000
```
> **Note on macOS**: Port 5000 is reserved by macOS Control Center for AirPlay Receiver (`AirTunes`). Port `5001` is used by default to prevent port collisions. If deploying to cloud hosting (e.g. Render), set `PORT=5000` or use the platform's assigned `$PORT`.

### Frontend (`frontend/.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:5001/api
NEXT_PUBLIC_TRACKER_URL=http://localhost:5001/tracker.js
```

---

## 8. Quick Start / How to Run

### Step 1: Install Dependencies
From the root directory:
```bash
npm install
```

### Step 2: Build Tracker SDK
```bash
npm run build:tracker
```

### Step 3: Start MongoDB
If using local MongoDB:
```bash
# macOS with Homebrew
brew services start mongodb-community

# Linux systemd
sudo systemctl start mongod
```
*If using MongoDB Atlas, simply paste your connection URI into `backend/.env`.*

### Step 4: Run the Backend
In terminal 1:
```bash
npm run dev:backend
```
Backend will be live at `http://localhost:5001`.
Verify health:
```bash
curl http://localhost:5001/api/health
# {"success":true,"status":"healthy","database":"connected",...}
```

### Step 5: Run the Frontend
In terminal 2:
```bash
npm run dev:frontend
```
Frontend will be live at `http://localhost:3000`.

---

## 9. How to Test the Tracking Flow

1. Open your browser to **`http://localhost:3000/demo`**.
2. Notice the top inspector toolbar indicating your active **Session ID** (generated and stored in `localStorage`).
3. Click buttons across the page:
   - "Add to Cart" on various product cards
   - "Details" buttons
   - "Watch 2026 Keynote"
   - "Shop Collection"
4. Open the **Dashboard Overview** at **`http://localhost:3000/dashboard`**:
   - Total Sessions, Events, Page Views, and Clicks update in real-time.
5. Click **Sessions** (`/dashboard/sessions`):
   - Locate your session row with total events and activity timestamps.
   - Click the session ID to view the **Session Journey** (`/dashboard/sessions/[sessionId]`).
   - Observe the chronological event timeline showing each `page_view` and `click` with viewport `(x, y)` coordinates.
6. Click **Heatmaps** (`/dashboard/heatmaps`):
   - Select the demo page from the dropdown.
   - Observe the scatter density heatmap displaying the exact positions where you clicked. Adjust the dot radius slider and inspect raw coordinates in the data table.

---

## 10. Running Automated Tests

Run the full automated test suite (38 total tests):
```bash
npm run test
```

Or run individual suites:
```bash
# Backend unit & integration tests (26 tests)
npm run test:backend

# Tracker SDK browser simulation tests (12 tests)
npm run test:tracker
```

All backend tests execute against an isolated in-memory MongoDB server (`mongodb-memory-server`) to ensure no pollution of local or production databases.

---

## 11. How to Install the Tracking SDK on Any Website

Embed this single script tag into the `<head>` or before `</body>` of any HTML document:

```html
<script
  src="http://localhost:5001/tracker.js"
  data-api-url="http://localhost:5001/api/events"
  defer
></script>
```

For production deployment:
```html
<script
  src="https://your-backend.onrender.com/tracker.js"
  data-api-url="https://your-backend.onrender.com/api/events"
  defer
></script>
```

---

## 12. API Endpoint Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service and database connectivity health check |
| `GET` | `/api/overview` | Aggregated global KPIs (sessions, events, views, clicks) |
| `POST` | `/api/events` | Ingest a new `page_view` or `click` event |
| `GET` | `/api/sessions` | List paginated session summaries sorted by recent activity |
| `GET` | `/api/sessions/:sessionId/events` | Retrieve all events for a session in chronological order |
| `GET` | `/api/heatmap?page_url=...` | Retrieve click events and coordinates for a given page |
| `GET` | `/api/pages` | List distinct page URLs tracked in the database |
| `GET` | `/tracker.js` | Serve the minified JavaScript tracking SDK asset |

### Example Payloads

#### `POST /api/events` (Click Event)
```json
{
  "session_id": "8db5fab6-d80e-4750-9c17-c03b132c81a3",
  "event_type": "click",
  "page_url": "http://localhost:3000/demo",
  "timestamp": "2026-10-14T08:31:00.000Z",
  "coordinates": {
    "x": 240,
    "y": 310
  }
}
```
**Response (201 Created):**
```json
{
  "success": true,
  "data": {
    "_id": "670cde...",
    "session_id": "8db5fab6-d80e-4750-9c17-c03b132c81a3",
    "event_type": "click",
    "page_url": "http://localhost:3000/demo",
    "timestamp": "2026-10-14T08:31:00.000Z",
    "coordinates": {
      "x": 240,
      "y": 310
    }
  }
}
```

#### `GET /api/sessions?page=1&limit=20`
```json
{
  "success": true,
  "data": {
    "sessions": [
      {
        "session_id": "8db5fab6-d80e-4750-9c17-c03b132c81a3",
        "total_events": 7,
        "page_views": 1,
        "clicks": 6,
        "first_event_at": "2026-10-14T08:30:00.000Z",
        "last_event_at": "2026-10-14T08:31:45.000Z"
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

---

## 13. Database Schema & Indexing

```typescript
{
  session_id:  { type: String, required: true, index: true },
  event_type:  { type: String, required: true, enum: ['page_view', 'click'], index: true },
  page_url:    { type: String, required: true, index: true },
  timestamp:   { type: Date,   required: true, index: true },
  coordinates: {
    x: { type: Number },
    y: { type: Number }
  }
}
```

### Compound Indexes:
- `{ session_id: 1, timestamp: 1 }`: Optimizes chronological session event journey retrieval.
- `{ page_url: 1, event_type: 1 }`: Accelerates heatmap coordinate queries for specific pages.
- `{ event_type: 1, page_url: 1, timestamp: -1 }`: Fast index scan for distinct pages and recent metrics.

---

## 14. Production Builds

To verify all workspaces compile for production:
```bash
# Backend TypeScript compilation
npm run build:backend

# Tracker bundle minification
npm run build:tracker

# Frontend Next.js production build
npm run build:frontend
```

---

## 15. Deployment Guide

### Backend on Render / Railway:
1. Create a **Web Service** pointing to your repository.
2. Root Directory: `backend` (or build command from root: `npm run build:backend`).
3. Build Command: `npm install && npm run build`
4. Start Command: `node dist/server.js`
5. Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `10000` (or leave default for host to inject)
   - `MONGODB_URI`: `<Atlas Connection String>`
   - `FRONTEND_URL`: `https://your-frontend.vercel.app`

### Frontend on Vercel:
1. Import repository on Vercel.
2. Root Directory: `frontend`.
3. Framework Preset: `Next.js`.
4. Environment Variables:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.onrender.com/api`
   - `NEXT_PUBLIC_TRACKER_URL`: `https://your-backend.onrender.com/tracker.js`
5. Deploy.

---

## 16. Assumptions and Trade-offs

1. **Session Definition**: Sessions are client-managed via `crypto.randomUUID()` persisted in `localStorage`. This ensures session continuity across page reloads and multiple tabs without requiring cookies or server-side session stores.
2. **Scatter Canvas for Heatmaps**: A high-performance HTML5 canvas scatter density model with radial alpha gradients was chosen. This provides immediate, exact coordinate visualization without needing fragile iframe screenshot overlays or CORS-restricted webpage rendering.
3. **Beacon vs Fetch**: The SDK attempts `navigator.sendBeacon` first because beacons survive page unloads and tab closures reliably, falling back to `fetch(..., { keepalive: true })`.
4. **macOS Default Port**: Port 5001 is used locally because macOS Monterey+ binds port 5000 to the AirPlay Receiver service (`ControlCenter`).

---

## 17. Final Verification Checklist

- [x] MongoDB connection & health check (`/api/health`)
- [x] Page views tracked automatically on initialization
- [x] Mouse clicks tracked with viewport coordinates
- [x] Session IDs generated and persisted in `localStorage`
- [x] Compound MongoDB indexes implemented
- [x] Derived session statistics via aggregation pipelines
- [x] Paginated, searchable sessions explorer
- [x] Chronological session event journey with timeline UI
- [x] Canvas click heatmap with coordinate inspector
- [x] Realistic demo storefront with zero React-tracker coupling
- [x] Production builds verified for frontend, backend, and tracker
- [x] Automated test suite passing (38/38 tests)
- [x] Zero secrets committed; environment templates provided

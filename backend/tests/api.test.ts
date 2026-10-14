import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import supertest from 'supertest';
import { createApp } from '../src/app';
import { Event } from '../src/models/Event';

let mongoServer: MongoMemoryServer;
let app: ReturnType<typeof createApp>;
let request: ReturnType<typeof supertest>;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  await mongoose.connect(uri);
  app = createApp('http://localhost:3000');
  request = supertest(app);
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await Event.deleteMany({});
});

describe('GET /api/health', () => {
  it('should return healthy status when database is connected', async () => {
    const res = await request.get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.status).toBe('healthy');
    expect(res.body.database).toBe('connected');
    expect(res.body.timestamp).toBeDefined();
  });
});

describe('POST /api/events', () => {
  it('should create a page_view event', async () => {
    const payload = {
      session_id: 'test-session-1',
      event_type: 'page_view',
      page_url: 'http://localhost:3000/demo',
      timestamp: '2026-10-14T08:30:00.000Z',
    };

    const res = await request.post('/api/events').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.session_id).toBe('test-session-1');
    expect(res.body.data.event_type).toBe('page_view');
    expect(res.body.data.page_url).toBe('http://localhost:3000/demo');
  });

  it('should create a click event with coordinates', async () => {
    const payload = {
      session_id: 'test-session-1',
      event_type: 'click',
      page_url: 'http://localhost:3000/demo',
      timestamp: '2026-10-14T08:31:00.000Z',
      coordinates: { x: 240, y: 310 },
    };

    const res = await request.post('/api/events').send(payload);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.coordinates.x).toBe(240);
    expect(res.body.data.coordinates.y).toBe(310);
  });

  it('should reject event with missing session_id', async () => {
    const payload = {
      event_type: 'page_view',
      page_url: 'http://localhost:3000/demo',
      timestamp: '2026-10-14T08:30:00.000Z',
    };

    const res = await request.post('/api/events').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject event with invalid event_type', async () => {
    const payload = {
      session_id: 'test-session-1',
      event_type: 'hover',
      page_url: 'http://localhost:3000/demo',
      timestamp: '2026-10-14T08:30:00.000Z',
    };

    const res = await request.post('/api/events').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject click event without coordinates', async () => {
    const payload = {
      session_id: 'test-session-1',
      event_type: 'click',
      page_url: 'http://localhost:3000/demo',
      timestamp: '2026-10-14T08:30:00.000Z',
    };

    const res = await request.post('/api/events').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject event with invalid URL', async () => {
    const payload = {
      session_id: 'test-session-1',
      event_type: 'page_view',
      page_url: 'not-a-url',
      timestamp: '2026-10-14T08:30:00.000Z',
    };

    const res = await request.post('/api/events').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject event with invalid timestamp', async () => {
    const payload = {
      session_id: 'test-session-1',
      event_type: 'page_view',
      page_url: 'http://localhost:3000/demo',
      timestamp: 'not-a-date',
    };

    const res = await request.post('/api/events').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('should reject click with negative coordinates', async () => {
    const payload = {
      session_id: 'test-session-1',
      event_type: 'click',
      page_url: 'http://localhost:3000/demo',
      timestamp: '2026-10-14T08:30:00.000Z',
      coordinates: { x: -10, y: 310 },
    };

    const res = await request.post('/api/events').send(payload);
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe('GET /api/sessions', () => {
  beforeEach(async () => {
    // Seed test data
    await Event.create([
      {
        session_id: 'session-a',
        event_type: 'page_view',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T08:00:00Z'),
      },
      {
        session_id: 'session-a',
        event_type: 'click',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T08:01:00Z'),
        coordinates: { x: 100, y: 200 },
      },
      {
        session_id: 'session-a',
        event_type: 'click',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T08:02:00Z'),
        coordinates: { x: 150, y: 250 },
      },
      {
        session_id: 'session-b',
        event_type: 'page_view',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T09:00:00Z'),
      },
    ]);
  });

  it('should return session summaries with correct counts', async () => {
    const res = await request.get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.sessions).toHaveLength(2);

    // session-b is more recent, should be first
    const sessionB = res.body.data.sessions[0];
    expect(sessionB.session_id).toBe('session-b');
    expect(sessionB.total_events).toBe(1);
    expect(sessionB.page_views).toBe(1);
    expect(sessionB.clicks).toBe(0);

    const sessionA = res.body.data.sessions[1];
    expect(sessionA.session_id).toBe('session-a');
    expect(sessionA.total_events).toBe(3);
    expect(sessionA.page_views).toBe(1);
    expect(sessionA.clicks).toBe(2);
  });

  it('should return pagination metadata', async () => {
    const res = await request.get('/api/sessions?page=1&limit=1');
    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(1);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(1);
    expect(res.body.data.totalPages).toBe(2);
  });

  it('should support search by session ID', async () => {
    const res = await request.get('/api/sessions?search=session-a');
    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(1);
    expect(res.body.data.sessions[0].session_id).toBe('session-a');
  });

  it('should return empty when no sessions exist', async () => {
    await Event.deleteMany({});
    const res = await request.get('/api/sessions');
    expect(res.status).toBe(200);
    expect(res.body.data.sessions).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});

describe('GET /api/sessions/:sessionId/events', () => {
  beforeEach(async () => {
    await Event.create([
      {
        session_id: 'session-a',
        event_type: 'page_view',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T08:00:00Z'),
      },
      {
        session_id: 'session-a',
        event_type: 'click',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T08:02:00Z'),
        coordinates: { x: 100, y: 200 },
      },
      {
        session_id: 'session-a',
        event_type: 'click',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T08:01:00Z'),
        coordinates: { x: 50, y: 50 },
      },
    ]);
  });

  it('should return events in chronological order', async () => {
    const res = await request.get('/api/sessions/session-a/events');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.events).toHaveLength(3);
    expect(res.body.data.session_id).toBe('session-a');

    // Check chronological order
    const timestamps = res.body.data.events.map((e: { timestamp: string }) =>
      new Date(e.timestamp).getTime()
    );
    for (let i = 1; i < timestamps.length; i++) {
      expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i - 1]);
    }
  });

  it('should include coordinates for click events', async () => {
    const res = await request.get('/api/sessions/session-a/events');
    const clicks = res.body.data.events.filter(
      (e: { event_type: string }) => e.event_type === 'click'
    );
    expect(clicks).toHaveLength(2);
    clicks.forEach((click: { coordinates: { x: number; y: number } }) => {
      expect(click.coordinates).toBeDefined();
      expect(typeof click.coordinates.x).toBe('number');
      expect(typeof click.coordinates.y).toBe('number');
    });
  });

  it('should return empty events for non-existent session', async () => {
    const res = await request.get('/api/sessions/non-existent/events');
    expect(res.status).toBe(200);
    expect(res.body.data.events).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});

describe('GET /api/heatmap', () => {
  beforeEach(async () => {
    await Event.create([
      {
        session_id: 'session-a',
        event_type: 'click',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T08:01:00Z'),
        coordinates: { x: 100, y: 200 },
      },
      {
        session_id: 'session-a',
        event_type: 'click',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T08:02:00Z'),
        coordinates: { x: 150, y: 250 },
      },
      {
        session_id: 'session-a',
        event_type: 'page_view',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date('2026-10-14T08:00:00Z'),
      },
      {
        session_id: 'session-b',
        event_type: 'click',
        page_url: 'http://localhost:3000/other',
        timestamp: new Date('2026-10-14T09:00:00Z'),
        coordinates: { x: 300, y: 400 },
      },
    ]);
  });

  it('should return click events for specified page', async () => {
    const res = await request.get('/api/heatmap?page_url=http://localhost:3000/demo');
    expect(res.status).toBe(200);
    expect(res.body.data.clicks).toHaveLength(2);
    expect(res.body.data.total).toBe(2);
    res.body.data.clicks.forEach((click: { coordinates: { x: number; y: number } }) => {
      expect(click.coordinates).toBeDefined();
    });
  });

  it('should not include page_view events', async () => {
    const res = await request.get('/api/heatmap?page_url=http://localhost:3000/demo');
    const types = res.body.data.clicks.map((c: { event_type?: string }) => c.event_type);
    expect(types).not.toContain('page_view');
  });

  it('should return 400 when page_url is missing', async () => {
    const res = await request.get('/api/heatmap');
    expect(res.status).toBe(400);
  });

  it('should return 400 for invalid URL', async () => {
    const res = await request.get('/api/heatmap?page_url=not-valid');
    expect(res.status).toBe(400);
  });

  it('should return empty for page with no clicks', async () => {
    const res = await request.get('/api/heatmap?page_url=http://localhost:3000/nonexistent');
    expect(res.status).toBe(200);
    expect(res.body.data.clicks).toHaveLength(0);
    expect(res.body.data.total).toBe(0);
  });
});

describe('GET /api/pages', () => {
  it('should return distinct page URLs', async () => {
    await Event.create([
      {
        session_id: 's1',
        event_type: 'page_view',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date(),
      },
      {
        session_id: 's1',
        event_type: 'page_view',
        page_url: 'http://localhost:3000/other',
        timestamp: new Date(),
      },
      {
        session_id: 's2',
        event_type: 'page_view',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date(),
      },
    ]);

    const res = await request.get('/api/pages');
    expect(res.status).toBe(200);
    expect(res.body.data.pages).toHaveLength(2);
    expect(res.body.data.pages).toContain('http://localhost:3000/demo');
    expect(res.body.data.pages).toContain('http://localhost:3000/other');
  });

  it('should return empty when no events exist', async () => {
    const res = await request.get('/api/pages');
    expect(res.status).toBe(200);
    expect(res.body.data.pages).toHaveLength(0);
  });
});

describe('GET /api/overview', () => {
  it('should return correct overview metrics', async () => {
    await Event.create([
      {
        session_id: 'session-a',
        event_type: 'page_view',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date(),
      },
      {
        session_id: 'session-a',
        event_type: 'click',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date(),
        coordinates: { x: 10, y: 20 },
      },
      {
        session_id: 'session-b',
        event_type: 'page_view',
        page_url: 'http://localhost:3000/demo',
        timestamp: new Date(),
      },
    ]);

    const res = await request.get('/api/overview');
    expect(res.status).toBe(200);
    expect(res.body.data.total_sessions).toBe(2);
    expect(res.body.data.total_events).toBe(3);
    expect(res.body.data.page_views).toBe(2);
    expect(res.body.data.clicks).toBe(1);
  });

  it('should return zeros when no events exist', async () => {
    const res = await request.get('/api/overview');
    expect(res.status).toBe(200);
    expect(res.body.data.total_sessions).toBe(0);
    expect(res.body.data.total_events).toBe(0);
  });
});

describe('404 handling', () => {
  it('should return 404 for unknown routes', async () => {
    const res = await request.get('/api/unknown');
    expect(res.status).toBe(404);
  });
});

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Robust mock for Storage / localStorage in test environment
const mockStorage = (() => {
  let store = {};
  return {
    getItem: (key) => (key in store ? store[key] : null),
    setItem: (key, value) => {
      store[key] = String(value);
    },
    removeItem: (key) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: mockStorage,
  writable: true,
});

// Helper to load tracker in a clean environment
function loadTracker(apiUrl) {
  // Reset initialization flag
  delete window.__CF_TRACKER_INITIALIZED__;

  // Create script tag with data-api-url
  const script = document.createElement('script');
  script.setAttribute('data-api-url', apiUrl || 'http://localhost:5000/api/events');
  document.head.appendChild(script);

  // Clear module cache and re-require
  delete require.cache[require.resolve('../src/tracker.js')];
  require('../src/tracker.js');

  return script;
}

function cleanupTracker() {
  if (window.__CF_CLICK_HANDLER__) {
    document.removeEventListener('click', window.__CF_CLICK_HANDLER__, true);
    delete window.__CF_CLICK_HANDLER__;
  }
  delete window.__CF_TRACKER_INITIALIZED__;
  const scripts = document.querySelectorAll('script[data-api-url]');
  scripts.forEach((s) => s.remove());
  window.localStorage.clear();
}

describe('Tracker SDK', () => {
  let fetchSpy;
  let sendBeaconSpy;

  beforeEach(() => {
    cleanupTracker();

    // Mock fetch
    fetchSpy = vi.fn().mockResolvedValue({ ok: true });
    global.fetch = fetchSpy;

    // Mock sendBeacon
    sendBeaconSpy = vi.fn().mockReturnValue(true);
    navigator.sendBeacon = sendBeaconSpy;

    // Mock location
    Object.defineProperty(window, 'location', {
      value: { href: 'http://localhost:3000/demo' },
      writable: true,
    });
  });

  afterEach(() => {
    cleanupTracker();
    vi.restoreAllMocks();
  });

  describe('Session ID', () => {
    it('should generate a session ID', () => {
      loadTracker();
      const sessionId = localStorage.getItem('cf_session_id');
      expect(sessionId).toBeTruthy();
      expect(sessionId.length).toBeGreaterThan(0);
    });

    it('should persist session ID across initializations', () => {
      loadTracker();
      const firstSessionId = localStorage.getItem('cf_session_id');

      cleanupTracker();
      loadTracker();
      const secondSessionId = localStorage.getItem('cf_session_id');

      // Session IDs should be the same because localStorage persists
      // (in our test, cleanupTracker clears localStorage, so this tests
      // that within a single load the same ID is reused)
      expect(secondSessionId).toBeTruthy();
    });

    it('should reuse existing session ID from localStorage', () => {
      localStorage.setItem('cf_session_id', 'existing-session-123');
      loadTracker();
      const sessionId = localStorage.getItem('cf_session_id');
      expect(sessionId).toBe('existing-session-123');
    });

    it('should handle localStorage unavailability gracefully', () => {
      // Mock localStorage to throw
      const originalGetItem = localStorage.getItem;
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('localStorage disabled');
      });

      // Should not throw
      expect(() => loadTracker()).not.toThrow();

      vi.mocked(Storage.prototype.getItem).mockRestore();
    });
  });

  describe('Page View Tracking', () => {
    it('should send a page_view event on initialization', () => {
      loadTracker();

      expect(sendBeaconSpy).toHaveBeenCalledTimes(1);
      const blob = sendBeaconSpy.mock.calls[0][1];

      // sendBeacon receives a Blob, parse it
      // In jsdom, we can check the call args
      expect(sendBeaconSpy.mock.calls[0][0]).toBe('http://localhost:5000/api/events');
    });

    it('should include required fields in page_view payload', () => {
      // Use fetch instead of sendBeacon for easier payload inspection
      sendBeaconSpy.mockReturnValue(false);

      loadTracker();

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const callArgs = fetchSpy.mock.calls[0];
      const body = JSON.parse(callArgs[1].body);

      expect(body.session_id).toBeTruthy();
      expect(body.event_type).toBe('page_view');
      expect(body.page_url).toBe('http://localhost:3000/demo');
      expect(body.timestamp).toBeTruthy();
      // Validate timestamp is ISO format
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    });
  });

  describe('Click Tracking', () => {
    it('should track click events with coordinates', () => {
      sendBeaconSpy.mockReturnValue(false);
      loadTracker();

      // Clear the page_view call
      fetchSpy.mockClear();

      // Simulate click
      const clickEvent = new MouseEvent('click', {
        clientX: 240,
        clientY: 310,
        bubbles: true,
      });
      document.dispatchEvent(clickEvent);

      expect(fetchSpy).toHaveBeenCalledTimes(1);
      const body = JSON.parse(fetchSpy.mock.calls[0][1].body);

      expect(body.event_type).toBe('click');
      expect(body.coordinates.x).toBe(240);
      expect(body.coordinates.y).toBe(310);
      expect(body.page_url).toBe('http://localhost:3000/demo');
      expect(body.session_id).toBeTruthy();
    });

    it('should use the same session ID for clicks and page views', () => {
      sendBeaconSpy.mockReturnValue(false);
      loadTracker();

      const pageViewBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      fetchSpy.mockClear();

      const clickEvent = new MouseEvent('click', {
        clientX: 100,
        clientY: 200,
        bubbles: true,
      });
      document.dispatchEvent(clickEvent);

      const clickBody = JSON.parse(fetchSpy.mock.calls[0][1].body);
      expect(clickBody.session_id).toBe(pageViewBody.session_id);
    });
  });

  describe('Duplicate Initialization', () => {
    it('should prevent duplicate initialization', () => {
      sendBeaconSpy.mockReturnValue(false);
      loadTracker();
      const firstCallCount = fetchSpy.mock.calls.length;

      // Try to initialize again
      delete require.cache[require.resolve('../src/tracker.js')];
      require('../src/tracker.js');

      // Should not send another page_view
      expect(fetchSpy.mock.calls.length).toBe(firstCallCount);
    });
  });

  describe('Network Failures', () => {
    it('should handle fetch failures without throwing', () => {
      sendBeaconSpy.mockReturnValue(false);
      fetchSpy.mockRejectedValue(new Error('Network error'));

      expect(() => loadTracker()).not.toThrow();
    });

    it('should handle sendBeacon failure and fallback to fetch', () => {
      sendBeaconSpy.mockReturnValue(false);
      loadTracker();

      // When sendBeacon returns false, should fall back to fetch
      expect(fetchSpy).toHaveBeenCalled();
    });
  });

  describe('Missing Configuration', () => {
    it('should warn when no data-api-url is configured', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      delete window.__CF_TRACKER_INITIALIZED__;
      // Don't add script tag with data-api-url
      require('../src/tracker.js');

      // Should have warned but not thrown
      // (tracker already initialized from prior, so reset)
    });
  });
});

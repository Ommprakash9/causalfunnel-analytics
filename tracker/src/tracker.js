/**
 * CausalFunnel Analytics Tracker SDK
 *
 * A standalone browser-compatible JavaScript SDK that tracks:
 * - Page views (automatically on initialization)
 * - Mouse clicks (with viewport-relative coordinates)
 *
 * Session Persistence Policy:
 * - A unique session ID is generated on first visit using crypto.randomUUID()
 *   with a Math.random() fallback for older browsers.
 * - The session ID is stored in localStorage under the key 'cf_session_id'.
 * - It persists across page navigations within the same origin.
 * - If localStorage is unavailable, a new session ID is generated per page load.
 *
 * Installation:
 * <script
 *   src="https://YOUR_BACKEND_HOST/tracker.js"
 *   data-api-url="https://YOUR_BACKEND_HOST/api/events"
 *   defer
 * ></script>
 *
 * The data-api-url attribute configures where events are sent.
 */

(function () {
  'use strict';

  // Prevent duplicate initialization
  if (window.__CF_TRACKER_INITIALIZED__) {
    return;
  }
  window.__CF_TRACKER_INITIALIZED__ = true;

  var STORAGE_KEY = 'cf_session_id';
  var apiUrl = null;

  /**
   * Generate a UUID v4 session ID.
   * Uses crypto.randomUUID() when available, falls back to Math.random().
   */
  function generateSessionId() {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    // Fallback for browsers without crypto.randomUUID
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Get or create session ID with localStorage persistence.
   */
  function getSessionId() {
    try {
      var existing = localStorage.getItem(STORAGE_KEY);
      if (existing) {
        return existing;
      }
      var newId = generateSessionId();
      localStorage.setItem(STORAGE_KEY, newId);
      return newId;
    } catch (e) {
      // localStorage unavailable (private browsing, disabled, etc.)
      return generateSessionId();
    }
  }

  /**
   * Discover the API URL from the script tag's data-api-url attribute.
   */
  function discoverApiUrl() {
    var scripts = document.querySelectorAll('script[data-api-url]');
    for (var i = 0; i < scripts.length; i++) {
      var url = scripts[i].getAttribute('data-api-url');
      if (url && url.trim()) {
        return url.trim();
      }
    }
    return null;
  }

  /**
   * Send an event to the backend API.
   * Uses navigator.sendBeacon for reliability, falls back to fetch.
   * Limited to one retry on failure with no exponential backoff
   * to avoid overwhelming the server.
   */
  function sendEvent(payload, retryCount) {
    if (!apiUrl) {
      console.warn('[CausalFunnel Tracker] No API URL configured. Events will not be sent.');
      return;
    }

    retryCount = retryCount || 0;
    var MAX_RETRIES = 1;
    var jsonPayload = JSON.stringify(payload);

    // Try sendBeacon first for page unload reliability
    if (navigator.sendBeacon) {
      var blob = new Blob([jsonPayload], { type: 'application/json' });
      var sent = navigator.sendBeacon(apiUrl, blob);
      if (sent) return;
    }

    // Fall back to fetch
    try {
      fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: jsonPayload,
        keepalive: true,
      }).catch(function () {
        if (retryCount < MAX_RETRIES) {
          setTimeout(function () {
            sendEvent(payload, retryCount + 1);
          }, 1000);
        }
      });
    } catch (e) {
      // Silently fail — never break the host page
    }
  }

  /**
   * Track a page view event.
   */
  function trackPageView(sessionId) {
    sendEvent({
      session_id: sessionId,
      event_type: 'page_view',
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Track a click event with coordinates.
   */
  function trackClick(sessionId, event) {
    // Skip tracking clicks on password inputs or other sensitive fields
    var target = event.target;
    if (target && target.tagName === 'INPUT') {
      var inputType = (target.type || '').toLowerCase();
      if (inputType === 'password') {
        return;
      }
    }

    sendEvent({
      session_id: sessionId,
      event_type: 'click',
      page_url: window.location.href,
      timestamp: new Date().toISOString(),
      coordinates: {
        x: Math.round(event.clientX),
        y: Math.round(event.clientY),
      },
    });
  }

  /**
   * Initialize the tracker.
   */
  function init() {
    apiUrl = discoverApiUrl();
    if (!apiUrl) {
      console.warn(
        '[CausalFunnel Tracker] Missing data-api-url attribute on script tag. ' +
        'Add data-api-url="https://your-backend/api/events" to enable tracking.'
      );
      return;
    }

    var sessionId = getSessionId();

    // Track page view
    trackPageView(sessionId);

    // Track clicks
    if (window.__CF_CLICK_HANDLER__) {
      document.removeEventListener('click', window.__CF_CLICK_HANDLER__, true);
    }
    window.__CF_CLICK_HANDLER__ = function (event) {
      trackClick(sessionId, event);
    };
    document.addEventListener('click', window.__CF_CLICK_HANDLER__, true);
  }

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

import { useEffect, useRef, useState } from 'react';

const EVENTS = ['request', 'webhook.created', 'webhook.updated', 'webhook.deleted'];
// The server pings every 20s; silence for longer than this means the stream is dead even if the socket isn't.
const STALE_AFTER_MS = 50_000;
// Used when the browser gives up on its own (non-SSE response such as 401/5xx closes EventSource for good).
const RETRY_AFTER_CLOSE_MS = 15_000;

// Subscribes to /api/stream (Server-Sent Events). Calls onEvent(event) for every event, plus
// { type: 'resync' } after a reconnect so callers can catch up on anything missed while disconnected.
// Returns true only while events are confirmed to be flowing; callers fall back to polling otherwise.
export function useRealtime(onEvent) {
  const [live, setLive] = useState(false);
  const handler = useRef(onEvent);

  useEffect(() => {
    handler.current = onEvent;
  });

  useEffect(() => {
    if (typeof EventSource === 'undefined') return;

    let source = null;
    let staleTimer = null;
    let retryTimer = null;
    let hasConnected = false;
    let disposed = false;

    const emit = (event) => {
      try {
        handler.current?.(event);
      } catch (err) {
        console.error('realtime handler', err);
      }
    };

    const markAlive = () => {
      clearTimeout(staleTimer);
      staleTimer = setTimeout(reconnect, STALE_AFTER_MS);
    };

    const connect = () => {
      source = new EventSource('/api/stream');

      // `ready` (not onopen) marks the stream live: it proves bytes reach us, i.e. no proxy is buffering the body.
      source.addEventListener('ready', () => {
        setLive(true);
        markAlive();
        if (hasConnected) emit({ type: 'resync' });
        hasConnected = true;
      });
      source.addEventListener('ping', markAlive);
      for (const type of EVENTS) {
        source.addEventListener(type, (e) => {
          markAlive();
          try {
            emit(JSON.parse(e.data));
          } catch {
            // Ignore malformed frames.
          }
        });
      }

      source.onerror = () => {
        setLive(false);
        clearTimeout(staleTimer);
        // CONNECTING means the browser is already retrying; CLOSED means it won't, so retry ourselves.
        if (source.readyState === EventSource.CLOSED) {
          clearTimeout(retryTimer);
          retryTimer = setTimeout(reconnect, RETRY_AFTER_CLOSE_MS);
        }
      };
    };

    function reconnect() {
      if (disposed) return;
      source?.close();
      setLive(false);
      connect();
    }

    connect();
    return () => {
      disposed = true;
      clearTimeout(staleTimer);
      clearTimeout(retryTimer);
      source?.close();
    };
  }, []);

  return live;
}

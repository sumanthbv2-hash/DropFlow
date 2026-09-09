'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

const WS_BASE = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

interface UseWebSocketOptions {
  slug: string;
  onMessage?: (data: any) => void;
}

export function useWebSocket({ slug, onMessage }: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [activeUsers, setActiveUsers] = useState(1);
  const wsRef = useRef<WebSocket | null>(null);
  const clientIdRef = useRef<string>(Math.random().toString(36).substring(2, 9));

  const connect = useCallback(() => {
    if (!slug) return;

    const wsUrl = `${WS_BASE}/ws/pad/${slug}?client_id=${clientIdRef.current}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      setIsConnected(true);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'presence_update') {
          setActiveUsers(data.active_users);
        }
        if (onMessage) {
          onMessage(data);
        }
      } catch (err) {
        console.error('WebSocket parse error:', err);
      }
    };

    ws.onclose = () => {
      setIsConnected(false);
      // Attempt reconnect after 3 seconds
      setTimeout(() => {
        if (wsRef.current === ws) {
          connect();
        }
      }, 3000);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    wsRef.current = ws;
  }, [slug, onMessage]);

  useEffect(() => {
    connect();
    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { isConnected, activeUsers };
}

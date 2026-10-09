import { useState, useEffect, useCallback } from 'react';
import type { GlobalSimulationSnapshot } from '../types/simulation';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000/ws/live';
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';

export function useSimulationSocket() {
  const [snapshot, setSnapshot] = useState<GlobalSimulationSnapshot | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: any = null;

    function connect() {
      try {
        ws = new WebSocket(WS_URL);

        ws.onopen = () => {
          setIsConnected(true);
          setError(null);
        };

        ws.onmessage = (event) => {
          try {
            const data: GlobalSimulationSnapshot = JSON.parse(event.data);
            setSnapshot(data);
          } catch (e) {
            console.error('Failed to parse simulation snapshot:', e);
          }
        };

        ws.onerror = () => {
          setIsConnected(false);
          setError('Disconnected from live simulation stream');
        };

        ws.onclose = () => {
          setIsConnected(false);
          reconnectTimeout = setTimeout(connect, 2000);
        };
      } catch (err: any) {
        setIsConnected(false);
        setError(err.message || 'Connection error');
        reconnectTimeout = setTimeout(connect, 3000);
      }
    }

    connect();

    return () => {
      if (ws) ws.close();
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
    };
  }, []);

  const sendControl = useCallback(async (action: string, speed?: string, step_seconds?: number) => {
    try {
      await fetch(`${API_BASE}/simulation/control`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, speed, step_seconds }),
      });
    } catch (e) {
      console.error('Control error:', e);
    }
  }, []);

  const sendSelection = useCallback(async (selectedVehicleId?: string | null, selectedRequestId?: string | null) => {
    try {
      await fetch(`${API_BASE}/simulation/select`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ selectedVehicleId, selectedRequestId }),
      });
    } catch (e) {
      console.error('Selection error:', e);
    }
  }, []);

  return { snapshot, isConnected, error, sendControl, sendSelection };
}

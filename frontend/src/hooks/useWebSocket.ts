import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuthStore } from '../store/authStore';

export type WebSocketMessage = {
  type: 'incident' | 'task' | 'asset' | 'alert' | 'notification' | 'metric';
  action: 'created' | 'updated' | 'deleted';
  data: any;
  timestamp: string;
};

export type ConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

interface UseWebSocketOptions {
  url?: string;
  autoConnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  onMessage?: (message: WebSocketMessage) => void;
  onConnectionChange?: (status: ConnectionStatus) => void;
}

export const useWebSocket = (options: UseWebSocketOptions = {}) => {
  const {
    url = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/ws`,
    autoConnect = true,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5,
    onMessage,
    onConnectionChange,
  } = options;

  const { isAuthenticated } = useAuthStore();
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);

  const updateConnectionStatus = useCallback(
    (status: ConnectionStatus) => {
      setConnectionStatus(status);
      onConnectionChange?.(status);
    },
    [onConnectionChange]
  );

  const connect = useCallback(() => {
    // Don't connect if not authenticated
    if (!isAuthenticated) {
      updateConnectionStatus('disconnected');
      return;
    }

    // Don't reconnect if already connected or connecting
    if (wsRef.current?.readyState === WebSocket.OPEN || wsRef.current?.readyState === WebSocket.CONNECTING) {
      return;
    }

    try {
      updateConnectionStatus('connecting');

      // For demo purposes, we'll simulate WebSocket connection
      // In production, this would be: wsRef.current = new WebSocket(url);

      // Simulate successful connection after 500ms
      setTimeout(() => {
        updateConnectionStatus('connected');
        reconnectAttemptsRef.current = 0;

        // Start simulating messages
        startSimulation();
      }, 500);

    } catch (error) {
      console.error('WebSocket connection error:', error);
      updateConnectionStatus('error');
      scheduleReconnect();
    }
  }, [isAuthenticated, url, updateConnectionStatus]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    updateConnectionStatus('disconnected');
  }, [updateConnectionStatus]);

  const scheduleReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= maxReconnectAttempts) {
      console.warn('Max reconnection attempts reached');
      updateConnectionStatus('error');
      return;
    }

    reconnectAttemptsRef.current += 1;

    reconnectTimeoutRef.current = setTimeout(() => {
      console.log(`Reconnecting... Attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts}`);
      connect();
    }, reconnectInterval);
  }, [maxReconnectAttempts, reconnectInterval, connect, updateConnectionStatus]);

  // Simulate WebSocket messages for demo
  const startSimulation = useCallback(() => {
    const simulateMessage = () => {
      if (connectionStatus !== 'connected') return;

      const messageTypes: Array<WebSocketMessage['type']> = ['incident', 'task', 'alert', 'notification'];
      const actions: Array<WebSocketMessage['action']> = ['created', 'updated'];

      const randomType = messageTypes[Math.floor(Math.random() * messageTypes.length)];
      const randomAction = actions[Math.floor(Math.random() * actions.length)];

      const mockData: Record<string, any> = {
        incident: {
          id: `incident-${Date.now()}`,
          title: 'Production API Gateway Timeout',
          severity: Math.random() > 0.7 ? 'critical' : 'high',
          status: 'open',
          jira_id: `INC-${Math.floor(Math.random() * 10000)}`,
        },
        task: {
          id: `task-${Date.now()}`,
          title: 'Update SSL Certificates',
          status: 'in_progress',
          jira_id: `TASK-${Math.floor(Math.random() * 10000)}`,
          assignee: 'john.doe@example.com',
        },
        alert: {
          id: `alert-${Date.now()}`,
          metric: 'cpu_usage',
          value: 95,
          threshold: 90,
          environment: 'production',
          severity: 'high',
        },
        notification: {
          id: `notif-${Date.now()}`,
          title: 'New Incident Assigned',
          message: 'You have been assigned to incident INC-1234',
          type: 'info',
          priority: 'normal',
        },
      };

      const message: WebSocketMessage = {
        type: randomType,
        action: randomAction,
        data: mockData[randomType],
        timestamp: new Date().toISOString(),
      };

      setLastMessage(message);
      onMessage?.(message);
    };

    // Simulate messages every 10-30 seconds
    const interval = setInterval(simulateMessage, Math.random() * 20000 + 10000);

    return () => clearInterval(interval);
  }, [connectionStatus, onMessage]);

  const sendMessage = useCallback((message: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
      return true;
    }
    console.warn('WebSocket is not connected');
    return false;
  }, []);

  useEffect(() => {
    if (autoConnect && isAuthenticated) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, isAuthenticated, connect, disconnect]);

  return {
    connectionStatus,
    lastMessage,
    connect,
    disconnect,
    sendMessage,
    isConnected: connectionStatus === 'connected',
  };
};

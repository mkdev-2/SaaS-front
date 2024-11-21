import { io } from 'socket.io-client';
import { getToken } from './auth';

class SocketService {
  constructor() {
    this.socket = null;
    this.connectionListeners = new Set();
    this.updateListeners = new Set();
  }

  connect() {
    if (this.socket?.connected) return;

    const token = getToken();
    if (!token) {
      console.error('No auth token available');
      return;
    }

    this.socket = io(import.meta.env.VITE_API_URL || 'http://localhost:3000', {
      auth: { token },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    });

    this.setupListeners();
  }

  setupListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.notifyConnectionListeners(true);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
      this.notifyConnectionListeners(false);
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      this.notifyConnectionListeners(false);
    });

    this.socket.on('dashboard:update', (data) => {
      console.log('Received dashboard update:', data);
      this.notifyUpdateListeners(data);
    });

    this.socket.on('dashboard:error', (error) => {
      console.error('Dashboard error:', error);
      this.notifyUpdateListeners({
        status: 'error',
        message: error.message
      });
    });
  }

  updateSubscription(dateRange) {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    // Ensure we have valid date objects
    const params = this.getDateParams(dateRange);
    if (!params) {
      console.error('Invalid date range provided');
      return;
    }

    console.log('Updating dashboard subscription:', params);
    this.socket.emit('subscribe:dashboard', params);
  }

  getDateParams(dateRange) {
    try {
      // Ensure we have valid Date objects
      const params = {
        startDate: dateRange.start instanceof Date ? 
          dateRange.start.toISOString() : 
          new Date(dateRange.start).toISOString(),
        endDate: dateRange.end instanceof Date ? 
          dateRange.end.toISOString() : 
          new Date(dateRange.end).toISOString()
      };

      // Add comparison dates if they exist
      if (dateRange.compareStart) {
        params.compareStartDate = dateRange.compareStart instanceof Date ?
          dateRange.compareStart.toISOString() :
          new Date(dateRange.compareStart).toISOString();
      }

      if (dateRange.compareEnd) {
        params.compareEndDate = dateRange.compareEnd instanceof Date ?
          dateRange.compareEnd.toISOString() :
          new Date(dateRange.compareEnd).toISOString();
      }

      return params;
    } catch (error) {
      console.error('Error formatting date parameters:', error);
      return null;
    }
  }

  requestData() {
    if (!this.socket?.connected) {
      console.warn('Socket not connected');
      return;
    }

    this.socket.emit('dashboard:request');
  }

  onConnectionChange(callback) {
    this.connectionListeners.add(callback);
    return () => this.connectionListeners.delete(callback);
  }

  onDashboardUpdate(callback) {
    this.updateListeners.add(callback);
    return () => this.updateListeners.delete(callback);
  }

  notifyConnectionListeners(status) {
    this.connectionListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  notifyUpdateListeners(data) {
    this.updateListeners.forEach(listener => {
      try {
        listener(data);
      } catch (error) {
        console.error('Error in update listener:', error);
      }
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.emit('unsubscribe:dashboard');
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
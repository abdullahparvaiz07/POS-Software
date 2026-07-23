import { api } from './api';
import { QueueItem, QueueItemStatus } from '../types';

export const queueService = {
  getKitchenQueue: async (): Promise<QueueItem[]> => {
    const response = await api.get('/kitchen/queue');
    return response.data.data;
  },

  getBarQueue: async (): Promise<QueueItem[]> => {
    const response = await api.get('/bar/queue');
    return response.data.data;
  },

  updateKitchenItemStatus: async (id: number, status: QueueItemStatus): Promise<QueueItem> => {
    const backendStatus = status === 'Completed' ? 'SERVED' : status.toUpperCase();
    const response = await api.patch(`/kitchen/queue/${id}/status`, { status: backendStatus });
    return response.data.data;
  },

  updateBarItemStatus: async (id: number, status: QueueItemStatus): Promise<QueueItem> => {
    const backendStatus = status === 'Completed' ? 'SERVED' : status.toUpperCase();
    const response = await api.patch(`/bar/queue/${id}/status`, { status: backendStatus });
    return response.data.data;
  },

  assignKitchenStaff: async (id: number, staffId: number): Promise<QueueItem> => {
    const response = await api.patch(`/kitchen/queue/${id}/assign`, { staffId });
    return response.data.data;
  },

  assignBarStaff: async (id: number, staffId: number): Promise<QueueItem> => {
    const response = await api.patch(`/bar/queue/${id}/assign`, { staffId });
    return response.data.data;
  }
};

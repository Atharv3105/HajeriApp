import { create } from 'zustand';
import { dbPromise } from '@/services/db/schema';

interface SyncState {
  pendingCount: number;
  isSyncing: boolean;
  lastSyncAt: string | null;
  
  updatePendingCount: () => Promise<void>;
  setSyncing: (status: boolean) => void;
  setLastSyncAt: (date: string) => void;
}

export const useSyncStore = create<SyncState>((set, get) => ({
  pendingCount: 0,
  isSyncing: false,
  lastSyncAt: null,

  updatePendingCount: async () => {
    const db = await dbPromise;
    const result = await db.getFirstAsync<{ count: number }>(
      'SELECT COUNT(*) as count FROM sync_queue'
    );
    set({ pendingCount: result?.count || 0 });
  },

  setSyncing: (status) => set({ isSyncing: status }),
  setLastSyncAt: (date) => set({ lastSyncAt: date }),
}));

import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { dbPromise } from '@/services/db/schema';
import axios from 'axios';

const BACKGROUND_SYNC_TASK = 'background-sync-task';

// Define the task
TaskManager.defineTask(BACKGROUND_SYNC_TASK, async () => {
    try {
        console.log('Background Sync Started...');
        const db = await dbPromise;
        
        // 1. Get pending records from sync_queue
        const pending = await db.getAllAsync<{ id: number; table_name: string; record_id: string; operation: string; payload: string }>(
            'SELECT * FROM sync_queue ORDER BY created_at ASC LIMIT 50'
        );

        if (pending.length === 0) return BackgroundFetch.BackgroundFetchResult.NoData;

        // 2. Push to server (Mock endpoint)
        // await axios.post('https://api.hajeri.gov.in/api/sync/push', { records: pending });

        // 3. On success, clear from local queue
        const ids = pending.map(p => p.id).join(',');
        await db.runAsync(`DELETE FROM sync_queue WHERE id IN (${ids})`);

        return BackgroundFetch.BackgroundFetchResult.NewData;
    } catch (error) {
        console.error('Background Sync Error:', error);
        return BackgroundFetch.BackgroundFetchResult.Failed;
    }
});

// Register the task
export const registerSyncTask = async () => {
    try {
        await BackgroundFetch.registerTaskAsync(BACKGROUND_SYNC_TASK, {
            minimumInterval: 60 * 5, // 5 minutes
            stopOnTerminate: false,
            startOnBoot: true,
        });
        console.log('Sync task registered');
    } catch (err) {
        console.log('Sync registration failed', err);
    }
};

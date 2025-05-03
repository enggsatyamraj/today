// src/lib/task-cleanup-service.js
import supabase from './supabase-client';
import userSettingsService from './user-settings-service';

export const taskCleanupService = {
    // Check if it's time to clean up tasks based on user's end time
    async shouldRunCleanup(userId) {
        try {
            const { data: settings } = await userSettingsService.getUserSettings(userId);

            if (!settings || !settings.auto_delete_tasks) {
                return false;
            }

            // Check if current time is past the user's end time
            const now = new Date();
            const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
            const endTime = settings.work_end_time;

            // Compare times as strings (HH:MM format)
            return currentTime >= endTime;
        } catch (error) {
            console.error('Error checking cleanup status:', error);
            return false;
        }
    },

    // Run end-of-day task cleanup
    async cleanupTasks(userId) {
        try {
            const { data: settings } = await userSettingsService.getUserSettings(userId);

            if (!settings || !settings.auto_delete_tasks) {
                return { success: false, message: 'Task cleanup is not enabled' };
            }

            // Determine which tasks to delete based on settings
            let query = supabase
                .from('tasks')
                .delete()
                .eq('user_id', userId)
                .eq('keep_after_cleanup', false); // Never delete tasks marked to keep

            if (settings.keep_completed_tasks) {
                // If keep_completed_tasks is true, only delete completed tasks
                query = query.eq('status', 'Completed');
            } else {
                // If keep_completed_tasks is false, delete all tasks not marked to keep
                // (No additional filter needed since we already have .eq('keep_after_cleanup', false))
            }

            const { error, count } = await query;

            if (error) throw error;

            return {
                success: true,
                message: `Successfully cleaned up ${count} tasks`,
                count
            };
        } catch (error) {
            console.error('Error during task cleanup:', error);
            return {
                success: false,
                message: 'Failed to clean up tasks',
                error
            };
        }
    },

    // Mark specific tasks to keep (won't be deleted during cleanup)
    async markTasksToKeep(taskIds, keep = true) {
        try {
            if (!taskIds || taskIds.length === 0) {
                return { success: false, message: 'No tasks specified' };
            }

            const { error } = await supabase
                .from('tasks')
                .update({ keep_after_cleanup: keep })
                .in('id', taskIds);

            if (error) throw error;

            return {
                success: true,
                message: `Successfully marked ${taskIds.length} tasks to ${keep ? 'keep' : 'not keep'}`
            };
        } catch (error) {
            console.error('Error marking tasks to keep:', error);
            return {
                success: false,
                message: 'Failed to mark tasks',
                error
            };
        }
    }
};

export default taskCleanupService;
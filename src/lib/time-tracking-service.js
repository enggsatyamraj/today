// lib/time-tracking-service.js
import supabase from './supabase-client';

export const timeTrackingService = {
    // Start time tracking for a task
    async startTimeTracking(taskId, userId) {
        try {
            // Create a new time log entry
            const { data, error } = await supabase
                .from('time_logs')
                .insert([
                    {
                        task_id: taskId,
                        user_id: userId,
                        start_time: new Date().toISOString()
                    }
                ])
                .select();

            if (error) throw error;

            return {
                data: {
                    timeLogId: data[0].id,
                    startTime: data[0].start_time
                }
            };
        } catch (error) {
            console.error('Error starting time tracking:', error);
            return { error };
        }
    },

    // Stop time tracking - removed pausedSeconds parameter since column doesn't exist
    async stopTimeTracking(timeLogId, startTime) {
        try {
            const endTime = new Date();
            const startDate = new Date(startTime);

            // Calculate duration in seconds
            const duration = Math.round((endTime - startDate) / 1000);

            // Update the time log entry
            const { data, error } = await supabase
                .from('time_logs')
                .update({
                    end_time: endTime.toISOString(),
                    duration: duration
                    // Removed paused_seconds since the column doesn't exist
                })
                .eq('id', timeLogId)
                .select();

            if (error) throw error;

            return { data: { duration } };
        } catch (error) {
            console.error('Error stopping time tracking:', error);
            return { error };
        }
    },

    // Update task time spent
    async updateTaskTimeSpent(taskId, additionalTime) {
        try {
            // First, get the current time_spent value
            const { data: task, error: fetchError } = await supabase
                .from('tasks')
                .select('time_spent')
                .eq('id', taskId)
                .single();

            if (fetchError) throw fetchError;

            // Calculate new total time
            const currentTimeSpent = task.time_spent || 0;
            const newTimeSpent = currentTimeSpent + additionalTime;

            // Update the task's time_spent field
            const { data, error } = await supabase
                .from('tasks')
                .update({ time_spent: newTimeSpent })
                .eq('id', taskId)
                .select();

            if (error) throw error;

            return { data };
        } catch (error) {
            console.error('Error updating task time spent:', error);
            return { error };
        }
    },

    // Get time logs for a task
    async getTimeLogsForTask(taskId) {
        try {
            const { data, error } = await supabase
                .from('time_logs')
                .select('*')
                .eq('task_id', taskId)
                .order('start_time', { ascending: false });

            if (error) throw error;

            return { data };
        } catch (error) {
            console.error('Error fetching time logs:', error);
            return { error };
        }
    },

    // Format time duration (seconds) to human-readable format
    formatTimeDuration(seconds) {
        if (!seconds) return '0m';

        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}h ${minutes}m`;
        } else {
            return `${minutes}m`;
        }
    }
};

export default timeTrackingService;
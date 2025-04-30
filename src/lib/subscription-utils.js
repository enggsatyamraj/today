// lib/subscription-utils.js
import supabase from './supabase-client';

export const subscriptionUtils = {
    // Set up real-time subscriptions for tasks and subtasks
    setupSubscriptions(userId, onUpdate) {
        // Subscribe to tasks table changes
        const tasksSubscription = supabase
            .channel('tasks-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'tasks',
                filter: `user_id=eq.${userId}`
            }, () => {
                if (onUpdate) onUpdate();
            })
            .subscribe();

        // Subscribe to subtasks table changes
        const subtasksSubscription = supabase
            .channel('subtasks-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'subtasks'
            }, () => {
                if (onUpdate) onUpdate();
            })
            .subscribe();

        // Subscribe to time_logs table changes
        const timeLogsSubscription = supabase
            .channel('time-logs-channel')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'time_logs',
                filter: `user_id=eq.${userId}`
            }, () => {
                if (onUpdate) onUpdate();
            })
            .subscribe();

        // Return the subscription objects for cleanup
        return {
            tasksSubscription,
            subtasksSubscription,
            timeLogsSubscription
        };
    },

    // Clean up subscriptions
    removeSubscriptions(subscriptions) {
        if (subscriptions.tasksSubscription) {
            supabase.removeChannel(subscriptions.tasksSubscription);
        }

        if (subscriptions.subtasksSubscription) {
            supabase.removeChannel(subscriptions.subtasksSubscription);
        }

        if (subscriptions.timeLogsSubscription) {
            supabase.removeChannel(subscriptions.timeLogsSubscription);
        }
    }
};

export default subscriptionUtils;
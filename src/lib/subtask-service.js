// lib/subtask-service.js
import supabase from './supabase-client';

export const subtaskService = {
    // Add a new subtask
    async addSubtask(taskId, title) {
        try {
            const { data, error } = await supabase
                .from('subtasks')
                .insert([
                    {
                        task_id: taskId,
                        title,
                        is_completed: false
                    }
                ])
                .select();

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error adding subtask:', error);
            return { error };
        }
    },

    // Fetch subtasks for a task
    async fetchSubtasks(taskId) {
        try {
            const { data, error } = await supabase
                .from('subtasks')
                .select('*')
                .eq('task_id', taskId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error fetching subtasks:', error);
            return { error };
        }
    },

    // Update subtask completion status
    async updateSubtaskStatus(subtaskId, isCompleted) {
        try {
            const { data, error } = await supabase
                .from('subtasks')
                .update({ is_completed: isCompleted })
                .eq('id', subtaskId)
                .select();

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error updating subtask status:', error);
            return { error };
        }
    },

    // Delete a subtask
    async deleteSubtask(subtaskId) {
        try {
            const { error } = await supabase
                .from('subtasks')
                .delete()
                .eq('id', subtaskId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting subtask:', error);
            return { error };
        }
    },

    // Calculate task completion percentage
    calculateTaskCompletion(task) {
        if (!task.subtasks || task.subtasks.length === 0) {
            return task.status === 'Completed' ? 100 : 0;
        }

        const completedSubtasks = task.subtasks.filter(subtask => subtask.is_completed).length;
        return Math.round((completedSubtasks / task.subtasks.length) * 100);
    }
};

export default subtaskService;
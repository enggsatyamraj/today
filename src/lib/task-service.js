// lib/task-service.js
import supabase from './supabase-client';

// Task Status Constants
export const TASK_STATUS = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    WORKING_ON: 'Working On',
    COMPLETED: 'Completed'
};

export const taskService = {
    // Fetch all tasks for a user
    async fetchTasks(userId) {
        try {
            // Get tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (tasksError) throw tasksError;

            // Get subtasks for all tasks
            const taskIds = tasksData.map(task => task.id);

            if (taskIds.length > 0) {
                const { data: subtasksData, error: subtasksError } = await supabase
                    .from('subtasks')
                    .select('*')
                    .in('task_id', taskIds)
                    .order('created_at', { ascending: true });

                if (subtasksError) throw subtasksError;

                // Add subtasks to their respective tasks
                const tasksWithSubtasks = tasksData.map(task => ({
                    ...task,
                    subtasks: subtasksData.filter(subtask => subtask.task_id === task.id) || []
                }));

                return { data: tasksWithSubtasks };
            } else {
                return { data: tasksData };
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return { error };
        }
    },

    // Add a new task
    async addTask(userId, title, status = 'Not Started') {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .insert([
                    {
                        user_id: userId,
                        title,
                        status
                    }
                ])
                .select();

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error adding task:', error);
            return { error };
        }
    },

    // Update task title
    async updateTaskTitle(taskId, title) {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .update({ title })
                .eq('id', taskId)
                .select();

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error updating task title:', error);
            return { error };
        }
    },

    // Update task status
    async updateTaskStatus(taskId, status) {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .update({ status })
                .eq('id', taskId)
                .select();

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error updating task status:', error);
            return { error };
        }
    },

    // Update task description
    async updateTaskDescription(taskId, description) {
        try {
            const { data, error } = await supabase
                .from('tasks')
                .update({ description })
                .eq('id', taskId)
                .select();

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error updating task description:', error);
            return { error };
        }
    },

    // Delete a task
    async deleteTask(taskId) {
        try {
            const { error } = await supabase
                .from('tasks')
                .delete()
                .eq('id', taskId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting task:', error);
            return { error };
        }
    },

    // Calculate task statistics
    calculateStatistics(tasks) {
        return {
            total: tasks.length,
            completed: tasks.filter(task => task.status === TASK_STATUS.COMPLETED).length,
            inProgress: tasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS).length,
            notStarted: tasks.filter(task => task.status === TASK_STATUS.NOT_STARTED).length,
            workingOn: tasks.filter(task => task.status === TASK_STATUS.WORKING_ON).length
        };
    }
};

export default taskService;
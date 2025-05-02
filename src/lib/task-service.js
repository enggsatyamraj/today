// lib/task-service.js
import supabase from './supabase-client';

// Legacy Task Status Constants (for backward compatibility)
export const TASK_STATUS = {
    NOT_STARTED: 'Not Started',
    IN_PROGRESS: 'In Progress',
    COMPLETED: 'Completed'
};

export const taskService = {
    // Fetch all tasks for a user with their stages
    async fetchTasks(userId) {
        try {
            // Get tasks
            const { data: tasksData, error: tasksError } = await supabase
                .from('tasks')
                .select(`
                    *,
                    stage:stage_id (*)
                `)
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
                    // Ensure backward compatibility with tasks that might not have a stage
                    status: task.stage ? task.stage.name : task.status,
                    subtasks: subtasksData.filter(subtask => subtask.task_id === task.id) || []
                }));

                return { data: tasksWithSubtasks };
            } else {
                // Ensure backward compatibility with tasks that might not have a stage
                const tasksWithStatus = tasksData.map(task => ({
                    ...task,
                    status: task.stage ? task.stage.name : task.status
                }));
                return { data: tasksWithStatus };
            }
        } catch (error) {
            console.error('Error fetching tasks:', error);
            return { error };
        }
    },

    // Add a new task
    async addTask(userId, title, stageId = null) {
        try {
            // If no stageId is provided, get the first stage (typically "Not Started")
            if (!stageId) {
                const { data: stagesData, error: stagesError } = await supabase
                    .from('task_stages')
                    .select('id')
                    .eq('user_id', userId)
                    .order('order', { ascending: true })
                    .limit(1);

                if (stagesError) throw stagesError;

                if (stagesData && stagesData.length > 0) {
                    stageId = stagesData[0].id;
                }
            }

            const { data, error } = await supabase
                .from('tasks')
                .insert([
                    {
                        user_id: userId,
                        title,
                        stage_id: stageId,
                        // Keep status for backward compatibility
                        status: 'Not Started'
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

    // Update task stage
    async updateTaskStage(taskId, stageId) {
        try {
            // Get the stage name for backward compatibility
            const { data: stageData, error: stageError } = await supabase
                .from('task_stages')
                .select('name')
                .eq('id', stageId)
                .single();

            if (stageError) throw stageError;

            const { data, error } = await supabase
                .from('tasks')
                .update({
                    stage_id: stageId,
                    // Keep status updated for backward compatibility
                    status: stageData.name
                })
                .eq('id', taskId)
                .select();

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error updating task stage:', error);
            return { error };
        }
    },

    // Legacy method - update task status
    async updateTaskStatus(taskId, status) {
        try {
            // Get the stage that matches this status name
            const { data: taskData, error: taskError } = await supabase
                .from('tasks')
                .select('user_id')
                .eq('id', taskId)
                .single();

            if (taskError) throw taskError;

            const { data: stageData, error: stageError } = await supabase
                .from('task_stages')
                .select('id')
                .eq('user_id', taskData.user_id)
                .eq('name', status)
                .single();

            if (stageError && stageError.code !== 'PGRST116') {
                // PGRST116 is "Results contain 0 rows" - we'll handle this case
                throw stageError;
            }

            const stageId = stageData?.id;

            // Update both stage_id and status (for backward compatibility)
            const { data, error } = await supabase
                .from('tasks')
                .update({
                    stage_id: stageId,
                    status
                })
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

    // Calculate task statistics based on stages
    calculateStatistics(tasks) {
        // Group tasks by their status/stage name
        const statusCounts = tasks.reduce((acc, task) => {
            const status = task.status || (task.stage ? task.stage.name : 'Not Started');
            acc[status] = (acc[status] || 0) + 1;
            return acc;
        }, {});

        // For backward compatibility, maintain the old statistics format
        return {
            total: tasks.length,
            completed: statusCounts[TASK_STATUS.COMPLETED] || 0,
            inProgress: statusCounts[TASK_STATUS.IN_PROGRESS] || 0,
            notStarted: statusCounts[TASK_STATUS.NOT_STARTED] || 0,
            workingOn: statusCounts[TASK_STATUS.WORKING_ON] || 0,
            // Add a new property for all statuses
            byStatus: statusCounts
        };
    }
};

export default taskService;
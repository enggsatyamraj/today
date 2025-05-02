// lib/task-stage-service.js
import supabase from './supabase-client';

/*
This service assumes the existence of a 'task_stages' table with structure:
- id: uuid (primary key)
- user_id: uuid (foreign key to auth.users)
- name: text (stage name)
- color: text (color code)
- icon: text (icon name)
- order: integer (display order)
- is_active: boolean (whether to display this stage)
- created_at: timestamp
*/

export const taskStageService = {
    // Fetch all stages for a user
    async fetchStages(userId) {
        try {
            const { data, error } = await supabase
                .from('task_stages')
                .select('*')
                .eq('user_id', userId)
                .order('order', { ascending: true });

            if (error) throw error;

            return { data };
        } catch (error) {
            console.error('Error fetching task stages:', error);
            return { error, data: [] };
        }
    },

    // Add a new stage
    async addStage(userId, stage) {
        try {
            // Get the maximum order value to place the new stage at the end
            const { data: stagesData, error: stagesError } = await supabase
                .from('task_stages')
                .select('order')
                .eq('user_id', userId)
                .order('order', { ascending: false })
                .limit(1);

            if (stagesError) throw stagesError;

            const maxOrder = stagesData && stagesData.length > 0 ? stagesData[0].order : 0;

            const newStage = {
                user_id: userId,
                name: stage.name,
                color: stage.color || '#9CA3AF',
                icon: stage.icon || 'Circle',
                order: maxOrder + 1,
                is_active: stage.is_active !== undefined ? stage.is_active : true,
            };

            const { data, error } = await supabase
                .from('task_stages')
                .insert([newStage])
                .select();

            if (error) throw error;

            return { data };
        } catch (error) {
            console.error('Error adding task stage:', error);
            return { error };
        }
    },

    // Update a stage
    async updateStage(stageId, updates) {
        try {
            const { data, error } = await supabase
                .from('task_stages')
                .update(updates)
                .eq('id', stageId)
                .select();

            if (error) throw error;

            return { data };
        } catch (error) {
            console.error('Error updating task stage:', error);
            return { error };
        }
    },

    // Delete a stage
    async deleteStage(stageId, fallbackStageId) {
        try {
            // First, update any tasks using this stage to the fallback stage
            if (fallbackStageId) {
                const { error: updateError } = await supabase
                    .from('tasks')
                    .update({ stage_id: fallbackStageId })
                    .eq('stage_id', stageId);

                if (updateError) throw updateError;
            }

            // Then delete the stage
            const { error: deleteError } = await supabase
                .from('task_stages')
                .delete()
                .eq('id', stageId);

            if (deleteError) throw deleteError;

            return { success: true };
        } catch (error) {
            console.error('Error deleting task stage:', error);
            return { error };
        }
    },

    // Reorder stages
    async reorderStages(userId, stageIds) {
        try {
            // Update the order for each stage
            const updates = stageIds.map((id, index) => ({
                id,
                order: index + 1
            }));

            // Batch update using upsert
            const { error } = await supabase
                .from('task_stages')
                .upsert(updates, { onConflict: 'id' });

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error reordering task stages:', error);
            return { error };
        }
    },

    // Set up default stages for a new user
    async createDefaultStages(userId) {
        try {
            const defaultStages = [
                {
                    user_id: userId,
                    name: 'Not Started',
                    color: '#9CA3AF', // gray-400
                    icon: 'Circle',
                    order: 1,
                    is_active: true
                },
                {
                    user_id: userId,
                    name: 'In Progress',
                    color: '#3B82F6', // blue-500
                    icon: 'Play',
                    order: 2,
                    is_active: true
                },
                {
                    user_id: userId,
                    name: 'Completed',
                    color: '#34D399', // emerald-400
                    icon: 'CheckCircle',
                    order: 3,
                    is_active: true
                }
            ];

            const { error } = await supabase
                .from('task_stages')
                .insert(defaultStages);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error creating default task stages:', error);
            return { error };
        }
    },

    // Get all active stages with icons
    async getActiveStagesWithIcons(userId) {
        try {
            const { data, error } = await supabase
                .from('task_stages')
                .select('*')
                .eq('user_id', userId)
                .eq('is_active', true)
                .order('order', { ascending: true });

            if (error) throw error;

            return { data };
        } catch (error) {
            console.error('Error fetching active task stages:', error);
            return { error, data: [] };
        }
    }
};

export default taskStageService;
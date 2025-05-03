// src/lib/user-settings-service.js
import supabase from './supabase-client';

export const userSettingsService = {
    // Get user settings
    async getUserSettings(userId) {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code !== 'PGRST116') {
                // PGRST116 is "Results contain 0 rows" - we'll handle this case
                throw error;
            }

            // If no settings exist yet, create default settings
            if (!data) {
                return await this.createDefaultSettings(userId);
            }

            return { data };
        } catch (error) {
            console.error('Error fetching user settings:', error);
            return { error };
        }
    },

    // Create default settings for a new user
    async createDefaultSettings(userId) {
        try {
            const defaultSettings = {
                user_id: userId,
                work_start_time: '09:00',
                work_end_time: '17:00',
                auto_delete_tasks: false,
                keep_completed_tasks: true,
            };

            const { data, error } = await supabase
                .from('user_settings')
                .insert([defaultSettings])
                .select();

            if (error) throw error;

            return { data: data[0] };
        } catch (error) {
            console.error('Error creating default user settings:', error);
            return { error };
        }
    },

    // Update user settings
    async updateUserSettings(userId, settings) {
        try {
            // First check if settings exist
            const { data: existingData } = await this.getUserSettings(userId);

            if (existingData) {
                // Update existing settings
                const { data, error } = await supabase
                    .from('user_settings')
                    .update(settings)
                    .eq('user_id', userId)
                    .select();

                if (error) throw error;
                return { data: data[0] };
            } else {
                // Create new settings with provided values
                const newSettings = {
                    user_id: userId,
                    ...settings
                };

                const { data, error } = await supabase
                    .from('user_settings')
                    .insert([newSettings])
                    .select();

                if (error) throw error;
                return { data: data[0] };
            }
        } catch (error) {
            console.error('Error updating user settings:', error);
            return { error };
        }
    },

    async completeOnboarding(userId, settings) {
        try {
            // First check if settings exist
            const { data: existingData } = await this.getUserSettings(userId);

            const onboardingSettings = {
                work_start_time: settings.work_start_time || '09:00',
                work_end_time: settings.work_end_time || '17:00',
                auto_delete_tasks: settings.auto_delete_tasks !== undefined ? settings.auto_delete_tasks : true,
                remove_completed_tasks: settings.remove_completed_tasks !== undefined ? settings.remove_completed_tasks : true,
                onboarding_completed: true
            };

            if (existingData) {
                // Update existing settings
                const { data, error } = await supabase
                    .from('user_settings')
                    .update(onboardingSettings)
                    .eq('user_id', userId)
                    .select();

                if (error) throw error;
                return { data: data[0] };
            } else {
                // Create new settings with provided values
                const newSettings = {
                    user_id: userId,
                    ...onboardingSettings
                };

                const { data, error } = await supabase
                    .from('user_settings')
                    .insert([newSettings])
                    .select();

                if (error) throw error;
                return { data: data[0] };
            }
        } catch (error) {
            console.error('Error during onboarding:', error);
            return { error };
        }
    }
};

export default userSettingsService;
// lib/profile-service.js
import supabase from './supabase-client';

export const profileService = {
    // Create a new profile
    async createProfile(userId, displayName, email) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .insert([
                    {
                        id: userId,
                        display_name: displayName.trim(),
                        email: email.toLowerCase()
                    }
                ]);

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error creating profile:', error);
            return { error };
        }
    },

    // Check if a display name is already taken
    async isDisplayNameTaken(displayName) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('id')
                .eq('display_name', displayName.trim());

            if (error) throw error;

            return data && data.length > 0;
        } catch (error) {
            console.error('Error checking display name:', error);
            return true; // Assume taken in case of error to be safe
        }
    },

    // Get profile by user ID
    async getProfileById(userId) {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return { data };
        } catch (error) {
            console.error('Error fetching profile:', error);
            return { error };
        }
    }
};

// Function to create a profile from webhook or server-side
export async function handlePostSignUp(event) {
    // This would be used in a server-side function
    // like a Supabase Edge Function or similar
    try {
        const { user } = event;

        if (!user || !user.user_metadata?.display_name) {
            return { error: 'Missing user data' };
        }

        return await profileService.createProfile(
            user.id,
            user.user_metadata.display_name,
            user.email
        );
    } catch (error) {
        console.error('Error in post sign-up:', error);
        return { error };
    }
}
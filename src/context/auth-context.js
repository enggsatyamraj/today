// context/auth-context.js
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import supabase from '@/lib/supabase-client';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const getSession = async () => {
            const { data: { session }, error } = await supabase.auth.getSession();

            if (session) {
                setUser(session.user);
            }

            setLoading(false);
        };

        getSession();

        // Set up auth state listener
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                setUser(session?.user || null);
                setLoading(false);
            }
        );

        return () => {
            subscription?.unsubscribe();
        };
    }, []);

    const signIn = (email, password) => {
        return supabase.auth.signInWithPassword({ email, password });
    };

    const signUp = (email, password) => {
        return supabase.auth.signUp({ email, password });
    };

    const signOut = () => {
        return supabase.auth.signOut();
    };

    return (
        <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
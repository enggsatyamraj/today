'use client';

import { useAuth } from '@/context/auth-context';
import ProtectedRoute from '@/components/protected-route';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({ children }) {
    const { user } = useAuth();

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />

                {/* Main content */}
                <main className="flex-1 container mx-auto px-4 py-6">
                    {children}
                </main>

                {/* Footer */}
                <footer className="bg-white border-t py-4">
                    <div className="container mx-auto px-4">
                        <p className="text-center text-sm text-gray-600">
                            Today Focus - Stay productive and focused on today
                        </p>
                    </div>
                </footer>
            </div>
        </ProtectedRoute>
    );
}
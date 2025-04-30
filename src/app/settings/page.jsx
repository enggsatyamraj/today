'use client';

import { useState } from 'react';
import { useAuth } from '@/context/auth-context';
import ProtectedRoute from '@/components/protected-route';
import Navbar from '@/components/Navbar';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger
} from '@/components/ui/tabs';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings, Layers, User } from 'lucide-react';
import StageManager from '@/components/StageManager';

export default function SettingsPage() {
    const { user } = useAuth();
    const [showStageManager, setShowStageManager] = useState(false);

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <Navbar />

                <main className="flex-1 container mx-auto px-4 py-6">
                    <div className="flex items-center mb-6">
                        <Settings className="h-6 w-6 mr-2 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
                    </div>

                    {showStageManager ? (
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-xl font-semibold">Manage Task Stages</h2>
                                <Button
                                    variant="outline"
                                    onClick={() => setShowStageManager(false)}
                                >
                                    Back to Settings
                                </Button>
                            </div>
                            <StageManager
                                onClose={() => setShowStageManager(false)}
                                onStagesUpdated={() => {
                                    // Add any refresh logic here if needed
                                }}
                            />
                        </div>
                    ) : (
                        <Tabs defaultValue="general">
                            <TabsList className="mb-6">
                                <TabsTrigger value="general">General</TabsTrigger>
                                <TabsTrigger value="tasks">Tasks</TabsTrigger>
                                <TabsTrigger value="account">Account</TabsTrigger>
                            </TabsList>

                            <TabsContent value="general">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>General Settings</CardTitle>
                                        <CardDescription>
                                            Manage general application settings
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-gray-500">
                                            General settings will be available in a future update.
                                        </p>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="tasks">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Task Settings</CardTitle>
                                        <CardDescription>
                                            Customize how tasks are displayed and managed
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="border p-4 rounded-md">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-start">
                                                    <Layers className="h-5 w-5 mr-2 text-blue-600 mt-0.5" />
                                                    <div>
                                                        <h3 className="font-medium">Task Stages</h3>
                                                        <p className="text-sm text-gray-500">
                                                            Customize the stages for your tasks (Not Started, In Progress, etc.)
                                                        </p>
                                                    </div>
                                                </div>
                                                <Button onClick={() => setShowStageManager(true)}>
                                                    Manage Stages
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>

                            <TabsContent value="account">
                                <Card>
                                    <CardHeader>
                                        <CardTitle>Account Settings</CardTitle>
                                        <CardDescription>
                                            Manage your account details and preferences
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex items-center space-x-4">
                                            <div className="bg-blue-100 text-blue-700 h-12 w-12 rounded-full flex items-center justify-center">
                                                <User className="h-6 w-6" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{user?.email}</p>
                                                <p className="text-xs text-gray-500">User ID: {user?.id?.substring(0, 8)}...</p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    )}
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
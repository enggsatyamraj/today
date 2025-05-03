import { useState, useEffect } from 'react';
import { TimePickerInput } from '@/components/ui/time-picker';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Clock, Trash2, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import userSettingsService from '@/lib/user-settings-service';
import { Alert, AlertDescription } from '@/components/ui/alert';

function WorkHoursSettings() {
    const { user } = useAuth();
    const [startTime, setStartTime] = useState('09:00');
    const [endTime, setEndTime] = useState('17:00');
    const [autoDeleteTasks, setAutoDeleteTasks] = useState(false);
    const [keepCompletedTasks, setKeepCompletedTasks] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [error, setError] = useState(null);

    // Load user settings when component mounts
    useEffect(() => {
        if (user) {
            loadUserSettings();
        }
    }, [user]);

    const loadUserSettings = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data, error } = await userSettingsService.getUserSettings(user.id);

            if (error) throw error;

            if (data) {
                // Format time strings to handle both HH:MM and HH:MM:SS formats
                const formatTimeString = (timeStr) => {
                    if (!timeStr) return '09:00';
                    return timeStr.substring(0, 5); // Take just HH:MM part
                };

                setStartTime(formatTimeString(data.work_start_time));
                setEndTime(formatTimeString(data.work_end_time));
                setAutoDeleteTasks(data.auto_delete_tasks || false);
                setKeepCompletedTasks(data.remove_completed_tasks || true);
            }
        } catch (error) {
            console.error('Error loading user settings:', error);
            setError('Failed to load settings. Please refresh the page and try again.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        if (e) e.preventDefault();

        setIsSaving(true);
        setError(null);
        setIsSaved(false);

        try {
            const settings = {
                work_start_time: startTime,
                work_end_time: endTime,
                auto_delete_tasks: autoDeleteTasks,
                remove_completed_tasks: keepCompletedTasks
            };

            const { error } = await userSettingsService.updateUserSettings(user.id, settings);

            if (error) throw error;

            // Show success message briefly
            setIsSaved(true);
            setTimeout(() => setIsSaved(false), 3000);

            // Dispatch a custom event to notify other components (like Dashboard)
            // that settings have been updated
            window.dispatchEvent(new CustomEvent('settings-updated'));
        } catch (err) {
            console.error('Error saving settings:', err);
            setError('Failed to save settings. Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    // Helper to format time for display
    const formatTimeDisplay = (timeString) => {
        if (!timeString) return '';

        // Extract HH:MM from the time string
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Work Hours & Task Management
                </CardTitle>
                <CardDescription>
                    Customize your daily work schedule and how tasks are managed at the end of your day
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {error && (
                    <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}

                {isSaved && (
                    <Alert className="bg-green-50 border-green-200 text-green-800">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <AlertDescription>Settings saved successfully!</AlertDescription>
                    </Alert>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                        <div>
                            <h3 className="text-md font-medium mb-2">Work Hours</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Set your daily start and end times to personalize your focus periods
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start-time">Start Time</Label>
                                    <TimePickerInput
                                        id="start-time"
                                        value={startTime}
                                        onChange={setStartTime}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatTimeDisplay(startTime)}
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="end-time">End Time</Label>
                                    <TimePickerInput
                                        id="end-time"
                                        value={endTime}
                                        onChange={setEndTime}
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        {formatTimeDisplay(endTime)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="border-t pt-4">
                            <h3 className="text-md font-medium mb-2">End of Day Task Management</h3>
                            <p className="text-sm text-gray-500 mb-4">
                                Configure how your tasks are handled when your work day ends
                            </p>

                            <div className="flex items-center justify-between">
                                <div>
                                    <Label htmlFor="auto-delete" className="font-medium">
                                        Enable end-of-day task cleanup
                                    </Label>
                                    <p className="text-sm text-gray-500">
                                        Automatically clean up tasks at the end of your workday
                                    </p>
                                </div>
                                <Switch
                                    id="auto-delete"
                                    checked={autoDeleteTasks}
                                    onCheckedChange={setAutoDeleteTasks}
                                />
                            </div>

                            {autoDeleteTasks && (
                                <div className="flex items-center justify-between pl-6 border-l-2 mt-3 border-gray-200">
                                    <div>
                                        <Label htmlFor="keep-completed" className="font-medium">
                                            Remove completed tasks
                                        </Label>
                                        <p className="text-sm text-gray-500">
                                            Clean up tasks you've completed, keep incomplete ones for tomorrow
                                        </p>
                                    </div>
                                    <Switch
                                        id="keep-completed"
                                        checked={keepCompletedTasks}
                                        onCheckedChange={setKeepCompletedTasks}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading || isSaving}
                            className="relative"
                        >
                            {isSaving ? 'Saving...' : 'Save Settings'}
                            {!isSaving && <Save className="h-4 w-4 ml-2" />}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}

export default WorkHoursSettings;
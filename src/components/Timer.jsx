'use client';

import { useState, useEffect, useRef } from 'react';
import { format, differenceInSeconds, addDays } from 'date-fns';
import { Play, Pause, StopCircle, Clock, Calendar, AlertTriangle, Sunrise, Sunset } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import userSettingsService from '@/lib/user-settings-service';
import { useAuth } from '@/context/auth-context';

export default function Timer({
    task,
    isRunning,
    isPaused,
    onStop,
    onPause,
    onResume
}) {
    const { user } = useAuth();
    const [currentTime, setCurrentTime] = useState(new Date());
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isUrgent, setIsUrgent] = useState(false);
    const [workHours, setWorkHours] = useState({
        startTime: '09:00',
        endTime: '17:00',
        isWithinWorkHours: true
    });
    const [timeLeft, setTimeLeft] = useState(0);
    const timerRef = useRef(null);

    // Calculate time left until the specified time (in seconds)
    function calculateTimeLeftUntil(now, endTimeStr) {
        // Parse end time
        const [endHour, endMinute] = endTimeStr.split(':').map(Number);

        // Create a date object for the end time today
        const endTime = new Date(now);
        endTime.setHours(endHour, endMinute, 0, 0);

        // If end time has already passed today, use tomorrow's end time
        if (now > endTime) {
            endTime.setDate(endTime.getDate() + 1);
        }

        return differenceInSeconds(endTime, now);
    }

    // Calculate time left in the day (in seconds)
    function calculateTimeLeftInDay(now, endTime = '17:00') {
        return calculateTimeLeftUntil(now, endTime);
    }

    // Initialize timeLeft with a default value
    useEffect(() => {
        setTimeLeft(calculateTimeLeftInDay(new Date()));
    }, []);

    // Check if current time is within working hours
    function isWithinWorkingHours(startTime, endTime, now) {
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

        // Parse start and end times
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);

        // Handle overnight shifts (when end time is earlier than start time)
        const isOvernightShift = startTime > endTime;

        if (isOvernightShift) {
            return currentTimeStr >= startTime || currentTimeStr <= endTime;
        } else {
            return currentTimeStr >= startTime && currentTimeStr <= endTime;
        }
    }

    // Fetch user work hours settings
    const fetchWorkHours = async () => {
        if (!user) return;

        try {
            const { data, error } = await userSettingsService.getUserSettings(user.id);

            if (error) throw error;

            if (data) {
                // Format time strings
                const formatTimeString = (timeStr) => {
                    if (!timeStr) return '09:00';
                    return timeStr.substring(0, 5); // Take just HH:MM part
                };

                const startTime = formatTimeString(data.work_start_time);
                const endTime = formatTimeString(data.work_end_time);

                setWorkHours({
                    startTime,
                    endTime,
                    isWithinWorkHours: isWithinWorkingHours(startTime, endTime, new Date())
                });

                // Recalculate time left based on end time
                setTimeLeft(calculateTimeLeftInDay(new Date(), endTime));
            }
        } catch (error) {
            console.error('Error fetching work hours settings:', error);
        }
    };

    // Listen for settings updates
    useEffect(() => {
        const handleSettingsUpdated = () => {
            fetchWorkHours();
        };

        window.addEventListener('settings-updated', handleSettingsUpdated);

        return () => {
            window.removeEventListener('settings-updated', handleSettingsUpdated);
        };
    }, []);

    // Initial fetch of work hours and setup
    useEffect(() => {
        fetchWorkHours();
    }, [user]);

    // Set up ticking clock and time calculations
    useEffect(() => {
        // Update time every second
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            // Update time left based on end time
            const timeRemaining = calculateTimeLeftInDay(now, workHours.endTime);
            setTimeLeft(timeRemaining);

            // Update work hours status
            if (workHours.startTime && workHours.endTime) {
                setWorkHours(prev => ({
                    ...prev,
                    isWithinWorkHours: isWithinWorkingHours(prev.startTime, prev.endTime, now)
                }));
            }

            // Set urgency state when less than 15% of workday remains
            const workdayLengthInSeconds = calculateWorkdayLengthInSeconds();
            const urgencyThreshold = Math.min(14400, workdayLengthInSeconds * 0.15); // 4 hours or 15% of workday

            if (timeRemaining < urgencyThreshold) {
                setIsUrgent(true);
            } else {
                setIsUrgent(false);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, [workHours.startTime, workHours.endTime]);

    // Calculate workday length in seconds
    function calculateWorkdayLengthInSeconds() {
        if (!workHours.startTime || !workHours.endTime) {
            return 8 * 60 * 60; // Default 8 hours
        }

        const [startHour, startMinute] = workHours.startTime.split(':').map(Number);
        const [endHour, endMinute] = workHours.endTime.split(':').map(Number);

        let startSeconds = startHour * 3600 + startMinute * 60;
        let endSeconds = endHour * 3600 + endMinute * 60;

        // Handle overnight shifts
        if (endSeconds < startSeconds) {
            endSeconds += 24 * 3600; // Add 24 hours
        }

        return endSeconds - startSeconds;
    }

    // Handle elapsed time tracking for the current task
    useEffect(() => {
        if (isRunning && !isPaused && task) {
            timerRef.current = setInterval(() => {
                setElapsedTime(prev => prev + 1);
            }, 1000);
        } else if (timerRef.current) {
            clearInterval(timerRef.current);
        }

        return () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
            }
        };
    }, [isRunning, isPaused, task]);

    // Calculate percentage of day completed
    const workdayLengthInSeconds = calculateWorkdayLengthInSeconds();
    const timeElapsedInWorkday = workdayLengthInSeconds - timeLeft;
    const percentOfDayCompleted = Math.min(100, Math.max(0, (timeElapsedInWorkday / workdayLengthInSeconds * 100)));

    // Format time remaining in HH:MM:SS
    const formatTimeLeft = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        return [
            hours.toString().padStart(2, '0'),
            minutes.toString().padStart(2, '0'),
            secs.toString().padStart(2, '0')
        ].join(':');
    };

    // Format elapsed time for the current task
    const formatElapsedTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours}h ${minutes}m ${secs}s`;
        } else {
            return `${minutes}m ${secs}s`;
        }
    };

    // Format time for display (12-hour with AM/PM)
    const formatTimeDisplay = (timeString) => {
        if (!timeString) return '';

        // Extract HH:MM from the time string
        const [hours, minutes] = timeString.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Get progress bar color based on time left and workday percentage
    const getProgressColor = () => {
        if (percentOfDayCompleted > 85) { // Last 15% of workday
            return 'bg-red-500';
        } else if (percentOfDayCompleted > 75) { // Last 25% of workday
            return 'bg-amber-500';
        } else if (percentOfDayCompleted > 50) { // Second half of workday
            return 'bg-blue-500';
        } else {
            return 'bg-green-500';
        }
    };

    return (
        <Card className={`${isRunning ? 'border-green-500 bg-green-50' : isUrgent ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-white'} mt-4 transition-all`}>
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center">
                        <Clock className={`h-5 w-5 mr-2 ${isUrgent && !isRunning ? 'text-red-600 animate-pulse' : 'text-gray-600'}`} />
                        <div>
                            <div className={`text-xl font-mono ${isUrgent && !isRunning ? 'text-red-600' : ''}`}>{format(currentTime, 'HH:mm:ss')}</div>
                            <div className="text-sm text-gray-500">{format(currentTime, 'EEEE, MMMM d, yyyy')}</div>
                            <div className="mt-1 flex items-center text-xs">
                                <Badge
                                    className={workHours.isWithinWorkHours
                                        ? "bg-green-100 text-green-800 hover:bg-green-100"
                                        : "bg-gray-100 text-gray-800 hover:bg-gray-100"
                                    }
                                >
                                    <span className="flex items-center">
                                        {workHours.isWithinWorkHours ? (
                                            <>
                                                <Sunrise className="h-3 w-3 mr-1" />
                                                Work Hours
                                            </>
                                        ) : (
                                            <>
                                                <Sunset className="h-3 w-3 mr-1" />
                                                After Hours
                                            </>
                                        )}
                                    </span>
                                </Badge>
                                <span className="ml-2 text-gray-500">
                                    {formatTimeDisplay(workHours.startTime)} - {formatTimeDisplay(workHours.endTime)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 mx-4 hidden sm:block">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Workday Progress</span>
                            <span className={isUrgent ? 'text-red-600 font-medium' : ''}>{Math.round(percentOfDayCompleted)}%</span>
                        </div>
                        <Progress value={percentOfDayCompleted} className="h-2" indicatorClassName={getProgressColor()} />
                    </div>

                    <div className="flex flex-col items-end">
                        <div className={`text-gray-600 text-sm ${isUrgent ? 'text-red-600' : ''}`}>
                            {workHours.isWithinWorkHours ? 'Time left in workday' : 'Time until next workday'}
                        </div>
                        <div className={`text-xl font-mono ${isUrgent ? 'text-red-600 font-bold' : ''}`}>
                            {formatTimeLeft(timeLeft)}
                        </div>
                    </div>
                </div>

                {isRunning && task && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center">
                                <div className={`${isPaused ? 'bg-amber-100' : 'bg-green-100'} p-1 rounded-full mr-2`}>
                                    {isPaused ? (
                                        <Pause className="h-3 w-3 text-amber-600" />
                                    ) : (
                                        <Play className="h-3 w-3 text-green-600" />
                                    )}
                                </div>
                                <div>
                                    <div className="text-sm font-medium">
                                        {isPaused ? 'Paused:' : 'Currently working on:'}
                                    </div>
                                    <div className="text-sm text-gray-600">{task.title}</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-xs text-gray-500">Time elapsed</div>
                                <div className="text-sm font-mono font-medium">
                                    {formatElapsedTime(elapsedTime)}
                                </div>
                            </div>
                        </div>

                        <div className="flex gap-2 mt-3">
                            {isPaused ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-700 border-green-300 hover:bg-green-50"
                                    onClick={onResume}
                                >
                                    <Play className="h-3 w-3 mr-1" />
                                    Resume
                                </Button>
                            ) : (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-amber-700 border-amber-300 hover:bg-amber-50"
                                    onClick={onPause}
                                >
                                    <Pause className="h-3 w-3 mr-1" />
                                    Pause
                                </Button>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-700 border-red-300 hover:bg-red-50"
                                onClick={onStop}
                            >
                                <StopCircle className="h-3 w-3 mr-1" />
                                Stop
                            </Button>
                        </div>
                    </div>
                )}

                {!isRunning && isUrgent && (
                    <Alert className="mt-3 bg-red-50 text-red-800 border-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            {Math.floor(timeLeft / 3600) < 1
                                ? `Less than ${Math.floor(timeLeft / 60)} minutes remaining in your workday!`
                                : `Less than ${Math.floor(timeLeft / 3600)} hours remaining in your workday!`}
                            Prioritize your most important tasks.
                        </AlertDescription>
                    </Alert>
                )}

                {!isRunning && !workHours.isWithinWorkHours && (
                    <Alert className="mt-3 bg-blue-50 text-blue-800 border-blue-200">
                        <Clock className="h-4 w-4" />
                        <AlertDescription>
                            You're outside your configured work hours. Any tasks you create now will be ready for you when your next workday starts at {formatTimeDisplay(workHours.startTime)}.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
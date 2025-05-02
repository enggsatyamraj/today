'use client';

import { useState, useEffect, useRef } from 'react';
import { format, differenceInSeconds, addDays } from 'date-fns';
import { Play, Pause, StopCircle, Clock, Calendar, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function Timer({
    task,
    isRunning,
    isPaused,
    onStop,
    onPause,
    onResume
}) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeftInDay(new Date()));
    const [elapsedTime, setElapsedTime] = useState(0);
    const [isUrgent, setIsUrgent] = useState(false);
    const timerRef = useRef(null);

    // Set up ticking clock and time calculations
    useEffect(() => {
        // Update time every second
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            setTimeLeft(calculateTimeLeftInDay(now));

            // Set urgency state when less than 4 hours remain in the day
            if (calculateTimeLeftInDay(now) < 14400 && !isUrgent) {
                setIsUrgent(true);
            }
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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

    // Calculate time left in the day (in seconds)
    function calculateTimeLeftInDay(now) {
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        return differenceInSeconds(endOfDay, now);
    }

    // Calculate percentage of day completed
    const totalSecondsInDay = 24 * 60 * 60;
    const percentOfDayCompleted = 100 - (timeLeft / totalSecondsInDay * 100);

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

    // Get progress bar color based on time left
    const getProgressColor = () => {
        if (timeLeft < 7200) { // Less than 2 hours
            return 'bg-red-500';
        } else if (timeLeft < 14400) { // Less than 4 hours
            return 'bg-amber-500';
        } else if (timeLeft < 28800) { // Less than 8 hours
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
                        </div>
                    </div>

                    <div className="flex-1 mx-4 hidden sm:block">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Day Progress</span>
                            <span className={timeLeft < 14400 ? 'text-red-600 font-medium' : ''}>{Math.round(percentOfDayCompleted)}%</span>
                        </div>
                        <Progress value={percentOfDayCompleted} className="h-2" indicatorClassName={getProgressColor()} />
                    </div>

                    <div className="flex flex-col items-end">
                        <div className={`text-gray-600 text-sm ${timeLeft < 14400 ? 'text-red-600' : ''}`}>Time remaining today</div>
                        <div className={`text-xl font-mono ${timeLeft < 14400 ? 'text-red-600 font-bold' : ''}`}>{formatTimeLeft(timeLeft)}</div>
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
                        </div>
                    )}
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
                    </div>
                )}

                {!isRunning && isUrgent && (
                    <Alert className="mt-3 bg-red-50 text-red-800 border-red-200">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            Less than {Math.floor(timeLeft / 3600)} hours remaining in your day! Prioritize your most important tasks.
                        </AlertDescription>
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
}
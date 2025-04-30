'use client';

import { useState, useEffect } from 'react';
import { format, differenceInSeconds, addDays } from 'date-fns';
import { Play, Pause, StopCircle, Clock, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export default function Timer({
    task,
    isRunning,
    onStop
}) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeftInDay(new Date()));

    useEffect(() => {
        // Update time every second
        const interval = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);
            setTimeLeft(calculateTimeLeftInDay(now));
        }, 1000);

        return () => clearInterval(interval);
    }, []);

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

    return (
        <Card className={`${isRunning ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'} mt-4`}>
            <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div className="flex items-center">
                        <Clock className="h-5 w-5 mr-2 text-gray-600" />
                        <div>
                            <div className="text-xl font-mono">{format(currentTime, 'HH:mm:ss')}</div>
                            <div className="text-sm text-gray-500">{format(currentTime, 'EEEE, MMMM d, yyyy')}</div>
                        </div>
                    </div>

                    <div className="flex-1 mx-4 hidden sm:block">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                            <span>Day Progress</span>
                            <span>{Math.round(percentOfDayCompleted)}%</span>
                        </div>
                        <Progress value={percentOfDayCompleted} className="h-2" />
                    </div>

                    <div className="flex flex-col items-end">
                        <div className="text-gray-600 text-sm">Time remaining today</div>
                        <div className="text-xl font-mono">{formatTimeLeft(timeLeft)}</div>
                    </div>

                    {isRunning && task && (
                        <div className="flex items-center ml-4">
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-600"
                                onClick={onStop}
                            >
                                <StopCircle className="h-4 w-4 mr-1" /> Stop Timer
                            </Button>
                        </div>
                    )}
                </div>

                {isRunning && task && (
                    <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="flex items-center">
                            <div className="bg-green-100 p-1 rounded-full mr-2">
                                <Play className="h-3 w-3 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm font-medium">Currently working on:</div>
                                <div className="text-sm text-gray-600">{task.title}</div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
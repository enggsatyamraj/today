'use client';

import { useState, useEffect } from 'react';
import { X, Pause, Play, CheckCircle, Clock, StopCircle, CheckSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import subtaskService from '@/lib/subtask-service';

export default function FocusMode({
    task,
    isRunning,
    isPaused,
    elapsedTime,
    onClose,
    onPause,
    onResume,
    onStop,
    onSubtaskUpdate
}) {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [completionPercentage, setCompletionPercentage] = useState(0);

    // Update current time and completion percentage
    useEffect(() => {
        // Update time every second
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);

        // Calculate task completion
        if (task && task.subtasks) {
            const percentage = subtaskService.calculateTaskCompletion(task);
            setCompletionPercentage(percentage);
        }

        return () => clearInterval(interval);
    }, [task, task?.subtasks]);

    // Format elapsed time
    const formatElapsedTime = (seconds) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    };

    // Handle subtask toggle
    const handleSubtaskToggle = async (subtaskId, isCompleted) => {
        if (onSubtaskUpdate) {
            onSubtaskUpdate(subtaskId, isCompleted);
        }
    };

    if (!task) return null;

    return (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col p-6 overflow-auto">
            {/* Top section with close button and time */}
            <div className="flex justify-between items-center mb-8">
                <div className="flex items-center space-x-3">
                    <CheckSquare className="h-6 w-6" />
                    <h2 className="text-xl font-medium">Focus Mode</h2>
                </div>
                <div className="flex items-center space-x-4">
                    <div className="text-2xl font-mono">
                        {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-white duration-300 cursor-pointer rounded-full"
                        onClick={onClose}
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </div>
            </div>

            {/* Main content */}
            <div className="max-w-2xl mx-auto w-full flex-1 flex flex-col">
                {/* Timer */}
                <div className="mb-10 flex flex-col items-center">
                    <div className="text-6xl font-mono font-light mb-4">
                        {formatElapsedTime(elapsedTime)}
                    </div>
                    <div className="flex space-x-4">
                        {isPaused ? (
                            <Button
                                variant="outline"
                                className="border-green-500 text-green-400 cursor-pointer hover:scale-105 transition-transform duration-300"
                                onClick={onResume}
                                size="lg"
                            >
                                <Play className="h-5 w-5 mr-2" />
                                Resume
                            </Button>
                        ) : (
                            <Button
                                variant="outline"
                                className="border-amber-500 text-amber-400 cursor-pointer  hover:scale-105 transition-transform duration-300"
                                onClick={onPause}
                                size="lg"
                            >
                                <Pause className="h-5 w-5 mr-2" />
                                Pause
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            className="border-red-500 text-red-400 cursor-pointer hover:scale-105 transition-transform duration-300"
                            onClick={onStop}
                            size="lg"
                        >
                            <StopCircle className="h-5 w-5 mr-2" />
                            End Session
                        </Button>
                    </div>
                </div>

                {/* Task title and details */}
                <div className="border border-white/20 rounded-xl p-6 mb-8 backdrop-blur-sm bg-white/5">
                    <h2 className="text-2xl font-medium mb-3">{task.title}</h2>

                    {task.description && (
                        <p className="text-gray-300 mb-4">{task.description}</p>
                    )}

                    <div className="flex gap-2 mb-4">
                        <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                            {task.status}
                        </Badge>

                        {task.due_date && (
                            <Badge variant="outline" className="bg-white/10 text-white border-white/20">
                                <Clock className="h-3 w-3 mr-1" />
                                {new Date(task.due_date).toLocaleDateString()}
                            </Badge>
                        )}
                    </div>

                    {/* Task progress */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mb-2">
                            <div className="flex justify-between text-sm text-gray-300 mb-2">
                                <div className="flex items-center">
                                    <CheckCircle className="h-4 w-4 mr-1" />
                                    <span>Progress</span>
                                </div>
                                <div>
                                    {task.subtasks.filter(st => st.is_completed).length}/{task.subtasks.length} completed
                                </div>
                            </div>
                            <div className="mb-1 w-full h-3 bg-gray-800 rounded-full overflow-hidden border border-gray-700">
                                <div
                                    className={`h-full rounded-full ${completionPercentage === 100
                                            ? "bg-green-400"
                                            : completionPercentage > 50
                                                ? "bg-blue-400"
                                                : "bg-amber-400"
                                        }`}
                                    style={{ width: `${completionPercentage}%` }}
                                ></div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Subtasks */}
                {task.subtasks && task.subtasks.length > 0 && (
                    <div className="border border-white/20 rounded-xl p-6 backdrop-blur-sm bg-white/5">
                        <h3 className="text-lg font-medium mb-4 flex items-center">
                            <CheckSquare className="h-5 w-5 mr-2" />
                            Subtasks
                        </h3>
                        <div className="space-y-3">
                            {task.subtasks.map(subtask => (
                                <div key={subtask.id} className="flex items-start p-2 rounded hover:bg-white/5 transition-colors group">
                                    <Checkbox
                                        id={`focus-subtask-${subtask.id}`}
                                        checked={subtask.is_completed}
                                        onCheckedChange={(checked) => handleSubtaskToggle(subtask.id, checked)}
                                        className={`mt-0.5 ${subtask.is_completed ? "text-green-500 border-green-500" : "border-white/30"}`}
                                    />
                                    <label
                                        htmlFor={`focus-subtask-${subtask.id}`}
                                        className={`ml-2 text-sm ${subtask.is_completed ? 'line-through text-gray-400' : 'text-white'}`}
                                    >
                                        {subtask.title}
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
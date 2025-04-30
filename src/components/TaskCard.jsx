'use client';

import {
    MoreHorizontal,
    Clock,
    CheckCircle2,
    Timer,
    MessageSquare
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import subtaskService from '@/lib/subtask-service';
import timeTrackingService from '@/lib/time-tracking-service';

export default function TaskCard({
    task,
    columns,
    onOpenTask,
    onStatusChange,
    onDelete,
    onStartTimer
}) {
    // Calculate task completion percentage
    const completionPercentage = subtaskService.calculateTaskCompletion(task);

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Not Started':
                return 'bg-gray-200 text-gray-800';
            case 'In Progress':
                return 'bg-blue-100 text-blue-800';
            case 'Working On':
                return 'bg-green-100 text-green-800';
            case 'Completed':
                return 'bg-emerald-100 text-emerald-800';
            default:
                return 'bg-gray-200 text-gray-800';
        }
    };

    return (
        <div className="mb-3">
            <Card className={`bg-white hover:shadow-md transition-shadow ${completionPercentage === 100 ? 'border-l-4 border-l-emerald-500' : ''}`}>
                <CardHeader className="p-3 pb-1">
                    <div className="flex justify-between items-start">
                        <div
                            className="font-medium cursor-pointer flex-1"
                            onClick={() => onOpenTask(task)}
                        >
                            {task.title}
                        </div>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 ml-2">
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => onOpenTask(task)}>
                                    <MessageSquare className="h-4 w-4 mr-2" />
                                    <span>View Details</span>
                                </DropdownMenuItem>

                                <DropdownMenuItem onClick={() => onStartTimer(task)}>
                                    <Timer className="h-4 w-4 mr-2" />
                                    <span>Start Timer</span>
                                </DropdownMenuItem>

                                <DropdownMenuSeparator />

                                <div className="text-xs text-gray-500 px-2 py-1">Move to...</div>
                                {columns.map(col => (
                                    <DropdownMenuItem
                                        key={col.id}
                                        onClick={() => onStatusChange(task.id, col.status)}
                                        disabled={task.status === col.status}
                                        className={task.status === col.status ? 'bg-gray-100' : ''}
                                    >
                                        {col.icon}
                                        <span className="ml-2">{col.title}</span>
                                    </DropdownMenuItem>
                                ))}

                                <DropdownMenuSeparator />

                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => onDelete(task.id)}
                                >
                                    <span>Delete Task</span>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </CardHeader>
                <CardContent className="p-3">
                    {task.description && (
                        <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {task.description}
                        </p>
                    )}

                    <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline" className={`text-xs ${getStatusColor(task.status)}`}>
                            {task.status}
                        </Badge>

                        {/* Time spent */}
                        {task.time_spent > 0 && (
                            <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {timeTrackingService.formatTimeDuration(task.time_spent)}
                            </Badge>
                        )}
                    </div>

                    {/* Subtasks progress */}
                    {task.subtasks && task.subtasks.length > 0 && (
                        <div className="mt-3">
                            <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
                                <div className="flex items-center">
                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                    <span>Subtasks</span>
                                </div>
                                <div>
                                    {task.subtasks.filter(st => st.is_completed).length}/{task.subtasks.length}
                                </div>
                            </div>
                            <Progress
                                value={completionPercentage}
                                className="h-1"
                                indicatorClassName={completionPercentage === 100 ? "bg-emerald-500" : undefined}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
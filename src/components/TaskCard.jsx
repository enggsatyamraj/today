'use client';

import { useState } from 'react';
import {
    MoreHorizontal,
    Clock,
    CheckCircle2,
    Timer,
    MessageSquare,
    AlertTriangle,
    BookmarkPlus,
    Bookmark
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
import taskCleanupService from '@/lib/task-cleanup-service';
import ConfirmationDialog from './ConfirmationDialog';

export default function TaskCard({
    task,
    columns,
    onOpenTask,
    onStatusChange,
    onDelete,
    onStartTimer,
    onToggleKeep
}) {
    // Delete confirmation state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Calculate task completion percentage
    const completionPercentage = subtaskService.calculateTaskCompletion(task);

    // Determine if task is past due
    const isPastDue = task.due_date && new Date(task.due_date) < new Date();

    // Get border color based on status and completion
    const getBorderColor = (status, completion, isPastDue) => {
        if (isPastDue && status !== 'Completed') {
            return 'border-l-4 border-l-red-500';
        }

        if (completion === 100) {
            return 'border-l-4 border-l-emerald-500';
        }

        switch (status) {
            case 'Not Started':
                return 'border-l-4 border-l-amber-400';
            case 'In Progress':
                return 'border-l-4 border-l-blue-500';
            case 'Working On':
                return 'border-l-4 border-l-green-500';
            case 'Completed':
                return 'border-l-4 border-l-emerald-500';
            default:
                return 'border-l-4 border-l-gray-400';
        }
    };

    // Get status color
    const getStatusColor = (status) => {
        switch (status) {
            case 'Not Started':
                return 'bg-amber-100 text-amber-800';
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

    // Open delete confirmation dialog
    const confirmDelete = (e) => {
        e.stopPropagation();
        setShowDeleteConfirm(true);
    };

    // Actually perform the delete when confirmed
    const handleDelete = () => {
        onDelete(task.id);
    };

    // Handle keep task toggle
    const handleToggleKeep = async (e) => {
        e.stopPropagation();

        try {
            const newKeepStatus = !task.keep_after_cleanup;
            const result = await taskCleanupService.markTasksToKeep([task.id], newKeepStatus);

            if (result.success && onToggleKeep) {
                onToggleKeep(task.id, newKeepStatus);
            }
        } catch (error) {
            console.error('Error toggling task keep status:', error);
        }
    };

    return (
        <>
            <div className="mb-3">
                <Card
                    className={`bg-white hover:shadow-md transition-shadow ${getBorderColor(task.status, completionPercentage, isPastDue)}`}
                >
                    <CardHeader className="p-3 pb-1">
                        <div className="flex justify-between items-start">
                            <div
                                className={`font-medium cursor-pointer flex-1 ${isPastDue && task.status !== 'Completed' ? 'text-red-600' : ''}`}
                                onClick={() => onOpenTask(task)}
                            >
                                {task.title}
                                {isPastDue && task.status !== 'Completed' && (
                                    <span className="inline-flex items-center ml-2 text-red-500">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Overdue</span>
                                    </span>
                                )}
                                {task.keep_after_cleanup && (
                                    <span className="inline-flex items-center ml-2 text-blue-500">
                                        <Bookmark className="h-3 w-3 mr-1" />
                                        <span className="text-xs">Keep</span>
                                    </span>
                                )}
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

                                    <DropdownMenuItem onClick={handleToggleKeep}>
                                        {task.keep_after_cleanup ? (
                                            <>
                                                <Bookmark className="h-4 w-4 mr-2 text-blue-500 fill-blue-500" />
                                                <span>Remove Keep Status</span>
                                            </>
                                        ) : (
                                            <>
                                                <BookmarkPlus className="h-4 w-4 mr-2" />
                                                <span>Keep After Cleanup</span>
                                            </>
                                        )}
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />

                                    <DropdownMenuItem
                                        className="text-red-600"
                                        onClick={confirmDelete}
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

                            {/* Due date */}
                            {task.due_date && (
                                <Badge
                                    variant="outline"
                                    className={`text-xs ${isPastDue && task.status !== 'Completed' ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
                                >
                                    <Clock className="h-3 w-3 mr-1" />
                                    {new Date(task.due_date).toLocaleDateString()}
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
                                    indicatorClassName={
                                        completionPercentage === 100
                                            ? "bg-emerald-500"
                                            : completionPercentage > 75
                                                ? "bg-green-500"
                                                : completionPercentage > 50
                                                    ? "bg-blue-500"
                                                    : completionPercentage > 25
                                                        ? "bg-amber-500"
                                                        : "bg-red-500"
                                    }
                                />
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Custom confirmation dialog */}
            <ConfirmationDialog
                isOpen={showDeleteConfirm}
                onClose={() => setShowDeleteConfirm(false)}
                onConfirm={handleDelete}
                title="Delete Task"
                message={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                type="error"
            />
        </>
    );
}
'use client';

import { useState, useRef, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
    Trash2,
    ListPlus,
    Clock,
    CalendarClock,
    CheckCircle2,
    InfoIcon
} from 'lucide-react';
import taskService from '@/lib/task-service';
import subtaskService from '@/lib/subtask-service';
import timeTrackingService from '@/lib/time-tracking-service';
import { format } from 'date-fns';
import Subtask from './SubTask';

export default function TaskDialog({
    task,
    isOpen,
    onOpenChange,
    columns,
    onTaskUpdated,
    onTaskDeleted
}) {
    const [title, setTitle] = useState(task?.title || '');
    const [description, setDescription] = useState(task?.description || '');
    const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const [currentTaskState, setCurrentTaskState] = useState(task);
    const subtaskInputRef = useRef(null);

    useEffect(() => {
        if (task) {
            setTitle(task.title || '');
            setDescription(task.description || '');
            setCurrentTaskState(task);
        }
    }, [task]);

    // Save task
    const saveTask = async () => {
        if (!currentTaskState) return;

        try {
            // Update title if changed
            if (title !== currentTaskState.title) {
                await taskService.updateTaskTitle(currentTaskState.id, title);
            }

            // Update description if changed
            if (description !== currentTaskState.description) {
                await taskService.updateTaskDescription(currentTaskState.id, description);
            }

            const updatedTask = {
                ...currentTaskState,
                title,
                description
            };

            if (onTaskUpdated) {
                onTaskUpdated(updatedTask);
            }

            onOpenChange(false);
        } catch (error) {
            console.error('Error updating task:', error);
        }
    };

    // Add a new subtask
    const handleAddSubtask = async () => {
        if (!newSubtaskTitle.trim() || !currentTaskState) return;

        try {
            setIsAddingSubtask(true);

            const { data, error } = await subtaskService.addSubtask(
                currentTaskState.id,
                newSubtaskTitle
            );

            if (error) throw error;

            // Fetch updated subtasks
            const { data: subtasks } = await subtaskService.fetchSubtasks(currentTaskState.id);

            // Update the current task with the new subtask
            const updatedTask = {
                ...currentTaskState,
                subtasks: subtasks
            };

            setCurrentTaskState(updatedTask);

            if (onTaskUpdated) {
                onTaskUpdated(updatedTask);
            }

            setNewSubtaskTitle('');

            // Focus the input for better UX
            if (subtaskInputRef.current) {
                subtaskInputRef.current.focus();
            }
        } catch (error) {
            console.error('Error adding subtask:', error);
        } finally {
            setIsAddingSubtask(false);
        }
    };

    // Handle subtask update
    const handleSubtaskUpdate = (subtaskId, isCompleted) => {
        if (!currentTaskState) return;

        // Update the current task's subtasks
        const updatedSubtasks = currentTaskState.subtasks.map(subtask =>
            subtask.id === subtaskId ? { ...subtask, is_completed: isCompleted } : subtask
        );

        const updatedTask = {
            ...currentTaskState,
            subtasks: updatedSubtasks
        };

        setCurrentTaskState(updatedTask);

        if (onTaskUpdated) {
            onTaskUpdated(updatedTask);
        }
    };

    // Handle subtask delete
    const handleSubtaskDelete = async (subtaskId) => {
        if (!currentTaskState) return;

        // Update the current task's subtasks
        const updatedSubtasks = currentTaskState.subtasks.filter(subtask => subtask.id !== subtaskId);

        const updatedTask = {
            ...currentTaskState,
            subtasks: updatedSubtasks
        };

        setCurrentTaskState(updatedTask);

        if (onTaskUpdated) {
            onTaskUpdated(updatedTask);
        }
    };

    // Update task status
    const handleStatusChange = async (status) => {
        if (!currentTaskState) return;

        try {
            const { error } = await taskService.updateTaskStatus(currentTaskState.id, status);

            if (error) throw error;

            const updatedTask = {
                ...currentTaskState,
                status
            };

            setCurrentTaskState(updatedTask);

            if (onTaskUpdated) {
                onTaskUpdated(updatedTask);
            }
        } catch (error) {
            console.error('Error updating task status:', error);
        }
    };

    // Delete task
    const handleDeleteTask = async () => {
        if (!currentTaskState) return;

        try {
            const { error } = await taskService.deleteTask(currentTaskState.id);

            if (error) throw error;

            if (onTaskDeleted) {
                onTaskDeleted(currentTaskState.id);
            }

            onOpenChange(false);
        } catch (error) {
            console.error('Error deleting task:', error);
        }
    };

    // If no task is provided, don't render
    if (!task) return null;

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
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader className="flex-shrink-0">
                    <div className="mb-2">
                        <Input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="text-lg font-semibold border-none bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                            placeholder="Task title"
                        />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className={`text-xs ${getStatusColor(currentTaskState?.status)}`}>
                            {currentTaskState?.status}
                        </Badge>

                        {currentTaskState?.created_at && (
                            <Badge variant="outline" className="text-xs">
                                <CalendarClock className="h-3 w-3 mr-1" />
                                Created: {format(new Date(currentTaskState.created_at), 'MMM d, yyyy')}
                            </Badge>
                        )}

                        {currentTaskState?.time_spent > 0 && (
                            <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Time spent: {timeTrackingService.formatTimeDuration(currentTaskState.time_spent)}
                            </Badge>
                        )}
                    </div>
                </DialogHeader>

                <div className="space-y-4 py-4 flex-grow overflow-y-auto hide-scrollbar">
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center text-gray-700">
                            <InfoIcon className="h-4 w-4 mr-1" />
                            Description
                        </label>
                        <Textarea
                            placeholder="Add a description..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={3}
                            className="resize-none"
                        />
                    </div>

                    <div className="space-y-3">
                        <div className="flex justify-between items-center">
                            <label className="text-sm font-medium flex items-center text-gray-700">
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Subtasks
                            </label>
                            {currentTaskState?.subtasks && (
                                <div className="text-xs text-gray-500">
                                    {currentTaskState.subtasks.filter(st => st.is_completed).length}/{currentTaskState.subtasks.length} completed
                                </div>
                            )}
                        </div>

                        {/* Add subtask input */}
                        <div className="flex items-center space-x-2">
                            <Input
                                ref={subtaskInputRef}
                                placeholder="Add a subtask..."
                                value={newSubtaskTitle}
                                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' && !isAddingSubtask && newSubtaskTitle.trim()) {
                                        handleAddSubtask();
                                    }
                                }}
                                disabled={isAddingSubtask}
                            />
                            <Button
                                size="sm"
                                onClick={handleAddSubtask}
                                disabled={isAddingSubtask || !newSubtaskTitle.trim()}
                            >
                                <ListPlus className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Subtasks list - improved scrollable container */}
                        {currentTaskState?.subtasks && currentTaskState.subtasks.length > 0 && (
                            <div className="border rounded-md p-2 bg-gray-50 overflow-y-auto hide-scrollbar" style={{ maxHeight: '35vh' }}>
                                <div className="space-y-2">
                                    {currentTaskState.subtasks.map(subtask => (
                                        <Subtask
                                            key={subtask.id}
                                            subtask={subtask}
                                            onUpdate={handleSubtaskUpdate}
                                            onDelete={handleSubtaskDelete}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-2">
                        <label className="text-sm font-medium mb-2 block text-gray-700">Status</label>
                        <div className="flex flex-wrap gap-2">
                            {columns.map(column => (
                                <Button
                                    key={column.id}
                                    variant={currentTaskState?.status === column.status ? "default" : "outline"}
                                    size="sm"
                                    className="flex items-center"
                                    onClick={() => handleStatusChange(column.status)}
                                >
                                    <span className="mr-1">{column.icon}</span>
                                    {column.title}
                                </Button>
                            ))}
                        </div>
                    </div>
                </div>

                <DialogFooter className="flex justify-between items-center sm:justify-between flex-shrink-0">
                    <Button
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={handleDeleteTask}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete
                    </Button>
                    <Button onClick={saveTask}>
                        Save Changes
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
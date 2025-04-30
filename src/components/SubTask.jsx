'use client';

import { useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';
import subtaskService from '@/lib/subtask-service';

export default function Subtask({ subtask, onUpdate, onDelete }) {
    const [isCompleted, setIsCompleted] = useState(subtask.is_completed);
    const [isUpdating, setIsUpdating] = useState(false);

    const handleToggle = async (checked) => {
        try {
            setIsUpdating(true);
            setIsCompleted(checked);

            const { error } = await subtaskService.updateSubtaskStatus(subtask.id, checked);

            if (error) throw error;

            if (onUpdate) onUpdate(subtask.id, checked);
        } catch (error) {
            console.error('Error updating subtask:', error);
            // Revert the state if there was an error
            setIsCompleted(!checked);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleDelete = async () => {
        try {
            const { error } = await subtaskService.deleteSubtask(subtask.id);

            if (error) throw error;

            if (onDelete) onDelete(subtask.id);
        } catch (error) {
            console.error('Error deleting subtask:', error);
        }
    };

    return (
        <div className={`flex items-center justify-between py-1 px-2 rounded-sm ${isCompleted ? 'bg-emerald-50' : 'hover:bg-gray-100'}`}>
            <div className="flex items-center space-x-2 flex-1 min-w-0">
                <Checkbox
                    id={`subtask-${subtask.id}`}
                    checked={isCompleted}
                    onCheckedChange={handleToggle}
                    disabled={isUpdating}
                    className={isCompleted ? "text-emerald-500 border-emerald-500" : ""}
                />
                <label
                    htmlFor={`subtask-${subtask.id}`}
                    className={`text-sm truncate ${isCompleted ? 'line-through text-gray-500' : 'text-gray-700'}`}
                >
                    {subtask.title}
                </label>
            </div>

            <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 focus:opacity-100"
                onClick={handleDelete}
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    );
}
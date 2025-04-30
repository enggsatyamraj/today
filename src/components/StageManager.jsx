'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import {
    Plus,
    Circle,
    Play,
    Clock,
    CheckCircle,
    AlertCircle,
    Edit2,
    Trash2,
    Save,
    ArrowUp,
    ArrowDown,
} from 'lucide-react';
import { HexColorPicker } from 'react-colorful';
import taskStageService from '@/lib/task-stage-service';

// Available icons for selection
const availableIcons = [
    { name: 'Circle', component: <Circle /> },
    { name: 'Play', component: <Play /> },
    { name: 'Clock', component: <Clock /> },
    { name: 'CheckCircle', component: <CheckCircle /> },
    { name: 'AlertCircle', component: <AlertCircle /> },
    // Add more icons as needed
];

export default function StageManager({ onClose, onStagesUpdated }) {
    const { user } = useAuth();
    const [stages, setStages] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [editingStage, setEditingStage] = useState(null);
    const [newStageName, setNewStageName] = useState('');
    const [newStageColor, setNewStageColor] = useState('#9CA3AF');
    const [newStageIcon, setNewStageIcon] = useState('Circle');
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [stageToDelete, setStageToDelete] = useState(null);

    useEffect(() => {
        if (user) {
            fetchStages();
        }
    }, [user]);

    const fetchStages = async () => {
        try {
            setLoading(true);
            setError(null);

            const { data, error } = await taskStageService.fetchStages(user.id);

            if (error) throw error;

            setStages(data || []);
        } catch (err) {
            console.error('Error fetching stages:', err);
            setError('Failed to load task stages');
        } finally {
            setLoading(false);
        }
    };

    const handleMoveStage = async (stageId, direction) => {
        const stageIndex = stages.findIndex(s => s.id === stageId);
        if (
            (direction === 'up' && stageIndex === 0) ||
            (direction === 'down' && stageIndex === stages.length - 1)
        ) {
            return; // Can't move further
        }

        const newStages = [...stages];
        const targetIndex = direction === 'up' ? stageIndex - 1 : stageIndex + 1;

        // Swap orders
        const tempOrder = newStages[stageIndex].order;
        newStages[stageIndex].order = newStages[targetIndex].order;
        newStages[targetIndex].order = tempOrder;

        // Update local state
        setStages(newStages.sort((a, b) => a.order - b.order));

        // Update in database
        try {
            await taskStageService.updateStage(newStages[stageIndex].id, {
                order: newStages[stageIndex].order
            });
            await taskStageService.updateStage(newStages[targetIndex].id, {
                order: newStages[targetIndex].order
            });

            if (onStagesUpdated) {
                onStagesUpdated();
            }
        } catch (err) {
            console.error('Error reordering stages:', err);
            // Revert to previous order on error
            fetchStages();
        }
    };

    const handleAddStage = async () => {
        if (!newStageName.trim()) return;

        try {
            setLoading(true);

            const newStage = {
                name: newStageName.trim(),
                color: newStageColor,
                icon: newStageIcon,
                is_active: true
            };

            const { data, error } = await taskStageService.addStage(user.id, newStage);

            if (error) throw error;

            // Reset form
            setNewStageName('');
            setNewStageColor('#9CA3AF');
            setNewStageIcon('Circle');

            // Refresh stages
            await fetchStages();

            // Trigger parent component update
            if (onStagesUpdated) {
                onStagesUpdated();
            }
        } catch (err) {
            console.error('Error adding stage:', err);
            setError('Failed to add new stage');
        } finally {
            setLoading(false);
        }
    };

    const handleSaveEditedStage = async () => {
        if (!editingStage || !editingStage.name.trim()) return;

        try {
            setLoading(true);

            const { error } = await taskStageService.updateStage(editingStage.id, {
                name: editingStage.name.trim(),
                color: editingStage.color,
                icon: editingStage.icon,
                is_active: editingStage.is_active
            });

            if (error) throw error;

            // Reset editing state
            setEditingStage(null);

            // Refresh stages
            await fetchStages();

            // Trigger parent component update
            if (onStagesUpdated) {
                onStagesUpdated();
            }
        } catch (err) {
            console.error('Error updating stage:', err);
            setError('Failed to update stage');
        } finally {
            setLoading(false);
        }
    };

    const handleToggleActive = async (stage, isActive) => {
        try {
            // Update local state for immediate feedback
            setStages(stages.map(s =>
                s.id === stage.id ? { ...s, is_active: isActive } : s
            ));

            const { error } = await taskStageService.updateStage(stage.id, {
                is_active: isActive
            });

            if (error) throw error;

            // Trigger parent component update
            if (onStagesUpdated) {
                onStagesUpdated();
            }
        } catch (err) {
            console.error('Error toggling stage visibility:', err);
            // Revert on error
            fetchStages();
        }
    };

    const confirmDeleteStage = (stage) => {
        setStageToDelete(stage);
        setShowConfirmDelete(true);
    };

    const handleDeleteStage = async () => {
        if (!stageToDelete) return;

        try {
            setLoading(true);

            // Find a fallback stage (first active stage that's not being deleted)
            const fallbackStage = stages.find(s =>
                s.id !== stageToDelete.id && s.is_active
            );

            const { error } = await taskStageService.deleteStage(
                stageToDelete.id,
                fallbackStage?.id
            );

            if (error) throw error;

            // Reset state
            setShowConfirmDelete(false);
            setStageToDelete(null);

            // Refresh stages
            await fetchStages();

            // Trigger parent component update
            if (onStagesUpdated) {
                onStagesUpdated();
            }
        } catch (err) {
            console.error('Error deleting stage:', err);
            setError('Failed to delete stage');
        } finally {
            setLoading(false);
        }
    };

    const getIconComponent = (iconName) => {
        const icon = availableIcons.find(i => i.name === iconName);
        return icon ? icon.component : <Circle />;
    };

    if (loading && stages.length === 0) {
        return (
            <div className="flex items-center justify-center p-8">
                <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-3xl mx-auto">
            <Tabs defaultValue="stages">
                <TabsList className="mb-4">
                    <TabsTrigger value="stages">Manage Stages</TabsTrigger>
                    <TabsTrigger value="new">Add New Stage</TabsTrigger>
                </TabsList>

                <TabsContent value="stages">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Task Stages</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {error && (
                                <div className="bg-red-50 text-red-500 p-2 rounded-md mb-4">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                {stages.map((stage, index) => (
                                    <div
                                        key={stage.id}
                                        className={`flex items-center justify-between p-3 rounded-md border ${editingStage?.id === stage.id
                                                ? 'bg-blue-50 border-blue-200'
                                                : 'bg-white'
                                            }`}
                                    >
                                        {editingStage?.id === stage.id ? (
                                            <div className="w-full space-y-4">
                                                <div className="flex items-center">
                                                    <div className="flex-grow space-y-2">
                                                        <Label>Stage Name</Label>
                                                        <Input
                                                            value={editingStage.name}
                                                            onChange={(e) => setEditingStage({
                                                                ...editingStage,
                                                                name: e.target.value
                                                            })}
                                                            className="mb-2"
                                                        />

                                                        <div className="grid grid-cols-2 gap-4">
                                                            <div>
                                                                <Label>Icon</Label>
                                                                <Select
                                                                    value={editingStage.icon}
                                                                    onValueChange={(value) => setEditingStage({
                                                                        ...editingStage,
                                                                        icon: value
                                                                    })}
                                                                >
                                                                    <SelectTrigger>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {availableIcons.map(icon => (
                                                                            <SelectItem key={icon.name} value={icon.name}>
                                                                                <div className="flex items-center">
                                                                                    <span className="mr-2">{icon.component}</span>
                                                                                    {icon.name}
                                                                                </div>
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>

                                                            <div>
                                                                <Label>Color</Label>
                                                                <div className="flex items-center mt-2">
                                                                    <div
                                                                        className="w-8 h-8 rounded-md mr-2"
                                                                        style={{ backgroundColor: editingStage.color }}
                                                                    />
                                                                    <Dialog>
                                                                        <DialogTrigger asChild>
                                                                            <Button variant="outline" size="sm">
                                                                                Change
                                                                            </Button>
                                                                        </DialogTrigger>
                                                                        <DialogContent className="sm:max-w-xs">
                                                                            <HexColorPicker
                                                                                color={editingStage.color}
                                                                                onChange={(color) => setEditingStage({
                                                                                    ...editingStage,
                                                                                    color
                                                                                })}
                                                                            />
                                                                            <Input
                                                                                value={editingStage.color}
                                                                                onChange={(e) => setEditingStage({
                                                                                    ...editingStage,
                                                                                    color: e.target.value
                                                                                })}
                                                                                className="mt-2"
                                                                            />
                                                                        </DialogContent>
                                                                    </Dialog>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex items-center space-x-2 mt-2">
                                                            <Label>Active</Label>
                                                            <Switch
                                                                checked={editingStage.is_active}
                                                                onCheckedChange={(checked) => setEditingStage({
                                                                    ...editingStage,
                                                                    is_active: checked
                                                                })}
                                                            />
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex justify-end space-x-2">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => setEditingStage(null)}
                                                    >
                                                        Cancel
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        onClick={handleSaveEditedStage}
                                                    >
                                                        <Save className="h-4 w-4 mr-1" />
                                                        Save
                                                    </Button>
                                                </div>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex items-center">
                                                    <div
                                                        className="h-5 w-5 mr-2"
                                                        style={{ color: stage.color }}
                                                    >
                                                        {getIconComponent(stage.icon)}
                                                    </div>

                                                    <span className="font-medium">{stage.name}</span>
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                    <div className="flex items-center mr-2">
                                                        <Switch
                                                            checked={stage.is_active}
                                                            onCheckedChange={(checked) => handleToggleActive(stage, checked)}
                                                            className="mr-1"
                                                        />
                                                        <span className="text-sm text-gray-500">
                                                            {stage.is_active ? 'Active' : 'Hidden'}
                                                        </span>
                                                    </div>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMoveStage(stage.id, 'up')}
                                                        disabled={index === 0}
                                                        className={index === 0 ? "opacity-50" : ""}
                                                    >
                                                        <ArrowUp className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => handleMoveStage(stage.id, 'down')}
                                                        disabled={index === stages.length - 1}
                                                        className={index === stages.length - 1 ? "opacity-50" : ""}
                                                    >
                                                        <ArrowDown className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => setEditingStage(stage)}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>

                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => confirmDeleteStage(stage)}
                                                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}

                                {stages.length === 0 && (
                                    <div className="text-center py-8 text-gray-500">
                                        No stages found. Add your first stage.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="new">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Add New Stage</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="stage-name">Stage Name</Label>
                                    <Input
                                        id="stage-name"
                                        value={newStageName}
                                        onChange={(e) => setNewStageName(e.target.value)}
                                        placeholder="e.g., Testing, Blocked, In Review"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="stage-icon">Icon</Label>
                                        <Select
                                            value={newStageIcon}
                                            onValueChange={setNewStageIcon}
                                        >
                                            <SelectTrigger id="stage-icon">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {availableIcons.map(icon => (
                                                    <SelectItem key={icon.name} value={icon.name}>
                                                        <div className="flex items-center">
                                                            <span className="mr-2">{icon.component}</span>
                                                            {icon.name}
                                                        </div>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div>
                                        <Label>Color</Label>
                                        <div className="flex items-center mt-2">
                                            <div
                                                className="w-8 h-8 rounded-md mr-2"
                                                style={{ backgroundColor: newStageColor }}
                                            />
                                            <Dialog>
                                                <DialogTrigger asChild>
                                                    <Button variant="outline" size="sm">
                                                        Select Color
                                                    </Button>
                                                </DialogTrigger>
                                                <DialogContent className="sm:max-w-xs">
                                                    <HexColorPicker
                                                        color={newStageColor}
                                                        onChange={setNewStageColor}
                                                    />
                                                    <Input
                                                        value={newStageColor}
                                                        onChange={(e) => setNewStageColor(e.target.value)}
                                                        className="mt-2"
                                                    />
                                                </DialogContent>
                                            </Dialog>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    onClick={handleAddStage}
                                    disabled={!newStageName.trim() || loading}
                                    className="w-full mt-4"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Stage
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Delete Confirmation Dialog */}
            <Dialog open={showConfirmDelete} onOpenChange={setShowConfirmDelete}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Stage</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the "{stageToDelete?.name}" stage?
                            Tasks in this stage will be moved to another active stage.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowConfirmDelete(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteStage}
                            disabled={loading}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <div className="mt-6 flex justify-end">
                <Button onClick={onClose}>Done</Button>
            </div>
        </div>
    );
}
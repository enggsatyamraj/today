'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    PlusCircle,
    Circle,
    Clock,
    Play,
    AlertCircle,
    Search,
    LayoutDashboard,
    CheckCircle,
    Settings as SettingsIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

// Import helper services
import taskService, { TASK_STATUS } from '@/lib/task-service';
import taskStageService from '@/lib/task-stage-service';
import subtaskService from '@/lib/subtask-service';
import timeTrackingService from '@/lib/time-tracking-service';
import subscriptionUtils from '@/lib/subscription-utils';

// Import components
import TaskCard from '@/components/TaskCard';
import TaskDialog from '@/components/TaskDialog';
import Timer from '@/components/Timer';

// Map of icon names to components
const iconComponents = {
    Circle: <Circle className="h-4 w-4" />,
    Play: <Play className="h-4 w-4" />,
    Clock: <Clock className="h-4 w-4" />,
    CheckCircle: <CheckCircle className="h-4 w-4" />,
    AlertCircle: <AlertCircle className="h-4 w-4" />
};

export default function Dashboard() {
    const { user } = useAuth();
    const router = useRouter();
    const [tasks, setTasks] = useState([]);
    const [stages, setStages] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
    const [currentTask, setCurrentTask] = useState(null);
    const [statistics, setStatistics] = useState({
        total: 0,
        completed: 0,
        inProgress: 0,
        notStarted: 0,
        workingOn: 0,
        byStatus: {}
    });

    // Time tracking state
    const [timeTrackingTask, setTimeTrackingTask] = useState(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [timerInterval, setTimerInterval] = useState(null);

    // Filter state
    const [searchQuery, setSearchQuery] = useState('');

    // Subscriptions reference
    const subscriptionsRef = useRef(null);

    // Process stages with icons
    const columnsWithIcons = useMemo(() => {
        if (!stages.length) {
            // Fallback to default columns if no stages loaded yet
            return [
                { id: 'not-started', title: 'Not Started', status: TASK_STATUS.NOT_STARTED, icon: <Circle className="h-4 w-4" /> },
                { id: 'in-progress', title: 'In Progress', status: TASK_STATUS.IN_PROGRESS, icon: <Play className="h-4 w-4" /> },
                { id: 'working-on', title: 'Working On', status: TASK_STATUS.WORKING_ON, icon: <Clock className="h-4 w-4" /> },
                { id: 'completed', title: 'Completed', status: TASK_STATUS.COMPLETED, icon: <CheckCircle className="h-4 w-4" /> }
            ];
        }

        return stages.map(stage => ({
            id: stage.id,
            title: stage.name,
            status: stage.name,
            icon: iconComponents[stage.icon] || <Circle className="h-4 w-4" />,
            color: stage.color
        }));
    }, [stages]);

    // Fetch stages
    const fetchStages = async () => {
        if (!user) return;

        try {
            const { data, error } = await taskStageService.getActiveStagesWithIcons(user.id);

            if (error) throw error;

            if (data && data.length > 0) {
                setStages(data);
            } else {
                // Create default stages if none exist
                await taskStageService.createDefaultStages(user.id);
                const { data: newStages } = await taskStageService.getActiveStagesWithIcons(user.id);
                setStages(newStages || []);
            }
        } catch (error) {
            console.error('Error fetching stages:', error);
        }
    };

    // Fetch tasks
    const fetchTasks = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            setError(null);

            const { data, error } = await taskService.fetchTasks(user.id);

            if (error) throw error;

            setTasks(data);

            // Calculate statistics
            setStatistics(taskService.calculateStatistics(data));
        } catch (error) {
            console.error('Error fetching tasks:', error);
            setError('Failed to fetch tasks. Please try again later.');
        } finally {
            setIsLoading(false);
        }
    };

    // Setup data fetching and subscriptions
    useEffect(() => {
        if (!user) return;

        // Fetch stages first, then tasks
        fetchStages().then(() => fetchTasks());

        // Setup subscriptions for real-time updates
        subscriptionsRef.current = subscriptionUtils.setupSubscriptions(user.id, fetchTasks);

        // Cleanup subscriptions on unmount
        return () => {
            if (subscriptionsRef.current) {
                subscriptionUtils.removeSubscriptions(subscriptionsRef.current);
            }

            // Also clear any timer intervals
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [user]);

    // Add a new task
    const handleAddTask = async () => {
        if (!newTaskTitle.trim() || !user) return;

        try {
            setIsAddingTask(true);
            setError(null);

            // Get the first stage (typically "Not Started")
            const firstStage = stages.length > 0 ? stages[0] : null;
            const stageId = firstStage ? firstStage.id : null;

            const { error } = await taskService.addTask(user.id, newTaskTitle.trim(), stageId);

            if (error) throw error;

            setNewTaskTitle('');

            // Fetch updated tasks
            await fetchTasks();
        } catch (error) {
            console.error('Error adding task:', error);
            setError('Failed to add task. Please try again.');
        } finally {
            setIsAddingTask(false);
        }
    };

    // Open task dialog
    const handleOpenTask = (task) => {
        setCurrentTask(task);
        setIsTaskDialogOpen(true);
    };

    // Update task status
    const handleStatusChange = async (taskId, newStatus) => {
        try {
            setError(null);

            // Find the stage that matches this status
            const stage = stages.find(s => s.name === newStatus);

            if (stage) {
                const { error } = await taskService.updateTaskStage(taskId, stage.id);
                if (error) throw error;
            } else {
                // Fallback to legacy status update
                const { error } = await taskService.updateTaskStatus(taskId, newStatus);
                if (error) throw error;
            }

            // Update the tasks in state
            setTasks(prev =>
                prev.map(task =>
                    task.id === taskId ? { ...task, status: newStatus } : task
                )
            );

            // Update current task if it's the one being changed
            if (currentTask && currentTask.id === taskId) {
                setCurrentTask({
                    ...currentTask,
                    status: newStatus
                });
            }

            // Recalculate statistics
            setStatistics(taskService.calculateStatistics(
                tasks.map(task => task.id === taskId ? { ...task, status: newStatus } : task)
            ));
        } catch (error) {
            console.error('Error updating task status:', error);
            setError('Failed to update task status.');
        }
    };

    // Handle task update from dialog
    const handleTaskUpdated = (updatedTask) => {
        setTasks(prev =>
            prev.map(task =>
                task.id === updatedTask.id ? updatedTask : task
            )
        );

        // Recalculate statistics if status changed
        setStatistics(taskService.calculateStatistics(
            tasks.map(task => task.id === updatedTask.id ? updatedTask : task)
        ));
    };

    // Handle task deletion
    const handleTaskDeleted = (taskId) => {
        setTasks(prev => prev.filter(task => task.id !== taskId));

        // Recalculate statistics
        setStatistics(taskService.calculateStatistics(
            tasks.filter(task => task.id !== taskId)
        ));
    };

    // Start time tracking
    const handleStartTimer = async (task) => {
        try {
            setError(null);

            // If another timer is running, stop it first
            if (isTimerRunning && timeTrackingTask) {
                await handleStopTimer();
            }

            // Start time tracking
            const { data, error } = await timeTrackingService.startTimeTracking(task.id, user.id);

            if (error) throw error;

            // Find the "Working On" stage
            const workingOnStage = stages.find(s => s.name === 'Working On');

            // Update task status to "Working On" if it's not already
            if (task.status !== 'Working On' && workingOnStage) {
                await handleStatusChange(task.id, 'Working On');
            }

            // Set up time tracking state
            setTimeTrackingTask({
                ...task,
                timeLogId: data.timeLogId,
                startTime: data.startTime
            });
            setIsTimerRunning(true);

            // Start the timer interval
            const interval = setInterval(() => {
                // This is just to keep the timer active, but we don't need to update elapsed time
                // since we're displaying current time instead of elapsed time
            }, 1000);

            setTimerInterval(interval);
        } catch (error) {
            console.error('Error starting timer:', error);
            setError('Failed to start timer.');
        }
    };

    // Stop time tracking
    const handleStopTimer = async () => {
        if (!isTimerRunning || !timeTrackingTask) return;

        try {
            setError(null);

            // Clear the interval
            if (timerInterval) {
                clearInterval(timerInterval);
                setTimerInterval(null);
            }

            // Stop time tracking
            const { data, error } = await timeTrackingService.stopTimeTracking(
                timeTrackingTask.timeLogId,
                timeTrackingTask.startTime
            );

            if (error) throw error;

            // Update the task's total time spent
            await timeTrackingService.updateTaskTimeSpent(timeTrackingTask.id, data.duration);

            // Reset time tracking state
            setTimeTrackingTask(null);
            setIsTimerRunning(false);

            // Fetch updated tasks to get the new time_spent value
            await fetchTasks();
        } catch (error) {
            console.error('Error stopping timer:', error);
            setError('Failed to stop timer.');
        }
    };

    // Filter tasks by search query
    const filterTasks = (tasks, query) => {
        if (!query) return tasks;

        const lowerCaseQuery = query.toLowerCase();
        return tasks.filter(task =>
            task.title.toLowerCase().includes(lowerCaseQuery) ||
            (task.description && task.description.toLowerCase().includes(lowerCaseQuery))
        );
    };

    // Get tasks by status and filter by search
    const getTasksByStatus = (status) => {
        return filterTasks(tasks, searchQuery).filter(task => task.status === status);
    };

    if (isLoading && tasks.length === 0) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-t-2 border-blue-500 rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with title */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center mb-4 sm:mb-0">
                    <LayoutDashboard className="h-6 w-6 mr-2 text-blue-600" />
                    <h1 className="text-2xl font-bold text-gray-800">Today Focus</h1>
                </div>

                <div className="flex space-x-2">
                    {/* Search input */}
                    <div className="relative flex-grow">
                        <Search className="h-4 w-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        <Input
                            placeholder="Search tasks..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-9 w-full"
                        />
                    </div>

                    {/* Settings button */}
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push('/settings')}
                        title="Manage Stages"
                    >
                        <SettingsIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-white shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics.total}</div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics.byStatus['Completed'] || 0}</div>
                        <Progress
                            value={statistics.total ? ((statistics.byStatus['Completed'] || 0) / statistics.total) * 100 : 0}
                            className="mt-2"
                            indicatorClassName={(statistics.byStatus['Completed'] || 0) > 0 ? "bg-emerald-500" : undefined}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">In Progress</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {(statistics.byStatus['In Progress'] || 0) + (statistics.byStatus['Working On'] || 0)}
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-white shadow-sm hover:shadow transition-shadow">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Not Started</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{statistics.byStatus['Not Started'] || 0}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Timer component */}
            <Timer
                task={timeTrackingTask}
                isRunning={isTimerRunning}
                onStop={handleStopTimer}
            />

            {/* Error display */}
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {/* Add task input */}
            <div className="flex items-center space-x-2">
                <Input
                    placeholder="Add a new task..."
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !isAddingTask && newTaskTitle.trim()) {
                            handleAddTask();
                        }
                    }}
                    disabled={isAddingTask}
                />
                <Button onClick={handleAddTask} disabled={isAddingTask || !newTaskTitle.trim()}>
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add
                </Button>
            </div>

            {/* Desktop view: Kanban board */}
            <div className="hidden md:grid md:grid-cols-4 md:gap-4">
                {columnsWithIcons.map(column => (
                    <div key={column.id} className="space-y-3">
                        <div className="flex items-center space-x-2 font-medium">
                            {column.icon}
                            <h3>{column.title}</h3>
                            <span className="text-sm text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                {getTasksByStatus(column.status).length}
                            </span>
                        </div>

                        <ScrollArea className="h-[calc(100vh-440px)] bg-gray-50 rounded-lg p-3">
                            <div className="space-y-3 min-h-[200px]">
                                {getTasksByStatus(column.status).map((task) => (
                                    <TaskCard
                                        key={task.id}
                                        task={task}
                                        columns={columnsWithIcons}
                                        onOpenTask={handleOpenTask}
                                        onStatusChange={handleStatusChange}
                                        onDelete={handleTaskDeleted}
                                        onStartTimer={handleStartTimer}
                                    />
                                ))}

                                {getTasksByStatus(column.status).length === 0 && (
                                    <div className="text-center py-8 text-gray-400 text-sm">
                                        No tasks in this column
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>
                ))}
            </div>

            {/* Mobile view: Tabs */}
            <div className="md:hidden">
                <Tabs defaultValue={columnsWithIcons[0]?.id || "not-started"}>
                    <TabsList className="grid grid-cols-4">
                        {columnsWithIcons.map(column => (
                            <TabsTrigger
                                key={column.id}
                                value={column.id}
                                className="flex items-center space-x-1"
                            >
                                {column.icon}
                                <span className="hidden sm:inline ml-1">{column.title}</span>
                                <span className="text-xs ml-1">({getTasksByStatus(column.status).length})</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {columnsWithIcons.map(column => (
                        <TabsContent key={column.id} value={column.id} className="mt-4">
                            <ScrollArea className="h-[calc(100vh-440px)]">
                                <div className="space-y-3">
                                    {getTasksByStatus(column.status).map((task) => (
                                        <TaskCard
                                            key={task.id}
                                            task={task}
                                            columns={columnsWithIcons}
                                            onOpenTask={handleOpenTask}
                                            onStatusChange={handleStatusChange}
                                            onDelete={handleTaskDeleted}
                                            onStartTimer={handleStartTimer}
                                        />
                                    ))}

                                    {getTasksByStatus(column.status).length === 0 && (
                                        <div className="text-center py-8 text-gray-400">
                                            No tasks in {column.title.toLowerCase()} status
                                        </div>
                                    )}
                                </div>
                            </ScrollArea>
                        </TabsContent>
                    ))}
                </Tabs>
            </div>

            {/* Task Dialog */}
            <TaskDialog
                task={currentTask}
                isOpen={isTaskDialogOpen}
                onOpenChange={setIsTaskDialogOpen}
                columns={columnsWithIcons}
                onTaskUpdated={handleTaskUpdated}
                onTaskDeleted={handleTaskDeleted}
            />
        </div>
    );
}
'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    PlusCircle,
    Circle,
    Clock,
    Play,
    AlertCircle,
    LayoutDashboard,
    CheckCircle,
    Settings as SettingsIcon,
    ChevronLeft,
    ChevronRight,
    Edit2,
    Layers,
    X,
    RefreshCw,
    Calendar,
    ListChecks,
    BarChart3,
    AlertTriangle,
    Pause,
    BookmarkPlus,
    Bookmark
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';

// Import helper services
import taskService, { TASK_STATUS } from '@/lib/task-service';
import taskStageService from '@/lib/task-stage-service';
import subtaskService from '@/lib/subtask-service';
import timeTrackingService from '@/lib/time-tracking-service';
import subscriptionUtils from '@/lib/subscription-utils';
import userSettingsService from '@/lib/user-settings-service';
import taskCleanupService from '@/lib/task-cleanup-service';

// Import components
import TaskCard from '@/components/TaskCard';
import TaskDialog from '@/components/TaskDialog';
import Timer from '@/components/Timer';
import FocusMode from '@/components/FocusMode';
import OnboardingModal from '@/components/OnboardingModal';

// Map of icon names to components
const iconComponents = {
    Circle: <Circle className="h-4 w-4" />,
    Play: <Play className="h-4 w-4" />,
    Clock: <Clock className="h-4 w-4" />,
    CheckCircle: <CheckCircle className="h-4 w-4" />,
    AlertCircle: <AlertCircle className="h-4 w-4" />
};

// Available icons for selection
const availableIcons = [
    { name: 'Circle', component: <Circle /> },
    { name: 'Play', component: <Play /> },
    { name: 'Clock', component: <Clock /> },
    { name: 'CheckCircle', component: <CheckCircle /> },
    { name: 'AlertCircle', component: <AlertCircle /> },
];

// Skeleton loader component
const SkeletonLoader = () => (
    <div className="space-y-6 animate-pulse">
        {/* Header skeleton */}
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <div className="h-6 w-6 bg-gray-300 rounded-md mr-2"></div>
                <div className="h-8 w-40 bg-gray-300 rounded-md"></div>
            </div>
            <div className="flex space-x-2">
                <div className="h-9 w-9 bg-gray-300 rounded-md"></div>
                <div className="h-9 w-9 bg-gray-300 rounded-md"></div>
            </div>
        </div>

        {/* Stats cards skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white p-6 rounded-xl shadow-sm">
                    <div className="h-5 w-24 bg-gray-300 rounded-md mb-3"></div>
                    <div className="h-8 w-16 bg-gray-300 rounded-md"></div>
                </div>
            ))}
        </div>

        {/* Timer skeleton */}
        <div className="h-16 bg-white rounded-xl shadow-sm"></div>

        {/* Add task skeleton */}
        <div className="flex items-center space-x-2">
            <div className="h-9 flex-grow bg-gray-300 rounded-md"></div>
            <div className="h-9 w-20 bg-gray-300 rounded-md"></div>
        </div>

        {/* Columns skeleton */}
        <div className="flex space-x-4 overflow-x-auto pb-2">
            {[...Array(3)].map((_, i) => (
                <div key={i} className="flex-shrink-0 w-80">
                    <div className="flex items-center mb-3">
                        <div className="h-5 w-24 bg-gray-300 rounded-md"></div>
                    </div>
                    <div className="bg-gray-100 p-3 rounded-xl h-[calc(100vh-450px)]">
                        {[...Array(3)].map((_, j) => (
                            <div key={j} className="bg-white p-4 rounded-lg mb-3 h-24"></div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

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
        byStatus: {},
        overdue: 0
    });
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Time tracking state
    const [timeTrackingTask, setTimeTrackingTask] = useState(null);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [isTimerPaused, setIsTimerPaused] = useState(false);
    const [timerStartTime, setTimerStartTime] = useState(null);
    const [pausedTime, setPausedTime] = useState(0);
    const [timeTracking, setTimeTracking] = useState({
        timeLogId: null,
        startTime: null,
        pauseStartTime: null,
        totalPausedTime: 0
    });

    // Stage management state
    const [isAddStageDialogOpen, setIsAddStageDialogOpen] = useState(false);
    const [newStageName, setNewStageName] = useState('');
    const [newStageColor, setNewStageColor] = useState('#9CA3AF');
    const [newStageIcon, setNewStageIcon] = useState('Circle');
    const [isManagingStages, setIsManagingStages] = useState(false);
    const [stageToEdit, setStageToEdit] = useState(null);
    const [stageToDelete, setStageToDelete] = useState(null);
    const [isConfirmDeleteOpen, setIsConfirmDeleteOpen] = useState(false);

    // Work hours and task cleanup state
    const [userSettings, setUserSettings] = useState(null);
    const [isWithinWorkHours, setIsWithinWorkHours] = useState(true);
    const [showEndDayPrompt, setShowEndDayPrompt] = useState(false);

    // Horizontal scroll for stages
    const columnsContainerRef = useRef(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    // Due date notification
    const [showDueWarning, setShowDueWarning] = useState(false);
    const [overdueTasks, setOverdueTasks] = useState([]);

    // Subscriptions reference
    const subscriptionsRef = useRef(null);

    // Process stages with icons
    const columnsWithIcons = useMemo(() => {
        if (!stages.length) {
            // Fallback to default columns if no stages loaded yet
            return [
                { id: 'not-started', title: 'Not Started', status: TASK_STATUS.NOT_STARTED, icon: <Circle className="h-4 w-4" />, color: '#9CA3AF' },
                { id: 'in-progress', title: 'In Progress', status: TASK_STATUS.IN_PROGRESS, icon: <Play className="h-4 w-4" />, color: '#3B82F6' },
                { id: 'completed', title: 'Completed', status: TASK_STATUS.COMPLETED, icon: <CheckCircle className="h-4 w-4" />, color: '#34D399' }
            ];
        }

        return stages.map(stage => ({
            id: stage.id,
            title: stage.name,
            status: stage.name,
            icon: iconComponents[stage.icon] || <Circle className="h-4 w-4" />,
            color: stage.color,
            isActive: stage.is_active,
            order: stage.order
        }));
    }, [stages]);

    // Helper function to add minutes to a time string (HH:MM)
    const advanceTimeByMinutes = (timeStr, minutes) => {
        const [hours, mins] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, mins + minutes, 0, 0);
        return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    };

    useEffect(() => {
        // Run on first load
        checkWorkHours();

        // Set up a timer to check every minute
        const intervalId = setInterval(checkWorkHours, 60000);

        // Also check when the window gains focus (user returns from settings page)
        const handleFocus = () => {
            checkWorkHours();
        };

        // Add event listener for when the window regains focus
        window.addEventListener('focus', handleFocus);

        // Clean up
        return () => {
            clearInterval(intervalId);
            window.removeEventListener('focus', handleFocus);
        };
    }, [user]);

    // Check work hours and task cleanup status
    const checkWorkHours = async () => {
        if (!user) return;

        try {
            const { data: settings } = await userSettingsService.getUserSettings(user.id);

            // Always update local settings state when we get fresh data
            if (settings) {
                setUserSettings(settings);

                const now = new Date();
                const currentHour = now.getHours();
                const currentMinute = now.getMinutes();
                const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;

                // Parse start and end times properly (handle both 'HH:MM' and 'HH:MM:SS' formats)
                const startTime = settings.work_start_time ?
                    settings.work_start_time.substring(0, 5) : '09:00';
                const endTime = settings.work_end_time ?
                    settings.work_end_time.substring(0, 5) : '17:00';

                // Determine if current time is within work hours
                // Handle special case where end time is earlier than start time (overnight shift)
                const isOvernightShift = startTime > endTime;

                let withinHours;
                if (isOvernightShift) {
                    // For overnight shifts, we're within hours if:
                    // - current time is after start time OR
                    // - current time is before end time
                    withinHours = currentTimeStr >= startTime || currentTimeStr <= endTime;
                } else {
                    // Normal case: within hours if after start and before end
                    withinHours = currentTimeStr >= startTime && currentTimeStr <= endTime;
                }

                setIsWithinWorkHours(withinHours);

                // Check for end-of-day cleanup prompt
                if (settings.auto_delete_tasks) {
                    // Show cleanup prompt if we're within 5 minutes after work end time
                    const isJustAfterWorkHours = !isOvernightShift
                        ? (currentTimeStr >= endTime && currentTimeStr <= advanceTimeByMinutes(endTime, 5))
                        : (currentTimeStr >= endTime && currentTimeStr <= advanceTimeByMinutes(endTime, 5)) ||
                        (currentTimeStr >= '23:55' || currentTimeStr <= '00:05');

                    if (isJustAfterWorkHours) {
                        setShowEndDayPrompt(true);
                    }
                }
            }
        } catch (error) {
            console.error('Error checking work hours:', error);
        }
    };

    // Handle end-of-day cleanup
    const handleEndDayCleanup = async (shouldCleanup = false) => {
        if (!user) return;

        // Always dismiss the prompt
        setShowEndDayPrompt(false);

        if (shouldCleanup) {
            try {
                const result = await taskCleanupService.cleanupTasks(user.id);
                if (result.success) {
                    // Show success toast or notification
                    setError(`Cleaned up ${result.count} tasks. Have a great evening!`);

                    // Refresh tasks
                    await fetchTasks();
                } else {
                    setError('Failed to clean up tasks. Please try again.');
                }
            } catch (err) {
                console.error('Error during cleanup:', err);
                setError('An error occurred during task cleanup.');
            }
        }
    };

    // Toggle keep status for a task
    const handleToggleKeepTask = (taskId, keepStatus) => {
        // Update the tasks state
        setTasks(prev =>
            prev.map(task =>
                task.id === taskId ? { ...task, keep_after_cleanup: keepStatus } : task
            )
        );
    };

    // Check if columns can be scrolled
    useEffect(() => {
        if (columnsContainerRef.current) {
            const checkScroll = () => {
                const container = columnsContainerRef.current;
                setCanScrollLeft(container.scrollLeft > 0);
                setCanScrollRight(
                    container.scrollLeft + container.offsetWidth < container.scrollWidth
                );
            };

            // Check on mount and when columns change
            checkScroll();

            // Add scroll event listener
            const scrollContainer = columnsContainerRef.current;
            scrollContainer.addEventListener('scroll', checkScroll);

            // Also recheck when window resizes
            window.addEventListener('resize', checkScroll);

            return () => {
                if (scrollContainer) {
                    scrollContainer.removeEventListener('scroll', checkScroll);
                }
                window.removeEventListener('resize', checkScroll);
            };
        }
    }, [columnsWithIcons, isLoading]);

    // Check for overdue tasks
    useEffect(() => {
        const overdue = tasks.filter(task =>
            task.due_date &&
            new Date(task.due_date) < new Date() &&
            task.status !== 'Completed'
        );

        setOverdueTasks(overdue);
        setShowDueWarning(overdue.length > 0);

        // Update statistics
        if (statistics) {
            setStatistics(prev => ({
                ...prev,
                overdue: overdue.length
            }));
        }
    }, [tasks]);

    // Scroll columns
    const scrollColumns = (direction) => {
        if (columnsContainerRef.current) {
            const container = columnsContainerRef.current;
            const scrollAmount = container.clientWidth * 0.75; // Scroll 75% of the viewport width
            container.scrollBy({
                left: direction === 'left' ? -scrollAmount : scrollAmount,
                behavior: 'smooth'
            });
        }
    };

    // Handle refresh - prevent unnecessary re-renders
    const handleRefresh = useCallback(async () => {
        if (isRefreshing) return;

        setIsRefreshing(true);
        try {
            await fetchStages();
            await fetchTasks();
            await checkWorkHours();
        } catch (error) {
            console.error('Error refreshing data:', error);
            setError('Failed to refresh data. Please try again.');
        } finally {
            setIsRefreshing(false);
        }
    }, [isRefreshing]);

    // Fetch stages
    const fetchStages = useCallback(async () => {
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
            setError('Failed to load task stages. Please try refreshing.');
        }
    }, [user]);

    // Fetch tasks
    const fetchTasks = useCallback(async () => {
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
    }, [user]);

    // Setup data fetching and subscriptions
    useEffect(() => {
        if (!user) return;

        // Fetch stages first, then tasks
        fetchStages().then(() => fetchTasks());

        // Check work hours
        checkWorkHours();

        // Setup interval to check work hours every minute
        const workHoursInterval = setInterval(checkWorkHours, 60000); // Check every minute

        // Setup subscriptions for real-time updates
        subscriptionsRef.current = subscriptionUtils.setupSubscriptions(user.id, fetchTasks);

        // Cleanup subscriptions and intervals on unmount
        return () => {
            if (subscriptionsRef.current) {
                subscriptionUtils.removeSubscriptions(subscriptionsRef.current);
            }
            clearInterval(workHoursInterval);
        };
    }, [user, fetchStages, fetchTasks]);

    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        const checkUserOnboarding = async () => {
            if (!user) return;

            try {
                const { data: settings } = await userSettingsService.getUserSettings(user.id);

                // If this is a new user (no settings yet) or onboarding isn't completed
                if (!settings || settings.onboarding_completed === false) {
                    setShowOnboarding(true);
                }
            } catch (error) {
                console.error('Error checking user onboarding status:', error);
            }
        };

        checkUserOnboarding();
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

            const { data, error } = await taskService.addTask(user.id, newTaskTitle.trim(), stageId);

            if (error) throw error;

            // Optimistically add the task to the state to avoid a full refetch
            if (data && data[0]) {
                const newTask = {
                    ...data[0],
                    status: firstStage ? firstStage.name : 'Not Started',
                    subtasks: []
                };

                setTasks(prevTasks => [newTask, ...prevTasks]);

                // Update statistics
                setStatistics(prev => ({
                    ...prev,
                    total: prev.total + 1,
                    notStarted: prev.notStarted + 1,
                    byStatus: {
                        ...prev.byStatus,
                        'Not Started': (prev.byStatus['Not Started'] || 0) + 1
                    }
                }));
            } else {
                // If we don't have the data, fall back to a full refetch
                await fetchTasks();
            }

            setNewTaskTitle('');
        } catch (error) {
            console.error('Error adding task:', error);
            setError('Failed to add task. Please try again.');
        } finally {
            setIsAddingTask(false);
        }
    };

    // Add a new stage
    const handleAddStage = async () => {
        if (!newStageName.trim() || !user) return;

        try {
            setIsLoading(true);

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

            // Close dialog
            setIsAddStageDialogOpen(false);

            // Refresh stages
            await fetchStages();
        } catch (error) {
            console.error('Error adding stage:', error);
            setError('Failed to add new stage.');
        } finally {
            setIsLoading(false);
        }
    };

    // Update a stage
    const handleUpdateStage = async () => {
        if (!stageToEdit || !stageToEdit.title.trim()) return;

        try {
            setIsLoading(true);

            const { error } = await taskStageService.updateStage(stageToEdit.id, {
                name: stageToEdit.title.trim(),
                color: stageToEdit.color,
                icon: stageToEdit.icon,
                is_active: stageToEdit.isActive
            });

            if (error) throw error;

            // Reset stage editing state
            setStageToEdit(null);

            // Refresh stages
            await fetchStages();
        } catch (error) {
            console.error('Error updating stage:', error);
            setError('Failed to update stage.');
        } finally {
            setIsLoading(false);
        }
    };

    // Delete a stage
    const handleDeleteStage = async () => {
        if (!stageToDelete) return;

        try {
            setIsLoading(true);

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
            setStageToDelete(null);
            setIsConfirmDeleteOpen(false);

            // Refresh stages
            await fetchStages();

            // Also refresh tasks as some might have changed status
            await fetchTasks();
        } catch (error) {
            console.error('Error deleting stage:', error);
            setError('Failed to delete stage.');
        } finally {
            setIsLoading(false);
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

            // Get the task being updated
            const taskToUpdate = tasks.find(task => task.id === taskId);
            if (!taskToUpdate) return;

            const oldStatus = taskToUpdate.status;

            // Optimistically update UI
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

            // Update statistics immediately for responsive UI
            // Update statistics
            setStatistics(prev => {
                const updatedStats = { ...prev };
                const byStatus = { ...updatedStats.byStatus };

                // Decrement old status count
                if (byStatus[oldStatus]) {
                    byStatus[oldStatus] = Math.max(0, byStatus[oldStatus] - 1);
                }

                // Increment new status count
                byStatus[newStatus] = (byStatus[newStatus] || 0) + 1;

                // Update specific counters
                if (oldStatus === 'Completed' && newStatus !== 'Completed') {
                    updatedStats.completed = Math.max(0, updatedStats.completed - 1);

                    // If the task has a due date that's in the past, increment overdue
                    if (taskToUpdate.due_date && new Date(taskToUpdate.due_date) < new Date()) {
                        updatedStats.overdue = updatedStats.overdue + 1;
                    }
                } else if (oldStatus !== 'Completed' && newStatus === 'Completed') {
                    updatedStats.completed = updatedStats.completed + 1;

                    // If the task was overdue, decrement that counter
                    if (taskToUpdate.due_date && new Date(taskToUpdate.due_date) < new Date()) {
                        updatedStats.overdue = Math.max(0, updatedStats.overdue - 1);
                    }
                }

                if (oldStatus === 'In Progress' && newStatus !== 'In Progress') {
                    updatedStats.inProgress = Math.max(0, updatedStats.inProgress - 1);
                } else if (oldStatus !== 'In Progress' && newStatus === 'In Progress') {
                    updatedStats.inProgress = updatedStats.inProgress + 1;
                }

                if (oldStatus === 'Not Started' && newStatus !== 'Not Started') {
                    updatedStats.notStarted = Math.max(0, updatedStats.notStarted - 1);
                } else if (oldStatus !== 'Not Started' && newStatus === 'Not Started') {
                    updatedStats.notStarted = updatedStats.notStarted + 1;
                }

                updatedStats.byStatus = byStatus;

                return updatedStats;
            });

            // Actually update in the database
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
        } catch (error) {
            console.error('Error updating task status:', error);
            setError('Failed to update task status.');

            // If there was an error, refresh the tasks to restore the correct state
            await fetchTasks();
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
    const handleTaskDeleted = async (taskId) => {
        try {
            // First, get the task being deleted for statistics update
            const taskToDelete = tasks.find(task => task.id === taskId);

            // Optimistically update the UI
            setTasks(prev => prev.filter(task => task.id !== taskId));

            // Recalculate statistics
            if (taskToDelete) {
                setStatistics(prev => {
                    const status = taskToDelete.status || 'Not Started';
                    const updatedStats = { ...prev };

                    // Decrement total
                    updatedStats.total = Math.max(0, updatedStats.total - 1);

                    // Decrement specific status count
                    if (updatedStats.byStatus[status]) {
                        updatedStats.byStatus[status] = Math.max(0, updatedStats.byStatus[status] - 1);
                    }

                    // Update specific counters
                    if (status === 'Completed') {
                        updatedStats.completed = Math.max(0, updatedStats.completed - 1);
                    } else if (status === 'In Progress') {
                        updatedStats.inProgress = Math.max(0, updatedStats.inProgress - 1);
                    } else if (status === 'Not Started') {
                        updatedStats.notStarted = Math.max(0, updatedStats.notStarted - 1);
                    } else if (status === 'Working On') {
                        updatedStats.workingOn = Math.max(0, updatedStats.workingOn - 1);
                    }

                    // If the task was overdue, decrement that counter too
                    if (taskToDelete.due_date && new Date(taskToDelete.due_date) < new Date() && status !== 'Completed') {
                        updatedStats.overdue = Math.max(0, updatedStats.overdue - 1);
                    }

                    return updatedStats;
                });
            }

            // Actually delete the task from the database
            const { error } = await taskService.deleteTask(taskId);

            if (error) {
                throw error;
            }
        } catch (error) {
            console.error('Error deleting task:', error);
            setError('Failed to delete task. Please try again.');

            // If there was an error, refresh the tasks to restore the correct state
            await fetchTasks();
        }
    };

    const [isFocusModeActive, setIsFocusModeActive] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);

    const saveTimerState = (state) => {
        try {
            localStorage.setItem('timerState', JSON.stringify(state));
        } catch (error) {
            console.error('Error saving timer state to localStorage:', error);
        }
    };

    const loadTimerState = () => {
        try {
            const savedState = localStorage.getItem('timerState');
            return savedState ? JSON.parse(savedState) : null;
        } catch (error) {
            console.error('Error loading timer state from localStorage:', error);
            return null;
        }
    };

    useEffect(() => {
        const savedState = loadTimerState();
        if (savedState) {
            // Restore timer state
            setTimeTrackingTask(savedState.timeTrackingTask);
            setIsTimerRunning(savedState.isTimerRunning);
            setIsTimerPaused(savedState.isTimerPaused);
            setTimerStartTime(savedState.timerStartTime);
            setPausedTime(savedState.pausedTime);
            setTimeTracking(savedState.timeTracking);
            setIsFocusModeActive(savedState.isFocusModeActive);

            // Recalculate elapsed time based on saved state
            if (savedState.isTimerRunning) {
                const now = new Date();
                const startTime = new Date(savedState.timerStartTime);
                let totalElapsed = Math.floor((now - startTime) / 1000);

                // Subtract paused time
                if (savedState.isTimerPaused) {
                    // If it was paused when the page was refreshed
                    if (savedState.timeTracking.pauseStartTime) {
                        const pauseStart = new Date(savedState.timeTracking.pauseStartTime);
                        const pauseDuration = Math.floor((now - pauseStart) / 1000);
                        totalElapsed -= pauseDuration;
                    }
                }

                // Also subtract accumulated paused time
                totalElapsed -= savedState.timeTracking.totalPausedTime || 0;
                setElapsedTime(totalElapsed);
            }
        }
    }, []);

    useEffect(() => {
        let timerInterval;

        if (isTimerRunning && timeTrackingTask) {
            // Start or resume a timer that updates elapsedTime every second
            timerInterval = setInterval(() => {
                if (timerStartTime) {
                    const now = new Date();
                    const startTime = new Date(timerStartTime);

                    // Calculate total elapsed time in seconds
                    let totalElapsed = Math.floor((now - startTime) / 1000);

                    // Subtract paused time
                    if (isTimerPaused) {
                        // If currently paused, don't count time since pause started
                        if (timeTracking.pauseStartTime) {
                            const pauseStart = new Date(timeTracking.pauseStartTime);
                            const pauseDuration = Math.floor((now - pauseStart) / 1000);
                            totalElapsed -= pauseDuration;
                        }
                    }

                    // Also subtract any previously accumulated paused time
                    totalElapsed -= timeTracking.totalPausedTime || 0;

                    setElapsedTime(totalElapsed);
                }
            }, 1000);
        }

        return () => {
            if (timerInterval) {
                clearInterval(timerInterval);
            }
        };
    }, [isTimerRunning, isTimerPaused, timerStartTime, timeTracking, timeTrackingTask]);

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

            // Find the "In Progress" stage
            const inProgressStage = stages.find(s => s.name === 'In Progress');

            // Update task status to "In Progress" if it's not already
            if (task.status !== 'In Progress' && inProgressStage) {
                await handleStatusChange(task.id, 'In Progress');
            }

            const newTimeTrackingTask = {
                ...task,
                timeLogId: data.timeLogId,
                startTime: data.startTime
            };

            // Set up time tracking state
            setTimeTrackingTask(newTimeTrackingTask);
            setIsTimerRunning(true);
            setIsTimerPaused(false);
            setTimerStartTime(new Date());
            setPausedTime(0);

            // Reset time tracking state
            const newTimeTracking = {
                timeLogId: data.timeLogId,
                startTime: data.startTime,
                pauseStartTime: null,
                totalPausedTime: 0
            };

            setTimeTracking(newTimeTracking);

            // Activate focus mode
            setIsFocusModeActive(true);

            // Save to localStorage
            saveTimerState({
                timeTrackingTask: newTimeTrackingTask,
                isTimerRunning: true,
                isTimerPaused: false,
                timerStartTime: new Date(),
                pausedTime: 0,
                timeTracking: newTimeTracking,
                isFocusModeActive: true
            });
        } catch (error) {
            console.error('Error starting timer:', error);
            setError('Failed to start timer.');
        }
    };

    // Update handlePauseTimer
    const handlePauseTimer = async () => {
        if (!isTimerRunning || !timeTrackingTask || isTimerPaused) return;

        try {
            setError(null);
            setIsTimerPaused(true);

            // Record when we paused
            const pauseTime = new Date();

            // Update time tracking
            const updatedTimeTracking = {
                ...timeTracking,
                pauseStartTime: pauseTime.toISOString()
            };

            setTimeTracking(updatedTimeTracking);

            // Save to localStorage
            saveTimerState({
                timeTrackingTask,
                isTimerRunning,
                isTimerPaused: true,
                timerStartTime,
                pausedTime,
                timeTracking: updatedTimeTracking,
                isFocusModeActive
            });
        } catch (error) {
            console.error('Error pausing timer:', error);
            setError('Failed to pause timer.');
        }
    };

    // Update handleResumeTimer
    const handleResumeTimer = async () => {
        if (!isTimerRunning || !timeTrackingTask || !isTimerPaused) return;

        try {
            setError(null);
            setIsTimerPaused(false);

            // Calculate time spent in pause
            const pauseStart = new Date(timeTracking.pauseStartTime);
            const pauseEnd = new Date();
            const pauseDuration = Math.round((pauseEnd - pauseStart) / 1000); // seconds

            // Update paused time
            const updatedTimeTracking = {
                ...timeTracking,
                pauseStartTime: null,
                totalPausedTime: timeTracking.totalPausedTime + pauseDuration
            };

            setTimeTracking(updatedTimeTracking);

            // Save to localStorage
            saveTimerState({
                timeTrackingTask,
                isTimerRunning,
                isTimerPaused: false,
                timerStartTime,
                pausedTime,
                timeTracking: updatedTimeTracking,
                isFocusModeActive
            });
        } catch (error) {
            console.error('Error resuming timer:', error);
            setError('Failed to resume timer.');
        }
    };

    // Update handleStopTimer
    const handleStopTimer = async () => {
        if (!isTimerRunning || !timeTrackingTask) return;

        try {
            setError(null);

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
            setIsTimerPaused(false);
            setTimerStartTime(null);
            setPausedTime(0);
            setElapsedTime(0); // Reset elapsed time
            setTimeTracking({
                timeLogId: null,
                startTime: null,
                pauseStartTime: null,
                totalPausedTime: 0
            });

            // Exit focus mode
            setIsFocusModeActive(false);

            // Clear localStorage
            localStorage.removeItem('timerState');

            // Fetch updated tasks to get the new time_spent value
            await fetchTasks();
        } catch (error) {
            console.error('Error stopping timer:', error);
            setError('Failed to stop timer.');
        }
    };

    // Handle subtask update in focus mode
    const handleFocusModeSubtaskUpdate = async (subtaskId, isCompleted) => {
        try {
            // Update in database
            const { error } = await subtaskService.updateSubtaskStatus(subtaskId, isCompleted);

            if (error) throw error;

            // Update the current task's subtasks
            if (timeTrackingTask && timeTrackingTask.subtasks) {
                const updatedSubtasks = timeTrackingTask.subtasks.map(subtask =>
                    subtask.id === subtaskId ? { ...subtask, is_completed: isCompleted } : subtask
                );

                const updatedTask = {
                    ...timeTrackingTask,
                    subtasks: updatedSubtasks
                };

                setTimeTrackingTask(updatedTask);

                // Update the tasks array for when focus mode is closed
                setTasks(prev =>
                    prev.map(task =>
                        task.id === updatedTask.id ? updatedTask : task
                    )
                );
            }
        } catch (error) {
            console.error('Error updating subtask:', error);
        }
    };

    // Get tasks by status
    const getTasksByStatus = (status) => {
        return tasks.filter(task => task.status === status);
    };

    // Move stage left (decrease order)
    const handleMoveStageLeft = async (stageId) => {
        const stageIndex = stages.findIndex(s => s.id === stageId);
        if (stageIndex <= 0) return; // Can't move further left

        const newStages = [...stages];
        const targetIndex = stageIndex - 1;

        // Swap orders
        const tempOrder = newStages[stageIndex].order;
        newStages[stageIndex].order = newStages[targetIndex].order;
        newStages[targetIndex].order = tempOrder;

        // Update in database
        try {
            await taskStageService.updateStage(newStages[stageIndex].id, {
                order: newStages[stageIndex].order
            });
            await taskStageService.updateStage(newStages[targetIndex].id, {
                order: newStages[targetIndex].order
            });

            // Update stages
            await fetchStages();
        } catch (err) {
            console.error('Error reordering stages:', err);
            setError('Failed to reorder stages.');
        }
    };

    // Move stage right (increase order)
    const handleMoveStageRight = async (stageId) => {
        const stageIndex = stages.findIndex(s => s.id === stageId);
        if (stageIndex === -1 || stageIndex >= stages.length - 1) return; // Can't move further right

        const newStages = [...stages];
        const targetIndex = stageIndex + 1;

        // Swap orders
        const tempOrder = newStages[stageIndex].order;
        newStages[stageIndex].order = newStages[targetIndex].order;
        newStages[targetIndex].order = tempOrder;

        // Update in database
        try {
            await taskStageService.updateStage(newStages[stageIndex].id, {
                order: newStages[stageIndex].order
            });
            await taskStageService.updateStage(newStages[targetIndex].id, {
                order: newStages[targetIndex].order
            });

            // Update stages
            await fetchStages();
        } catch (err) {
            console.error('Error reordering stages:', err);
            setError('Failed to reorder stages.');
        }
    };

    // Get icon component by name
    const getIconComponent = (iconName) => {
        const icon = availableIcons.find(i => i.name === iconName);
        return icon ? icon.component : <Circle />;
    };

    if (isLoading && tasks.length === 0) {
        return <SkeletonLoader />;
    }

    const formatTimeDisplay = (timeString) => {
        if (!timeString) return '';

        // Extract just HH:MM from the time string
        const timePart = timeString.substring(0, 5);

        // Convert 24h to 12h format for display
        const [hours, minutes] = timePart.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const displayHours = hours % 12 || 12; // Convert 0 to 12 for 12 AM

        return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    return (
        <div className="space-y-6">
            {/* Header with urgent gradient background */}
            <div className={`bg-gradient-to-r ${showDueWarning ? 'from-red-600 to-amber-500' : 'from-blue-600 to-indigo-700'} -mx-4 -mt-6 px-4 py-6 mb-8 rounded-b-3xl shadow-md transition-colors duration-300`}>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-2">
                    <div className="flex items-center mb-4 sm:mb-0">
                        <div className={`${showDueWarning ? 'bg-red-50 text-red-600' : 'bg-white text-blue-600'} p-2 rounded-xl shadow-md mr-3 transition-colors duration-300`}>
                            {showDueWarning ? (
                                <AlertTriangle className="h-6 w-6" />
                            ) : (
                                <LayoutDashboard className="h-6 w-6" />
                            )}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">Today Focus</h1>
                            <p className="text-blue-100 text-sm flex items-center">
                                {new Date().toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                })}
                                {showDueWarning && (
                                    <span className="ml-2 bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-xs font-medium flex items-center">
                                        <AlertTriangle className="h-3 w-3 mr-1" />
                                        {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex space-x-2">
                        {/* Refresh button */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="secondary"
                                        size="icon"
                                        onClick={handleRefresh}
                                        disabled={isRefreshing}
                                        className="bg-white/20 hover:bg-white/30 text-white"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Refresh Dashboard</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Manage Stages button */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant={isManagingStages ? "secondary" : "outline"}
                                        size="icon"
                                        onClick={() => setIsManagingStages(!isManagingStages)}
                                        className={isManagingStages
                                            ? "bg-white text-blue-700 hover:bg-white/90"
                                            : "bg-white/20 hover:bg-white/30 text-white border-white/30"
                                        }
                                    >
                                        <Layers className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>{isManagingStages ? "Exit Stage Management" : "Manage Stages"}</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>

                        {/* Settings button */}
                        <TooltipProvider>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => router.push('/settings')}
                                        className="bg-white/20 hover:bg-white/30 text-white border-white/30"
                                    >
                                        <SettingsIcon className="h-4 w-4" />
                                    </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Settings</p>
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>

            {/* Stage Management Actions */}
            {isManagingStages && (
                <div className="flex items-center justify-between bg-gradient-to-r from-blue-100 to-indigo-100 p-4 rounded-xl shadow-md mb-4">
                    <div className="flex items-center">
                        <div className="bg-blue-600 text-white p-2 rounded-lg shadow-sm mr-3">
                            <Layers className="h-4 w-4" />
                        </div>
                        <div>
                            <h3 className="font-medium text-blue-800">Stage Management Mode</h3>
                            <p className="text-sm text-blue-600">Customize your workflow stages</p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button
                            variant="default"
                            size="sm"
                            onClick={() => setIsAddStageDialogOpen(true)}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <PlusCircle className="h-4 w-4 mr-1" />
                            Add Stage
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsManagingStages(false)}
                            className="border-blue-300 text-blue-700 hover:bg-blue-50"
                        >
                            <X className="h-4 w-4 mr-1" />
                            Exit
                        </Button>
                    </div>
                </div>
            )}

            {/* Work Hours Alert - Show when not in work hours */}
            {!isWithinWorkHours && userSettings && (
                <Alert className="mb-4 bg-amber-50 border-amber-200">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                        You're outside your configured work hours ({formatTimeDisplay(userSettings.work_start_time)} - {formatTimeDisplay(userSettings.work_end_time)}).
                        Tasks you create now will be included in your next work day.
                    </AlertDescription>
                </Alert>
            )}

            {/* Overdue tasks warning */}
            {showDueWarning && (
                <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-800 animate-pulse">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription className="flex items-center justify-between">
                        <span>You have {overdueTasks.length} overdue task{overdueTasks.length !== 1 ? 's' : ''}. Please prioritize these items!</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="ml-2 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-700"
                            onClick={() => setShowDueWarning(false)}
                        >
                            Dismiss
                        </Button>
                    </AlertDescription>
                </Alert>
            )}

            {/* Statistics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="bg-gradient-to-br from-violet-50 to-violet-100 border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-violet-200 rounded-full -mt-6 -mr-6 opacity-40"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-violet-800 flex items-center">
                            <ListChecks className="h-4 w-4 mr-2 text-violet-700" />
                            Total Tasks
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-violet-900">{statistics.total}</div>
                        <p className="text-xs text-violet-700 mt-1">Your productivity index</p>
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-emerald-200 rounded-full -mt-6 -mr-6 opacity-40"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-emerald-800 flex items-center">
                            <CheckCircle className="h-4 w-4 mr-2 text-emerald-700" />
                            Completed
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-emerald-900">{statistics.byStatus['Completed'] || 0}</div>
                        <Progress
                            value={statistics.total ? ((statistics.byStatus['Completed'] || 0) / statistics.total) * 100 : 0}
                            className="mt-2 bg-emerald-200"
                            indicatorClassName={(statistics.byStatus['Completed'] || 0) > 0 ? "bg-emerald-600" : undefined}
                        />
                    </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden">
                    <div className="absolute right-0 top-0 w-16 h-16 bg-blue-200 rounded-full -mt-6 -mr-6 opacity-40"></div>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-blue-800 flex items-center">
                            <Play className="h-4 w-4 mr-2 text-blue-700" />
                            In Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-900">
                            {(statistics.byStatus['In Progress'] || 0) + (statistics.byStatus['Working On'] || 0)}
                        </div>
                        <p className="text-xs text-blue-700 mt-1">Active work items</p>
                    </CardContent>
                </Card>

                <Card className={`${statistics.overdue > 0 ? 'bg-gradient-to-br from-red-50 to-red-100' : 'bg-gradient-to-br from-amber-50 to-amber-100'} border-none shadow-md hover:shadow-lg transition-shadow overflow-hidden`}>
                    <div className={`absolute right-0 top-0 w-16 h-16 ${statistics.overdue > 0 ? 'bg-red-200' : 'bg-amber-200'} rounded-full -mt-6 -mr-6 opacity-40`}></div>
                    <CardHeader className="pb-2">
                        <CardTitle className={`text-sm font-medium ${statistics.overdue > 0 ? 'text-red-800' : 'text-amber-800'} flex items-center`}>
                            {statistics.overdue > 0 ? (
                                <AlertTriangle className="h-4 w-4 mr-2 text-red-600" />
                            ) : (
                                <Circle className="h-4 w-4 mr-2 text-amber-700" />
                            )}
                            {statistics.overdue > 0 ? 'Overdue' : 'Not Started'}
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className={`text-3xl font-bold ${statistics.overdue > 0 ? 'text-red-900' : 'text-amber-900'}`}>
                            {statistics.overdue > 0 ? statistics.overdue : (statistics.byStatus['Not Started'] || 0)}
                        </div>
                        <p className={`text-xs ${statistics.overdue > 0 ? 'text-red-700' : 'text-amber-700'} mt-1`}>
                            {statistics.overdue > 0 ? 'Need immediate attention!' : 'Waiting to begin'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Timer component */}
            {!isFocusModeActive && (
                <Timer
                    task={timeTrackingTask}
                    isRunning={isTimerRunning}
                    isPaused={isTimerPaused}
                    onStop={handleStopTimer}
                    onPause={handlePauseTimer}
                    onResume={handleResumeTimer}
                />
            )}

            {/* Focus Mode */}
            {isFocusModeActive && timeTrackingTask && (
                <FocusMode
                    task={timeTrackingTask}
                    isRunning={isTimerRunning}
                    isPaused={isTimerPaused}
                    elapsedTime={elapsedTime}
                    onClose={() => setIsFocusModeActive(false)}
                    onPause={handlePauseTimer}
                    onResume={handleResumeTimer}
                    onStop={handleStopTimer}
                    onSubtaskUpdate={handleFocusModeSubtaskUpdate}
                />
            )}

            {/* Error display */}
            {error && (
                <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            {
                !isFocusModeActive && (
                    <>
                        {/* Add task input */}
                        <div className="bg-white p-4 rounded-xl shadow-md border border-gray-100">
                            <h3 className="text-gray-700 font-medium mb-2 flex items-center">
                                <PlusCircle className="h-4 w-4 mr-2 text-blue-600" />
                                Add New Task
                            </h3>
                            <div className="flex items-center space-x-2">
                                <Input
                                    placeholder="What needs to be done today?"
                                    value={newTaskTitle}
                                    onChange={(e) => setNewTaskTitle(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !isAddingTask && newTaskTitle.trim()) {
                                            handleAddTask();
                                        }
                                    }}
                                    disabled={isAddingTask}
                                    className="bg-gray-50"
                                />
                                <Button
                                    onClick={handleAddTask}
                                    disabled={isAddingTask || !newTaskTitle.trim()}
                                    className={`${showDueWarning ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    <PlusCircle className="h-4 w-4 mr-2" />
                                    Add
                                </Button>
                            </div>
                        </div>

                        <div className="relative">
                            <div
                                ref={columnsContainerRef}
                                className="flex overflow-x-auto pb-4 px-2 -mx-2 hide-scrollbar"
                                style={{
                                    scrollbarWidth: 'none',
                                    msOverflowStyle: 'none',
                                    minHeight: 'calc(100vh - 420px)',
                                    scrollSnapType: 'x mandatory' // Add snap scrolling for better mobile experience
                                }}
                            >
                                {columnsWithIcons.map((column, index) => (
                                    <div
                                        key={column.id}
                                        className="flex-shrink-0 md:w-[calc(61.8%-0.5rem)] w-[90%] min-w-[280px] max-w-[400px] mr-4 last:mr-0 flex flex-col h-full"
                                        style={{ scrollSnapAlign: 'start' }} // Makes columns snap during scroll on mobile
                                    >
                                        {/* Column header */}
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center space-x-2">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-lg" style={{
                                                    backgroundColor: `${column.color}20`,
                                                    color: column.color
                                                }}>
                                                    {column.icon}
                                                </div>
                                                <h3 className="font-medium">{column.title}</h3>
                                                <Badge variant="outline" className="bg-white">
                                                    {getTasksByStatus(column.status).length}
                                                </Badge>
                                            </div>

                                            {isManagingStages && (
                                                <div className="flex items-center space-x-1">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleMoveStageLeft(column.id)}
                                                        disabled={index === 0}
                                                    >
                                                        <ChevronLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => handleMoveStageRight(column.id)}
                                                        disabled={index === columnsWithIcons.length - 1}
                                                    >
                                                        <ChevronRight className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7"
                                                        onClick={() => {
                                                            setStageToEdit({
                                                                id: column.id,
                                                                title: column.title,
                                                                color: column.color,
                                                                icon: column.icon.type.render().props.icon || 'Circle',
                                                                isActive: column.isActive
                                                            });
                                                        }}
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                        onClick={() => {
                                                            setStageToDelete(column);
                                                            setIsConfirmDeleteOpen(true);
                                                        }}
                                                        disabled={columnsWithIcons.length <= 1}
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Task cards - with flexible height instead of fixed */}
                                        <div className="flex-1 bg-gray-50 rounded-xl p-3 shadow-inner overflow-y-auto"><div className="space-y-3 min-h-[200px]">
                                            {getTasksByStatus(column.status).map((task) => (
                                                <TaskCard
                                                    key={task.id}
                                                    task={task}
                                                    columns={columnsWithIcons}
                                                    onOpenTask={handleOpenTask}
                                                    onStatusChange={handleStatusChange}
                                                    onDelete={handleTaskDeleted}
                                                    onStartTimer={handleStartTimer}
                                                    onToggleKeep={handleToggleKeepTask}
                                                />
                                            ))}

                                            {getTasksByStatus(column.status).length === 0 && (
                                                <div className="flex flex-col items-center justify-center py-10 text-gray-400 text-sm">
                                                    <Circle className="h-10 w-10 mb-3 opacity-20" />
                                                    <p>No tasks in this column</p>
                                                    <p className="text-xs text-gray-400 mt-1">Add a task to get started</p>
                                                </div>
                                            )}
                                        </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
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

                        {/* CSS for hiding scrollbar */}
                        <style jsx global>{`
                            .hide-scrollbar::-webkit-scrollbar {
                                display: none;
                            }
                            .hide-scrollbar {
                                -ms-overflow-style: none;
                                scrollbar-width: none;
                            }
                        `}</style>
                    </>
                )
            }

            {/* End-of-day task cleanup dialog */}
            <Dialog open={showEndDayPrompt} onOpenChange={setShowEndDayPrompt}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>End of Day Cleanup</DialogTitle>
                        <DialogDescription>
                            <p>Your workday is ending. Would you like to clean up your tasks now?</p>

                            {userSettings?.keep_completed_tasks && (
                                <p className="mt-2 flex items-center text-green-600">
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Completed tasks will be removed to declutter your dashboard
                                </p>
                            )}

                            <p className="mt-2 flex items-center text-blue-600">
                                <Bookmark className="h-4 w-4 mr-2 fill-blue-500" />
                                Tasks marked "Keep" will be preserved regardless of status
                            </p>

                            <p className="mt-2 flex items-center text-amber-600">
                                <AlertCircle className="h-4 w-4 mr-2" />
                                Incomplete tasks will remain for tomorrow
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => handleEndDayCleanup(false)}>
                            Skip Cleanup
                        </Button>
                        <Button onClick={() => handleEndDayCleanup(true)}>
                            Clean Up Tasks
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Stage edit/delete dialogs */}
            <Dialog open={isConfirmDeleteOpen} onOpenChange={setIsConfirmDeleteOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Stage</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete the "{stageToDelete?.title}" stage?
                            Tasks in this stage will be moved to another active stage.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsConfirmDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteStage}
                        >
                            Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Onboarding modal for new users */}
            {showOnboarding && (
                <OnboardingModal
                    userId={user?.id}
                    isOpen={showOnboarding}
                    onComplete={() => setShowOnboarding(false)}
                />
            )}
        </div>
    );
}

import React, { useState, useMemo } from 'react';
import { useSettingsStore } from '@/store/useSettingsStore';
import { useOKRStore } from '@/store/useOKRStore';
import { OKRNode } from '@/types';
import { Calendar as CalendarIcon, GripVertical } from 'lucide-react';
import { format, addDays, addMonths, startOfWeek, eachDayOfInterval, isSameDay, differenceInDays, parseISO, isWeekend, startOfDay, endOfMonth, startOfMonth } from 'date-fns';
import { supabase } from '@/lib/supabase';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { SchedulerHeader } from './SchedulerHeader';

// --- Constants ---

const TASK_HEIGHT = 60;
const TASK_GAP = 8;
const BASE_ROW_HEIGHT = 80;

// --- Helper Components ---

// --- Capacity Component ---

const CapacityHeatmap = ({
    resources,
    days,
    nodes,
    cellWidth,
    viewMode
}: {
    resources: { id: string, name: string }[],
    days: Date[],
    nodes: OKRNode[],
    cellWidth: number,
    viewMode: 'day' | 'week' | 'month'
}) => {
    // 1. Calculate Daily Load
    const loadMap = useMemo(() => {
        // resourceId -> dateStr -> totalHours
        const map = new Map<string, Map<string, number>>();

        nodes.filter(n => n.type === 'TASK' && n.startDate && n.endDate && n.owner).forEach(task => {
            if (!task.startDate || !task.endDate || !task.owner) return;

            const start = parseISO(task.startDate);
            const end = parseISO(task.endDate);
            const totalHours = task.estimatedHours || 0;

            // Calculate working days duration
            let workingDays = 0;
            const iter = { current: start };
            while (iter.current <= end) {
                if (!isWeekend(iter.current)) workingDays++;
                iter.current = addDays(iter.current, 1);
            }
            if (workingDays === 0) workingDays = 1; // Prevent division by zero if weekend only (edge case)

            const dailyLoad = totalHours / workingDays;

            // Distribute load
            let current = start;
            while (current <= end) {
                if (!isWeekend(current)) {
                    const dateStr = format(current, 'yyyy-MM-dd');
                    if (!map.has(task.owner)) map.set(task.owner, new Map());
                    const resourceMap = map.get(task.owner)!;
                    resourceMap.set(dateStr, (resourceMap.get(dateStr) || 0) + dailyLoad);
                }
                current = addDays(current, 1);
            }
        });
        return map;
    }, [nodes]);

    const { allCapacities, fetchAllSettings } = useSettingsStore();

    React.useEffect(() => {
        fetchAllSettings();
    }, []);

    // 2. Render Helper
    // 2. Render Helper
    // 2. Render Helper
    const getCellColor = (hours: number, dateStr: string, resourceId: string) => {
        // Get User Specific Settings
        const settings = allCapacities[resourceId] || { dailyLimit: 8, okrAllocation: 20, exceptions: [] };
        const { dailyLimit, okrAllocation, exceptions } = settings;

        // Check for Exception
        const exception = (exceptions || []).find((e: any) => e.date === dateStr);
        let limit = dailyLimit * (okrAllocation / 100);

        if (exception) {
            // Highlighting logic handled in parent, this just returns color class
            // Exception overrides specific hours. If exception is 4h, that's the limit.
            // Note: Does exception imply total day or OKR specific?
            // Let's assume exception is raw hours available for OKRs for simplicity or override entire calculation.
            limit = exception.hours;

            if (hours > limit) return 'bg-red-100/50 text-red-700 dark:bg-red-900/20 dark:text-red-400 font-bold border-red-200';
            if (limit === 0) return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 opacity-70'; // Vacation/Off
        }

        // Standard Limits
        const safeLimit = limit * 0.75;

        if (hours <= safeLimit) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'; // Safe
        if (hours <= limit) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'; // Optimal
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 font-bold'; // Overloaded
    };

    // 3. Columns Logic (Aggregation)
    const columns = useMemo(() => {
        if (viewMode === 'day') {
            return days.map(d => ({
                id: d.toISOString(),
                label: format(d, 'd'),
                subLabel: format(d, 'EEE'),
                start: d,
                end: d,
                width: cellWidth,
                isWeekend: isWeekend(d)
            }));
        }

        if (viewMode === 'week') {
            // Group by Week
            const weeks: any[] = [];
            let currentWeekStart = startOfWeek(days[0]);
            // Ensure we cover the full range
            const lastDay = days[days.length - 1];

            while (currentWeekStart <= lastDay) {
                const currentWeekEnd = addDays(currentWeekStart, 6);
                weeks.push({
                    id: currentWeekStart.toISOString(),
                    label: `Week of ${format(currentWeekStart, 'MMM d')}`,
                    subLabel: `W${format(currentWeekStart, 'w')}`,
                    start: currentWeekStart,
                    end: currentWeekEnd,
                    width: cellWidth * 7,
                    isWeekend: false
                });
                currentWeekStart = addDays(currentWeekStart, 7);
            }
            return weeks;
        }

        if (viewMode === 'month') {
            // Group by Month
            const months: any[] = [];
            let currentMonthStart = startOfMonth(days[0]);
            const lastDay = days[days.length - 1];

            while (currentMonthStart <= lastDay) {
                const currentMonthEnd = endOfMonth(currentMonthStart);
                const daysInMonth = differenceInDays(currentMonthEnd, currentMonthStart) + 1;
                months.push({
                    id: currentMonthStart.toISOString(),
                    label: format(currentMonthStart, 'MMMM yyyy'),
                    subLabel: format(currentMonthStart, 'MMM'),
                    start: currentMonthStart,
                    end: currentMonthEnd,
                    width: cellWidth * daysInMonth,
                    isWeekend: false
                });
                currentMonthStart = addMonths(currentMonthStart, 1);
            }
            return months;
        }

        return [];
    }, [days, viewMode, cellWidth]);

    const getAggregateLoad = (resourceId: string, start: Date, end: Date) => {
        let totalLoad = 0;
        let totalCapacity = 0;
        let current = start;
        const resourceLoad = loadMap.get(resourceId);

        while (current <= end) {
            if (!isWeekend(current)) {
                const dateStr = format(current, 'yyyy-MM-dd');
                const dayLoad = resourceLoad?.get(dateStr) || 0;

                // Get Capacity
                const settings = allCapacities[resourceId] || { dailyLimit: 8, okrAllocation: 20, exceptions: [] };
                const exception = (settings.exceptions || []).find((e: any) => e.date === dateStr);
                const dayLimit = exception ? exception.hours : settings.dailyLimit * (settings.okrAllocation / 100);

                if (exception?.hours !== 0) { // If not OFF
                    totalLoad += dayLoad;
                    totalCapacity += dayLimit;
                }
            }
            current = addDays(current, 1);
        }

        return { totalLoad, totalCapacity };
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            <div className="flex flex-1 overflow-hidden">
                <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
                    {/* Header */}
                    <div className="flex border-b border-border bg-muted/20">
                        <div className="w-48 shrink-0 p-4 font-semibold text-sm border-r border-border flex items-center bg-background z-20 sticky left-0">
                            Resource Capacity
                        </div>
                        <div className="flex overflow-x-hidden">
                            {columns.map(col => (
                                <div
                                    key={col.id}
                                    className={`shrink-0 border-r border-border/50 text-center py-2 text-xs font-medium flex flex-col justify-center ${col.isWeekend ? 'bg-muted/30' : ''
                                        } ${viewMode !== 'day' ? 'bg-background/50' : ''}`}
                                    style={{ width: col.width }}
                                >
                                    <div className="opacity-50 text-[10px] uppercase tracking-wider truncate px-1">{col.subLabel}</div>
                                    <div className="text-sm font-semibold truncate px-1">{viewMode === 'day' ? col.label : col.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="flex-1 overflow-auto">
                        {resources.filter(r => r.id !== 'unassigned').map(resource => (
                            <div key={resource.id} className="flex border-b border-border/50 h-[60px]"> {/* Shorter row height */}
                                <div className="w-48 shrink-0 p-3 border-r border-border bg-background flex items-center gap-3 sticky left-0 z-20">
                                    <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold ring-2 ring-background">
                                        {resource.name?.[0] || 'U'}
                                    </div>
                                    <div className="truncate">
                                        <div className="text-sm font-medium truncate">{resource.name}</div>
                                    </div>
                                </div>
                                <div className="flex relative">
                                    {columns.map(col => {
                                        const { totalLoad, totalCapacity } = getAggregateLoad(resource.id, col.start, col.end);

                                        let workingDays = 0;
                                        let iter = col.start;
                                        while (iter <= col.end) {
                                            if (!isWeekend(iter)) workingDays++;
                                            iter = addDays(iter, 1);
                                        }
                                        if (workingDays === 0) workingDays = 1;

                                        const avgDailyLoad = totalLoad / workingDays;
                                        const dateStr = format(col.start, 'yyyy-MM-dd');

                                        return (
                                            <div
                                                key={col.id}
                                                className={`shrink-0 border-r border-border/50 h-full flex items-center justify-center text-xs font-medium relative ${col.isWeekend ? 'bg-muted/30' : ''}`}
                                                style={{ width: col.width }}
                                            >
                                                {!col.isWeekend && (
                                                    <div className={`mx-0.5 my-1 rounded-sm w-full h-[80%] flex flex-col items-center justify-center relative z-10 
                                                        ${getCellColor(avgDailyLoad, dateStr, resource.id)}`}>

                                                        <div className="font-bold text-xs sm:text-sm">
                                                            {totalCapacity > 0 ? Math.round(totalLoad / totalCapacity * 100) : 0}%
                                                        </div>
                                                        {viewMode === 'day' && (
                                                            <span className="text-[10px] opacity-80">{avgDailyLoad.toFixed(1)}h</span>
                                                        )}
                                                        {viewMode !== 'day' && (
                                                            <span className="text-[9px] opacity-70 uppercase tracking-tight">{Math.round(totalLoad)}h</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Legend */}
            <div className="p-4 border-t border-border flex gap-6 text-xs text-muted-foreground bg-background">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Safe (≤ 75% of Limit)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div> Optimal (75-100% of Limit)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> Overloaded {`>`} Limit
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-purple-100 border border-purple-200"></div> Exception / Off
                </div>
                <div className="ml-auto text-primary/50">
                    * Limits vary per user settings.
                </div>
            </div>
        </div>
    );
}

// --- Helper Components ---



// --- Main Page Component ---

export function SchedulingPage() {
    const { nodes, updateNode, organizationId } = useOKRStore();
    const { allCapacities, fetchAllSettings } = useSettingsStore();

    React.useEffect(() => {
        fetchAllSettings();
    }, []);

    const [viewDate, setViewDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'schedule' | 'capacity'>('schedule');
    const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('day');

    // --- Dynamic View Logic ---
    const cellWidth = useMemo(() => {
        switch (viewMode) {
            case 'day': return 100;
            case 'week': return 40;
            case 'month': return 10;
            default: return 100;
        }
    }, [viewMode]);

    const { startDate, endDate, days } = useMemo(() => {
        const start = startOfWeek(viewDate);
        let end;
        switch (viewMode) {
            case 'day':
                end = addDays(start, 14); // 2 weeks
                break;
            case 'week':
                end = addMonths(start, 3); // 3 months
                break;
            case 'month':
                end = addMonths(start, 12); // 1 year
                break;
            default:
                end = addDays(start, 14);
        }
        return {
            startDate: start,
            endDate: end,
            days: eachDayOfInterval({ start, end })
        };
    }, [viewDate, viewMode]);

    // ... (keep existing data prep: resources, startDate, endDate, days, tasks)


    const [teams, setTeams] = useState<any[]>([]);
    const [selectedTeamId, setSelectedTeamId] = useState<string>('all');
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [isOverUnscheduled, setIsOverUnscheduled] = useState(false);

    const isReadOnly = selectedTeamId === 'all';

    // Fetch Teams
    React.useEffect(() => {
        supabase.from('teams').select('*').then(({ data }) => {
            if (data) setTeams(data);
        });
    }, []);

    // Fetch Members when Team Selected (or All)
    React.useEffect(() => {
        if (!organizationId) return;

        const fetchMembers = async () => {
            if (selectedTeamId === 'all') {
                // Fetch ALL Organization Members
                const { data } = await supabase
                    .from('organization_members')
                    .select('user_id, profiles(full_name)')
                    .eq('organization_id', organizationId)
                    .eq('status', 'active');

                if (data) setTeamMembers(data);
            } else {
                // Fetch Team Members
                const { data } = await supabase
                    .from('team_members')
                    .select('user_id, profiles(full_name)')
                    .eq('team_id', selectedTeamId);

                if (data) setTeamMembers(data);
            }
        };

        fetchMembers();
    }, [selectedTeamId, organizationId]);


    // 1. Resources (Users)
    const resources = useMemo(() => {
        let roleLabel = 'Member';
        if (selectedTeamId !== 'all') {
            const team = teams.find(t => t.id === selectedTeamId);
            if (team) roleLabel = team.name;
        }

        return teamMembers.map((m: any) => ({
            id: m.user_id,
            name: m.profiles?.full_name || 'Unknown',
            role: roleLabel
        }));
    }, [teamMembers, selectedTeamId, teams]);

    // 2. Timeline Interval (Handled in Dynamic View Logic above)

    // 3. Tasks
    const unscheduledTasks = useMemo(() =>
        nodes.filter(n => {
            const isTask = n.type === 'TASK' && (!n.startDate || !n.endDate);
            if (!isTask) return false;
            if (selectedTeamId !== 'all') return n.teamId === selectedTeamId;
            return true;
        }),
        [nodes, selectedTeamId]);

    const scheduledTasks = useMemo(() =>
        nodes.filter(n => {
            const isTask = n.type === 'TASK' && n.startDate && n.endDate;
            if (!isTask) return false;
            if (selectedTeamId !== 'all') return n.teamId === selectedTeamId;
            return true;
        }),
        [nodes, selectedTeamId]);

    // --- Drag & Drop State ---
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    // --- Resize State ---
    const [resizingTask, setResizingTask] = useState<{ id: string, originalEnd: Date, startX: number } | null>(null);

    // --- Confirmation State ---
    const [pendingReassignment, setPendingReassignment] = useState<{
        taskId: string;
        resourceId: string;
        newStart: string;
        newEnd: string;
        currentOwnerName: string;
        newOwnerName: string;
    } | null>(null);

    const [dependencyError, setDependencyError] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
    } | null>(null);

    // --- Generic Modal State (replaces alerts) ---
    const [infoModal, setInfoModal] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        variant?: 'info' | 'danger' | 'warning';
    } | null>(null);

    // --- Auto-Schedule State ---
    const [autoScheduleProposal, setAutoScheduleProposal] = useState<{
        updates: { id: string; startDate: string; endDate: string }[];
        count: number;
    } | null>(null);

    // --- Resize Handlers ---
    const handleResizeStart = (e: React.MouseEvent, taskId: string, endDate: string) => {
        e.preventDefault();
        e.stopPropagation();
        setResizingTask({
            id: taskId,
            originalEnd: parseISO(endDate),
            startX: e.clientX
        });
    };

    // Global Mouse Listeners for Resize
    React.useEffect(() => {
        if (!resizingTask) return;

        const handleMouseMove = () => {
            // Visual feedback handled by render logic reading resizingTask if needed, or we just wait for drop
            // For smoother UI, we could have a "currentDragEnd" state, but for now let's rely on drop update.
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!resizingTask) return;

            const diffX = e.clientX - resizingTask.startX;
            const dayDiff = Math.round(diffX / cellWidth);

            if (dayDiff !== 0) {
                let newEnd = addDays(resizingTask.originalEnd, dayDiff);

                // Skip weekends
                if (dayDiff > 0) {
                    // Extending: If lands on weekend, push to Monday
                    while (isWeekend(newEnd)) newEnd = addDays(newEnd, 1);
                } else {
                    // Shrinking: If lands on weekend, pull to Friday
                    while (isWeekend(newEnd)) newEnd = addDays(newEnd, -1);
                }

                // Ensure newEnd >= startDate
                const task = nodes.find(n => n.id === resizingTask.id);
                if (task && task.startDate) {
                    const start = parseISO(task.startDate);
                    if (newEnd >= start) {
                        updateNode(resizingTask.id, {
                            endDate: format(newEnd, 'yyyy-MM-dd')
                        });
                    }
                }
            }
            setResizingTask(null);
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleMouseUp);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [resizingTask, nodes, updateNode, cellWidth]);


    // --- Handlers ---

    // --- Packing Algorithm ---
    const packTasks = (tasks: OKRNode[]) => {
        // Sort by start date
        const sorted = [...tasks].sort((a, b) => {
            const A = parseISO(a.startDate!);
            const B = parseISO(b.startDate!);
            return A.getTime() - B.getTime();
        });

        const lanes: Date[] = []; // Stores the end date of the last task in each lane
        const layout = new Map<string, number>();

        sorted.forEach(task => {
            if (!task.startDate || !task.endDate) return;
            const start = parseISO(task.startDate);
            const end = parseISO(task.endDate);

            let laneIndex = -1;

            // Find first lane that is free
            for (let i = 0; i < lanes.length; i++) {
                // If lane ends before this task starts, it's free.
                // We strictly need laneEnd < start.
                if (lanes[i] < start) {
                    laneIndex = i;
                    break;
                }
            }

            if (laneIndex === -1) {
                laneIndex = lanes.length;
                lanes.push(end);
            } else {
                lanes[laneIndex] = end;
            }

            layout.set(task.id, laneIndex);
        });

        return { layout, maxLanes: lanes.length };
    };

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        if (isReadOnly) {
            e.preventDefault();
            setInfoModal({
                isOpen: true,
                title: "View Only Mode",
                message: "You are in 'All Teams' view. Please select a specific team to edit the schedule.",
                variant: 'info'
            });
            return;
        }
        setDraggingTaskId(taskId);
        e.dataTransfer.setData('text/plain', taskId); // Standard format
        e.dataTransfer.setData('taskId', taskId); // Legacy/Fallback
        e.dataTransfer.effectAllowed = 'move';
    };

    // --- Helpers ---

    const calculateEndDate = (startDate: Date, requiredHours: number, resourceId: string): Date => {
        let current = startDate;
        let hoursRemaining = requiredHours;
        let safetyCounter = 0;

        // Get capabilities
        const settings = allCapacities[resourceId] || { dailyLimit: 8, okrAllocation: 20, exceptions: [] };
        const standardDaily = Math.max(0.1, settings.dailyLimit * (settings.okrAllocation / 100)); // Prevent 0/infinite loop

        while (hoursRemaining > 0 && safetyCounter < 365) {
            safetyCounter++;

            if (!isWeekend(current)) {
                const dateStr = format(current, 'yyyy-MM-dd');
                const exception = (settings.exceptions || []).find((e: any) => e.date === dateStr);

                // Available capacity for this day
                let daysCapacity = standardDaily;
                if (exception) {
                    daysCapacity = exception.hours;
                }

                if (daysCapacity > 0) {
                    hoursRemaining -= daysCapacity;
                }
            }

            if (hoursRemaining > 0) {
                current = addDays(current, 1);
            }
        }
        return current;
    };

    // --- Helper Components ---
    // ...

    // --- Main Page Component ---
    // ...

    const handleDropOnCell = async (e: React.DragEvent, resourceId: string, day: Date) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('taskId');
        if (!taskId) return;

        const task = nodes.find(n => n.id === taskId);
        if (!task) return;

        // Auto-Schedule Duration based on User Capacity
        const estimatedHours = task.estimatedHours || 8; // Default if missing

        // Calculate Start and End respecting weekends
        let start = day;
        while (isWeekend(start)) {
            start = addDays(start, 1);
        }

        const end = calculateEndDate(start, estimatedHours, resourceId);

        const newStart = format(start, 'yyyy-MM-dd');
        const newEnd = format(end, 'yyyy-MM-dd');

        // Validation: Dependency Check
        if (task.dependencies && task.dependencies.length > 0) {
            const blockers = nodes.filter(n => task.dependencies!.includes(n.id) && n.endDate);
            let violation: OKRNode | null = null;

            for (const blocker of blockers) {
                if (!blocker.endDate) continue;
                const blockerEnd = parseISO(blocker.endDate);
                const proposedStart = parseISO(newStart);

                if (proposedStart <= blockerEnd) {
                    violation = blocker;
                    break;
                }
            }

            if (violation) {
                setDependencyError({
                    isOpen: true,
                    title: "Dependency Violation",
                    message: `Blocker: "${violation.title}" ends ${violation.endDate}. You tried ${newStart}.`
                });
                setDraggingTaskId(null);
                return;
            }
        }

        // Check for reassignment
        if (task.owner && task.owner !== resourceId && resourceId !== 'unassigned') {
            const currentOwnerName = task.ownerName || 'Unknown User';
            const newOwnerName = resources.find(r => r.id === resourceId)?.name || 'Unknown User';

            setPendingReassignment({
                taskId,
                resourceId,
                newStart,
                newEnd,
                currentOwnerName,
                newOwnerName
            });
            setDraggingTaskId(null);
            return;
        }

        await updateNode(taskId, {
            startDate: newStart,
            endDate: newEnd,
            owner: resourceId === 'unassigned' ? '' : resourceId
        });

        setDraggingTaskId(null);
    };

    const confirmReassignment = async () => {
        if (!pendingReassignment) return;

        const { taskId, resourceId, newStart, newEnd } = pendingReassignment;
        await updateNode(taskId, {
            startDate: newStart,
            endDate: newEnd,
            owner: resourceId === 'unassigned' ? '' : resourceId
        });
        setPendingReassignment(null);
    };

    const handleDropOnUnscheduled = async (e: React.DragEvent) => {
        e.preventDefault();
        setIsOverUnscheduled(false);
        const taskId = e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('taskId');
        if (!taskId) return;

        const task = nodes.find(n => n.id === taskId);
        // Only update if it currently has dates (is scheduled)
        if (task) {
            console.log("Dropping to Unscheduled:", task.title);
            await updateNode(taskId, {
                startDate: null as any,
                endDate: null as any,
            });
        }
        setDraggingTaskId(null);
    };



    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    // 4. Calculate Dependency Coordinates
    // 4. Calculate Layout (Unified)
    const layoutData = useMemo(() => {
        const coords = new Map<string, { x: number, y: number, width: number, height: number }>();
        const rows: { resource: any; rowHeight: number; tasks: any[]; layout: Map<string, number>; topY: number }[] = [];

        let currentY = 0;

        resources.forEach(resource => {
            const resourceTasks = scheduledTasks.filter(t => (t.owner === resource.id) || (!t.owner && resource.id === 'unassigned'));
            const { layout, maxLanes } = packTasks(resourceTasks); // Run once per resource

            // Calculate dynamic height
            const contentHeight = 36 + (maxLanes * (TASK_HEIGHT + TASK_GAP)) + 16;
            const rowHeight = Math.max(BASE_ROW_HEIGHT, contentHeight);

            // Store Row Data
            rows.push({
                resource,
                rowHeight,
                tasks: resourceTasks,
                layout,
                topY: currentY
            });

            // Calculate Coordinates for Overlay
            resourceTasks.forEach(task => {
                if (!task.startDate || !task.endDate) return;
                const start = parseISO(task.startDate);
                const end = parseISO(task.endDate);
                const diff = differenceInDays(start, days[0]);
                const x = diff * cellWidth;

                const duration = differenceInDays(end, start) + 1;
                const width = duration * cellWidth;

                const lane = layout.get(task.id) || 0;
                const localTop = 8 + (lane * (TASK_HEIGHT + TASK_GAP));

                const absY = currentY + localTop;
                coords.set(task.id, { x, y: absY, width, height: TASK_HEIGHT });
            });

            currentY += rowHeight;
        });

        return { taskCoordinates: coords, totalContentHeight: currentY, rows };
    }, [resources, scheduledTasks, days]);

    // 5. Circular Dependency Check
    React.useEffect(() => {
        const checkCycles = () => {
            const visited = new Set<string>();
            const recursionStack = new Set<string>();
            let cyclePath: string[] = [];

            const dfs = (nodeId: string, path: string[]): boolean => {
                visited.add(nodeId);
                recursionStack.add(nodeId);
                path.push(nodeId);

                const node = nodes.find(n => n.id === nodeId);
                if (node && node.dependencies) {
                    for (const depId of node.dependencies) {
                        if (!visited.has(depId)) {
                            if (dfs(depId, path)) return true;
                        } else if (recursionStack.has(depId)) {
                            // Cycle found
                            // Find the first occurrence of depId in path to only show the cycle part
                            const cycleStartIndex = path.indexOf(depId);
                            if (cycleStartIndex !== -1) {
                                // Keep only the cycle part + current node closing it
                                path.push(depId);
                                cyclePath = path.slice(cycleStartIndex);
                            } else {
                                path.push(depId);
                                cyclePath = [...path];
                            }
                            return true;
                        }
                    }
                }

                recursionStack.delete(nodeId);
                path.pop();
                return false;
            };

            for (const node of nodes) {
                if (node.type === 'TASK' && !visited.has(node.id)) {
                    if (dfs(node.id, [])) {
                        // Found cycle
                        const names = cyclePath.map(id => nodes.find(n => n.id === id)?.title || id).join(' → ');
                        setDependencyError({
                            isOpen: true,
                            title: "Circular Dependency Detected",
                            message: `A circular dependency exists: ${names}. Scheduling effectively locked for these tasks.`
                        });
                        return; // Only report one cycle at a time
                    }
                }
            }
        };

        const timeoutId = setTimeout(checkCycles, 1000); // Debounce check
        return () => clearTimeout(timeoutId);
    }, [nodes]);

    // 6. Auto-Schedule
    const handleAutoSchedule = async () => {
        // 1. Filter Eligible Tasks
        const eligibleTasks = nodes.filter(n =>
            n.type === 'TASK' &&
            (!n.startDate || !n.endDate) &&
            n.owner && n.owner !== 'unassigned' &&
            n.estimatedHours && n.estimatedHours > 0
        );

        if (eligibleTasks.length === 0) {
            setInfoModal({
                isOpen: true,
                title: "Auto-Schedule Info",
                message: "No eligible unscheduled tasks found. Tasks must have an Owner and Estimated Hours to be auto-scheduled.",
                variant: 'info'
            });
            return;
        }

        // 2. Topological Sort (Dependencies)
        // Store tasks in a map for easy access
        const taskMap = new Map(nodes.map(n => [n.id, n]));

        // Build Adjacency List for Eligible Tasks + Their Blockers
        const graph = new Map<string, string[]>(); // Key: Blocker, Value: Dependents
        const inDegree = new Map<string, number>();

        // Initialize
        eligibleTasks.forEach(t => {
            if (!graph.has(t.id)) graph.set(t.id, []);
            inDegree.set(t.id, 0);
        });

        eligibleTasks.forEach(task => {
            if (task.dependencies) {
                task.dependencies.forEach(blockerId => {
                    // We only care if the blocker is relevant (either eligible OR already scheduled)
                    // If blocker is eligible, add edge.
                    // If blocker is scheduled, we treat it as a fixed constraint later.
                    if (eligibleTasks.find(t => t.id === blockerId)) {
                        if (!graph.has(blockerId)) graph.set(blockerId, []);
                        graph.get(blockerId)!.push(task.id);
                        inDegree.set(task.id, (inDegree.get(task.id) || 0) + 1);
                    }
                });
            }
        });

        // Sort using Kahn's Algorithm
        const queue: string[] = [];
        inDegree.forEach((count, id) => {
            if (count === 0) queue.push(id);
        });

        const sortedIds: string[] = [];
        while (queue.length > 0) {
            const u = queue.shift()!;
            sortedIds.push(u);

            const neighbors = graph.get(u) || [];
            neighbors.forEach(v => {
                inDegree.set(v, (inDegree.get(v) || 0) - 1);
                if (inDegree.get(v) === 0) queue.push(v);
            });
        }

        // Check for cycles (if sorted invalid length vs eligible length)
        // logic skipped for brevity, reliant on main cycle detector. Use sortedIds.

        // 3. Schedule Sequentially ("Append Strategy")

        // Track latest "busy date" for each user. 
        // Initialize with their currently scheduled max End Date.
        const userAvailability = new Map<string, Date>(); // UserId -> FreeFromDate

        nodes.forEach(n => {
            if (n.type === 'TASK' && n.owner && n.endDate) {
                const end = parseISO(n.endDate);
                const currentMax = userAvailability.get(n.owner) || new Date(0); // Epoch
                if (end > currentMax) {
                    userAvailability.set(n.owner, end);
                }
            }
        });

        const updates: { id: string; startDate: string; endDate: string }[] = [];

        // We also need to track "Effective End Date" of tasks *being* scheduled in this batch to support chains A->B->C
        const tempDates = new Map<string, Date>(); // TaskId -> EndDate

        for (const taskId of sortedIds) {
            const task = taskMap.get(taskId);
            if (!task || !task.owner || !task.estimatedHours) continue;

            // A. Constraint: Dependencies
            let earliestStart = startOfDay(new Date());

            if (task.dependencies) {
                task.dependencies.forEach(depId => {
                    // Check scheduled node or temp node
                    let depEnd: Date | null = null;

                    if (tempDates.has(depId)) {
                        depEnd = tempDates.get(depId)!;
                    } else {
                        const depNode = taskMap.get(depId);
                        if (depNode && depNode.endDate) {
                            depEnd = parseISO(depNode.endDate);
                        }
                    }

                    if (depEnd) {
                        // Start AFTER dependency ends
                        const potentialStart = addDays(depEnd, 1);
                        if (potentialStart > earliestStart) earliestStart = potentialStart;
                    }
                });
            }

            // B. Constraint: User Availability
            const userFreeFrom = userAvailability.get(task.owner);
            if (userFreeFrom) {
                const potentialStart = addDays(userFreeFrom, 1);
                if (potentialStart > earliestStart) earliestStart = potentialStart;
            }

            // C. Adjust for Weekend (Start Date)
            while (isWeekend(earliestStart)) {
                earliestStart = addDays(earliestStart, 1);
            }

            // D. Calculate Duration & End
            const finalEnd = calculateEndDate(earliestStart, task.estimatedHours || 8, task.owner);

            // Store result
            updates.push({
                id: taskId,
                startDate: format(earliestStart, 'yyyy-MM-dd'),
                endDate: format(finalEnd, 'yyyy-MM-dd')
            });

            // Update indices
            tempDates.set(taskId, finalEnd);
            userAvailability.set(task.owner, finalEnd);
        }

        if (updates.length > 0) {
            setAutoScheduleProposal({
                updates,
                count: updates.length
            });
        } else {
            setInfoModal({
                isOpen: true,
                title: "Auto-Schedule Result",
                message: "Could not find any valid slots to schedule tasks. Constraints (dependencies/weekend) might be too strict.",
                variant: 'warning'
            });
        }
    };

    const confirmAutoSchedule = async () => {
        if (!autoScheduleProposal) return;

        for (const update of autoScheduleProposal.updates) {
            await updateNode(update.id, {
                startDate: update.startDate,
                endDate: update.endDate
            });
        }
        setAutoScheduleProposal(null);
    };

    // --- Render ---

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden relative">
            <SchedulerHeader
                currentDate={viewDate}
                onPrev={() => setViewDate(d => addDays(d, -7))}
                onNext={() => setViewDate(d => addDays(d, 7))}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                teams={teams}
                selectedTeamId={selectedTeamId}
                onTeamChange={setSelectedTeamId}
                onAutoSchedule={() => handleAutoSchedule()}
                isReadOnly={isReadOnly}
                viewMode={viewMode}
                onViewModeChange={setViewMode}
            />

            {activeTab === 'capacity' ? (
                <CapacityHeatmap
                    resources={resources}
                    days={days}
                    nodes={nodes}
                    cellWidth={cellWidth}
                    viewMode={viewMode}
                />
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    {/* --- Left: Resources & Timeline --- */}
                    <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
                        {/* Timeline Header */}
                        <div className="flex border-b border-border bg-muted/20">
                            <div className="start-0 w-48 shrink-0 p-4 font-semibold text-sm border-r border-border flex items-center bg-background z-50 sticky left-0">
                                Resources
                            </div>
                            <div className="flex overflow-x-hidden">
                                {days.map(day => (
                                    <div
                                        key={day.toISOString()}
                                        className={`shrink-0 text-center py-2 text-xs font-medium ${isSameDay(day, new Date()) ? 'bg-primary/10 text-primary' : ''
                                            } ${isWeekend(day) ? 'bg-muted/30' : ''} ${
                                            // Only show border if not compressed OR if it's month end
                                            cellWidth > 20 || isSameDay(day, endOfMonth(day)) ? 'border-r border-border/50' : ''
                                            }`}
                                        style={{ width: cellWidth }}
                                    >
                                        {/* Simplified Header for Main Timeline */}
                                        {cellWidth > 50 && (
                                            <>
                                                <div className="opacity-50">{format(day, 'EEE')}</div>
                                                <div className="text-sm">{format(day, 'd')}</div>
                                            </>
                                        )}
                                        {cellWidth <= 50 && cellWidth > 20 && (
                                            <div className="text-xs mt-1">{format(day, 'd')}</div>
                                        )}
                                        {cellWidth <= 20 && day.getDate() === 1 && (
                                            <div className="text-xs font-bold whitespace-nowrap overflow-visible pl-1 text-left">
                                                {format(day, 'MMM')}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resources Rows */}
                        <div className="flex-1 overflow-auto relative">
                            {/* Dependency SVG Overlay */}
                            <svg
                                className="absolute top-0 left-0 pointer-events-none z-10"
                                style={{
                                    width: Math.max(1000, (days.length * cellWidth) + 200),
                                    height: layoutData.totalContentHeight
                                }}
                            >
                                <defs>
                                    <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                                        <polygon points="0 0, 10 3.5, 0 7" fill="#cbd5e1" />
                                    </marker>
                                </defs>
                                {scheduledTasks.map(task =>
                                    (task.dependencies || []).map(depId => {
                                        const startNode = layoutData.taskCoordinates.get(depId);
                                        const endNode = layoutData.taskCoordinates.get(task.id);

                                        if (!startNode || !endNode) return null;

                                        // Start Point: Right edge of blocker
                                        // Header is 200px wide.
                                        const xOffset = 200;

                                        const x1 = startNode.x + startNode.width + xOffset;
                                        const y1 = startNode.y + (startNode.height / 2);

                                        const x2 = endNode.x + xOffset;
                                        const y2 = endNode.y + (endNode.height / 2);

                                        // Bezier
                                        const cp1x = x1 + 40;
                                        const cp2x = x2 - 40;

                                        return (
                                            <path
                                                key={`${depId}-${task.id}`}
                                                d={`M ${x1} ${y1} C ${cp1x} ${y1}, ${cp2x} ${y2}, ${x2} ${y2}`}
                                                stroke="#cbd5e1"
                                                strokeWidth="2"
                                                fill="none"
                                                markerEnd="url(#arrowhead)"
                                            />
                                        );
                                    })
                                )}
                            </svg>

                            {layoutData.rows.map(({ resource, rowHeight, tasks: resourceTasks, layout }) => {
                                return (
                                    <div key={resource.id} className="flex border-b border-border/50" style={{ height: rowHeight }}>
                                        {/* Resource Header */}
                                        <div className="w-48 shrink-0 p-3 border-r border-border bg-background flex items-center gap-3 sticky left-0 z-50">
                                            <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold ring-2 ring-background">
                                                {resource.id === 'unassigned' ? '?' : (resource.name?.[0] || 'U')}
                                            </div>
                                            <div className="truncate">
                                                <div className="text-sm font-medium truncate">{resource.id === 'unassigned' ? 'Unassigned' : resource.name}</div>
                                                <div className="text-xs text-muted-foreground">{resource.id === 'unassigned' ? '-' : resource.role}</div>
                                            </div>
                                        </div>

                                        {/* Timeline Cells */}
                                        <div className="flex relative">
                                            {days.map(day => (
                                                <div
                                                    key={day.toISOString()}
                                                    className={`shrink-0 h-full relative ${
                                                        // Only show border if not compressed OR if it's month end
                                                        cellWidth > 20 || isSameDay(day, endOfMonth(day)) ? 'border-r border-border/50' : ''
                                                        }`}
                                                    style={{ width: cellWidth }}
                                                    // Disable drop in read-only
                                                    onDrop={!isReadOnly ? (e) => handleDropOnCell(e, resource.id, day) : undefined}
                                                    onDragOver={!isReadOnly ? handleDragOver : undefined}
                                                />
                                            ))}

                                            {/* Placed Tasks Overlay */}
                                            {resourceTasks
                                                .map(task => {
                                                    const start = parseISO(task.startDate!);
                                                    const end = parseISO(task.endDate!);

                                                    if (end < days[0] || start > days[days.length - 1]) return null;
                                                    const offsetDays = differenceInDays(start, days[0]);
                                                    const durationDays = differenceInDays(end, start) + 1;
                                                    const left = offsetDays * cellWidth;
                                                    const width = durationDays * cellWidth;

                                                    // Calculate Load
                                                    let workingDuration = 0;
                                                    let current = start;
                                                    while (current <= end) {
                                                        if (!isWeekend(current)) workingDuration++;
                                                        current = addDays(current, 1);
                                                    }
                                                    if (workingDuration < 1) workingDuration = 1;
                                                    const dailyLoad = task.estimatedHours ? (task.estimatedHours / workingDuration).toFixed(1) : '-';

                                                    // Layout
                                                    const lane = layout.get(task.id) || 0;
                                                    const top = 8 + (lane * (TASK_HEIGHT + TASK_GAP)); // 8px top padding

                                                    return (
                                                        <div
                                                            key={task.id}
                                                            draggable={!resizingTask}
                                                            onDragStart={(e) => handleDragStart(e, task.id)}
                                                            className={`absolute rounded-md bg-primary/90 text-primary-foreground p-2 text-xs shadow-sm group hover:ring-2 hover:ring-offset-1 hover:ring-primary transition-all overflow-hidden ${!isReadOnly ? 'cursor-move' : ''} ${resizingTask?.id === task.id || draggingTaskId === task.id ? 'opacity-70' : ''}`}
                                                            style={{
                                                                left: Math.max(0, left),
                                                                width: Math.max(cellWidth / 2, width),
                                                                marginLeft: 4, marginRight: 4,
                                                                zIndex: 20 + lane,
                                                                top: top,
                                                                height: TASK_HEIGHT // Fixed height
                                                            }}
                                                        >
                                                            <div className="font-semibold truncate">{task.title}</div>
                                                            <div className="opacity-80 flex justify-between mt-1">
                                                                <span>{dailyLoad}h/d</span>
                                                                {task.estimatedHours && <span>{task.estimatedHours}h total</span>}
                                                            </div>

                                                            {/* Resize Handle (Right) */}
                                                            {!isReadOnly && (
                                                                <div
                                                                    className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                                    onMouseDown={(e) => handleResizeStart(e, task.id, task.endDate!)}
                                                                >
                                                                    <div className="h-4 w-1 bg-white/50 rounded-full" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })
                                            }
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* --- Right: Unscheduled Sidebar --- */}
                    <div
                        className={`w-[300px] border-l border-border flex flex-col transition-colors ${isOverUnscheduled ? 'bg-primary/10 border-primary/50' : 'bg-muted/10'}`}
                        onDragOver={(e) => {
                            e.preventDefault();
                            if (!isOverUnscheduled) setIsOverUnscheduled(true);
                        }}
                        onDragLeave={(e) => {
                            // Prevent flickering by checking if we are really leaving the container
                            if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                setIsOverUnscheduled(false);
                            }
                        }}
                        onDrop={handleDropOnUnscheduled}
                    >
                        <div className="p-4 border-b border-border bg-background font-semibold text-sm flex justify-between items-center">
                            <span>Unscheduled</span>
                            <span className="bg-secondary px-2 py-0.5 rounded-full text-xs">{unscheduledTasks.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {unscheduledTasks.map(task => {
                                const canDrag = !isReadOnly && (task.estimatedHours || 0) > 0;
                                return (
                                    <div
                                        key={task.id}
                                        draggable={task.estimatedHours! > 0}
                                        onDragStart={(e) => {
                                            if (isReadOnly) {
                                                e.preventDefault();
                                                setInfoModal({
                                                    isOpen: true,
                                                    title: "View Only Mode",
                                                    message: "You are in 'All Teams' view. Please select a specific team to edit the schedule.",
                                                    variant: 'info'
                                                });
                                                return;
                                            }
                                            if (!canDrag) {
                                                e.preventDefault();
                                                return;
                                            }
                                            handleDragStart(e, task.id);
                                        }}
                                        title={!canDrag ? "Set estimated hours to schedule this task" : ""}
                                        className={`bg-background p-3 rounded-lg border border-border shadow-sm transition-colors ${canDrag ? 'cursor-move hover:border-primary' : 'cursor-not-allowed opacity-50'}`}
                                    >
                                        <div className="font-medium text-sm text-foreground">{task.title}</div>
                                        <div className="flex justify-between items-center mt-2">
                                            <div className="flex items-center gap-2">
                                                <div className={`text-xs flex items-center gap-1 ${!canDrag ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                                    <CalendarIcon className="h-3 w-3" />
                                                    {task.estimatedHours || 0}h
                                                </div>
                                                {task.ownerName && (
                                                    <div className="text-xs bg-secondary px-1.5 py-0.5 rounded text-muted-foreground truncate max-w-[100px]" title={task.ownerName}>
                                                        {task.ownerName}
                                                    </div>
                                                )}
                                            </div>
                                            {canDrag && <GripVertical className="h-4 w-4 text-muted-foreground" />}
                                        </div>
                                    </div>
                                );
                            })}
                            {unscheduledTasks.length === 0 && (
                                <div className="text-center text-muted-foreground text-xs py-10">
                                    No unscheduled tasks.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Global Drag Overlay? Not needed with HTML5 DnD unless using library */}

            {pendingReassignment && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setPendingReassignment(null)}
                    onConfirm={confirmReassignment}
                    title="Confirm Reassignment"
                    description={`This task is currently assigned to ${pendingReassignment.currentOwnerName}. Are you sure you want to reassign it to ${pendingReassignment.newOwnerName}?`}
                    confirmLabel="Reassign"
                    variant="warning"
                />
            )}
            {dependencyError && (
                <ConfirmationModal
                    isOpen={dependencyError.isOpen}
                    onClose={() => setDependencyError(null)}
                    onConfirm={() => setDependencyError(null)}
                    title={dependencyError.title}
                    description={dependencyError.message}
                    confirmLabel="Got it"
                    cancelLabel=""
                    variant="danger"
                />
            )}
            {infoModal && (
                <ConfirmationModal
                    isOpen={infoModal.isOpen}
                    onClose={() => setInfoModal(null)}
                    onConfirm={() => setInfoModal(null)}
                    title={infoModal.title}
                    description={infoModal.message}
                    confirmLabel="OK"
                    cancelLabel=""
                    variant={infoModal.variant === 'warning' ? 'warning' : 'info'}
                />
            )}
            {autoScheduleProposal && (
                <ConfirmationModal
                    isOpen={true}
                    onClose={() => setAutoScheduleProposal(null)}
                    onConfirm={confirmAutoSchedule}
                    title="Confirm Auto-Schedule"
                    description={`The auto-scheduler found ${autoScheduleProposal.count} tasks that can be scheduled based on availability and dependencies. Proceed with these changes?`}
                    confirmLabel={`Schedule ${autoScheduleProposal.count} Tasks`}
                    variant="info"
                />
            )}
        </div>
    );
}

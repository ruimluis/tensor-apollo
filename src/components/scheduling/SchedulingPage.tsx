
import React, { useState, useMemo } from 'react';
import { useOKRStore } from '@/store/useOKRStore';
import { OKRNode } from '@/types';
import { Calendar as CalendarIcon, GripVertical, ChevronRight, ChevronLeft } from 'lucide-react';
import { format, addDays, startOfWeek, endOfWeek, eachDayOfInterval, isSameDay, differenceInDays, parseISO, isWeekend } from 'date-fns';

// --- Constants ---
const CELL_WIDTH = 100; // px per day

// --- Helper Components ---

// --- Capacity Component ---

const CapacityHeatmap = ({
    resources,
    days,
    nodes
}: {
    resources: { id: string, name: string }[],
    days: Date[],
    nodes: OKRNode[]
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

    // 2. Render Helper
    const getCellColor = (hours: number) => {
        if (hours === 0) return ''; // Empty/subtle
        if (hours < 6) return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'; // Safe
        if (hours <= 8) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'; // Optimal
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'; // Overloaded
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
                            {days.map(day => (
                                <div
                                    key={day.toISOString()}
                                    className={`shrink-0 border-r border-border/50 text-center py-2 text-xs font-medium ${isSameDay(day, new Date()) ? 'bg-primary/10 text-primary' : ''} ${isWeekend(day) ? 'bg-muted/30' : ''}`}
                                    style={{ width: CELL_WIDTH }}
                                >
                                    <div className="opacity-50">{format(day, 'EEE')}</div>
                                    <div className="text-sm">{format(day, 'd')}</div>
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
                                    {days.map(day => {
                                        const dateStr = format(day, 'yyyy-MM-dd');
                                        const hours = loadMap.get(resource.id)?.get(dateStr) || 0;
                                        const isWknd = isWeekend(day);

                                        return (
                                            <div
                                                key={day.toISOString()}
                                                className={`shrink-0 border-r border-border/50 h-full flex items-center justify-center text-xs font-medium relative ${isWknd ? 'bg-muted/30' : ''}`}
                                                style={{ width: CELL_WIDTH }}
                                            >
                                                {!isWknd && hours > 0 && (
                                                    <div className={`mx-2 py-1 px-3 rounded-md w-full text-center ${getCellColor(hours)}`}>
                                                        {hours.toFixed(1)}h
                                                    </div>
                                                )}
                                                {!isWknd && hours === 0 && <span className="text-muted-foreground/30">-</span>}
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
                    <div className="w-3 h-3 rounded bg-emerald-100 border border-emerald-200"></div> Safe (0-6h)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-yellow-100 border border-yellow-200"></div> Optimal (6-8h)
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-red-100 border border-red-200"></div> Overloaded {`>`} 8h
                </div>
            </div>
        </div>
    );
}

// --- Helper Components ---

const SchedulerHeader = ({
    currentDate,
    onPrev,
    onNext,
    activeTab,
    onTabChange
}: {
    currentDate: Date,
    onPrev: () => void,
    onNext: () => void,
    activeTab: 'schedule' | 'capacity',
    onTabChange: (t: 'schedule' | 'capacity') => void
}) => {
    return (
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    Project Schedule
                </h2>
                <div className="flex bg-muted rounded-lg p-1 text-sm font-medium">
                    <button
                        onClick={() => onTabChange('schedule')}
                        className={`px-3 py-1 rounded-md transition-all ${activeTab === 'schedule' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Schedule
                    </button>
                    <button
                        onClick={() => onTabChange('capacity')}
                        className={`px-3 py-1 rounded-md transition-all ${activeTab === 'capacity' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Capacity
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onPrev} className="p-1 hover:bg-muted rounded"><ChevronLeft className="h-5 w-5" /></button>
                <span className="font-medium min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
                <button onClick={onNext} className="p-1 hover:bg-muted rounded"><ChevronRight className="h-5 w-5" /></button>
            </div>
        </div>
    );
};

// --- Main Page Component ---

export function SchedulingPage() {
    const { nodes, updateNode } = useOKRStore();
    const [viewDate, setViewDate] = useState(new Date());
    const [activeTab, setActiveTab] = useState<'schedule' | 'capacity'>('schedule');

    // ... (keep existing data prep: resources, startDate, endDate, days, tasks)


    // 1. Resources (Users who own tasks or are in the system)
    const resources = useMemo(() => {
        const owners = new Map<string, string>(); // id -> name
        nodes.forEach(n => {
            if (n.owner && n.ownerName) owners.set(n.owner, n.ownerName);
        });

        const list = Array.from(owners.entries()).map(([id, name]) => ({ id, name }));
        // list.push({ id: 'unassigned', name: 'Unassigned' }); 
        return list;
    }, [nodes]);

    // 2. Timeline Interval
    const startDate = startOfWeek(viewDate);
    const endDate = endOfWeek(addDays(viewDate, 14)); // Show 3 weeks
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    // 3. Tasks
    const unscheduledTasks = useMemo(() =>
        nodes.filter(n => n.type === 'TASK' && (!n.startDate || !n.endDate)),
        [nodes]);

    const scheduledTasks = useMemo(() =>
        nodes.filter(n => n.type === 'TASK' && n.startDate && n.endDate),
        [nodes]);

    // --- Drag & Drop State ---
    const [draggingTaskId, setDraggingTaskId] = useState<string | null>(null);

    // --- Resize State ---
    const [resizingTask, setResizingTask] = useState<{ id: string, originalEnd: Date, startX: number } | null>(null);

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

        const handleMouseMove = (e: MouseEvent) => {
            // Visual feedback handled by render logic reading resizingTask if needed, or we just wait for drop
            // For smoother UI, we could have a "currentDragEnd" state, but for now let's rely on drop update.
        };

        const handleMouseUp = (e: MouseEvent) => {
            if (!resizingTask) return;

            const diffX = e.clientX - resizingTask.startX;
            const dayDiff = Math.round(diffX / CELL_WIDTH);

            if (dayDiff !== 0) {
                const newEnd = addDays(resizingTask.originalEnd, dayDiff);
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
    }, [resizingTask, nodes, updateNode]);


    // --- Handlers ---

    const handleDragStart = (e: React.DragEvent, taskId: string) => {
        setDraggingTaskId(taskId);
        e.dataTransfer.setData('taskId', taskId);
        e.dataTransfer.effectAllowed = 'move';
    };

    // --- Helpers ---

    const addWorkingDays = (startDate: Date, workingDays: number): Date => {
        let current = startDate;
        // If start date is a weekend, move to next Monday first?
        // Or just treat it as non-working.
        // If we start on Sat, and have 1 day, it should be Mon.
        while (isWeekend(current)) {
            current = addDays(current, 1);
        }

        // Now we rely on working days.
        // If workingDays = 1, we want end date = current.
        // If workingDays = 2, we want end date = current + 1 working day.

        let daysToAdd = workingDays - 1;
        while (daysToAdd > 0) {
            current = addDays(current, 1);
            if (!isWeekend(current)) {
                daysToAdd--;
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
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        const task = nodes.find(n => n.id === taskId);
        if (!task) return;

        // Auto-Schedule Duration based on 8h/day limit
        let duration = 1;
        if (task.estimatedHours && task.estimatedHours > 0) {
            duration = Math.ceil(task.estimatedHours / 8);
        } else if (task.startDate && task.endDate) {
            // Fallback to existing duration if no hours set
            // For checking existing duration in working days, it's complex.
            // Let's stick to calendar days for fallback or default to 1.
            duration = Math.max(1, differenceInDays(parseISO(task.endDate), parseISO(task.startDate)) + 1);
        }

        if (duration < 1) duration = 1;

        // Calculate Start and End respecting weekends
        let start = day;
        while (isWeekend(start)) {
            start = addDays(start, 1);
        }

        const end = addWorkingDays(start, duration);

        const newStart = format(start, 'yyyy-MM-dd');
        const newEnd = format(end, 'yyyy-MM-dd');

        await updateNode(taskId, {
            startDate: newStart,
            endDate: newEnd,
            owner: resourceId === 'unassigned' ? '' : resourceId
        });

        setDraggingTaskId(null);
    };

    const handleDropOnUnscheduled = async (e: React.DragEvent) => {
        e.preventDefault();
        const taskId = e.dataTransfer.getData('taskId');
        if (!taskId) return;

        const task = nodes.find(n => n.id === taskId);
        // Only update if it currently has dates (is scheduled)
        if (task && (task.startDate || task.endDate)) {
            await updateNode(taskId, {
                startDate: '',
                endDate: '',
            });
        }
        setDraggingTaskId(null);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
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
            />

            {activeTab === 'capacity' ? (
                <CapacityHeatmap
                    resources={resources}
                    days={days}
                    nodes={nodes}
                />
            ) : (
                <div className="flex flex-1 overflow-hidden">
                    {/* --- Left: Resources & Timeline --- */}
                    <div className="flex-1 flex flex-col overflow-hidden border-r border-border">
                        {/* Timeline Header */}
                        <div className="flex border-b border-border bg-muted/20">
                            <div className="w-48 shrink-0 p-4 font-semibold text-sm border-r border-border flex items-center bg-background z-20 sticky left-0">
                                Resources
                            </div>
                            <div className="flex overflow-x-hidden">
                                {days.map(day => (
                                    <div
                                        key={day.toISOString()}
                                        className={`shrink-0 border-r border-border/50 text-center py-2 text-xs font-medium ${isSameDay(day, new Date()) ? 'bg-primary/10 text-primary' : ''}`}
                                        style={{ width: CELL_WIDTH }}
                                    >
                                        <div className="opacity-50">{format(day, 'EEE')}</div>
                                        <div className="text-sm">{format(day, 'd')}</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Resources Rows */}
                        <div className="flex-1 overflow-auto">
                            {resources.map(resource => (
                                <div key={resource.id} className="flex border-b border-border/50 h-[80px]">
                                    {/* Resource Header */}
                                    <div className="w-48 shrink-0 p-3 border-r border-border bg-background flex items-center gap-3 sticky left-0 z-20">
                                        <div className="h-8 w-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold ring-2 ring-background">
                                            {resource.id === 'unassigned' ? '?' : (resource.name?.[0] || 'U')}
                                        </div>
                                        <div className="truncate">
                                            <div className="text-sm font-medium truncate">{resource.id === 'unassigned' ? 'Unassigned' : resource.name}</div>
                                            <div className="text-xs text-muted-foreground">{resource.id === 'unassigned' ? '-' : 'Product Team'}</div>
                                        </div>
                                    </div>

                                    {/* Timeline Cells */}
                                    <div className="flex relative">
                                        {days.map(day => (
                                            <div
                                                key={day.toISOString()}
                                                className="shrink-0 border-r border-border/50 h-full relative"
                                                style={{ width: CELL_WIDTH }}
                                                onDragOver={handleDragOver}
                                                onDrop={(e) => handleDropOnCell(e, resource.id, day)}
                                            />
                                        ))}

                                        {/* Placed Tasks Overlay */}
                                        {scheduledTasks
                                            .filter(task => (task.owner || 'unassigned') === resource.id)
                                            .map(task => {
                                                const start = parseISO(task.startDate!);
                                                const end = parseISO(task.endDate!);

                                                // Only render if visible in current range
                                                if (end < days[0] || start > days[days.length - 1]) return null;

                                                const offsetDays = differenceInDays(start, days[0]);
                                                const durationDays = differenceInDays(end, start) + 1;

                                                const left = offsetDays * CELL_WIDTH;
                                                const width = durationDays * CELL_WIDTH;

                                                // Calculate Load
                                                let workingDuration = 0;
                                                let current = start;
                                                while (current <= end) {
                                                    if (!isWeekend(current)) workingDuration++;
                                                    current = addDays(current, 1);
                                                }
                                                if (workingDuration < 1) workingDuration = 1;

                                                const dailyLoad = task.estimatedHours ? (task.estimatedHours / workingDuration).toFixed(1) : '-';

                                                return (
                                                    <div
                                                        key={task.id}
                                                        draggable={!resizingTask}
                                                        onDragStart={(e) => handleDragStart(e, task.id)}
                                                        className={`absolute top-2 bottom-2 rounded-md bg-primary/90 text-primary-foreground p-2 text-xs cursor-move shadow-sm group hover:ring-2 hover:ring-offset-1 hover:ring-primary transition-all overflow-hidden ${resizingTask?.id === task.id ? 'opacity-70' : ''}`}
                                                        style={{
                                                            left: Math.max(0, left),
                                                            width: Math.max(CELL_WIDTH / 2, width),
                                                            marginLeft: 4, marginRight: 4,
                                                            zIndex: 10
                                                        }}
                                                    >
                                                        <div className="font-semibold truncate">{task.title}</div>
                                                        <div className="opacity-80 flex justify-between mt-1">
                                                            <span>{dailyLoad}h/d</span>
                                                            {task.estimatedHours && <span>{task.estimatedHours}h total</span>}
                                                        </div>

                                                        {/* Resize Handle (Right) */}
                                                        <div
                                                            className="absolute right-0 top-0 bottom-0 w-3 cursor-ew-resize hover:bg-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                            onMouseDown={(e) => handleResizeStart(e, task.id, task.endDate!)}
                                                        >
                                                            <div className="h-4 w-1 bg-white/50 rounded-full" />
                                                        </div>
                                                    </div>
                                                );
                                            })
                                        }
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* --- Right: Unscheduled Sidebar --- */}
                    <div
                        className="w-[300px] border-l border-border bg-muted/10 flex flex-col transition-colors"
                        onDragOver={handleDragOver} // Allow drop
                        onDrop={handleDropOnUnscheduled}
                    >
                        <div className="p-4 border-b border-border bg-background font-semibold text-sm flex justify-between items-center">
                            <span>Unscheduled</span>
                            <span className="bg-secondary px-2 py-0.5 rounded-full text-xs">{unscheduledTasks.length}</span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3">
                            {unscheduledTasks.map(task => {
                                const canDrag = (task.estimatedHours || 0) > 0;
                                return (
                                    <div
                                        key={task.id}
                                        draggable={canDrag}
                                        onDragStart={(e) => {
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
                                            <div className={`text-xs flex items-center gap-1 ${!canDrag ? 'text-red-400 font-medium' : 'text-muted-foreground'}`}>
                                                <CalendarIcon className="h-3 w-3" />
                                                {task.estimatedHours || 0}h
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
        </div>
    );
}

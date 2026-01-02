import { useState, useMemo } from 'react';
import { useOKRStore } from '@/store/useOKRStore';
import { OKRNodeItem } from '@/components/okr/OKRNodeItem';
import { FilterBar } from '@/components/okr/FilterBar';
import { TaskCard } from './TaskCard';
import { cn } from '@/lib/utils';
import { LayoutGrid, List, CheckSquare } from 'lucide-react';

export function TasksPage() {
    const { nodes } = useOKRStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [filters, setFilters] = useState({
        search: '',
        teamId: '',
        ownerId: '',
        goalId: '',
        objectiveId: '',
        keyResultId: '',
        noDate: false,
        noHours: false,
        showOverdue: false
    });

    const taskNodes = useMemo(() => nodes.filter(n => n.type === 'TASK'), [nodes]);

    const filteredTasks = useMemo(() => {
        let rootId = filters.keyResultId || filters.objectiveId || filters.goalId;

        return taskNodes.filter(node => {
            const matchesSearch = !filters.search ||
                node.title.toLowerCase().includes(filters.search.toLowerCase());
            const matchesTeam = !filters.teamId || node.teamId === filters.teamId;
            const matchesOwner = !filters.ownerId ||
                (filters.ownerId === 'UNASSIGNED' ? !node.owner : node.owner === filters.ownerId);

            // Quick Filters
            const matchesNoDate = !filters.noDate || !node.endDate;
            const matchesNoHours = !filters.noHours || !node.estimatedHours || node.estimatedHours === 0;
            const matchesOverdue = !filters.showOverdue ||
                (node.endDate && new Date(node.endDate) < new Date() && node.progress < 100);

            // Hierarchy Check
            let matchesHierarchy = true;
            if (rootId) {
                let current = node;
                let found = false;
                let depth = 0;
                while (current.parentId && depth < 20) {
                    if (current.parentId === rootId) { found = true; break; }
                    const parent = nodes.find(n => n.id === current.parentId);
                    if (!parent) break;
                    current = parent; // Climb up
                    depth++;
                }
                matchesHierarchy = found;
            }

            return matchesSearch && matchesTeam && matchesOwner && matchesNoDate && matchesNoHours && matchesHierarchy && matchesOverdue;
        });
    }, [taskNodes, nodes, filters]);

    // Calculate Stats
    const stats = useMemo(() => {
        // Base context: tasks matching Search, Team, Hierarchy
        const baseTasks = taskNodes.filter(node => {
            const matchesSearch = !filters.search ||
                node.title.toLowerCase().includes(filters.search.toLowerCase());
            const matchesTeam = !filters.teamId || node.teamId === filters.teamId;

            // Hierarchy Check
            let rootId = filters.keyResultId || filters.objectiveId || filters.goalId;
            let matchesHierarchy = true;
            if (rootId) {
                let current = node;
                let found = false;
                let depth = 0;
                while (current.parentId && depth < 20) {
                    if (current.parentId === rootId) { found = true; break; }
                    const parent = nodes.find(n => n.id === current.parentId);
                    if (!parent) break;
                    current = parent;
                    depth++;
                }
                matchesHierarchy = found;
            }
            return matchesSearch && matchesTeam && matchesHierarchy;
        });

        const noDate = baseTasks.filter(t => !t.endDate).length;
        const noOwner = baseTasks.filter(t => !t.owner).length;
        const noHours = baseTasks.filter(t => !t.estimatedHours || t.estimatedHours === 0).length;
        const overdue = baseTasks.filter(t => t.endDate && new Date(t.endDate) < new Date() && t.progress < 100).length;

        return { noDate, noOwner, noHours, overdue };
    }, [taskNodes, nodes, filters.search, filters.teamId, filters.goalId, filters.objectiveId, filters.keyResultId]);

    const toggleFilter = (type: 'noDate' | 'noOwner' | 'noHours' | 'overdue') => {
        setFilters(prev => {
            const newState = { ...prev };

            if (type === 'noDate') {
                newState.noDate = !prev.noDate;
                newState.noHours = false;
                newState.showOverdue = false;
                if (newState.ownerId === 'UNASSIGNED') newState.ownerId = '';
            } else if (type === 'noOwner') {
                newState.ownerId = prev.ownerId === 'UNASSIGNED' ? '' : 'UNASSIGNED';
                newState.noDate = false;
                newState.noHours = false;
                newState.showOverdue = false;
            } else if (type === 'noHours') {
                newState.noHours = !prev.noHours;
                newState.noDate = false;
                newState.showOverdue = false;
                if (newState.ownerId === 'UNASSIGNED') newState.ownerId = '';
            } else if (type === 'overdue') {
                newState.showOverdue = !prev.showOverdue;
                newState.noDate = false;
                newState.noHours = false;
                if (newState.ownerId === 'UNASSIGNED') newState.ownerId = '';
            }
            return newState;
        });
    };

    // Parent Lookup Map
    const parentMap = useMemo(() => new Map(nodes.map(n => [n.id, n])), [nodes]);

    return (
        <div className="flex flex-col h-full bg-background/50">
            {/* Header Section */}
            <div className="mb-6 flex flex-col gap-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                            <CheckSquare className="h-8 w-8 text-primary" />
                            Tasks
                        </h1>
                        <p className="text-muted-foreground mt-1">Manage and track individual work items.</p>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* View Toggle */}
                        <div className="bg-muted p-1 rounded-lg flex text-sm border border-border">
                            <button
                                onClick={() => setViewMode('grid')}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    viewMode === 'grid' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                                title="Grid View"
                            >
                                <LayoutGrid className="h-4 w-4" />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={cn(
                                    "p-2 rounded-md transition-all",
                                    viewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"
                                )}
                                title="List View"
                            >
                                <List className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <FilterBar
                    filters={filters as any}
                    onFilterChange={setFilters as any}
                    nodes={nodes}
                    className="w-full"
                    showCascadingFilters={true}
                />

                {/* Stats Bar */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => toggleFilter('noDate')}
                        className={cn(
                            "bg-card border rounded-lg p-3 shadow-sm text-left transition-all hover:bg-accent",
                            filters.noDate ? "border-primary ring-1 ring-primary" : "border-border"
                        )}
                    >
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">No Date</div>
                        <div className="text-2xl font-bold text-orange-600">{stats.noDate}</div>
                    </button>

                    <button
                        onClick={() => toggleFilter('noOwner')}
                        className={cn(
                            "bg-card border rounded-lg p-3 shadow-sm text-left transition-all hover:bg-accent",
                            filters.ownerId === 'UNASSIGNED' ? "border-primary ring-1 ring-primary" : "border-border"
                        )}
                    >
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">No Owner</div>
                        <div className="text-2xl font-bold text-purple-600">{stats.noOwner}</div>
                    </button>

                    <button
                        onClick={() => toggleFilter('overdue')}
                        className={cn(
                            "bg-card border rounded-lg p-3 shadow-sm text-left transition-all hover:bg-accent",
                            filters.showOverdue ? "border-primary ring-1 ring-primary" : "border-border"
                        )}
                    >
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Overdue</div>
                        <div className={cn("text-2xl font-bold", stats.overdue > 0 ? "text-red-600" : "text-muted-foreground")}>{stats.overdue}</div>
                    </button>

                    <button
                        onClick={() => toggleFilter('noHours')}
                        className={cn(
                            "bg-card border rounded-lg p-3 shadow-sm text-left transition-all hover:bg-accent",
                            filters.noHours ? "border-primary ring-1 ring-primary" : "border-border"
                        )}
                    >
                        <div className="text-xs text-muted-foreground uppercase font-bold tracking-wider">No Hours</div>
                        <div className="text-2xl font-bold text-blue-600">{stats.noHours}</div>
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto pb-8">
                {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-muted-foreground border-2 border-dashed border-border rounded-lg bg-muted/20">
                        <CheckSquare className="h-12 w-12 mb-4 opacity-20" />
                        <p className="font-medium">No tasks found</p>
                        <p className="text-sm">
                            {filters.noDate || filters.noHours || filters.ownerId === 'UNASSIGNED' || filters.showOverdue
                                ? "Great job! Triage complete."
                                : "Try adjusting your filters or create a new task."}
                        </p>
                    </div>
                ) : (
                    <>
                        {viewMode === 'grid' ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                {filteredTasks.map(node => (
                                    <TaskCard
                                        key={node.id}
                                        node={node}
                                        searchTerm={filters.search}
                                        parentTitle={parentMap.get(node.parentId || '')?.title}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {/* Header for List View */}
                                <div className="grid grid-cols-[auto_1fr] gap-4 px-4 text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">
                                    <div className="w-6"></div> {/* Spacer for expand icon */}
                                    <div>Task Details</div>
                                </div>
                                {filteredTasks.map(node => (
                                    <OKRNodeItem key={node.id} node={node} level={0} nodes={filteredTasks} searchTerm={filters.search} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

import { useState, useMemo } from 'react';
import { Filter, X, Search, User, Target, Crosshair, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';
import { OKRNode } from '@/types';

export interface FilterState {
    search: string;
    teamId: string;
    ownerId: string;
    goalId: string;
    objectiveId: string;
    keyResultId: string;
}

interface FilterBarProps {
    filters: FilterState;
    onFilterChange: (filters: FilterState) => void;
    nodes: OKRNode[]; // Pass all nodes to derive options
    showCascadingFilters?: boolean;
    className?: string;
}

export function FilterBar({ filters, onFilterChange, nodes, className, showCascadingFilters = false }: FilterBarProps) {
    const [isOpen, setIsOpen] = useState(false);

    const activeFilterCount =
        (filters.search ? 1 : 0) +
        (filters.teamId ? 1 : 0) +
        (filters.ownerId ? 1 : 0) +
        (filters.goalId ? 1 : 0) +
        (filters.objectiveId ? 1 : 0) +
        (filters.keyResultId ? 1 : 0);

    const hasActiveFilters = activeFilterCount > 0;

    // --- Derived Options Logic ---

    // 1. Teams & Owners (Always derived from all nodes? Or filtered? Let's use all to make them discoverable)
    const { owners } = useMemo(() => {
        if (!nodes) return { teams: [], owners: [] }; // Safety check

        const uniqueTeams = new Map<string, string>();
        const uniqueOwners = new Map<string, string>();

        nodes.forEach(node => {
            if (node.teamId && node.teamName) uniqueTeams.set(node.teamId, node.teamName);
            if (node.owner && node.ownerName) uniqueOwners.set(node.owner, node.ownerName);
        });

        return {
            owners: Array.from(uniqueOwners.entries()).map(([id, name]) => ({ id, name }))
        };
    }, [nodes]);

    // 2. Cascade Options based on selection
    const { availableGoals, availableObjectives, availableKeyResults } = useMemo(() => {
        if (!showCascadingFilters || !nodes) return { availableGoals: [], availableObjectives: [], availableKeyResults: [] };

        // Goals: Filter by Team if selected
        const goals = nodes.filter(n =>
            n.type === 'GOAL' &&
            (!filters.teamId || n.teamId === filters.teamId)
        );

        // Objectives: Filter by Goal if selected
        const objectives = nodes.filter(n =>
            n.type === 'OBJECTIVE' &&
            (!filters.goalId || n.parentId === filters.goalId)
        );

        // Key Results: Filter by Objective if selected
        const keyResults = nodes.filter(n =>
            n.type === 'KEY_RESULT' &&
            (!filters.objectiveId || n.parentId === filters.objectiveId)
        );

        return {
            availableGoals: goals,
            availableObjectives: objectives,
            availableKeyResults: keyResults
        };
    }, [nodes, filters.teamId, filters.goalId, filters.objectiveId, showCascadingFilters]);


    // --- Handlers ---

    const handleChange = (key: keyof FilterState, value: string) => {
        const newFilters = { ...filters, [key]: value };

        // Cascade Clear: If parent changes, clear children
        if (key === 'teamId') {
            newFilters.goalId = '';
            newFilters.objectiveId = '';
            newFilters.keyResultId = '';
        } else if (key === 'goalId') {
            newFilters.objectiveId = '';
            newFilters.keyResultId = '';
        } else if (key === 'objectiveId') {
            newFilters.keyResultId = '';
        }

        onFilterChange(newFilters);
    };

    const clearFilters = () => {
        onFilterChange({
            search: '',
            teamId: '',
            ownerId: '',
            goalId: '',
            objectiveId: '',
            keyResultId: ''
        });
    };

    return (
        <div className={cn("relative z-20", className)}>
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 rounded-md border text-sm font-medium transition-colors shadow-sm",
                        hasActiveFilters
                            ? "bg-primary/10 border-primary text-primary hover:bg-primary/20"
                            : "bg-card border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                >
                    <Filter className="h-4 w-4" />
                    <span>Filter</span>
                    {hasActiveFilters && (
                        <span className="flex items-center justify-center bg-primary text-primary-foreground text-[10px] h-5 w-5 rounded-full ml-1">
                            {activeFilterCount}
                        </span>
                    )}
                </button>

                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="p-2 text-muted-foreground hover:text-foreground transition-colors"
                        title="Clear filters"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>

            {isOpen && (
                <div className={cn(
                    "absolute top-full left-0 mt-2 bg-card border border-border rounded-lg shadow-xl p-4 animate-in fade-in slide-in-from-top-2",
                    showCascadingFilters ? "w-full md:w-[800px]" : "w-full md:w-[600px]"
                )}>
                    <div className={cn("grid gap-4", showCascadingFilters ? "grid-cols-1 md:grid-cols-2 lg:grid-cols-3" : "grid-cols-1 md:grid-cols-3")}>
                        {/* Search Input */}
                        <div className="space-y-1.5 md:col-span-2 lg:col-span-1">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <Search className="h-3 w-3" />
                                Search
                            </label>
                            <input
                                type="text"
                                placeholder="Search text..."
                                value={filters.search}
                                onChange={(e) => handleChange('search', e.target.value)}
                                className="w-full h-9 px-3 rounded-md border border-input bg-background/50 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                            />
                        </div>

                        {/* Owner Select */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <User className="h-3 w-3" />
                                Owner
                            </label>
                            <select
                                value={filters.ownerId}
                                onChange={(e) => handleChange('ownerId', e.target.value)}
                                className="w-full h-9 px-3 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
                            >
                                <option value="">All Owners</option>
                                {owners.map((owner) => (
                                    <option key={owner.id} value={owner.id}>
                                        {owner.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {showCascadingFilters && (
                            <>
                                <div className="hidden lg:block col-span-full border-t border-border/50 my-1"></div>

                                {/* Goal Select */}
                                <div className="space-y-1.5">
                                    <label className={cn("text-xs font-medium flex items-center gap-1.5", !filters.teamId && availableGoals.length === 0 ? "text-muted-foreground/50" : "text-muted-foreground")}>
                                        <Target className="h-3 w-3" />
                                        Goal
                                    </label>
                                    <select
                                        value={filters.goalId}
                                        onChange={(e) => handleChange('goalId', e.target.value)}
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                                    >
                                        <option value="">All Goals</option>
                                        {availableGoals.map((node) => (
                                            <option key={node.id} value={node.id}>
                                                {node.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Objective Select */}
                                <div className="space-y-1.5">
                                    <label className={cn("text-xs font-medium flex items-center gap-1.5", !filters.goalId ? "text-muted-foreground/50" : "text-muted-foreground")}>
                                        <Crosshair className="h-3 w-3" />
                                        Objective
                                    </label>
                                    <select
                                        value={filters.objectiveId}
                                        onChange={(e) => handleChange('objectiveId', e.target.value)}
                                        disabled={!filters.goalId}
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                                    >
                                        <option value="">All Objectives</option>
                                        {availableObjectives.map((node) => (
                                            <option key={node.id} value={node.id}>
                                                {node.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Result Select */}
                                <div className="space-y-1.5">
                                    <label className={cn("text-xs font-medium flex items-center gap-1.5", !filters.objectiveId ? "text-muted-foreground/50" : "text-muted-foreground")}>
                                        <ListChecks className="h-3 w-3" />
                                        Key Result
                                    </label>
                                    <select
                                        value={filters.keyResultId}
                                        onChange={(e) => handleChange('keyResultId', e.target.value)}
                                        disabled={!filters.objectiveId}
                                        className="w-full h-9 px-3 rounded-md border border-input bg-background/50 text-sm focus:outline-none focus:ring-1 focus:ring-ring disabled:opacity-50"
                                    >
                                        <option value="">All Key Results</option>
                                        {availableKeyResults.map((node) => (
                                            <option key={node.id} value={node.id}>
                                                {node.title}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

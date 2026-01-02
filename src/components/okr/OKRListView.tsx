import { useOKRStore } from '@/store/useOKRStore';
import { OKRNodeItem } from './OKRNodeItem';
import { useMemo, useState } from 'react';
import { FilterBar, FilterState } from './FilterBar';
import { OKRNode } from '@/types';
import { StrategyConsultantModal } from './StrategyConsultantModal';
import { Sparkles } from 'lucide-react';

export function OKRListView() {
    const { nodes: okrNodes, focusedNodeId, setFocusedNodeId } = useOKRStore();
    const [isConsultantOpen, setIsConsultantOpen] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        teamId: '',
        ownerId: '',
        goalId: '',
        objectiveId: '',
        keyResultId: ''
    });

    // Apply Filters (Match + Ancestors)
    const filteredNodes = useMemo(() => {
        const hasActiveFilters = filters.search || filters.teamId || filters.ownerId;
        if (!hasActiveFilters) return okrNodes;

        // Find initial matches
        const matches = okrNodes.filter(node => {
            const matchesSearch = !filters.search || (
                (node.title?.toLowerCase().includes(filters.search.toLowerCase())) ||
                (node.description?.toLowerCase().includes(filters.search.toLowerCase()))
            );
            const matchesTeam = !filters.teamId || node.teamId === filters.teamId;
            const matchesOwner = !filters.ownerId || node.owner === filters.ownerId;

            return matchesSearch && matchesTeam && matchesOwner;
        });

        // Collect matches AND their ancestors to preserve tree structure
        const resultIds = new Set<string>();
        matches.forEach(match => {
            let current: OKRNode | undefined = match;
            while (current) {
                resultIds.add(current.id);
                if (current.parentId) {
                    current = okrNodes.find(n => n.id === current!.parentId);
                } else {
                    current = undefined;
                }
            }
        });

        return okrNodes.filter(n => resultIds.has(n.id));
    }, [okrNodes, filters]);

    // Filter root nodes from the filtered set
    const rootNodes = focusedNodeId
        ? filteredNodes.filter(n => n.id === focusedNodeId)
        : filteredNodes.filter(n => n.parentId === null);

    return (
        <div className="flex flex-col gap-4">
            <StrategyConsultantModal isOpen={isConsultantOpen} onClose={() => setIsConsultantOpen(false)} />

            <div className="flex justify-between items-center bg-card p-4 rounded-lg border border-border shadow-sm">
                <div className="flex items-center gap-4">
                    <div className="p-2 bg-primary/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-sm">Need Strategic Clarity?</h3>
                        <p className="text-xs text-muted-foreground">Use the AI Strategy Consultant to build a bespoke plan.</p>
                    </div>
                </div>
                <button
                    onClick={() => setIsConsultantOpen(true)}
                    className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md shadow-sm transition-all flex items-center gap-2"
                >
                    <Sparkles className="w-4 h-4" /> Start Strategy Session
                </button>
            </div>

            <div className="flex justify-between items-start">
                <FilterBar
                    filters={filters}
                    onFilterChange={setFilters}
                    nodes={okrNodes}
                    showCascadingFilters={false}
                    className="mb-0"
                />

                {focusedNodeId && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-md flex items-center justify-between ml-auto">
                        <span className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2 mr-4">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            Focus Mode Active
                        </span>
                        <button
                            onClick={() => setFocusedNodeId(null)}
                            className="text-xs font-medium text-blue-700 dark:text-blue-300 hover:underline"
                        >
                            Clear Focus
                        </button>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="text-sm text-muted-foreground font-medium pl-2">Name</div>
                <div className="text-sm text-muted-foreground font-medium pr-24">Progress</div>
            </div>
            <div className="flex flex-col bg-card rounded-lg border border-border shadow-sm">
                {rootNodes.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {focusedNodeId ? "Focused node not found in current filters." : "No OKRs found matching your criteria."}
                    </div>
                ) : (
                    rootNodes.map(node => (
                        <OKRNodeItem key={node.id} node={node} level={0} nodes={filteredNodes} searchTerm={filters.search} />
                    ))
                )}
            </div>
        </div>
    );
}

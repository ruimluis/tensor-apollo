import { useMemo, useEffect, useState } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    useNodesState,
    useEdgesState,
    useReactFlow,
    ReactFlowProvider,
    getRectOfNodes,
    getTransformForBounds,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useOKRStore } from '@/store/useOKRStore';
import CustomNode from './CustomNode';
import { OKRNode } from '@/types';
import { Layers, ChevronUp, ChevronDown, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { FilterBar, FilterState } from './FilterBar';

// ... (keep getLayoutedElements as is)
// Simple tree layout algorithm
const getLayoutedElements = (nodes: OKRNode[], maxDepth: number, onFocus: (id: string) => void) => {
    // ... (same as existing)
    const layoutedNodes: Node[] = [];
    const layoutedEdges: Edge[] = [];

    // Build hierarchy map
    const hierarchy: Record<string, OKRNode[]> = {};
    const roots: OKRNode[] = [];

    nodes.forEach(node => {
        // Find if parent exists in visible nodes
        // If parentId exists but parent is filtered out, this node becomes a root
        const parentExists = node.parentId && nodes.some(n => n.id === node.parentId);

        if (!node.parentId || !parentExists) {
            roots.push(node);
        } else {
            if (!hierarchy[node.parentId]) hierarchy[node.parentId] = [];
            hierarchy[node.parentId].push(node);
        }
    });

    const LEVEL_WIDTH = 400;
    const NODE_HEIGHT = 220;

    let globalY = 0;

    const traverse = (node: OKRNode, level: number) => {
        // Inject handlers
        node.onFocus = onFocus;

        // If we've reached max depth, pretend no children exist so layout treats it as a leaf
        const originalChildren = hierarchy[node.id] || [];
        const children = level >= maxDepth ? [] : originalChildren;

        // Calculate Y position - center parent relative to children
        // If leaf, just increment globalY
        let yPos = globalY;

        if (children.length > 0) {
            // Recurse first to determine children's positions
            const childrenY: number[] = [];
            children.forEach(child => {
                childrenY.push(traverse(child, level + 1));
            });

            // Parent Y is average of children Y
            // But we also need to respect globalY so we don't overlap previous branches. 
            // This simple logic might overlap if not careful. 
            // Better visualization: Pre-order traversal to count leaves?
            // Let's stick to a simple: Y is based on "row index" in a flattened list of leaves.

            // Re-do: We need to know the 'height' of the subtree.
            // Let's assume a simplified layout: Depth * Width for X. Y increments for every node, but we adjust for hierarchy.
            yPos = (Math.min(...childrenY) + Math.max(...childrenY)) / 2;
        } else {
            // Leaf
            yPos = globalY;
            globalY += NODE_HEIGHT;
        }

        layoutedNodes.push({
            id: node.id,
            type: 'custom',
            position: { x: level * LEVEL_WIDTH, y: yPos },
            data: node,
        });

        if (node.parentId && nodes.some(n => n.id === node.parentId)) {
            layoutedEdges.push({
                id: `e-${node.parentId}-${node.id}`,
                source: node.parentId,
                target: node.id,
                type: 'smoothstep',
                style: { stroke: 'hsl(var(--muted-foreground))' },
            });
        }

        return yPos;
    };

    // Reset Y for each root
    // Wait, traverse needs to return the Y center of the node.
    // And GlobalY keeps track of the next available "slot".

    roots.forEach(root => traverse(root, 0));

    return { nodes: layoutedNodes, edges: layoutedEdges };
};

const nodeTypes = {
    custom: CustomNode,
};

function OKRGraphViewContent() {
    const { nodes: okrNodes } = useOKRStore();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [maxDepth, setMaxDepth] = useState(3);
    const [focusedNodeId, setFocusedNodeId] = useState<string | null>(null);
    const [filters, setFilters] = useState<FilterState>({
        search: '',
        teamId: '',
        ownerId: '',
        goalId: '',
        objectiveId: '',
        keyResultId: ''
    });

    const { fitView, getNodes } = useReactFlow();

    // 1. Apply Filters (Match + Ancestors + Descendants for Drill Down)
    const filteredNodes = useMemo(() => {
        const hasActiveFilters = filters.search || filters.teamId || filters.ownerId || filters.goalId || filters.objectiveId || filters.keyResultId;
        if (!hasActiveFilters) return okrNodes;

        // Determine if we are in "Drill Down" mode (hierarchical filter) or just property filter
        // If goalId/objectiveId/keyResultId is set, we want to show the Subtree of that node.

        let rootId: string | null = null;
        if (filters.keyResultId) rootId = filters.keyResultId;
        else if (filters.objectiveId) rootId = filters.objectiveId;
        else if (filters.goalId) rootId = filters.goalId;

        // Phase 1: Filter by Root Subtree (if Drill Down active)
        let subset = okrNodes;
        if (rootId) {
            // Get all descendants of rootId, PLUS rootId itself
            const hierarchy: Record<string, string[]> = {};
            okrNodes.forEach(n => {
                if (n.parentId) {
                    if (!hierarchy[n.parentId]) hierarchy[n.parentId] = [];
                    hierarchy[n.parentId].push(n.id);
                }
            });

            const descendants = new Set<string>();
            const traverse = (id: string) => {
                descendants.add(id);
                const children = hierarchy[id] || [];
                children.forEach(childId => traverse(childId));
            };
            traverse(rootId);

            subset = okrNodes.filter(n => descendants.has(n.id));
        }

        // Phase 2: Apply Property Filters (Search, Team, Owner) to the subset
        // Note: Team usually filters Goals, but if we select a Team, should we filter everything?
        // If a Goal belongs to Team A, its children implicitly belong to Team A context.
        // But if filtering by TeamId explicitly, we might want to check the node's teamId?
        // Let's stick to: If TeamId set, strict filter on node.teamId? 
        // OR: If TeamId set, show all nodes that belong to that team OR have ancestors in that team?
        // Simplest interpretation of "Filter": Show nodes that match.

        const matches = subset.filter(node => {
            const matchesSearch = !filters.search || (
                (node.title?.toLowerCase().includes(filters.search.toLowerCase())) ||
                (node.description?.toLowerCase().includes(filters.search.toLowerCase()))
            );

            // Team Filter: 
            // If we are in Drill Down (rootId set), we assume the user already drilled via Team -> Goal.
            // But if only Team is selected (no rootId), show nodes with that teamId? 
            // Better: If Team selected, valid start nodes must match team.
            // Let's support strict matching for Team/Owner on top of Drill Down.
            const matchesTeam = !filters.teamId || node.teamId === filters.teamId;
            const matchesOwner = !filters.ownerId || node.owner === filters.ownerId;

            // Exception: If we have a RootID drilldown, we might NOT want to strict filter Team on children 
            // if children don't inherit the teamId property explicitly in current data model.
            // But usually they do or it's fine. 
            // Let's relax Team filter if RootID is set? NO, assume consistency.

            return matchesSearch && matchesTeam && matchesOwner;
        });

        // Phase 3: Restore structure (Ancestors) for visualization
        // If we strictly matched nodes, we need their parents to draw the tree context for generic filters.
        // For Drill Down (RootID), we already have the subtree, but if we filtered inside it (e.g. Search),
        // we might have broken links.

        // If RootID is set, we want to see the Subtree. 
        // Does "Search" filter WITHIN the subtree? Yes.
        // If Search filters within subtree, we still need path to RootID?

        const resultIds = new Set<string>();
        matches.forEach(match => {
            let current: OKRNode | undefined = match;
            while (current) {
                resultIds.add(current.id);
                // Stop adding ancestors if we hit the Drill Down Root (optional optimization, but visual context is good)
                if (rootId && current.id === rootId) break;

                if (current.parentId) {
                    current = okrNodes.find(n => n.id === current!.parentId);
                } else {
                    current = undefined;
                }
            }
        });

        return subset.filter(n => resultIds.has(n.id)); // Subset intersection to ensure we don't leak outside drilldown
    }, [okrNodes, filters]);

    // 2. Apply Focus Logic on top of Filtered Nodes
    const visibleNodes = useMemo(() => {
        const baseNodes = filteredNodes;
        if (!focusedNodeId) return baseNodes;

        // If filtered set doesn't contain the focused node (e.g. filtered out), reset focus?
        // Or just show nothing? Let's assume user might want to clear focus.
        // For now, if focused node is gone, we effectively show nothing or partial tree.
        // Let's proceed with standard logic: descendants of focusedNode within baseNodes.

        const hierarchy: Record<string, OKRNode[]> = {};
        baseNodes.forEach(node => {
            if (node.parentId) {
                if (!hierarchy[node.parentId]) hierarchy[node.parentId] = [];
                hierarchy[node.parentId].push(node);
            }
        });

        const descendants = new Set<string>();
        const traverse = (id: string) => {
            descendants.add(id);
            const children = hierarchy[id] || [];
            children.forEach(child => traverse(child.id));
        };

        const root = baseNodes.find(n => n.id === focusedNodeId);
        if (root) traverse(root.id);

        return baseNodes.filter(n => descendants.has(n.id));
    }, [filteredNodes, focusedNodeId]);


    // Calculate actual tree depth to clamp maxDepth
    const treeDepth = useMemo(() => {
        if (!visibleNodes.length) return 0;

        const hierarchy: Record<string, OKRNode[]> = {};
        const roots: OKRNode[] = [];

        // Use visibleNodes for calculation
        visibleNodes.forEach(node => {
            // A node is a root in this context if it has no parent OR its parent is not visible
            const parentVisible = node.parentId && visibleNodes.some(n => n.id === node.parentId);
            if (!node.parentId || !parentVisible) roots.push(node);
            else {
                if (!hierarchy[node.parentId]) hierarchy[node.parentId] = [];
                hierarchy[node.parentId].push(node);
            }
        });

        const getDepth = (node: OKRNode): number => {
            const children = hierarchy[node.id] || [];
            if (children.length === 0) return 0;
            return 1 + Math.max(...children.map(getDepth));
        };

        if (roots.length === 0) return 0;
        return Math.max(...roots.map(getDepth));
    }, [visibleNodes]);

    useEffect(() => {
        // Inject searchTerm into nodes before layout
        const nodesWithSearch = visibleNodes.map(n => ({
            ...n,
            searchTerm: filters.search
        }));

        const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(
            nodesWithSearch,
            maxDepth,
            (id) => setFocusedNodeId(id)
        );
        setNodes(layoutNodes);
        setEdges(layoutEdges);

        // Wait for state update to propagate
        setTimeout(() => {
            fitView({ padding: 0.2, duration: 800 });
        }, 50);
    }, [visibleNodes, maxDepth, setNodes, setEdges, fitView]);

    const handleDownload = () => {
        const nodesBounds = getRectOfNodes(getNodes());
        const transform = getTransformForBounds(nodesBounds, 1024, 768, 0.5, 2);

        // Find viewport element
        const viewport = document.querySelector('.react-flow__viewport') as HTMLElement;
        const isDarkMode = document.documentElement.classList.contains('dark');

        if (viewport) {
            toPng(viewport, {
                backgroundColor: isDarkMode ? '#020817' : '#ffffff', // Use theme bg color
                width: nodesBounds.width,
                height: nodesBounds.height,
                style: {
                    width: `${nodesBounds.width}px`,
                    height: `${nodesBounds.height}px`,
                    transform: `translate(${transform[0]}px, ${transform[1]}px) scale(${transform[2]})`,
                },
            }).then((dataUrl) => {
                const link = document.createElement('a');
                link.download = `okr-graph-${isDarkMode ? 'dark' : 'light'}.png`;
                link.href = dataUrl;
                link.click();
            });
        }
    };

    return (
        <div className="h-[calc(100vh-180px)] min-h-[500px] w-full rounded-lg border border-border shadow-sm bg-card overflow-hidden relative">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-muted/10"
                nodesDraggable={false}
                nodesConnectable={false}
                zoomOnDoubleClick={false}
            >
                <Background color="hsl(var(--muted-foreground))" gap={16} size={0.5} style={{ opacity: 0.2 }} />
                <Controls showInteractive={false} className="!bg-card !border-border shadow-lg [&>button]:!bg-card [&>button]:!border-border [&>button]:!text-muted-foreground [&>button:hover]:!bg-muted [&>button:hover]:!text-foreground [&_svg]:!fill-current [&_path]:!fill-current">
                    <div className="flex flex-col border-t border-border/50 pt-1 mt-1">
                        <button
                            onClick={handleDownload}
                            className="react-flow__controls-button !bg-card !border-none hover:!bg-muted !text-muted-foreground hover:!text-foreground flex items-center justify-center p-1"
                            title="Download Image"
                        >
                            <Download className="h-3 w-3" />
                        </button>
                        <div className="h-px bg-border/50 mx-1 my-1" />
                        <button
                            onClick={() => setMaxDepth(prev => Math.min(prev + 1, treeDepth))}
                            disabled={maxDepth >= treeDepth}
                            className="react-flow__controls-button !bg-card !border-none hover:!bg-muted !text-muted-foreground hover:!text-foreground disabled:opacity-30 disabled:hover:!bg-card flex items-center justify-center p-1"
                            title="Expand Level"
                        >
                            <ChevronDown className="h-3 w-3" />
                        </button>
                        <div className="text-[8px] font-bold text-center text-muted-foreground py-0.5 select-none">
                            Lvl {maxDepth + 1}
                        </div>
                        <button
                            onClick={() => setMaxDepth(prev => Math.max(0, prev - 1))}
                            className="react-flow__controls-button !bg-card !border-none hover:!bg-muted !text-muted-foreground hover:!text-foreground flex items-center justify-center p-1"
                            title="Collapse Level"
                        >
                            <ChevronUp className="h-3 w-3" />
                        </button>
                    </div>
                </Controls>
            </ReactFlow>

            {/* Filter Bar */}
            <div className="absolute top-4 left-4 z-10">
                <FilterBar
                    filters={filters}
                    onFilterChange={setFilters}
                    nodes={okrNodes}
                />
            </div>

            {/* Reset Focus Button (Moved down slightly to avoid overlap if needed, or placed next to filter) */}
            {focusedNodeId && (
                <div className="absolute top-4 right-16 z-10 animate-in fade-in slide-in-from-top-4 duration-300">
                    <button
                        onClick={() => setFocusedNodeId(null)}
                        className="bg-card border border-border px-3 py-1.5 rounded-md shadow-lg text-sm font-medium flex items-center gap-2 hover:bg-muted transition-colors"
                    >
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        Reset View
                    </button>
                </div>
            )}
        </div>
    );
}

export function OKRGraphView() {
    return (
        <ReactFlowProvider>
            <OKRGraphViewContent />
        </ReactFlowProvider>
    );
}

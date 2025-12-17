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

// Simple tree layout algorithm
const getLayoutedElements = (nodes: OKRNode[], maxDepth: number, onFocus: (id: string) => void) => {
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
    const NODE_HEIGHT = 150;

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
    const { fitView, getNodes } = useReactFlow();

    // Filter nodes based on focus
    const visibleNodes = useMemo(() => {
        if (!focusedNodeId) return okrNodes;

        const hierarchy: Record<string, OKRNode[]> = {};
        okrNodes.forEach(node => {
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

        const root = okrNodes.find(n => n.id === focusedNodeId);
        if (root) traverse(root.id);

        return okrNodes.filter(n => descendants.has(n.id));
    }, [okrNodes, focusedNodeId]);


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
        const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(
            visibleNodes,
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

            {/* Reset Focus Button */}
            {focusedNodeId && (
                <div className="absolute top-4 left-4 z-10 animate-in fade-in slide-in-from-top-4 duration-300">
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

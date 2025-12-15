import { useMemo, useEffect } from 'react';
import ReactFlow, {
    Background,
    Controls,
    Edge,
    Node,
    useNodesState,
    useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useOKRStore } from '@/store/useOKRStore';
import CustomNode from './CustomNode';
import { OKRNode } from '@/types';

// Simple tree layout algorithm
const getLayoutedElements = (nodes: OKRNode[]) => {
    const layoutedNodes: Node[] = [];
    const layoutedEdges: Edge[] = [];

    // Build hierarchy map
    const hierarchy: Record<string, OKRNode[]> = {};
    const roots: OKRNode[] = [];

    nodes.forEach(node => {
        if (!node.parentId) {
            roots.push(node);
        } else {
            if (!hierarchy[node.parentId]) hierarchy[node.parentId] = [];
            hierarchy[node.parentId].push(node);
        }
    });

    const LEVEL_WIDTH = 350;
    const NODE_HEIGHT = 150;

    let globalY = 0;

    const traverse = (node: OKRNode, level: number) => {
        const children = hierarchy[node.id] || [];

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

        if (node.parentId) {
            layoutedEdges.push({
                id: `e-${node.parentId}-${node.id}`,
                source: node.parentId,
                target: node.id,
                type: 'smoothstep',
                animated: true,
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

export function OKRGraphView() {
    const { nodes: okrNodes } = useOKRStore();
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);

    useEffect(() => {
        const { nodes: layoutNodes, edges: layoutEdges } = getLayoutedElements(okrNodes);
        setNodes(layoutNodes);
        setEdges(layoutEdges);
    }, [okrNodes, setNodes, setEdges]);

    return (
        <div className="h-[600px] w-full rounded-lg border border-border shadow-sm bg-card overflow-hidden">
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                nodeTypes={nodeTypes}
                fitView
                className="bg-muted/10"
            >
                <Background color="hsl(var(--muted-foreground))" gap={16} size={0.5} style={{ opacity: 0.2 }} />
                <Controls className="!bg-card !border-border !fill-foreground [&>button]:!fill-foreground" />
            </ReactFlow>
        </div>
    );
}

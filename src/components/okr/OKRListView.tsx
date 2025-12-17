import { useOKRStore } from '@/store/useOKRStore';
import { OKRNodeItem } from './OKRNodeItem';

export function OKRListView() {
    const { nodes, focusedNodeId, setFocusedNodeId } = useOKRStore();

    // Filter nodes based on focus mode
    const rootNodes = focusedNodeId
        ? nodes.filter(n => n.id === focusedNodeId)
        : nodes.filter(n => n.parentId === null);

    return (
        <div className="flex flex-col gap-4">
            {focusedNodeId && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 px-4 py-2 rounded-md flex items-center justify-between">
                    <span className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
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

            <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="text-sm text-muted-foreground font-medium pl-2">Name</div>
                <div className="text-sm text-muted-foreground font-medium pr-24">Progress</div>
            </div>
            <div className="flex flex-col bg-card rounded-lg border border-border shadow-sm">
                {rootNodes.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                        {focusedNodeId ? "Focused node not found." : "No OKRs found. Create one to get started."}
                    </div>
                ) : (
                    rootNodes.map(node => (
                        <OKRNodeItem key={node.id} node={node} level={0} />
                    ))
                )}
            </div>
        </div>
    );
}

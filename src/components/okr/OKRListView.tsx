import { useOKRStore } from '@/store/useOKRStore';
import { OKRNodeItem } from './OKRNodeItem';

export function OKRListView() {
    const { nodes } = useOKRStore();

    // Root nodes are those with no parent (Goals) or if we want to handle orphans. 
    // Strictly following hierarchy: Roots have parentId === null.
    const rootNodes = nodes.filter(n => n.parentId === null);

    return (
        <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between pb-4 border-b border-border">
                <div className="text-sm text-muted-foreground font-medium pl-2">Name</div>
                <div className="text-sm text-muted-foreground font-medium pr-24">Progress</div>
            </div>
            <div className="flex flex-col bg-card rounded-lg border border-border shadow-sm">
                {rootNodes.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No OKRs found. Create one to get started.</div>
                ) : (
                    rootNodes.map(node => (
                        <OKRNodeItem key={node.id} node={node} level={0} />
                    ))
                )}
            </div>
        </div>
    );
}

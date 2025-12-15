import React, { useState } from 'react';
import { ChevronRight, MoreHorizontal, Circle, Trash2, Edit2, Plus, CornerDownRight } from 'lucide-react';
import { OKRNode, OKRType, NODE_COLORS, NODE_LABELS } from '@/types';
import { useOKRStore } from '@/store/useOKRStore';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CreateOKRForm } from '@/components/okr/CreateOKRForm';

interface OKRNodeItemProps {
    node: OKRNode;
    level: number;
}

export function OKRNodeItem({ node, level }: OKRNodeItemProps) {
    const { nodes, toggleExpand, deleteNode } = useOKRStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    // Find children
    const children = nodes.filter(n => n.parentId === node.id);
    const hasChildren = children.length > 0;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed': return 'text-green-500';
            case 'in-progress': return 'text-blue-500';
            default: return 'text-muted-foreground';
        }
    };

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        deleteNode(node.id);
    };

    return (
        <div className="flex flex-col select-none">
            <div
                className={cn(
                    "group flex items-center py-2 px-2 hover:bg-accent/50 rounded-md transition-colors border-b border-border/40 relative",
                    level === 0 ? "bg-card" : ""
                )}
                style={{ paddingLeft: `${level * 24 + 8}px` }}
                onClick={() => setIsMenuOpen(false)} // Close menu on row click
            >
                <button
                    onClick={(e) => { e.stopPropagation(); toggleExpand(node.id); }}
                    className={cn(
                        "p-1 rounded-sm hover:bg-muted-foreground/20 mr-2 text-muted-foreground transition-transform",
                        !hasChildren && "invisible",
                        node.expanded ? "rotate-90" : ""
                    )}
                >
                    <ChevronRight className="h-4 w-4" />
                </button>

                <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mr-3 text-white", NODE_COLORS[node.type])}>
                    {NODE_LABELS[node.type]}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-sm truncate">{node.title}</span>
                    </div>
                    {node.description && <p className="text-xs text-muted-foreground truncate">{node.description}</p>}
                </div>

                <div className="flex items-center gap-4 text-xs text-muted-foreground mr-4">
                    <div className="w-24 h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                            className={cn("h-full transition-all", getStatusColor(node.status)?.replace('text-', 'bg-'))}
                            style={{ width: `${node.progress}%` }}
                        />
                    </div>
                    <span className="w-8 text-right">{node.progress}%</span>
                </div>

                <div className="flex items-center gap-2 relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                        className={cn("p-1.5 hover:bg-background rounded-md text-muted-foreground hover:text-foreground border border-transparent hover:border-border transition-all", isMenuOpen ? "opacity-100 bg-background border-border" : "opacity-0 group-hover:opacity-100")}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {/* Simple Dropdown Menu */}
                    {isMenuOpen && (
                        <div className="absolute right-0 top-8 z-50 w-48 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border animate-in fade-in zoom-in-95 duration-100">
                            <div className="py-1">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); setIsMenuOpen(false); }}
                                    className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                >
                                    <CornerDownRight className="mr-2 h-4 w-4 text-muted-foreground" />
                                    Add Child Node
                                </button>
                                <button
                                    onClick={(e) => { e.stopPropagation(); setShowEditModal(true); setIsMenuOpen(false); }}
                                    className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                >
                                    <Edit2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                    Edit
                                </button>
                                <button
                                    onClick={handleDeleteClick}
                                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 text-left"
                                >
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {node.expanded && hasChildren && (
                <div className="flex flex-col">
                    {children.map(child => (
                        <OKRNodeItem key={child.id} node={child} level={level + 1} />
                    ))}
                </div>
            )}

            {/* Modals placed here for context access to 'node' */}

            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title={`Add child to "${node.title}"`}
            >
                <CreateOKRForm
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    parentType={node.type}
                    initialData={{ parentId: node.id }}
                />
            </Modal>

            <Modal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={`Edit "${node.title}"`}
            >
                <CreateOKRForm
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    initialData={node}
                    defaultType={node.type}
                />
            </Modal>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete OKR"
                description={`Are you sure you want to delete "${node.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </div>
    );
}

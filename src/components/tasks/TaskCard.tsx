import React, { useState } from 'react';
import { OKRNode, NODE_COLORS, NODE_LABELS } from '@/types';
import { useOKRStore } from '@/store/useOKRStore';
import { cn } from '@/lib/utils';
import { Clock, Calendar, MoreHorizontal, Edit2, Trash2, CheckCircle2, MessageCircle, AlertCircle, CheckSquare } from 'lucide-react';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CreateOKRForm } from '@/components/okr/CreateOKRForm';
import { HighlightText } from '@/components/ui/HighlightText';

interface TaskCardProps {
    node: OKRNode;
    searchTerm?: string;
    parentTitle?: string;
}

export function TaskCard({ node, searchTerm, parentTitle }: TaskCardProps) {
    const { deleteNode } = useOKRStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editModalTab, setEditModalTab] = useState<'details' | 'progress' | 'discussion'>('details');

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        deleteNode(node.id);
    };

    const openEditModal = (tab: 'details' | 'progress' | 'discussion', e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditModalTab(tab);
        setShowEditModal(true);
        setIsMenuOpen(false);
    };

    // Calculate days remaining or overdue
    const getDueDateStatus = () => {
        if (!node.endDate) return null;
        const end = new Date(node.endDate);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (node.progress === 100) return { text: 'Completed', color: 'text-green-600 bg-green-50' };
        if (diffDays < 0) return { text: `${Math.abs(diffDays)}d overdue`, color: 'text-red-600 bg-red-50' };
        if (diffDays <= 3) return { text: `${diffDays}d left`, color: 'text-amber-600 bg-amber-50' };
        return { text: new Date(node.endDate).toLocaleDateString(), color: 'text-muted-foreground bg-muted' };
    };

    const dateStatus = getDueDateStatus();

    // Checklist Stats
    const checklistStats = node.checklist ? {
        total: node.checklist.length,
        checked: node.checklist.filter(i => i.checked).length
    } : null;

    return (
        <div className="group relative bg-card hover:shadow-md border border-border rounded-lg p-4 transition-all flex flex-col h-full">
            {/* Header: Type Badge & Menu */}
            <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                    <div className={cn("px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-white", NODE_COLORS[node.type])}>
                        {NODE_LABELS[node.type]}
                    </div>
                    {node.teamName && (
                        <div className="px-2 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground border border-border/50 truncate max-w-[100px]" title={node.teamName}>
                            {node.teamName}
                        </div>
                    )}
                </div>

                <div className="relative">
                    <button
                        onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                        className={cn("p-1 -mt-1 -mr-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-all", isMenuOpen ? "opacity-100 bg-muted" : "opacity-0 group-hover:opacity-100")}
                    >
                        <MoreHorizontal className="h-4 w-4" />
                    </button>

                    {isMenuOpen && (
                        <div className="absolute right-0 top-6 z-50 w-40 origin-top-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border animate-in fade-in zoom-in-95 duration-100">
                            <div className="py-1">
                                <button
                                    onClick={(e) => openEditModal('details', e)}
                                    className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                >
                                    <Edit2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    Edit Details
                                </button>
                                <button
                                    onClick={(e) => openEditModal('progress', e)}
                                    className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                >
                                    <CheckCircle2 className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    Update Progress
                                </button>
                                <button
                                    onClick={(e) => openEditModal('discussion', e)}
                                    className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                >
                                    <MessageCircle className="mr-2 h-3.5 w-3.5 text-muted-foreground" />
                                    Discussion
                                </button>
                                <button
                                    onClick={handleDeleteClick}
                                    className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 text-left border-t border-border mt-1 pt-2"
                                >
                                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Content: Title & Description */}
            <div className="flex-1 min-w-0 mb-4 cursor-pointer" onClick={() => openEditModal('details')}>
                {parentTitle && (
                    <div className="text-[10px] text-muted-foreground mb-1 flex items-center gap-1 truncate">
                        <span className="opacity-70">Linked to:</span>
                        <span className="font-medium hover:underline" title={parentTitle}>{parentTitle}</span>
                    </div>
                )}
                <h3 className="font-medium text-sm line-clamp-2 mb-1" title={node.title}>
                    <HighlightText text={node.title} highlight={searchTerm || ''} />
                </h3>
                {node.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2" title={node.description}>
                        <HighlightText text={node.description} highlight={searchTerm || ''} />
                    </p>
                )}

                {/* Checklist Summary */}
                {checklistStats && checklistStats.total > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] text-muted-foreground bg-muted/30 px-2 py-1 rounded w-fit">
                        <div className="font-medium flex items-center gap-1">
                            <CheckSquare className="h-3 w-3 opacity-70" />
                            {checklistStats.checked}/{checklistStats.total}
                        </div>
                        <div className="w-12 h-1 bg-muted-foreground/20 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary/70"
                                style={{ width: `${(checklistStats.checked / checklistStats.total) * 100}%` }}
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Footer: Metadata & Progress */}
            <div className="mt-auto pt-3 border-t border-border/50 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        {/* Owner Avatar/Initials */}
                        <div className="flex items-center gap-1 bg-muted rounded-full px-2 py-0.5" title={node.ownerName || 'Unassigned'}>
                            <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold text-primary uppercase">
                                {node.ownerName ? node.ownerName[0] : '?'}
                            </div>
                            <span className="truncate max-w-[80px]">{node.ownerName || 'Unassigned'}</span>
                        </div>
                    </div>

                    {/* Due Date Badge */}
                    {dateStatus && (
                        <div className={cn("px-1.5 py-0.5 rounded text-[10px] font-medium flex items-center gap-1", dateStatus.color)}>
                            <Calendar className="h-3 w-3" />
                            {dateStatus.text}
                        </div>
                    )}
                </div>

                <div className="flex justify-between items-center text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>{node.estimatedHours || 0}h</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium">
                        <div className="w-16 h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all", node.progress === 100 ? "bg-green-500" : "bg-primary")}
                                style={{ width: `${node.progress}%` }}
                            />
                        </div>
                        <span>{Math.round(node.progress)}%</span>
                    </div>
                </div>
            </div>

            {/* Unread Indicator */}
            {node.unread && (
                <div
                    className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full border-2 border-background z-10 animate-pulse"
                    title="Unread comments"
                />
            )}

            <Drawer
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={`Edit "${node.title}"`}
            >
                <CreateOKRForm
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    initialData={node}
                    defaultType={node.type}
                    initialTab={editModalTab}
                />
            </Drawer>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete Task"
                description={`Are you sure you want to delete "${node.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </div>
    );
}

import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { OKRNode, NODE_COLORS, NODE_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { MoreHorizontal, CornerDownRight, Edit2, Trash2, Eye, CheckCircle2, MessageCircle, PlayCircle, TrendingUp, TrendingDown, Target, Percent, Hash, Clock, ListChecks } from 'lucide-react';
import { useOKRStore } from '@/store/useOKRStore';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CreateOKRForm } from '@/components/okr/CreateOKRForm';
import { Tooltip } from '@/components/ui/Tooltip';
import { HighlightText } from '@/components/ui/HighlightText';

interface CustomNodeProps {
    data: OKRNode & { searchTerm?: string };
}

const CustomNode = ({ data }: CustomNodeProps) => {
    const { deleteNode } = useOKRStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editModalTab, setEditModalTab] = useState<'details' | 'progress' | 'discussion'>('details');

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        deleteNode(data.id);
    };

    const openEditModal = (tab: 'details' | 'progress' | 'discussion', e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        setEditModalTab(tab);
        setShowEditModal(true);
        setIsMenuOpen(false);
    };

    return (
        // Remove overflow-hidden so dropdown can pop out
        <div className="shadow-lg rounded-lg bg-card border border-border dark:border-white/20 w-[320px] group relative">
            <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />

            {/* Rounded top corners manually since parent doesn't have overflow-hidden */}
            <div className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white flex justify-between items-center rounded-t-lg", NODE_COLORS[data.type])}>
                <span>{NODE_LABELS[data.type]}</span>
            </div>

            <div className="p-3">
                <Tooltip content={
                    <div className="space-y-1">
                        <div className="font-bold">{data.title}</div>
                        {data.description && <div className="text-xs text-muted-foreground/80">{data.description}</div>}
                    </div>
                }>
                    <div className="font-bold text-sm truncate cursor-help">
                        <HighlightText text={data.title} highlight={data.searchTerm || ''} />
                    </div>
                </Tooltip>
                {/* Unread Indicator */}
                {data.unread && (
                    <div
                        className="flex-shrink-0 text-red-500 animate-pulse cursor-pointer hover:scale-110 transition-transform mt-0.5"
                        title="Unread comments"
                        onClick={(e) => openEditModal('discussion', e)}
                    >
                        <MessageCircle className="h-4 w-4 fill-red-500/20" />
                    </div>
                )}

                {/* Team & Owner Badges */}
                {(data.type === 'OBJECTIVE' || data.type === 'KEY_RESULT' || data.type === 'TASK') && (
                    <div className="flex flex-wrap gap-2 text-[10px] mb-2">
                        {data.teamName && (
                            <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                                {data.teamName}
                            </span>
                        )}
                        {data.ownerName && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                                {data.ownerName}
                            </span>
                        )}
                        {data.type === 'TASK' && data.estimatedHours && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                                <Clock className="h-3 w-3" />
                                {data.estimatedHours}h
                            </span>
                        )}
                    </div>
                )}

                {/* KR Value Display */}
                {data.type === 'KEY_RESULT' && data.metricType === 'value' && (
                    <div className="mb-2 bg-muted/50 rounded-md border border-border/50 px-2 py-1 text-xs flex items-center justify-between">
                        <div className="flex items-center gap-1 text-muted-foreground/70" title="Start">
                            <PlayCircle className="h-3 w-3" />
                            <span>{data.metricStart ?? 0}</span>
                        </div>
                        <div className="text-border">|</div>
                        <div className="flex items-center gap-1 font-medium text-foreground" title="Current">
                            {data.metricAsc === false ? (
                                <TrendingDown className="h-3 w-3 text-red-500/70" />
                            ) : (
                                <TrendingUp className="h-3 w-3 text-green-500/70" />
                            )}
                            <span>{data.currentValue ?? data.metricStart ?? 0}</span>
                        </div>
                        <div className="text-border">|</div>
                        <div className="flex items-center gap-1 text-muted-foreground" title="Target">
                            <Target className="h-3 w-3" />
                            <span>{data.metricTarget}</span>
                            {data.metricUnit && <span className="text-[10px] ml-0.5">{data.metricUnit}</span>}
                        </div>
                    </div>
                )}

                <div className="flex items-center justify-between mt-2">
                    {/* Metric Icon */}
                    <div className="flex items-center gap-2 flex-1 mr-2">
                        {data.type === 'TASK' && (
                            <div title="Metric Type">
                                {data.metricType === 'percentage' && <Percent className="h-3 w-3 text-muted-foreground/70" />}
                                {data.metricType === 'value' && <Hash className="h-3 w-3 text-muted-foreground/70" />}
                                {(!data.metricType || data.metricType === 'boolean') && <CheckCircle2 className="h-3 w-3 text-muted-foreground/70" />}
                                {data.metricType === 'checklist' && <ListChecks className="h-3 w-3 text-muted-foreground/70" />}
                            </div>
                        )}
                        <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                            <div
                                className={cn("h-full transition-all bg-primary")}
                                style={{ width: `${data.progress}%` }}
                            />
                        </div>
                        <span className="text-xs font-medium text-muted-foreground w-[32px] text-right">{Math.round(data.progress)}%</span>
                    </div>

                    <div className="relative">
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}
                            className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded text-muted-foreground hover:text-foreground"
                        >
                            <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {/* Dropdown Menu */}
                        {isMenuOpen && (
                            <div className="absolute right-0 bottom-full mb-1 z-50 w-48 origin-bottom-right rounded-md bg-popover shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none border border-border animate-in fade-in zoom-in-95 duration-100">
                                <div className="py-1">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            data.onFocus?.(data.id);
                                            setIsMenuOpen(false);
                                        }}
                                        className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                    >
                                        <Eye className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Focus Branch
                                    </button>
                                    {data.type !== 'TASK' && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); setIsMenuOpen(false); }}
                                            className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                        >
                                            <CornerDownRight className="mr-2 h-4 w-4 text-muted-foreground" />
                                            Add Child
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => openEditModal('details', e)}
                                        className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                    >
                                        <Edit2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Edit Details
                                    </button>
                                    {(data.type === 'KEY_RESULT' || data.type === 'TASK') && (
                                        <button
                                            onClick={(e) => openEditModal('progress', e)}
                                            className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                        >
                                            <CheckCircle2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                            Update Progress
                                        </button>
                                    )}
                                    <button
                                        onClick={(e) => openEditModal('discussion', e)}
                                        className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                    >
                                        <MessageCircle className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Conversations
                                    </button>
                                    <button
                                        onClick={handleDeleteClick}
                                        className="flex w-full items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 text-left border-t border-border mt-1 pt-2"
                                    >
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer Metadata */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex gap-2">
                        <span>{data.startDate ? new Date(data.startDate).toLocaleDateString() : 'No start'}</span>
                        <span>-</span>
                        <span>{data.endDate ? new Date(data.endDate).toLocaleDateString() : 'No end'}</span>
                    </div>
                </div>
            </div>

            <Handle type="source" position={Position.Right} className="!bg-muted-foreground" />

            {/* Modals */}
            <Drawer
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title={`Add child to "${data.title}"`}
            >
                <CreateOKRForm
                    isOpen={showCreateModal}
                    onClose={() => setShowCreateModal(false)}
                    parentType={data.type}
                    initialData={{ parentId: data.id }}
                />
            </Drawer>

            <Drawer
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                title={`Edit "${data.title}"`}
            >
                <CreateOKRForm
                    isOpen={showEditModal}
                    onClose={() => setShowEditModal(false)}
                    initialData={data}
                    defaultType={data.type}
                    initialTab={editModalTab}
                />
            </Drawer>

            <ConfirmationModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={confirmDelete}
                title="Delete OKR"
                description={`Are you sure you want to delete "${data.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </div >
    );
};

export default memo(CustomNode);

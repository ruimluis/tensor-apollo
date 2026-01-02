import React, { useState } from 'react';
import { ChevronRight, MoreHorizontal, Trash2, Edit2, CornerDownRight, Crosshair, Minimize2, Hash, Percent, ListChecks, CheckCircle2, MessageCircle, TrendingUp, TrendingDown, PlayCircle, Target, Clock, AlertCircle, AlertTriangle } from 'lucide-react';
import { OKRNode, NODE_COLORS, NODE_LABELS } from '@/types';
import { useOKRStore } from '@/store/useOKRStore';
import { cn } from '@/lib/utils';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CreateOKRForm } from '@/components/okr/CreateOKRForm';

import { Tooltip } from '@/components/ui/Tooltip';
import { HighlightText } from '@/components/ui/HighlightText';

interface OKRNodeItemProps {
    node: OKRNode;
    level: number;
    nodes?: OKRNode[]; // specific set of nodes (e.g. filtered)
    searchTerm?: string;
}

export function OKRNodeItem({ node, level, nodes: propNodes, searchTerm }: OKRNodeItemProps) {
    const { nodes: storeNodes, toggleExpand, deleteNode, focusedNodeId, setFocusedNodeId } = useOKRStore();
    const effectiveNodes = propNodes || storeNodes;

    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [editModalTab, setEditModalTab] = useState<'details' | 'progress' | 'discussion'>('details');

    // Find children
    const children = effectiveNodes.filter(n => n.parentId === node.id);
    const hasChildren = children.length > 0;

    // Date Mismatch Check
    const dateMismatch = (node.type === 'KEY_RESULT' && node.endDate) ? children.find(n =>
        n.type === 'TASK' &&
        n.endDate &&
        n.endDate > node.endDate!
    ) : null;

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

    if (node.type === 'OBJECTIVE' && node.risk_status) {
        // console.log("Rendering Objective with Risk:", node.title, node.risk_status);
    }

    return (
        <div className="flex flex-col select-none mb-2">
            <div
                className={cn(
                    "group flex items-center py-3 px-3 hover:bg-muted/30 rounded-lg transition-all border border-border/60 relative shadow-sm",
                    level === 0 ? "bg-card border-border" : "bg-card/50"
                )}
                style={{ marginLeft: `${level * 24}px` }}
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

                <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2">
                        <span
                            className="font-medium text-sm truncate cursor-pointer hover:underline hover:text-primary transition-colors"
                            onClick={(e) => openEditModal('details', e)}
                        >
                            <HighlightText text={node.title} highlight={searchTerm || ''} />
                        </span>
                    </div>
                    {node.description && (
                        <p className="text-xs text-muted-foreground truncate">
                            <HighlightText text={node.description} highlight={searchTerm || ''} />
                        </p>
                    )}
                    <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground mt-1 items-center">
                        <div className={cn("flex gap-2 items-center", dateMismatch && "text-red-500")}>
                            <span>{node.startDate ? new Date(node.startDate).toLocaleDateString() : 'No start'}</span>
                            <span>-</span>
                            <span>{node.endDate ? new Date(node.endDate).toLocaleDateString() : 'No end'}</span>
                            {dateMismatch && (
                                <Tooltip content={`Warning: Task "${dateMismatch.title}" ends after KR end date`}>
                                    <div className="text-red-500 ml-1 cursor-help">
                                        <AlertCircle className="h-3 w-3" />
                                    </div>
                                </Tooltip>
                            )}
                        </div>
                        {node.type === 'TASK' && (
                            <>
                                <div className="hidden sm:block w-px h-3 bg-border"></div>
                                <div className="flex items-center gap-1" title="Estimated Hours">
                                    <Clock className="h-3 w-3" />
                                    <span>{node.estimatedHours ? `${node.estimatedHours}h` : '-'}</span>
                                </div>
                            </>
                        )}
                        {(node.type === 'OBJECTIVE' || node.type === 'KEY_RESULT' || node.type === 'TASK') && (
                            <>
                                <div className="hidden sm:block w-px h-3 bg-border"></div>
                                <div className="flex gap-2">
                                    <span className={cn("px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300", !node.teamName && "text-muted-foreground bg-muted")}>
                                        {node.teamName || 'No Team'}
                                    </span>
                                    <span className={cn("px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300", !node.ownerName && "text-muted-foreground bg-muted")}>
                                        {node.ownerName || 'Unassigned'}
                                    </span>
                                </div>
                            </>
                        )}

                        {/* Risk Status Badge (Only for Objectives) */}
                        {node.type === 'OBJECTIVE' && node.risk_status && (
                            <>
                                <div className="hidden sm:block w-px h-3 bg-border"></div>
                                <div className={cn(
                                    "flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider",
                                    node.risk_status === 'On Track' ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" :
                                        node.risk_status === 'At Risk' ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300" :
                                            "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300"
                                )}>
                                    <AlertTriangle className="w-3 h-3" />
                                    <span>{node.risk_status}</span>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Achievement Gauge - For GOAL and OBJECTIVE */}
                {(node.type === 'GOAL' || node.type === 'OBJECTIVE') && (
                    <div className="mr-6 flex items-center gap-2" title={`${node.type === 'GOAL' ? 'Goal' : 'Objective'} Achievement (Outcome Rollup)`}>
                        <div className="relative w-12 h-6 flex items-end justify-center overflow-hidden">
                            {(() => {
                                // Recursive Achievement Calculation
                                const calculateAchievement = (targetNode: OKRNode): number => {
                                    // Base Case: KEY_RESULT
                                    if (targetNode.type === 'KEY_RESULT') {
                                        if (targetNode.metricType === 'value' && targetNode.metricTarget !== undefined && targetNode.metricStart !== undefined) {
                                            const start = targetNode.metricStart;
                                            const target = targetNode.metricTarget;
                                            const current = targetNode.currentValue ?? start;
                                            const range = target - start;
                                            if (range === 0) return 0;
                                            return Math.max(0, Math.min(100, ((current - start) / range) * 100));
                                        }
                                        return targetNode.progress; // Fallback
                                    }

                                    // Recursive Case: GOAL or OBJECTIVE
                                    // Find children of this specific targetNode using storeNodes to count ALL children
                                    const targetChildren = storeNodes.filter((n: OKRNode) => n.parentId === targetNode.id);

                                    // Filter relevant children types
                                    const relevantChildren = targetNode.type === 'GOAL'
                                        ? targetChildren.filter((c: OKRNode) => c.type === 'OBJECTIVE')
                                        : targetChildren.filter((c: OKRNode) => c.type === 'KEY_RESULT');

                                    if (relevantChildren.length === 0) return 0;

                                    const totalPct = relevantChildren.reduce((acc: number, child: OKRNode) => acc + calculateAchievement(child), 0);
                                    return totalPct / relevantChildren.length;
                                };

                                const achievement = Math.round(calculateAchievement(node));

                                // Color based on score (Purple for in-progress, Green for 100%)
                                const strokeColor = achievement >= 100 ? '#22c55e' : '#a855f7'; // green-500 : purple-500

                                return (
                                    <>
                                        {/* Background Arc */}
                                        <svg viewBox="0 0 100 50" className="w-full h-full">
                                            {/* Track - Muted/Secondary color for consistency */}
                                            <path d="M 10 50 A 40 40 0 0 1 90 50" fill="none" className="stroke-muted dark:stroke-gray-700" strokeWidth="12" />
                                            {/* Progress Arc */}
                                            <path
                                                d="M 10 50 A 40 40 0 0 1 90 50"
                                                fill="none"
                                                stroke={strokeColor}
                                                strokeWidth="12"
                                                strokeDasharray="126"
                                                strokeDashoffset={126 - (126 * achievement) / 100}
                                                className="transition-all duration-1000 ease-out"
                                            />
                                        </svg>
                                        <span className="absolute bottom-0 text-[8px] font-bold text-muted-foreground leading-none mb-1">
                                            {achievement}%
                                        </span>
                                    </>
                                );
                            })()}
                        </div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-tight w-6 text-center leading-3">
                            {node.type === 'GOAL' ? 'OBJ' : 'KR'}
                        </span>
                    </div>
                )}

                <div className="flex items-center gap-2 text-xs text-muted-foreground mr-4 min-w-[160px] justify-end">
                    {/* Unread Indicator - Click to open Discussion */}
                    {node.unread && (
                        <div
                            className="flex items-center text-red-500 mr-2 animate-pulse cursor-pointer hover:scale-110 transition-transform"
                            title="Unread comments - Click to view"
                            onClick={(e) => openEditModal('discussion', e)}
                        >
                            <MessageCircle className="h-4 w-4 fill-red-500/20" />
                        </div>
                    )}

                    {/* KR Value Display - Start | Current | Target */}
                    {node.type === 'KEY_RESULT' && node.metricType === 'value' && (
                        <div className="flex flex-col items-center mr-3">
                            <div className="flex items-center gap-3 px-2 py-1 bg-muted/50 rounded-md border border-border/50 text-xs">
                                {/* Start */}
                                <div className="flex items-center gap-1 text-muted-foreground/70" title="Start Value">
                                    <PlayCircle className="h-3 w-3" />
                                    <span>{node.metricStart ?? 0}</span>
                                </div>
                                <span className="text-border">|</span>
                                {/* Current */}
                                <div className="flex items-center gap-1 font-medium text-foreground" title="Current Value">
                                    {node.metricAsc === false ? (
                                        <TrendingDown className="h-3 w-3 text-red-500/70" />
                                    ) : (
                                        <TrendingUp className="h-3 w-3 text-green-500/70" />
                                    )}
                                    <span>{node.currentValue ?? node.metricStart ?? 0}</span>
                                </div>
                                <span className="text-border">|</span>
                                {/* Target */}
                                <div className="flex items-center gap-1 text-muted-foreground" title="Target Value">
                                    <Target className="h-3 w-3" />
                                    <span>{node.metricTarget}</span>
                                </div>
                            </div>
                            {/* Unit Label */}
                            {node.metricUnit && (
                                <span className="text-[10px] text-muted-foreground mt-0.5">
                                    {node.metricUnit}
                                </span>
                            )}
                        </div>
                    )}

                    {/* Metric Icon & Tooltip (Task Rollup Progress) */}
                    <div className="flex items-center" title={`${node.progress}% Tasks Completed`}>
                        {node.type === 'TASK' && (
                            <>
                                {node.metricType === 'percentage' && <Percent className="h-3 w-3 mr-1 text-muted-foreground/70" />}
                                {node.metricType === 'value' && <Hash className="h-3 w-3 mr-1 text-muted-foreground/70" />}
                                {(!node.metricType || node.metricType === 'boolean') && <CheckCircle2 className="h-3 w-3 mr-1 text-muted-foreground/70" />}
                                {node.metricType === 'checklist' && <ListChecks className="h-3 w-3 mr-1 text-muted-foreground/70" />}
                            </>
                        )}
                        {/* For KRs, show a specific icon regarding rollup? Or just the bar? */}
                        {node.type === 'KEY_RESULT' && (
                            <ListChecks className="h-3 w-3 mr-1 text-muted-foreground/70" />
                        )}

                        <div className="w-24 h-2 bg-secondary dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className={cn(
                                    "h-full transition-all",
                                    node.progress === 100 ? "bg-green-500" : "bg-primary"
                                )}
                                style={{ width: `${node.progress}%` }}
                            />
                        </div>
                    </div>
                    <span className="w-8 text-right font-medium">{Math.round(node.progress)}%</span>
                </div>

                <div className="flex items-center gap-1 relative">
                    {/* Focus Toggle */}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setFocusedNodeId(focusedNodeId === node.id ? null : node.id);
                        }}
                        className={cn(
                            "p-1.5 rounded-md transition-all",
                            focusedNodeId === node.id
                                ? "text-blue-600 bg-blue-50 hover:bg-blue-100 opacity-100"
                                : "text-muted-foreground hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100"
                        )}
                        title={focusedNodeId === node.id ? "Unfocus" : "Focus on this goal"}
                    >
                        {focusedNodeId === node.id ? <Minimize2 className="h-4 w-4" /> : <Crosshair className="h-4 w-4" />}
                    </button>

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
                                {node.type !== 'TASK' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); setIsMenuOpen(false); }}
                                        className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                    >
                                        <CornerDownRight className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Add Child Node
                                    </button>
                                )}
                                <button
                                    onClick={(e) => openEditModal('details', e)}
                                    className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                >
                                    <Edit2 className="mr-2 h-4 w-4 text-muted-foreground" />
                                    Edit Details
                                </button>
                                {(node.type === 'KEY_RESULT' || node.type === 'TASK') && (
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

            {
                node.expanded && hasChildren && (
                    <div className="flex flex-col">
                        {children.map(child => (
                            <OKRNodeItem key={child.id} node={child} level={level + 1} nodes={effectiveNodes} searchTerm={searchTerm} />
                        ))}
                    </div>
                )
            }

            {/* Modals placed here for context access to 'node' */}

            <Drawer
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
            </Drawer>

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
                title="Delete OKR"
                description={`Are you sure you want to delete "${node.title}"? This action cannot be undone.`}
                confirmLabel="Delete"
            />
        </div >
    );
}

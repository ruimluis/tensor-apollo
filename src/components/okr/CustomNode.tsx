import { memo, useState } from 'react';
import { Handle, Position } from 'reactflow';
import { OKRNode, NODE_COLORS, NODE_LABELS } from '@/types';
import { cn } from '@/lib/utils';
import { MoreHorizontal, CornerDownRight, Edit2, Trash2 } from 'lucide-react';
import { useOKRStore } from '@/store/useOKRStore';
import { Drawer } from '@/components/ui/Drawer';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { CreateOKRForm } from '@/components/okr/CreateOKRForm';

interface CustomNodeProps {
    data: OKRNode;
}

const CustomNode = ({ data }: CustomNodeProps) => {
    const { deleteNode } = useOKRStore();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const handleDeleteClick = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsMenuOpen(false);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        deleteNode(data.id);
    };

    return (
        // Remove overflow-hidden so dropdown can pop out
        <div className="shadow-lg rounded-lg bg-card border border-border w-[280px] group relative">
            <Handle type="target" position={Position.Left} className="!bg-muted-foreground" />

            {/* Rounded top corners manually since parent doesn't have overflow-hidden */}
            <div className={cn("px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white flex justify-between items-center rounded-t-lg", NODE_COLORS[data.type])}>
                <span>{NODE_LABELS[data.type]}</span>
                <span>{data.progress}%</span>
            </div>

            <div className="p-3">
                <div className="font-medium text-sm line-clamp-2 mb-2" title={data.title}>
                    {data.title}
                </div>

                <div className="flex items-center justify-between mt-2">
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden mr-2">
                        <div
                            className={cn("h-full transition-all bg-primary")}
                            style={{ width: `${data.progress}%` }}
                        />
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
                                        onClick={(e) => { e.stopPropagation(); setShowCreateModal(true); setIsMenuOpen(false); }}
                                        className="flex w-full items-center px-4 py-2 text-sm text-foreground hover:bg-accent hover:text-accent-foreground text-left"
                                    >
                                        <CornerDownRight className="mr-2 h-4 w-4 text-muted-foreground" />
                                        Add Child
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

                {/* Footer Metadata */}
                <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-[10px] text-muted-foreground">
                    <div className="flex gap-2">
                        <span>{data.startDate ? new Date(data.startDate).toLocaleDateString() : 'No start date'}</span>
                        <span>-</span>
                        <span>{data.endDate ? new Date(data.endDate).toLocaleDateString() : 'No end date'}</span>
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
        </div>
    );
};

export default memo(CustomNode);

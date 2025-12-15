import React, { useState, useEffect } from 'react';
import { OKRType, OKRNode } from '@/types';
import { useOKRStore } from '@/store/useOKRStore';
import { Loader2 } from 'lucide-react';

interface CreateOKRModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Partial<OKRNode>;
    parentType?: OKRType | null;
    defaultType?: OKRType;
}

// Map parent type to allowed child types
const getChildType = (parentType?: OKRType | null): OKRType => {
    if (!parentType) return 'GOAL';
    if (parentType === 'GOAL') return 'OBJECTIVE';
    if (parentType === 'OBJECTIVE') return 'KEY_RESULT';
    if (parentType === 'KEY_RESULT') return 'TASK';
    return 'TASK';
};

export function CreateOKRForm({ isOpen, onClose, initialData, parentType, defaultType }: CreateOKRModalProps) {
    const { addNode, updateNode } = useOKRStore();
    const [loading, setLoading] = useState(false);

    const targetType = defaultType || getChildType(parentType);
    const isEditing = !!initialData?.id;

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: targetType,
        status: 'pending',
        progress: 0,
        parentId: initialData?.parentId || null,
    });

    useEffect(() => {
        if (isOpen) {
            setFormData({
                title: initialData?.title || '',
                description: initialData?.description || '',
                type: initialData?.type || targetType,
                status: initialData?.status || 'pending',
                progress: initialData?.progress || 0,
                parentId: initialData?.parentId || null,
            });
        }
    }, [isOpen, initialData, targetType]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing && initialData?.id) {
                await updateNode(initialData.id, formData as any);
            } else {
                await addNode(formData as any);
            }
            onClose();
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Type
                </label>
                <input
                    type="text"
                    disabled
                    value={formData.type}
                    className="w-full rounded-md border border-border bg-muted px-3 py-2 text-sm text-muted-foreground"
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                    Title
                </label>
                <input
                    required
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    placeholder={`Enter ${formData.type.toLowerCase().replace('_', ' ')} title`}
                />
            </div>

            <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                    Description
                </label>
                <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                    placeholder="Optional description..."
                />
            </div>

            {/* Show Status/Progress only if editing or if it's not a top level goal (maybe?) */}
            {/* For simplicity show always */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Status
                    </label>
                    <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                        <option value="pending">Pending</option>
                        <option value="in-progress">In Progress</option>
                        <option value="completed">Completed</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-foreground mb-1">
                        Progress (%)
                    </label>
                    <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.progress}
                        onChange={(e) => setFormData({ ...formData, progress: parseInt(e.target.value) || 0 })}
                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
                <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md"
                >
                    Cancel
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
                >
                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                    {isEditing ? 'Update' : 'Create'}
                </button>
            </div>
        </form>
    );
}

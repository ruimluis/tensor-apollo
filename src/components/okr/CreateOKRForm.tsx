
import React, { useState, useEffect } from 'react';
import { OKRType, OKRNode } from '@/types';
import { useOKRStore } from '@/store/useOKRStore';
import { supabase } from '@/lib/supabase';
import { X, Calendar, User, Users, ChevronRight, CheckCircle2, AlertCircle, PlusCircle, MessageCircle, Send, Clock, Loader2, CheckSquare } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';

interface CreateOKRModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Partial<OKRNode>;
    parentType?: OKRType | null;
    defaultType?: OKRType;
    initialTab?: 'details' | 'progress' | 'discussion';
}

// Map parent type to allowed child types
const getChildType = (parentType?: OKRType | null): OKRType => {
    if (!parentType) return 'GOAL';
    if (parentType === 'GOAL') return 'OBJECTIVE';
    if (parentType === 'OBJECTIVE') return 'KEY_RESULT';
    if (parentType === 'KEY_RESULT') return 'TASK';
    return 'TASK';
};

export function CreateOKRForm({ isOpen, onClose, initialData, parentType, defaultType, initialTab = 'details' }: CreateOKRModalProps) {
    const { addNode, updateNode } = useOKRStore();
    const [loading, setLoading] = useState(false);

    const targetType = defaultType || getChildType(parentType);
    const isEditing = !!initialData?.id;

    const [teams, setTeams] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [parentDates, setParentDates] = useState<{ start: string, end: string } | null>(null);

    const [warningModal, setWarningModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
    const [hasHistory, setHasHistory] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'discussion'>('details');

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        type: targetType,
        status: 'pending',
        progress: 0,
        startDate: '',
        endDate: '',
        parentId: initialData?.parentId || null,
        teamId: initialData?.teamId || '',
        owner: initialData?.owner || '',
        metricType: (initialData?.metricType || 'boolean') as 'boolean' | 'percentage' | 'value' | 'checklist',
        metricStart: initialData?.metricStart || 0,
        metricTarget: initialData?.metricTarget || 100,
        metricUnit: initialData?.metricUnit || '',
        metricAsc: initialData?.metricAsc !== undefined ? initialData.metricAsc : true,
        checklist: initialData?.checklist || [] as { text: string; checked: boolean }[],
        estimatedHours: initialData?.estimatedHours || undefined,
    });

    // Fetch Teams and Parent Data
    useEffect(() => {
        const fetchData = async () => {
            if (isOpen) {
                // Fetch Teams
                const { data: teamsData } = await supabase.from('teams').select('*');
                if (teamsData) setTeams(teamsData);

                // Fetch Parent if exists to get date constraints and team inheritance
                if (initialData?.parentId) {
                    const { data: parent } = await supabase
                        .from('okrs')
                        .select('start_date, end_date, team_id')
                        .eq('id', initialData.parentId)
                        .single();

                    if (parent) {
                        setParentDates({
                            start: parent.start_date ? new Date(parent.start_date).toISOString().split('T')[0] : '',
                            end: parent.end_date ? new Date(parent.end_date).toISOString().split('T')[0] : ''
                        });

                        // Inherit Team for Key Results AND Tasks
                        if ((targetType === 'KEY_RESULT' || targetType === 'TASK') && !isEditing && parent.team_id) {
                            setFormData(prev => ({ ...prev, teamId: parent.team_id }));
                        }
                    }
                }
            }
        };
        fetchData();
    }, [isOpen, initialData?.parentId, targetType, isEditing]);

    // Fetch Team Members when Team changes
    useEffect(() => {
        const fetchMembers = async () => {
            if (formData.teamId) {
                const { data: members } = await supabase
                    .from('team_members')
                    .select('user_id, profiles(full_name)')
                    .eq('team_id', formData.teamId);

                if (members) {
                    setTeamMembers(members.map((m: any) => ({
                        id: m.user_id,
                        name: m.profiles.full_name
                    })));
                }
            } else {
                setTeamMembers([]);
            }
        };
        fetchMembers();
        fetchMembers();
    }, [formData.teamId]);

    // Check for history to lock Metric Type
    useEffect(() => {
        const checkHistory = async () => {
            if (isOpen && isEditing && initialData?.id && (targetType === 'TASK' || targetType === 'KEY_RESULT')) {
                const { count } = await supabase
                    .from('okr_updates')
                    .select('*', { count: 'exact', head: true })
                    .eq('okr_id', initialData.id);

                setHasHistory(!!count && count > 0);
            } else {
                setHasHistory(false);
            }
        };
        checkHistory();
    }, [isOpen, isEditing, initialData?.id, targetType]);

    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
            setFormData({
                title: initialData?.title || '',
                description: initialData?.description || '',
                type: initialData?.type || targetType,
                status: initialData?.status || 'pending',
                progress: initialData?.progress || 0,
                startDate: initialData?.startDate ? new Date(initialData.startDate).toISOString().split('T')[0] : '',
                endDate: initialData?.endDate ? new Date(initialData.endDate).toISOString().split('T')[0] : '',
                parentId: initialData?.parentId || null,
                teamId: initialData?.teamId || '',
                owner: initialData?.owner || '',
                metricType: initialData?.metricType || 'boolean',
                metricStart: initialData?.metricStart || 0,
                metricTarget: initialData?.metricTarget || 100,
                metricUnit: initialData?.metricUnit || '',
                metricAsc: initialData?.metricAsc !== undefined ? initialData.metricAsc : true,
                checklist: initialData?.checklist || [],
                estimatedHours: initialData?.estimatedHours || undefined,
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialTab]); // Added initialTab dependency

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation for Value Metric
        // Validation for Value Metric
        if ((formData.type === 'TASK' || formData.type === 'KEY_RESULT') && formData.metricType === 'value') {
            if (formData.metricAsc && formData.metricStart >= formData.metricTarget) {
                setWarningModal({
                    isOpen: true,
                    message: "For Ascending metrics, Start Value must be strictly less than Target Value."
                });
                return;
            }
            if (!formData.metricAsc && formData.metricStart <= formData.metricTarget) {
                setWarningModal({
                    isOpen: true,
                    message: "For Descending metrics, Start Value must be strictly greater than Target Value."
                });
                return;
            }
        }

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
        <div className="flex flex-col h-full">
            {/* Tabs Header - Only show if editing an existing node */}
            {isEditing && (
                <div className="flex items-center gap-6 border-b border-border mb-6 px-1">
                    <button
                        type="button"
                        onClick={() => setActiveTab('details')}
                        className={`py-2 text-sm font-medium border-b-2 transition-colors hover:text-foreground ${activeTab === 'details'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground'
                            } `}
                    >
                        Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('progress')}
                        className={`py-2 text-sm font-medium border-b-2 transition-colors hover:text-foreground ${activeTab === 'progress'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground'
                            } `}
                    >
                        Update Progress
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('discussion')}
                        className={`py-2 text-sm font-medium border-b-2 transition-colors hover:text-foreground ${activeTab === 'discussion'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground'
                            } `}
                    >
                        Discussion
                    </button>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 flex-1 overflow-y-auto pr-1">
                {activeTab === 'details' ? (
                    <>
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

                        {/* Metric Configuration - For TASK and KEY_RESULT */}
                        {(formData.type === 'TASK' || formData.type === 'KEY_RESULT') && (
                            <div className="space-y-4 border-t border-border pt-4 mt-4">
                                {formData.type === 'TASK' && (
                                    <div>
                                        <label className="block text-sm font-medium text-foreground mb-1">
                                            Progress Metric
                                        </label>
                                        <select
                                            value={formData.metricType}
                                            onChange={(e) => setFormData({ ...formData, metricType: e.target.value as any })}
                                            disabled={hasHistory}
                                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-muted"
                                        >
                                            <option value="boolean">Done / Not Done (0% or 100%)</option>
                                            <option value="percentage">Percentage (0-100%)</option>
                                            <option value="value">Value (Start -&gt; Target)</option>
                                            <option value="checklist">Checklist (Items Completed)</option>
                                        </select>
                                        {hasHistory && (
                                            <p className="text-[10px] text-muted-foreground mt-1">
                                                Metric type cannot be changed because progress has already been logged.
                                            </p>
                                        )}
                                    </div>
                                )}

                                {/* KEY_RESULT always uses 'value' logic implicitly for inputs, though strictly it's a separate field concept */}
                                {/* We force 'value' rendering for KEY_RESULT */}
                                {(formData.metricType === 'value' || formData.type === 'KEY_RESULT') && (
                                    <div className="grid grid-cols-3 gap-3 bg-muted/30 p-3 rounded-md border border-border/50">
                                        <div className="col-span-3 mb-1">
                                            <p className="text-xs font-semibold text-foreground uppercase tracking-wider">
                                                {formData.type === 'KEY_RESULT' ? 'Key Result Targets' : 'Value Configuration'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Start Value</label>
                                            <input
                                                type="number"
                                                value={formData.metricStart}
                                                onChange={(e) => setFormData({ ...formData, metricStart: Number(e.target.value), metricType: 'value' })}
                                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Target Value</label>
                                            <input
                                                type="number"
                                                value={formData.metricTarget}
                                                onChange={(e) => setFormData({ ...formData, metricTarget: Number(e.target.value), metricType: 'value' })}
                                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Unit Label</label>
                                            <input
                                                type="text"
                                                placeholder="e.g. $, km, users"
                                                value={formData.metricUnit}
                                                onChange={(e) => setFormData({ ...formData, metricUnit: e.target.value, metricType: 'value' })}
                                                className="w-full rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                                            />
                                        </div>
                                        <div className="col-span-3">
                                            <label className="block text-xs font-medium text-muted-foreground mb-1">Direction</label>
                                            <div className="flex gap-4">
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="radio"
                                                        name="metricAsc"
                                                        checked={formData.metricAsc === true}
                                                        onChange={() => setFormData({ ...formData, metricAsc: true, metricType: 'value' })}
                                                        className="text-primary focus:ring-primary"
                                                    />
                                                    Ascending (Start &lt; Target)
                                                </label>
                                                <label className="flex items-center gap-2 text-sm">
                                                    <input
                                                        type="radio"
                                                        name="metricAsc"
                                                        checked={formData.metricAsc === false}
                                                        onChange={() => setFormData({ ...formData, metricAsc: false, metricType: 'value' })}
                                                        className="text-primary focus:ring-primary"
                                                    />
                                                    Descending (Start &gt; Target)
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {formData.metricType === 'checklist' && formData.type !== 'KEY_RESULT' && (
                                    <div className="bg-muted/30 p-3 rounded-md border border-border/50">
                                        <label className="block text-xs font-medium text-muted-foreground mb-2">Checklist Items</label>
                                        <div className="space-y-2">
                                            {formData.checklist.map((item, index) => (
                                                <div key={index} className="flex gap-2">
                                                    <input
                                                        type="text"
                                                        value={item.text}
                                                        onChange={(e) => {
                                                            const newChecklist = [...formData.checklist];
                                                            newChecklist[index].text = e.target.value;
                                                            setFormData({ ...formData, checklist: newChecklist });
                                                        }}
                                                        className="flex-1 rounded-md border border-border bg-background px-2 py-1.5 text-sm"
                                                        placeholder="Item description"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            const newChecklist = formData.checklist.filter((_, i) => i !== index);
                                                            setFormData({ ...formData, checklist: newChecklist });
                                                        }}
                                                        className="px-2 text-muted-foreground hover:text-red-500"
                                                    >
                                                        &times;
                                                    </button>
                                                </div>
                                            ))}
                                            <button
                                                type="button"
                                                onClick={() => setFormData({
                                                    ...formData,
                                                    checklist: [...formData.checklist, { text: '', checked: false }]
                                                })}
                                                className="text-xs text-primary hover:underline font-medium"
                                            >
                                                + Add Item
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Status Field only - Progress is rolled up. Hide for everything except GOAL. */}
                        {formData.type === 'GOAL' && (
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
                        )}

                        {/* Team and Owner Selection - For OBJECTIVE, KEY_RESULT, and TASK */}
                        {(formData.type === 'OBJECTIVE' || formData.type === 'KEY_RESULT' || formData.type === 'TASK') && (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Team <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        required
                                        value={formData.teamId}
                                        onChange={(e) => setFormData({ ...formData, teamId: e.target.value, owner: '' })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:bg-muted"
                                        disabled={formData.type === 'KEY_RESULT' || formData.type === 'TASK'} // Disabled for Key Results and Tasks (Inherited)
                                    >
                                        <option value="">Select Team</option>
                                        {teams.map(t => (
                                            <option key={t.id} value={t.id}>{t.name}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-foreground mb-1">
                                        Owner (Optional)
                                    </label>
                                    <select
                                        value={formData.owner}
                                        onChange={(e) => setFormData({ ...formData, owner: e.target.value })}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                        disabled={!formData.teamId}
                                    >
                                        <option value="">Select Owner</option>
                                        {teamMembers.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.startDate}
                                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                    className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                                    min={parentDates?.start}
                                    max={parentDates?.end}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    End Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        min={formData.startDate || parentDates?.start}
                                        max={parentDates?.end}
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        {/* Estimated Hours - Only for TASK */}
                        {formData.type === 'TASK' && (
                            <div>
                                <label className="block text-sm font-medium text-foreground mb-1">
                                    Estimated Hours
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.5"
                                        placeholder="e.g. 4"
                                        value={formData.estimatedHours || ''}
                                        onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value ? Number(e.target.value) : undefined })}
                                        className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                    />
                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        )}

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

                        <ConfirmationModal
                            isOpen={warningModal.isOpen}
                            onClose={() => setWarningModal({ ...warningModal, isOpen: false })}
                            onConfirm={() => setWarningModal({ ...warningModal, isOpen: false })}
                            title="Invalid Metric Values"
                            description={warningModal.message}
                            confirmLabel="Got it"
                            cancelLabel=""
                            variant="warning"
                        />
                    </>
                ) : activeTab === 'discussion' ? (
                    <DiscussionTab nodeId={initialData?.id as string} />
                ) : (
                    <div className="space-y-4">
                        <CheckInForm node={initialData as OKRNode} onClose={onClose} />
                    </div>
                )}
            </form >
        </div >
    );
}

// Sub-component for Check In
function CheckInForm({ node, onClose }: { node: OKRNode, onClose: () => void }) {
    const { addCheckIn } = useOKRStore();
    const [loading, setLoading] = useState(false);
    const [checkIn, setCheckIn] = useState({
        date: new Date().toISOString().split('T')[0],
        value: node.currentValue || node.metricStart || 0,
        progress: node.progress || 0,
        comment: '',
        checklist: node.checklist ? [...node.checklist] : undefined
    });
    const [history, setHistory] = useState<any[]>([]);

    // Fetch History
    useEffect(() => {
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('okr_updates')
                .select('*, profiles(avatar_url, full_name)')
                .eq('okr_id', node.id)
                .order('checkin_date', { ascending: false });
            if (data) setHistory(data);
        };
        fetchHistory();
    }, [node.id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await addCheckIn(node.id, checkIn);
            onClose();
        } catch (error: any) {
            console.error("Check-in failed:", error);
            alert(`Failed to add check -in: ${error.message || error.details || 'Unknown error'} `);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-muted/30 p-4 rounded-lg border border-border">
                <h4 className="font-medium text-sm mb-3">New Check-in</h4>
                <div className="space-y-3">
                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Date</label>
                        <input
                            type="date"
                            value={checkIn.date}
                            onChange={(e) => setCheckIn({ ...checkIn, date: e.target.value })}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                        />
                    </div>

                    {/* Dynamic Input based on Metric Type */}
                    <div className="bg-background rounded-md border border-border p-3">
                        <label className="block text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wider">
                            {node.metricType === 'checklist' ? 'Update Checklist' : 'New Value'}
                        </label>

                        {/* Boolean: Done / Not Done */}
                        {(!node.metricType || node.metricType === 'boolean') && (
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setCheckIn({ ...checkIn, progress: 0, value: 0 })}
                                    className={`flex - 1 py - 2 px - 4 rounded - md text - sm font - medium border transition - colors ${checkIn.progress === 0
                                        ? 'bg-muted text-foreground border-primary'
                                        : 'bg-transparent border-border hover:bg-muted/50'
                                        } `}
                                >
                                    Not Done
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setCheckIn({ ...checkIn, progress: 100, value: 1 })}
                                    className={`flex - 1 py - 2 px - 4 rounded - md text - sm font - medium border transition - colors ${checkIn.progress === 100
                                        ? 'bg-green-100 text-green-700 border-green-500 dark:bg-green-900/30 dark:text-green-400'
                                        : 'bg-transparent border-border hover:bg-muted/50'
                                        } `}
                                >
                                    Done
                                </button>
                            </div>
                        )}

                        {/* Percentage: Slider */}
                        {node.metricType === 'percentage' && (
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={checkIn.progress}
                                        onChange={(e) => setCheckIn({ ...checkIn, progress: Number(e.target.value), value: Number(e.target.value) })}
                                        className="flex-1 h-2 bg-secondary rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                    <span className="w-12 text-right font-medium text-lg">{Math.round(checkIn.progress)}%</span>
                                </div>
                            </div>
                        )}

                        {/* Value: Start -> Target */}
                        {node.metricType === 'value' && (
                            <div className="space-y-4">
                                <div>
                                    <div className="flex justify-between text-xs mb-2">
                                        <span>Start: {node.metricStart}</span>
                                        <span>Target: {node.metricTarget}</span>
                                    </div>
                                    <input
                                        type="number"
                                        value={checkIn.value}
                                        onChange={(e) => {
                                            const val = Number(e.target.value);

                                            // For KEY_RESULT, we DO NOT update progress based on value.
                                            // Progress is strictly rolled up from tasks.
                                            if (node.type === 'KEY_RESULT') {
                                                setCheckIn({ ...checkIn, value: val });
                                                return;
                                            }

                                            // For TASK, we calculate progress automatically
                                            const start = node.metricStart || 0;
                                            const target = node.metricTarget || 100;
                                            const range = target - start;
                                            let newProgress = 0;
                                            if (range !== 0) {
                                                newProgress = Math.min(100, Math.max(0, ((val - start) / range) * 100));
                                            }
                                            setCheckIn({ ...checkIn, value: val, progress: Math.round(newProgress) });
                                        }}
                                        className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                                        placeholder="Enter current value"
                                    />
                                    <p className="text-right text-xs mt-1 text-muted-foreground">{node.metricUnit}</p>
                                </div>
                            </div>
                        )}

                        {/* Checklist: List of Checkboxes */}
                        {node.metricType === 'checklist' && node.checklist && (
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    {(checkIn.checklist || node.checklist).map((item: any, index: number) => (
                                        <div key={index} className="flex items-start gap-3 p-2 rounded-md hover:bg-muted/50 border border-transparent hover:border-border transition-colors cursor-pointer"
                                            onClick={() => {
                                                const currentList = [...(checkIn.checklist || node.checklist || [])];
                                                if (!currentList[index]) return; // Safety check
                                                currentList[index] = { ...currentList[index], checked: !currentList[index].checked };

                                                // Calculate Progress
                                                const total = currentList.length;
                                                const checked = currentList.filter((i: any) => i.checked).length;
                                                const newProgress = total > 0 ? Math.round((checked / total) * 100) : 0;

                                                setCheckIn({
                                                    ...checkIn,
                                                    checklist: currentList,
                                                    progress: newProgress,
                                                    value: checked // Store checked count as value
                                                });
                                            }}
                                        >
                                            <div className={`mt - 0.5 flex h - 4 w - 4 shrink - 0 items - center justify - center rounded - sm border ${item.checked ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'} `}>
                                                {item.checked && <CheckSquare className="h-3 w-3" />}
                                            </div>
                                            <span className={`text - sm ${item.checked ? 'text-muted-foreground line-through' : 'text-foreground'} `}>{item.text}</span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs text-muted-foreground px-2">
                                    <span>{Math.round(checkIn.progress)}% Complete</span>
                                    <span>{checkIn.checklist?.filter((i: any) => i.checked).length || node.checklist.filter(i => i.checked).length} / {node.checklist.length} items</span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Calculated Progress Display (Hidden for Boolean/Pct as it's redundant) */}
                    {(node.metricType === 'value') && (
                        <div>
                            <label className="block text-xs font-medium text-muted-foreground mb-1">Calculated Progress</label>
                            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                                <div className="bg-primary h-full transition-all" style={{ width: `${checkIn.progress}% ` }}></div>
                            </div>
                            <div className="text-right text-xs text-muted-foreground mt-1">{Math.round(checkIn.progress)}%</div>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Comment</label>
                        <textarea
                            value={checkIn.comment}
                            onChange={(e) => setCheckIn({ ...checkIn, comment: e.target.value })}
                            className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-none"
                            rows={2}
                            placeholder="What did you accomplish?"
                        />
                    </div>

                    <button
                        onClick={handleSubmit}
                        disabled={loading}
                        type="button"
                        className="w-full py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin inline mr-2" />}
                        Save Check-in
                    </button>
                </div>
            </div>

            {/* History List */}
            <div>
                <h4 className="font-medium text-sm mb-3 text-muted-foreground">History</h4>
                <div className="space-y-3">
                    {history.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No updates yet.</p>
                    ) : (
                        history.map((update) => (
                            <div key={update.id} className="flex gap-3 text-sm border-l-2 border-border pl-3 py-1">
                                <div className="mt-0.5">
                                    {update.profiles?.avatar_url ? (
                                        <img
                                            src={update.profiles.avatar_url}
                                            alt={update.profiles.full_name || 'User'}
                                            className="w-6 h-6 rounded-full object-cover border border-border"
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px] font-bold border border-primary/20">
                                            {(update.profiles?.full_name || '?').charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex flex-col">
                                            <span className="font-medium text-xs text-foreground">{update.profiles?.full_name || 'Unknown User'}</span>
                                            <span className="text-[10px] text-muted-foreground">{new Date(update.checkin_date).toLocaleDateString()}</span>
                                        </div>
                                        <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">{update.progress_value}%</span>
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                        Value: <span className="font-medium text-foreground">{update.current_value}</span>
                                    </div>
                                    {update.comment && <p className="text-foreground mt-1 text-xs bg-muted/30 p-2 rounded-md italic">"{update.comment}"</p>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

// Sub-component for Discussion
function DiscussionTab({ nodeId }: { nodeId: string }) {
    const { fetchNodes } = useOKRStore();
    const [comments, setComments] = useState<any[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionIndex, setMentionIndex] = useState(-1);
    const [users, setUsers] = useState<any[]>([]);
    const textareaRef = React.useRef<HTMLTextAreaElement>(null);

    // Fetch Comments and Users
    useEffect(() => {
        const fetchComments = async () => {
            const { data } = await supabase
                .from('okr_comments')
                .select('*, profiles(full_name, avatar_url)')
                .eq('okr_id', nodeId)
                .order('created_at', { ascending: true });
            if (data) setComments(data);
        };

        const fetchUsers = async () => {
            const { data } = await supabase
                .from('organization_members')
                .select('user_id, profiles(full_name)');
            if (data) {
                setUsers(data.map((m: any) => ({
                    id: m.user_id,
                    name: m.profiles.full_name
                })));
            }
        };

        const markAsRead = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                await supabase.from('okr_comment_reads').upsert({
                    user_id: user.id,
                    okr_id: nodeId,
                    last_read_at: new Date().toISOString()
                });
                // Trigger global refresh to clear red dot
                fetchNodes();
            }
        };

        fetchComments();
        fetchUsers();
        markAsRead();

        // Subscribe to real-time additions
        const channel = supabase
            .channel('okr_comments')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'okr_comments', filter: `okr_id = eq.${nodeId} ` },
                () => {
                    fetchComments(); // Refetch to get profile data joined
                    markAsRead(); // Mark as read if we are looking at it
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [nodeId]); // removed fetchNodes dependency to avoid loop, it's stable from zustand usually

    const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const val = e.target.value;
        setNewComment(val);

        // Simple mention detection
        const cursorPosition = e.target.selectionStart;

        // Find last @ before cursor
        const textBeforeCursor = val.slice(0, cursorPosition);
        const lastAt = textBeforeCursor.lastIndexOf('@');

        if (lastAt !== -1 && lastAt < cursorPosition) {
            const query = textBeforeCursor.slice(lastAt + 1);
            // Check if query contains space (end of mention)
            if (!query.includes(' ')) {
                setMentionIndex(lastAt);
                setMentionQuery(query);
                return;
            }
        }
        setMentionIndex(-1);
    };

    const insertMention = (userName: string) => { // userId unused for simple text but good for metadata
        if (mentionIndex === -1) return;
        const start = newComment.slice(0, mentionIndex);
        const end = newComment.slice(mentionIndex + mentionQuery.length + 1);
        setNewComment(`${start} @${userName.replace(/\s/g, '')} ${end} `);
        setMentionIndex(-1);
        textareaRef.current?.focus();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        setLoading(true);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Map names to IDs could be done here if needed for notifications

        await supabase.from('okr_comments').insert({
            okr_id: nodeId,
            user_id: user.id,
            content: newComment,
            mentions: [] // Placeholder
        });

        // Also update read status for sender so they don't see unread
        await supabase.from('okr_comment_reads').upsert({
            user_id: user.id,
            okr_id: nodeId,
            last_read_at: new Date().toISOString()
        });
        fetchNodes();

        setNewComment('');
        setLoading(false);
    };

    const filteredUsers = mentionIndex !== -1
        ? users.filter(u => u.name.toLowerCase().replace(/\s/g, '').includes(mentionQuery.toLowerCase()))
        : [];

    return (
        <div className="flex flex-col h-full bg-muted/10 rounded-lg border border-border mt-2 p-4">
            <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2">
                {comments.length === 0 ? (
                    <div className="text-center text-muted-foreground text-sm py-8 opacity-60">
                        No comments yet. Start the conversation!
                    </div>
                ) : (
                    comments.map(c => (
                        <div key={c.id} className="flex gap-3 text-sm group">
                            <div className="mt-0.5 shrink-0">
                                {c.profiles?.avatar_url ? (
                                    <img src={c.profiles.avatar_url} className="w-8 h-8 rounded-full object-cover shadow-sm" />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs font-bold text-primary border border-primary/20">
                                        {(c.profiles?.full_name || '?').charAt(0)}
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 min-w-0 bg-background border border-border/50 rounded-lg p-3 relative shadow-sm">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold text-xs text-foreground">{c.profiles?.full_name}</span>
                                    <span className="text-[10px] text-muted-foreground">{new Date(c.created_at).toLocaleString()}</span>
                                </div>
                                <p className="text-foreground whitespace-pre-wrap break-words text-sm leading-relaxed">{c.content}</p>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="relative">
                {/* Mention Popup */}
                {mentionIndex !== -1 && filteredUsers.length > 0 && (
                    <div className="absolute bottom-full left-0 mb-2 w-48 bg-popover border border-border rounded-md shadow-lg max-h-40 overflow-y-auto z-50 animate-in fade-in zoom-in-95 duration-100">
                        {filteredUsers.map(u => (
                            <button
                                key={u.id}
                                type="button"
                                onClick={() => insertMention(u.name)}
                                className="w-full text-left px-3 py-2 text-sm hover:bg-muted text-foreground transition-colors"
                            >
                                {u.name}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex gap-2 items-end bg-background p-2 rounded-lg border border-border focus-within:ring-2 focus-within:ring-primary/20 transition-all shadow-sm">
                    <textarea
                        ref={textareaRef}
                        value={newComment}
                        onChange={handleInput}
                        placeholder="Type a message... Use @ to mention team members"
                        className="flex-1 bg-transparent border-none focus:ring-0 resize-none text-sm max-h-24 py-1.5 px-1 placeholder:text-muted-foreground/60"
                        rows={1}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSubmit(e);
                            }
                        }}
                    />
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !newComment.trim()}
                        type="button"
                        className="p-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50 hover:bg-primary/90 transition-colors shadow-sm"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                    </button>
                </div>
            </div>
        </div>
    );
}

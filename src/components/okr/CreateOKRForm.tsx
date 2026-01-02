
import React, { useState, useEffect } from 'react';
import { OKRType, OKRNode } from '@/types';
import { useOKRStore } from '@/store/useOKRStore';
import { supabase } from '@/lib/supabase';
import { Calendar, Clock, Loader2, CheckSquare, Sparkles, AlertTriangle, RefreshCw, Zap, Printer, ChevronRight } from 'lucide-react';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { cn } from '@/lib/utils';

interface CreateOKRModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: Partial<OKRNode>;
    parentType?: OKRType | null;
    defaultType?: OKRType;
    initialTab?: 'details' | 'progress' | 'discussion' | 'ai';
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
    const { addNode, updateNode, updateTaskDependencies, nodes } = useOKRStore();
    const [loading, setLoading] = useState(false);

    const targetType = defaultType || getChildType(parentType);
    const isEditing = !!initialData?.id;

    const [teams, setTeams] = useState<any[]>([]);
    const [teamMembers, setTeamMembers] = useState<any[]>([]);
    const [parentDates, setParentDates] = useState<{ start: string, end: string } | null>(null);

    const [warningModal, setWarningModal] = useState<{ isOpen: boolean; message: string }>({ isOpen: false, message: '' });
    const [hasHistory, setHasHistory] = useState(false);
    const [activeTab, setActiveTab] = useState<'details' | 'progress' | 'discussion' | 'ai'>('details');

    const [formData, setFormData] = useState<{
        title: string;
        description: string;
        type: OKRType;
        status: string;
        progress: number;
        startDate: string;
        endDate: string;
        parentId: string | null;
        teamId: string;
        owner: string;
        metricType: 'boolean' | 'percentage' | 'value' | 'checklist';
        metricStart: number;
        metricTarget: number;
        metricUnit: string;
        metricAsc: boolean;
        checklist: { text: string; checked: boolean }[];
        estimatedHours: number | undefined | null;
        dependencies: string[];
    }>({
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
        dependencies: initialData?.dependencies || [],
    });

    const [isDepsOpen, setIsDepsOpen] = useState(false);
    const [depSearchTerm, setDepSearchTerm] = useState('');

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
                dependencies: initialData?.dependencies || [],
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, initialTab]); // Added initialTab dependency

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

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

        // VALIDATION: Task Dependencies
        if (formData.type === 'TASK' && formData.dependencies.length > 0 && formData.startDate) {
            const taskStart = new Date(formData.startDate).getTime();
            const confusingDeps = nodes.filter(n => formData.dependencies.includes(n.id) && n.endDate);

            for (const dep of confusingDeps) {
                // Dependency End Date is INCLUSIVE. Start Date can be AFTER Dependency End Date.
                // Logic: Task Start Date >= Dependency End Date ?? 
                // Usually Task Start must be > Dependency End. Or >=?
                // Let's assume strict succession: Start > End.
                // Wait, if dependency ends at 5PM today, can I start at 9AM today? No.
                // If dependency ends Today, can I start Today? Maybe. 
                // Let's assert: Task Start Date must be >= Dependency End Date.
                // Actually, standard is: Start Date >= Dependency's End Date.
                // If checking only dates (no time), then Start Date >= End Date is fine?
                // If Dep ends 2024-01-01. I start 2024-01-01. This implies concurrent work on that day?
                // Or I can pick up immediately.
                // Let's enforce: Task Start >= Dependency End.
                // If Task Start < Dependency End, ERROR.

                // Note: date input values are YYYY-MM-DD.
                // new Date('2024-01-01').getTime() is UTC midnight.
                const depEnd = new Date(dep.endDate!).getTime();

                if (taskStart < depEnd) {
                    setWarningModal({
                        isOpen: true,
                        message: `Dependency Violation: This task starts on ${formData.startDate}, but dependency "${dep.title}" ends on ${dep.endDate}. Tasks cannot start before their dependencies finish.`
                    });
                    return;
                }
            }
        }

        setLoading(true);

        try {
            // Find owner name for optimistic UI update
            const ownerMember = teamMembers.find(m => m.id === formData.owner);
            // Dependencies are handled separately, remove from payload if store addNode doesn't support them (it doesn't)
            const { dependencies, ...mainPayload } = formData;
            const payload = {
                ...mainPayload,
                ownerName: ownerMember?.name
            };

            let nodeId = initialData?.id;

            if (isEditing && nodeId) {
                await updateNode(nodeId, payload as any);
            } else {
                // For new nodes, we capture the created node to get its ID
                const newNode = await addNode(payload as any);
                if (newNode) nodeId = newNode.id;
            }

            // Update Dependencies (Now supports both Edit AND Create)
            if (nodeId && formData.dependencies.length > 0) {
                await updateTaskDependencies(nodeId, formData.dependencies);
            }

            onClose();
        } catch (error: any) {
            console.error(error);
            alert(`Failed to save: ${error.message || 'Unknown error'} `);
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
                        className={`py - 2 text - sm font - medium border - b - 2 transition - colors hover: text - foreground ${activeTab === 'details'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground'
                            } `}
                    >
                        Details
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('progress')}
                        className={`py - 2 text - sm font - medium border - b - 2 transition - colors hover: text - foreground ${activeTab === 'progress'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground'
                            } `}
                    >
                        Update Progress
                    </button>
                    <button
                        type="button"
                        onClick={() => setActiveTab('discussion')}
                        className={`py - 2 text - sm font - medium border - b - 2 transition - colors hover: text - foreground ${activeTab === 'discussion'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground'
                            } `}
                    >
                        Discussion
                    </button>
                    {isEditing && formData.type === 'OBJECTIVE' && (
                        <button
                            type="button"
                            onClick={() => setActiveTab('ai')}
                            className={`py - 2 text - sm font - medium border - b - 2 transition - colors hover: text - foreground ${activeTab === 'ai'
                                ? 'border-primary text-primary'
                                : 'border-transparent text-muted-foreground'
                                } `}
                        >
                            AI Agent
                        </button>
                    )}
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
                                    min={formData.type !== 'TASK' ? parentDates?.start : undefined}
                                    max={formData.type !== 'TASK' ? parentDates?.end : undefined}
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
                                        min={formData.startDate || (formData.type !== 'TASK' ? parentDates?.start : undefined)}
                                        max={formData.type !== 'TASK' ? parentDates?.end : undefined}
                                    />
                                    <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                </div>
                            </div>
                        </div>

                        {/* Estimated Hours - Only for TASK */}
                        {formData.type === 'TASK' && (
                            <div className="space-y-4">
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
                                            onChange={(e) => setFormData({ ...formData, estimatedHours: e.target.value ? Number(e.target.value) : null })}
                                            className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                                        />
                                        <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>

                                <div>
                                    <button
                                        type="button"
                                        onClick={() => setIsDepsOpen(!isDepsOpen)}
                                        className="flex items-center justify-between w-full text-sm font-medium text-foreground mb-1 hover:bg-muted/50 p-1 rounded"
                                    >
                                        <span>Dependencies (Blockers)</span>
                                        <span className="text-xs text-muted-foreground">{formData.dependencies.length} selected {isDepsOpen ? '▲' : '▼'}</span>
                                    </button>

                                    {isDepsOpen && (
                                        <div className="space-y-2 animate-in slide-in-from-top-1 duration-200">
                                            <input
                                                type="text"
                                                placeholder="Search tasks..."
                                                value={depSearchTerm}
                                                onChange={(e) => setDepSearchTerm(e.target.value)}
                                                className="w-full text-xs px-2 py-1.5 rounded-md border border-border bg-background focus:outline-none focus:ring-1 focus:ring-primary"
                                            />
                                            <div className="border border-border rounded-md p-2 bg-background max-h-40 overflow-y-auto">
                                                {nodes
                                                    .filter(n =>
                                                        n.type === 'TASK' &&
                                                        n.id !== initialData?.id && // Cannot depend on self
                                                        (depSearchTerm === '' || n.title.toLowerCase().includes(depSearchTerm.toLowerCase()))
                                                    )
                                                    .map(task => (
                                                        <div key={task.id} className="flex items-center gap-2 py-1">
                                                            <input
                                                                type="checkbox"
                                                                id={`dep - ${task.id} `}
                                                                checked={formData.dependencies.includes(task.id)}
                                                                onChange={(e) => {
                                                                    const isChecked = e.target.checked;
                                                                    setFormData(prev => ({
                                                                        ...prev,
                                                                        dependencies: isChecked
                                                                            ? [...prev.dependencies, task.id]
                                                                            : prev.dependencies.filter(id => id !== task.id)
                                                                    }));
                                                                }}
                                                                className="rounded border-gray-300 text-primary focus:ring-primary"
                                                            />
                                                            <label htmlFor={`dep - ${task.id} `} className="text-sm cursor-pointer flex-1 truncate select-none">
                                                                {task.title}
                                                                {task.endDate && <span className="text-muted-foreground text-xs ml-2">(Ends {new Date(task.endDate).toLocaleDateString()})</span>}
                                                            </label>
                                                        </div>
                                                    ))
                                                }
                                                {nodes.filter(n => n.type === 'TASK' && n.id !== initialData?.id && (depSearchTerm === '' || n.title.toLowerCase().includes(depSearchTerm.toLowerCase()))).length === 0 && (
                                                    <p className="text-xs text-muted-foreground p-1">No tasks found.</p>
                                                )}
                                            </div>
                                            <p className="text-[10px] text-muted-foreground">This task cannot start until selected tasks are finished.</p>
                                        </div>
                                    )}
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
                ) : activeTab === 'ai' ? (
                    <AITab node={initialData as OKRNode} allNodes={nodes} teamMemberCount={teamMembers.length} />
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

function AITab({ node, allNodes, teamMemberCount }: { node: OKRNode, allNodes: OKRNode[], teamMemberCount: number }) {
    const { updateNode } = useOKRStore();
    const [loading, setLoading] = useState(false);
    const [reviewResult, setReviewResult] = useState<any>(null);
    const [showResult, setShowResult] = useState(false);

    // Weekly Review State
    const [weeklyReviewResult, setWeeklyReviewResult] = useState<any>(null);
    const [showWeeklyReviewResult, setShowWeeklyReviewResult] = useState(false);
    const [weeklyReviewLoading, setWeeklyReviewLoading] = useState(false);
    const [weeklyReviewHistory, setWeeklyReviewHistory] = useState<any[]>([]);
    const [isWeeklyHistoryExpanded, setIsWeeklyHistoryExpanded] = useState(false);

    // Fetch Weekly History Effect
    useEffect(() => {
        const fetchWeeklyHistory = async () => {
            const { data } = await supabase
                .from('okr_weekly_reviews')
                .select('*')
                .eq('okr_id', node.id)
                .order('created_at', { ascending: false });

            if (data) setWeeklyReviewHistory(data);
        };
        fetchWeeklyHistory();
    }, [node.id]);

    const handleViewWeeklyReview = (item: any) => {
        setWeeklyReviewResult({
            summary: item.summary,
            achievements: item.achievements,
            blockers: item.blockers,
            priorities: item.priorities,
        });
        setShowWeeklyReviewResult(true);
    };

    const [weeklyReviewDate, setWeeklyReviewDate] = useState(new Date().toISOString().split('T')[0]);

    const runWeeklyReview = async () => {
        setWeeklyReviewLoading(true);
        try {
            // 1. Gather Context
            const objectiveTitle = node.title;
            const keyResults = allNodes.filter(n => n.parentId === node.id && n.type === 'KEY_RESULT').map(kr => {
                const tasks = allNodes.filter(t => t.parentId === kr.id && t.type === 'TASK').map(t => ({
                    title: t.title,
                    status: t.status
                }));
                return {
                    title: kr.title,
                    progress: kr.progress,
                    tasks: tasks
                };
            });

            // Calculate Period
            const endDateObj = new Date(weeklyReviewDate);
            const startDateObj = new Date(endDateObj);
            startDateObj.setDate(endDateObj.getDate() - 6);

            const periodStart = startDateObj.toISOString().split('T')[0];
            const periodEnd = endDateObj.toISOString().split('T')[0];
            const currentDate = periodEnd; // Use end date as report date

            // 2. Call AI
            const { data, error } = await supabase.functions.invoke('okr-copilot', {
                body: {
                    action: 'weekly-review',
                    payload: { objectiveTitle, keyResults, currentDate, periodStart, periodEnd }
                }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setWeeklyReviewResult({ ...data.data, periodStart, periodEnd });
            setShowWeeklyReviewResult(true);

            // 3. Save to History
            const historyEntry = {
                okr_id: node.id,
                summary: data.data.summary,
                achievements: data.data.achievements,
                blockers: data.data.blockers,
                priorities: data.data.priorities,
                created_at: new Date().toISOString(),
                period_start: periodStart,
                period_end: periodEnd
            };

            const { error: insertError } = await supabase
                .from('okr_weekly_reviews')
                .insert(historyEntry);

            if (insertError) {
                console.error("Failed to save weekly review:", insertError);
                alert("Database Error: " + insertError.message);
            } else {
                setWeeklyReviewHistory(prev => [historyEntry, ...prev]);
            }

        } catch (error: any) {
            console.error("Weekly Review Failed:", error);
            alert("Failed to run weekly review: " + error.message);
        } finally {
            setWeeklyReviewLoading(false);
        }
    };

    const handlePrintWeeklyReview = () => {
        const printWindow = window.open('', '', 'height=800,width=800');
        if (printWindow && weeklyReviewResult) {
            printWindow.document.write('<html><head><title>Weekly Progress Report</title>');
            printWindow.document.write(`
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #1a202c; line-height: 1.6; }
                    h1 { font-size: 24px; font-weight: bold; margin-bottom: 20px; text-align: center; border-bottom: 2px solid #e2e8f0; padding-bottom: 15px; }
                    h2 { font-size: 14px; font-weight: bold; text-transform: uppercase; color: #718096; margin-top: 30px; margin-bottom: 10px; letter-spacing: 0.05em; }
                    .header-meta { text-align: center; color: #718096; font-size: 14px; margin-bottom: 30px; }
                    .section { background: #f8fafc; padding: 20px; border-radius: 8px; border: 1px solid #edf2f7; }
                    ul { padding-left: 20px; margin: 0; }
                    li { margin-bottom: 8px; }
                    .summary { font-size: 16px; font-style: italic; color: #2d3748; }
                </style>
            `);
            printWindow.document.write('</head><body>');
            printWindow.document.write(`
                <h1>Weekly Progress Report</h1>
                <div class="header-meta">
                    <strong>Objective:</strong> ${node.title}<br>
                    <strong>Date:</strong> ${new Date().toLocaleDateString()}
                </div>

                <h2>Executive Summary</h2>
                <div class="section summary">
                    ${weeklyReviewResult.summary}
                </div>

                <h2>Key Achievements</h2>
                <div class="section">
                    <ul>
                        ${weeklyReviewResult.achievements?.map((a: string) => `<li>${a}</li>`).join('')}
                    </ul>
                </div>

                <h2>Blockers & Risks</h2>
                <div class="section">
                    <ul>
                        ${weeklyReviewResult.blockers?.map((b: string) => `<li>${b}</li>`).join('')}
                    </ul>
                </div>

                <h2>Priorities for Next Week</h2>
                <div class="section">
                    <ul>
                        ${weeklyReviewResult.priorities?.map((p: string) => `<li>${p}</li>`).join('')}
                    </ul>
                </div>
            `);
            printWindow.document.write('</body></html>');
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => {
                printWindow.print();
                printWindow.close();
            }, 250);
        }
    };

    // Risk History
    const [riskHistory, setRiskHistory] = useState<any[]>([]);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);

    // Risk Analysis State

    const [riskResult, setRiskResult] = useState<any>(node.risk_status ? {
        status: node.risk_status,
        analysisSummary: node.risk_summary,
        riskFactors: node.risk_factors,
        recommendations: node.risk_recommendations,
        created_at: node.risk_last_updated
    } : null);
    const [showRiskResult, setShowRiskResult] = useState(false);
    const [riskLoading, setRiskLoading] = useState(false);

    // Fetch History Effect
    useEffect(() => {
        const fetchHistory = async () => {
            const { data } = await supabase
                .from('okr_risk_assessments')
                .select('*')
                .eq('okr_id', node.id)
                .order('created_at', { ascending: false });

            if (data) setRiskHistory(data);
        };
        fetchHistory();
    }, [node.id]);

    const handleViewHistory = (item: any) => {
        setRiskResult({
            status: item.status,
            analysisSummary: item.summary,
            riskFactors: item.factors,
            recommendations: item.recommendations,
            created_at: item.created_at
        });
        setShowRiskResult(true);
    };

    const runReview = async () => {
        setLoading(true);
        try {
            // 1. Gather Context (Objective + Children)
            let childType = 'KEY_RESULT';
            if (node.type === 'GOAL') childType = 'OBJECTIVE';
            if (node.type === 'KEY_RESULT') childType = 'TASK';

            const children = allNodes.filter(n => n.parentId === node.id && n.type === childType);

            const payload = {
                parentType: node.type,
                parentTitle: node.title,
                parentDescription: node.description,
                children: children.map(c => ({ title: c.title, description: c.description, type: childType }))
            };

            // 2. Call AI
            const { data, error } = await supabase.functions.invoke('okr-copilot', {
                body: { action: 'review', payload }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setReviewResult(data.data);
            setShowResult(true);

        } catch (error: any) {
            console.error("AI Review Failed:", error);
            alert("Failed to run review: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    const runRiskAnalysis = async () => {
        setRiskLoading(true);
        try {
            // 1. Gather Context (Objective + Children + Grandchildren Tasks)
            // Objective Data
            const objectiveTitle = node.title;
            const objectiveStartDate = node.startDate ? new Date(node.startDate).toISOString().split('T')[0] : 'N/A';
            const objectiveEndDate = node.endDate ? new Date(node.endDate).toISOString().split('T')[0] : 'N/A';

            // Key Results
            const keyResults = allNodes.filter(n => n.parentId === node.id && n.type === 'KEY_RESULT').map(kr => {
                // Find Tasks for this KR
                const tasks = allNodes.filter(t => t.parentId === kr.id && t.type === 'TASK').map(t => ({
                    title: t.title,
                    status: t.status, // pending, in-progress, completed
                    dueDate: t.endDate ? new Date(t.endDate).toISOString().split('T')[0] : null,
                    hours: t.estimatedHours || 0,
                    assigneeId: t.owner
                }));

                return {
                    title: kr.title,
                    progress: kr.progress,
                    tasks: tasks
                };
            });

            const currentDate = new Date().toISOString().split('T')[0];

            const payload = {
                objectiveTitle,
                objectiveStartDate,
                objectiveEndDate,
                teamMemberCount,
                keyResults,
                currentDate
            };

            // 2. Call AI
            const { data, error } = await supabase.functions.invoke('okr-copilot', {
                body: { action: 'risk-analysis', payload }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            setRiskResult(data.data);
            setShowRiskResult(true);


            // 3. Save to Database (History Table + OKR Cache)
            const historyEntry = {
                okr_id: node.id,
                status: data.data.status,
                summary: data.data.analysisSummary,
                factors: data.data.riskFactors,
                recommendations: data.data.recommendations,
                created_at: new Date().toISOString()
            };

            const { error: insertError } = await supabase
                .from('okr_risk_assessments')
                .insert(historyEntry);

            if (insertError) {
                console.error("Failed to save history:", insertError);
                alert("Database Error: " + insertError.message + "\n\nDid you run migration 34_CREATE_RISK_ASSESSMENTS.sql?");
            }

            const { error: updateError } = await supabase
                .from('okrs')
                .update({
                    risk_status: data.data.status,
                    risk_summary: data.data.analysisSummary,
                    risk_factors: data.data.riskFactors,
                    risk_recommendations: data.data.recommendations,
                    risk_last_updated: new Date().toISOString()
                })
                .eq('id', node.id);

            if (updateError) {
                console.error("Failed to save risk analysis cache:", updateError);
            } else {
                updateNode(node.id, {
                    risk_status: data.data.status,
                    risk_summary: data.data.analysisSummary,
                    risk_factors: data.data.riskFactors,
                    risk_recommendations: data.data.recommendations,
                    risk_last_updated: new Date().toISOString()
                });

                // Refresh history
                setRiskHistory(prev => [historyEntry, ...prev]);
            }

        } catch (error: any) {
            console.error("Risk Analysis Failed:", error);
            alert("Failed to run risk analysis: " + error.message);
        } finally {
            setRiskLoading(false);
        }
    };



    const handlePrint = () => {
        const printContent = document.getElementById('ai-review-result');
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>OKR AI Review</title>');
                // Add strict basic styles for the print window to look like the modal
                printWindow.document.write(`
    <style>
                        body { font - family: sans - serif; padding: 40px; color: #1a202c; line - height: 1.5; }
                        h3 { font - size: 24px; font - weight: bold; margin - bottom: 5px; color: #111; display: flex; align - items: center; gap: 10px; }
                        h4 { font - size: 16px; font - weight: 600; margin - top: 20px; margin - bottom: 10px; text - transform: uppercase; letter - spacing: 0.05em; }
                        p { margin - bottom: 10px; font - size: 14px; }
                        ul { padding - left: 20px; }
                        li { margin - bottom: 5px; padding: 10px; background: #f7fafc; border: 1px solid #edf2f7; border - radius: 4px; list - style: none; }
                        .score - box { float: right; text - align: right; }
                        .score { font - size: 32px; font - weight: 900; color: #2563eb; display: block; }
                        .score - label { font - size: 10px; color: #718096; text - transform: uppercase; font - weight: bold; }
                        .recommendation { padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border - radius: 8px; margin - bottom: 10px; display: flex; gap: 10px; }
                        .rec - number { font - weight: bold; color: #2563eb; }
                        .no - print { display: none; }
                        /* Colors for Strengths/Weaknesses */
                        .strength li { background: #f0fdf4; border - color: #dcfce7; color: #166534; }
                        .weakness li { background: #fff7ed; border - color: #ffedd5; color: #9a3412; }
                    </style >
    `);
                printWindow.document.write('</head><body>');

                // Reconstruct content cleanly for print
                printWindow.document.write(`
    < div class="score-box" >
                        <span class="score">${reviewResult.score}/10</span>
                        <span class="score-label">Quality Score</span>
                    </div >
                    <h3>OKR AI Review</h3>
                    <p style="color: #4a5568; margin-top: 5px;">Analysis for: <strong>${node.title.replace(/"/g, '&quot;')}</strong></p>
                    <hr style="border: 0; border-bottom: 1px solid #e2e8f0; margin: 20px 0;">
                    
                    <h4>Summary</h4>
                    <p>${reviewResult.summary}</p>
                    
                    <h4>Strengths</h4>
                    <ul class="strength">
                        ${reviewResult.strengths?.map((s: string) => `<li>${s}</li>`).join('')}
                    </ul>
                    
                    <h4>Improvements Needed</h4>
                    <ul class="weakness">
                        ${reviewResult.weaknesses?.map((w: string) => `<li>${w}</li>`).join('')}
                    </ul>
                    
                    <h4>Actionable Recommendations</h4>
                    ${reviewResult.recommendations?.map((r: string, i: number) => `
                        <div class="recommendation">
                            <span class="rec-number">${i + 1}.</span>
                            <span>${r}</span>
                        </div>
                    `).join('')}
                `);

                printWindow.document.write('</body></html > ');
                printWindow.document.close();
                printWindow.focus();

                // Slight delay to ensure content loaded
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };

    const handlePrintRisk = () => {
        const printContent = document.getElementById('ai-risk-result');
        if (printContent) {
            const printWindow = window.open('', '', 'height=800,width=800');
            if (printWindow) {
                printWindow.document.write('<html><head><title>OKR Risk Analysis</title>');
                printWindow.document.write(`
                     <style>
                         body { font-family: sans-serif; padding: 40px; color: #1a202c; line-height: 1.5; }
                         h3 { font-size: 24px; font-weight: bold; margin-bottom: 5px; color: #111; display: flex; align-items: center; gap: 10px; }
                         h4 { font-size: 16px; font-weight: 600; margin-top: 20px; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
                         p { margin-bottom: 10px; font-size: 14px; }
                         ul { padding-left: 20px; }
                         li { margin-bottom: 5px; padding: 10px; background: #f7fafc; border: 1px solid #edf2f7; border-radius: 4px; list-style: none; }
                         .status-box { float: right; text-align: right; }
                         .status { font-size: 32px; font-weight: 900; display: block; }
                         .On-Track { color: #22c55e; } .At-Risk { color: #f59e0b; } .Off-Track { color: #ef4444; }
                         .status-label { font-size: 10px; color: #718096; text-transform: uppercase; font-weight: bold; }
                         .recommendation { padding: 15px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; margin-bottom: 10px; display: flex; gap: 10px; }
                         .rec-number { font-weight: bold; color: #2563eb; }
                         .no-print { display: none; }
                         .risk-factor li { background: #fee2e2; border-color: #fca5a5; color: #7f1d1d; }
                     </style>
                 `);
                printWindow.document.write('</head><body>');
                printWindow.document.write(`
                     <div class="status-box">
                         <span class="status ${riskResult.status.replace(' ', '-')}">${riskResult.status}</span>
                         <span class="status-label">Projected Status</span>
                     </div>
                     <h3>OKR Risk Analysis</h3>
                     <p style="color: #4a5568; margin-top: 5px;">Analysis for: <strong>${node.title.replace(/"/g, '&quot;')}</strong></p>
                     <hr style="border: 0; border-bottom: 1px solid #e2e8f0; margin: 20px 0;">
                     
                     <h4>Summary</h4>
                     <p>${riskResult.analysisSummary}</p>
                     
                     <h4>Critical Risk Factors</h4>
                     <ul class="risk-factor">
                         ${riskResult.riskFactors?.map((r: string) => `<li>${r}</li>`).join('')}
                     </ul>
                     
                     <h4>Recommended Mitigations</h4>
                     ${riskResult.recommendations?.map((r: string, i: number) => `
                         <div class="recommendation">
                             <span class="rec-number">${i + 1}.</span>
                             <span>${r}</span>
                         </div>
                     `).join('')}
                 `);
                printWindow.document.write('</body></html>');
                printWindow.document.close();
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                    printWindow.close();
                }, 250);
            }
        }
    };

    return (
        <div className="space-y-6 pt-2 h-full overflow-y-auto pr-2 pb-4 relative">

            {/* WEEKLY REVIEW MODAL */}
            {showWeeklyReviewResult && weeklyReviewResult && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/50 backdrop-blur-sm p-4">
                    <div className="bg-card w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl border border-border shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-start bg-muted/20">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <RefreshCw className="w-5 h-5 text-green-600" />
                                    Weekly Progress Report
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">Generated Draft</p>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handlePrintWeeklyReview}
                                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-md hover:bg-muted transition-colors"
                                >
                                    <Printer className="w-3 h-3" />
                                    Print PDF
                                </button>
                                <button
                                    onClick={() => setShowWeeklyReviewResult(false)}
                                    className="text-muted-foreground hover:text-foreground p-1"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider">Executive Summary</h4>
                                <p className="text-sm leading-relaxed">{weeklyReviewResult.summary}</p>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h4 className="font-semibold text-sm text-green-600 mb-2">Key Achievements</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {weeklyReviewResult.achievements?.map((a: string, i: number) => (
                                            <li key={i} className="text-sm text-foreground">{a}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-orange-600 mb-2">Blockers & Risks</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {weeklyReviewResult.blockers?.map((b: string, i: number) => (
                                            <li key={i} className="text-sm text-foreground">{b}</li>
                                        ))}
                                    </ul>
                                </div>

                                <div>
                                    <h4 className="font-semibold text-sm text-blue-600 mb-2">Priorities for Next Week</h4>
                                    <ul className="list-disc pl-5 space-y-1">
                                        {weeklyReviewResult.priorities?.map((p: string, i: number) => (
                                            <li key={i} className="text-sm text-foreground">{p}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-muted/20 flex justify-end">
                            <button
                                onClick={() => setShowWeeklyReviewResult(false)}
                                className="px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary/90 transition-colors"
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* REVIEW RESULT MODAL */}
            {showResult && reviewResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm p-4">
                    <div id="ai-review-result" className="bg-card w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-border shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-start bg-muted/20">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <Sparkles className="w-5 h-5 text-purple-600" />
                                    OKR AI Review
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">Generated Analysis</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-3xl font-black text-primary">{reviewResult.score}/10</span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Quality Score</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            {/* Summary */}
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider">Summary</h4>
                                <p className="text-sm leading-relaxed">{reviewResult.summary}</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Strengths */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-green-600 flex items-center gap-2">
                                        <CheckSquare className="w-4 h-4" /> Strengths
                                    </h4>
                                    <ul className="space-y-2">
                                        {reviewResult.strengths?.map((s: string, i: number) => (
                                            <li key={i} className="text-sm bg-green-50 dark:bg-green-900/10 p-2 rounded border border-green-100 dark:border-green-900/30 text-green-800 dark:text-green-300">
                                                {s}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Weaknesses */}
                                <div className="space-y-2">
                                    <h4 className="font-semibold text-sm text-orange-600 flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" /> Improvements Needed
                                    </h4>
                                    <ul className="space-y-2">
                                        {reviewResult.weaknesses?.map((w: string, i: number) => (
                                            <li key={i} className="text-sm bg-orange-50 dark:bg-orange-900/10 p-2 rounded border border-orange-100 dark:border-orange-900/30 text-orange-800 dark:text-orange-300">
                                                {w}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>

                            {/* Recommendations */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" /> Actionable Recommendations
                                </h4>
                                <div className="space-y-2">
                                    {reviewResult.recommendations?.map((r: string, i: number) => (
                                        <div key={i} className="flex gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm">{r}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3 no-print">
                            <button
                                onClick={handlePrint}
                                className="px-4 py-2 border border-border bg-background text-foreground font-medium rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Print PDF
                            </button>
                            <button
                                onClick={() => setShowResult(false)}
                                className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Close Review
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* RISK RESULT MODAL */}
            {showRiskResult && riskResult && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/50 backdrop-blur-sm p-4">
                    <div id="ai-risk-result" className="bg-card w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-xl border border-border shadow-2xl flex flex-col animate-in fade-in zoom-in duration-200">
                        <div className="p-6 border-b border-border flex justify-between items-start bg-muted/20">
                            <div>
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <AlertTriangle className="w-5 h-5 text-orange-600" />
                                    OKR Risk Analysis
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">Projected Delivery Assessment</p>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className={`text-3xl font-black ${riskResult.status === 'On Track' ? 'text-green-500' : riskResult.status === 'At Risk' ? 'text-orange-500' : 'text-red-500'}`}>
                                    {riskResult.status}
                                </span>
                                <span className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Projected Status</span>
                            </div>
                        </div>

                        <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                            {/* Summary */}
                            <div className="bg-muted/30 p-4 rounded-lg">
                                <h4 className="font-semibold mb-2 text-sm uppercase tracking-wider">Analysis Summary</h4>
                                <p className="text-sm leading-relaxed">{riskResult.analysisSummary}</p>
                            </div>

                            {/* Risk Factors */}
                            <div className="space-y-2">
                                <h4 className="font-semibold text-sm text-red-600 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" /> Critical Risk Factors
                                </h4>
                                <ul className="space-y-2">
                                    {riskResult.riskFactors?.map((r: string, i: number) => (
                                        <li key={i} className="text-sm bg-red-50 dark:bg-red-900/10 p-2 rounded border border-red-100 dark:border-red-900/30 text-red-800 dark:text-red-300">
                                            {r}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            {/* Recommendations */}
                            <div className="space-y-3">
                                <h4 className="font-semibold text-sm flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-primary" /> Recommended Mitigations
                                </h4>
                                <div className="space-y-2">
                                    {riskResult.recommendations?.map((r: string, i: number) => (
                                        <div key={i} className="flex gap-3 p-3 bg-muted/40 rounded-lg border border-border">
                                            <div className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0 text-xs font-bold">
                                                {i + 1}
                                            </div>
                                            <p className="text-sm">{r}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="p-4 border-t border-border bg-muted/20 flex justify-end gap-3 no-print">
                            <button
                                onClick={handlePrintRisk}
                                className="px-4 py-2 border border-border bg-background text-foreground font-medium rounded-lg hover:bg-muted transition-colors flex items-center gap-2"
                            >
                                <Printer className="w-4 h-4" />
                                Print PDF
                            </button>
                            <button
                                onClick={() => setShowRiskResult(false)}
                                className="px-6 py-2 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors"
                            >
                                Close Analysis
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 1. OKR Review */}
            <div className="border border-border rounded-xl p-5 bg-card hover:border-primary/20 transition-all shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-500/10 rounded-lg">
                        <Sparkles className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">OKR Review</h4>
                        <p className="text-xs text-muted-foreground">Quality Score & Alignment Check</p>
                    </div>
                </div>

                <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground border border-border/50 border-dashed">
                    <p className="mb-3">
                        AI will analyze this {node.type.toLowerCase().replace('_', ' ')} for:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                        <li>S.M.A.R.T. criteria validation</li>
                        <li>Alignment with parent {node.parentId ? 'Objective' : 'Goal'}</li>
                        <li>Ambiguity detection</li>
                    </ul>
                    <button
                        onClick={runReview}
                        disabled={loading}
                        className="mt-4 w-full py-2 bg-background border border-border rounded-md text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2 text-foreground disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        {loading ? "Analyzing..." : "Run Review"}
                    </button>
                </div>
            </div>

            {/* 2. OKR Risk Analysis */}
            <div className="border border-border rounded-xl p-5 bg-card hover:border-orange-500/20 transition-all shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                        <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">Risk Analysis</h4>
                        <p className="text-xs text-muted-foreground">Identify Potential Blockers</p>
                    </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground border border-border/50 border-dashed">
                    <p className="mb-3">
                        AI will scan for execution risks such as:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                        <li>Resource bottlenecks</li>
                        <li>Dependency conflicts</li>
                        <li>Aggressive timelines</li>
                    </ul>
                    <button
                        onClick={runRiskAnalysis}
                        disabled={riskLoading}
                        className="mt-4 w-full py-2 bg-background border border-border rounded-md text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2 text-foreground disabled:opacity-50"
                    >
                        {riskLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        {riskLoading ? "Analyzing Risks..." : "Analyze Risks"}
                    </button>

                    {/* HISTORY / PREVIOUS ANALYSIS */}
                    {(riskHistory.length > 0) && (
                        <div className="mt-4 pt-3 border-t border-border/50">
                            <button
                                type="button"
                                onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                                className="w-full flex items-center justify-between text-left group mb-2"
                            >
                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Analysis History ({riskHistory.length})</h5>
                                <ChevronRight className={cn(
                                    "w-3 h-3 text-muted-foreground transition-transform duration-200",
                                    isHistoryExpanded && "transform rotate-90"
                                )} />
                            </button>

                            {isHistoryExpanded && (
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {riskHistory.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleViewHistory(item)}
                                            className="w-full text-left group"
                                        >
                                            <div className="p-2 bg-background border border-border rounded-md group-hover:border-primary/50 transition-colors flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className={cn(
                                                        "w-2 h-2 rounded-full",
                                                        item.status === 'On Track' ? "bg-green-500" :
                                                            item.status === 'At Risk' ? "bg-orange-500" : "bg-red-500"
                                                    )} />
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-semibold">{item.status}</span>
                                                        <span className="text-[10px] text-muted-foreground">
                                                            {new Date(item.created_at).toLocaleDateString()} • {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* 3. OKR Weekly Update */}
            <div className="border border-border rounded-xl p-5 bg-card hover:border-green-500/20 transition-all shadow-sm">
                <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-green-500/10 rounded-lg">
                        <RefreshCw className="w-5 h-5 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                        <h4 className="font-semibold text-foreground">Weekly Update</h4>
                        <p className="text-xs text-muted-foreground">Draft Progress Report</p>
                    </div>
                </div>
                <div className="bg-muted/30 rounded-lg p-4 text-sm text-muted-foreground border border-border/50 border-dashed">
                    <p className="mb-3">
                        Generate a concise weekly update based on:
                    </p>
                    <ul className="list-disc pl-4 space-y-1 text-xs">
                        <li>Recent Check-ins</li>
                        <li>Task completions</li>
                        <li>Blockers listed in comments</li>
                    </ul>

                    <div className="mt-4 mb-2">
                        <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1">
                            Week Ending
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input
                                type="date"
                                value={weeklyReviewDate}
                                onChange={(e) => setWeeklyReviewDate(e.target.value)}
                                className="w-full bg-background border border-border rounded-md pl-8 pr-2 py-1.5 text-xs focus:ring-1 focus:ring-primary outline-none text-foreground"
                            />
                        </div>
                    </div>

                    <button
                        onClick={runWeeklyReview}
                        disabled={weeklyReviewLoading}
                        className="mt-4 w-full py-2 bg-background border border-border rounded-md text-xs font-medium hover:bg-muted transition-colors flex items-center justify-center gap-2 text-foreground disabled:opacity-50"
                    >
                        {weeklyReviewLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                        {weeklyReviewLoading ? "Drafting Report..." : "Generate Draft"}
                    </button>

                    {/* WEEKLY REVIEW HISTORY */}
                    {(weeklyReviewHistory.length > 0) && (
                        <div className="mt-4 pt-3 border-t border-border/50">
                            <button
                                type="button"
                                onClick={() => setIsWeeklyHistoryExpanded(!isWeeklyHistoryExpanded)}
                                className="w-full flex items-center justify-between text-left group mb-2"
                            >
                                <h5 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Report History ({weeklyReviewHistory.length})</h5>
                                <ChevronRight className={cn(
                                    "w-3 h-3 text-muted-foreground transition-transform duration-200",
                                    isWeeklyHistoryExpanded && "transform rotate-90"
                                )} />
                            </button>

                            {isWeeklyHistoryExpanded && (
                                <div className="space-y-2 max-h-40 overflow-y-auto pr-1 animate-in fade-in slide-in-from-top-2 duration-200">
                                    {weeklyReviewHistory.map((item, idx) => (
                                        <button
                                            key={idx}
                                            type="button"
                                            onClick={() => handleViewWeeklyReview(item)}
                                            className="w-full text-left group"
                                        >
                                            <div className="p-2 bg-background border border-border rounded-md group-hover:border-primary/50 transition-colors flex items-center justify-between">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-semibold truncate w-48">{item.summary?.substring(0, 40)}...</span>
                                                    <span className="text-[10px] text-muted-foreground">
                                                        {item.period_end ? (
                                                            `Week of ${new Date(item.period_end).toLocaleDateString()}`
                                                        ) : (
                                                            `${new Date(item.created_at).toLocaleDateString()} • ${new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                                                        )}
                                                    </span>
                                                </div>
                                                <ChevronRight className="w-3 h-3 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

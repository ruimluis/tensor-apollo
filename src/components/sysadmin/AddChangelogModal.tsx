import React, { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
// import { Select } from '@/components/ui/Select'; 
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { Wand2, Loader2, Calendar } from 'lucide-react';

interface AddChangelogModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export function AddChangelogModal({ isOpen, onClose, onSuccess }: AddChangelogModalProps) {
    const { addToast } = useToast();
    const [loading, setLoading] = useState(false);
    const [aiGenerating, setAiGenerating] = useState(false);

    const [formData, setFormData] = useState({
        title: '',
        publish_date: new Date().toISOString().split('T')[0],
        type: 'New Feature',
        icon: 'Rocket',
        description: ''
    });

    const icons = [
        'Rocket', 'Zap', 'Bug', 'Star', 'RefreshCcw', 'CheckCircle2', 'TrendingUp', 'AlertTriangle', 'Shield', 'Settings', 'Link'
    ];

    const types = ['New Feature', 'Improvement', 'Fix'];

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from('changelog_items')
                .insert([{
                    title: formData.title,
                    publish_date: new Date(formData.publish_date).toISOString(),
                    type: formData.type,
                    icon: formData.icon,
                    description: formData.description
                }]);

            if (error) throw error;

            addToast({
                type: 'success',
                title: 'Success',
                message: 'Changelog item added successfully'
            });
            onSuccess();
            onClose();
            // Reset form
            setFormData({
                title: '',
                publish_date: new Date().toISOString().split('T')[0],
                type: 'New Feature',
                icon: 'Rocket',
                description: ''
            });

        } catch (error: any) {
            addToast({
                type: 'error',
                title: 'Error',
                message: error.message
            });
        } finally {
            setLoading(false);
        }
    };

    const handleGenerateAI = async () => {
        if (!formData.title) {
            addToast({
                type: 'warning',
                title: 'Title required',
                message: 'Please enter a title to generate a description.'
            });
            return;
        }

        setAiGenerating(true);
        // Simulate AI generation for now as per immediate requirements
        setTimeout(() => {
            setFormData(prev => ({
                ...prev,
                description: `Introducing ${prev.title}! This new update brings significant improvements to your workflow. We've optimized the performance and enhanced the user interface to ensure a smoother experience. Get started today and explore the new capabilities.`
            }));
            setAiGenerating(false);
        }, 1500);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Add Changelog Item">
            <form onSubmit={handleSubmit} className="space-y-4">

                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Icon</label>
                        <select
                            value={formData.icon}
                            onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {icons.map(icon => (
                                <option key={icon} value={icon}>{icon}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Badge Text</label>
                        <select
                            value={formData.type}
                            onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                            {types.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Date</label>
                    <div className="relative">
                        <input
                            type="date"
                            value={formData.publish_date}
                            onChange={(e) => setFormData(prev => ({ ...prev, publish_date: e.target.value }))}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                        />
                        <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium">Title</label>
                    <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="e.g. Launched AI-Copilot"
                        required
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <label className="text-sm font-medium">Description</label>
                        <button
                            type="button"
                            onClick={handleGenerateAI}
                            disabled={aiGenerating}
                            className="text-xs flex items-center gap-1.5 text-primary hover:text-primary/80 transition-colors"
                        >
                            {aiGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />}
                            Generate with AI
                        </button>
                    </div>
                    <textarea
                        value={formData.description}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows={5}
                        required
                        className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-y"
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted rounded-md transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 rounded-md transition-colors disabled:opacity-50"
                    >
                        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                        Save
                    </button>
                </div>
            </form>
        </Modal>
    );
}

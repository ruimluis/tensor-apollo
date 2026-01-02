import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Plus, Trash2, Rocket, Zap, Bug, Star, RefreshCcw, CheckCircle2, TrendingUp, AlertTriangle, Shield, Settings, Link } from 'lucide-react';
import { AddChangelogModal } from './AddChangelogModal';
import { useToast } from '@/components/ui/Toast';

// Icon mapping (duplicate from ChangelogPage, ideally in a separate utils file but keeping simple for now)
const iconMap: Record<string, React.ElementType> = {
    Rocket,
    Zap,
    Bug,
    Star,
    RefreshCcw,
    CheckCircle2,
    TrendingUp,
    AlertTriangle,
    Shield,
    Settings,
    Link
};

interface ChangelogItem {
    id: string;
    title: string;
    description: string;
    publish_date: string;
    type: string;
    icon: string;
}

export function ChangelogManager() {
    const [items, setItems] = useState<ChangelogItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const { addToast } = useToast();

    useEffect(() => {
        fetchChangelog();
    }, []);

    const fetchChangelog = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('changelog_items')
                .select('*')
                .order('publish_date', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching changelog:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to fetch changelog items' });
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this item?')) return;

        try {
            const { error } = await supabase
                .from('changelog_items')
                .delete()
                .eq('id', id);

            if (error) throw error;

            addToast({ type: 'success', title: 'Deleted', message: 'Item deleted successfully' });
            fetchChangelog();
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error', message: error.message });
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Changelog Items</h2>
                    <p className="text-sm text-muted-foreground">Manage your product updates.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                    <Plus className="h-4 w-4" />
                    Add Item
                </button>
            </div>

            <div className="rounded-md border border-border">
                {loading ? (
                    <div className="p-8 text-center text-muted-foreground">Loading...</div>
                ) : items.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">No items found. Add one to get started.</div>
                ) : (
                    <div className="divide-y divide-border">
                        {items.map((item) => {
                            const IconComponent = iconMap[item.icon] || Star;
                            return (
                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                                            <IconComponent className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium">{item.title}</h3>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span>{format(new Date(item.publish_date), 'MMM d, yyyy')}</span>
                                                <span>•</span>
                                                <span className="capitalize">{item.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(item.id)}
                                        className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                                        title="Delete"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <AddChangelogModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchChangelog}
            />
        </div>
    );
}

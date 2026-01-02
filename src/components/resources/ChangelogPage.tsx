import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { format } from 'date-fns';
import { Rocket, Zap, Bug, Star, RefreshCcw, CheckCircle2, TrendingUp, AlertTriangle, Shield, Settings, Link } from 'lucide-react';
import { cn } from '@/lib/utils';

// Icon mapping
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

export function ChangelogPage() {
    const [items, setItems] = useState<ChangelogItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchChangelog();
    }, []);

    const fetchChangelog = async () => {
        try {
            const { data, error } = await supabase
                .from('changelog_items')
                .select('*')
                .order('publish_date', { ascending: false });

            if (error) throw error;
            setItems(data || []);
        } catch (error) {
            console.error('Error fetching changelog:', error);
        } finally {
            setLoading(false);
        }
    };

    const getTypeColor = (type: string) => {
        switch (type.toLowerCase()) {
            case 'new feature':
                return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
            case 'improvement':
                return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'fix':
                return 'bg-green-500/20 text-green-400 border-green-500/30';
            default:
                return 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
        }
    };

    if (loading) {
        return <div className="p-8 text-center text-muted-foreground">Loading changelog...</div>;
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-12">
                <h1 className="text-3xl font-bold tracking-tight mb-2">Changelog</h1>
                <p className="text-muted-foreground">Our latest features and improvements to OKR Focus.</p>
            </div>

            <div className="relative border-l border-border/50 ml-6 space-y-12">
                {items.length === 0 && (
                    <div className="ml-12 text-muted-foreground">No changelog items found.</div>
                )}

                {items.map((item) => {
                    const IconComponent = iconMap[item.icon] || Star;

                    return (
                        <div key={item.id} className="relative ml-12">
                            {/* Icon Indicator */}
                            <div className="absolute -left-[3.25rem] mt-1.5 h-10 w-10 rounded-full border border-border bg-card flex items-center justify-center shadow-sm">
                                <IconComponent className="h-5 w-5 text-primary" />
                            </div>

                            <div className="flex flex-col gap-4">
                                <div className="flex items-center gap-3 text-sm">
                                    <span className="text-muted-foreground">
                                        {format(new Date(item.publish_date), 'MMMM do, yyyy')}
                                    </span>
                                    <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium border", getTypeColor(item.type))}>
                                        {item.type}
                                    </span>
                                </div>

                                <div>
                                    <h2 className="text-xl font-bold mb-3">{item.title}</h2>
                                    <div className="prose prose-invert prose-sm max-w-none text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {item.description}
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

import { useState } from 'react';
import { Activity } from 'lucide-react';
import { cn } from '@/lib/utils';

export function RecentActivityWidget() {
    const [tab, setTab] = useState<'krs' | 'tasks'>('krs');

    return (
        <div className="rounded-xl border border-border bg-card shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-border/50">
                <h3 className="text-lg font-bold tracking-tight">Recent Activity</h3>
                <div className="flex gap-2 mt-4">
                    <button
                        onClick={() => setTab('krs')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                            tab === 'krs' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        Key Results
                    </button>
                    <button
                        onClick={() => setTab('tasks')}
                        className={cn(
                            "px-3 py-1.5 text-xs font-medium rounded-md transition-colors",
                            tab === 'tasks' ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                        )}
                    >
                        Tasks
                    </button>
                </div>
            </div>

            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center border-t border-dashed border-border/50 min-h-[200px] m-4 mt-0 bg-background/50 rounded-lg">
                <div className="space-y-3">
                    <Activity className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                    <div>
                        <h4 className="font-medium text-foreground">No Key Result Activity Yet</h4>
                        <p className="text-sm text-muted-foreground">Progress updates for your KRs will appear here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

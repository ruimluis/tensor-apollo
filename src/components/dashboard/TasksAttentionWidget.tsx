
import { AlertTriangle, User, Calendar, Clock, ChevronDown } from 'lucide-react';

export function TasksAttentionWidget() {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm h-full">
            <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                    <h3 className="font-semibold leading-none tracking-tight">Tasks Needing Attention</h3>
                </div>
            </div>

            <div className="p-4 space-y-2">
                {/* Accordion Items */}
                <div className="rounded-md border border-border bg-muted/10">
                    <button className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span>Unassigned</span>
                            <span className="inline-flex h-5 w-8 items-center justify-center rounded-full bg-secondary text-[10px] text-secondary-foreground">111</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="rounded-md border border-border bg-muted/10">
                    <button className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>No Due Date</span>
                            <span className="inline-flex h-5 w-8 items-center justify-center rounded-full bg-secondary text-[10px] text-secondary-foreground">111</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>

                <div className="rounded-md border border-border bg-muted/10">
                    <button className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span>No Hour Estimate</span>
                            <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] text-secondary-foreground">1</span>
                        </div>
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    </button>
                </div>
            </div>
        </div>
    );
}

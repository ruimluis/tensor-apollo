
import { AlertCircle } from 'lucide-react';

export function OverdueTasksWidget() {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-destructive" />
                    <h3 className="font-semibold leading-none tracking-tight">Overdue Tasks</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">These tasks are past their due date and require attention.</p>
            </div>

            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center min-h-[150px]">
                <div className="space-y-2">
                    <h4 className="font-medium text-foreground">No Overdue Tasks</h4>
                    <p className="text-sm text-muted-foreground">Everything is on track. Keep up the great work!</p>
                </div>
            </div>
        </div>
    );
}


import { Users } from 'lucide-react';

export function TaskPerformanceWidget() {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm h-full flex flex-col">
            <div className="p-6">
                <h3 className="text-lg font-bold tracking-tight">Task Performance by User</h3>
            </div>

            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center border-dashed border border-border/50 min-h-[200px] m-4 mt-0 bg-background/50 rounded-lg">
                <div className="space-y-3">
                    <Users className="h-8 w-8 text-muted-foreground mx-auto opacity-50" />
                    <div>
                        <h4 className="font-medium text-foreground">No Task Activity</h4>
                        <p className="text-sm text-muted-foreground">Assign tasks to users to see their performance here.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}


import { CalendarRange } from 'lucide-react';

export function DeliveryForecastWidget() {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm h-full flex flex-col">
            <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <CalendarRange className="h-5 w-5 text-purple-500" />
                    <h3 className="font-semibold leading-none tracking-tight">Delivery Forecast</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Objectives with Key Results or Tasks scheduled beyond their end date.</p>
            </div>

            <div className="p-6 flex-1 flex flex-col items-center justify-center text-center min-h-[150px]">
                <div className="space-y-2">
                    <h4 className="font-medium text-foreground">Everything on Schedule</h4>
                    <p className="text-sm text-muted-foreground">No objectives have items scheduled past their end dates.</p>
                </div>
            </div>
        </div>
    );
}

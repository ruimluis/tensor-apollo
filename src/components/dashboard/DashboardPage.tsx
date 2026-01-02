
import { Filter } from 'lucide-react';
import { DashboardSummaryCards } from './DashboardSummaryCards';
import { RiskAnalysisWidget } from './RiskAnalysisWidget';
import { TasksAttentionWidget } from './TasksAttentionWidget';
import { DeliveryForecastWidget } from './DeliveryForecastWidget';
import { OverdueTasksWidget } from './OverdueTasksWidget';
import { RecentActivityWidget } from './RecentActivityWidget';
import { TaskPerformanceWidget } from './TaskPerformanceWidget';

export function DashboardPage() {
    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in-50">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                <p className="text-muted-foreground mt-1">Here's a summary of your organization's progress.</p>
            </div>

            {/* Filters (Placeholder) */}
            <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    <Filter className="h-4 w-4" />
                    Filters
                </button>
            </div>

            {/* Summary Cards */}
            <DashboardSummaryCards />

            {/* Main Grid Layout */}
            <div className="grid gap-6 md:grid-cols-2">
                {/* Row 1 */}
                <RiskAnalysisWidget />
                <TasksAttentionWidget />

                {/* Row 2 */}
                <DeliveryForecastWidget />
                <OverdueTasksWidget />

                {/* Row 3 */}
                <RecentActivityWidget />
                <TaskPerformanceWidget />
            </div>
        </div>
    );
}

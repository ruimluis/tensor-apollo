import { Calendar as CalendarIcon, Sparkles, ChevronRight, ChevronLeft } from 'lucide-react';
import { format } from 'date-fns';

interface SchedulerHeaderProps {
    currentDate: Date;
    onPrev: () => void;
    onNext: () => void;
    activeTab: 'schedule' | 'capacity';
    onTabChange: (t: 'schedule' | 'capacity') => void;
    teams: any[];
    selectedTeamId: string;
    onTeamChange: (id: string) => void;
    onAutoSchedule: () => void;
    isReadOnly: boolean;
    viewMode: 'day' | 'week' | 'month';
    onViewModeChange: (mode: 'day' | 'week' | 'month') => void;
}

export const SchedulerHeader = ({
    currentDate,
    onPrev,
    onNext,
    activeTab,
    onTabChange,
    teams,
    selectedTeamId,
    onTeamChange,
    onAutoSchedule,
    isReadOnly,
    viewMode,
    onViewModeChange
}: SchedulerHeaderProps) => {
    return (
        <div className="flex items-center justify-between p-4 border-b border-border bg-background">
            <div className="flex items-center gap-6">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    Project Schedule
                </h2>

                <button
                    onClick={onAutoSchedule}
                    disabled={isReadOnly}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${isReadOnly ? 'bg-muted text-muted-foreground cursor-not-allowed opacity-50' : 'bg-purple-100 text-purple-700 hover:bg-purple-200 dark:bg-purple-900/30 dark:text-purple-300'}`}
                    title={isReadOnly ? "Auto-schedule is disabled in All Teams view" : "Auto-Schedule Unassigned Tasks"}
                >
                    <Sparkles className="h-3.5 w-3.5" />
                    Auto-Schedule
                </button>

                <div className="h-6 w-px bg-border/50 mx-2" />

                <select
                    className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring w-[180px]"
                    value={selectedTeamId}
                    onChange={(e) => onTeamChange(e.target.value)}
                >
                    <option value="all">All Teams</option>
                    {teams.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                </select>

                <div className="h-6 w-px bg-border/50 mx-2" />

                <div className="flex bg-muted rounded-lg p-1 text-sm font-medium">
                    <button
                        onClick={() => onViewModeChange('day')}
                        className={`px-3 py-1 rounded-md transition-all ${viewMode === 'day' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Day
                    </button>
                    <button
                        onClick={() => onViewModeChange('week')}
                        className={`px-3 py-1 rounded-md transition-all ${viewMode === 'week' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Week
                    </button>
                    <button
                        onClick={() => onViewModeChange('month')}
                        className={`px-3 py-1 rounded-md transition-all ${viewMode === 'month' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Month
                    </button>
                </div>

                <div className="flex bg-muted rounded-lg p-1 text-sm font-medium">
                    <button
                        onClick={() => onTabChange('schedule')}
                        className={`px-3 py-1 rounded-md transition-all ${activeTab === 'schedule' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Schedule
                    </button>
                    <button
                        onClick={() => onTabChange('capacity')}
                        className={`px-3 py-1 rounded-md transition-all ${activeTab === 'capacity' ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                    >
                        Capacity
                    </button>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={onPrev} className="p-1 hover:bg-muted rounded"><ChevronLeft className="h-5 w-5" /></button>
                <span className="font-medium min-w-[120px] text-center">{format(currentDate, 'MMMM yyyy')}</span>
                <button onClick={onNext} className="p-1 hover:bg-muted rounded"><ChevronRight className="h-5 w-5" /></button>
            </div>
        </div>
    );
};



interface StatCardProps {
    title: string;
    value: string;
    subtext: string;
    percentage: number;
}

function StatCard({ title, value, subtext, percentage }: StatCardProps) {
    return (
        <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</h3>
            <div className="mt-4 flex items-center gap-4">
                <div className="relative h-12 w-12 flex items-center justify-center rounded-full bg-secondary/30">
                    <span className="text-xs font-bold text-primary">{percentage}%</span>
                    {/* Placeholder for circular progress if needed later */}
                </div>
                <div>
                    <div className="text-2xl font-bold">{value}</div>
                    <p className="text-xs text-muted-foreground">{subtext}</p>
                </div>
            </div>
        </div>
    );
}

export function DashboardSummaryCards() {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
                title="Completed Goals"
                value="0 / 2"
                subtext="active goals"
                percentage={0}
            />
            <StatCard
                title="Completed Objectives"
                value="0 / 6"
                subtext="active objectives"
                percentage={0}
            />
            <StatCard
                title="Completed KRs"
                value="0 / 18"
                subtext="total Key Results"
                percentage={0}
            />
            <StatCard
                title="Overall Task Progress"
                value="0%"
                subtext="0 of 111 tasks completed"
                percentage={0}
            />
        </div>
    );
}

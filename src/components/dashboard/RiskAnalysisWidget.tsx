
import { TrendingUp, HelpCircle, ChevronUp, ArrowRight } from 'lucide-react';

export function RiskAnalysisWidget() {
    return (
        <div className="rounded-xl border border-border bg-card shadow-sm h-full">
            <div className="p-6 border-b border-border/50">
                <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h3 className="font-semibold leading-none tracking-tight">Objectives Risk Analysis</h3>
                </div>
                <p className="text-sm text-muted-foreground mt-1">A breakdown of all objectives by their AI-analyzed risk status.</p>
            </div>

            <div className="p-4">
                <div className="space-y-1">
                    {/* Accordion Item Placeholder */}
                    <div className="rounded-md border border-border bg-muted/20">
                        <button className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium hover:bg-muted/50 transition-colors">
                            <div className="flex items-center gap-2">
                                <HelpCircle className="h-4 w-4 text-muted-foreground" />
                                <span>Not Analyzed</span>
                                <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] text-secondary-foreground">6</span>
                            </div>
                            <ChevronUp className="h-4 w-4 text-muted-foreground" />
                        </button>
                        <div className="px-4 pb-3 pt-1 border-t border-border/50">
                            <ul className="space-y-1">
                                {[
                                    "Augment AI Discovery and Recommendation Engine for Tailored Goal Setting",
                                    "Elevate AI-Driven Personalization for User Onboarding and Ongoing Relevance",
                                    "Implement a Robust Churn Data Collection and Predictive Analytics Framework",
                                    "Achieve Initial MRR Through Product-Led Growth",
                                    "Leverage AI for Distinctive Value and Virality",
                                    "Validate and Penetrate a Narrow ICP"
                                ].map((obj, i) => (
                                    <li key={i} className="flex items-center justify-between py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 px-2 rounded cursor-pointer transition-colors">
                                        <span className="truncate pr-4">{obj}</span>
                                        <ArrowRight className="h-3 w-3 opacity-50" />
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

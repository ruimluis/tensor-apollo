import { useState, useEffect } from 'react';
import { Target, BarChart2, Brain, CheckCircle2, ChevronRight, ArrowRight, ShieldCheck, Zap, Sun, Moon, TrendingDown, Link2Off, ClipboardX, Waypoints, Sparkles } from 'lucide-react';

interface LandingPageProps {
    onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
    const [isDark, setIsDark] = useState(true);

    useEffect(() => {
        if (isDark) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [isDark]);

    const toggleTheme = () => setIsDark(!isDark);
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
            {/* Navbar */}
            <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
                            <Target className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">OKR Focus</span>
                    </div>
                    <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
                        <a href="#features" className="hover:text-foreground transition-colors">Features</a>
                        <a href="#solutions" className="hover:text-foreground transition-colors">Solutions</a>
                        <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
                    </nav>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggleTheme}
                            className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            aria-label="Toggle theme"
                        >
                            {isDark ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                        </button>
                        <button
                            onClick={onLoginClick}
                            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Log in
                        </button>
                        <button
                            onClick={onLoginClick}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm"
                        >
                            Get Started
                        </button>
                    </div>
                </div>
            </header>

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative overflow-hidden pt-16 pb-32 lg:pt-32 lg:pb-32">
                    <div className="container mx-auto px-4 relative z-10">
                        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
                            <div className="flex-1 text-center lg:text-left">
                                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm font-medium text-primary mb-6">
                                    <span className="flex h-2 w-2 rounded-full bg-primary mr-2"></span>
                                    New: AI Strategic Consultant 2.0
                                </div>

                                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent leading-[1.1]">
                                    Execute Strategy with <span className="text-primary">Precision</span>
                                </h1>
                                <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto lg:mx-0">
                                    Align your entire organization around clear Objectives and Key Results.
                                    Leverage AI to uncover risks, track progress, and drive execution.
                                </p>
                                <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
                                    <button
                                        onClick={onLoginClick}
                                        className="w-full sm:w-auto flex items-center justify-center gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg text-lg font-medium transition-all shadow-lg hover:shadow-primary/25"
                                    >
                                        Start Logic <ArrowRight className="h-5 w-5" />
                                    </button>
                                    <button className="w-full sm:w-auto border border-border bg-background hover:bg-muted/50 px-8 py-3 rounded-lg text-lg font-medium transition-colors text-foreground">
                                        View Demo
                                    </button>
                                </div>
                                <div className="mt-8 flex items-center justify-center lg:justify-start gap-8 text-sm text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span>No credit card required</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                        <span>14-day free trial</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex-1 w-full max-w-[600px] lg:max-w-none">
                                <div className="relative rounded-xl border border-border bg-background/50 shadow-2xl backdrop-blur-sm p-2 ring-1 ring-white/10">
                                    <div className="rounded-lg overflow-hidden bg-card">
                                        <img
                                            src="/landing-hero.png"
                                            alt="OKR Focus Dashboard"
                                            className="w-full h-auto object-cover"
                                        />
                                    </div>
                                    {/* Floating Cards for effect */}
                                    <div className="absolute -left-12 top-1/4 bg-card/90 backdrop-blur border border-border p-4 rounded-lg shadow-xl hidden xl:block md:w-64">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-8 w-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                <Zap className="h-4 w-4 text-green-500" />
                                            </div>
                                            <div>
                                                <p className="text-xs text-muted-foreground font-medium">Velocity</p>
                                                <p className="font-bold text-sm">+24% vs Last Quarter</p>
                                            </div>
                                        </div>
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500 w-[78%]"></div>
                                        </div>
                                    </div>

                                    <div className="absolute -right-8 bottom-1/4 bg-card/90 backdrop-blur border border-border p-4 rounded-lg shadow-xl hidden xl:block md:w-64">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                                <Brain className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-semibold">AI Insight</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Risk detected in Q3 Roadmap due to resource constraints.</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                </section>

                {/* Section 1: The Problem */}
                <section className="py-24 bg-muted/40">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-4xl mx-auto mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6">Why Do Most OKR Implementations Fail?</h2>
                            <blockquote className="text-xl text-muted-foreground italic border-l-4 border-primary/30 pl-6 py-2 mx-auto max-w-2xl bg-card/50 rounded-r-lg">
                                "Every year, we start with so much energy around our OKRs. By the end of month two,
                                we've even stopped talking about them."
                                <footer className="text-sm font-medium not-italic mt-2 text-foreground/70">- Every SaaS CEO, probably.</footer>
                            </blockquote>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: TrendingDown,
                                    title: "The \"Set & Forget\" Trap",
                                    desc: "Goals are defined in a spreadsheet or a separate tool, then quickly forgotten in the rush of daily tasks."
                                },
                                {
                                    icon: Link2Off,
                                    title: "Lack of True Alignment",
                                    desc: "It's difficult for team members to see how their individual work directly contributes to the company's strategic goals."
                                },
                                {
                                    icon: ClipboardX,
                                    title: "Manual Update Drudgery",
                                    desc: "Endless hours are wasted manually updating progress and writing status reports, leading to reporting fatigue."
                                }
                            ].map((item, i) => (
                                <div key={i} className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="h-10 w-10 text-primary mb-4">
                                        <item.icon className="h-full w-full" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Section 2: The Solution */}
                <section className="py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6">Your Active Partner in Strategy Execution</h2>
                            <p className="text-xl text-muted-foreground">
                                OKR Focus doesn't just store your goals—it actively helps you achieve them with proactive intelligence and automation.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Zap,
                                    title: "Proactive Risk Analysis",
                                    desc: "Our AI constantly analyzes progress, tasks, and timelines to surface risks *before* they derail your quarter."
                                },
                                {
                                    icon: Waypoints,
                                    title: "Intelligent Goal Alignment",
                                    desc: "Get AI-powered recommendations for Objectives and Key Results that directly align with your company's mission and strategic documents."
                                },
                                {
                                    icon: Sparkles,
                                    title: "Automated Status Reports",
                                    desc: "Instantly generate concise, professional weekly reviews, turning hours of manual reporting into a one-click action."
                                }
                            ].map((item, i) => (
                                <div key={i} className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                                    <div className="h-10 w-10 text-primary mb-4">
                                        <item.icon className="h-full w-full" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 bg-muted/30">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl font-bold tracking-tight mb-4">Command Center for Strategy</h2>
                            <p className="text-lg text-muted-foreground">
                                Everything you need to turn high-level strategy into on-the-ground execution.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: Target,
                                    title: "Strategic Alignment",
                                    desc: "Connect top-level company goals to individual tasks. Ensure every team member knows how their work contributes to the mission."
                                },
                                {
                                    icon: BarChart2,
                                    title: "Real-time Progress",
                                    desc: "Visualize performance with the Strategic Radar. Track key results automatically and spot bottlenecks before they become blockers."
                                },
                                {
                                    icon: Brain,
                                    title: "AI Co-Pilot",
                                    desc: "Get intelligent suggestions for OKRs, automatic risk assessments, and strategic insights powered by advanced AI models."
                                },
                                {
                                    icon: ShieldCheck,
                                    title: "Durable Execution",
                                    desc: "Build a resilient organization with guardrails and frameworks that keep your strategy on track even as conditions change."
                                },
                                {
                                    icon: Zap,
                                    title: "Velocity Tracking",
                                    desc: "Measure the speed of execution and optimize your team's workflow with integrated Kanban boards and sprint planning."
                                },
                                {
                                    icon: ChevronRight,
                                    title: "Transparent Culture",
                                    desc: "Foster a culture of transparency and accountability. Make goals visible and celebrate wins together."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="bg-card border border-border rounded-xl p-6 hover:shadow-lg transition-shadow">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-24 relative overflow-hidden">
                    <div className="absolute inset-0 bg-primary/5 -z-10"></div>
                    <div className="container mx-auto px-4 text-center">
                        <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6">Ready to Focus?</h2>
                        <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
                            Join thousands of leaders who use OKR Focus to drive results and build high-performing teams.
                        </p>
                        <button
                            onClick={onLoginClick}
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-8 py-3 rounded-lg text-lg font-medium transition-all shadow-lg hover:shadow-primary/25"
                        >
                            Get Started for Free
                        </button>
                        <p className="mt-4 text-sm text-muted-foreground">
                            14-day free trial · No credit card required · Cancel anytime
                        </p>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-12 bg-background">
                <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-primary/10">
                            <Target className="h-3 w-3 text-primary" />
                        </div>
                        <span className="font-semibold tracking-tight">OKR Focus</span>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        © 2024 Tensor Apollo Inc. All rights reserved.
                    </p>
                    <div className="flex gap-6 text-sm text-muted-foreground">
                        <a href="#" className="hover:text-foreground">Privacy</a>
                        <a href="#" className="hover:text-foreground">Terms</a>
                        <a href="#" className="hover:text-foreground">Security</a>
                    </div>
                </div>
            </footer>
        </div >
    );
}

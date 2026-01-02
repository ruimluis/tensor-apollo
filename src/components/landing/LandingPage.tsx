import { useState, useEffect } from 'react';
import { Target, BarChart2, Brain, CheckCircle2, ChevronRight, ArrowRight, ShieldCheck, Zap, Sun, Moon, TrendingDown, Link2Off, ClipboardX, Waypoints, Sparkles, FileText, PieChart, Link, MessageSquare, Library, Star, Puzzle, Workflow, BrainCircuit, History, Lightbulb, TrendingUp, User, Users, Building, Check, ChevronDown } from 'lucide-react';

interface LandingPageProps {
    onLoginClick: () => void;
}

export function LandingPage({ onLoginClick }: LandingPageProps) {
    const [isDark, setIsDark] = useState(true);
    const [isYearly, setIsYearly] = useState(false);

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

                {/* Main Feature Section */}
                <section className="py-24 overflow-hidden bg-muted/20">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            <div className="flex-1">
                                <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-6">
                                    <Sparkles className="h-4 w-4 mr-2" />
                                    AI-Powered Intelligence
                                </div>
                                <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-6">
                                    An AI Consultant That <span className="text-primary">Actually Works</span>
                                </h2>
                                <p className="text-lg text-muted-foreground mb-8 text-pretty">
                                    Stop drowning in dashboards. Our AI analyzes your entire strategic vault, identifying conflicts,
                                    suggesting OKRs, and even drafting weekly reviews for you.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        "Automated Risk Detection",
                                        "Context-Aware Suggestions",
                                        "Conflict Resolution Engine",
                                        "Semantic Search Across All Docs"
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-center gap-3">
                                            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                                                <CheckCircle2 className="h-3.5 w-3.5 text-primary" />
                                            </div>
                                            <span className="font-medium text-foreground/90">{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button
                                    onClick={onLoginClick}
                                    className="mt-8 flex items-center gap-2 text-primary font-semibold hover:text-primary/80 transition-colors"
                                >
                                    Explore AI Capabilities <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                            <div className="flex-1 w-full">
                                <SimulatedStreamingUI />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Intelligent Goal Alignment Section */}
                <section className="py-24 bg-background overflow-hidden">
                    <div className="container mx-auto px-4">
                        <div className="mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                                Intelligent Goal Alignment
                            </h2>
                            <p className="text-xl text-muted-foreground max-w-3xl">
                                Stop drafting OKRs in a vacuum. Our AI reads your company's mission, strategic documents,
                                and high-level goals to suggest perfectly aligned Objectives and Key Results for your teams.
                            </p>
                        </div>

                        <FeatureCarousel />
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-muted/20">
                    <div className="container mx-auto px-4">
                        <div className="flex flex-col lg:flex-row items-center gap-16">
                            {/* Left Content */}
                            <div className="flex-1 space-y-8">
                                <div>
                                    <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">
                                        Automate the Tedious Work
                                    </h2>
                                    <p className="text-xl text-muted-foreground">
                                        Free up your team from the drudgery of manual reporting and status updates.
                                        OKR Focus automates the creation of weekly summaries and progress reports,
                                        turning hours of work into a single click.
                                    </p>
                                </div>

                                <div className="space-y-6">
                                    {[
                                        {
                                            title: "AI-Generated Weekly Reviews",
                                            desc: "Automatically synthesizes all progress logs, comments, and task updates for a given week into a concise, professional summary."
                                        },
                                        {
                                            title: "One-Click Reporting",
                                            desc: "Export beautiful, print-ready reports for any objective, perfect for sharing with stakeholders or for your weekly team meetings."
                                        },
                                        {
                                            title: "Focus on Impact",
                                            desc: "Spend less time on administrative overhead and more time on the high-impact work that actually drives results."
                                        }
                                    ].map((item, i) => (
                                        <div key={i} className="flex gap-4">
                                            <div className="mt-1 h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold mb-1">{item.title}</h3>
                                                <p className="text-muted-foreground text-sm leading-relaxed">{item.desc}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Right Mock UI */}
                            <div className="flex-1 w-full">
                                <div className="rounded-xl border border-border bg-card shadow-2xl p-6 text-xs md:text-sm font-mono leading-relaxed relative overflow-hidden">
                                    {/* Header */}
                                    <div className="flex items-center gap-2 mb-4 border-b border-border pb-4">
                                        <Sparkles className="h-4 w-4 text-primary" />
                                        <span className="font-bold">AI Weekly Review</span>
                                        <div className="ml-auto flex gap-1.5">
                                            <div className="h-2.5 w-2.5 rounded-full bg-red-500/20"></div>
                                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-500/20"></div>
                                            <div className="h-2.5 w-2.5 rounded-full bg-green-500/20"></div>
                                        </div>
                                    </div>

                                    {/* Content */}
                                    <div className="space-y-6 opacity-90">
                                        <div>
                                            <p className="text-muted-foreground mb-1">Analysis for "Successfully launch OKRFocusPro..."</p>
                                            <p className="text-muted-foreground/60 text-[10px]">Nov 1, 2025 to Nov 7, 2025</p>
                                        </div>

                                        <div>
                                            <h4 className="font-bold mb-2">Overall Summary</h4>
                                            <p className="text-muted-foreground">
                                                This week showed promising initial momentum for the 'Secure 50 unique media mentions' Key Result, with 12 mentions already secured by Rui Lewis. However, a significant blocker emerged for the 'Execute Proactive Media Pitching' task.
                                            </p>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <h4 className="font-bold mb-2 flex items-center gap-2 text-green-500">
                                                    <CheckCircle2 className="h-3 w-3" /> What's Going Well
                                                </h4>
                                                <ul className="list-disc list-outside ml-4 space-y-1 text-muted-foreground text-[10px] md:text-xs">
                                                    <li>Rui Lewis secured 12 unique media mentions.</li>
                                                    <li>Comprehensive Media Outreach Strategy received CMIO approval.</li>
                                                    <li>Logged 25 target media contacts.</li>
                                                </ul>
                                            </div>
                                            <div>
                                                <h4 className="font-bold mb-2 flex items-center gap-2 text-yellow-500">
                                                    <ShieldCheck className="h-3 w-3" /> Where We're Struggling
                                                </h4>
                                                <ul className="list-disc list-outside ml-4 space-y-1 text-muted-foreground text-[10px] md:text-xs">
                                                    <li>Confusion regarding 'Execute Proactive Media Pitching' task.</li>
                                                    <li>Potential delay in 'Develop Comprehensive Media Outreach' phase.</li>
                                                </ul>
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-bold mb-2">Detailed Activities</h4>
                                            <div className="space-y-2 text-[10px] md:text-xs text-muted-foreground">
                                                <div className="flex gap-2">
                                                    <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />
                                                    <span>Rui Lewis updated progress on Task 'Develop Comprehensive Media Outreach Strategy & Kit': CMIO approval received.</span>
                                                </div>
                                                <div className="flex gap-2">
                                                    <ArrowRight className="h-3 w-3 shrink-0 mt-0.5 opacity-50" />
                                                    <span>Rui Lewis updated progress on KR "Secure 50 unique media mentions": value set to 12.</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section id="features" className="py-24 bg-background">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4 text-foreground">
                                Everything You Need for Strategic Execution
                            </h2>
                            <p className="text-lg text-muted-foreground">
                                From goal setting to real-time progress tracking, OKR Focus provides a comprehensive suite
                                of tools to keep your team aligned and moving forward.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: FileText,
                                    title: "Core OKR Management",
                                    desc: "Intuitive interface to create, edit, and visualize the hierarchy of Objectives, Key Results, and Tasks."
                                },
                                {
                                    icon: PieChart,
                                    title: "Real-time Progress Tracking",
                                    desc: "Clear, visual progress bars and dashboards that update automatically as team members complete their work."
                                },
                                {
                                    icon: Link,
                                    title: "Integrated Task Management",
                                    desc: "Link specific tasks directly to Key Results, ensuring every action is tied to a measurable outcome."
                                },
                                {
                                    icon: MessageSquare,
                                    title: "Collaborative Hub",
                                    desc: "In-context conversations with @mentions and email notifications keep teams aligned and unblocked."
                                },
                                {
                                    icon: Library,
                                    title: "Centralized Knowledge Library",
                                    desc: "Store your company's mission, vision, and strategic documents, which the AI uses for context."
                                },
                                {
                                    icon: Star,
                                    title: "Sophisticated & Focused Design",
                                    desc: "A clean, professional UI designed for focus and clarity, appealing to modern tech teams."
                                }
                            ].map((feature, i) => (
                                <div key={i} className="bg-card border border-border rounded-xl p-8 hover:shadow-lg transition-all duration-300 group">
                                    <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-6 transition-colors group-hover:bg-primary/20">
                                        <feature.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-3 text-foreground">{feature.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base">
                                        {feature.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Proven Impact Section */}
                <section className="py-24 bg-muted/20">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Proven Impact & Growth</h2>
                            <p className="text-lg text-muted-foreground">
                                Key metrics from teams growing using OKR Focus.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-8">
                            {[
                                {
                                    icon: ShieldCheck,
                                    title: "Trusted by 100+ Teams",
                                    desc: "Across various industries"
                                },
                                {
                                    icon: Lightbulb,
                                    title: "1,500+ OKRs Drafted",
                                    desc: "By AI last month"
                                },
                                {
                                    icon: TrendingUp,
                                    title: "3x Faster Alignment",
                                    desc: "Average goal-setting time reduced with AI assistance."
                                }
                            ].map((item, i) => (
                                <div key={i} className="bg-card border border-border p-8 rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col items-center text-center">
                                    <div className="h-12 w-12 text-primary mb-6">
                                        <item.icon className="h-full w-full" />
                                    </div>
                                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-muted-foreground leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Pricing Section */}
                <section className="py-24 bg-background border-t border-border/50">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Pricing Plans</h2>
                            <p className="text-lg text-muted-foreground mb-8">
                                Choose the plan that's right for your team's ambition.
                            </p>

                            {/* Billing Toggle */}
                            <div className="flex items-center justify-center gap-4">
                                <span className={`text-sm font-medium ${!isYearly ? 'text-primary' : 'text-muted-foreground'}`}>Monthly</span>
                                <button
                                    onClick={() => setIsYearly(!isYearly)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 ${isYearly ? 'bg-primary' : 'bg-muted'}`}
                                >
                                    <span
                                        className={`${isYearly ? 'translate-x-6' : 'translate-x-1'
                                            } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                                    />
                                </button>
                                <span className={`text-sm font-medium ${isYearly ? 'text-primary' : 'text-muted-foreground'}`}>
                                    Yearly (Save 16%)
                                </span>
                            </div>
                        </div>

                        <div className="grid lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
                            {/* Free Plan */}
                            <div className="bg-card border border-border rounded-xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <User className="h-5 w-5 text-primary" />
                                    <h3 className="text-xl font-bold">Free</h3>
                                </div>
                                <p className="text-muted-foreground text-sm mb-6 h-10">
                                    For individuals and small projects getting started with OKRs.
                                </p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">$0</span>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {[
                                        "1 User",
                                        "Core OKR Management",
                                        "AI Objective Recommendations",
                                        "AI-Powered OKR Quality Review",
                                        "100 AI Credits per month"
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-lg font-medium transition-colors cursor-pointer">
                                    Get Started
                                </button>
                            </div>

                            {/* Team Plan */}
                            <div className="bg-card border-2 border-primary rounded-xl p-8 shadow-xl relative scale-105 z-10 flex flex-col">
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-xs font-bold">
                                    MOST POPULAR
                                </div>
                                <div className="flex items-center gap-3 mb-4">
                                    <Users className="h-5 w-5 text-primary" />
                                    <h3 className="text-xl font-bold">Team</h3>
                                </div>
                                <p className="text-muted-foreground text-sm mb-6 h-10">
                                    For growing teams who need to collaborate, align, and execute on strategic goals.
                                </p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">${isYearly ? '24' : '29'}</span>
                                    <span className="text-muted-foreground"> / month</span>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {[
                                        "All features in Free",
                                        "Up to 5 users",
                                        "Team Management",
                                        "Centralized Knowledge Library",
                                        "1000 AI Credits per month (pooled)",
                                        "Priority email support"
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-lg font-medium transition-colors cursor-pointer">
                                    Get Started
                                </button>
                            </div>

                            {/* Enterprise Plan */}
                            <div className="bg-card border border-border rounded-xl p-8 shadow-sm hover:shadow-md transition-all flex flex-col">
                                <div className="flex items-center gap-3 mb-4">
                                    <Building className="h-5 w-5 text-primary" />
                                    <h3 className="text-xl font-bold">Enterprise</h3>
                                </div>
                                <p className="text-muted-foreground text-sm mb-6 h-10">
                                    For larger organizations requiring advanced features and dedicated support.
                                </p>
                                <div className="mb-6">
                                    <span className="text-4xl font-bold">${isYearly ? '49' : '59'}</span>
                                    <span className="text-muted-foreground"> / month</span>
                                </div>
                                <ul className="space-y-3 mb-8 flex-1">
                                    {[
                                        "All features in Team",
                                        "Up to 20 users",
                                        "Advanced Security Options (Coming Soon)",
                                        "Dedicated Support Channel",
                                        "5000 AI Credits per month (pooled)"
                                    ].map((feature, i) => (
                                        <li key={i} className="flex items-start gap-3 text-sm text-foreground">
                                            <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                                            <span>{feature}</span>
                                        </li>
                                    ))}
                                </ul>
                                <button className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-lg font-medium transition-colors cursor-pointer">
                                    Get Started
                                </button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Coming Soon Section */}
                <section className="py-24 bg-muted/20">
                    <div className="container mx-auto px-4">
                        <div className="text-center max-w-3xl mx-auto mb-16">
                            <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Coming Soon</h2>
                            <p className="text-lg text-muted-foreground">
                                We're always working to make OKR Focus more powerful. Here's a sneak peek at what's next.
                            </p>
                        </div>

                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                {
                                    icon: Puzzle,
                                    title: "Chrome Extension",
                                    desc: "Log progress and get quick updates without ever leaving your browser."
                                },
                                {
                                    icon: Workflow,
                                    title: "Third-Party Integrations",
                                    desc: "Export your OKR data directly to Jira, Asana, and Todoist."
                                },
                                {
                                    icon: BrainCircuit,
                                    title: "Dynamic LLM Models",
                                    desc: "Choose the AI model that best fits your needs, from speed to power."
                                },
                                {
                                    icon: History,
                                    title: "AI Retrospectives",
                                    desc: "Generate insights from completed OKRs to learn and improve for the next cycle."
                                }
                            ].map((item, i) => (
                                <div key={i} className="bg-muted/10 border border-border/50 rounded-xl p-6 hover:bg-muted/20 transition-colors">
                                    <div className="h-10 w-10 text-primary mb-4">
                                        <item.icon className="h-full w-full" />
                                    </div>
                                    <h3 className="text-lg font-bold mb-2">{item.title}</h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                        {item.desc}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                <FAQSection />

                <NewsletterSection />

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
        </div>
    );
}

// Internal component for the simulated streaming UI
function SimulatedStreamingUI() {
    // We want a continuous loop: Blank -> Type 1 -> Type 2 -> Done -> Blank
    const [cycleKey, setCycleKey] = useState(0);

    useEffect(() => {
        const timer = setInterval(() => {
            setCycleKey(c => c + 1);
        }, 8000); // Restart every 8 seconds
        return () => clearInterval(timer);
    }, []);

    return (
        <div key={cycleKey} className="relative rounded-2xl border border-border bg-card shadow-2xl p-6 md:p-8 overflow-hidden min-h-[400px]">
            {/* Fake UI Elements */}
            <div className="flex items-center justify-between mb-8 border-b border-border pb-4">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">Strategic Analyst</span>
                            <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                <Typewriter text="Processing..." speed={100} />
                            </span>
                        </div>
                        <div className="text-xs text-muted-foreground flex items-center gap-1">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                            </span>
                            Active Monitoring
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Item 1 - Appears after delay */}
                <DelayedItem delay={800}>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 h-5 w-5 rounded-full bg-yellow-500/10 flex items-center justify-center shrink-0">
                                <ShieldCheck className="h-3 w-3 text-yellow-500" />
                            </div>
                            <div className="space-y-2 w-full">
                                <p className="text-sm font-medium">Potential Misalignment Detected</p>
                                <div className="text-xs text-muted-foreground leading-relaxed h-12">
                                    <Typewriter
                                        text='The new marketing initiative "Brand Omni" conflicts with Q3 Resource Allocation protocols.'
                                        delay={1200}
                                        speed={30}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </DelayedItem>

                {/* Item 2 - Appears after delay */}
                <DelayedItem delay={4500}>
                    <div className="p-4 rounded-xl bg-muted/40 border border-border/50">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                                <Zap className="h-3 w-3 text-green-500" />
                            </div>
                            <div className="space-y-2 w-full">
                                <p className="text-sm font-medium">Optimization Opportunity</p>
                                <div className="text-xs text-muted-foreground leading-relaxed h-12">
                                    <Typewriter
                                        text='Based on current velocity, 3 Key Results can be accelerated by reassigning 2 idle tasks from Backlog.'
                                        delay={4700}
                                        speed={30}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </DelayedItem>
            </div>

            <DelayedItem delay={7500}>
                <div className="absolute bottom-6 right-6 bg-background border border-border p-3 rounded-xl shadow-xl flex items-center gap-3 animate-in zoom-in duration-300">
                    <div className="flex -space-x-2">
                        <div className="h-6 w-6 rounded-full border-2 border-background bg-slate-200"></div>
                        <div className="h-6 w-6 rounded-full border-2 border-background bg-slate-300"></div>
                        <div className="h-6 w-6 rounded-full border-2 border-background bg-slate-300"></div>
                    </div>
                    <div>
                        <p className="text-xs font-medium">Team Aligned</p>
                    </div>
                </div>
            </DelayedItem>
        </div>
    );
}

function DelayedItem({ children, delay }: { children: React.ReactNode, delay: number }) {
    const [visible, setVisible] = useState(false);
    useEffect(() => {
        const timer = setTimeout(() => setVisible(true), delay);
        return () => clearTimeout(timer);
    }, [delay]);

    if (!visible) return null;
    return <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">{children}</div>;
}

function Typewriter({ text, delay = 0, speed = 50 }: { text: string, delay?: number, speed?: number }) {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        const startTimeout = setTimeout(() => {
            let index = 0;
            const interval = setInterval(() => {
                if (index < text.length) {
                    setDisplayedText((prev) => text.slice(0, index + 1));
                    index++;
                } else {
                    clearInterval(interval);
                }
            }, speed);
            return () => clearInterval(interval);
        }, delay);

        return () => clearTimeout(startTimeout);
    }, [text, delay, speed]);

    return (
        <span>
            {displayedText}
            {displayedText.length < text.length && <span className="animate-pulse inline-block ml-0.5 h-3 w-1 bg-primary align-middle"></span>}
        </span>
    );
}

function FeatureCarousel() {
    const [activeIndex, setActiveIndex] = useState(0);

    const features = [
        {
            title: "Context-Aware Suggestions",
            desc: "Upload your strategy docs, and the AI will generate relevant OKRs, ensuring your team's work is always tied to the bigger picture.",
            image: "/feature-context-aware.png"
        },
        {
            title: "Clear Visual Hierarchy",
            desc: "Instantly see how tasks roll up to Key Results, and how Key Results contribute to high-level Objectives and company Goals.",
            image: "/feature-visual-hierarchy.png"
        },
        {
            title: "Automated Task Breakdowns",
            desc: "Once a Key Result is defined, let the AI suggest a list of actionable tasks to get your team started immediately.",
            image: "/feature-task-breakdowns.png"
        }
    ];

    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % features.length);
        }, 8000); // Cycle every 8 seconds

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 items-center">
            {/* Left side: Image Display */}
            <div className="flex-1 w-full order-2 lg:order-1">
                <div className="relative rounded-xl border border-border bg-card shadow-2xl overflow-hidden aspect-[4/3] group">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${activeIndex === index ? 'opacity-100 z-10' : 'opacity-0 z-0'
                                }`}
                        >
                            <img
                                src={feature.image}
                                alt={feature.title}
                                className="w-full h-full object-cover object-top"
                            />
                        </div>
                    ))}

                    {/* Overlay gradient to help blend if needed */}
                    <div className="absolute inset-0 ring-1 ring-white/10 pointer-events-none z-20"></div>
                </div>
            </div>

            {/* Right side: Feature List */}
            <div className="flex-1 w-full order-1 lg:order-2 space-y-8">
                {features.map((feature, index) => (
                    <div
                        key={index}
                        className={`p-6 rounded-xl transition-all duration-500 cursor-pointer border ${activeIndex === index
                            ? 'bg-primary/5 border-primary/20 shadow-sm scale-[1.02]'
                            : 'bg-transparent border-transparent hover:bg-muted/30'
                            }`}
                        onClick={() => setActiveIndex(index)}
                    >
                        <div className="flex items-start gap-4">
                            <div className={`mt-1 h-6 w-6 rounded-full flex items-center justify-center shrink-0 transition-colors ${activeIndex === index ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                                }`}>
                                <CheckCircle2 className="h-4 w-4" />
                            </div>
                            <div>
                                <h3 className={`text-xl font-bold mb-2 ${activeIndex === index ? 'text-primary' : 'text-foreground'
                                    }`}>
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground leading-relaxed">
                                    {feature.desc}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function FAQSection() {
    const [openIndex, setOpenIndex] = useState<number | null>(0);

    const faqs = [
        {
            question: "What are AI Credits?",
            answer: "AI Credits are the currency used to power the generative features of OKR Focus. Every time you ask the AI to draft an objective, analyze a risk, or generate a weekly report, it consumes a small number of credits. Our plans are designed to provide ample credits for typical usage patterns."
        },
        {
            question: "Can I change my plan later?",
            answer: "Yes, absolutely. You can upgrade or downgrade your plan at any time from your account settings. Upgrades take effect immediately with pro-rated billing, while downgrades are applied at the end of your current billing cycle."
        },
        {
            question: "Is my data secure?",
            answer: "Security is our top priority. We use industry-standard encryption for all data in transit and at rest. Your strategic documents and OKR data are stored in secure, isolated environments and are never used to train public AI models. We are currently working towards SOC 2 compliance."
        },
        {
            question: "What makes OKR Focus different from other project management tools?",
            answer: "Unlike traditional project management tools that focus on 'outputs' (tasks completed), OKR Focus is built around 'outcomes' (results achieved). Our AI actively monitors the alignment between your daily tasks and your high-level strategy, alerting you to risks and misalignments that other tools miss."
        },
        {
            question: "Do you offer a trial for the paid plans?",
            answer: "Yes! We offer a full-featured 14-day free trial for both our Team and Enterprise plans. No credit card is required to start, so you can experience the power of AI-driven strategy execution risk-free."
        }
    ];

    return (
        <section className="py-24 bg-background border-t border-border/50">
            <div className="container mx-auto px-4 max-w-3xl">
                <div className="text-center mb-16">
                    <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Frequently Asked Questions</h2>
                    <p className="text-lg text-muted-foreground">
                        Have questions? We have answers. If you can't find what you're looking for, feel free to contact us.
                    </p>
                </div>

                <div className="space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="border border-border/50 rounded-xl overflow-hidden bg-card transition-all duration-200 hover:border-border"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full flex items-center justify-between p-6 text-left focus:outline-none"
                            >
                                <span className={`text-lg font-medium ${openIndex === index ? 'text-primary' : 'text-foreground'}`}>
                                    {faq.question}
                                </span>
                                <ChevronDown
                                    className={`h-5 w-5 text-muted-foreground transition-transform duration-200 ${openIndex === index ? 'rotate-180 text-primary' : ''}`}
                                />
                            </button>
                            <div
                                className={`overflow-hidden transition-all duration-300 ease-in-out ${openIndex === index ? 'max-h-48 opacity-100' : 'max-h-0 opacity-0'
                                    }`}
                            >
                                <div className="p-6 pt-0 text-muted-foreground leading-relaxed">
                                    {faq.answer}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function NewsletterSection() {
    return (
        <section className="py-24 bg-muted/20">
            <div className="container mx-auto px-4">
                <div className="text-center max-w-2xl mx-auto">
                    <h2 className="text-3xl lg:text-4xl font-bold tracking-tight mb-4">Subscribe to Our Newsletter</h2>
                    <p className="text-lg text-muted-foreground mb-8">
                        Stay up to date with the latest features, OKR strategies, and product announcements.
                    </p>
                    <form className="flex flex-col sm:flex-row gap-4 max-w-md mx-auto" onSubmit={(e) => e.preventDefault()}>
                        <input
                            type="email"
                            placeholder="Enter your email"
                            className="flex-1 bg-background border border-border rounded-md px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                            required
                        />
                        <button
                            type="submit"
                            className="bg-primary text-primary-foreground hover:bg-primary/90 px-6 py-2 rounded-md text-sm font-medium transition-colors"
                        >
                            Subscribe
                        </button>
                    </form>
                </div>
            </div>
        </section>
    );
}

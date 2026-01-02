import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { X, Loader2, Sparkles, ArrowRight, Check, Target, FileText } from 'lucide-react';
import { useOKRStore } from '@/store/useOKRStore';
import { OrganizationDocument } from '@/types';

interface StrategyModalProps {
    isOpen: boolean;
    onClose: () => void;
}

type Phase = 'discovery' | 'interview' | 'architecture' | 'calibration' | 'execution';

// --- TYPES ---
interface AIResponse_Discovery {
    analysis: string | null;
    questions: string[] | null;
    rejectionMessage: string | null;
}
interface AIResponse_Architecture {
    summary: string;
    objectives: {
        title: string;
        description: string;
        recommendationLevel: string;
        pillar: string;
    }[];
}
interface AIResponse_Calibration {
    objectives: {
        originalTitle: string;
        description?: string;
        keyResults: {
            metricName: string;
            benchmarkContext: string;
            unit: string;
            baselineQuestion: string;
        }[];
    }[];
}
interface AIResponse_Execution {
    plan: {
        krTitle: string;
        krDescription?: string;
        tasks: { title: string; description: string; estimatedHours: number }[];
    }[];
}

export function StrategyConsultantModal({ isOpen, onClose }: StrategyModalProps) {
    // --- STORE & STATE ---
    const { fetchNodes } = useOKRStore();
    const [phase, setPhase] = useState<Phase>('discovery');
    const [loading, setLoading] = useState(false);
    const [loadingPhase, setLoadingPhase] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Phase 2: Architecture
    const [proposedObjectives, setProposedObjectives] = useState<AIResponse_Architecture['objectives']>([]);
    const [selectedObjectiveIndices, setSelectedObjectiveIndices] = useState<number[]>([]);

    // Phase 3: Calibration
    const [calibratedKRs, setCalibratedKRs] = useState<AIResponse_Calibration['objectives']>([]);
    const [userBaselines, setUserBaselines] = useState<Record<string, string>>({}); // metricName -> value

    // Phase 4: Execution
    const [finalPlan, setFinalPlan] = useState<AIResponse_Execution['plan']>([]);

    // Context
    const [orgData, setOrgData] = useState<any>(null);
    const [userGoal, setUserGoal] = useState('');
    const [orgStage, setOrgStage] = useState(''); // Default empty to force selection

    // Advanced Context State
    const [additionalContext, setAdditionalContext] = useState(''); // Ad-hoc text
    const [showContextInput, setShowContextInput] = useState(false);

    // Library & Files
    const [libraryDocs, setLibraryDocs] = useState<OrganizationDocument[]>([]);
    const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
    const [uploadedFiles, setUploadedFiles] = useState<{ name: string; content: string }[]>([]);

    // Phase 1: Triage & Interview
    const [triageResult, setTriageResult] = useState<AIResponse_Discovery | null>(null);
    const [interviewAnswers, setInterviewAnswers] = useState<string[]>(['', '', '']);

    // ... (rest of phase states)

    useEffect(() => {
        if (isOpen) {
            loadOrgContext();
            resetState();
        }
    }, [isOpen]);

    // Fetch Library Docs when Org is loaded
    useEffect(() => {
        if (orgData?.id) {
            fetchLibraryDocs(orgData.id);
        }
    }, [orgData]);

    const resetState = () => {
        setPhase('discovery');
        setUserGoal('');
        setOrgStage('');
        setAdditionalContext('');
        setShowContextInput(false);
        setSelectedDocIds(new Set());
        setUploadedFiles([]);
        setTriageResult(null);
        setInterviewAnswers(['', '', '']);
        setProposedObjectives([]);
        setSelectedObjectiveIndices([]);
        setCalibratedKRs([]);
        setUserBaselines({});
        setFinalPlan([]);
        setError(null);
    };

    const loadOrgContext = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: members } = await supabase.from('organization_members').select('organization_id').eq('user_id', user.id).single();
        if (members) {
            const { data: org } = await supabase.from('organizations').select('*').eq('id', members.organization_id).single();
            setOrgData(org);
        }
    };

    const fetchLibraryDocs = async (orgId: string) => {
        const { data, error } = await supabase
            .from('organization_documents')
            .select('*')
            .eq('organization_id', orgId)
            .order('created_at', { ascending: false });

        if (!error && data) {
            const mappedDocs: OrganizationDocument[] = data.map((d: any) => ({
                id: d.id,
                organizationId: d.organization_id,
                uploadedBy: d.uploaded_by,
                name: d.name,
                title: d.title,
                filePath: d.file_path,
                size: d.size,
                type: d.type,
                createdAt: d.created_at,
                summary: d.summary,
                textContent: d.text_content
            }));
            setLibraryDocs(mappedDocs);
        }
    };

    const callAI = async (currentPhase: Phase, payload: any) => {
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase.functions.invoke('strategy-consultant', {
                body: { ...payload, phase: currentPhase }
            });

            if (error) throw error;
            if (data.error) throw new Error(data.error);

            return data.data;
        } catch (err: any) {
            console.error(err);
            setError(err.message || "AI Connection Failed");
            return null;
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLERS ---

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files) return;

        const files = Array.from(e.target.files);

        files.forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target?.result as string;
                setUploadedFiles(prev => [...prev, { name: file.name, content: text }]);
            };
            reader.readAsText(file);
        });
    };

    const toggleDocSelection = (docId: string) => {
        setSelectedDocIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(docId)) {
                newSet.delete(docId);
            } else {
                newSet.add(docId);
            }
            return newSet;
        });
    };

    const startSession = async () => {
        // PERFOMANCE: Combine all context sources
        let combinedContext = additionalContext; // Start with ad-hoc text

        // 1. Append Selected Library Docs
        const selectedDocs = libraryDocs.filter(d => selectedDocIds.has(d.id));
        if (selectedDocs.length > 0) {
            combinedContext += "\n\n=== LIBRARY DOCUMENTS ===\n";
            selectedDocs.forEach(doc => {
                const content = doc.textContent || doc.summary || "(No text content available)";
                combinedContext += `\n--- DOCUMENT: ${doc.title || doc.name} ---\n${content}\n`;
            });
        }

        // 2. Append Uploaded Files
        if (uploadedFiles.length > 0) {
            combinedContext += "\n\n=== UPLOADED FILES ===\n";
            uploadedFiles.forEach(f => {
                combinedContext += `\n--- FILE: ${f.name} ---\n${f.content}\n`;
            });
        }

        const result = await callAI('discovery', {
            context: {
                mission: orgData?.mission_vision,
                companyDescription: orgData?.organization_description,
                productDescription: orgData?.product_description,
                userGoal: userGoal,
                orgStage: orgStage,
                additionalContext: combinedContext
            }
        });

        if (result) {
            setTriageResult(result);
            if (!result.rejectionMessage) {
                setPhase('interview');
            }
        }
    };

    const autoFillZeros = () => {
        const newBaselines = { ...userBaselines };
        calibratedKRs.forEach(obj => {
            obj.keyResults.forEach(kr => {
                if (!newBaselines[kr.metricName]) {
                    newBaselines[kr.metricName] = "0";
                }
            });
        });
        setUserBaselines(newBaselines);
    };

    const submitInterview = async () => {
        const result = await callAI('architecture', {
            context: {
                userGoal: userGoal,
                questions: triageResult?.questions || []
            },
            userAnswers: interviewAnswers
        });

        if (result) {
            setProposedObjectives(result.objectives);
            setPhase('architecture');
        }
    };

    const submitArchitecture = async () => {
        const selectedObjs = selectedObjectiveIndices.map(i => proposedObjectives[i]);
        const result = await callAI('calibration', {
            selectedObjectives: selectedObjs
        });

        if (result) {
            setCalibratedKRs(result.objectives);
            setPhase('calibration');
        }
    };

    const submitCalibration = async () => {
        // Show "Execution" messages while generating tasks
        setLoadingPhase('execution');

        // Merge the user's baselines into the payload
        // We need to map the baselines back to the KRs
        const flatKRs = calibratedKRs.flatMap(obj =>
            obj.keyResults.map(kr => ({
                ...kr,
                parentObj: obj.originalTitle,
                suggestedTarget: userBaselines[kr.metricName] || "0" // Pass baseline as 'suggestedTarget' to match backend expecting it
            }))
        );

        const result = await callAI('execution', {
            selectedKRs: flatKRs
        });

        if (result) {
            setFinalPlan(result.plan);
            setPhase('execution');
        }
        setLoadingPhase(null);
    };

    const saveToDatabase = async () => {
        setLoading(true); // Must match useEffect dependency
        setLoadingPhase('saving');
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user || !orgData) return;

            // 1. Create GOAL (Container)
            const { data: goalData, error: goalError } = await supabase.from('okrs').insert({
                title: userGoal || "Strategic Initiative",
                type: 'GOAL',
                user_id: user.id,
                organization_id: orgData.id,
                status: 'in-progress'
            }).select().single();

            if (goalError) throw goalError;

            // 2. Create Objectives and Children
            for (const objPlan of calibratedKRs) {
                // Create Objective
                const { data: objData, error: objError } = await supabase.from('okrs').insert({
                    title: objPlan.originalTitle,
                    description: objPlan.description || "Strategic Objective generated by AI",
                    type: 'OBJECTIVE',
                    parent_id: goalData.id,
                    user_id: user.id,
                    organization_id: orgData.id,
                    status: 'pending'
                }).select().single();

                if (objError) throw objError;

                // Create KRs
                // Create KRs
                for (const kr of objPlan.keyResults) {
                    // Get the target set by user (or default to 0/100 if missing)
                    const targetValue = userBaselines[kr.metricName] || "100";

                    // Try to match execution plan to get refined title/description
                    // We assume finalPlan is populated if we passed the execution phase
                    const taskPlan = finalPlan ? finalPlan.find(p => p.krTitle.includes(kr.metricName)) : undefined;

                    const krTitle = taskPlan ? taskPlan.krTitle : `${kr.metricName}: ${targetValue}`;
                    const krDescription = taskPlan?.krDescription || `Achieve ${targetValue} in ${kr.metricName}`;

                    const { data: krData, error: krError } = await supabase.from('okrs').insert({
                        title: krTitle,
                        description: krDescription,
                        type: 'KEY_RESULT',
                        parent_id: objData.id,
                        user_id: user.id,
                        organization_id: orgData.id,
                        status: 'pending',
                        metric_unit: kr.unit,
                        // Best effort parsing of target value
                        metric_target: parseInt(targetValue.replace(/[^0-9]/g, '')) || 100
                    }).select().single();

                    if (krError) throw krError;

                    // Create Tasks if plan found
                    if (taskPlan) {
                        for (const task of taskPlan.tasks) {
                            await supabase.from('okrs').insert({
                                title: task.title,
                                description: task.description,
                                type: 'TASK',
                                parent_id: krData.id,
                                user_id: user.id,
                                organization_id: orgData.id,
                                status: 'pending',
                                estimated_hours: task.estimatedHours
                            });
                        }
                    }
                }
            }

            await fetchNodes(); // Refresh Store
            onClose();
        } catch (e: any) {
            alert("Failed to save plan: " + e.message);
        } finally {
            setLoading(false);
            setLoadingPhase(null);
        }
    };

    const [loadingMessage, setLoadingMessage] = useState("Consultant is thinking...");

    // Dynamic Loading Messages
    useEffect(() => {
        if (!loading) return;

        const messages: Record<string, string[]> = {
            discovery: [
                "Analyzing your context...",
                "Reviewing organizational goals...",
                "Identifying key constraints...",
                "Formulating triage strategy..."
            ],
            interview: [
                "Processing your answers...",
                "Connecting strategic dots...",
                "Detecting potential trade-offs...",
                "Drafting synthesis..."
            ],
            architecture: [
                "Designing strategic pillars...",
                "Applying Balanced Scorecard...",
                "Aligning with your theme...",
                "Constructing objectives..."
            ],
            calibration: [
                "Identifying leading indicators...",
                "Calculating healthy baselines...",
                "Retrieving benchmark data...",
                "Finalizing metric selection..."
            ],
            execution: [
                "Translating to targets...",
                "Building execution roadmap...",
                "Generating task list...",
                "Finalizing OKR plan..."
            ],
            saving: [
                "Saving Strategy to Dashboard...",
                "Creating Objectives & Key Results...",
                "Assigning Tasks to Roadmap...",
                "Finalizing Database Updates..."
            ]
        };

        const activePhase = loadingPhase || phase;
        const currentMessages = messages[activePhase] || messages['discovery'];
        let index = 0;

        setLoadingMessage(currentMessages[0]);

        const interval = setInterval(() => {
            index = (index + 1) % currentMessages.length;
            setLoadingMessage(currentMessages[index]);
        }, 2000);

        return () => clearInterval(interval);
    }, [loading, phase, loadingPhase]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-[90vw] max-w-4xl h-[85vh] bg-background border border-border shadow-lg rounded-xl flex flex-col overflow-hidden">

                {/* Header */}
                <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-muted/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Sparkles className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="font-semibold text-lg">AI Strategy Consultant</h2>
                            <p className="text-xs text-muted-foreground">Phase: {phase.charAt(0).toUpperCase() + phase.slice(1)}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-full transition-colors">
                        <X className="w-5 h-5 text-muted-foreground" />
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto p-8 relative">
                    {loading && (
                        <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] z-10 flex items-center justify-center transition-all duration-300">
                            <div className="flex flex-col items-center gap-4 p-6 rounded-2xl bg-card border border-border shadow-xl min-w-[300px]">
                                <Loader2 className="w-10 h-10 text-primary animate-spin" />
                                <p className="text-base font-medium animate-pulse text-center min-w-[200px] transition-all duration-300">
                                    {loadingMessage}
                                </p>
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-500 text-sm">
                            {error}
                        </div>
                    )}

                    {/* PHASE 1: DISCOVERY & TRIAGE */}
                    {phase === 'discovery' && (
                        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center space-y-2 mb-8">
                                <h1 className="text-3xl font-bold tracking-tight">Let's Build Your Strategy</h1>
                                <p className="text-muted-foreground">
                                    I'll act as your Strategy Partner. Before we start, what is the primary goal or focus area you want to address today?
                                </p>
                            </div>

                            {/* REJECTION MESSAGE DISPLAY */}
                            {triageResult?.rejectionMessage ? (
                                <div className="bg-yellow-500/10 border border-yellow-500/20 p-6 rounded-xl space-y-4">
                                    <div className="flex items-start gap-3">
                                        <div className="p-2 bg-yellow-500/20 rounded-full">
                                            <Sparkles className="w-5 h-5 text-yellow-600" />
                                        </div>
                                        <div className="space-y-2">
                                            <h3 className="font-semibold text-lg text-yellow-700 dark:text-yellow-400">Let's refine that first.</h3>
                                            <p className="text-sm text-yellow-800 dark:text-yellow-300 leading-relaxed">
                                                {triageResult.rejectionMessage}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="pt-2">
                                        <label className="text-sm font-medium ml-1">Try again with more context:</label>
                                        <input
                                            type="text"
                                            value={userGoal}
                                            onChange={(e) => setUserGoal(e.target.value)}
                                            placeholder="e.g. Instead of 'Grow', try 'Grow revenue by expanding into the Enterprise market'"
                                            className="w-full text-lg p-4 mt-2 rounded-xl border border-border bg-background focus:ring-2 focus:ring-primary focus:outline-none"
                                        />
                                        <button
                                            onClick={startSession}
                                            disabled={!userGoal.trim() || loading}
                                            className="w-full mt-4 py-3 font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all"
                                        >
                                            Retry <ArrowRight className="w-4 h-4 inline ml-2" />
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                /* NORMAL INPUT */
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-sm font-medium ml-1">Focus Area / High Level Goal</label>
                                        <input
                                            type="text"
                                            value={userGoal}
                                            onChange={(e) => setUserGoal(e.target.value)}
                                            placeholder="e.g. 'Scale our Enterprise Sales' or 'Launch Product 2.0'"
                                            className="w-full text-lg p-4 rounded-xl border border-border bg-muted/30 focus:ring-2 focus:ring-primary focus:outline-none"
                                        />
                                        {/* ORG STAGE SELECTOR */}
                                        <div>
                                            <label className="text-sm font-medium ml-1">Organization Stage</label>
                                            <select
                                                value={orgStage}
                                                onChange={(e) => setOrgStage(e.target.value)}
                                                className={`w-full p-4 rounded-xl border bg-muted/30 focus:ring-2 focus:ring-primary focus:outline-none appearance-none ${!orgStage ? 'text-muted-foreground border-destructive/50' : 'border-border'}`}
                                            >
                                                <option value="" disabled>Select Organization Stage (Required)...</option>
                                                <option value="Idea">Idea Stage (Pre-Product)</option>
                                                <option value="Pre-Revenue">Pre-Revenue / MVP</option>
                                                <option value="Growth">Growth (Post-PMF)</option>
                                                <option value="Scale">Scale / Enterprise</option>
                                            </select>
                                        </div>

                                        {/* ADDITIONAL CONTEXT TOGGLE */}
                                        <div className="border border-border rounded-xl overflow-hidden">
                                            <button
                                                onClick={() => setShowContextInput(!showContextInput)}
                                                className="w-full flex items-center justify-between p-4 bg-muted/30 hover:bg-muted/50 transition-colors"
                                            >
                                                <span className="text-sm font-medium flex items-center gap-2">
                                                    <FileText className="w-4 h-4 text-primary" />
                                                    Add Context (Library, Files, Notes)
                                                </span>
                                                {showContextInput ? <span className="text-xs">Hide</span> : <span className="text-xs">+ Expand</span>}
                                            </button>

                                            {showContextInput && (
                                                <div className="p-4 space-y-4 bg-background animate-in fade-in slide-in-from-top-1">

                                                    {/* 1. LIBRARY DOCS */}
                                                    {libraryDocs.length > 0 && (
                                                        <div className="space-y-2">
                                                            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">From Library</label>
                                                            <div className="max-h-32 overflow-y-auto space-y-1 border border-border rounded-md p-2 bg-muted/10">
                                                                {libraryDocs.map(doc => (
                                                                    <div key={doc.id} className="flex items-center gap-2 p-1.5 hover:bg-accent rounded cursor-pointer" onClick={() => toggleDocSelection(doc.id)}>
                                                                        <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedDocIds.has(doc.id) ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground'}`}>
                                                                            {selectedDocIds.has(doc.id) && <Check className="w-3 h-3" />}
                                                                        </div>
                                                                        <span className="text-sm truncate flex-1">{doc.title || doc.name}</span>
                                                                        <span className="text-[10px] text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {/* 2. FILE UPLOADS */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Upload Files</label>

                                                        {uploadedFiles.length > 0 && (
                                                            <div className="flex flex-wrap gap-2 mb-2">
                                                                {uploadedFiles.map((f, idx) => (
                                                                    <div key={idx} className="text-xs bg-muted px-2 py-1 rounded-md flex items-center gap-1 border border-border">
                                                                        <span className="max-w-[150px] truncate">{f.name}</span>
                                                                        <button
                                                                            onClick={() => setUploadedFiles(prev => prev.filter((_, i) => i !== idx))}
                                                                            className="hover:text-destructive"
                                                                        >
                                                                            <X className="w-3 h-3" />
                                                                        </button>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <label className="cursor-pointer bg-muted hover:bg-muted/80 text-xs font-medium px-3 py-2 rounded-md border border-border transition-colors flex items-center gap-2 w-fit">
                                                            <input
                                                                type="file"
                                                                multiple
                                                                accept=".txt,.md,.json,.csv"
                                                                onChange={handleFileUpload}
                                                                className="hidden"
                                                            />
                                                            <span>+ Attach Files (Txt, MD, JSON)</span>
                                                        </label>
                                                    </div>

                                                    {/* 3. AD-HOC NOTES */}
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Specific Notes</label>
                                                        <textarea
                                                            value={additionalContext}
                                                            onChange={(e) => setAdditionalContext(e.target.value)}
                                                            placeholder="Paste specific context, constraints, or strategy notes here..."
                                                            className="w-full p-3 rounded-lg border border-border bg-muted/20 text-sm focus:ring-2 focus:ring-primary focus:outline-none min-h-[80px]"
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        <div className="bg-muted/30 p-4 rounded-xl border border-border space-y-2">
                                            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Context Loaded</h4>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span>Mission: {orgData?.mission_vision ? 'Detected' : 'Not Found'}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Check className="w-4 h-4 text-green-500" />
                                                <span>Product Description: {orgData?.product_description ? 'Detected' : 'Not Found'}</span>
                                            </div>
                                        </div>

                                        <button
                                            onClick={startSession}
                                            disabled={!userGoal.trim() || !orgStage || loading}
                                            className="w-full py-4 text-lg font-semibold bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            Start Strategy Session <ArrowRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* PHASE 2: INTERVIEW (If proceeding) */}
                    {phase === 'interview' && triageResult && !triageResult.rejectionMessage && (
                        <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
                                <h4 className="flex items-center gap-2 font-semibold text-blue-600 dark:text-blue-400 mb-1">
                                    <Sparkles className="w-4 h-4" /> Consultant Analysis
                                </h4>
                                <p className="text-sm opacity-90 leading-relaxed">{triageResult.analysis}</p>
                            </div>

                            <h3 className="text-xl font-semibold">I have {triageResult.questions?.length || 0} questions to clarify your strategy:</h3>

                            <div className="space-y-6">
                                {triageResult.questions?.map((q, idx) => (
                                    <div key={idx} className="space-y-3">
                                        <p className="font-medium text-lg leading-relaxed">{idx + 1}. {q}</p>
                                        <textarea
                                            value={interviewAnswers[idx]}
                                            onChange={(e) => {
                                                const newAnswers = [...interviewAnswers];
                                                newAnswers[idx] = e.target.value;
                                                setInterviewAnswers(newAnswers);
                                            }}
                                            placeholder="Your answer..."
                                            className="w-full p-3 rounded-lg border border-border bg-muted/30 focus:ring-2 focus:ring-primary focus:outline-none min-h-[80px]"
                                        />
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={submitInterview}
                                disabled={interviewAnswers.slice(0, triageResult.questions?.length || 0).some(a => !a.trim()) || loading}
                                className="w-full py-3 font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                Generate Strategy <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* PHASE 3: ARCHITECTURE */}
                    {phase === 'architecture' && (
                        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center mb-6">
                                <h3 className="text-2xl font-bold">Proposed Strategic Pillars</h3>
                                <p className="text-muted-foreground">I've designed a Balanced Scorecard for you. Select the objectives you want to pursue.</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {proposedObjectives.map((obj, idx) => (
                                    <div
                                        key={idx}
                                        onClick={() => {
                                            if (selectedObjectiveIndices.includes(idx)) {
                                                setSelectedObjectiveIndices(selectedObjectiveIndices.filter(i => i !== idx));
                                            } else {
                                                setSelectedObjectiveIndices([...selectedObjectiveIndices, idx]);
                                            }
                                        }}
                                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all relative ${selectedObjectiveIndices.includes(idx)
                                            ? 'border-primary bg-primary/5'
                                            : 'border-border hover:border-primary/50'
                                            }`}
                                    >
                                        <div className="absolute top-4 right-4 text-xs font-bold text-muted-foreground bg-muted px-2 py-1 rounded">
                                            {obj.pillar}
                                        </div>
                                        <div className="flex justify-between items-start mb-2 pr-12">
                                            <h4 className="font-bold text-lg leading-tight">{obj.title}</h4>
                                        </div>
                                        <p className="text-sm text-foreground/80 mb-3">{obj.description}</p>

                                        {selectedObjectiveIndices.includes(idx) && (
                                            <div className="absolute bottom-4 right-4 flex items-center gap-1 text-primary text-sm font-medium">
                                                <Check className="w-4 h-4" /> Selected
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={submitArchitecture}
                                disabled={selectedObjectiveIndices.length === 0 || loading}
                                className="w-full py-3 font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50 mt-4"
                            >
                                Calibrate Metrics for Selected ({selectedObjectiveIndices.length}) <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* PHASE 4: CALIBRATION */}
                    {phase === 'calibration' && (
                        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center relative">
                                <h3 className="text-2xl font-bold">Metric Calibration</h3>
                                <p className="text-muted-foreground">I've identified the "Source of Truth" metrics. Please provide your current baseline.</p>
                                <button
                                    onClick={autoFillZeros}
                                    className="absolute right-0 top-0 text-xs bg-muted hover:bg-muted/80 px-2 py-1 rounded border border-border transition-colors hidden md:block"
                                >
                                    Auto-fill "0" (Zero-to-One)
                                </button>
                            </div>

                            {calibratedKRs.map((obj, i) => (
                                <div key={i} className="border border-border rounded-xl overflow-hidden bg-card">
                                    <div className="bg-muted/30 px-4 py-3 border-b border-border">
                                        <h4 className="font-semibold">{obj.originalTitle}</h4>
                                    </div>
                                    <div className="p-4 space-y-6">
                                        {obj.keyResults.map((kr, j) => (
                                            <div key={j} className="flex gap-4 items-start">
                                                <div className="mt-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                                                    <Target className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <div className="flex-1 space-y-3 min-w-0">
                                                    <div>
                                                        <div className="flex justify-between items-baseline flex-wrap gap-2">
                                                            <p className="font-medium text-base truncate">{kr.metricName}</p>
                                                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">Unit: {kr.unit}</span>
                                                        </div>
                                                        <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800 text-sm">
                                                            <span className="font-semibold text-blue-700 dark:text-blue-300 block mb-1 flex items-center gap-1.5">
                                                                <Target className="w-3 h-3" /> Industry Benchmark:
                                                            </span>
                                                            <span className="text-blue-800 dark:text-blue-200 leading-relaxed text-pretty">
                                                                {kr.benchmarkContext}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col gap-2">
                                                        <label className="text-sm font-medium">{kr.baselineQuestion}:</label>
                                                        <input
                                                            type="text"
                                                            placeholder="e.g. 0, $500k, 10%"
                                                            value={userBaselines[kr.metricName] || ''}
                                                            onChange={(e) => setUserBaselines(prev => ({ ...prev, [kr.metricName]: e.target.value }))}
                                                            className="w-full p-2 rounded border border-border bg-background text-sm focus:ring-1 focus:ring-primary focus:outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}

                            <button
                                onClick={submitCalibration}
                                disabled={loading}
                                className="w-full py-3 font-semibold bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                            >
                                Generate Targets & Plan <ArrowRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}

                    {/* PHASE 5: EXECUTION (PREVIEW) */}
                    {phase === 'execution' && (
                        <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="text-center">
                                <h3 className="text-2xl font-bold">Your Execution Plan</h3>
                                <p className="text-muted-foreground">Here is your "Shovel-Ready" roadmap with calibrated targets.</p>
                            </div>

                            <div className="space-y-6">
                                {finalPlan.map((item, i) => (
                                    <div key={i} className="border border-border rounded-xl bg-card p-6">
                                        <h4 className="font-bold text-lg mb-1 flex items-center gap-2">
                                            <Target className="w-5 h-5 text-primary" />
                                            {item.krTitle}
                                        </h4>
                                        {item.krDescription && (
                                            <p className="text-sm text-muted-foreground mb-4 ml-7">{item.krDescription}</p>
                                        )}
                                        <div className="space-y-3">
                                            {item.tasks.map((task, j) => (
                                                <div key={j} className="flex gap-3 p-3 bg-muted/20 rounded-lg">
                                                    <div className="w-6 h-6 rounded-full border border-border flex items-center justify-center shrink-0 bg-background text-xs text-muted-foreground">
                                                        {j + 1}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">{task.title}</p>
                                                        <p className="text-sm text-muted-foreground">{task.description}</p>
                                                        <span className="text-xs bg-muted px-2 py-0.5 rounded mt-2 inline-block">
                                                            ~{task.estimatedHours}h
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => setPhase('calibration')}
                                    className="flex-1 py-3 font-semibold text-muted-foreground hover:bg-muted rounded-lg transition-all"
                                >
                                    Back
                                </button>
                                <button
                                    onClick={saveToDatabase}
                                    disabled={loading}
                                    className="flex-[2] py-3 font-semibold bg-green-600 hover:bg-green-700 text-white rounded-lg transition-all flex items-center justify-center gap-2"
                                >
                                    Approve & Save to Dashboard <Check className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

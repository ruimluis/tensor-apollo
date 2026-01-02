import { Wand2, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DescriptionSectionProps {
    title: string;
    description: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    onGenerate?: () => void;
    onSave: () => void;
    isGenerating?: boolean;
    isSaving?: boolean;
}

export function DescriptionSection({
    title,
    description,
    value,
    onChange,
    placeholder,
    onGenerate,
    onSave,
    isGenerating = false,
    isSaving = false
}: DescriptionSectionProps) {


    return (
        <div className="bg-card rounded-lg border border-border overflow-hidden shadow-sm">
            <div className="p-6 border-b border-border">
                <h2 className="text-lg font-semibold tracking-tight">{title}</h2>
                <p className="text-sm text-muted-foreground mt-1">{description}</p>
            </div>

            <div className="p-6 space-y-4">
                <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Your Notes & Final Text</label>
                    <textarea
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={placeholder}
                        className="w-full min-h-[150px] rounded-md border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-y"
                    />
                </div>
            </div>

            <div className="px-6 py-4 bg-muted/30 border-t border-border flex items-center justify-between">
                <div>
                    {onGenerate && (
                        <button
                            onClick={onGenerate}
                            disabled={isGenerating}
                            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-background border border-border rounded-md hover:bg-accent hover:text-accent-foreground transition-colors shadow-sm"
                        >
                            <Wand2 className={cn("h-3.5 w-3.5", isGenerating ? "animate-spin text-primary" : "text-purple-500")} />
                            Generate with AI
                        </button>
                    )}
                </div>

                <button
                    onClick={onSave}
                    disabled={isSaving}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm"
                >
                    {isSaving ? (
                        <div className="h-4 w-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                    ) : (
                        <Save className="h-4 w-4" />
                    )}
                    Save
                </button>
            </div>
        </div>
    );
}

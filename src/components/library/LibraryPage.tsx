import { useState } from 'react';
import { CompanyDescriptionTab } from './CompanyDescriptionTab';
import { DocumentsTab } from './DocumentsTab';

export function LibraryPage() {
    const [activeTab, setActiveTab] = useState<'description' | 'documents'>('description');

    return (
        <div className="container max-w-5xl mx-auto py-8 space-y-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Library</h1>
                <p className="text-muted-foreground mt-1">
                    Central repository for your organization's guiding principles and documents.
                </p>
            </div>

            <div className="space-y-6">
                {/* Tabs */}
                <div className="border-b border-border flex gap-6">
                    <button
                        onClick={() => setActiveTab('description')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'description'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Company Description
                    </button>
                    <button
                        onClick={() => setActiveTab('documents')}
                        className={`pb-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'documents'
                            ? 'border-primary text-primary'
                            : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Documents
                    </button>
                </div>

                {/* Content */}
                <div className="min-h-[500px]">
                    {activeTab === 'description' ? (
                        <CompanyDescriptionTab />
                    ) : (
                        <DocumentsTab />
                    )}
                </div>
            </div>
        </div>
    );
}

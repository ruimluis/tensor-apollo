import { useState, useEffect } from 'react';
import { FileText, Plus, Trash2, Download, Loader2, File, Wand2, Info } from 'lucide-react';
import { useOKRStore } from '@/store/useOKRStore';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/Toast';
import { OrganizationDocument } from '@/types';
import { ConfirmationModal } from '@/components/ui/ConfirmationModal';
import { Tooltip } from '@/components/ui/Tooltip';

export function DocumentsTab() {
    const { organizationId } = useOKRStore();
    const { addToast } = useToast();
    const [documents, setDocuments] = useState<OrganizationDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploading, setUploading] = useState(false);
    const [analyzingIds, setAnalyzingIds] = useState<Set<string>>(new Set());

    // Delete Modal State
    const [deleteDoc, setDeleteDoc] = useState<OrganizationDocument | null>(null);

    useEffect(() => {
        if (organizationId) {
            fetchDocuments();
        }
    }, [organizationId]);

    const fetchDocuments = async () => {
        try {
            const { data, error } = await supabase
                .from('organization_documents')
                .select('*')
                .eq('organization_id', organizationId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Map snake_case to camelCase
            const mappedDocs: OrganizationDocument[] = (data || []).map((d: any) => ({
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

            setDocuments(mappedDocs);
        } catch (error: any) {
            console.error('Error fetching documents:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to load documents' });
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files || e.target.files.length === 0 || !organizationId) return;

        const file = e.target.files[0];
        setUploading(true);

        try {
            // 1. Upload to Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${organizationId}/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('documents')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Save Metadata to DB
            const { data: { user } } = await supabase.auth.getUser();

            const { error: dbError } = await supabase
                .from('organization_documents')
                .insert([{
                    organization_id: organizationId,
                    uploaded_by: user?.id,
                    name: file.name,
                    file_path: filePath,
                    size: file.size,
                    type: file.type
                }]);

            if (dbError) throw dbError;

            addToast({ type: 'success', title: 'Uploaded', message: 'Document uploaded successfully.' });
            fetchDocuments();
        } catch (error: any) {
            console.error('Upload error:', error);
            addToast({ type: 'error', title: 'Upload Failed', message: error.message });
        } finally {
            setUploading(false);
            // Reset input
            e.target.value = '';
        }
    };

    const confirmDelete = async () => {
        if (!deleteDoc) return;

        try {
            // 1. Delete from Storage
            const { error: storageError } = await supabase.storage
                .from('documents')
                .remove([deleteDoc.filePath]);

            if (storageError) throw storageError;

            // 2. Delete from DB
            const { error: dbError } = await supabase
                .from('organization_documents')
                .delete()
                .eq('id', deleteDoc.id);

            if (dbError) throw dbError;

            addToast({ type: 'success', title: 'Deleted', message: 'Document removed.' });
            // Optimistic update
            setDocuments(docs => docs.filter(d => d.id !== deleteDoc.id));
        } catch (error: any) {
            console.error('Delete error:', error);
            addToast({ type: 'error', title: 'Error', message: 'Failed to delete document' });
        } finally {
            setDeleteDoc(null);
        }
    };

    const handleDownload = async (doc: OrganizationDocument) => {
        try {
            const { data, error } = await supabase.storage
                .from('documents')
                .createSignedUrl(doc.filePath, 60); // 1 minute expiry

            if (error) throw error;
            if (data?.signedUrl) {
                window.open(data.signedUrl, '_blank');
            }
        } catch (error: any) {
            addToast({ type: 'error', title: 'Error', message: 'Could not generate download link' });
        }
    };

    const handleAnalyze = async (doc: OrganizationDocument) => {
        setAnalyzingIds(prev => new Set(prev).add(doc.id));
        addToast({ type: 'info', title: 'Analyzing', message: 'AI is processing this document...' });

        try {
            const { data, error } = await supabase.functions.invoke('analyze-document', {
                body: { documentId: doc.id }
            });

            if (error) throw error;

            addToast({ type: 'success', title: 'Analysis Complete', message: 'Document analyzed and renamed.' });

            setDocuments(docs => docs.map(d =>
                d.id === doc.id
                    ? {
                        ...d,
                        title: data.data.title,
                        summary: data.data.summary,
                        // Update full text from the response or backend state
                    }
                    : d
            ));

            // Re-fetch to ensure we have the full text content if needed
            fetchDocuments();

        } catch (error: any) {
            console.error("Analysis error", error);
            addToast({ type: 'error', title: 'Analysis Failed', message: error.message || 'Could not analyze document.' });
        } finally {
            setAnalyzingIds(prev => {
                const newSet = new Set(prev);
                newSet.delete(doc.id);
                return newSet;
            });
        }
    };


    const formatSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-muted-foreground">Loading documents...</div>;

    return (
        <div className="space-y-6 animate-in fade-in-50">
            {/* Header/Upload */}
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Documents ({documents.length})</h3>
                <div>
                    <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        // For MVP, we emphasize text-based files for best AI results
                        accept=".txt,.md,.csv,.json,.pdf"
                        onChange={handleFileUpload}
                        disabled={uploading}
                    />
                    <label
                        htmlFor="file-upload"
                        className={`flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:bg-primary/90 transition-colors shadow-sm cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                    >
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                        {uploading ? 'Uploading...' : 'Upload Document'}
                    </label>
                    <div className="text-[10px] text-muted-foreground text-right mt-1">
                        Best with .txt, .md, .pdf (text)
                    </div>
                </div>
            </div>

            {/* Grid List */}
            {documents.length === 0 ? (
                <div className="flex flex-col items-center justify-center min-h-[300px] bg-card rounded-lg border border-border border-dashed p-8 text-center">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No documents uploaded yet</h3>
                    <p className="text-muted-foreground max-w-sm">
                        Upload your company documents to build your library.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {documents.map((doc) => {
                        const isAnalyzing = analyzingIds.has(doc.id);
                        return (
                            <div key={doc.id} className="p-4 bg-card border border-border rounded-lg shadow-sm hover:border-primary/50 transition-all group flex flex-col h-full relative">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary shrink-0">
                                        <File className="h-5 w-5" />
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {/* Actions */}
                                        {!doc.summary && (
                                            <button
                                                onClick={() => handleAnalyze(doc)}
                                                disabled={isAnalyzing}
                                                className="p-1.5 text-muted-foreground hover:text-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-md transition-colors"
                                                title="Analyze with AI"
                                            >
                                                {isAnalyzing ? (
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : (
                                                    <Wand2 className="h-4 w-4" />
                                                )}
                                            </button>
                                        )}
                                        {doc.summary && (
                                            <Tooltip content={<div className="max-w-xs max-h-64 overflow-y-auto whitespace-pre-wrap text-xs">{doc.summary}</div>}>
                                                <div className="p-1.5 text-muted-foreground hover:text-blue-500 cursor-help">
                                                    <Info className="h-4 w-4" />
                                                </div>
                                            </Tooltip>
                                        )}
                                        <button
                                            onClick={() => handleDownload(doc)}
                                            className="p-1.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-md transition-colors"
                                            title="Download"
                                        >
                                            <Download className="h-4 w-4" />
                                        </button>

                                        <button
                                            onClick={() => setDeleteDoc(doc)}
                                            className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-md transition-colors"
                                            title="Delete"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex-1">
                                    {/* Title Section */}
                                    <div className="mb-1">
                                        <div className="font-medium text-foreground truncate" title={doc.title || doc.name}>
                                            {doc.title || doc.name}
                                        </div>
                                        {/* If we have a title, show the original filename smaller */}
                                        {doc.title && (
                                            <div className="text-[10px] text-muted-foreground truncate" title={doc.name}>
                                                {doc.name}
                                            </div>
                                        )}
                                    </div>

                                    <div className="text-xs text-muted-foreground mb-3">
                                        {formatSize(doc.size)} • {new Date(doc.createdAt).toLocaleDateString()}
                                    </div>

                                    {doc.summary ? (
                                        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-md leading-relaxed h-[100px] overflow-hidden relative">
                                            <div className="line-clamp-4">
                                                {doc.summary}
                                            </div>
                                            {/* Gradient fade to solve the "strange character" at bottom look if it's cutting oddly */}
                                            {/* (Optional, but line-clamp usually handles this well. Adding p-3 and leading-relaxed helps legibility) */}
                                        </div>
                                    ) : (
                                        <div className="text-xs text-muted-foreground italic opacity-70 h-[100px] flex items-center justify-center border border-dashed border-border rounded-md">
                                            {isAnalyzing ? 'Generating analysis...' : 'No AI summary yet. Click the wand.'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <ConfirmationModal
                isOpen={!!deleteDoc}
                onClose={() => setDeleteDoc(null)}
                onConfirm={confirmDelete}
                title="Delete Document"
                description={`Are you sure you want to delete "${deleteDoc?.name}"? This action cannot be undone.`}
                confirmLabel="Delete"
                variant="danger"
            />
        </div>
    );
}

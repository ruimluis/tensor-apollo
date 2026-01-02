import { useState } from 'react';
import { useAuth } from '@/context/AuthProvider';
import { ChangelogManager } from './ChangelogManager';
import { Shield, Clock, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SysAdminPage() {
    const { session, loading } = useAuth();
    const [activeTab, setActiveTab] = useState('changelog');

    if (loading) return null;

    if (session?.user?.email !== 'ruimluis7@gmail.com') {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center text-center">
                <Shield className="h-16 w-16 text-muted-foreground/20 mb-4" />
                <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
                <p className="text-muted-foreground">You do not have permission to view this page.</p>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold tracking-tight">SysAdmin</h1>
                <p className="text-muted-foreground mt-1">System administration and content management.</p>
            </div>

            <div className="flex flex-col md:flex-row gap-8">
                {/* Sidebar / Tabs */}
                <div className="w-full md:w-64 flex-shrink-0 space-y-1">
                    <button
                        onClick={() => setActiveTab('changelog')}
                        className={cn(
                            "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                            activeTab === 'changelog' ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                        )}
                    >
                        <Clock className="h-4 w-4" />
                        Changelog
                    </button>
                    <button
                        // Placeholder for future tabs
                        disabled
                        className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground/50 cursor-not-allowed"
                    >
                        <Users className="h-4 w-4" />
                        Users (Coming Soon)
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1">
                    {activeTab === 'changelog' && <ChangelogManager />}
                </div>
            </div>
        </div>
    );
}

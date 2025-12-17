import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { OKRListView } from '@/components/okr/OKRListView';
import { OKRGraphView } from '@/components/okr/OKRGraphView';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/context/AuthProvider';
import { useOKRStore } from '@/store/useOKRStore';
import { Drawer } from '@/components/ui/Drawer';
import { CreateOKRForm } from '@/components/okr/CreateOKRForm';
import { OrganizationPage } from '@/components/organization/OrganizationPage';
import { ToastProvider } from '@/components/ui/Toast';
import { TasksPage } from '@/components/tasks/TasksPage';
import { SchedulingPage } from '@/components/scheduling/SchedulingPage';

function AppContent() {
    const [currentView, setCurrentView] = useState('okrs');
    const [okrViewMode, setOkrViewMode] = useState<'list' | 'graph'>('list');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const { fetchNodes } = useOKRStore();
    const { session } = useAuth();

    useEffect(() => {
        if (session) {
            fetchNodes();
        }
    }, [session, fetchNodes]);

    return (
        <AppLayout currentView={currentView} onChangeView={setCurrentView}>
            <div className="p-8">
                {currentView === 'okrs' && (
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">OKRs</h1>
                                <p className="text-muted-foreground mt-1">Visualize and manage your organization's Objectives and Key Results.</p>
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="bg-muted p-1 rounded-lg flex text-sm border border-border">
                                    <button
                                        onClick={() => setOkrViewMode('list')}
                                        className={cn("px-3 py-1.5 rounded-md transition-all font-medium", okrViewMode === 'list' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >List View</button>
                                    <button
                                        onClick={() => setOkrViewMode('graph')}
                                        className={cn("px-3 py-1.5 rounded-md transition-all font-medium", okrViewMode === 'graph' ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground")}
                                    >Graph View</button>
                                </div>
                                <button
                                    onClick={() => setIsCreateModalOpen(true)}
                                    className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium transition-colors shadow-sm ml-2"
                                >
                                    Create Goal
                                </button>
                            </div>
                        </div>

                        {okrViewMode === 'list' ? (
                            <OKRListView />
                        ) : (
                            <OKRGraphView />
                        )}

                        <Drawer
                            isOpen={isCreateModalOpen}
                            onClose={() => setIsCreateModalOpen(false)}
                            title="Create New Goal"
                        >
                            <CreateOKRForm
                                isOpen={isCreateModalOpen}
                                onClose={() => setIsCreateModalOpen(false)}
                                defaultType="GOAL"
                            />
                        </Drawer>
                    </div>
                )}

                {currentView === 'tasks' && (
                    <TasksPage />
                )}

                {currentView === 'scheduling' && (
                    <SchedulingPage />
                )}

                {currentView === 'organization' && (
                    <OrganizationPage />
                )}

                {currentView !== 'okrs' && currentView !== 'organization' && currentView !== 'tasks' && currentView !== 'scheduling' && (
                    <div className="flex flex-col items-center justify-center h-[50vh] text-muted-foreground">
                        <h2 className="text-2xl font-semibold mb-2">Work in Progress</h2>
                        <p>The {currentView} view is under construction.</p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}

function App() {
    return (
        <AuthProvider>
            <ToastProvider>
                <AppContent />
            </ToastProvider>
        </AuthProvider>
    );
}

export default App;

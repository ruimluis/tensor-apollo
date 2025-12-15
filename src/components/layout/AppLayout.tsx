import React from 'react';
import { Sidebar } from './Sidebar';

interface AppLayoutProps {
    children: React.ReactNode;
    currentView: string;
    onChangeView: (view: string) => void;
}

export function AppLayout({ children, currentView, onChangeView }: AppLayoutProps) {
    return (
        <div className="flex h-screen w-full overflow-hidden bg-background">
            <Sidebar currentView={currentView} onChangeView={onChangeView} />
            <main className="flex-1 overflow-auto">
                {children}
            </main>
        </div>
    );
}

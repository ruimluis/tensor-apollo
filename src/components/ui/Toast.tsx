import React, { createContext, useContext, useState, useCallback } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    message?: string;
    duration?: number;
}

interface ToastContextType {
    addToast: (toast: Omit<Toast, 'id'>) => void;
    removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const removeToast = useCallback((id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback(({ type, title, message, duration = 3000 }: Omit<Toast, 'id'>) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, type, title, message, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    }, [removeToast]);

    return (
        <ToastContext.Provider value={{ addToast, removeToast }}>
            {children}
            <div className="fixed bottom-0 right-0 p-6 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={cn(
                            "pointer-events-auto flex items-start gap-4 p-4 rounded-lg border shadow-lg transition-all animate-in slide-in-from-right-full fade-in duration-300",
                            "bg-background text-foreground",
                            toast.type === 'success' && "border-emerald-500/50 bg-emerald-50 dark:bg-emerald-950/30",
                            toast.type === 'error' && "border-red-500/50 bg-red-50 dark:bg-red-950/30",
                            toast.type === 'warning' && "border-amber-500/50 bg-amber-50 dark:bg-amber-950/30",
                            toast.type === 'info' && "border-blue-500/50 bg-blue-50 dark:bg-blue-950/30"
                        )}
                    >
                        <div className="mt-0.5 shrink-0">
                            {toast.type === 'success' && <CheckCircle className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />}
                            {toast.type === 'error' && <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400" />}
                            {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400" />}
                            {toast.type === 'info' && <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
                        </div>
                        <div className="flex-1">
                            <h3 className="font-semibold text-sm">{toast.title}</h3>
                            {toast.message && <p className="text-sm text-muted-foreground mt-1">{toast.message}</p>}
                        </div>
                        <button
                            onClick={() => removeToast(toast.id)}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}

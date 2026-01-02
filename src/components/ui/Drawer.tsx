import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMountTransition } from '@/hooks/useMountTransition';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
}

export function Drawer({ isOpen, onClose, title, children, width = "max-w-md" }: DrawerProps) {
    const hasTransitionedIn = useMountTransition(isOpen, 300); // 300ms matches animation duration

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            document.addEventListener('keydown', handleEscape);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            document.removeEventListener('keydown', handleEscape);
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, onClose]);

    if (!hasTransitionedIn && !isOpen) return null;

    return createPortal(
        <div className={cn(
            "fixed inset-0 z-[100] flex justify-end transition-opacity duration-300",
            isOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        )}>
            {/* Overlay */}
            <div
                className={cn(
                    "absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300",
                    isOpen ? "opacity-100" : "opacity-0"
                )}
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={cn(
                    "relative h-full w-full bg-background p-6 shadow-xl border-l border-border transition-transform duration-300 sm:w-3/4 md:w-1/2 lg:w-1/3",
                    isOpen ? "translate-x-0" : "translate-x-full",
                    width
                )}
                role="dialog"
                aria-modal="true"
            >
                <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
                    <button
                        onClick={onClose}
                        className="rounded-full p-2 hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="h-[calc(100%-80px)] overflow-y-auto pr-2">
                    {children}
                </div>
            </div>
        </div>,
        document.body
    );
}

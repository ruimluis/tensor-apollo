import React, { useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DrawerProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    width?: string;
}

export function Drawer({ isOpen, onClose, title, children, width = "max-w-md" }: DrawerProps) {
    const overlayRef = useRef<HTMLDivElement>(null);

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

    // Mount/Unmount logic for animation could be handled by a library, 
    // but for simplicity we render always and toggle classes, 
    // OR return null if not open.
    // To have a slide-out animation on close, we'd need more complex state.
    // For now, we'll do conditional rendering with CSS animation for "in" state.
    // To support "out" animation, we'd need `AnimatePresence` or similar logic.
    // We'll stick to simple "render if open" for now, maybe with a basic CSS transition if mounted.

    // A common pattern without Framer Motion is to keep it mounted but hidden, or use a Transition wrapper.
    // Let's use a simple approach: Render if isOpen, use CSS animation for slide-in.

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Overlay */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
                onClick={onClose}
            />

            {/* Drawer Panel */}
            <div
                className={cn(
                    "relative h-full w-full bg-background p-6 shadow-xl border-l border-border transition-transform animate-in slide-in-from-right duration-300 sm:w-3/4 md:w-1/2 lg:w-1/3",
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
        </div>
    );
}


import React, { useState, useRef } from 'react';
import { createPortal } from 'react-dom';

interface TooltipProps {
    content: React.ReactNode;
    children: React.ReactNode;
    className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [position, setPosition] = useState({ top: 0, left: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setPosition({
                top: rect.bottom + 8, // Position below the element
                left: rect.left + (rect.width / 2), // Center horizontally
            });
            setIsVisible(true);
        }
    };

    const handleMouseLeave = () => {
        setIsVisible(false);
    };

    return (
        <>
            <div
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                className={className}
            >
                {children}
            </div>
            {isVisible && createPortal(
                <div
                    className="fixed z-[9999] px-3 py-2 text-sm text-popover-foreground bg-popover rounded-md shadow-md border border-border max-w-xs animate-in fade-in zoom-in-95 duration-200 pointer-events-none"
                    style={{
                        top: position.top,
                        left: position.left,
                        transform: 'translateX(-50%)', // Center alignment
                    }}
                >
                    {content}
                </div>,
                document.body
            )}
        </>
    );
}

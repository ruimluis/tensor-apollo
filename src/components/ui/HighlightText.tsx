import React from 'react';
import { cn } from '@/lib/utils';

interface HighlightTextProps {
    text: string | null | undefined;
    highlight: string;
    className?: string;
    highlightClassName?: string;
}

export function HighlightText({ text, highlight, className, highlightClassName }: HighlightTextProps) {
    if (!text) return null;
    if (!highlight || !highlight.trim()) {
        return <span className={className}>{text}</span>;
    }

    const regex = new RegExp(`(${highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, i) => (
                regex.test(part) ? (
                    <span
                        key={i}
                        className={cn("bg-yellow-200 dark:bg-yellow-900/50 dark:text-yellow-100 rounded-[1px] px-0.5 -mx-0.5", highlightClassName)}
                    >
                        {part}
                    </span>
                ) : (
                    <span key={i}>{part}</span>
                )
            ))}
        </span>
    );
}

import React from 'react';

export interface ErrorSummaryData {
    fieldCount: number;
    messages: string[];
}

interface ValidationSummaryProps {
    errorSummary?: ErrorSummaryData | null;
    className?: string;
}

export const ValidationSummary: React.FC<ValidationSummaryProps> = ({
    errorSummary,
    className = ''
}) => {
    if (!errorSummary) return null;

    const { fieldCount, messages } = errorSummary;

    return (
        <div
            className={`border border-red-400 bg-red-50 dark:bg-red-900/20 dark:border-red-800 text-red-700 dark:text-red-300 p-3 text-sm rounded ${className}`}
            role="alert"
            aria-live="polite"
        >
            <p className="font-semibold mb-1">
                There {fieldCount === 1 ? 'is 1 field error' : `are ${fieldCount} field errors`}:
            </p>
            <ul className="list-disc ml-5 space-y-1">
                {messages.map((m, i) => (
                    <li key={i}>{m}</li>
                ))}
            </ul>
        </div>
    );
};

export default ValidationSummary;

/**
 * Validation Results Component
 *
 * Displays the results of schema validation with markdown formatting
 */

import { FC } from "react";
import Markdown, { Components } from "react-markdown";
import type { ValidationResultsProps } from "@pages/schema-validation/types";

/**
 * Custom markdown components with styled elements
 */
const markdownComponents: Partial<Components> = {
    a: ({ href, children }: { href?: string; children?: React.ReactNode }) => (
        <a
            href={href}
            className="text-sky-600 underline hover:text-sky-700 transition-colors duration-200"
        >
            {children}
        </a>
    ),
    blockquote: ({ children }: { children?: React.ReactNode }) => (
        <blockquote className="border-l-4 pl-1 pr-1 py-2 mr-2 italic text-gray-700">
            {children}
        </blockquote>
    ),
    ul: ({ children }: { children?: React.ReactNode }) => (
        <ul className="list-disc pl-6 space-y-2 mb-4">{children}</ul>
    ),
    li: ({ children }: { children?: React.ReactNode }) => (
        <li className="text-gray-700">{children}</li>
    ),
    code: ({ inline, children }: { inline?: boolean; children?: React.ReactNode }) =>
        inline ? (
            <code className="bg-red-100 text-red-800 px-2 py-1 text-sm font-mono border border-red-200">
                {children}
            </code>
        ) : (
            <pre className="bg-white text-black p-3 ml-2 overflow-x-auto border border-gray-700 custom-scrollbar">
                <code className="font-mono">{children}</code>
            </pre>
        ),
    p: ({ children }: { children?: React.ReactNode }) => (
        <p className="text-gray-700 mb-1 leading-relaxed">{children}</p>
    ),
    h3: ({ children }: { children?: React.ReactNode }) => (
        <h3 className="text-lg font-semibold text-gray-900 mb-3 mt-6">{children}</h3>
    ),
    h4: ({ children }: { children?: React.ReactNode }) => (
        <h4 className="text-base font-semibold text-gray-800 mb-2 mt-4">{children}</h4>
    ),
};

/**
 * ValidationResults component that displays validation results
 *
 * @param props - Component props
 * @returns JSX element or null if not visible
 */
const ValidationResults: FC<ValidationResultsProps> = ({ isVisible, isSuccess, markdownData }) => {
    if (!isVisible) {
        return null;
    }

    return (
        <div className="flex-1 bg-white border border-sky-100 shadow-sm flex flex-col overflow-hidden animate-slideIn">
            <div className="bg-gradient-to-r from-sky-50 to-sky-100/50 px-6 py-4 border-b border-sky-100 flex-shrink-0">
                <h3 className="text-lg font-bold text-gray-900">Validation Results</h3>
                {isSuccess ? (
                    <div className="flex items-center space-x-2 mt-2 animate-fadeIn">
                        <div className="w-3 h-3 bg-green-500 animate-pulse"></div>
                        <span className="text-sm text-green-700 font-medium">Schema is valid</span>
                    </div>
                ) : (
                    <div className="flex items-center space-x-2 mt-2 animate-fadeIn">
                        <div className="w-3 h-3 bg-red-500 animate-pulse"></div>
                        <span className="text-sm text-red-700 font-medium">
                            Validation errors found
                        </span>
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-gradient-to-b from-gray-50 to-gray-100 custom-scrollbar min-h-0">
                <Markdown components={markdownComponents}>{markdownData}</Markdown>
            </div>
        </div>
    );
};

export default ValidationResults;

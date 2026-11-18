import { Component, type ErrorInfo, type ReactNode } from "react";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";

import { Button } from "@components/Shadcn/Button";

interface ILiveErrorBoundaryProps {
    children: ReactNode;
}

interface ILiveErrorBoundaryState {
    error: Error | null;
    componentStack: string | null;
}

/**
 * Keeps a rendering bug on the live page from blanking it: shows what broke (the
 * error and where) and a way back, instead of an empty screen. The run itself lives
 * on the mock service, so reloading picks it up where it was.
 */
export class LiveErrorBoundary extends Component<ILiveErrorBoundaryProps, ILiveErrorBoundaryState> {
    state: ILiveErrorBoundaryState = { error: null, componentStack: null };

    static getDerivedStateFromError(error: Error): Partial<ILiveErrorBoundaryState> {
        return { error };
    }

    componentDidCatch(error: Error, info: ErrorInfo) {
        console.error("[studio live] the page failed to render", error, info.componentStack);
        this.setState({ componentStack: info.componentStack ?? null });
    }

    render() {
        const { error, componentStack } = this.state;
        if (!error) return this.props.children;
        return (
            <div className="mx-auto flex max-w-3xl flex-col gap-4 px-4 py-16">
                <div className="flex gap-3 rounded-xl border border-error-50 bg-error-50 p-4 text-error-500 dark:border-error-800/40 dark:bg-error-800/10">
                    <ExclamationTriangleIcon className="mt-0.5 size-5 shrink-0" />
                    <div className="min-w-0">
                        <p className="font-semibold">The live page hit an error</p>
                        <p className="mt-1 wrap-break-word font-mono text-[12px] text-text-primary">
                            {error.name}: {error.message}
                        </p>
                        <p className="mt-2 text-body-2 text-text-secondary">
                            The run itself is kept by the mock service: reloading picks it up where
                            it was.
                        </p>
                    </div>
                </div>
                {error.stack || componentStack ? (
                    <details className="rounded-xl border border-n-30 bg-surface-elevated p-3 text-body-2 dark:border-border-default">
                        <summary className="cursor-pointer text-text-secondary">
                            Technical details
                        </summary>
                        <pre className="mt-2 max-h-80 overflow-auto font-mono text-[11px] whitespace-pre-wrap text-text-secondary">
                            {error.stack}
                            {componentStack ? `\n\nComponent stack:${componentStack}` : ""}
                        </pre>
                    </details>
                ) : null}
                <div className="flex gap-2">
                    <Button type="button" onClick={() => window.location.reload()}>
                        Reload page
                    </Button>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={() => this.setState({ error: null, componentStack: null })}
                    >
                        Try again
                    </Button>
                </div>
            </div>
        );
    }
}

export default LiveErrorBoundary;

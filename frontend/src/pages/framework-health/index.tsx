import { FC } from "react";
import { useFrameworkHealth } from "@hooks/useFrameworkHealth";
import LoginForm from "./LoginForm";
import HealthReport from "./HealthReport";

interface TestCard {
    id: string;
    title: string;
    description: string;
    action: () => void;
    isRunning: boolean;
    icon: React.ReactNode;
}

const FrameworkHealthPage: FC = () => {
    const {
        isAuthenticated,
        isAuthLoading,
        credentials,
        setCredentials,
        handleLogin,
        handleLogout,
        isRunning,
        report,
        lastChecked,
        runApiServiceCheck,
    } = useFrameworkHealth();

    if (!isAuthenticated) {
        return (
            <LoginForm
                credentials={credentials}
                isLoading={isAuthLoading}
                onCredentialsChange={setCredentials}
                onLogin={handleLogin}
            />
        );
    }

    const testCards: TestCard[] = [
        {
            id: "api-service",
            title: "API Services",
            description:
                "Runs a test search request against every domain & version registered in the config service and reports which are returning 200.",
            action: runApiServiceCheck,
            isRunning: isRunning,
            icon: (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01M3.055 11A9 9 0 0112 3a9 9 0 018.945 8M6.166 13.804A5.5 5.5 0 0112 12a5.5 5.5 0 015.834 1.804"
                    />
                </svg>
            ),
        },
        // Future tests can be added here as additional cards
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
            {/* Header */}
            <div className="border-b border-sky-100 bg-white/80 backdrop-blur-sm sticky top-0 z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shrink-0">
                            <svg
                                className="w-4 h-4 text-white"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                            </svg>
                        </div>
                        <span className="font-semibold text-gray-800">Framework Health</span>
                    </div>
                    <button
                        onClick={handleLogout}
                        className="text-sm text-gray-500 hover:text-gray-800 transition-colors flex items-center gap-1.5"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                            />
                        </svg>
                        Logout
                    </button>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
                {/* Page intro */}
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                        Health Dashboard
                    </h1>
                    <p className="text-gray-500 mt-1 text-sm">
                        Run health checks across ONDC framework services. Each card below represents
                        an independent test suite — click to run it.
                    </p>
                </div>

                {/* Test cards */}
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {testCards.map((card) => (
                        <div
                            key={card.id}
                            className="bg-white border border-sky-100 rounded-2xl p-5 flex flex-col gap-4 hover:border-sky-300 hover:shadow-md transition-all shadow-sm"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/10 to-blue-500/10 border border-sky-200 flex items-center justify-center text-sky-600 shrink-0">
                                    {card.icon}
                                </div>
                                {report && card.id === "api-service" && (
                                    <span
                                        className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                            report.summary.totalUnhealthy === 0
                                                ? "bg-emerald-100 text-emerald-700"
                                                : "bg-red-100 text-red-700"
                                        }`}
                                    >
                                        {report.summary.totalUnhealthy === 0
                                            ? "All OK"
                                            : `${report.summary.totalUnhealthy} failing`}
                                    </span>
                                )}
                            </div>
                            <div className="flex-1">
                                <h3 className="font-semibold text-gray-800 text-base">
                                    {card.title}
                                </h3>
                                <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                                    {card.description}
                                </p>
                            </div>
                            <button
                                onClick={card.action}
                                disabled={card.isRunning}
                                className="w-full py-2.5 px-4 rounded-lg bg-gradient-to-r from-sky-500 to-blue-500 hover:from-sky-600 hover:to-blue-600 text-white text-sm font-medium transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {card.isRunning ? (
                                    <>
                                        <svg
                                            className="animate-spin h-4 w-4"
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                        >
                                            <circle
                                                className="opacity-25"
                                                cx="12"
                                                cy="12"
                                                r="10"
                                                stroke="currentColor"
                                                strokeWidth="4"
                                            />
                                            <path
                                                className="opacity-75"
                                                fill="currentColor"
                                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                            />
                                        </svg>
                                        Running…
                                    </>
                                ) : (
                                    <>
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                                            />
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                            />
                                        </svg>
                                        Test API Services
                                    </>
                                )}
                            </button>
                        </div>
                    ))}
                </div>

                {/* Running notice */}
                {isRunning && (
                    <div className="bg-white border border-sky-200 rounded-2xl p-6 flex items-center gap-4 shadow-sm">
                        <div className="relative shrink-0">
                            <div className="w-10 h-10 rounded-full border-2 border-sky-500 border-t-transparent animate-spin" />
                        </div>
                        <div>
                            <p className="text-gray-800 font-medium">Health check in progress…</p>
                            <p className="text-gray-500 text-sm mt-0.5">
                                Sending test requests to all registered domain/version combinations.
                                This may take a minute or two.
                            </p>
                        </div>
                    </div>
                )}

                {/* Report */}
                {report && !isRunning && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <h2 className="text-xl font-semibold text-gray-800">Results</h2>
                            <div className="flex-1 h-px bg-sky-100" />
                        </div>
                        <HealthReport report={report} lastChecked={lastChecked} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default FrameworkHealthPage;

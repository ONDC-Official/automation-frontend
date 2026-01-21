import { FC } from "react";
import { UserIcon, GitHubIcon } from "@components/Icons";

const handleLogin = () => {
    const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
    const authUrl = `${backendUrl}/auth/github`;
    window.location.href = authUrl;
};

const LoginPage: FC = () => (
    <div className="font-sans flex items-center justify-center min-h-screen p-4">
        <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10 max-w-md w-full text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
                <div className="bg-sky-600 text-white rounded-xl p-3">
                    <UserIcon />
                </div>
            </div>

            {/* Heading */}
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                Welcome to Protocol Workbench
            </h1>

            {/* Subheading */}
            <p className="text-slate-500 mb-8">
                Connect your GitHub account to get started quickly
            </p>

            {/* Buttons */}
            <div className="space-y-4">
                <button
                    onClick={handleLogin}
                    className="w-full bg-slate-900 text-white font-semibold py-3 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-900"
                >
                    <GitHubIcon />
                    <span className="ml-3">Continue with GitHub</span>
                </button>
                <button
                    onClick={() => window.open("https://github.com/", "_blank")}
                    className="w-full bg-white text-slate-600 font-semibold py-3 rounded-lg border border-slate-300 transition-colors hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500"
                >
                    Don't have GitHub?
                </button>
            </div>
        </div>
    </div>
);

export default LoginPage;

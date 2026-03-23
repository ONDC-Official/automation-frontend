import { FC } from "react";

interface Props {
    credentials: { username: string; password: string };
    isLoading: boolean;
    onCredentialsChange: (c: { username: string; password: string }) => void;
    onLogin: (e: React.FormEvent) => void;
}

const LoginForm: FC<Props> = ({ credentials, isLoading, onCredentialsChange, onLogin }) => (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 mb-4 shadow-lg">
                    <svg
                        className="w-8 h-8 text-white"
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
                <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Framework Health
                </h1>
                <p className="text-sky-600 text-sm">Admin access required</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
                <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-6">
                    <h2 className="text-xl font-semibold text-white text-center">
                        Administrator Login
                    </h2>
                </div>

                <form onSubmit={onLogin} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <input
                            type="text"
                            value={credentials.username}
                            onChange={(e) =>
                                onCredentialsChange({ ...credentials, username: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-white border border-sky-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors outline-none"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <input
                            type="password"
                            value={credentials.password}
                            onChange={(e) =>
                                onCredentialsChange({ ...credentials, password: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-white border border-sky-200 rounded-lg text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors outline-none"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-sky-600 hover:to-blue-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg
                                    className="animate-spin h-5 w-5 text-white"
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
                                Signing in...
                            </span>
                        ) : (
                            "Sign In"
                        )}
                    </button>
                </form>

                <div className="bg-sky-50 p-4 text-center border-t border-sky-100">
                    <p className="text-xs text-sky-600">Enter your administrator credentials</p>
                </div>
            </div>
        </div>
    </div>
);

export default LoginForm;

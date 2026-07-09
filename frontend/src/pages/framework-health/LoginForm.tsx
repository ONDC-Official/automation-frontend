import { FC } from "react";
import { Button } from "@components/Shadcn/Button";
import Spinner from "@components/Shadcn/Spinner";
import { Input } from "@components/Shadcn/Input";

interface Props {
    credentials: { username: string; password: string };
    isLoading: boolean;
    onCredentialsChange: (c: { username: string; password: string }) => void;
    onLogin: (e: React.FormEvent) => void;
}

const LoginForm: FC<Props> = ({ credentials, isLoading, onCredentialsChange, onLogin }) => (
    <div className="min-h-screen bg-linear-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-linear-to-br from-sky-500 to-blue-600 mb-4 shadow-lg">
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
                <h1 className="text-3xl font-bold bg-linear-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    Framework Health
                </h1>
                <p className="text-sky-600 text-sm">Admin access required</p>
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
                <div className="bg-linear-to-r from-sky-500 to-blue-500 p-6">
                    <h2 className="text-xl font-semibold text-white text-center">
                        Administrator Login
                    </h2>
                </div>

                <form onSubmit={onLogin} className="p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Username
                        </label>
                        <Input
                            type="text"
                            value={credentials.username}
                            onChange={(e) =>
                                onCredentialsChange({ ...credentials, username: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-white border-sky-200 rounded-lg text-gray-900 placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-colors"
                            placeholder="Enter username"
                            required
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <Input
                            type="password"
                            value={credentials.password}
                            onChange={(e) =>
                                onCredentialsChange({ ...credentials, password: e.target.value })
                            }
                            className="w-full px-4 py-3 bg-white border-sky-200 rounded-lg text-gray-900 placeholder-gray-400 focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:border-sky-500 transition-colors"
                            placeholder="Enter password"
                            required
                        />
                    </div>

                    <Button
                        type="submit"
                        isLoading={isLoading}
                        className="w-full bg-linear-to-r from-sky-500 to-blue-500 py-3 px-4 rounded-lg font-medium hover:from-sky-600 hover:to-blue-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <>
                                <Spinner className="size-4" />
                                Signing in...
                            </>
                        ) : (
                            "Sign In"
                        )}
                    </Button>
                </form>

                <div className="bg-sky-50 p-4 text-center border-t border-sky-100">
                    <p className="text-xs text-sky-600">Enter your administrator credentials</p>
                </div>
            </div>
        </div>
    </div>
);

export default LoginForm;

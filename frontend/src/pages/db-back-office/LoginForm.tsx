import { FC } from "react";
import { LoginFormProps } from "@pages/db-back-office/types";

const LoginForm: FC<LoginFormProps> = ({ credentials, isLoading, onCredentialsChange, onLogin }) => (
  <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50 flex items-center justify-center p-4">
    <div className="w-full max-w-md">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Back Office Portal
        </h1>
        <p className="text-sky-600 text-sm">Enter your credentials to access payload data</p>
      </div>

      {/* Login Form */}
      <div className="bg-white rounded-2xl shadow-xl border border-sky-100 overflow-hidden">
        <div className="bg-gradient-to-r from-sky-500 to-blue-500 p-6">
          <h2 className="text-xl font-semibold text-white text-center">Administrator Login</h2>
        </div>

        <form onSubmit={onLogin} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={credentials.username}
              onChange={e => onCredentialsChange({ ...credentials, username: e.target.value })}
              className="w-full px-4 py-3 border bg-white border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              placeholder="Enter your username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              type="password"
              value={credentials.password}
              onChange={e => onCredentialsChange({ ...credentials, password: e.target.value })}
              className="bg-white w-full px-4 py-3 border border-sky-200 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500 transition-colors"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-sky-500 to-blue-500 text-white py-3 px-4 rounded-lg font-medium hover:from-sky-600 hover:to-blue-600 focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed">
            {isLoading ? (
              <span className="flex items-center justify-center">
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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

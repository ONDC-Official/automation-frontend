import { FC } from "react";
import { HeaderProps } from "@pages/db-back-office/types";

const Header: FC<HeaderProps> = ({ onLogout }) => (
    <div className="bg-white shadow-sm border-b border-sky-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-4">
                <div>
                    <h1 className="text-2xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
                        Back Office Portal
                    </h1>
                    <p className="text-sm text-sky-600">Payload Data Management</p>
                </div>
                <button
                    onClick={onLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                    Logout
                </button>
            </div>
        </div>
    </div>
);

export default Header;

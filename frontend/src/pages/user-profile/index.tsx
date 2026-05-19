import { useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    LuLogOut,
    LuExternalLink,
    LuUser,
    LuSettings,
    LuBookmark,
    LuFileText,
} from "react-icons/lu";

import { UserContext } from "@context/userContext";
import JsonDataForm from "@components/registry-components/subscriber-form";
import { AuthService } from "@services/authService";
import { authTokenManager } from "@utils/localStorageManager";
import ScenarioPreferencesForm from "./scenario-preferences-form";
import PastReportsSection from "./past-reports-section";
import { ROUTES } from "@constants/routes";

const REGISTRY_URL = "http://ondc-common-alb-3cbab6333a4a606a.elb.ap-south-1.amazonaws.com/";

const UserProfile = () => {
    const { refreshUser, userDetails } = useContext(UserContext);
    const navigate = useNavigate();
    const [scenarioFormTrigger, setScenarioFormTrigger] = useState(0);

    const token = authTokenManager.get();
    const registryUrl = token ? `${REGISTRY_URL}?token=${token}` : REGISTRY_URL;

    const navItems = [
        {
            label: "Redirect to Registry",
            id: null as string | null,
            href: registryUrl,
            icon: LuExternalLink,
        },
        { label: "Profile Section", id: "profile-section", href: null, icon: LuUser },
        {
            label: "Add Scenario Testing Config",
            id: "add-scenario-config",
            href: null,
            icon: LuSettings,
        },
        { label: "Saved Configs", id: "saved-configs", href: null, icon: LuBookmark },
        { label: "Past Reports", id: "past-reports", href: null, icon: LuFileText },
    ];

    useEffect(() => {
        refreshUser();
    }, [refreshUser]);

    useEffect(() => {
        if (!userDetails) {
            navigate(ROUTES.HOME);
        }
    }, [navigate, userDetails]);

    const handleLogout = useCallback(async () => {
        try {
            await AuthService.logout();
        } catch (error) {
            console.error("Logout failed:", error);
        } finally {
            try {
                await refreshUser();
            } catch (refreshError) {
                console.error("Failed to refresh user after logout:", refreshError);
            }
            navigate(ROUTES.HOME);
        }
    }, [navigate, refreshUser]);

    const scrollTo = (id: string) => {
        if (id === "add-scenario-config") {
            setScenarioFormTrigger((t) => t + 1);
        }
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="font-sans flex min-h-screen p-4 gap-5 max-w-screen-2xl mx-auto w-full">
            {/* Left sidebar nav */}
            <aside className="w-72 shrink-0">
                <div className="sticky top-4 h-[calc(100vh-2rem)] bg-white rounded-2xl shadow-lg flex flex-col overflow-hidden border border-gray-100">
                    {/* Sidebar header */}
                    <div className="px-6 py-6 bg-gradient-to-br from-slate-700 to-slate-900 text-center">
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                            User Profile
                        </p>
                        <p className="text-base font-semibold text-white">Navigation</p>
                    </div>

                    {/* Nav items */}
                    <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
                        {navItems.map((item) =>
                            item.href ? (
                                <a
                                    key={item.label}
                                    href={item.href}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 hover:border-emerald-300 transition-all group"
                                >
                                    <span className="flex items-center gap-3">
                                        <item.icon className="text-lg shrink-0 text-emerald-600" />
                                        {item.label}
                                    </span>
                                    <LuExternalLink className="text-sm text-emerald-500 group-hover:text-emerald-700 transition-colors" />
                                </a>
                            ) : (
                                <button
                                    key={item.label}
                                    type="button"
                                    className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-slate-50 hover:border-slate-200 border border-transparent transition-all group text-left"
                                    onClick={() => item.id && scrollTo(item.id)}
                                >
                                    <item.icon className="text-lg text-gray-400 group-hover:text-slate-600 shrink-0 transition-colors" />
                                    {item.label}
                                </button>
                            )
                        )}
                    </nav>

                    {/* Sidebar footer */}
                    <div className="px-5 py-4 border-t border-gray-100">
                        <p className="text-xs text-gray-400 text-center">ONDC Automation</p>
                    </div>
                </div>
            </aside>

            {/* Main content */}
            <div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10 flex-1 text-center min-w-0">
                <div
                    id="profile-section"
                    className="bg-gray-100 p-2 rounded-md shadow-sm mb-2 items-start scroll-mt-24"
                >
                    <h1 className="text-3xl font-bold text-gray-900 mb-4 mt-4">User Profile</h1>
                    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl">
                        <div className="flex items-center gap-6">
                            {/* GitHub avatar */}
                            <div className="shrink-0">
                                {userDetails?.avatarUrl ? (
                                    <img
                                        src={userDetails.avatarUrl}
                                        alt={`${userDetails.githubId}'s avatar`}
                                        className="w-20 h-20 rounded-full border-2 border-slate-200 object-cover shadow-md"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-sky-100 border-2 border-sky-200 flex items-center justify-center shadow-md">
                                        <LuUser className="text-3xl text-sky-500" />
                                    </div>
                                )}
                            </div>

                            {/* User info */}
                            <div className="flex-1 text-left text-gray-700 space-y-1">
                                <p>
                                    <strong>Login:</strong> {userDetails?.username || "N/A"}
                                </p>
                                <p>
                                    <strong>Participant ID:</strong>{" "}
                                    {userDetails?.participantId || "N/A"}
                                </p>
                            </div>

                            {/* Logout */}
                            <div className="shrink-0">
                                <button
                                    type="button"
                                    className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-800 flex items-center gap-2"
                                    onClick={handleLogout}
                                >
                                    <LuLogOut className="text-lg" />
                                    <strong>Logout</strong>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <JsonDataForm />

                <div id="add-scenario-config" className="scroll-mt-24">
                    <ScenarioPreferencesForm externalOpenTrigger={scenarioFormTrigger} />
                </div>

                <div id="past-reports" className="scroll-mt-24">
                    <PastReportsSection />
                </div>
            </div>
        </div>
    );
};

export default UserProfile;

import React from "react";

interface SessionCardProps {
    sessionId: string;
    bppId: string;
    bppUri: string;
    createdAt: string;
    expiresAt: string;
    status: string;
    onDelete: () => void;
    onNewSession: () => void;
    isDeleting?: boolean;
}

const SessionCard: React.FC<SessionCardProps> = ({
    sessionId,
    bppId,
    bppUri,
    createdAt,
    expiresAt,
    status,
    onDelete,
    onNewSession,
    isDeleting = false,
}) => {
    const formatDate = (dateStr: string): string => {
        if (!dateStr) return "";
        const date = new Date(dateStr);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${day}/${month}/${year}, ${hours}:${minutes}:${seconds}`;
    };

    return (
        <div className="rounded-2xl border border-sky-100 bg-white overflow-hidden">
            <div className="px-5 py-4 bg-gradient-to-r from-sky-600 to-sky-500">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="font-semibold text-white text-base leading-tight">
                            Active Session
                        </h2>
                        <p className="text-sky-200 text-xs mt-0.5">{sessionId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-xs bg-green-500/30 text-green-300 border border-green-400/30 px-3 py-1 rounded-full font-medium">
                            {status}
                        </span>
                        <button
                            type="button"
                            onClick={onNewSession}
                            className="px-3 py-1.5 text-xs font-medium text-white border border-white/30 rounded-lg hover:bg-white/10 transition-colors"
                        >
                            New Session
                        </button>
                        <button
                            type="button"
                            onClick={onDelete}
                            disabled={isDeleting}
                            className="px-3 py-1.5 text-xs font-medium text-red-300 border border-red-400/30 rounded-lg hover:bg-red-500/10 transition-colors disabled:opacity-50"
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </button>
                    </div>
                </div>
            </div>

            <div className="px-5 py-4 grid grid-cols-6 gap-4">
                <div className="col-span-1">
                    <p className="text-xs text-gray-400 mb-1">BPP ID</p>
                    <p className="text-sm text-gray-800 font-medium break-all">{bppId}</p>
                </div>
                <div className="col-span-2">
                    <p className="text-xs text-gray-400 mb-1">BPP URI</p>
                    <p className="text-sm text-gray-800 font-medium break-all">{bppUri}</p>
                </div>
                <div className="col-span-1">
                    <p className="text-xs text-gray-400 mb-1">Created</p>
                    <p className="text-sm text-gray-800 font-medium">{formatDate(createdAt)}</p>
                </div>
                <div className="col-span-1">
                    <p className="text-xs text-gray-400 mb-1">Expires</p>
                    <p className="text-sm text-gray-800 font-medium">{formatDate(expiresAt)}</p>
                </div>
            </div>
        </div>
    );
};

export default SessionCard;

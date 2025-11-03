import React, { useState } from "react";
import { getReport, getSessions } from "./../utils/request-utils";
import { LuHistory } from "react-icons/lu";
import { toast } from "react-toastify";
import { FiCopy } from "react-icons/fi";

interface Session {
  sessionId: string;
  reportExists: boolean;
  createdAt: string;
}

interface PastSessionsProps {
  loggedIn: boolean;
}

const PastSessions: React.FC<PastSessionsProps> = ({ loggedIn }) => {
  const [subscriberId, setSubscriberId] = useState("");
  const [npType, setNpType] = useState("BAP");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);

  const handleFetchSessions = async () => {
    if (!subscriberId.trim()) return;
    if (!npType.trim()) return;
    setLoading(true);

    // Simulated API call
    try {
      const response = await getSessions(subscriberId, npType);
      setSessions(response.sessions);
    } catch (e) {
      console.log("error while fetching session", e);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  const viewReport = async (sessionId: string) => {
    let report: any = {};
    try {
      const response = await getReport(sessionId);
      report = response;
    } catch (e) {
      console.log("error while fetching report: ", e);
      toast.error("Report not available");
      return;
    }

    if (!report?.data) {
      toast.error("Something went wrong while fetching report");
      return;
    }

    const base64html = report.data;
    const cleanedData = base64html.split("base64,")[1];
    try {
      // Decode Base64 → HTML string
      const decodedHtml = decodeURIComponent(escape(atob(cleanedData)));

      // Create a new Blob and URL
      const blob = new Blob([decodedHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);

      // Open in a new tab
      window.open(url, "_blank");

      // Optional: cleanup after a short delay
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      console.error("Failed to decode or open Base64 HTML:", error);
    }
  };

  const formatDateTime = (isoString: string) => {
    const date = new Date(isoString);
    return date.toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="max-w-3xl mt-4 mx-auto p-6 bg-sky-50 rounded-2xl shadow-sm">
      <div className="flex gap-2 mb-2">
        <LuHistory className="text-sky-700 w-8 h-8" />
        <h2 className="text-2xl font-semibold text-sky-700 ">History</h2>
      </div>

      <p className="text-sky-600 mb-6">
        View and manage your previous sessions. You can check reports or resume
        a past session anytime.
      </p>

      {/* Logged-in or Subscriber Mode */}
      {loggedIn ? (
        <>
        </>
      ) : (
        <div className="space-y-4">
          <label className="block text-sky-700 font-medium">
            Enter Subscriber Details
          </label>

          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={subscriberId}
              onChange={(e) => setSubscriberId(e.target.value)}
              placeholder="Subscriber ID (e.g. SUB12345)"
              className="bg-white flex-1 px-4 py-2 border border-sky-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400"
            />

            <select
              value={npType}
              onChange={(e) => setNpType(e.target.value)}
              className="w-full sm:w-40 px-3 py-2 border border-sky-300 rounded-lg bg-white text-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-400"
            >
              <option value="BAP">BAP</option>
              <option value="BPP">BPP</option>
            </select>

            <button
              onClick={handleFetchSessions}
              disabled={loading}
              className="px-4 py-2 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition disabled:opacity-50"
            >
              {loading ? "Loading..." : "Fetch"}
            </button>
          </div>

          {sessions?.length > 0 && (
            <div className="pt-4 border-t border-sky-100">
              <h3 className="text-lg text-sky-700 font-semibold mb-2">
                Past Sessions
              </h3>
              {sessions.map((session) => (
                <div
                  key={session.sessionId}
                  className="flex justify-between items-center bg-white border border-sky-100 rounded-xl p-4 shadow-sm hover:shadow-md transition mb-2"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sky-700 font-medium">
                        {session.sessionId}
                      </h3>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(session.sessionId);
                          toast.info("Session Id Copied!")
                        }}
                        className="text-sky-500 hover:text-sky-600 transition"
                        title="Copy Session ID"
                      >
                        <FiCopy className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-sky-500">
                      {formatDateTime(session.createdAt)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      disabled={!session.reportExists}
                      onClick={() => viewReport(session.sessionId)}
                      className="px-3 py-1.5 text-sm bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-sky-500"
                    >
                      View Report
                    </button>
                    {/* <button
                      onClick={() => handleResumeSession(session.id)}
                      className="px-3 py-1.5 text-sm border border-sky-400 text-sky-600 rounded-lg hover:bg-sky-100 transition"
                    >
                      Resume
                    </button> */}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PastSessions;

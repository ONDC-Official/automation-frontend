import React, { useState } from "react";
import { Base64 } from 'js-base64';
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
  const [isFetched, setIsFetched] = useState(false);

  const handleFetchSessions = async () => {
    if (!subscriberId.trim()) return;
    if (!npType.trim()) return;
    setLoading(true);

    // Simulated API call
    try {
      const response = await getSessions(subscriberId, npType);
      setSessions(
        response.sessions
          .slice() // clone to avoid mutating original array
          .sort(
            (a: Session, b: Session) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
      );
    } catch (e) {
      console.log("error while fetching session", e);
      toast.error("Something went wrong.");
    } finally {
      setLoading(false);
      setIsFetched(true);
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
    const cleanedData = base64html.split("base64")[1];
  
    try {
      const decodedHtml = Base64.decode(cleanedData);
  
      // Step 1: Open new tab
      const newTab = window.open("", "_blank");
      if (!newTab) {
        toast.error("Popup blocked! Please allow popups for this site.");
        return;
      }
  
      // Step 2: Write a clean shell with header and iframe
      newTab.document.open();
      newTab.document.write(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Report - ${sessionId}</title>
          <style>
            body {
              margin: 0;
              font-family: system-ui, sans-serif;
              background: #f8fafc;
            }
            header {
              position: fixed;
              top: 0;
              left: 0;
              right: 0;
              background: white;
              box-shadow: 0 2px 6px rgba(0,0,0,0.05);
              z-index: 10;
              display: flex;
              align-items: center;
              justify-content: space-between;
              padding: 8px 16px;
            }
            iframe {
              border: none;
              width: 100%;
              height: calc(100vh - 60px);
              margin-top: 60px;
            }
            button {
              background-color: #0ea5e9;
              color: white;
              border: none;
              padding: 8px 14px;
              border-radius: 8px;
              font-size: 0.9rem;
              font-weight: 500;
              cursor: pointer;
              transition: background 0.3s;
            }
            button:hover {
              background-color: #0284c7;
            }
          </style>
        </head>
        <body>
          <header>
            <div style="display: flex; align-items: center; gap: 8px;">
              <img
                src="https://ondc.org/assets/theme/images/ondc_registered_logo.svg?v=d864655110"
                alt="Logo"
                style="height: 36px; width: auto;"
              />
              <span style="
                font-size: 1.4rem;
                font-weight: 800;
                background: linear-gradient(to right, #0ea5e9, #38bdf8);
                -webkit-background-clip: text;
                color: transparent;
              ">
                WORKBENCH
              </span>
            </div>
            <button id="downloadPdfBtn">Download as PDF</button>
          </header>
          <iframe id="reportFrame"></iframe>
        </body>
        </html>
      `);
      newTab.document.close();
  
      // Step 3: Write decoded HTML into iframe
      newTab.onload = () => {
        const iframe = newTab.document.getElementById("reportFrame") as HTMLIFrameElement;
        if (!iframe) return;
  
        const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
        if (!iframeDoc) return;
  
        iframeDoc.open();
        iframeDoc.write(decodedHtml);
        iframeDoc.close();
  
        // Step 4: Handle PDF download
        const downloadBtn = newTab.document.getElementById("downloadPdfBtn");
        downloadBtn?.addEventListener("click", () => {
          iframe.contentWindow?.print();
        });
      };
    } catch (error) {
      console.error("Failed to decode or open Base64 HTML:", error);
      toast.error("Failed to load report");
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
        <></>
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

          {/* Session Results Area */}
          <div className="pt-4 border-t border-sky-100">
            {sessions.length === 0 && !loading ? (
              <p className="text-sky-600 text-center py-6">
                {!isFetched
                  ? "Enter Subscriber ID and NP Type to search for sessions."
                  : "No past sessions found for this subscriber."}
              </p>
            ) : (
              sessions.map((session) => (
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
                          toast.info("Session ID Copied!");
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
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PastSessions;

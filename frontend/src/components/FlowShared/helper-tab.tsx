import {
    AiOutlinePlayCircle,
    AiOutlineClockCircle,
    AiOutlineWarning,
    AiOutlineSetting,
    AiOutlineDelete,
    AiOutlineStop,
    AiOutlineFileText,
    AiOutlineNumber,
} from "react-icons/ai";
import { BiMessageSquareDetail, BiGitBranch } from "react-icons/bi";
import { IoChevronDown } from "react-icons/io5";
import { useState } from "react";
import { GetRequestEndpoint } from "@components/FlowShared/guides";

export default function FlowHelperTab({
    domain,
    version,
    npType,
}: {
    domain?: string;
    version?: string;
    npType?: string;
}) {
    const [activeSection, setActiveSection] = useState<"guide" | "faq">("guide");
    const [openItems, setOpenItems] = useState<Record<string, boolean>>({
        start: true,
    });

    const toggleItem = (id: string) => {
        setOpenItems((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const guideItems = [
        {
            id: "start",
            icon: <AiOutlinePlayCircle className="w-4 h-4" />,
            title: "Starting a Flow",
            content: (
                <p className="text-xs text-gray-600">
                    Click the{" "}
                    <span className="px-1 bg-sky-100 rounded text-sky-700 font-medium">Play</span>{" "}
                    button to start a flow.
                </p>
            ),
        },
        {
            id: "status",
            icon: <AiOutlineClockCircle className="w-4 h-4" />,
            title: "API Status",
            content: (
                <p className="text-xs text-gray-600">
                    If an API shows{" "}
                    <span className="px-1 bg-yellow-100 rounded text-yellow-700 font-medium">
                        Waiting
                    </span>{" "}
                    status, initiate that request to{" "}
                    <code className="px-1 bg-gray-100 rounded text-xs">
                        {GetRequestEndpoint(
                            domain || "<DOMAIN>",
                            version || "<VERSION>",
                            npType || "<BUYER/SELLER>"
                        )}
                    </code>
                    .
                </p>
            ),
        },
        {
            id: "transaction",
            icon: <AiOutlineNumber className="w-4 h-4 text-amber-600" />,
            title: "Transaction ID Rules",
            warning: true,
            content: (
                <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex gap-1.5">
                        <span className="text-amber-600">•</span>
                        <span>
                            All APIs in a flow{" "}
                            <strong className="text-amber-700">
                                must share the same transaction_id
                            </strong>
                        </span>
                    </li>
                    <li className="flex gap-1.5">
                        <span className="text-amber-600">•</span>
                        <span>
                            Different flows{" "}
                            <strong className="text-amber-700">
                                cannot have the same transaction_id
                            </strong>
                        </span>
                    </li>
                </ul>
            ),
        },
        {
            id: "message",
            icon: <BiMessageSquareDetail className="w-4 h-4 text-amber-600" />,
            title: "Message ID Rules",
            warning: true,
            content: (
                <ul className="text-xs text-gray-600 space-y-1">
                    <li className="flex gap-1.5">
                        <span className="text-amber-600">•</span>
                        <span>
                            APIs in pairs{" "}
                            <strong className="text-amber-700">
                                must have the same message_id
                            </strong>
                        </span>
                    </li>
                    <li className="flex gap-1.5">
                        <span className="text-amber-600">•</span>
                        <span>
                            All other APIs{" "}
                            <strong className="text-amber-700">
                                should have different message_ids
                            </strong>
                        </span>
                    </li>
                </ul>
            ),
        },
        {
            id: "webhook",
            icon: <BiGitBranch className="w-4 h-4" />,
            title: "Webhook Requests",
            content: (
                <p className="text-xs text-gray-600">
                    You'll receive POST at{" "}
                    <code className="px-1 bg-gray-100 rounded text-xs">
                        &#60;subscriber_url&#62;/&#60;action&#62;
                    </code>{" "}
                    with payload and headers.
                </p>
            ),
        },
        {
            id: "settings",
            icon: <AiOutlineSetting className="w-4 h-4" />,
            title: "Flow Settings",
            content: (
                <p className="text-xs text-gray-600">
                    Disable validations using the <strong>Flow Settings</strong> button at the top.
                </p>
            ),
        },
        {
            id: "delete",
            icon: <AiOutlineDelete className="w-4 h-4 text-red-600" />,
            title: "Deleting a Flow",
            content: (
                <p className="text-xs text-gray-600">
                    Deleting clears all data. Retry with a{" "}
                    <strong className="text-red-700">DIFFERENT transaction_id</strong>.
                </p>
            ),
        },
        {
            id: "complete",
            icon: <AiOutlineStop className="w-4 h-4" />,
            title: "Completing a Flow",
            content: (
                <p className="text-xs text-gray-600">
                    After completion, <strong>manually stop the flow</strong> before starting a new
                    one.
                </p>
            ),
        },
        {
            id: "report",
            icon: <AiOutlineFileText className="w-4 h-4 text-emerald-600" />,
            title: "Generating Reports",
            content: (
                <p className="text-xs text-gray-600">
                    Click{" "}
                    <span className="px-1 bg-emerald-100 rounded text-emerald-700 font-medium">
                        Generate Report
                    </span>{" "}
                    anytime to view complete report.
                </p>
            ),
        },
    ];

    const faqItems = [
        {
            id: "faq1",
            question: 'What does "Waiting" status mean?',
            answer: 'The "Waiting" status indicates that this API is expecting you to send a request to the specified endpoint. The flow will not proceed until this request is made.',
        },
        {
            id: "faq2",
            question: "Why can't I use the same transaction_id for different flows?",
            answer: "Each flow represents a unique transaction. Using the same transaction_id would cause conflicts and make it impossible to distinguish between different flow executions. Always use a unique transaction_id for each new flow.",
        },
        {
            id: "faq3",
            question: "What happens to my data when I delete a flow?",
            answer: "Deleting a flow permanently removes all associated data, including requests, responses, and metadata. This action cannot be undone. If you need to retry, you must start with a new, different transaction_id.",
        },
        {
            id: "faq4",
            question: "When should APIs have the same message_id?",
            answer: "APIs should share the same message_id only when they are displayed as pairs (typically a request-response pair). All other APIs in your flow should have unique message_ids to maintain proper tracking.",
        },
        {
            id: "faq5",
            question: "Can I start a new flow without stopping the current one?",
            answer: "No, you must manually stop the current flow before starting a new one. This ensures data integrity and prevents conflicts between concurrent flows.",
        },
        {
            id: "faq6",
            question: "How do I disable validations?",
            answer: 'Click on the "Flow Settings" button at the top of the page. From there, you can toggle validation options on or off based on your testing needs.',
        },
        {
            id: "faq7",
            question: "When can I generate a report?",
            answer: "You can generate a report at any point during or after flow execution. The report will contain all available data up to that moment and will automatically open in a new view.",
        },
    ];

    return (
        <div className="h-full flex flex-col bg-white border-l">
            {/* Section Tabs */}
            <div className="flex border-b bg-gray-50">
                <button
                    onClick={() => setActiveSection("guide")}
                    className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-colors ${
                        activeSection === "guide"
                            ? "text-sky-600 border-b-2 border-sky-600 bg-white"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    Guide
                </button>
                <button
                    onClick={() => setActiveSection("faq")}
                    className={`flex-1 px-3 py-2.5 text-sm font-semibold transition-colors ${
                        activeSection === "faq"
                            ? "text-sky-600 border-b-2 border-sky-600 bg-white"
                            : "text-gray-600 hover:text-gray-900"
                    }`}
                >
                    FAQ
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto">
                {activeSection === "guide" ? (
                    <div className="p-3 space-y-2">
                        {guideItems.map((item) => {
                            const isOpen = openItems[item.id];
                            return (
                                <div
                                    key={item.id}
                                    className={`border rounded transition-colors ${
                                        isOpen
                                            ? "border-sky-300 bg-sky-50"
                                            : "border-gray-200 bg-white"
                                    }`}
                                >
                                    <button
                                        onClick={() => toggleItem(item.id)}
                                        className="w-full px-2.5 py-2 flex items-center justify-between hover:bg-gray-50"
                                    >
                                        <div className="flex items-center gap-2">
                                            <div className="flex-shrink-0">{item.icon}</div>
                                            <span className="text-sm font-medium text-gray-900 flex items-center gap-1.5">
                                                {item.title}
                                                {item.warning && (
                                                    <AiOutlineWarning className="w-3.5 h-3.5 text-amber-600" />
                                                )}
                                            </span>
                                        </div>
                                        <IoChevronDown
                                            className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="px-2.5 pb-2.5 pt-1 border-t border-gray-200">
                                            {item.content}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="p-3 space-y-2">
                        {faqItems.map((item) => {
                            const isOpen = openItems[item.id];
                            return (
                                <div
                                    key={item.id}
                                    className={`border rounded transition-colors ${
                                        isOpen
                                            ? "border-sky-300 bg-sky-50"
                                            : "border-gray-200 bg-white"
                                    }`}
                                >
                                    <button
                                        onClick={() => toggleItem(item.id)}
                                        className="w-full px-2.5 py-2 flex items-center justify-between text-left hover:bg-gray-50"
                                    >
                                        <span className="text-sm font-medium text-gray-900 pr-2">
                                            {item.question}
                                        </span>
                                        <IoChevronDown
                                            className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${
                                                isOpen ? "rotate-180" : ""
                                            }`}
                                        />
                                    </button>
                                    {isOpen && (
                                        <div className="px-2.5 pb-2.5 pt-1 border-t border-gray-200">
                                            <p className="text-xs text-gray-600 leading-relaxed">
                                                {item.answer}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}

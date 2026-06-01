import type { ToolMessage } from "../../hooks/use-chat-session";
import { ProposeEditCard } from "../ProposeEditCard";
import { ToolCallCard } from "../ToolCallCard";

interface InspectorMessageListProps {
    messages: ToolMessage[];
}

export function InspectorMessageList({ messages }: InspectorMessageListProps) {
    if (messages.length === 0) {
        return (
            <div className="text-[11px] text-gray-500 italic border border-dashed border-gray-300 rounded p-3 text-center">
                No runs yet. Pick a tool, supply args, click Run.
            </div>
        );
    }
    return (
        <div className="flex flex-col gap-2">
            {messages.map((m) =>
                m.toolName === "propose_step_edit" ? (
                    <ProposeEditCard key={m.id} message={m} />
                ) : (
                    <ToolCallCard key={m.id} message={m} />
                )
            )}
        </div>
    );
}

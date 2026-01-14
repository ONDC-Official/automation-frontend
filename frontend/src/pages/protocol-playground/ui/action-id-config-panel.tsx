import { useContext } from "react";
import { IoMdTrash } from "react-icons/io";
import { MdEdit } from "react-icons/md";
import { TbColumnInsertLeft, TbColumnInsertRight } from "react-icons/tb";
import { RxReset } from "react-icons/rx";
import { Tooltip } from "antd";
import { HiOutlineInformationCircle } from "react-icons/hi2";

import { PlaygroundContext } from "@pages/protocol-playground/context/playground-context";
import IconButton from "@components/IconButton";

interface ActionIdConfigurationPanelProps {
  actionId: string | undefined;
  onEditActionClick?: () => void;
  onAddBeforeClick?: () => void;
  onAddAfterClick?: () => void;
  onDeleteClick?: () => void;
}

export function ActionIdConfigurationPanel({
  actionId,
  onEditActionClick,
  onAddBeforeClick,
  onAddAfterClick,
  onDeleteClick,
}: ActionIdConfigurationPanelProps) {
  const playgroundContext = useContext(PlaygroundContext);

  if (!actionId) {
    return (
      <div className="h-11 px-6 flex items-center bg-white border-b border-gray-200">
        <p className="text-sm text-gray-400">Select an action to view details</p>
      </div>
    );
  }

  const actionConfig = playgroundContext.config?.steps.find((step) => step.action_id === actionId);

  if (!actionConfig) {
    return (
      <div className="h-11 px-6 flex items-center bg-white border-b border-red-200">
        <span className="text-sm text-red-600 font-medium">⚠️ Action not found</span>
      </div>
    );
  }

  // Method styling
  const method = "POST"; // Extract from config if available
  const methodStyles: Record<string, string> = {
    POST: "bg-emerald-500 text-white",
    GET: "bg-blue-500 text-white",
    PUT: "bg-amber-500 text-white",
    DELETE: "bg-red-500 text-white",
  };

  // Hover card content
  const ActionDetailsCard = () => (
    <div className="w-80 p-4 bg-white border border-gray-200 rounded-lg shadow-xl">
      {/* Header */}
      <div className="pb-3 mb-3 border-b border-gray-100">
        <div className="flex items-center gap-2 mb-1">
          <span className={`px-2 py-0.5 rounded text-xs font-bold ${methodStyles[method]}`}>
            {method}
          </span>
          <span className="text-sm text-gray-500 font-mono">/{actionConfig.api}</span>
        </div>
        <h4 className="text-base font-semibold text-gray-900 font-mono">
          {actionConfig.action_id}
        </h4>
      </div>

      {/* Properties Grid */}
      <div className="space-y-2.5 mb-3">
        <div className="flex items-start">
          <span className="text-xs font-medium text-gray-500 w-24 flex-shrink-0 pt-0.5">Owner</span>
          <span
            className={`text-sm font-medium ${actionConfig.owner === "BPP" ? "text-purple-700" : "text-sky-700"}`}
          >
            {actionConfig.owner}
          </span>
        </div>

        <div className="flex items-start">
          <span className="text-xs font-medium text-gray-500 w-24 flex-shrink-0 pt-0.5">
            Unsolicited
          </span>
          <span
            className={`text-sm font-medium ${actionConfig.unsolicited ? "text-green-600" : "text-gray-600"}`}
          >
            {actionConfig.unsolicited ? "Yes" : "No"}
          </span>
        </div>

        {actionConfig.responseFor && actionConfig.responseFor !== "NONE" && (
          <div className="flex items-start">
            <span className="text-xs font-medium text-gray-500 w-24 flex-shrink-0 pt-0.5">
              Response For
            </span>
            <span className="text-sm font-medium text-indigo-700 font-mono">
              {actionConfig.responseFor}
            </span>
          </div>
        )}
      </div>

      {/* Description */}
      {actionConfig.description && (
        <div className="pt-3 border-t border-gray-100">
          <span className="text-xs font-medium text-gray-500 block mb-1.5">Description</span>
          <p className="text-sm text-gray-700 leading-relaxed">{actionConfig.description}</p>
        </div>
      )}
    </div>
  );

  return (
    <div className="h-11 px-6 flex items-center justify-between gap-4 bg-white border-b border-gray-200">
      {/* Left side - Minimal Info */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        {/* Method + API */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-md">
          <span
            className={`px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide ${methodStyles[method]}`}
          >
            {method}
          </span>
          <span className="text-sm font-medium text-gray-700 font-mono max-w-[200px] truncate">
            /{actionConfig.api}
          </span>
        </div>

        {/* Action ID */}
        <span className="text-sm font-semibold text-gray-900 font-mono">
          {actionConfig.action_id}
        </span>

        {/* Info Icon with Hover Card */}
        <Tooltip
          title={<ActionDetailsCard />}
          placement="bottomLeft"
          mouseEnterDelay={0.4}
          arrow={false}
          overlayInnerStyle={{ maxWidth: "none" }}
        >
          <button className="inline-flex items-center justify-center w-7 h-7 rounded-md text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
            <HiOutlineInformationCircle size={18} />
          </button>
        </Tooltip>
      </div>

      {/* Right side - Action Buttons */}
      <div className="flex items-center gap-1 flex-shrink-0">
        <Tooltip title={<span className="text-xs">Reset</span>} mouseEnterDelay={0.5}>
          <div>
            <IconButton
              icon={<RxReset size={15} />}
              onClick={() => playgroundContext.resetTransactionHistory(actionId)}
              color="gray"
              label=""
            />
          </div>
        </Tooltip>
        <Tooltip title={<span className="text-xs">Insert Before</span>} mouseEnterDelay={0.5}>
          <div>
            <IconButton
              icon={<TbColumnInsertLeft size={15} />}
              onClick={onAddBeforeClick}
              color="gray"
              label=""
            />
          </div>
        </Tooltip>
        <Tooltip title={<span className="text-xs">Insert After</span>} mouseEnterDelay={0.5}>
          <div>
            <IconButton
              icon={<TbColumnInsertRight size={15} />}
              onClick={onAddAfterClick}
              color="gray"
              label=""
            />
          </div>
        </Tooltip>
        <Tooltip title={<span className="text-xs">Edit</span>} mouseEnterDelay={0.5}>
          <div>
            <IconButton
              icon={<MdEdit size={15} />}
              onClick={onEditActionClick}
              color="sky"
              label=""
            />
          </div>
        </Tooltip>
        <Tooltip title={<span className="text-xs">Delete</span>} mouseEnterDelay={0.5}>
          <div>
            <IconButton
              icon={<IoMdTrash size={15} />}
              onClick={onDeleteClick}
              color="red"
              label=""
            />
          </div>
        </Tooltip>
      </div>
    </div>
  );
}

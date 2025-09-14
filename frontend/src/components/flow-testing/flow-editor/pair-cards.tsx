import { PairedStep } from "../flow-state-viewer/mapped-flow";
import CustomTooltip from "../../ui/mini-components/tooltip";
import { MdSyncAlt } from "react-icons/md";
import { useSession } from "../../../context/context";
import FlippableWrapper from "../../ui/flippable-div";
import { getCompletePayload } from "../../../utils/request-utils";
import { FiEdit2, FiPlusCircle, FiTrash2 } from "react-icons/fi";
import IconButton from "../../ui/mini-components/icon-button";

export default function PairedCard({
  pairedStep,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: {
  pairedStep: PairedStep;
  onAddClick: (index: number) => void;
  onEditClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
}) {
  const { first, second } = pairedStep;
  return (
    <div className="flex flex-col sm:flex-row sm:items-stretch space-y-2 sm:space-y-0 sm:space-x-4 bg-white p-2 rounded-lg">
      {/* First Step */}
      <div className="flex-1">
        <StepDisplay
          step={first}
          onAddClick={onAddClick}
          onEditClick={onEditClick}
          onDeleteClick={onDeleteClick}
        />
      </div>

      {/* Separator Icon */}
      {second && (
        <div className="flex justify-center items-center">
          {/* <div className="p-2 rounded-full bg-slate-100 shadow-md border"> */}
          <MdSyncAlt className={`text-3xl font-bold text-slate-500`} />
          {/* </div> */}
        </div>
      )}

      {/* Second Step */}
      {second && (
        <div className="flex-1">
          <StepDisplay
            step={second}
            onAddClick={onAddClick}
            onEditClick={onEditClick}
            onDeleteClick={onDeleteClick}
          />
        </div>
      )}
    </div>
  );
}

function StepDisplay({
  step,
  onAddClick,
  onEditClick,
  onDeleteClick,
}: {
  step: any;
  onAddClick: (index: number) => void;
  onEditClick: (index: number) => void;
  onDeleteClick: (index: number) => void;
}) {
  const { setRequestData, setResponseData } = useSession();

  const onClickFunc = async () => {
    if (step.status !== "COMPLETE") {
      // setRequestData(step);
      // setResponseData(step);
      setRequestData({ info: "Step not complete" });
      setResponseData({ info: "Step not complete" });
      return;
    }
    const payloadIds =
      step.payloads?.payloads?.map((p: any) => p.payloadId) ?? [];
    const payloads = await getCompletePayload(payloadIds);
    setRequestData(payloads.map((p: any) => p.req));
    setResponseData({ res: payloads.map((p: any) => p.res) });
  };

  const statusStyles = {
    card: "border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-md shadow-slate-200",
    messageBg: "bg-slate-400 text-white",
  };
  if (step.missedStep) {
    statusStyles.card =
      "border-purple-200  bg-gradient-to-br from-purple-50 to-purple-100 shadow-md shadow-purple-200";
  }
  // if (
  //   flowId !== activeFlowId &&
  //   ["LISTENING", "RESPONDING", "INPUT-REQUIRED"].includes(status)
  // ) {
  //   statusStyles.messageText = "INACTIVE";
  // }

  return (
    // <CustomTooltip content={step.description ?? ""}>
    <FlippableWrapper flipTrigger={step.status}>
      <button
        className={`${statusStyles?.card} w-full h-full rounded-lg p-3 border shadow-sm hover:shadow-lg transition-all duration-200`}
        onClick={onClickFunc}
      >
        <div className="w-full flex flex-col space-y-1">
          {/* Header */}
          <div className="flex justify-between items-center">
            <h1 className="text-md font-semibold text-gray-800 flex">
              {step.missedStep ? "" : `${step.index + 1}: `}
              {step.actionType}
              {step.label && (
                <span className="text-md font-normal text-gray-500 ml-2 ">
                  ({step.label})
                </span>
              )}
            </h1>
            <div className="flex items-center gap-2">
              {step.unsolicited && (
                <div className="bg-white text-gray-700 text-sm font-semibold border rounded-full px-3 py-1">
                  unsolicited
                </div>
              )}
              <CustomTooltip content={step.description ?? ""}>
                <div className="bg-white text-gray-700 text-sm font-semibold border rounded-full px-3 py-1 hover:shadow-md">
                  info
                </div>
              </CustomTooltip>
              <div className="flex items-center gap-2">
                <IconButton
                  icon={<FiEdit2 className="text-md" />}
                  label="Edit"
                  color="sky"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onEditClick(step.index);
                  }}
                />
                <IconButton
                  icon={<FiPlusCircle className="text-md" />}
                  label="Add"
                  color="green"
                  onClick={(e: any) => {
                    e.stopPropagation();
                    onAddClick(step.index);
                  }}
                />
                {step.index !== 0 && (
                  <IconButton
                    icon={<FiTrash2 className="text-md" />}
                    label="Delete"
                    color="red"
                    onClick={(e: any) => {
                      e.stopPropagation();
                      onDeleteClick(step.index);
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </button>
    </FlippableWrapper>
    // </CustomTooltip>
  );
}

// function getStatusStyles(
//   status:
//     | "ERROR"
//     | "SUCCESS"
//     | "LISTENING"
//     | "RESPONDING"
//     | "INPUT-REQUIRED"
//     | "WAITING"
// ) {
//   switch (status) {
//     case "SUCCESS":
//       return {
//         card: "border-green-300 bg-green-100 shadow-md shadow-green-200",
//         messageText: "ACK",
//         messageBg: "bg-gradient-to-r from-green-600 to-green-500 text-white",
//       };

//     case "ERROR":
//       return {
//         card: "border-red-300 bg-red-100 shadow-md shadow-red-200",
//         messageText: "NACK",
//         messageBg: "bg-gradient-to-r from-red-600 to-red-500 text-white",
//       };

//     case "RESPONDING":
//       return {
//         card: "border-blue-300 bg-gradient-to-br from-blue-50 to-blue-200 shadow-md shadow-blue-200",
//         messageText: "SENDING",
//         messageBg: "bg-gradient-to-r from-blue-600 to-blue-400 text-white",
//       };
//     case "INPUT-REQUIRED":
//       return {
//         card: "border-sky-300 bg-gradient-to-br from-sky-50 to-sky-200 shadow-md shadow-sky-200",
//         messageText: "SENDING",
//         messageBg: "bg-gradient-to-r from-sky-600 to-sky-400 text-white",
//       };

//     case "LISTENING":
//       return {
//         card: "border-yellow-300 bg-gradient-to-br from-yellow-50 to-yellow-200 shadow-md shadow-yellow-200",
//         messageText: "WAITING",
//         messageBg: "bg-gradient-to-r from-yellow-600 to-yellow-500 text-white",
//       };

//     case "WAITING":
//       return {
//         card: "border-gray-200 bg-gradient-to-br from-slate-50 to-slate-100 shadow-md shadow-slate-200",
//         messageBg: "bg-slate-400 text-white",
//       };
//   }
// }

import React, { useState, useEffect } from "react";
import { MdCheckCircle, MdError, MdHourglassEmpty } from "react-icons/md";
import { State } from "../../types/session-types";
import { GetCurrentState, getRequestResponse } from "../../utils/flow-utils";
import "../../styles/animation.css";
import CustomTooltip from "../ui/mini-components/tooltip";
import { IoIosInformationCircleOutline } from "react-icons/io";
import SequenceCard from "./SequenceCard";
import { v4 as uuidv4 } from "uuid";
import {
	addExpectation,
	getCompletePayload,
	triggerRequest,
} from "../../utils/request-utils";
import Popup from "../ui/pop-up/pop-up";
import FormConfig from "../ui/forms/config-form/config-form";
import { toast } from "react-toastify";

// Reusable StateCard component with CSS-based animation
export const StateCard: React.FC<{
	data: State;
}> = ({ data }) => {
	const [animate, setAnimate] = useState(false);
	const [prevState, setPrevState] = useState("inactive");
	const [showPopup, setShowPopup] = useState(false);
	const [cardState, setCardState] = useState("inactive");

	const getStateStyles = (state: string) => {
		switch (state) {
			case "success":
				return {
					className:
						"border border-green-500 bg-white text-green-700 shadow-lg shadow-green-300/50",
					icon: <MdCheckCircle className="text-green-500 text-2xl" />,
					color: "green",
				};
			case "error":
				return {
					className:
						"border border-red-500 bg-white text-red-700 shadow-lg shadow-red-300/50",
					icon: <MdError className="text-red-500 text-2xl" />,
					color: "red",
				};
			case "pending":
				return {
					className:
						"border border-yellow-500 bg-white text-yellow-700 shadow-lg shadow-yellow-300/50",
					icon: <MdHourglassEmpty className="text-yellow-500 text-2xl" />,
					color: "yellow",
				};
			case "inactive":
			default:
				return {
					className:
						"border border-gray-300 bg-white text-gray-700 shadow-lg shadow-gray-300/50",
					icon: null,
					color: "gray",
				};
		}
	};

	const index = data.stepIndex - 1;

	useEffect(() => {
		let state = "inactive";
		if (data.transactionData === undefined) {
			state = "inactive";
			if (data.expect && data.activeFlowId === data.flowId) {
				state = "pending";
			}
		} else {
			state = GetCurrentState(
				index,
				data.transactionData.apiList,
				data.transactionData?.flowId || "",
				data.activeFlowId
			);
		}

		setCardState(state);
	}, [data]);

	const styles = getStateStyles(cardState);

	useEffect(() => {
		if (prevState !== cardState) {
			setAnimate(true);
			const timer = setTimeout(() => {
				setAnimate(false);
			}, 300);

			setPrevState(cardState);

			return () => clearTimeout(timer);
		}
		if (cardState === "pending") {
			triggerApiRequest();
		}
	}, [cardState, prevState]);

	const handleClick = async () => {
		data.setSideView(
			getRequestResponse(index, data.type, data.transactionData?.apiList)
		);
	};

	const triggerApiRequest = async () => {
		const txn = await getTransactionId(data);
		console.log("running trigger");
		if (data.sessionData?.npType === "BAP") {
			if (data.owner === "BPP") {
				if (data.input === undefined) {
					triggerRequest(
						data.type,
						data.key,
						txn,
						data.sessionId,
						data.flowId,
						data.sessionData,
						data.subscriberUrl
					);
				} else {
					setShowPopup(true);
				}
			} else {
				if (data.expect) {
					await addExpectation(
						data.type,
						data.flowId,
						data.subscriberUrl,
						data.sessionId
					);
				}
				toast.info("waiting for BAP request");
			}
		} else {
			if (data.owner === "BAP") {
				if (data.input === undefined) {
					triggerRequest(
						data.type,
						data.key,
						txn,
						data.sessionId,
						data.flowId,
						data.sessionData,
						data.subscriberUrl
					);
				} else {
					setShowPopup(true);
				}
			} else {
				if (data.expect) {
					await addExpectation(
						data.type,
						data.flowId,
						data.subscriberUrl,
						data.sessionId
					);
				}
				toast.info("waiting for BPP request");
			}
		}
	};

	const handlePopupSubmit = async (formData: Record<string, string>) => {
		const jsonPathChanges = {
			json_path_changes: formData,
		};
		const txn = await getTransactionId(data);
		triggerRequest(
			data.type,
			data.key,
			txn,
			data.sessionId,
			data.flowId,
			data.sessionData,
			data.subscriberUrl,
			jsonPathChanges
		);
		setShowPopup(false);
	};

	return (
		<button
			className={`${animate ? "animate-pop" : ""} ${
				styles.className
			} rounded-md p-2 w-full flex items-center justify-between relative transition-transform duration-300 ease-in-out transform hover:bg-slate-50`}
			onClick={() => handleClick()}
		>
			<div className="flex items-center space-x-2">
				{styles.icon}
				<h3 className="text-md font-semibold">
					{`${data.stepIndex}. ${data.type} `}
				</h3>
				{cardState === "pending" && (
					<div className="w-4 h-4 border-2 border-t-2 border-gray-300 border-t-yellow-500 rounded-full animate-spin-slow ml-2"></div>
				)}
			</div>
			<CustomTooltip content={data.description}>
				<button>
					<IoIosInformationCircleOutline className=" text-2xl cursor-pointer" />
				</button>
			</CustomTooltip>
			{data.input && (
				<Popup isOpen={showPopup}>
					<FormConfig formConfig={data.input} submitEvent={handlePopupSubmit} />
				</Popup>
			)}
		</button>
	);
};

export default SequenceCard;
async function getTransactionId(data: State) {
	let txn = uuidv4();
	if (
		data.stepIndex > 0 &&
		data.transactionData?.apiList &&
		data.transactionData?.apiList.length > 0
	) {
		const completePayload = await getCompletePayload(
			data.transactionData.apiList.map((api) => api.payloadId)
		);
		txn = completePayload.context.transaction_id;
	}
	return txn;
}

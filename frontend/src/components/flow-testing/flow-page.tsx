import { useEffect, useState } from "react";
import { FormInput } from "../ui/forms/form-input";
import FormSelect from "../ui/forms/form-select";
import GenericForm from "../ui/forms/generic-form";
import axios from "axios";
import { FetchFlowsResponse } from "../../types/flow-types";
import RenderFlows from "./render-flows";
import Stepper from "../ui/mini-components/stepper";
import { MdOutlineDomainVerification } from "react-icons/md";
import { PiSwordBold } from "react-icons/pi";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { TbFileInfo } from "react-icons/tb";
import { toast } from "react-toastify";
import Heading from "../ui/mini-components/ondc-gradient-text";
import DifficultyForm from "./difficulty-form";
import { ReportPage } from "./report";
import { FormGuide } from "./guides";

export default function FlowContent() {
	const [step, setStep] = useState(0);
	const [session, setSession] = useState<string | null>(null);
	const [subUrl, setSubUrl] = useState<string>("");
	const [flows, setFlows] = useState<FetchFlowsResponse | null>(null);

	const onSubmit = async (data: any) => {
		try {
			console.log("data", data);
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/sessions`,
				{
				...data,
				difficulty_cache: {
					stopAfterFirstNack: true,
					timeValidations: true,
					protocolValidations: true,
					useGateway: true,
					headerValidaton: true,
					totalDifficulty: 100,
				},
				}
			);
			setSubUrl(data.subscriberUrl);
			console.log("response", response.data);
			setSession(response.data.sessionId);
			setStep((s) => s + 1);
		} catch (e) {
			toast.error("Error while creating session");
			console.error("error while sending response", e);
		}
	};
	const fetchFlows = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/flow`,
				{}
			);
			setFlows(response.data);
		} catch (e) {
			console.log("error while fetching flows", e);
		}
	};

	useEffect(() => {
		fetchFlows();
	}, []);

	const Body = () => {
		switch (step) {
			case 0:
				return (
					<div className="flex flex-1 w-full">
						<div className="sm:w-[60%] p-2 bg-white rounded-md shadow-md border">
							<Heading size=" text-xl" className="mb-2">
								Details
							</Heading>
							<GenericForm onSubmit={onSubmit}>
								<FormInput
									label="Enter Subscriber Url"
									name="subscriberUrl"
									required={true}
									labelInfo="your registered subscriber url"
								/>
								<FormSelect
									name="domain"
									label="Select Domain"
									options={["ONDC:TRV11"]}
									required
								/>
								<FormSelect
									label="Enter Version"
									name="version"
									required={true}
									options={["2.0.1"]}
								/>
								<FormInput
									label="Enter City Code"
									name="city"
									required={true}
								/>
								<FormSelect
									name="participantType"
									label="Select Type"
									options={["BAP", "BPP"]}
									required
								/>
								<FormSelect
									name="Environment"
									label="Select Environment"
									options={["STAGING"]} //"PRE-PRODUCTION"
									required
								/>
							</GenericForm>
						</div>
						<div className="w-full sm:w-[40%] ml-1">
							<FormGuide />
						</div>
					</div>
				);
			// case 1:
			// 	return (
			// 		<div className="w-full bg-white p-2 rounded-md shadow-md">
			// 			<Heading size=" text-xl mt-2 p-2" className=" mb-2">
			// 				Configure Difficulty
			// 			</Heading>
			// 			<DifficultyForm
			// 				submitFunction={async () => {
			// 					setStep((s) => s + 1);
			// 				}}
			// 				subUrl={subUrl}
			// 			/>
			// 		</div>
			// 	);
			case 1:
				if (!flows) return <h1>Loading...</h1>;
				return <RenderFlows flows={flows} subUrl={subUrl} setStep={setStep} />;
			case 2:
				if (!session) return <h1>Loading...</h1>;
				return <ReportPage sessionID={session} subUrl={subUrl} />;
			default:
				return <h1>hello</h1>;
		}
	};
	return (
		<>
			<div className="w-full items-center">
				<Stepper
					steps={[
						{
							icon: <TbFileInfo className=" text-2xl" />,
							label: "FILL DETAILS",
						},
						// {
						// 	icon: <PiSwordBold className=" text-2xl" />,
						// 	label: "SELECT DIFICULTY",
						// },
						{
							icon: <MdOutlineDomainVerification className=" text-2xl" />,
							label: "TEST FLOWS",
						},
						{
							icon: <HiOutlineDocumentReport className=" text-2xl" />,
							label: "VIEW REPORT",
						},
					]}
					currentStep={step}
				/>
				<div className="p-2 mt-2">
					<Body />
				</div>
			</div>
		</>
	);
}

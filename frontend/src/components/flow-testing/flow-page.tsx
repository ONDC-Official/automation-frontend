import { useState } from "react";
import { FormInput } from "../ui/forms/form-input";
import FormSelect from "../ui/forms/form-select";
import GenericForm from "../ui/forms/generic-form";
import axios from "axios";
import { Flow } from "../../types/flow-types";
import RenderFlows from "./render-flows";
import Stepper from "../ui/mini-components/stepper";
import { MdOutlineDomainVerification } from "react-icons/md";
import { HiOutlineDocumentReport } from "react-icons/hi";
import { TbFileInfo } from "react-icons/tb";
import { toast } from "react-toastify";
import Heading from "../ui/mini-components/ondc-gradient-text";
import { ReportPage } from "./report";
import { FormGuide } from "./guides";

export default function FlowContent() {
	const [step, setStep] = useState(0);
	const [session, setSession] = useState<string>("");
	const [subUrl, setSubUrl] = useState<string>("");
	const [flows, setFlows] = useState<Flow[] | null>(null);
	const [report, setReport] = useState("");

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
			const localData =
				JSON.parse(localStorage.getItem("sessionIdForSupport") as string) || {};
			localStorage.setItem(
				"sessionIdForSupport",
				JSON.stringify({
					scenarioSession: response.data.sessionId,
					...localData,
				})
			);
			setSession(response.data.sessionId);
			setStep((s) => s + 1);
		} catch (e) {
			toast.error("Error while creating session");
			console.error("error while sending response", e);
		}
	};
	const fetchFlows = async (data: any) => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/config/flows`,
				{
					params:  {
						domain: data.domain,
						version: data.version,
						usecase: data.usecaseId
					}
				}
			);
			setFlows(response.data.data.flows);
			console.log("flows", response.data);
		} catch (e) {
			console.log("error while fetching flows", e);
		}
	};

	const onSubmitHandler = async (data: any) => {
		await fetchFlows(data)
		await onSubmit(data)
	}

	// useEffect(() => {
	// 	fetchFlows();
	// }, []);

	const Body = () => {
		switch (step) {
			case 0:
				return (
					<div className="flex flex-1 w-full">
						<div className="sm:w-[60%] p-2 bg-white rounded-md shadow-md border">
							<Heading size=" text-xl" className="mb-2">
								Details
							</Heading>
							<GenericForm onSubmit={onSubmitHandler}>
								<FormInput
									label="Enter Subscriber Url"
									name="subscriberUrl"
									required={true}
									labelInfo="your registered subscriber url"
									validations={{
										pattern: {
											value: /^https:\/\/.*/,
											message: "URL must start with https://",
										},
									}}
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
									options={["2.0.0"]}
								/>
								<FormSelect
									label="Enter Usecase"
									name="usecaseId"
									required={true}
									options={["Metro", "Bus"]}
								/>
								{/* <FormInput
									label="Enter City Code"
									name="city"
									required={true}
								/> */}
								<FormSelect
									name="npType"
									label="Select Type"
									options={["BAP", "BPP"]}
									required
								/>
								<FormSelect
									name="env"
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
				console.log("flows", flows);
				return (
					<RenderFlows
						flows={flows}
						subUrl={subUrl}
						sessionId={session}
						setStep={setStep}
						setReport={setReport}
					/>
				);
			case 2:
				if (!session) return <h1>Loading...</h1>;
				return <ReportPage subUrl={subUrl} report={report} setStep={setStep} />;
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

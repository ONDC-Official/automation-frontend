import { useState, useEffect, useRef } from "react";
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
	const [dynamicList, setDynamicList] = useState({
		domain: [],
		version: [],
		usecase: []
	})
	const [dynamicValue, setDyanmicValue] = useState({
		domain: "",
		version: "",
		usecaseId: "",
		subscriberUrl: "",
		npType: "BAP",
		env: "STAGING"
	})
	const formData =  useRef({
		domain: "",
		version: "",
		usecaseId: "",
		subscriberUrl: "",
		npType: "BAP",
		env: "STAGING"
	})

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
		console.log("is it working")
		await fetchFlows(data)
		await onSubmit(data)
	}

	const fetchFormFieldData = async () => {
		try {
			const response = await axios.get(
				`${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
			);
			setDynamicList((prev) => {
				return { ...prev, domain: response.data.domain || [] };
			});
			console.log("form field data", response.data);
		} catch (e) {
			console.log("error while fetching form field data", e);
		}
	}

	useEffect(() => {
		fetchFormFieldData()
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
							<GenericForm defaultValues={formData.current} onSubmit={onSubmitHandler}>
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
									onValueChange={(data: string) => {
										// setDyanmicValue(prev => {
										// 	return {
										// 		...prev, subscriberUrl: data
										// 	}
										// })
										formData.current = {...formData.current, subscriberUrl: data}
									}}
								/>
								<FormSelect
									name="domain"
									label="Select Domain"
									options={dynamicList.domain.map((val: any) => val.key)}
									currentValue={dynamicValue.domain}
									setSelectedValue={(data: string) => {
										formData.current = {...formData.current, domain: data}
										// setDyanmicValue(prev => {
										// 	return {
										// 		...prev, 
										// 		domain: data
										// 	}
										// })
										setDynamicList(prev => {
											let  filteredVersion: any = []
											prev.domain.forEach((item: any) => {
												if(item.key === data) {
													filteredVersion = item.version
												}
											})
											return {
												...prev, version: filteredVersion
											}
										})
									}}
									nonSelectedValue
									required
								/>
								{dynamicList.version?.length ? <FormSelect
									label="Enter Version"
									name="version"
									required={true}
									options={dynamicList.version.map((val: any) => val.key)}
									currentValue={dynamicValue.version}
									setSelectedValue={(data: string) => {
										// setDyanmicValue(prev => {
										// 	return {
										// 		...prev, 
										// 		version: data
										// 	}
										// })
										formData.current = {...formData.current, version: data}
										setDynamicList(prev => {
											let  filteredUsecase: any = []
											prev.version.forEach((item: any) => {
												if(item.key === data) {
													filteredUsecase = item.usecase
												}
											})
											return {
												...prev, usecase: filteredUsecase
											}
										})
									}}
									nonSelectedValue
								/> : <></>}
								{dynamicList.usecase?.length ? <FormSelect
									label="Enter Usecase"
									name="usecaseId"
									required={true}
									options={dynamicList.usecase}
									currentValue={dynamicValue.usecaseId}
									setSelectedValue={(data: string) => {
										// setDyanmicValue(prev => {
										// 	return {
										// 		...prev, 
										// 		usecaseId: data
										// 	}
										// })
										formData.current = {...formData.current, usecaseId: data}
									}}
									nonSelectedValue
								/> : <></>}
								<FormSelect
									name="npType"
									label="Select Type"
									options={["BAP", "BPP"]}
									setSelectedValue={(data: string) => {
										setDyanmicValue(prev => {
											return {
												...prev, npType: data
											}
										})
										formData.current = {...formData.current, npType: data}
									}}
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
				return <ReportPage sessionId={session} report={report} setStep={setStep} />;
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

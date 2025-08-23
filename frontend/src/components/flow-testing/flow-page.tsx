import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Flow } from "../../types/flow-types";
import RenderFlows from "./render-flows";
import { toast } from "react-toastify";
import { ReportPage } from "./report";
import { FormGuide } from "./guides";
import InitialFlowForm from "./initial-form";
import NotFound from "../ui/not-found";
export default function FlowContent() {
	const [step, setStep] = useState(0);
	const [session, setSession] = useState<string>("");
	const [subUrl, setSubUrl] = useState<string>("");
	const [flows, setFlows] = useState<Flow[] | null>(null);
	const [report, setReport] = useState("");
	const [dynamicList, setDynamicList] = useState<{
		domain: any[];
		version: any[];
		usecase: any[];
	}>({
		domain: [],
		version: [],
		usecase: [],
	});
	const [dynamicValue, setDyanmicValue] = useState({
		domain: "",
		version: "",
		usecaseId: "",
		subscriberUrl: "",
		npType: "BAP",
		env: "STAGING",
	});
	const formData = useRef({
		domain: "",
		version: "",
		usecaseId: "",
		subscriberUrl: "",
		npType: "BAP",
		env: "STAGING",
	});

	const onSubmit = async (data: any) => {
		try {
			console.log("data", data);
			data = {
				...data,
				subscriberUrl: data?.subscriberUrl?.replace(/\/+$/, ""),
			};
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
					params: {
						domain: data.domain,
						version: data.version,
						usecase: data.usecaseId,
						options: ["WORKBENCH"],
					},
				}
			);
			setFlows(response.data.data.flows);
			console.log("flows", response.data);
		} catch (e) {
			console.log("error while fetching flows", e);
		}
	};

  const onSubmitHandler = async (data: any) => {
    console.log("is it working");
    await fetchFlows(data);
    await onSubmit(data);
  };

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
  };

  useEffect(() => {
    fetchFormFieldData();
  }, []);

	const Body = () => {
		switch (step) {
			case 0:
				return (
					<div className="flex flex-1 w-full">
						<div className="sm:w-[60%] p-2 bg-white rounded-sm border">
							<div className="mb-4">
								<h1 className="text-lg font-semibold mb-2">Scenario testing</h1>
								<p className="text-gray-600 text-sm">
									Please fill in the details below to begin flow testing.
								</p>
							</div>
							<InitialFlowForm
								formData={formData}
								onSubmitHandler={onSubmitHandler}
								dynamicList={dynamicList}
								setDyanmicValue={setDyanmicValue}
								dynamicValue={dynamicValue}
								setDynamicList={setDynamicList}
							/>
						</div>
						<div className="w-full sm:w-[40%] ml-1">
							<FormGuide />
						</div>
					</div>
				);
			case 1:
				if (!flows) return <h1>Loading...</h1>;
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
				return (
					<ReportPage sessionId={session} report={report} setStep={setStep} />
				);
			default:
				return <NotFound />;
		}
	};
	return (
		<>
			<div className="w-full items-center">
				{/* <Stepper
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
				/> */}
				<div className="p-2 mt-2">
					<Body />
				</div>
			</div>
		</>
	);
}

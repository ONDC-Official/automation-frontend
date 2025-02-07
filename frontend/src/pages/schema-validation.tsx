import { useState } from "react";
import Editor from "@monaco-editor/react";
import Markdown from "react-markdown";
import axios from "axios";
import { toast } from "react-toastify";
import { IoMdHelp } from "react-icons/io";

import Modal from "../components/modal";
import { buttonClass } from "../components/ui/forms/loading-button";
import Heading from "../components/ui/mini-components/ondc-gradient-text";
import SecondayHeader from "../components/secondary-header";
import SchemaGuide from "../components/schema-guide";

const INSTRUCTION = [
	`1. Request can be made using just the payload to validate schema of the payload`,
	`2. Ack status is returned in case of success`,
	`3. List of failed validations are returned in case of failure`,
];

const SchemaValidation = () => {
	const [payload, setPayload] = useState("");
	const [_responseValue, setResponseValue] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const [mdData, setMdData] = useState("");
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [isSuccessReponse, setIsSuccessResponse] = useState(true);
	const [isValidationOpen, setIsValidationOpen] = useState(false);
	const [isGuideOpen, setIsGuideOpen] = useState(true);
	// const [isModified, setIsModified] = useState(false);
	console.log(isSuccessReponse);
	const verifyRequest = async () => {
		if (payload === "") {
			toast.warn("Add payload for the request");
			return;
		}

		let parsedPayload;

		try {
			parsedPayload = JSON.parse(payload);
		} catch (e) {
			console.log("error while parsing ", e);
			toast.error("Invalid payload");
			return;
		}

		const action = parsedPayload?.context?.action;

		if (!action) {
			toast.warn("action missing from context");
			console.log("Action not available");
			return;
		}

		setMdData("");
		setResponseValue("");

		try {
			setIsLoading(true);
			const response = await axios.post(
				`${import.meta.env.VITE_BACKEND_URL}/flow/validate/${action}`,
				parsedPayload
			);
			setResponseValue(JSON.stringify(response.data, null, 2));
			setIsValidationOpen(true);
			setIsGuideOpen(false);
			if (response.data?.error?.message) {
				setMdData(response.data?.error?.message);
				setIsSuccessResponse(false);
			} else {
				setMdData("```\n" + JSON.stringify(response.data, null, 2) + "\n```");
				setIsSuccessResponse(true);
			}
		} catch (e) {
			console.log(">>>>>", e);
			toast.error("Something went wrong");
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<div
			className={`h-full shadow-md flex flex-col transition-all duration-300  `}
		>
			<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
				<h1 className="text-lg font-semibold text-gray-800">Instruction</h1>
				{INSTRUCTION?.map((item: string) => (
					<p className="text-sm text-gray-600">{item}</p>
				))}
			</Modal>
			<SecondayHeader
				title="Schema Validation"
				subtitle="Validates beckn schema and provides a list of validations"
			/>

			<div className="flex flex-row">
				<div className="w-[59%] p-4 gap-4 flex flex-col">
					<div className="flex flex-row items-center justify-between">
						<div className="flex flex-row items-center gap-4">
							<h1 className="text-lg font-semibold text-gray-800">
								Beckn JSON
							</h1>
							<div
								className="flex flex-row items-center cursor-pointer group"
								onClick={() => setIsModalOpen(true)}
							>
								<Heading className="text-sm transition-all duration-300 shadow-sm group-hover:text-blue-600">
									help
								</Heading>
								<IoMdHelp className="text-sky-500 transition-all duration-300 shadow-sm group-hover:bg-blue-100 group-hover:text-blue-600" />
							</div>
						</div>
					</div>

					<div className="flex flex-col">
						<div className={`relative`}>
							<Editor
								theme="vs"
								height={"70vh"}
								defaultLanguage="json"
								onChange={(value: any) => {
									// setIsModified(true);
									setPayload(value);
								}}
								value={payload}
								options={{
									minimap: { enabled: false },
								}}
							/>
						</div>
					</div>
					<div className="flex flex-row gap-4">
						<button
							className={`${buttonClass}`}
							onClick={verifyRequest}
							disabled={payload === ""}
						>
							{isLoading ? "Validating..." : "Validate"}
						</button>
					</div>
				</div>

				<div className="w-[39%] flex flex-col  my-4 ">
					<SchemaGuide title="Guide" state={isGuideOpen}>
						<p className="text-gray-700 mb-6">
							Lorem ipsum dolor sit, amet consectetur adipisicing elit. Illum
							impedit, illo aliquid, ratione possimus deleniti non expedita
							accusamus quasi iusto saepe dolores necessitatibus quos minima
							consequuntur? Quam, quisquam assumenda. Ab?
						</p>
					</SchemaGuide>
					<SchemaGuide title="Validations" state={isValidationOpen}>
						<div className="flex flex-col gap-4  ">
							{/* <div className="flex flex-row gap-2">
                <h1 className="text-lg font-semibold text-gray-800">
                  Validations
                </h1>
                {mdData && (
                  <Watermak status={isSuccessReponse ? "success" : "failed"} />
                )}
              </div> */}

							<div className="h-96 p-3 border bg-white shadow-md overflow-y-scroll">
								<div className="pr-4">
									<Markdown
										components={{
											a: ({ href, children }: any) => (
												<a
													href={href}
													className="text-blue-500 underline hover:text-blue-700"
												>
													{children}
												</a>
											),
											ul: ({ children }: any) => (
												<ul className="list-disc pl-5">{children}</ul>
											),
											li: ({ children }: any) => (
												<li className="mb-2">{children}</li>
											),
											code: ({ inline, children }: any) =>
												inline ? (
													<code className="bg-gray-100 text-red-600 rounded px-1">
														{children}
													</code>
												) : (
													<pre className="bg-white text-gray-900 rounded overflow-x-auto">
														<code>{children}</code>
													</pre>
												),
										}}
									>
										{mdData}
									</Markdown>
								</div>
							</div>
						</div>
					</SchemaGuide>
				</div>
			</div>
		</div>
	);
};

export default SchemaValidation;

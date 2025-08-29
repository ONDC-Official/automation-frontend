import { useEffect, useMemo, useRef, useState } from "react";
import { SubmitEventParams } from "../../../../types/flow-types";
import { FormFieldConfigType } from "../config-form/config-form";
import jsonpath from "jsonpath";
import { AxiosResponse } from "axios";
import { htmlFormSubmit } from "../../../../utils/request-utils";
// --- Types -------------------------------------------------------------------

type BaseField = {
	kind:
		| "textlike"
		| "textarea"
		| "select"
		| "radio-group"
		| "checkbox-single"
		| "checkbox-group"
		| "file"
		| "hidden";
	name: string;
	label?: string;
	required?: boolean;
	disabled?: boolean;
	id?: string | null;
	// constraints
	min?: string | number;
	max?: string | number;
	step?: string | number;
	pattern?: string;
};

type TextLikeField = BaseField & {
	kind: "textlike";
	inputType:
		| "text"
		| "password"
		| "email"
		| "number"
		| "date"
		| "datetime-local"
		| "month"
		| "time"
		| "url"
		| "tel"
		| "search";
	defaultValue?: string;
	placeholder?: string;
};

type TextareaField = BaseField & {
	kind: "textarea";
	defaultValue?: string;
	placeholder?: string;
	rows?: number;
};

type SelectOption = { value: string; label: string; selected?: boolean };
type SelectField = BaseField & {
	kind: "select";
	multiple?: boolean;
	options: SelectOption[];
};

type RadioGroupField = BaseField & {
	kind: "radio-group";
	options: { value: string; label?: string; checked?: boolean }[];
};

type CheckboxSingleField = BaseField & {
	kind: "checkbox-single";
	valueAttr?: string; // default "on" if not present in HTML
	checked?: boolean;
};

type CheckboxGroupField = BaseField & {
	kind: "checkbox-group";
	options: { value: string; label?: string; checked?: boolean }[];
};

type FileField = BaseField & {
	kind: "file";
	multiple?: boolean;
	accept?: string | null;
};

type HiddenField = BaseField & {
	kind: "hidden";
	value: string;
};

type AnyField =
	| TextLikeField
	| TextareaField
	| SelectField
	| RadioGroupField
	| CheckboxSingleField
	| CheckboxGroupField
	| FileField
	| HiddenField;

type ParsedForm = {
	method: string;
	action: string;
	enctype?: string | null;
	fields: AnyField[];
};

// Value state type for the rebuilt React form
type ValueState = Record<
	string,
	string | string[] | boolean | File | File[] | null | undefined
>;

// --- Helper: label resolution -------------------------------------------------

function getLabelForInput(
	input: Element,
	formEl: HTMLFormElement
): string | undefined {
	const id = (input as HTMLInputElement).id;
	if (id) {
		const byFor = formEl.querySelector(`label[for="${CSS.escape(id)}"]`);
		if (byFor && byFor.textContent) return byFor.textContent.trim();
	}
	// If input is wrapped by a <label> ancestor
	let parent: Element | null = input.parentElement;
	while (parent) {
		if (parent.tagName.toLowerCase() === "label" && parent.textContent) {
			return parent.textContent.trim();
		}
		parent = parent.parentElement;
	}
	return undefined;
}

// --- Parser: from HTML to field metadata -------------------------------------

function parseFormHtml(formHtml: string): ParsedForm {
	const doc = new DOMParser().parseFromString(formHtml, "text/html");
	const formEl = doc.querySelector("form") as HTMLFormElement | null;
	if (!formEl) {
		return {
			method: "GET",
			action: "",
			fields: [],
		};
	}

	const method = (formEl.getAttribute("method") || "GET").toUpperCase();
	const action = formEl.getAttribute("action") || "";
	const enctype = formEl.getAttribute("enctype");

	// Collect candidates
	const inputs = Array.from(formEl.querySelectorAll("input"));
	const textareas = Array.from(formEl.querySelectorAll("textarea"));
	const selects = Array.from(formEl.querySelectorAll("select"));

	// Group radios/checkboxes by name
	const radioMap = new Map<string, HTMLInputElement[]>();
	const checkboxMap = new Map<string, HTMLInputElement[]>();

	const fields: AnyField[] = [];

	// First pass: handle inputs except radio/checkbox (they’re grouped later)
	for (const input of inputs) {
		const type = (input.getAttribute("type") || "text").toLowerCase();
		const name = input.getAttribute("name") || "";
		if (!name) continue;

		const common: Partial<BaseField> = {
			name,
			label: getLabelForInput(input, formEl),
			required: input.hasAttribute("required"),
			disabled: input.hasAttribute("disabled"),
			id: input.id || null,
		};

		if (type === "radio") {
			const arr = radioMap.get(name) || [];
			arr.push(input);
			radioMap.set(name, arr);
			continue;
		}

		if (type === "checkbox") {
			const arr = checkboxMap.get(name) || [];
			arr.push(input);
			checkboxMap.set(name, arr);
			continue;
		}

		if (type === "hidden") {
			fields.push({
				kind: "hidden",
				...common,
				value: input.getAttribute("value") ?? "",
			} as HiddenField);
			continue;
		}

		if (type === "file") {
			fields.push({
				kind: "file",
				...common,
				multiple: input.hasAttribute("multiple"),
				accept: input.getAttribute("accept"),
			} as FileField);
			continue;
		}

		// Text-like inputs
		const supportedTypes = new Set([
			"text",
			"password",
			"email",
			"number",
			"date",
			"datetime-local",
			"month",
			"time",
			"url",
			"tel",
			"search",
		]);
		const inputType = supportedTypes.has(type)
			? (type as TextLikeField["inputType"])
			: "text";

		fields.push({
			kind: "textlike",
			...common,
			inputType,
			defaultValue: input.getAttribute("value") ?? "",
			placeholder: input.getAttribute("placeholder") ?? undefined,
			min: input.getAttribute("min") ?? undefined,
			max: input.getAttribute("max") ?? undefined,
			step: input.getAttribute("step") ?? undefined,
			pattern: input.getAttribute("pattern") ?? undefined,
		} as TextLikeField);
	}

	// Textareas
	for (const ta of textareas) {
		const name = ta.getAttribute("name") || "";
		if (!name) continue;
		fields.push({
			kind: "textarea",
			name,
			label: getLabelForInput(ta, formEl),
			required: ta.hasAttribute("required"),
			disabled: ta.hasAttribute("disabled"),
			id: ta.id || null,
			defaultValue: ta.value ?? ta.textContent ?? "",
			placeholder: ta.getAttribute("placeholder") ?? undefined,
			rows: ta.hasAttribute("rows")
				? Number(ta.getAttribute("rows"))
				: undefined,
		} as TextareaField);
	}

	// Selects
	for (const sel of selects) {
		const name = sel.getAttribute("name") || "";
		if (!name) continue;
		const options = Array.from(sel.querySelectorAll("option")).map((opt) => ({
			value: opt.getAttribute("value") ?? opt.textContent ?? "",
			label: opt.textContent ?? "",
			selected: opt.hasAttribute("selected"),
		}));
		fields.push({
			kind: "select",
			name,
			label: getLabelForInput(sel, formEl),
			required: sel.hasAttribute("required"),
			disabled: sel.hasAttribute("disabled"),
			id: sel.id || null,
			multiple: sel.hasAttribute("multiple"),
			options,
		} as SelectField);
	}

	// Radios as groups
	for (const [name, radios] of radioMap.entries()) {
		const label = radios.map((r) => getLabelForInput(r, formEl)).find(Boolean);
		fields.push({
			kind: "radio-group",
			name,
			label,
			required: radios.some((r) => r.hasAttribute("required")),
			id: null,
			options: radios.map((r) => ({
				value: r.getAttribute("value") ?? "",
				label: getLabelForInput(r, formEl),
				checked: r.hasAttribute("checked"),
			})),
		} as RadioGroupField);
	}

	// Checkboxes: single vs group
	for (const [name, boxes] of checkboxMap.entries()) {
		if (boxes.length === 1) {
			const box = boxes[0];
			fields.push({
				kind: "checkbox-single",
				name,
				label: getLabelForInput(box, formEl),
				required: box.hasAttribute("required"),
				id: box.id || null,
				valueAttr: box.getAttribute("value") ?? "on",
				checked: box.hasAttribute("checked"),
			} as CheckboxSingleField);
		} else {
			fields.push({
				kind: "checkbox-group",
				name,
				label: boxes.map((b) => getLabelForInput(b, formEl)).find(Boolean),
				required: boxes.some((b) => b.hasAttribute("required")),
				id: null,
				options: boxes.map((b) => ({
					value: b.getAttribute("value") ?? "on",
					label: getLabelForInput(b, formEl),
					checked: b.hasAttribute("checked"),
				})),
			} as CheckboxGroupField);
		}
	}

	return { method, action, enctype, fields };
}

// --- Component ---------------------------------------------------------------

type Props = {
	submitEvent: (data: SubmitEventParams) => Promise<void>;
	referenceData?: Record<string, any>;
	HtmlFormConfigInFlow: FormFieldConfigType;
};

export default function ProtocolHTMLForm({
	submitEvent,
	referenceData,
	HtmlFormConfigInFlow,
}: Props) {
	const containerRef = useRef<HTMLDivElement | null>(null);

	// Replace with server value
	const formHtml = useMemo<string>(() => {
		return (
			jsonpath.query(
				{ reference_data: referenceData },
				HtmlFormConfigInFlow.reference || ""
			)[0] || ""
		);
	}, []);

	// Parse once per formHtml
	const parsed = useMemo<ParsedForm>(() => parseFormHtml(formHtml), [formHtml]);

	// Build initial state from defaults/selected
	const [values, setValues] = useState<ValueState>(() => {
		const v: ValueState = {};
		for (const f of parsed.fields) {
			switch (f.kind) {
				case "hidden":
					v[f.name] = f.value;
					break;
				case "textlike":
					v[f.name] = f.defaultValue ?? "";
					break;
				case "textarea":
					v[f.name] = f.defaultValue ?? "";
					break;
				case "select": {
					const sel = f as SelectField;
					const selected = sel.options
						.filter((o) => o.selected)
						.map((o) => o.value);
					v[f.name] = sel.multiple ? selected : selected[0] ?? "";
					break;
				}
				case "radio-group": {
					const rg = f as RadioGroupField;
					const selected = rg.options.find((o) => o.checked)?.value ?? "";
					v[f.name] = selected;
					break;
				}
				case "checkbox-single": {
					const cs = f as CheckboxSingleField;
					v[f.name] = !!cs.checked;
					break;
				}
				case "checkbox-group": {
					const cg = f as CheckboxGroupField;
					const selected = cg.options
						.filter((o) => o.checked)
						.map((o) => o.value);
					v[f.name] = selected;
					break;
				}
				case "file": {
					v[f.name] = null; // File or File[]
					break;
				}
			}
		}
		return v;
	});

	const [submissionId, setSubmissionId] = useState<string | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Optional: show the raw mounted HTML (debug/inspection) — you can remove this block
	useEffect(() => {
		const host = containerRef.current;
		if (!host) return;
		host.innerHTML = "";
		// Just show where the original 3P form is coming from (collapsed)
		const details = document.createElement("details");
		details.className = "text-xs text-gray-500";
		const summary = document.createElement("summary");
		summary.textContent = "Original embedded form (debug)";
		details.appendChild(summary);
		const pre = document.createElement("pre");
		pre.textContent = formHtml;
		pre.style.whiteSpace = "pre-wrap";
		pre.style.wordBreak = "break-word";
		details.appendChild(pre);
		host.appendChild(details);
	}, [formHtml]);

	// Change handlers
	const setField = (name: string, val: any) =>
		setValues((prev) => ({ ...prev, [name]: val }));

	// Submit the rebuilt form
	const handleSubmit = async () => {
		try {
			console.log("submitting", values);
			setIsSubmitting(true);
			setError(null);

			// Decide encoding: default url-encoded; fallback to multipart if file fields exist
			const hasFile =
				parsed.fields.some((f) => f.kind === "file") ||
				(parsed.enctype || "").toLowerCase().includes("multipart");

			let res: AxiosResponse<any, any>;
			if (hasFile) {
				const fd = new FormData();
				for (const f of parsed.fields) {
					const val = values[f.name];
					if (f.kind === "checkbox-single") {
						if (val === true) {
							const v = (f as CheckboxSingleField).valueAttr ?? "on";
							fd.append(f.name, v);
						}
					} else if (f.kind === "checkbox-group") {
						const arr = (val as string[]) || [];
						for (const item of arr) fd.append(f.name, item);
					} else if (f.kind === "radio-group") {
						if (typeof val === "string" && val !== "") fd.append(f.name, val);
					} else if (f.kind === "select") {
						if ((f as SelectField).multiple) {
							const arr = (val as string[]) || [];
							for (const item of arr) fd.append(f.name, item);
						} else if (typeof val === "string") {
							fd.append(f.name, val);
						}
					} else if (f.kind === "file") {
						const v = values[f.name];
						if (Array.isArray(v)) {
							for (const file of v) fd.append(f.name, file as File);
						} else if (v instanceof File) {
							fd.append(f.name, v);
						}
					} else if (
						f.kind === "hidden" ||
						f.kind === "textlike" ||
						f.kind === "textarea"
					) {
						if (val != null) fd.append(f.name, String(val));
					}
				}
				console.log("submitting as formdata", fd);
				// res = await fetch(parsed.action || window.location.href, {
				// 	method: parsed.method,
				// 	body: fd,
				// });
				res = await htmlFormSubmit(parsed.action || window.location.href, fd);
			} else {
				const params = new URLSearchParams();
				for (const f of parsed.fields) {
					const val = values[f.name];
					if (f.kind === "checkbox-single") {
						if (val === true) {
							const v = (f as CheckboxSingleField).valueAttr ?? "on";
							params.append(f.name, v);
						}
					} else if (f.kind === "checkbox-group") {
						const arr = (val as string[]) || [];
						for (const item of arr) params.append(f.name, item);
					} else if (f.kind === "radio-group") {
						if (typeof val === "string" && val !== "")
							params.append(f.name, val);
					} else if (f.kind === "select") {
						if ((f as SelectField).multiple) {
							const arr = (val as string[]) || [];
							for (const item of arr) params.append(f.name, item);
						} else if (typeof val === "string") {
							params.append(f.name, val);
						}
					} else if (f.kind === "file") {
						// no files -> skip in urlencoded mode
					} else if (
						f.kind === "hidden" ||
						f.kind === "textlike" ||
						f.kind === "textarea"
					) {
						if (val != null) params.append(f.name, String(val));
					}
				}
				console.log(
					"calling with urlencoded with data",
					params.toString(),
					parsed.action
				);
				res = await htmlFormSubmit(
					parsed.action || window.location.href,
					params.toString()
				);
			}
			console.log("response is ", res);
			// Parse response
			const ct =
				typeof res.headers === "object"
					? res.headers["content-type"] || res.headers["Content-Type"] || ""
					: "";
			let data: any;
			if (ct.includes("application/json")) {
				data = res.data;
			} else {
				const text = typeof res.data === "string" ? res.data : String(res.data);
				const match = text.match(/"submission_id"\s*:\s*"([^"]+)"/i);
				data = match ? { submission_id: match[1] } : { raw: text };
			}
			console.log("parsed response data", data);
			const finalSubmissionId =
				data?.submission_id ??
				data?.data?.submission_id ??
				data?.result?.submission_id ??
				"";

			console.log("extracted submission id", finalSubmissionId);
			if (!finalSubmissionId) {
				throw new Error("No submission_id returned by the form endpoint.");
			}

			setSubmissionId(finalSubmissionId);

			// Build a simple key/value payload for your pipeline
			const plainPayload: Record<string, string> = {};
			for (const f of parsed.fields) {
				const val = values[f.name];
				if (
					f.kind === "checkbox-group" ||
					(f.kind === "select" && f.multiple)
				) {
					(val as string[] | undefined)?.forEach((v, i) => {
						plainPayload[`${f.name}[${i}]`] = v;
					});
				} else if (f.kind === "file") {
					// send filenames only to your submitEvent; upstream already got binary
					if (Array.isArray(val)) {
						val.forEach(
							(file, i) =>
								(plainPayload[`${f.name}[${i}]`] = (file as File)?.name ?? "")
						);
					} else if (val instanceof File) {
						plainPayload[f.name] = val.name;
					}
				} else if (typeof val === "boolean") {
					if (val) {
						// emulate HTML checkbox submit value
						const v = (f as CheckboxSingleField).valueAttr ?? "on";
						plainPayload[f.name] = v;
					}
				} else if (val != null) {
					plainPayload[f.name] = String(val);
				}
			}
			const Subdata = {
				jsonpath: { submission_id: finalSubmissionId },
				formData: { submission_id: finalSubmissionId },
			};
			console.log("final data to be sent", Subdata);
			await submitEvent({
				jsonPath: { submission_id: finalSubmissionId },
				formData: { submission_id: finalSubmissionId },
			});
		} catch (e: any) {
			console.error(e);
			setError(e?.message || "Submission failed");
		} finally {
			setIsSubmitting(false);
		}
	};

	// --- Render helpers --------------------------------------------------------

	const renderField = (f: AnyField) => {
		if (f.kind === "hidden") {
			// Hidden: not rendered visually; included in payload
			return null;
		}

		const labelEl = (children: JSX.Element) => (
			<label className="block text-sm font-medium text-gray-700">
				{f.label ?? f.name}
				<span className="text-red-600">{f.required ? " *" : ""}</span>
				<div className="mt-1">{children}</div>
			</label>
		);

		switch (f.kind) {
			case "textlike": {
				const v = (values[f.name] as string) ?? "";
				const tf = f as TextLikeField;
				return labelEl(
					<input
						type={tf.inputType}
						name={f.name}
						value={v}
						onChange={(e) => setField(f.name, e.target.value)}
						placeholder={tf.placeholder}
						required={f.required}
						disabled={f.disabled}
						min={tf.min as any}
						max={tf.max as any}
						step={tf.step as any}
						pattern={tf.pattern}
						className="w-full rounded-md border bg-gray-50 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				);
			}
			case "textarea": {
				const v = (values[f.name] as string) ?? "";
				const ta = f as TextareaField;
				return labelEl(
					<textarea
						name={f.name}
						value={v}
						onChange={(e) => setField(f.name, e.target.value)}
						placeholder={ta.placeholder}
						rows={ta.rows ?? 4}
						required={f.required}
						disabled={f.disabled}
						className="w-full rounded-md bg-gray-50 border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					/>
				);
			}
			case "select": {
				const sel = f as SelectField;
				const v = values[f.name];
				return labelEl(
					<select
						name={f.name}
						value={
							(sel.multiple
								? (v as string[]) ?? []
								: (v as string) ?? "") as any
						}
						onChange={(e) => {
							if (sel.multiple) {
								const opts = Array.from(e.currentTarget.selectedOptions).map(
									(o) => o.value
								);
								setField(f.name, opts);
							} else {
								setField(f.name, e.currentTarget.value);
							}
						}}
						multiple={!!sel.multiple}
						required={f.required}
						disabled={f.disabled}
						className="w-full rounded-md border bg-gray-50 border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
					>
						{!sel.multiple && <option value="">-- Select --</option>}
						{sel.options.map((o, i) => (
							<option key={i} value={o.value}>
								{o.label}
							</option>
						))}
					</select>
				);
			}
			case "radio-group": {
				const rg = f as RadioGroupField;
				const v = (values[f.name] as string) ?? "";
				return (
					<fieldset className="space-y-2">
						<legend className="block text-sm font-medium text-gray-700">
							{f.label ?? f.name}
							<span className="text-red-600">{f.required ? " *" : ""}</span>
						</legend>
						{rg.options.map((opt, i) => (
							<label
								key={i}
								className="flex items-center gap-2 text-sm text-gray-800"
							>
								<input
									type="radio"
									name={f.name}
									value={opt.value}
									checked={v === opt.value}
									onChange={() => setField(f.name, opt.value)}
									className="h-4 w-4"
								/>
								<span>{opt.label ?? opt.value}</span>
							</label>
						))}
					</fieldset>
				);
			}
			case "checkbox-single": {
				// const cs = f as CheckboxSingleField;
				const checked = Boolean(values[f.name]);
				return (
					<label className="flex items-center gap-2 text-sm font-medium text-gray-700">
						<input
							type="checkbox"
							name={f.name}
							checked={checked}
							onChange={(e) => setField(f.name, e.target.checked)}
							className="h-4 w-4"
						/>
						<span>
							{f.label ?? f.name}
							<span className="text-red-600">{f.required ? " *" : ""}</span>
						</span>
					</label>
				);
			}
			case "checkbox-group": {
				const cg = f as CheckboxGroupField;
				const arr = (values[f.name] as string[]) ?? [];
				const toggle = (val: string, on: boolean) => {
					if (on) setField(f.name, Array.from(new Set([...arr, val])));
					else
						setField(
							f.name,
							arr.filter((x) => x !== val)
						);
				};
				return (
					<fieldset className="space-y-2">
						<legend className="block text-sm font-medium text-gray-700">
							{f.label ?? f.name}
							<span className="text-red-600">{f.required ? " *" : ""}</span>
						</legend>
						{cg.options.map((opt, i) => {
							const on = arr.includes(opt.value);
							return (
								<label
									key={i}
									className="flex items-center gap-2 text-sm text-gray-800"
								>
									<input
										type="checkbox"
										name={f.name}
										checked={on}
										onChange={(e) => toggle(opt.value, e.target.checked)}
										className="h-4 w-4"
									/>
									<span>{opt.label ?? opt.value}</span>
								</label>
							);
						})}
					</fieldset>
				);
			}
			case "file": {
				const fileField = f as FileField;
				return labelEl(
					<input
						type="file"
						name={f.name}
						multiple={!!fileField.multiple}
						accept={fileField.accept ?? undefined}
						onChange={(e) => {
							const files = e.currentTarget.files;
							if (!files) return;
							if (fileField.multiple) setField(f.name, Array.from(files));
							else setField(f.name, files[0] ?? null);
						}}
						className="block w-full text-sm text-gray-900 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-gray-200"
					/>
				);
			}
		}
	};

	return (
		<div className="space-y-6">
			{/* Debug: where the original form HTML came from */}
			<div ref={containerRef} className="overflow-auto" />
			{/* Recreated React form */}
			<div className="rounded-lg border border-gray-200 p-4">
				<div className="grid grid-cols-1 gap-4">
					{parsed.fields.map((f, idx) => (
						<div key={`${f.name}-${idx}`}>{renderField(f)}</div>
					))}
				</div>
				<div className="mt-6 flex items-center gap-3">
					<button
						type="button"
						onClick={handleSubmit}
						disabled={isSubmitting}
						className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
					>
						{isSubmitting ? "Submitting..." : "Submit"}
					</button>

					{parsed.action && (
						<span className="text-xs text-gray-500">
							POST to <code>{parsed.action}</code>
						</span>
					)}
				</div>

				<div className="mt-3 text-sm text-gray-700">
					{submissionId && (
						<span className="text-green-700">
							Received submission_id: <code>{submissionId}</code>
						</span>
					)}
					{error && <span className="ml-2 text-red-600">Error: {error}</span>}
				</div>
			</div>
		</div>
	);
}

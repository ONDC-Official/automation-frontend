import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import { Controller } from "react-hook-form";
import { SubmitEventParams } from "../../../../types/flow-types";
const onSearch = {
	context: {
		action: "on_search",
		bap_id: "dev-automation.ondc.org",
		bap_uri: "http://localhost:7123/api-service/ONDC:RET10/1.2.5/buyer",
		domain: "ONDC:RET10",
		city: "std:080",
		country: "IND",
		message_id: "2e9f5975-6d65-4045-ac5d-40df078658a2",
		timestamp: "2025-05-01T11:59:03.126Z",
		transaction_id: "1e2f14c7-71c3-4445-b039-0f716fa0f008",
		core_version: "1.2.5",
		ttl: "PT30S",
		bpp_id: "dev-automation.ondc.org",
		bpp_uri: "http://localhost:7123/api-service/ONDC:RET10/1.2.5/seller",
	},
	message: {
		catalog: {
			"bpp/fulfillments": [
				{
					id: "F1",
					type: "Delivery",
				},
			],
			"bpp/descriptor": {
				name: "Mock Seller NP",
				symbol: "https://sellerNP.com/images/np.png",
				short_desc: "Seller Marketplace",
				long_desc: "Seller Marketplace",
				images: ["https://sellerNP.com/images/np.png"],
				tags: [
					{
						code: "bpp_terms",
						list: [
							{
								code: "np_type",
								value: "MSN",
							},
						],
					},
				],
			},
			"bpp/providers": [
				{
					time: {
						label: "enable",
						timestamp: "2024-12-23T06:55:45.035Z",
					},
					descriptor: {
						name: "Store 1",
						symbol: "https://sellerNP.com/images/store1.png",
						short_desc: "Store 1",
						long_desc: "Store 1",
						images: ["https://sellerNP.com/images/store1.png"],
					},
					ttl: "P1D",
					locations: [
						{
							id: "L1",
							time: {
								label: "enable",
								timestamp: "2024-12-23T06:55:45.035Z",
								days: "1,2,3,4,5,6,7",
								schedule: {
									holidays: [],
								},
								range: {
									start: "0000",
									end: "2359",
								},
							},
							gps: "19.129076,72.825803",
							address: {
								street: "1 & 2,AMAR JYOTI CHS.BLDG.,OPP.NAND KRIPA HALL",
								locality: "ANDHERI FOUR BUNGLOW AMAR JYOTI CHS",
								city: "Mumbai",
								state: "Maharashtra",
								area_code: "400053",
							},
							circle: {
								gps: "19.129076,72.825803",
								radius: {
									unit: "km",
									value: "3",
								},
							},
						},
					],
					fulfillments: [
						{
							id: "F1",
							type: "Delivery",
							contact: {
								phone: "9594663710",
								email: "nobody@nomail.com",
							},
						},
					],
					items: [
						{
							descriptor: {
								name: "Plain Atta",
								code: "1:XXXXXXXXXXXXX",
								symbol: "https://sellerNP.com/images/i1.png",
								short_desc: "Plain Atta",
								long_desc: "Plain Atta",
								images: ["https://sellerNP.com/images/i1.png"],
							},
							price: {
								currency: "INR",
								value: "100.00",
								maximum_value: "100.00",
							},
							quantity: {
								unitized: {
									measure: {
										unit: "kilogram",
										value: "3",
									},
								},
								available: {
									count: "99",
								},
								maximum: {
									count: "99",
								},
							},
							category_id: "Atta, Flours and Sooji",
							fulfillment_id: "F1",
							location_id: "L1",
							"@ondc/org/returnable": true,
							"@ondc/org/cancellable": true,
							"@ondc/org/return_window": "P7D",
							"@ondc/org/seller_pickup_return": false,
							"@ondc/org/time_to_ship": "PT5M",
							"@ondc/org/available_on_cod": false,
							"@ondc/org/contact_details_consumer_care":
								"Ramesh,ramesh@abc.com,18004254444",
							"@ondc/org/statutory_reqs_packaged_commodities": {
								manufacturer_or_packer_name: "ITC",
								manufacturer_or_packer_address:
									"ITC Quality Care Cell,P.O Box No.592,Bangalore-560005",
								common_or_generic_name_of_commodity: "Ashirwad Atta",
								month_year_of_manufacture_packing_import: "01/2023",
							},
							time: {
								label: "enable",
								timestamp: "2024-12-23T06:55:45.035Z",
							},
							tags: [
								{
									code: "origin",
									list: [
										{
											code: "country",
											value: "THA",
										},
									],
								},
							],
							id: "I1",
							parent_item_id: "V1",
						},
						{
							descriptor: {
								name: "Plain Atta",
								code: "1:XXXXXXXXXXXXX",
								symbol: "https://sellerNP.com/images/i1.png",
								short_desc: "Plain Atta",
								long_desc: "Plain Atta",
								images: ["https://sellerNP.com/images/i1.png"],
							},
							price: {
								currency: "INR",
								value: "200.00",
								maximum_value: "200.00",
							},
							quantity: {
								unitized: {
									measure: {
										unit: "kilogram",
										value: "5",
									},
								},
								available: {
									count: "99",
								},
								maximum: {
									count: "99",
								},
							},
							category_id: "Atta, Flours and Sooji",
							fulfillment_id: "F1",
							location_id: "L1",
							"@ondc/org/returnable": true,
							"@ondc/org/cancellable": true,
							"@ondc/org/return_window": "P7D",
							"@ondc/org/seller_pickup_return": false,
							"@ondc/org/time_to_ship": "PT5M",
							"@ondc/org/available_on_cod": false,
							"@ondc/org/contact_details_consumer_care":
								"Ramesh,ramesh@abc.com,18004254444",
							"@ondc/org/statutory_reqs_packaged_commodities": {
								manufacturer_or_packer_name: "ITC",
								manufacturer_or_packer_address:
									"ITC Quality Care Cell,P.O Box No.592,Bangalore-560005",
								common_or_generic_name_of_commodity: "Ashirwad Atta",
								month_year_of_manufacture_packing_import: "01/2023",
							},
							time: {
								label: "enable",
								timestamp: "2024-12-23T06:55:45.035Z",
							},
							tags: [
								{
									code: "origin",
									list: [
										{
											code: "country",
											value: "THA",
										},
									],
								},
							],
							id: "I2",
							parent_item_id: "V1",
						},
						{
							descriptor: {
								name: "Alphanso Mango",
								code: "1:XXXXXXXXXXXXX",
								symbol: "https://sellerNP.com/images/i1.png",
								short_desc: "Alphanso",
								long_desc: "Alphanso Mango freshly hand picked",
								images: ["https://sellerNP.com/images/i1.png"],
							},
							price: {
								currency: "INR",
								value: "50.00",
								maximum_value: "50.00",
							},
							quantity: {
								unitized: {
									measure: {
										unit: "kilogram",
										value: "1",
									},
								},
								available: {
									count: "99",
								},
								maximum: {
									count: "99",
								},
							},
							category_id: "Fruits and Vegetables",
							fulfillment_id: "F1",
							location_id: "L1",
							"@ondc/org/returnable": false,
							"@ondc/org/cancellable": false,
							"@ondc/org/return_window": "P1D",
							"@ondc/org/seller_pickup_return": false,
							"@ondc/org/time_to_ship": "PT5M",
							"@ondc/org/available_on_cod": false,
							"@ondc/org/contact_details_consumer_care":
								"Ramesh,ramesh@abc.com,18004254444",
							time: {
								label: "enable",
								timestamp: "2024-12-23T06:55:45.035Z",
							},
							tags: [
								{
									code: "origin",
									list: [
										{
											code: "country",
											value: "THA",
										},
									],
								},
							],
							id: "I3",
						},
					],
					tags: [
						{
							code: "timing",
							list: [
								{
									code: "type",
									value: "All",
								},
								{
									code: "location",
									value: "L1",
								},
								{
									code: "day_from",
									value: "1",
								},
								{
									code: "day_to",
									value: "7",
								},
								{
									code: "time_from",
									value: "0000",
								},
								{
									code: "time_to",
									value: "2359",
								},
							],
						},
						{
							code: "serviceability",
							list: [
								{
									code: "location",
									value: "L1",
								},
								{
									code: "category",
									value: "Atta, Flours and Sooji",
								},
								{
									code: "type",
									value: "10",
								},
								{
									code: "val",
									value: "3",
								},
								{
									code: "unit",
									value: "km",
								},
							],
						},
						{
							code: "serviceability",
							list: [
								{
									code: "location",
									value: "L1",
								},
								{
									code: "category",
									value: "Fruits and Vegetables",
								},
								{
									code: "type",
									value: "10",
								},
								{
									code: "val",
									value: "3",
								},
								{
									code: "unit",
									value: "km",
								},
							],
						},
					],
					categories: [
						{
							id: "V1",
							tags: [
								{
									code: "type",
									list: [
										{
											code: "type",
											value: "variant_group",
										},
									],
								},
								{
									code: "attr",
									list: [
										{
											code: "name",
											value: "item.quantity.unitized.measure",
										},
										{
											code: "seq",
											value: "1",
										},
									],
								},
							],
							descriptor: {
								name: "Plain Atta",
							},
						},
					],
					id: "P1",
				},
			],
		},
	},
};

export default function Ret10GrocerySelect({
	submitEvent,
}: {
	submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
	const providers = onSearch.message.catalog["bpp/providers"];
	const providerOptions = providers.map((p: any) => p.id);

	const { control, handleSubmit, watch, register, setValue } = useForm({
		defaultValues: {
			provider: providerOptions[0],
			provider_location: [] as string[],
			location_gps: "",
			location_pin_code: "",
			items: [{ itemId: "", quantity: 0, location: "" }],
		},
	});

	const { fields, append, remove } = useFieldArray({
		control,
		name: "items",
	});

	const selectedProvider = watch("provider");

	const [itemOptions, setItemOptions] = useState<string[]>([]);
	const [locationOptions, setLocationOptions] = useState<string[]>([]);
	useEffect(() => {
		const providerData = providers.find((p: any) => p.id === selectedProvider);
		if (providerData) {
			const items = providerData.items.map((item: any) => item.id);
			setItemOptions(items);
			setLocationOptions(providerData.locations.map((loc: any) => loc.id));
			// if (providerData.locations?.length) {
			// 	setValue("provider_location", providerData.locations[0].id);
			// }
		}
	}, [selectedProvider, providers, setValue]);

	const onSubmit = async (data: any) => {
		console.log("Form Data", data);
		await submitEvent({ jsonPath: {}, formData: data });
	};
	const inputStyle =
		"border rounded p-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white";
	const labelStyle = "mb-1 font-semibold";
	const fieldWrapperStyle = "flex flex-col mb-2";
	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="space-y-4 h-[500px] overflow-y-scroll p-4"
		>
			<div className={fieldWrapperStyle}>
				<label className={labelStyle}>Select Provider</label>
				<select {...register("provider")} className={inputStyle}>
					{providerOptions.map((id) => (
						<option key={id} value={id}>
							{id}
						</option>
					))}
				</select>
			</div>

			<Controller
				name="provider_location"
				control={control}
				defaultValue={[] as any}
				render={({ field }) => {
					const provider = providers.find(
						(p: any) => p.id === selectedProvider
					);
					const locations = provider?.locations || [];

					const handleCheckboxChange = (value: string) => {
						const current = (field.value as any[]) || ([] as any[]);
						if (!Array.isArray(current)) {
							field.onChange([value]);
							return;
						}
						if (current.includes(value)) {
							field.onChange(current.filter((v: string) => v !== value));
						} else {
							field.onChange([...current, value]);
						}
					};

					return (
						<div className={fieldWrapperStyle}>
							<label className={labelStyle}>Select Provider Location(s)</label>
							<div className="flex flex-col gap-2">
								{locations.map((loc: any) => (
									<label
										key={loc.id}
										className="inline-flex items-center gap-2"
									>
										<input
											type="checkbox"
											value={loc.id}
											checked={field.value?.includes(loc.id)}
											onChange={() => handleCheckboxChange(loc.id)}
											className="accent-blue-600"
										/>
										<span>{loc.id}</span>
									</label>
								))}
							</div>
						</div>
					);
				}}
			/>

			<div className={fieldWrapperStyle}>
				<label className={labelStyle}>Enter Delivery Location GPS</label>
				<input
					{...register("location_gps")}
					type="text"
					className={inputStyle}
				/>
			</div>

			<div className={fieldWrapperStyle}>
				<label className={labelStyle}>Enter Delivery Pin Code</label>
				<input
					{...register("location_pin_code")}
					type="text"
					className={inputStyle}
				/>
			</div>

			{fields.map((field, index) => (
				<div key={field.id} className="border p-3 rounded space-y-2">
					<div className={fieldWrapperStyle}>
						<label className={labelStyle}>Select Item {index + 1}</label>
						<select
							{...register(`items.${index}.itemId`)}
							className={inputStyle}
						>
							{itemOptions.map((itemId) => (
								<option key={itemId} value={itemId}>
									{itemId}
								</option>
							))}
						</select>
					</div>
					<div className={fieldWrapperStyle}>
						<label className={labelStyle}>Enter Quantity</label>
						<input
							type="number"
							{...register(`items.${index}.quantity`, { valueAsNumber: true })}
							className={inputStyle}
						/>
					</div>
					<div className={fieldWrapperStyle}>
						<label className={labelStyle}>Enter Location</label>
						<select
							{...register(`items.${index}.location`)}
							className={inputStyle}
						>
							{locationOptions.map((itemId) => (
								<option key={itemId} value={itemId}>
									{itemId}
								</option>
							))}
						</select>
					</div>
				</div>
			))}
			<div className="flex gap-2">
				<button
					type="button"
					className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
					onClick={() => append({ itemId: "", quantity: 1, location: "" })}
				>
					Add Item
				</button>
				{fields.length > 1 && (
					<button
						type="button"
						className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
						onClick={() => remove(fields.length - 1)}
					>
						Remove Item
					</button>
				)}
			</div>

			<button
				type="submit"
				className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700"
			>
				Submit
			</button>
		</form>
	);
}

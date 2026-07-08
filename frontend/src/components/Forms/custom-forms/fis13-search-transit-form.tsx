import { Fis13InsuranceSearchForm } from "./fis13-insurance-search-form";
import { SubmitEventParams } from "@/types/flow-types";

const MANUAL_BAP_INPUTS = [
    { code: "BUYER_NAME", label: "Buyer Name", type: "text" },
    { code: "BUYER_PHONE_NUMBER", label: "Buyer Phone Number", type: "tel" },
    { code: "BUYER_PAN_NUMBER", label: "Buyer Pan Number", type: "text" },
    { code: "DERIVED_DATA", label: "Derived Data", type: "text" },
    { code: "PRODUCT_CATEGORY", label: "Product Category", type: "text" },
    { code: "ORDER_ID", label: "Order Id", type: "text" },
    { code: "ORDER_VALUE", label: "Order Value", type: "text" },
    { code: "ORDER_TYPE", label: "Order Type", type: "text" },
    { code: "ORDER_WEIGHT", label: "Order Weight", type: "text" },
    { code: "START_ADDRESS", label: "Start Address", type: "text" },
    { code: "END_ADDRESS", label: "End Address", type: "text" },
    { code: "PAYMENT_MODE", label: "Payment Mode", type: "text" },
    { code: "TRANSIT_START_DATE", label: "Transit Start Date", type: "date" },
    { code: "TRANSIT_END_DATE", label: "Transit End Date", type: "date" },
    { code: "PACKAGING_TYPE", label: "Packaging Type", type: "text" },
    { code: "PACKAGING_VIDEO", label: "Packaging Video", type: "text" },
    { code: "SEALING_TYPE", label: "Sealing Type", type: "text" },
    { code: "WATERPROOFING", label: "Waterproofing", type: "text" },
    { code: "MODE_OF_TRANSPORT", label: "Mode Of Transport", type: "text" },
    { code: "LOGISTICS_COST", label: "Logistics Cost", type: "text" },
    { code: "ORDERS_ONTIME_PCT", label: "Orders Ontime Pct", type: "text" },
    { code: "LOGISTICS_PARTNER_GSTIN", label: "Logistics Partner Gstin", type: "text" },
    { code: "DELIVERY_EXECUTIVE_NAME", label: "Delivery Executive Name", type: "text" },
    { code: "DELIVERY_EXECUTIVE_PHONE_NO", label: "Delivery Executive Phone No", type: "tel" },
    { code: "DELIVERY_EXECUTIVE_UNIQUE_ID", label: "Delivery Executive Unique Id", type: "text" },
    {
        code: "DELIVERY_EXECUTIVE_VEHICLE_NO",
        label: "Delivery Executive Vehicle No",
        type: "text",
    },
];

export default function Fis13SearchTransitForm({
    submitEvent,
}: {
    submitEvent: (data: SubmitEventParams) => Promise<void>;
}) {
    return (
        <Fis13InsuranceSearchForm submitEvent={submitEvent} manualBapInputs={MANUAL_BAP_INPUTS} />
    );
}

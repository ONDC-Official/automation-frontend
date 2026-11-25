/** Help text for the New session form's fields, shown from the "i" next to each label. */
export const FIELD_TOOLTIPS = {
    subscriberUrl:
        "Where your app's ONDC APIs are hosted: your registered subscriber URL. It must start with http:// or https://.",
    domain: "The ONDC domain you want to test, for example Grocery (RET10).",
    version: "The version of that domain's APIs your app supports.",
    usecase: "The use case to test within that domain and version. Each one has its own flows.",
    role: "Your app's side. Buyer App (BAP): Workbench acts as the seller. Seller App (BPP): Workbench acts as the buyer.",
} as const;

export function GetRequestEndpoint(domain: string, version: string, npType: string) {
    if (npType === "BAP") {
        return `${import.meta.env.VITE_BASE_URL}/${domain}/${version}/seller`;
    }
    if (npType === "BPP") {
        return `${import.meta.env.VITE_BASE_URL}/${domain}/${version}/buyer`;
    }
    return "<BUYER or SELLER>";
}

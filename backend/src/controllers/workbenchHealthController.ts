import { Request, Response } from "express";
import axios from "../utils/axios";

interface VersionResult {
    version: string;
    usecases: string[];
    status: number | null;
    healthy: boolean;
    error?: string;
}

interface DomainResult {
    domain: string;
    versions: VersionResult[];
}

// Moved to top so it is readable before the function body executes
const samplePayloadBody = {
    context: {
        domain: "",
        version: "",
        action: "search",
        bap_id: "sample-bap-id",
        bap_uri: "https://sample-bap-uri.com",
        message_id: "sample-message-id",
        transaction_id: "sample-transaction-id",
        timestamp: new Date().toISOString(),
    },
    message: {
        intent: {},
    },
};

export const checkAllApiServiceHealth = async (req: Request, res: Response) => {
    try {
        const allDomainsResponse = await axios.get(
            `${process.env.CONFIG_SERVICE as string}/ui/senario`,
        );
        const data: Array<{
            key: string;
            version: Array<{ key: string; usecase: string[] }>;
        }> = allDomainsResponse.data?.domain || [];

        if (data.length === 0) {
            res.status(500).send({
                status: "error",
                message:
                    "No domain/version information found from config service",
            });
            return;
        }

        const apiServiceBase = (process.env.API_SERVICE as string).replace(
            /\/$/,
            "",
        );

        // Build all requests across domains and versions
        const allRequests = data.flatMap((domainEntry) =>
            domainEntry.version.map((versionEntry) => ({
                domain: domainEntry.key,
                version: versionEntry.key,
                usecases: versionEntry.usecase,
            })),
        );

        const results = await Promise.all(
            allRequests.map(async ({ domain, version, usecases }) => {
                // URL-encode domain so colons in e.g. "ONDC:FIS10" are safe in a path segment
                const encodedDomain = encodeURIComponent(domain);
                const encodedVersion = encodeURIComponent(version);
                const url = `${apiServiceBase}/${encodedDomain}/${encodedVersion}/test/search`;

                const payload = {
                    ...samplePayloadBody,
                    context: {
                        ...samplePayloadBody.context,
                        domain,
                        version,
                    },
                };

                if (domain === "ONDC:NTS10") {
                    payload.context.action = "recon";
                }

                try {
                    const response = await axios.post(url, payload, {
                        headers: { "Content-Type": "application/json" },
                    });
                    return {
                        domain,
                        version,
                        usecases,
                        status: response.status,
                        healthy: response.status === 200,
                    };
                } catch (err: any) {
                    const status = err?.response?.status ?? null;
                    return {
                        domain,
                        version,
                        usecases,
                        status,
                        healthy: false,
                        error: err?.response?.data
                            ? JSON.stringify(err.response.data)
                            : (err?.message ?? "Unknown error"),
                    };
                }
            }),
        );

        // Group results by domain
        const grouped = results.reduce<Record<string, DomainResult>>(
            (acc, item) => {
                if (!acc[item.domain]) {
                    acc[item.domain] = { domain: item.domain, versions: [] };
                }
                const versionResult: VersionResult = {
                    version: item.version,
                    usecases: item.usecases,
                    status: item.status,
                    healthy: item.healthy,
                };
                if (item.error) versionResult.error = item.error;
                acc[item.domain].versions.push(versionResult);
                return acc;
            },
            {},
        );

        const summary = Object.values(grouped);
        const totalChecked = results.length;
        const totalHealthy = results.filter((r) => r.healthy).length;

        res.send({
            status: "ok",
            message: "API service health check completed",
            summary: {
                totalChecked,
                totalHealthy,
                totalUnhealthy: totalChecked - totalHealthy,
            },
            results: summary,
        });
    } catch (err: any) {
        console.error("API Service Health Check - Error: ", err?.message);
        res.status(500).send({
            status: "error",
            message: "API service health check failed",
            error: err?.message ?? "Unknown error",
        });
    }
};

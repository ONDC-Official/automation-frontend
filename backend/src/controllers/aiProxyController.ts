import { Request, Response } from "express";

// Private/reserved IP ranges — blocked for SSRF protection.
const BLOCKED_HOSTNAMES = [
    /^localhost$/i,
    /^127\.\d+\.\d+\.\d+$/,
    /^10\.\d+\.\d+\.\d+$/,
    /^172\.(1[6-9]|2\d|3[01])\.\d+\.\d+$/,
    /^192\.168\.\d+\.\d+$/,
    /^169\.254\.\d+\.\d+$/,
    /^::1$/,
    /\.local$/i,
    /\.internal$/i,
];

function isPrivateHost(hostname: string): boolean {
    return BLOCKED_HOSTNAMES.some((re) => re.test(hostname));
}

export async function aiProxy(req: Request, res: Response): Promise<void> {
    const targetUrl = req.headers["x-proxy-target"];

    if (!targetUrl || typeof targetUrl !== "string") {
        res.status(400).json({ error: "Missing x-proxy-target header" });
        return;
    }

    let parsed: URL;
    try {
        parsed = new URL(targetUrl);
    } catch {
        res.status(400).json({ error: "Invalid proxy target URL" });
        return;
    }

    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        res.status(400).json({ error: "Proxy target must use http or https" });
        return;
    }

    if (isPrivateHost(parsed.hostname)) {
        res.status(400).json({
            error: "Proxy target resolves to a private/reserved address",
        });
        return;
    }

    const authorization = req.headers["authorization"];
    const forwardHeaders: Record<string, string> = {
        "Content-Type": "application/json",
    };
    if (authorization) {
        forwardHeaders["Authorization"] = authorization;
    }

    const method = req.method ?? "POST";
    const hasBody = method !== "GET" && method !== "HEAD";

    let upstream: globalThis.Response;
    try {
        upstream = await fetch(targetUrl, {
            method,
            headers: forwardHeaders,
            ...(hasBody ? { body: JSON.stringify(req.body) } : {}),
        });
    } catch (err) {
        const message =
            err instanceof Error ? err.message : "Upstream request failed";
        res.status(502).json({ error: message });
        return;
    }

    const contentType = upstream.headers.get("content-type") ?? "";
    const isSSE = contentType.includes("text/event-stream");

    try {
        if (isSSE) {
            res.setHeader("Content-Type", "text/event-stream");
            res.setHeader("Cache-Control", "no-cache");
            res.setHeader("Connection", "keep-alive");
            res.flushHeaders();

            if (!upstream.body) {
                res.end();
                return;
            }

            const reader = upstream.body.getReader();
            const decoder = new TextDecoder();
            try {
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    res.write(decoder.decode(value, { stream: true }));
                }
            } finally {
                reader.releaseLock();
                res.end();
            }
        } else {
            const text = await upstream.text();
            let body: unknown;
            try {
                body = JSON.parse(text);
            } catch {
                body = text;
            }
            res.status(upstream.status).json(body);
        }
    } catch (err) {
        const message =
            err instanceof Error
                ? err.message
                : "Error reading upstream response";
        if (!res.headersSent) {
            res.status(502).json({ error: message });
        } else {
            res.end();
        }
    }
}

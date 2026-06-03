import { Router } from "express";
import {
	fetchConfig,
	generateReport,
	handleTriggerRequest,
	validatePayload,
	getPredefinedFlows,
	getExample,
	getCurrentStateFlow,
	proceedFlow,
	newFlow,
	updateFlow,
	getActions
} from "../controllers/flowController";
import validateRequiredParams from "../middlewares/generic";
import otelTracing from "../services/tracing-service";
import axios from "axios";
import logger from "@ondc/automation-logger";
const router = Router();

router.get("/", fetchConfig);
router.post("/report", otelTracing("", "query.sessionId"), generateReport);
router.post(
	"/trigger/:action",
	otelTracing(
		"query.transaction_id",
		"query.session_id",
		"query.subscriber_url"
	),
	handleTriggerRequest
);
router.post(
	"/validate/:action",
	otelTracing(
		"body.context.transaction_id",
		"",
		"body.context.bap_id",
		"body.context.bpp_id"
	),
	validatePayload
);
router.get("/customFlow", getPredefinedFlows);
router.post("/examples", getExample);
router.get(
	"/current-state",
	validateRequiredParams(["session_id", "transaction_id"]),
	otelTracing("query.transaction_id", "query.session_id"),
	getCurrentStateFlow
);
router.post(
	"/proceed",
	otelTracing("body.transaction_id", "body.session_id"),
	proceedFlow
);
router.post(
	"/new",
	otelTracing("body.transaction_id", "body.session_id"),
	newFlow
);
router.post("/external-form", async (req, res) => {
	try {
		const { link, data } = req.body;
		const exRes = await axios.post(link, data);
		logger.info("Submission response", exRes);
		res.status(exRes.status).send(exRes.data);
	} catch (e) {
		logger.error("GATE WAY ERROR", {}, e);
		res.status(500).send("GATEWAY ERROR");
	}
});
router.post("/custom-flow", otelTracing( 'body.session_id'), updateFlow)
router.post("/actions", otelTracing("body.domain", "body.version"), getActions)

/**
 * Road-following route proxy for the ride map (Real-Time Ride Map Integration).
 * Keeps the OSRM call server-side (CORS / rate-limit hygiene).
 *
 *   GET /flow/route?from=<lat,lng>&to=<lat,lng>
 *
 * Returns: { geometry: [[lat, lng], ...], distance: <m>, duration: <s> }
 * `geometry` is ordered [lat, lng] for direct use with Leaflet polylines.
 */
const OSRM_BASE = process.env.OSRM_BASE_URL || "https://router.project-osrm.org";

const parseLatLng = (s?: string): [number, number] | null => {
	if (!s) return null;
	const [lat, lng] = s.split(",").map((p) => Number(p.trim()));
	if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat, lng];
	return null;
};

router.get("/route", async (req, res) => {
	try {
		const from = parseLatLng(req.query.from as string);
		const to = parseLatLng(req.query.to as string);
		if (!from || !to) {
			res.status(400).send({ message: "from and to are required as 'lat,lng'" });
			return;
		}
		// OSRM expects lng,lat order.
		const coords = `${from[1]},${from[0]};${to[1]},${to[0]}`;
		const url = `${OSRM_BASE}/route/v1/driving/${coords}?overview=full&geometries=geojson`;
		const osrm = await axios.get(url);
		const route = osrm.data?.routes?.[0];
		if (!route) {
			res.status(502).send({ message: "No route found" });
			return;
		}
		// GeoJSON is [lng, lat]; flip to [lat, lng] for Leaflet.
		const geometry = (route.geometry?.coordinates ?? []).map(
			([lng, lat]: [number, number]) => [lat, lng]
		);
		res
			.status(200)
			.send({ geometry, distance: route.distance, duration: route.duration });
	} catch (e) {
		logger.error("Error fetching route from OSRM", {}, e);
		res.status(500).send({ message: "Error fetching route" });
	}
});

/**
 * Place search (geocoding) proxy for the ride map pickers — OpenStreetMap Nominatim.
 * Kept server-side to set a User-Agent and respect usage policy.
 *
 *   GET /flow/geocode?q=<place>
 *
 * Returns: [{ name, lat, lng }]
 */
const NOMINATIM_BASE =
	process.env.NOMINATIM_BASE_URL || "https://nominatim.openstreetmap.org";

router.get("/geocode", async (req, res) => {
	try {
		const q = (req.query.q as string)?.trim();
		if (!q) {
			res.status(400).send({ message: "q is required" });
			return;
		}
		const resp = await axios.get(`${NOMINATIM_BASE}/search`, {
			params: { q, format: "json", limit: 6, addressdetails: 0 },
			headers: { "User-Agent": "ondc-automation-ride-map/1.0" },
		});
		const results = (resp.data ?? []).map((r: any) => ({
			name: r.display_name,
			lat: Number(r.lat),
			lng: Number(r.lon),
		}));
		res.status(200).send(results);
	} catch (e) {
		logger.error("Error geocoding place", {}, e);
		res.status(500).send({ message: "Error geocoding place" });
	}
});

export default router;

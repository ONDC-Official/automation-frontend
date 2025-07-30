import axios from "axios";
import logger from "@ondc/automation-logger";
export const verifyJWT = async (token: string) => {
	try {
		const registryBaseUrl = process.env.IN_HOUSE_REGISTRY;
		const url = `${registryBaseUrl}/admin/v3.0/token/verify`;

		const res = await axios.post(url, {
			token: token,
		});
		if (res.data.Valid) {
			return {
				githubId: res.data.Claims.github_id,
				participantId: res.data.Claims.participant_id,
			};
		}
		return undefined;
	} catch (error) {
		logger.error("Error verifying JWT");
		return undefined;
	}
};

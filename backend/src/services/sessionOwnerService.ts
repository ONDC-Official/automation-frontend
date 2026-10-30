import axios from "axios";
import logger from "@ondc/automation-logger";

export interface SessionOwner {
	userId?: string;
	orgId?: string;
}

/**
 * Works out who a new session belongs to.
 *
 * With a login token, the login service says who the user is and which NP Portal
 * organisation they are working for, so neither can be faked in the request body.
 * Without one (or if the login service cannot be reached) the session keeps the
 * userId the website sent, as before, and has no organisation. orgId is always
 * set (even to undefined) so an orgId in the request body can never get through.
 */
export const resolveSessionOwner = async (
	authorization: string | undefined,
	bodyUserId: string | undefined,
	loggerMeta: any,
): Promise<SessionOwner> => {
	const loginService = process.env.DEVELOPER_GUIDE_SERVICE;
	if (!authorization || !loginService) {
		return { userId: bodyUserId, orgId: undefined };
	}
	try {
		const response = await axios.get(`${loginService}/auth/api/me`, {
			headers: { Authorization: authorization },
			timeout: 5000,
		});
		const user = response.data?.user;
		if (user?.username) {
			return {
				userId: user.username,
				orgId: user.organisationId || undefined,
			};
		}
	} catch (e: any) {
		logger.info(
			`Could not confirm the session owner with the login service (status ${e?.response?.status ?? "none"})`,
			loggerMeta,
		);
	}
	return { userId: bodyUserId, orgId: undefined };
};

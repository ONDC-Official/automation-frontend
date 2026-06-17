// need to test out with different envs
export const formatEnvLabel = (env: string): string => {
    if (env === "DEVELOPMENT") return "Development";
    if (env === "STAGING") return "Staging";
    if (env === "PRE-PRODUCTION") return "Pre-production";
    if (env === "PRODUCTION") return "Production";
    return env;
};

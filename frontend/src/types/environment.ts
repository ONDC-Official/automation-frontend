export enum Environment {
    DEVELOPMENT = "development",
    PRE_PROD = "pre-prod",
    PRODUCTION = "production",
}

export const appEnvironment = import.meta.env.VITE_ENVIRONMENT as Environment;

export const isDev = appEnvironment === Environment.DEVELOPMENT;

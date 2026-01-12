import { GAEvent } from "../../utils/analytics";

export interface Feature {
  title: string;
  subtitle: string;
  description: string;
  path: string;
  icon: JSX.Element;
  analytics?: GAEvent;
}

export type DomainItem = {
  id?: string; // ideally unique from your data source
  key: string; // display label, may repeat!
  version: { key: string; usecase: string[] }[];
};

export type DomainResponse = { domain: DomainItem[] };

import { ReactNode } from "react";
import { GAEvent } from "@utils/analytics";

export interface FooterLink {
  name: string;
  href: string;
  analytics: GAEvent;
}

export interface SocialLink {
  name: string;
  href: string;
  icon: ReactNode;
  analytics: GAEvent;
}

export interface FooterLinks {
  company: FooterLink[];
  developers: FooterLink[];
  support: FooterLink[];
  quickLinks: FooterLink[];
}

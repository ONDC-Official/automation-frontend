import { IFooterLinks, ISocialLink } from "@/components/Footer/types";
import GitHubIcon from "@/assets/svgs/GitHubIcon";
import LinkedInIcon from "@/assets/svgs/LinkedInIcon";

export const footerLinks: IFooterLinks = {
    company: [
        {
            name: "About ONDC",
            href: "https://ondc.org/",
            analytics: { category: "FOOTER", action: "Clicked on 'About ONDC'" },
        },
    ],
    developers: [
        {
            name: "API Documentation",
            href: "https://github.com/ONDC-Official/automation-framework",
            analytics: {
                category: "FOOTER",
                action: "Clicked on 'API Documentation'",
            },
        },
        {
            name: "SDKs & Tools",
            href: "https://github.com/ONDC-Official/automation-validation-compiler",
            analytics: { category: "FOOTER", action: "Clicked on 'SDKs & Tools'" },
        },
    ],
    support: [
        {
            name: "Bug Reports",
            href: "https://github.com/ONDC-Official/automation-framework/issues",
            analytics: { category: "FOOTER", action: "Clicked on 'Bug Reports'" },
        },
    ],
    quickLinks: [
        {
            name: "Join ONDC",
            href: "https://ondc.org/ondc-how-to-join/",
            analytics: { category: "FOOTER", action: "Clicked on 'Join ONDC'" },
        },
    ],
};

export const footerLinkColumns: { title: string; key: keyof IFooterLinks }[] = [
    { title: "Company", key: "company" },
    { title: "Developers", key: "developers" },
    { title: "Support", key: "support" },
    { title: "Quick Links", key: "quickLinks" },
];

export const socialLinks: ISocialLink[] = [
    {
        name: "LinkedIn",
        href: "https://in.linkedin.com/company/open-network-for-digital-commerce",
        icon: <LinkedInIcon />,
        analytics: { category: "FOOTER", action: "Clicked on 'LinkedIn'" },
    },
    {
        name: "GitHub",
        href: "https://github.com/ONDC-Official",
        icon: <GitHubIcon />,
        analytics: { category: "FOOTER", action: "Clicked on 'GitHub'" },
    },
];

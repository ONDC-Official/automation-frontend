import { BsGithub, BsLinkedin } from "react-icons/bs";
import { FooterLinks, SocialLink } from "./types";

export const footerLinks: FooterLinks = {
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

export const socialLinks: SocialLink[] = [
    {
        name: "LinkedIn",
        href: "https://in.linkedin.com/company/open-network-for-digital-commerce",
        icon: <BsLinkedin />,
        analytics: { category: "FOOTER", action: "Clicked on 'LinkedIn'" },
    },
    {
        name: "GitHub",
        href: "https://github.com/ONDC-Official",
        icon: <BsGithub />,
        analytics: { category: "FOOTER", action: "Clicked on 'GitHub'" },
    },
];

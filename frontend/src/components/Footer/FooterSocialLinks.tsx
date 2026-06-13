import { trackEvent } from "@utils/analytics";
import { socialLinks } from "@/components/Footer/constants";

export const FooterSocialLinks = () => (
    <div className="flex items-center gap-4">
        {socialLinks.map((social) => (
            <a
                key={social.name}
                href={social.href}
                className="text-n-0 hover:text-brand-light transition-colors"
                aria-label={social.name}
                onClick={() => trackEvent(social.analytics)}
            >
                <span className="text-2xl text-n-60">{social.icon}</span>
            </a>
        ))}
    </div>
);

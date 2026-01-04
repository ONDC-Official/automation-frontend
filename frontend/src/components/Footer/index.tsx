import { Link } from "react-router-dom";
import { trackEvent } from "@utils/analytics";
import { footerLinks, socialLinks } from "@components/Footer/constants";

const Footer = () => (
  <footer className="bg-gray-800 text-white mt-auto">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {/* Main footer content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
        {/* Company info */}
        <div className="lg:col-span-1">
          <img
            src="https://ondc.org/assets/theme/images/ondc_registered_logo.svg?v=d864655110"
            alt="Logo"
            className="h-12 w-auto"
          />
          <p className="text-gray-400 text-sm leading-relaxed">
            India's first open commerce network enabling seamless digital transactions across domains.
          </p>
          <div className="flex space-x-4 mt-6">
            {socialLinks.map(social => (
              <a
                key={social.name}
                href={social.href}
                className="text-gray-400 hover:text-sky-400 transition-colors"
                aria-label={social.name}>
                <span className="text-2xl">{social.icon}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Company links */}
        <div>
          <h3 className="text-white font-semibold mb-4">Company</h3>
          <ul className="space-y-3">
            {footerLinks.company.map(link => (
              <li key={link.name} onClick={() => trackEvent(link.analytics)}>
                <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Developer links */}
        <div>
          <h3 className="text-white font-semibold mb-4">Developers</h3>
          <ul className="space-y-3">
            {footerLinks.developers.map(link => (
              <li key={link.name} onClick={() => trackEvent(link.analytics)}>
                <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Support links */}
        <div>
          <h3 className="text-white font-semibold mb-4">Support</h3>
          <ul className="space-y-3">
            {footerLinks.support.map(link => (
              <li key={link.name} onClick={() => trackEvent(link.analytics)}>
                {link.href.startsWith("/") ? (
                  <Link to={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                ) : (
                  <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                    {link.name}
                  </a>
                )}
              </li>
            ))}
          </ul>
        </div>

        {/* Quick links */}
        <div>
          <h3 className="text-white font-semibold mb-4">Quick Links</h3>
          <ul className="space-y-3">
            {footerLinks.quickLinks.map(link => (
              <li key={link.name} onClick={() => trackEvent(link.analytics)}>
                <a href={link.href} className="text-gray-400 hover:text-white transition-colors text-sm">
                  {link.name}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="my-8 bg-gray-700" />

      {/* Bottom footer */}
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="text-gray-400 text-sm">© 2024 Open Network for Digital Commerce (ONDC)</div>
      </div>
    </div>
  </footer>
);

export default Footer;

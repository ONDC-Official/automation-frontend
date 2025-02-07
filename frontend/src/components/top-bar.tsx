import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

interface NavLink {
  label: string;
  href: string;
  selected: boolean;
}

const navLinks: NavLink[] = [
  { label: "Home", href: "/home", selected: true },
  { label: "Schema Validation", href: "/schema", selected: false },
  { label: "Unit Testing", href: "/unit", selected: false },
  { label: "Scenario Testing", href: "/scenario", selected: false },
  // { label: "Custom flow Workbench", href: "/customFlow", selected: false },
  { label: "Support", href: "", selected: false },
];

interface IPops {
  onSupportClick: () => void;
}

const TopBar = ({ onSupportClick }: IPops) => {
  const [isOpen, setIsOpen] = useState(false);
  const [links, setLinks] = useState<[] | NavLink[]>([]);
  const navigate = useNavigate();
  const location = useLocation();
  const pathName = location.pathname;

  useEffect(() => {
    if (pathName === "/") {
      setLinks(navLinks);
      navigate("/home");
    } else {
      const modifiedLink: NavLink[] = navLinks.map((link) => {
        if (link.href === pathName) {
          link.selected = true;
        } else {
          link.selected = false;
        }
        return link;
      });

      setLinks(modifiedLink);
    }
  }, [pathName]);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
      <nav className="container mx-auto flex items-center justify-between p-4">
        <div
          className="flex items-center justify-start w-full md:w-auto cursor-pointer"
          onClick={() => navigate("/home")}
        >
          <img
            src="https://ondc.org/assets/theme/images/ondc_registered_logo.svg?v=d864655110"
            alt="Logo"
            className="h-10 w-auto"
          />
          <h2
            className="text-2xl text-transparent bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text ml-4"
            style={{
              fontWeight: "1000",
            }}
          >
            PROTOCOL WORKBENCH
          </h2>
        </div>

        <div className="md:hidden">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="text-gray-700 focus:outline-none"
            aria-label="Toggle navigation"
          >
            {isOpen ? (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            ) : (
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 8h16M4 16h16"
                />
              </svg>
            )}
          </button>
        </div>
        <ul
          className={`flex space-x-6 md:flex ${
            isOpen
              ? "block absolute top-16 left-0 right-0 bg-white p-4 md:static md:flex-row flex-col"
              : "hidden md:flex-row"
          }`}
        >
          {links.map((link, index) => (
            <li key={index}>
              <a
                className={`hover:text-blue-500 block py-1 cursor-pointer  ${
                  link.selected
                    ? "text-blue-700 border-b-2 border-blue-500 text-blue-500"
                    : "text-gray-500"
                }`}
                onClick={() => {
                  if (link.label === "Support") {
                    onSupportClick();
                  } else {
                    navigate(link.href);
                  }
                }}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </header>
  );
};

export default TopBar;

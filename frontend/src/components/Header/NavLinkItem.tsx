import { FaChevronDown } from "react-icons/fa";
import { NavLink } from "./types";

interface NavLinkItemProps {
    link: NavLink;
    isOpen: boolean;
    openDropdown: string | null;
    dropdownRef: React.RefObject<HTMLLIElement>;
    onLinkClick: (link: NavLink) => void;
    onSubMenuClick: (href: string) => void;
    onMouseEnter: () => void;
    onMouseLeave: () => void;
}

export const NavLinkItem = ({
    link,
    isOpen,
    openDropdown,
    dropdownRef,
    onLinkClick,
    onSubMenuClick,
    onMouseEnter,
    onMouseLeave,
}: NavLinkItemProps) => {
    const isDropdownOpen = openDropdown === link.label;

    return (
        <li
            className="relative"
            ref={link.subMenu ? dropdownRef : null}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
        >
            <a
                className={`cursor-pointer flex items-center px-3 py-1.5 rounded-full text-sm font-medium tracking-wide transition-all duration-200 ${
                    link.selected
                        ? "bg-sky-50 text-sky-600 font-semibold"
                        : "text-gray-500 hover:text-sky-600 hover:bg-sky-50/60"
                }`}
                onClick={() => onLinkClick(link)}
            >
                {link.label}
                {link.subMenu && (
                    <FaChevronDown
                        className={`ml-1 text-xs transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}
                    />
                )}
            </a>
            {link.subMenu && isDropdownOpen && (
                <div
                    className={`${
                        isOpen ? "static mt-2 ml-4" : "absolute top-full left-0 mt-2"
                    } bg-white border border-gray-100 rounded-2xl shadow-2xl min-w-48 z-50 overflow-hidden py-1`}
                >
                    {link.subMenu.map((subItem, subIndex) => (
                        <a
                            key={subIndex}
                            className="block mx-1 px-3 py-2 text-sm text-gray-600 hover:bg-sky-50 hover:text-sky-600 rounded-lg cursor-pointer transition-colors duration-150"
                            onClick={() => onSubMenuClick(subItem.href)}
                        >
                            {subItem.label}
                        </a>
                    ))}
                </div>
            )}
        </li>
    );
};

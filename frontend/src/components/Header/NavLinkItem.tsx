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
                className={`hover:text-sky-500 py-1 cursor-pointer flex items-center ${
                    link.selected ? "text-sky-500 border-b-2 border-sky-500" : "text-gray-500"
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
                        isOpen ? "static mt-2 ml-4" : "absolute top-full left-0 mt-1"
                    } bg-white border border-gray-200 rounded-md shadow-lg min-w-48 z-50`}
                >
                    {link.subMenu.map((subItem, subIndex) => (
                        <a
                            key={subIndex}
                            className="block px-4 py-2 text-gray-700 hover:bg-sky-50 hover:text-sky-600 first:rounded-t-md last:rounded-b-md cursor-pointer"
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

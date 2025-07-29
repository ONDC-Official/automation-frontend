import { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { FaChevronDown } from "react-icons/fa";

interface SubMenuItem {
	label: string;
	href: string;
}

interface NavLink {
	label: string;
	href: string;
	selected: boolean;
	subMenu?: SubMenuItem[];
}

const navLinks: NavLink[] = [
  { label: "Home", href: "/home", selected: true },
  { label: "Schema Validation", href: "/schema", selected: false },
  // { label: "Unit Testing", href: "/unit", selected: false },
  { label: "Scenario Testing", href: "/scenario", selected: false },
  // { label: "Custom flow Workbench", href: "/customFlow", selected: false },
  { 
    label: "Tools", 
    href: "/tools", 
    selected: false,
    subMenu: [
      { label: "Seller Onboarding", href: "/seller-onboarding" }
    ]
  },
  { label: "Support", href: "", selected: false },
];

interface IPops {
	onSupportClick: () => void;
}

const TopBar = ({ onSupportClick }: IPops) => {
	const [isOpen, setIsOpen] = useState(false);
	const [links, setLinks] = useState<[] | NavLink[]>([]);
	const [openDropdown, setOpenDropdown] = useState<string | null>(null);
	const dropdownRef = useRef<HTMLLIElement>(null);
	const navigate = useNavigate();
	const location = useLocation();
	const pathName = location.pathname;

	useEffect(() => {
		if (pathName === "/") {
			setLinks(navLinks);
			navigate("/home");
		} else {
			const modifiedLink: NavLink[] = navLinks.map((link) => {
				// Check if main link is selected
				if (link.href === pathName) {
					link.selected = true;
				} else {
					// Check if any submenu item is selected
					const isSubMenuSelected = link.subMenu?.some(sub => sub.href === pathName);
					link.selected = isSubMenuSelected || false;
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
						<li 
							key={index} 
							className="relative group" 
							ref={link.subMenu ? dropdownRef : undefined}
							onMouseEnter={() => {
								if (link.subMenu) {
									setOpenDropdown(link.label);
								}
							}}
							onMouseLeave={() => {
								if (link.subMenu) {
									setOpenDropdown(null);
								}
							}}
						>
							{link.subMenu ? (
								<>
									<a
										className={`hover:text-blue-500 block py-1 cursor-pointer flex items-center gap-1 ${
											link.selected
												? "text-blue-700 border-b-2 border-blue-500 text-blue-500"
												: "text-gray-500"
										}`}
										onClick={() => {
											navigate(link.href);
											setOpenDropdown(null);
										}}
									>
										{link.label}
										<FaChevronDown className={`text-xs transition-transform ${openDropdown === link.label ? 'rotate-180' : ''}`} />
									</a>
									{openDropdown === link.label && (
										<ul 
											className="absolute top-full left-0 mt-1 bg-white shadow-lg rounded-md py-2 min-w-[200px] z-50"
											onMouseEnter={() => setOpenDropdown(link.label)}
										>
											{link.subMenu.map((subItem, subIndex) => (
												<li key={subIndex}>
													<a
														className="block px-4 py-2 text-gray-700 hover:bg-gray-100 hover:text-blue-500 cursor-pointer"
														onClick={() => {
															navigate(subItem.href);
															setOpenDropdown(null);
															setIsOpen(false);
														}}
													>
														{subItem.label}
													</a>
												</li>
											))}
										</ul>
									)}
								</>
							) : (
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
							)}
						</li>
					))}
				</ul>
			</nav>
		</header>
	);
};

export default TopBar;

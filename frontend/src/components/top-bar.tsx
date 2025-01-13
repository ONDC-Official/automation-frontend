import { useState } from "react";

interface NavLink {
	label: string;
	href: string;
}

const navLinks: NavLink[] = [
	{ label: "Support", href: "/support" },
	{ label: "Contribute", href: "/contribute" },
	{ label: "FAQs", href: "/faq" },
];

interface IPops {
	onSupportClick : () => void;
}

const TopBar = ({onSupportClick}: IPops) => {
	const [isOpen, setIsOpen] = useState(false);

	return (
		<header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
			<nav className="container mx-auto flex items-center justify-between p-4">
				<div className="flex items-center">
					<img
						src="https://seeklogo.com/images/O/open-network-for-digital-commerce-logo-E7F55933B3-seeklogo.com.png"
						alt="Logo"
						className="h-10 w-auto"
					/>
					<h2
						className="text-2xl text-transparent bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text ml-4"
						style={{
							fontWeight: "1000",
						}}
					>
						AUTOMATION TOOL
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
					{navLinks.map((link, index) => (
						<li key={index}>
							<a className="text-gray-700 hover:text-blue-500 block py-2" onClick={() => {
								if(link.label === "Support") {
									onSupportClick()
								}
							}}>
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

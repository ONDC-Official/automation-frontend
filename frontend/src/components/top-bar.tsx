import { useContext, useEffect, useState } from "react";
import { FaRegUser } from "react-icons/fa";
import { FiLogIn } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom";
import { UserContext } from "../context/userContext";
import { GiVintageRobot } from "react-icons/gi";

interface NavLink {
	label: string;
	href: string;
	selected: boolean;
}

const navLinks: NavLink[] = [
	{ label: "Home", href: "/home", selected: true },
	{ label: "Schema Validation", href: "/schema", selected: false },
	// { label: "Unit Testing", href: "/unit", selected: false },
	{ label: "Scenario Testing", href: "/scenario", selected: false },
	// { label: "Custom flow Workbench", href: "/customFlow", selected: false },
	{ label: "Support", href: "", selected: false },
];

interface IPops {
	onSupportClick: () => void;
}

export interface UserDetails {
	githubId: string;
	participantId: string;
	avatarUrl?: string;
}

const TopBar = ({ onSupportClick }: IPops) => {
	const [isOpen, setIsOpen] = useState(false);
	const [links, setLinks] = useState<[] | NavLink[]>([]);
	const navigate = useNavigate();
	const location = useLocation();
	const pathName = location.pathname;

	const [userDetails, setUserDetails] = useState<UserDetails | undefined>(
		undefined
	);

	const userContext = useContext(UserContext);

	const user = userContext.userDetails;
	console.log("user", user);
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

	useEffect(() => {
		setUserDetails(user);
	}, [user]);

	return (
		<header className="fixed top-0 left-0 right-0 bg-white shadow-md z-50">
			<nav className="container mx-auto flex items-center justify-between p-2">
				<div
					className="flex items-center justify-start w-full md:w-auto cursor-pointer"
					onClick={() => navigate("/home")}
				>
					{/* <img
						src="https://ondc.org/assets/theme/images/ondc_registered_logo.svg?v=d864655110"
						alt="Logo"
						className="h-10 w-auto"
					/> */}
					{/* <GoGear className="h-8 w-8 text-sky-600" /> */}
					{/* <MdOutlineSettings className="h-8 w-8 text-sky-600" /> */}
					<GiVintageRobot className="h-10 w-10 text-sky-600" />
					<pre
						className="text-2xl font-bold text-transparent bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text ml-1 mb-1"
						style={{
							fontWeight: "1000",
						}}
					>
						WORKBENCH
					</pre>
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
								className={`hover:text-sky-500 block py-1 cursor-pointer  ${
									link.selected
										? "text-sky-700 border-b-2 border-sky-500 text-sky-500"
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
					<li></li>
				</ul>
				<div className="relative flex items-center">
					{/* Username on the left */}
					{userDetails && (
						<>
							<span className="mr-2 text-sm md:text-base text-gray-700 mb-2">
								<strong>{userDetails.githubId}</strong>
							</span>
						</>
					)}
					{!userDetails && (
						<>
							<span className="mr-2 text-sm md:text-base text-gray-700 mb-2">
								<strong>login</strong>
							</span>
						</>
					)}

					{/* Button on the right */}
					<button
						onClick={() => {
							setIsOpen(false);
							navigate(userDetails ? "/profile" : "/login");
						}}
						className="mt-2 text-xl"
						// className="text-sky-600 bg-sky-200 rounded-full p-2 hover:text-sky-800 text-xl md:text-2xl"
						title={userDetails ? "Profile" : "Login"}
					>
						{userDetails ? (
							<UserIcon user={userDetails} />
						) : (
							<div className="w-10 h-10 rounded-full shadow-sm bg-sky-100 mx-auto mb-4 text-gray-700 flex items-center justify-center">
								<FiLogIn />
							</div>
						)}
					</button>
				</div>
			</nav>
		</header>
	);
};

function UserIcon({ user }: { user: UserDetails }) {
	if (!user.avatarUrl) {
		return (
			<div className="w-10 h-10 rounded-full bg-sky-100  mx-auto mb-4 border flex items-center justify-center">
				<FaRegUser />;
			</div>
		);
	}
	return (
		<img
			src={user.avatarUrl}
			alt={`${user.githubId}'s avatar`}
			className="w-10 h-10 rounded-full mx-auto mb-4 border"
		/>
	);
}

export default TopBar;

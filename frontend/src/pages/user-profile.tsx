import { useContext, useEffect } from "react";
import { UserContext } from "../context/userContext";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import JsonDataForm from "../components/registry-components/subscriber-form";
import { LuLogOut } from "react-icons/lu";

export default function UserProfile() {
	const user = useContext(UserContext);
	const navigate = useNavigate();

	useEffect(() => {
		user.refreshUser(); // Refresh user context on mount
		if (!user.userDetails) {
			navigate("/home"); // Redirect to home if not logged in
		}
	}, []);

	async function handleLogout() {
		try {
			const url = `${import.meta.env.VITE_BACKEND_URL}/auth/logout`;
			await axios.post(url, {}, { withCredentials: true });
			await user.refreshUser(); // Refresh user context after logout
			navigate("/home");
		} catch (error) {
			console.error("Logout failed:", error);
			navigate("/home"); // Redirect to home on error
		}
	}

	return (
		<>
			<div className="font-sans flex justify-center min-h-screen p-4">
				<div className="bg-white shadow-xl rounded-2xl p-8 sm:p-10 max-w-screen-2xl w-full text-center">
					<div className="bg-gray-100 p-2 rounded-md shadow-sm mb-2 items-start">
						<h1 className="text-3xl font-bold text-gray-900 mb-4 mt-4">
							User Profile
						</h1>
						<div className="max-w-4xl mx-auto p-6 bg-white rounded-xl">
							<div className="flex justify-between items-start flex-col sm:flex-row sm:items-center">
								{/* Left - User Data (each on new line) */}
								<div className="text-gray-700 space-y-1 items-start justify-items-start">
									<p>
										<strong>Login:</strong>{" "}
										{user.userDetails?.githubId || "N/A"}
									</p>
									<p>
										<strong>Participant ID:</strong>{" "}
										{user.userDetails?.participantId || "N/A"}
									</p>
								</div>

								{/* Right - Logout Button */}
								<div className="mt-4 sm:mt-0 sm:ml-6">
									<button
										className="px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-800 flex items-center"
										onClick={async () => await handleLogout()}
									>
										<LuLogOut className="inline-block text-lg" />
										<span className="ml-2">
											<strong>Logout</strong>
										</span>
									</button>
								</div>
							</div>
						</div>
					</div>

					<JsonDataForm />
				</div>
			</div>
		</>
	);
}

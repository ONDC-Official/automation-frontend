import { ToastContainer } from "react-toastify";
import "./App.css";
import TopBar, { UserDetails } from "./components/top-bar";
import Modal from "./components/modal";
import { useEffect, useState } from "react";
import Support from "./components/support";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/home";
import NotFoundPage from "./components/ui/not-found";
import SchemaValidation from "./pages/schema-validation";
import FlowContent from "./components/flow-testing/flow-page";
import SellerOnboarding from "./pages/seller-onboarding";
import ToolsPage from "./pages/tools";
import GitHubLogin from "./pages/login";
import { UserContext } from "./context/userContext";
import UserProfile from "./pages/user-profile";
import axios from "axios";
import { getGithubAvatarUrl } from "./utils/regsitry-utils";
import { SubscriberData } from "./components/registry-components/registry-types";
import * as api from "./utils/registry-apis";
import Footer from "./components/main-footer";
import {SessionProvider} from "./context/context"
import {GuideStepsEnums, useGuide} from "./context/guideContext"

function App() {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [user, setUser] = useState<UserDetails | undefined>(undefined);
	const [isLoggedIn, setIsLoggedIn] = useState(false);
	const [subscriberData, setSubscriberData] = useState<SubscriberData>({
		keys: [],
		mappings: [],
	});
	// const [isLoading, setIsLoading] = useState(true);
	const {setGuideStep} = useGuide()

	useEffect(() => {
		try {
			const key = localStorage.getItem("sessionIdForSupport") as string;
			JSON.parse(key);
		} catch (e) {
			localStorage.removeItem("sessionIdForSupport");
		}
	}, []);

	// Example in React (frontend)
	useEffect(() => {
		refreshUser();
	}, []);

	useEffect(() => {
		fetchUserLookUp();
	}, [location.pathname, user]);

	function fetchUserLookUp() {
		api
			.getSubscriberDetails(user)
			.then((data) => {
				if (data) {
					setSubscriberData(data);
				} else {
					// toast.error("Failed to load subscriber details");
				}
				// setIsLoading(false);
			})
			.catch((error) => {
				console.error("Error fetching subscriber details:", error);
				// toast.error("Failed to load subscriber details");
				// setIsLoading(false);
			});
	}

	async function refreshUser() {
		try {
			const url = `${import.meta.env.VITE_BACKEND_URL}/auth/api/me`;
			const res = await axios.get(url, { withCredentials: true });
			if (res.data.ok) {
				console.log("Logged in user:", res.data);
				const avatarUrl = await getGithubAvatarUrl(res.data.user.githubId);
				setUser({
					...res.data.user,
					avatarUrl: avatarUrl,
				});
				setIsLoggedIn(true);
			} else {
				console.log("Not logged in");
				setUser(undefined);
				setIsLoggedIn(false);
			}
		} catch (error) {
			console.error("Error fetching user:", error);
			setUser(undefined);
		}
	}

	useEffect(() => {
		if(isLoggedIn && user) {
			if((!subscriberData.keys.length || !subscriberData.mappings.length)) {
				setGuideStep(GuideStepsEnums.Reg1)
			} else {
				setGuideStep(GuideStepsEnums.Test1)
			}
		}
	}, [isLoggedIn, subscriberData])

	return (
		<UserContext.Provider
			value={{
				isLoggedIn: isLoggedIn,
				userDetails: user,
				refreshUser: refreshUser,
				subscriberData: subscriberData,
				setSubscriberData: setSubscriberData,
			}}
		>
			<SessionProvider>
					<TopBar
						onSupportClick={() => setIsModalOpen(true)}
					/>
					<div className="pt-[72px] h-full">
						<Routes>
							<Route path="/home" element={<HomePage />} />
							<Route path="/schema" element={<SchemaValidation />} />
							{/* <Route path="/unit" element={<ApiTesting />} /> */}
							<Route path="/scenario" element={<FlowContent type={"SCENARIO"} />} />
							<Route path="/customFlow" element={<FlowContent type={"CUSTOM"} />} />
							<Route path="/login" element={<GitHubLogin />} />
							<Route path="/profile" element={<UserProfile />} />
							<Route path="/tools" element={<ToolsPage />} />
							<Route path="/seller-onboarding" element={<SellerOnboarding />} />
							<Route path="*" element={<NotFoundPage />} />
						</Routes>
					</div>
					<Footer />
					<Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
						<Support />
					</Modal>
					<ToastContainer
						position="top-right"
						autoClose={3000}
						hideProgressBar={false}
						newestOnTop
						closeOnClick
						rtl={false}
						pauseOnFocusLoss={false}
						draggable
						pauseOnHover={false}
						theme="colored"
					/>
			</SessionProvider>
		</UserContext.Provider>
	);
}

export default App;

import { Route, Routes as RouterRoutes } from "react-router-dom";
import SchemaValidation from "@pages/schema-validation";
import SellerOnboarding from "@pages/seller-onboarding";
import ToolsPage from "@pages/tools";
import Login from "@/pages/login";
import UserProfile from "@pages/user-profile";
import Walkthrough from "@pages/walkthrough";
import ProtocolPlayGround from "@components/protocol-playground/main";
import PastSessions from "@pages/past-sessions";
import DBBackOffice from "@components/db-back-office/db-back-office";
import FlowTestingWrapper from "@components/flow-testing/flow-testing-wrapper";
import NotFoundPage from "@components/ui/not-found";
import FlowContent from "@components/flow-testing/flow-page";
import HomePage from "@/pages/home";
import { ROUTES } from "@/constants/routes";

const Routes = () => (
  <RouterRoutes>
    <Route path={ROUTES.HOME} element={<HomePage />} />
    <Route path={ROUTES.SCHEMA} element={<SchemaValidation />} />
    <Route path={ROUTES.SCENARIO} element={<FlowContent />} />
    <Route path={ROUTES.FLOW_TESTING} element={<FlowTestingWrapper />} />
    <Route path={ROUTES.LOGIN} element={<Login />} />
    <Route path={ROUTES.PROFILE} element={<UserProfile />} />
    <Route path={ROUTES.TOOLS} element={<ToolsPage />} />
    <Route path={ROUTES.SELLER_ONBOARDING} element={<SellerOnboarding />} />
    <Route path={ROUTES.PLAYGROUND} element={<ProtocolPlayGround />} />
    <Route path={ROUTES.WALKTHROUGH} element={<Walkthrough />} />
    <Route path={ROUTES.HISTORY} element={<PastSessions loggedIn={false} />} />
    <Route path="*" element={<NotFoundPage />} />
    <Route path={ROUTES.DB_BACK_OFFICE} element={<DBBackOffice />} />
  </RouterRoutes>
);

export default Routes;

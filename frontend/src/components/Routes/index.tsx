import { Route, Routes as RouterRoutes } from "react-router-dom";
import SchemaValidationPage from "@pages/schema-validation";
import SellerOnboarding from "@pages/seller-onboarding";
import ToolsPage from "@pages/tools";
import Login from "@pages/login";
import UserProfile from "@pages/user-profile";
import ProtocolPlayGround from "@pages/protocol-playground";
import HistoryPage from "@pages/history";
import DBBackOffice from "@pages/db-back-office";
import FlowTestingWrapper from "@pages/flow-testing";
import NotFoundPage from "@components/NotFound";
import ScenarioPage from "@pages/scenario";
import HomePage from "@pages/home";
import AuthHeader from "@pages/auth-header";
import { ROUTES } from "@constants/routes";

const Routes = () => (
  <RouterRoutes>
    <Route path={ROUTES.HOME} element={<HomePage />} />
    <Route path={ROUTES.SCHEMA} element={<SchemaValidationPage />} />

    <Route path={ROUTES.SCENARIO} element={<ScenarioPage />} />
    <Route path={ROUTES.FLOW_TESTING} element={<FlowTestingWrapper />} />

    <Route path={ROUTES.LOGIN} element={<Login />} />
    <Route path={ROUTES.PROFILE} element={<UserProfile />} />
    <Route path={ROUTES.TOOLS} element={<ToolsPage />} />
    <Route path={ROUTES.SELLER_ONBOARDING} element={<SellerOnboarding />} />
    <Route path={ROUTES.PLAYGROUND} element={<ProtocolPlayGround />} />
    <Route path={ROUTES.HISTORY} element={<HistoryPage />} />
    <Route path="*" element={<NotFoundPage />} />
    <Route path={ROUTES.DB_BACK_OFFICE} element={<DBBackOffice />} />
    <Route path={ROUTES.AUTH_HEADER} element={<AuthHeader />} />
  </RouterRoutes>
);

export default Routes;

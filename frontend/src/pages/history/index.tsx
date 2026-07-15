// Manual /history URL entry (e.g. QA). Home links use auth-gated /profile/history instead.
import { useAuth } from "@hooks/useAuth";
import ActivityHistorySection from "@pages/user-profile/ActivityHistorySection";
import LoadingOverlay from "@components/Shadcn/LoadingOverlay";

const HistoryPage = () => {
    const { isAuthLoading } = useAuth();

    if (isAuthLoading) {
        return <LoadingOverlay />;
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-surface-elevated px-20">
            <ActivityHistorySection />
        </div>
    );
};

export default HistoryPage;

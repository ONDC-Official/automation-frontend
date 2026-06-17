//We have added a new route for QA i.e /history. It is for test purpose only and is not hyperlinked as a click page just "/history" will open then page when you manually input it in the URL.
import { useContext } from "react";
import { AuthContext } from "@/context/authContext";
import ActivityHistorySection from "@pages/user-profile/ActivityHistorySection";
import SpinnerDialog from "@/components/Shadcn/SpinnerDialog";

const HistoryPage = () => {
    const { isAuthLoading } = useContext(AuthContext);

    if (isAuthLoading) {
        return <SpinnerDialog />;
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-surface-elevated px-20">
            <ActivityHistorySection />
        </div>
    );
};

export default HistoryPage;

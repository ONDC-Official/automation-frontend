import DiscoverySection from "@pages/seller-load-testing/DiscoverySection";
import PreorderLoadTest from "@pages/seller-load-testing/PreorderLoadTest";
import SessionCard from "@pages/seller-load-testing/SessionCard";
import { ActiveSessionPanelsProps } from "@pages/seller-load-testing/types";

export const ActiveSessionPanels = ({
    sessionData,
    isDeleting,
    handleDelete,
    handleNewSession,
    setDiscoveryComplete,
    discoveryComplete,
}: ActiveSessionPanelsProps) => (
    <>
        <SessionCard
            sessionId={sessionData.sessionId}
            bppId={sessionData.bppId}
            bppUri={sessionData.bppUri}
            createdAt={sessionData.createdAt}
            expiresAt={sessionData.expiresAt}
            status={sessionData.status}
            onDelete={handleDelete}
            onNewSession={handleNewSession}
            isDeleting={isDeleting}
        />
        <DiscoverySection
            sessionId={sessionData.sessionId}
            bppUri={sessionData.bppUri}
            createdAt={sessionData.createdAt}
            status={sessionData.status}
            onUpload={() => {}}
            onDiscoveryComplete={() => setDiscoveryComplete(true)}
        />
        <PreorderLoadTest
            sessionId={sessionData.sessionId}
            status={sessionData.status}
            discoveryComplete={discoveryComplete}
        />
    </>
);

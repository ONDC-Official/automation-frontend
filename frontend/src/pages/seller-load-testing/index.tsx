import React from "react";
import { useForm } from "react-hook-form";
import { useSellerLoadTesting } from "@pages/seller-load-testing/useSellerLoadTesting";
import { CreateSessionPanel } from "@pages/seller-load-testing/CreateSessionPanel";
import { ActiveSessionPanels } from "@pages/seller-load-testing/ActiveSessionPanels";
import { FormValues } from "@pages/seller-load-testing/types";

const SellerLoadTesting = () => {
    const {
        register,
        handleSubmit,
        formState: { errors },
    } = useForm<FormValues>({
        defaultValues: {
            domain: "ONDC:RET11",
            version: "1.2.5",
            usecase: "F&B",
            environment: "PRE-PRODUCTION",
        },
    });

    const {
        isLoading,
        isDeleting,
        sessionData,
        discoveryComplete,
        setDiscoveryComplete,
        onSubmit,
        handleDelete,
        handleNewSession,
    } = useSellerLoadTesting();

    return (
        <PageLayout>
            <SellerLoadTestingHeader />
            <div className="flex flex-1 w-full">
                <div className="w-full p-2 rounded-sm border bg-white">
                    {!sessionData ? (
                        <CreateSessionPanel
                            handleSubmit={handleSubmit}
                            onSubmit={onSubmit}
                            register={register}
                            errors={errors}
                            isLoading={isLoading}
                        />
                    ) : (
                        <ActiveSessionPanels
                            sessionData={sessionData}
                            isDeleting={isDeleting}
                            handleDelete={handleDelete}
                            handleNewSession={handleNewSession}
                            setDiscoveryComplete={setDiscoveryComplete}
                            discoveryComplete={discoveryComplete}
                        />
                    )}
                </div>
            </div>
        </PageLayout>
    );
};

const PageLayout = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-50">
        <div className="bg-white shadow-sm border-b">
            <div className="container mx-auto px-6 py-6">{children}</div>
        </div>
    </div>
);

const SellerLoadTestingHeader = () => (
    <h1 className="text-3xl font-bold text-transparent bg-gradient-to-r from-sky-600 to-sky-400 bg-clip-text">
        Seller Load Testing
    </h1>
);

export default SellerLoadTesting;

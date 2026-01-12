import { FC } from "react";
import { useDbBackOffice } from "@hooks/useDbBackOffice";
import FetchForm from "@pages/db-back-office/FetchForm";
import Header from "@pages/db-back-office/Header";
import LoginForm from "@pages/db-back-office/LoginForm";
import PayloadDisplay from "@pages/db-back-office/PayloadDisplay";
import EmptyState from "@components/EmptyState";

const DBBackOffice: FC = () => {
  const {
    isAuthenticated,
    isLoading,
    credentials,
    fetchParams,
    payloadData,
    handleLogin,
    fetchPayloadData,
    handleLogout,
    setCredentials,
    setFetchParams,
  } = useDbBackOffice();

  if (!isAuthenticated) {
    return (
      <LoginForm
        credentials={credentials}
        isLoading={isLoading}
        onCredentialsChange={setCredentials}
        onLogin={handleLogin}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-blue-50">
      <Header onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <FetchForm
          fetchParams={fetchParams}
          isLoading={isLoading}
          onFetchParamsChange={setFetchParams}
          onFetch={fetchPayloadData}
        />

        {payloadData && <PayloadDisplay payloadData={payloadData} />}

        {!payloadData && !isLoading && (
          <EmptyState
            title="No data loaded"
            message="Enter domain and version parameters above to fetch payload data"
          />
        )}
      </div>
    </div>
  );
};

export default DBBackOffice;

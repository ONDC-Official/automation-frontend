import { ToastContainer } from "react-toastify";
import "./App.css";
import TopBar from "./components/top-bar";
import Modal from "./components/modal";
import { useEffect, useState } from "react";
import Support from "./components/support";
import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/home";
import NotFoundPage from "./components/ui/not-found";
import SchemaValidation from "./components/schema-validation";
import ApiTesting from "./components/api-testing";
import ComingSoonPage from "./components/ui/coming-soon";
import FlowContent from "./components/flow-testing/flow-page";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    try {
      JSON.parse(localStorage.getItem("sessionIdForSupport") as string);
    } catch (e) {
      localStorage.removeItem("sessionIdForSupport");
    }
  }, []);

  return (
    <>
      <TopBar onSupportClick={() => setIsModalOpen(true)} />
      <div className="pt-20 h-full">
        <Routes>
          <Route path="/home" element={<HomePage />} />
          <Route path="/schema" element={<SchemaValidation />} />
          <Route path="/unit" element={<ApiTesting />} />
          <Route path="/scenario" element={<FlowContent />} />
          <Route path="/customFlow" element={<ComingSoonPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <Support />
      </Modal>
      <ToastContainer
        position="bottom-right"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="colored"
      />
    </>
  );
}

export default App;

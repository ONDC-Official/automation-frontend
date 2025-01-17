import { ToastContainer } from "react-toastify";
import "./App.css";
import MainContent from "./components/main-content";
import TopBar from "./components/top-bar";
import Modal from "./components/modal";
import { useState } from "react";

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const sessionIdForSupport = localStorage.getItem("sessionIdForSupport");

  return (
    <>
      <TopBar onSupportClick={() => setIsModalOpen(true)} />
      <main className=" pt-16 h-full flex">
        <MainContent />
      </main>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="flex flex-col gap-2">
          <h1 className="text-lg font-semibold text-gray-800">Instruction</h1>
          <p className="text-sm text-gray-600">
            "Contact tectsupport@ondc.org for any Issues Reporting / Support."
          </p>
          {sessionIdForSupport && (
            <div>
              <p className="text-sm text-gray-600">{`Mention below session Id in the email for reference and quick resolution:`}</p>
              <p className="text-sm text-gray-600">
                <b>{sessionIdForSupport}</b>
              </p>
            </div>
          )}
        </div>
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

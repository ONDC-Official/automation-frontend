import { ToastContainer } from "react-toastify";
import "./App.css";
import MainContent from "./components/main-content";
import TopBar from "./components/top-bar";
import Modal from "./components/modal";
import { useEffect, useState } from "react";
import Support from "./components/support";

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
      <main className=" pt-16 h-full flex">
        <MainContent />
      </main>
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

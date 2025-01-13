import { ToastContainer } from "react-toastify";
import "./App.css";
import MainContent from "./components/main-content";
import TopBar from "./components/top-bar";
import Modal from "./components/modal";
import { useState } from "react";

const SupportInstruction = [
  "1. Lorem ipsum, dolor sit amet consectetur adipisicing elit. Facilis, dolorum assumenda exercitationem beatae molestiae quae",
  "2. debitis est accusamus labore unde atque, quo deserunt velit numquam, eligendi autem a at? Modi.",
];

function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <TopBar onSupportClick={() => setIsModalOpen(true)} />
      <main className=" pt-16 h-full flex">
        <MainContent />
      </main>
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div>
          <h1 className="text-lg font-semibold text-gray-800">Instruction</h1>
          {SupportInstruction?.map((item: string) => (
            <p className="text-sm text-gray-600">{item}</p>
          ))}
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

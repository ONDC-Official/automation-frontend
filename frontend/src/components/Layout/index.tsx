import { FC, useState } from "react";
import { ToastContainer } from "react-toastify";

import Header from "@components/Header";
import Footer from "@components/Footer";
import Routes from "@components/Routes";
import Modal from "@components/modal";
import Support from "@components/Support";

const Layout: FC = () => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);

  const handleSupportClick = () => {
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <Header onSupportClick={handleSupportClick} />

      {/* Body */}
      <div className="pt-[72px] flex-1">
        <Routes />
      </div>

      {/* Footer */}
      <Footer />

      {isModalOpen && (
        <Modal isOpen={isModalOpen} onClose={handleModalClose}>
          <Support />
        </Modal>
      )}

      <ToastContainer
        position="bottom-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss={false}
        draggable
        pauseOnHover={false}
        theme="colored"
      />
    </div>
  );
};

export default Layout;

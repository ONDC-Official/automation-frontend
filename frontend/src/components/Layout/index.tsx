import { ToastContainer } from "react-toastify";

import Header from "@components/Header";
import Footer from "@components/Footer";
import Routes from "@components/Routes";

const Layout = () => (
    <div className="flex min-h-svh flex-col bg-surface-page text-text-primary">
        <Header />

        <div className="flex min-h-0 flex-1 flex-col bg-surface-page pt-16">
            <Routes />
        </div>

        <Footer />

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

export default Layout;

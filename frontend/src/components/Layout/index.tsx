import { Toaster } from "@/components/Shadcn/Toaster";
import Header from "@components/Header";
import Footer from "@components/Footer";
import Routes from "@components/Routes";

const isDev = import.meta.env.VITE_ENVIRONMENT === "development";

const Layout = () => (
    <div className="flex min-h-svh flex-col bg-surface-page text-text-primary">
        <Header />

        <div
            className={`flex min-h-0 flex-1 flex-col bg-surface-page ${isDev ? "pt-24" : "pt-16"}`}
        >
            <Routes />
        </div>

        <Footer />

        <Toaster />
    </div>
);

export default Layout;

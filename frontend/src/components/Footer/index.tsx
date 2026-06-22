import { FooterBottomBar } from "@/components/Footer/FooterBottomBar";
import { FooterBrand } from "@/components/Footer/FooterBrand";
import { FooterNav } from "@/components/Footer/FooterNav";

const Footer = () => (
    <footer className="text-n-0 mt-auto bg-brand-section">
        <div className="mx-auto py-12 px-20">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-10 w-full">
                <FooterBrand />
                <FooterNav />
            </div>
            <FooterBottomBar />
        </div>
    </footer>
);

export default Footer;

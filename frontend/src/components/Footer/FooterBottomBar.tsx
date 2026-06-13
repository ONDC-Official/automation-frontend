import { FooterSocialLinks } from "@/components/Footer/FooterSocialLinks";

export const FooterBottomBar = () => (
    <>
        <div className="my-8 border-t border-n-600/60" />
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
            <p className="text-n-60 text-body-2">© 2024 Open Network for Digital Commerce (ONDC)</p>
            <FooterSocialLinks />
        </div>
    </>
);

import { FC } from "react";
import SectionLabel from "@/components/SectionLabel";
import SupportCardsGrid from "@/pages/home/SupportCardsGrid";
import SupportInfoGrid from "@/pages/home/SupportInfoGrid";

const SupportSection: FC = () => (
    <section className="bg-surface-page py-16 lg:py-20">
        <div className="mx-auto px-20">
            <SectionLabel label="// SUPPORT" />
            <h2 className="text-h3 lg:text-h3 font-bold text-n-800 dark:text-n-0 mb-3">
                Need help? We&apos;ve got you.
            </h2>
            <p className="text-body-2 text-n-300 dark:text-n-60 mb-10 max-w-2xl">
                Multiple channels to unblock you — from quick docs lookups to direct integration
                team support.
            </p>

            <SupportCardsGrid />
            <SupportInfoGrid />
        </div>
    </section>
);

export default SupportSection;

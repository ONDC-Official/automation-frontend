import { FC } from "react";
import SectionEyebrow from "@components/SectionEyebrow";
import { supportChannelCards } from "@pages/support/constants";
import SupportChannelCard from "@/pages/support/SupportCard";

const SupportChannelsSection: FC = () => (
    <section className="bg-n-10 py-16 lg:py-20 dark:bg-surface-page">
        <div className="max-w-7xl mx-auto px-15 lg:px-0">
            <SectionEyebrow label="// SUPPORT CHANNELS" />
            <h2 className="text-h3 font-bold text-n-800 dark:text-n-0 mb-3">
                Choose how you want help.
            </h2>
            <p className="text-body-2 text-n-300 dark:text-n-60 mb-10 max-w-2xl">
                Three dedicated support channels — from open community sessions to private
                escalations.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {supportChannelCards.map((card) => (
                    <SupportChannelCard key={card.key} card={card} />
                ))}
            </div>
        </div>
    </section>
);

export default SupportChannelsSection;

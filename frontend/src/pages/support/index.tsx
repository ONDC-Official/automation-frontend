import { FC } from "react";

import SupportChannelsSection from "@pages/support/SupportChannelsSection";
import SupportHero from "@pages/support/SupportHero";
import SupportHowItWorksSection from "@pages/support/SupportHowItWorksSection";
import SupportInfoBar from "@pages/support/SupportInfoBar";
import HeroSection from "@/components/HeroLayout";

const SupportPage: FC = () => (
    <>
        <HeroSection>
            <SupportHero />
        </HeroSection>
        <SupportChannelsSection />
        <SupportHowItWorksSection />
        <SupportInfoBar />
    </>
);

export default SupportPage;

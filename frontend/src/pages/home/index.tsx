import { FC } from "react";
import HeroSection from "@/components/HeroLayout";
import StatLayout from "@/components/StatLayout";
import IntialStepsSection from "@/pages/home/InitialStepsSection";
import PickYourPath from "@pages/home/PickYourPath";
import SupportSection from "@pages/home/SupportSection";
import HeroInfo from "@pages/home/HeroInfo";
import { usageSectionContent } from "@pages/home/constants";

const HomePage: FC = () => (
    <>
        <HeroSection>
            <HeroInfo />
        </HeroSection>
        <IntialStepsSection />
        <PickYourPath />
        <StatLayout {...usageSectionContent} />
        <SupportSection />
    </>
);

export default HomePage;

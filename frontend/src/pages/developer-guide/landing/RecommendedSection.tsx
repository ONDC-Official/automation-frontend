import { FC } from "react";
import FeatureCard from "./FeatureCard";
import { recommendedCards, RECOMMENDED_CARD_IDS } from "./recommendedCards";
import type { RecommendedSectionProps } from "./types";

const RecommendedSection: FC<RecommendedSectionProps> = ({
    onGettingStartedClick,
    onAuthToolsClick,
}) => {
    const getClickHandler = (cardId: string) => {
        if (cardId === RECOMMENDED_CARD_IDS.GETTING_STARTED) return onGettingStartedClick;
        if (cardId === RECOMMENDED_CARD_IDS.AUTH_TOOLS) return onAuthToolsClick;
        return () => {};
    };

    return (
        <section>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {recommendedCards.map((card) => (
                    <FeatureCard
                        key={card.id}
                        title={card.title}
                        subtitle={card.subtitle}
                        description={card.description}
                        icon={card.icon}
                        onClick={getClickHandler(card.id)}
                    />
                ))}
            </div>
        </section>
    );
};

export default RecommendedSection;

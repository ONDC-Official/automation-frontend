import { FC } from "react";
import { supportCards } from "@/pages/home/constants";
import SupportCard from "@/pages/home/SupportCard";

const SupportCardsGrid: FC = () => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6 items-stretch">
        {supportCards.map((card) => (
            <SupportCard key={card.title} card={card} />
        ))}
    </div>
);

export default SupportCardsGrid;

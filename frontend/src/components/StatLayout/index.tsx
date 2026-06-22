import { FC } from "react";
import SectionLabel from "@/components/SectionLabel";
import { IStatLayoutProps } from "@/components/StatLayout/types";

const StatLayout: FC<IStatLayoutProps> = ({ label, title, description, stats }) => (
    <section className="text-n-0 py-16 lg:py-20 bg-brand-section">
        <div className="mx-auto px-20">
            <div className="mb-10 lg:mb-12">
                <SectionLabel label={label} className="text-brand-light" />
                <h2 className="text-h3 lg:text-h3 font-bold text-n-0 mb-3">{title}</h2>
                <p className="text-body-2 text-n-100 max-w-xl">{description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
                {stats.map((stat) => (
                    <div key={stat.title} className="min-w-0">
                        <p className="text-h2 lg:text-h1 font-bold text-n-0 mb-3">{stat.value}</p>
                        <p className="text-body-2 text-brand-light mb-1">{stat.title}</p>
                        <p className="text-caption-1 text-n-80">{stat.subtitle}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

export default StatLayout;

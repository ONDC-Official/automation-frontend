import { FC } from "react";
import { supportInfoItems } from "@constants/support";

const SupportInfoBar: FC = () => (
    <section className="bg-n-0 pb-16 lg:pb-20 dark:bg-surface-page">
        <div className="mx-auto px-20">
            <div className="border-t border-n-30 pt-10 dark:border-n-600">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-10">
                    {supportInfoItems.map((item) => (
                        <div key={item.label}>
                            <p className="text-caption-1 font-semibold uppercase tracking-wider text-brand-normal mb-3">
                                {item.label}
                            </p>
                            <p className="text-body-1 font-semibold text-n-800 dark:text-n-0 mb-2">
                                {item.title}
                            </p>
                            <p className="text-caption-1 text-n-300 dark:text-n-60">
                                {item.subtitle}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </section>
);

export default SupportInfoBar;

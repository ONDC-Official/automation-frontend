import { FC } from "react";

const SupportHero: FC = () => (
    <section className="bg-n-0 dark:bg-surface-page lg:pt-12 lg:pb-20">
        <div className="max-w-7xl mx-auto">
            <div>
                <h1 className="text-h3 lg:text-h2 font-semibold text-n-800 dark:text-n-0 mb-3">
                    We&apos;re here to <span className="text-brand-normal">help.</span>
                </h1>
                <p className="text-h4 font-regular text-n-800 dark:text-n-20 mb-3">
                    Validate, Debug, Deploy
                </p>
                <p className="text-body-1 text-n-300 dark:text-n-60 max-w-lg">
                    Get the support you need join community calls, book a 1-on-1 session with our
                    integration team, or raise a ticket for tracked resolution.
                </p>
            </div>
        </div>
    </section>
);

export default SupportHero;

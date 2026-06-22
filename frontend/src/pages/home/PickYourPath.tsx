import { FC } from "react";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/Shadcn/Card/card";
import SectionLabel from "@/components/SectionLabel";
import { pathCards } from "@/pages/home/constants";
import PathCardLinks from "@/pages/home/PathCardLinks";

const PickYourPath: FC = () => (
    <section className="bg-surface-page py-16 lg:py-20">
        <div className="mx-auto px-20">
            <SectionLabel label="// GET STARTED" />
            <h2 className="text-h3 lg:text-h3 font-bold text-n-800 dark:text-n-0 mb-3">
                Pick your path.
            </h2>
            <p className="text-body-2 text-n-300 dark:text-n-60 mb-10 max-w-2xl">
                Whether you&apos;re discovering ONDC for the first time or ready to certify,
                here&apos;s where to begin.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
                {pathCards.map((card) => (
                    <Card key={card.label} variant="interactive" className="h-full">
                        <p className="text-brand-normal text-caption-1 font-semibold mb-4">
                            {card.label}
                        </p>
                        <CardHeader className="gap-0 p-0">
                            <CardTitle className="text-h5 mb-2">{card.title}</CardTitle>
                            <p className="text-body-2 font-medium text-n-800 dark:text-n-20 mb-3">
                                {card.subtitle}
                            </p>
                        </CardHeader>
                        <CardContent className="pb-2 border-b border-n-30 dark:border-border-default">
                            <CardDescription>{card.description}</CardDescription>
                        </CardContent>
                        <CardFooter className="mt-6 pt-6 flex-col items-stretch p-0">
                            <PathCardLinks links={card.links} />
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </div>
    </section>
);

export default PickYourPath;

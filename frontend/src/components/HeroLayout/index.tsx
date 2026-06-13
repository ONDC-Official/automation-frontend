import Terminal from "@/assets/svgs/Terminal";

const HeroLayout = ({ children }: { children: React.ReactNode }) => (
    <section className="bg-surface-page">
        <div className="max-w-7xl mx-auto px-15 xl:px-0 pt-10 xl:pt-0 lg:pb-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center sm:justify-between">
                {children}
                <div className="flex justify-center lg:justify-end md:pt-12">
                    <Terminal className="w-full max-w-[520px] h-full max-h-[350px]" />
                </div>
            </div>
        </div>
    </section>
);

export default HeroLayout;

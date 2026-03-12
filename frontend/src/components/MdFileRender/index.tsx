import { FC } from "react";
import Markdown from "react-markdown";

interface MdFileRenderProps {
    title: string;
    description?: string;
    mdData: string;
}

const MdFileRender: FC<MdFileRenderProps> = ({ title, description, mdData }) => {
    return (
        <section className="bg-white rounded-2xl border border-sky-100 shadow-sm overflow-hidden">
            <div className="px-6 md:px-8 pt-6 pb-4 border-b border-sky-50 bg-gradient-to-r from-sky-50 to-sky-100/40">
                <h1 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-sky-600 via-sky-500 to-sky-600 bg-clip-text text-transparent tracking-tight">
                    {title}
                </h1>
                {description && (
                    <p className="mt-2 text-gray-700 text-sm md:text-base max-w-3xl">
                        {description}
                    </p>
                )}
            </div>
            <div className="px-6 md:px-8 py-5 bg-gradient-to-b from-white to-sky-50/40">
                <div className="prose prose-slate max-w-none text-sm md:text-base">
                    <Markdown>{mdData}</Markdown>
                </div>
            </div>
        </section>
    );
};

export default MdFileRender;

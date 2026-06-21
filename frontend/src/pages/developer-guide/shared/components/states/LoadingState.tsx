import { type FC } from "react";
import Spinner from "@/components/Shadcn/Spinner";

const LoadingState: FC = () => (
    <div className="mb-3 flex h-full shrink-0 items-center justify-center rounded-xl bg-slate-100 px-3 py-2 text-sm text-slate-600">
        <Spinner className="size-6 text-brand-normal" />
    </div>
);

export default LoadingState;

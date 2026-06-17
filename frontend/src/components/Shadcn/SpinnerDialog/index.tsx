import Spinner from "@/components/Shadcn/Spinner";

const SpinnerDialog = () => (
    <div className="fixed inset-0 z-60 flex h-svh w-svw items-center justify-center bg-neutral-900/40 backdrop-blur-xs">
        <Spinner className="size-8 text-brand-normal" />
    </div>
);

export default SpinnerDialog;

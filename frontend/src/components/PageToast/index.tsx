import { useEffect } from "react";
import { toast } from "sonner";
import { IPageToastProps } from "@/components/PageToast/types";
import { InformationCircleIcon } from "@heroicons/react/24/outline";

export const PageToast = ({ message, options }: IPageToastProps) => {
    useEffect(() => {
        let id: string | number | undefined;

        const timeoutId = setTimeout(() => {
            id = toast(message, {
                duration: Infinity,
                closeButton: true,
                position: "top-right",
                icon: <InformationCircleIcon className="size-5 text-brand-normal" />,
                ...options,
            });
        }, 0);

        return () => {
            clearTimeout(timeoutId);
            if (id !== undefined) toast.dismiss(id);
        };
    }, [message]);

    return null;
};

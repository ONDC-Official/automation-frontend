import { toast } from "sonner";
import type { IAxiosBaseQueryError } from "@store/api/shared/axiosBaseQuery";

const extractErrorMessage = (err: unknown): string => {
    const queryError = (err as { error?: IAxiosBaseQueryError })?.error;

    return queryError?.message ?? "Something went wrong";
};

export const notifyOnError = async (
    _arg: unknown,
    { queryFulfilled }: { queryFulfilled: Promise<unknown> }
) => {
    try {
        await queryFulfilled;
    } catch (err) {
        toast.error(extractErrorMessage(err));
    }
};

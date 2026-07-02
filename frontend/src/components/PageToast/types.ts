import { ExternalToast } from "sonner";

export interface IPageToastProps {
    message: string;
    options?: Omit<ExternalToast, "description">;
}

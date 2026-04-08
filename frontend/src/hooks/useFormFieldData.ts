import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Domain } from "@/pages/schema-validation/types";
import { DomainVersion } from "@/pages/schema-validation/types";

export type DomainVersionWithUsecase = DomainVersion & {
    usecase: string[];
};

export interface FormData {
    domain: string;
    version: string;
    usecaseId: string;
    subscriberUrl: string;
    npType: string;
    env: string;
}

export interface DynamicList {
    domain: Domain[];
    version: DomainVersionWithUsecase[];
    usecase: string[];
}

export const useFormFieldData = () => {
    const [dynamicList, setDynamicList] = useState<DynamicList>({
        domain: [],
        version: [],
        usecase: [],
    });

    const [dynamicValue, setDyanmicValue] = useState<FormData>({
        domain: "",
        version: "",
        usecaseId: "",
        subscriberUrl: "",
        npType: "BAP",
        env: "PRE-PRODUCTION",
    });

    const formData = useRef<FormData>({
        domain: "",
        version: "",
        usecaseId: "",
        subscriberUrl: "",
        npType: "BAP",
        env: "PRE-PRODUCTION",
    });

    const fetchFormFieldData = async () => {
        try {
            const response = await axios.get(
                `${import.meta.env.VITE_BACKEND_URL}/config/senarioFormData`
            );
            setDynamicList((prev) => {
                return { ...prev, domain: response.data.domain || [] };
            });
        } catch (e) {
            console.error("error while fetching form field data", e);
        }
    };

    useEffect(() => {
        fetchFormFieldData();
    }, []);

    return {
        dynamicList,
        setDynamicList,
        dynamicValue,
        setDyanmicValue,
        formData,
    };
};

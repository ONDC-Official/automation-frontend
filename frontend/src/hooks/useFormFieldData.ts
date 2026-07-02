import { useState, useEffect, useRef } from "react";
import { IDomain } from "@/pages/schema-validation/types";
import { IDomainVersion } from "@/pages/schema-validation/types";
import { useGetScenarioFormDataQuery } from "@store/api";

export type IDomainVersionWithUsecase = IDomainVersion & {
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
    domain: IDomain[];
    version: IDomainVersionWithUsecase[];
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

    const { data } = useGetScenarioFormDataQuery();

    useEffect(() => {
        if (!data) return;
        setDynamicList((prev) => ({ ...prev, domain: data.domain || [] }));
    }, [data]);

    return {
        dynamicList,
        setDynamicList,
        dynamicValue,
        setDyanmicValue,
        formData,
    };
};

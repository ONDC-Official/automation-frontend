import { type FC } from "react";
import { FiCode, FiShield, FiUpload, FiDownload } from "react-icons/fi";
import GuideTabs, { type GuideTabItem } from "../shared/components/GuideTabs";
import type { FlowInformationSection } from "./types";

interface DetailTabsHeaderProps {
    activeSection: FlowInformationSection;
    onChange: (section: FlowInformationSection) => void;
    hasExampleObject: boolean;
    hasStep: boolean;
    hasXValidations: boolean;
}

const DetailTabsHeader: FC<DetailTabsHeaderProps> = ({
    activeSection,
    onChange,
    hasExampleObject,
    hasStep,
    hasXValidations,
}) => (
    <GuideTabs<FlowInformationSection>
        active={activeSection}
        onChange={onChange}
        tabs={
            [
                {
                    id: "preview",
                    label: "Example Payload",
                    icon: FiCode,
                    visible: hasExampleObject,
                },
                { id: "request", label: "Request Schema", icon: FiUpload, visible: hasStep },
                {
                    id: "response",
                    label: "Response Schema",
                    icon: FiDownload,
                    visible: hasStep,
                },
                {
                    id: "x-validations",
                    label: "Validations",
                    icon: FiShield,
                    visible: hasXValidations,
                },
            ] satisfies GuideTabItem<FlowInformationSection>[]
        }
    />
);

export default DetailTabsHeader;

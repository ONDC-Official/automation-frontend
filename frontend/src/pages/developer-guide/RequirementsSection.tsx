import { FC } from "react";
import EditorSection from "./EditorSection";
import { decodeBase64 } from "./utils";

/** Decode step mock.requirements (base64). */
export function decodeMockRequirements(requirements: string | undefined): string | null {
    return decodeBase64(requirements);
}

interface RequirementsSectionProps {
    /** Decoded source (from step's mock.requirements base64). */
    decodedCode: string;
}

const RequirementsSection: FC<RequirementsSectionProps> = ({ decodedCode }) => (
    <EditorSection title="Requirements (JavaScript)" decodedCode={decodedCode} />
);

export default RequirementsSection;

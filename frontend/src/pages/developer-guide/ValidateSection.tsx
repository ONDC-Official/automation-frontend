import { FC } from "react";
import EditorSection from "./EditorSection";
import { decodeBase64 } from "./utils";

/** Decode step mock.validate (base64). */
export function decodeMockValidate(validate: string | undefined): string | null {
    return decodeBase64(validate);
}

interface ValidateSectionProps {
    /** Decoded JavaScript source (from step's mock.validate base64). */
    decodedCode: string;
}

const ValidateSection: FC<ValidateSectionProps> = ({ decodedCode }) => (
    <EditorSection title="Validate (JavaScript)" decodedCode={decodedCode} />
);

export default ValidateSection;

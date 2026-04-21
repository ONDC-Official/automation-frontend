import { FC } from "react";
import EditorSection from "./EditorSection";
import { decodeBase64 } from "./utils";

/** Decode step mock.generate (base64). */
export function decodeMockGenerate(generate: string | undefined): string | null {
    return decodeBase64(generate);
}

interface GenerateSectionProps {
    /** Decoded JavaScript source (from step's mock.generate base64). */
    decodedCode: string;
}

const GenerateSection: FC<GenerateSectionProps> = ({ decodedCode }) => (
    <EditorSection title="Generate (JavaScript)" decodedCode={decodedCode} />
);

export default GenerateSection;

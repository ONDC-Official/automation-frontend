import { toast } from "react-toastify";
import { GuideStepsEnums } from "../../context/guideContext";
import { generateKeys } from "../../utils/regsitry-utils";
import GuideOverlay from "../ui/GuideOverlay";

interface DownloadKeysButtonProps {
    onDownload: (signingPublicKey: string, encryptionPublicKey: string) => Promise<void>;
}

export default function DownloadKeysButton({ onDownload }: DownloadKeysButtonProps) {
    const handleDownload = async () => {
        try {
            const keysData = await generateKeys();

            const blob = new Blob([JSON.stringify(keysData, null, 2)], {
                type: "application/json",
            });
            toast.success("Downloading newly generated keys...");

            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "keys.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            await onDownload(keysData.signing_public_key, keysData.encryption_public_key);
        } catch (err) {
            console.error("Download failed:", err);
        }
    };

    return (
        <GuideOverlay
            currentStep={GuideStepsEnums.Reg4}
            left={0}
            top={45}
            instruction=" Step 2(b): Generate Keys"
            handleGoClick={handleDownload}
        >
            <button
                type="button"
                onClick={handleDownload}
                className="px-4 py-2 bg-black text-white hover:bg-slate-700 rounded-md"
            >
                Generate & Download New Keys
            </button>
        </GuideOverlay>
    );
}

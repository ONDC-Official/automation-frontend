import { toast } from "sonner";
import { useLazyGenerateApiKeysQuery } from "@store/api";
import { Button } from "@/components/Shadcn/Button/button";

interface DownloadKeysButtonProps {
    onDownload: (signingPublicKey: string, encryptionPublicKey: string) => Promise<void>;
}

export default function DownloadKeysButton({ onDownload }: DownloadKeysButtonProps) {
    const [triggerGenerateApiKeys] = useLazyGenerateApiKeysQuery();

    const handleDownload = async () => {
        try {
            const keysData = await triggerGenerateApiKeys().unwrap();

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
            toast.error("Failed to generate keys!");
        }
    };

    return (
        <Button
            type="button"
            variant="ghost"
            onClick={handleDownload}
            className="px-4 py-2 bg-black text-white hover:bg-slate-700 rounded-md"
        >
            Generate & Download New Keys
        </Button>
    );
}

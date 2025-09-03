import { toast } from "react-toastify";
import { generateKeys } from "../../utils/regsitry-utils";

export default function DownloadKeysButton({
	onDownload,
}: {
	onDownload: (
		signingPublicKey: string,
		encryptionPublicKey: string
	) => Promise<void>;
}) {
	const handleDownload = async () => {
		try {
			const keysData = await generateKeys();
			console.log("Generated keys:", keysData);
			// Convert to JSON blob
			const blob = new Blob([JSON.stringify(keysData, null, 2)], {
				type: "application/json",
			});
			toast.success("Downloading newly generated keys...");
			// Create a download link
			const url = URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			a.download = "keys.json";
			document.body.appendChild(a);
			a.click();
			// Cleanup
			document.body.removeChild(a);
			URL.revokeObjectURL(url);
			await onDownload(
				keysData.signing_public_key,
				keysData.encryption_public_key
			);
		} catch (err) {
			console.error("Download failed:", err);
		}
	};

	return (
		<button
			type="button"
			onClick={handleDownload}
			className="px-4 py-2 bg-black text-white hover:bg-slate-700 rounded-md"
		>
			Generate & Download New Keys
		</button>
	);
}

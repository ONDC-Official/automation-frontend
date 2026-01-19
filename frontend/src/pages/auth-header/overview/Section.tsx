import { FC } from "react";

const OverviewSection: FC = () => (
    <div className="bg-gradient-to-r from-sky-50 to-blue-50 border border-sky-200 rounded-xl p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-3">ONDC Authorization Header</h2>
        <p className="text-gray-700 leading-relaxed">
            ONDC uses a cryptographic signature scheme to authenticate API requests between network
            participants. The authorization header contains a digital signature created using{" "}
            <strong>BLAKE-512</strong> hashing and <strong>Ed25519</strong> elliptic curve
            signatures.
        </p>
    </div>
);

export default OverviewSection;

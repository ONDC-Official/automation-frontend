import { FC } from "react";

const Header: FC = () => (
    <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Auth Header Generation & Verification
        </h1>
        <p className="text-gray-600">
            Generate and verify ONDC authorization headers using BLAKE-512 hashing and Ed25519
            signatures. View implementation code in Python, Go, Java, Node.js, and PHP.
        </p>
    </header>
);

export default Header;

interface MobileMenuButtonProps {
    isOpen: boolean;
    onToggle: () => void;
}

export const MobileMenuButton = ({ isOpen, onToggle }: MobileMenuButtonProps) => (
    <div className="md:hidden">
        <button
            onClick={onToggle}
            className="text-gray-600 hover:text-sky-600 focus:outline-none focus:ring-2 focus:ring-sky-300 focus:ring-offset-1 rounded-lg p-1 transition-colors duration-200"
            aria-label="Toggle navigation"
        >
            {isOpen ? (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                    />
                </svg>
            ) : (
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 8h16M4 16h16"
                    />
                </svg>
            )}
        </button>
    </div>
);

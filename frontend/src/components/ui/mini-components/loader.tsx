const Loader = () => {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                @keyframes pulse {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 1; }
                }
                .loader-ring {
                    animation: spin 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
                }
                .loader-dot {
                    animation: pulse 1s ease-in-out infinite;
                }
            `}</style>

            <div className="flex flex-col items-center gap-4">
                <div className="relative w-10 h-10">
                    {/* Track */}
                    <div className="absolute inset-0 rounded-full border-2 border-sky-100" />
                    {/* Spinner */}
                    <div
                        className="loader-ring absolute inset-0 rounded-full border-2 border-transparent border-t-sky-500"
                        style={{ boxShadow: "0 0 8px rgba(14,165,233,0.3)" }}
                    />
                </div>

                <div className="flex gap-1">
                    {[0, 0.2, 0.4].map((delay, i) => (
                        <div
                            key={i}
                            className="loader-dot w-1 h-1 rounded-full bg-sky-400"
                            style={{ animationDelay: `${delay}s` }}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default Loader;

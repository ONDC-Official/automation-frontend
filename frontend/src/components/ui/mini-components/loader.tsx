const Loader = () => {
    return (
        <div className="flex items-center justify-center w-full h-full">
            <style>
                {`
                @keyframes dg-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .dg-loader-spin {
                    animation: dg-spin 0.8s linear infinite;
                }
            `}
            </style>
            <div className="relative w-16 h-16">
                {/* Outer Circle */}
                <div className="absolute inset-0 rounded-full border-4 border-sky-300 border-t-sky-500 dg-loader-spin"></div>
            </div>
        </div>
    );
};

export default Loader;

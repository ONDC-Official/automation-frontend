import React from "react";

const ToolsHero: React.FC = () => {
  return (
    <section className="relative h-60 rounded-md flex flex-col justify-center items-center py-6 px-4 bg-gradient-to-r from-blue-900 via-blue-600 to-blue-500 text-white animate-gradient-bg overflow-hidden">
      <div className="absolute inset-0 pointer-events-none grid grid-cols-6 gap-2">
        {[...Array(30)].map((_, index) => (
          <div
            key={index}
            className={`absolute  bg-blue-300 opacity-20 rounded-full h-${
              4 + (index % 3) * 2
            } w-${4 + (index % 3) * 2} animate-bounce-fast`}
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDuration: `${1 + Math.random() * 2}s`,
            }}
          ></div>
        ))}
      </div>

      <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-center leading-tight font-poppins">
        ONDC Integration, Simplified!
      </h3>
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 text-center leading-tight font-poppins">
        Register, Verify, Create Payload
      </p>
      <p className="text-base sm:text-lg mb-6 text-center max-w-xl font-roboto">
        Your all-in-one toolkit for seamless ONDC integration. From seller
        onboarding to payload creation, get ONDC-ready quicker!
      </p>
    </section>
  );
};

export default ToolsHero;

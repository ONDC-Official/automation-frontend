import { FC } from "react";
import AnimatedCircles from "@components/AnimatedCircles";

const Banner: FC = () => (
  <section className="relative h-60 rounded-md flex flex-col justify-center items-center py-6 px-4 bg-gradient-to-r from-sky-900 via-sky-700 to-sky-600 text-white animate-gradient-bg overflow-hidden">
    {/* Enhanced Moving Background Circles */}
    <AnimatedCircles />

    {/* Content */}
    <div className="relative z-10 flex flex-col items-center">
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 text-center leading-tight font-poppins">
        ONDC Integration, Simplified!
      </h1>
      <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-4 text-center leading-tight font-poppins">
        Validate, Debug, Deploy
      </p>
      <p className="text-base sm:text-lg mb-6 text-center max-w-xl font-roboto">
        Your all-in-one toolkit for seamless ONDC integration. From schema validations to testing full flows, get
        ONDC-ready quicker!
      </p>
    </div>
  </section>
);

export default Banner;

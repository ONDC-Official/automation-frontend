import React from "react";


import Footer from "../components/home-page/Footer";
import Features from "../components/home-page/Features";
import Hero from "../components/home-page/Hero";
import Work from "../components/home-page/works";
export default function HomePage(){
  return (
    <div>
      <Hero />
      <Features />
      <Work />
      <Footer />
    </div>
  );
};



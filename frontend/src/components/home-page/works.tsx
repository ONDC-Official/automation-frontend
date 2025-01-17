import React, { useState } from "react";

export default function Work() {
  const [showFlowChallenges, setShowFlowChallenges] = useState(false);

  const handleScrollToSection = (sectionId : any) => {
    const section = document.getElementById(sectionId);
    if (section) {
    //   section.style.opacity = 0;
      section.style.transition = "opacity 1s ease-in-out";
      window.scrollTo({
        top: section.offsetTop,
        behavior: "smooth",
      });
      setTimeout(() => {
        // section.style.opacity = 1;
      }, 300); // Start fade-in after scroll begins
    }
  };

  const handleShowFlowChallenges = () => {
    setShowFlowChallenges(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-sky-100">
      <main className="py-12">
        {/* Introduction Section */}
        <section className="container mx-auto text-center px-6 py-16 bg-gradient-to-r from-blue-500 to-blue-700 rounded-xl shadow-lg relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-600 opacity-50"></div>
          <h2 className="text-5xl font-extrabold text-white relative z-10 mb-6">
            Automation Tools
          </h2>
          <p className="text-lg text-white relative z-10 mb-8 opacity-90">
            Streamline your processes with cutting-edge solutions. From integration to reporting, let automation handle the heavy lifting.
          </p>
          <button
            onClick={() => handleScrollToSection("automation")}
            className="relative z-10 px-8 py-3 bg-orange-500 text-white text-lg rounded-full shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-105"
          >
            Explore Features
          </button>
        </section>

        {/* Automation Steps Section */}
        <section
          id="automation"
          className="py-16 bg-gradient-to-l from-blue-100 via-sky-200 to-blue-100"
        >
          <div className="container mx-auto px-6">
            <h3 className="text-4xl font-bold text-sky-700 text-center mb-12">
              Automation Tool Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
              {/* Feature Cards */}
              {[
                {
                  title: "Schema Validation",
                  description: [
                    "Identify your JSON schema errors",
                    "Ensure correct attributes, enums, and tags",
                  ],
                  id: "schema",
                },
                {
                  title: "Unit API Testing",
                  description: [
                    "Quickly test your API endpoints",
                    "Receive async responses for your requests",
                  ],
                  id: "unit",
                },
                {
                  title: "Flow Challenges",
                  description: [
                    "Run baseline flows required for your domain",
                    "Get instant feedback on each of your requests",
                  ],
                  id: "flow-challenges",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="relative bg-white p-8 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-300 transform hover:scale-105 group"
                >
                  <h4 className="text-2xl font-bold text-sky-700 mb-4">
                    {feature.title}
                  </h4>
                  <ul className="text-sky-600 space-y-2 mb-6 list-disc pl-5">
                    {feature.description.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => handleScrollToSection(feature.id)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 px-6 py-2 bg-orange-500 text-white rounded-full hover:bg-orange-600 transform group-hover:translate-y-2"
                  >
                    Learn More
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
  
        {/* Schema Validation */}
        <section
          id="schema"
          className="py-20 px-6 bg-sky-100 border-t-4 border-sky-500"
        >
          <div className="container mx-auto">
            <h3 className="text-4xl font-bold text-gray-800 text-center mb-10">
              Schema Validation
            </h3>
            <p className="text-gray- 700   bg-gray-100leading-relaxed text-lg mb-8">
            Schema validation refers to the process of ensuring that the data exchanged between systems 
            adheres to a predefined structure or format as specified by a schema. In the context of ONDC
            (Open Network for Digital Commerce) and the provided URL, schema validation likely ensures that all data transmitted through APIs in ONDC's development automation adheres to the rules set out in the schema definitions.
            </p>
            {/* <h4 className="text-2xl font-semibold text-gray-800 mb-6">
              Common Flow Challenges:
            </h4>
            <ul className="list-disc list-inside space-y-4 text-gray-700 text-lg">
              <li>
                <strong>Baseline Test Flows:</strong> The ONDC integration test
                bench verifies baseline scenarios and flows required to enable
                operations on the network.
              </li>
              <li>
                <strong>Simulation of ONDC Network:</strong> The platform
                emulates the ONDC network, allowing testing of complex scenarios
                and business cases across APIs.
              </li>
              <li>
                <strong>Multi-Protocol Support:</strong> Tests integration
                across live ONDC protocols, including retail, mobility,
                logistics, and financial services.
              </li>
              <li>
                <strong>Real-time Feedback:</strong> Receive instant test
                results, identifying errors and areas for improvement.
              </li>
            </ul> */}
            

            <button
              onClick={handleShowFlowChallenges}
              className="mt-8 px-8 py-3 bg-orange-500 text-white text-lg rounded-full shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-105"
            >
              Let's Start
            </button>
          </div>
        </section>

        {/* Unit api testing */}
        <section
          id="unit"
          className="py-20 px-6 bg-sky-100 border-t-4 border-sky-500"
        >
          <div className="container mx-auto">
            <h3 className="text-4xl font-bold text-gray-800 text-center mb-10">
              Unit Api Testing
            </h3>
            <p className="text-gray- 700   bg-gray-100leading-relaxed text-lg mb-8">
            Unit testing focuses on testing individual components or functions of the ONDC ecosystem in isolation. This page might provide tools, guidelines, and automation support for developers to ensure their implementations adhere to the ONDC standards.
            </p>
            <h4 className="text-2xl font-semibold text-gray-800 mb-6">
              Common Flow Challenges:
            </h4>
            <ul className="list-disc list-inside space-y-4 text-gray-700 text-lg">
              <li>
                <strong>Baseline Test Flows:</strong> The ONDC integration test
                bench verifies baseline scenarios and flows required to enable
                operations on the network.
              </li>
              <li>
                <strong>Simulation of ONDC Network:</strong> The platform
                emulates the ONDC network, allowing testing of complex scenarios
                and business cases across APIs.
              </li>
              <li>
                <strong>Multi-Protocol Support:</strong> Tests integration
                across live ONDC protocols, including retail, mobility,
                logistics, and financial services.
              </li>
              <li>
                <strong>Real-time Feedback:</strong> Receive instant test
                results, identifying errors and areas for improvement.
              </li>
            </ul>
            

            <button
              onClick={handleShowFlowChallenges}
              className="mt-8 px-8 py-3 bg-orange-500 text-white text-lg rounded-full shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-105"
            >
              Let's Start
            </button>
          </div>
        </section>

        {/* Flow Challenges Section */}
        <section
          id="flow-challenges"
          className="py-20 px-6 bg-sky-100 border-t-4 border-sky-500"
        >
          <div className="container mx-auto">
            <h3 className="text-4xl font-bold text-gray-800 text-center mb-10">
              Flow Challenges
            </h3>
            <p className="text-gray-700 leading-relaxed text-lg mb-8">
              Flow Challenges refer to obstacles faced during the design,
              testing, and validation of seamless workflows in the ONDC
              ecosystem. These challenges arise from the intricacies of
              integrating multiple buyer and seller systems while ensuring
              compliance and consistency.
            </p>
            <h4 className="text-1xl font-semibold text-gray-800 mb-6">
              Common Flow Challenges:
            </h4>
            <ul className="list-disc list-inside space-y-4 text-gray-700 text-lg">
              <li>
                <strong>Baseline Test Flows:</strong> The ONDC integration test
                bench verifies baseline scenarios and flows required to enable
                operations on the network.
              </li>
              <li>
                <strong>Simulation of ONDC Network:</strong> The platform
                emulates the ONDC network, allowing testing of complex scenarios
                and business cases across APIs.
              </li>
              <li>
                <strong>Multi-Protocol Support:</strong> Tests integration
                across live ONDC protocols, including retail, mobility,
                logistics, and financial services.
              </li>
              <li>
                <strong>Real-time Feedback:</strong> Receive instant test
                results, identifying errors and areas for improvement.
              </li>
            </ul>
            <p className="text-gray-700 leading-relaxed text-lg mt-10">
              By utilizing these automation flows, developers can streamline
              their integration processes, reduce errors, and ensure their
              applications operate effectively within the ONDC framework.
            </p>

            <button
              onClick={handleShowFlowChallenges}
              className="mt-8 px-8 py-3 bg-orange-500 text-white text-lg rounded-full shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-105"
            >
              Let's Start
            </button>
          </div>
        </section>


    
      </main>
    </div>
  );
}

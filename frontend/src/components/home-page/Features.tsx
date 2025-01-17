import React from "react";
import { FaCheckCircle, FaLock, FaThumbsUp, FaCogs } from "react-icons/fa";

interface Feature {
  title: string;
  description: string;
  icon: JSX.Element;
}

const features: Feature[] = [
  { title: "BECKN VALIDATION", description: "Schema validation.", icon: <FaCheckCircle className="text-green-500 text-4xl" /> },
  { title: "DIY Development", description: "Target the flow challenges.", icon: <FaLock className="text-blue-500 text-4xl" /> },
  { title: "User-Friendly", description: "Report generation.", icon: <FaThumbsUp className="text-yellow-500 text-4xl" /> },
  { title: "Streamline ONDC Development", description: "Custom flow workbench.", icon: <FaCogs className="text-purple-500 text-4xl" /> },
];

const Features: React.FC = () => {
  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 py-16 px-8">
      <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-12">
        🚀 Our Features
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {features.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-1 p-6 text-center"
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-3">
              {feature.title}
            </h3>
            <p className="text-gray-600 leading-relaxed">{feature.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;

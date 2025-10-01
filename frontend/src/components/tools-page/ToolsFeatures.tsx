import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserPlus, FaBookOpen } from "react-icons/fa";

interface ToolFeature {
  title: string;
  subtitle: string;
  description: string;
  path: string;
  icon: JSX.Element;
  isAvailable: boolean;
}

const toolFeatures: ToolFeature[] = [
  {
    title: "Seller Onboarding",
    subtitle: "Quick & Easy Seller Registration",
    description:
      "Streamline the seller onboarding process with our comprehensive registration flow. Manage store details, serviceability areas, and product catalogs effortlessly.",
    path: "/seller-onboarding",
    icon: <FaUserPlus className="text-green-500 text-4xl" />,
    isAvailable: true,
  },
  {
    title: "Quick Start Guide",
    subtitle: "Step-by-Step Setup",
    description:
      "Get started quickly with essential setup steps. Follow this guide to configure your account, explore key APIs, and test your first integration with ease.",
    path: "/walkthrough",
    icon: <FaBookOpen className="text-blue-500 text-4xl" />, 
    isAvailable: true,
  },
];

const ToolsFeatures: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 py-10 px-8">
      <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-12">
        Our Tools
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {toolFeatures.map((feature, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-transform transform hover:-translate-y-1 p-6 text-center cursor-pointer"
            onClick={() => {
              navigate(feature.path);
            }}
          >
            <div className="mb-4">{feature.icon}</div>
            <h3 className="text-2xl font-semibold text-gray-700 mb-3">
              {feature.title}
            </h3>
            <h3 className="text-md font-semibold text-gray-700 mb-3">
              {feature.subtitle}
            </h3>
            <p className="text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ToolsFeatures;

import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUserPlus, FaKey } from "react-icons/fa";
import { ROUTES } from "@constants/routes";

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
    path: ROUTES.SELLER_ONBOARDING,
    icon: <FaUserPlus className="text-sky-600 text-4xl" />,
    isAvailable: true,
  },
  {
    title: "Auth Header Tool",
    subtitle: "Generate & Verify ONDC Headers",
    description:
      "Generate and verify authorization headers using BLAKE-512 hashing and Ed25519 signatures. View implementation code in Python, Go, Java, Node.js, and PHP.",
    path: ROUTES.AUTH_HEADER,
    icon: <FaKey className="text-sky-600 text-4xl" />,
    isAvailable: true,
  },
];

const ToolsFeatures: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-b from-gray-50 to-white min-h-screen">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {toolFeatures.map((feature, index) => (
            <div
              key={index}
              className="group bg-white border border-sky-100 rounded-2xl hover:border-sky-300 hover:shadow-xl hover:shadow-sky-100/50 transition-all duration-300 cursor-pointer p-8 relative overflow-hidden"
              onClick={() => {
                navigate(feature.path);
              }}>
              <div className="absolute inset-0 bg-gradient-to-r from-sky-50/0 to-sky-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-start space-x-5">
                <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-sky-50 to-sky-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  {feature.icon}
                </div>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2 group-hover:text-sky-900 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sky-600 font-semibold mb-3">{feature.subtitle}</p>
                  <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ToolsFeatures;

import React from "react";
import { useNavigate } from "react-router-dom";
import { TbTestPipe2Filled } from "react-icons/tb";
import { GoWorkflow } from "react-icons/go";
// import { PiNetwork } from "react-icons/pi";
import { MdSchema } from "react-icons/md";

interface Feature {
  title: string;
  description: string;
  path: string;
  icon: JSX.Element;
}

const features: Feature[] = [
  {
    title: "Schema Validation",
    description: "Schema validation.",
    path: "/schema",
    icon: <MdSchema className="text-green-500 text-4xl" />,
  },
  {
    title: "Unit Testing",
    description: "Target the flow challenges.",
    path: "/unit",
    icon: <TbTestPipe2Filled className="text-blue-500 text-4xl" />,
  },
  {
    title: "Scenario Testing",
    description: "Report generation.",
    path: "/scenario",
    icon: <GoWorkflow className="text-yellow-500 text-4xl" />,
  },
  // {
  //   title: "Custom Flow Workbench",
  //   description: "Custom flow workbench.",
  //   path: "/customFlow",
  //   icon: <PiNetwork className="text-purple-500 text-4xl" />,
  // },
];

const Features: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-br from-gray-100 to-gray-200 py-10 px-8">
      <h2 className="text-4xl font-extrabold text-center text-gray-800 mb-12">
        🚀 Our Features
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, index) => (
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
            <p className="text-gray-600 leading-relaxed">
              {feature.description}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Features;

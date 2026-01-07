import { FC, Fragment } from "react";
import { FaArrowRight } from "react-icons/fa";
import { ProcessFlowSectionProps } from "@pages/auth-header/overview/types";

const ProcessFlowSection: FC<ProcessFlowSectionProps> = ({ title, steps }) => (
  <div className="bg-white border border-gray-200 rounded-xl p-6">
    <h3 className="text-xl font-bold text-gray-900 mb-4">{title}</h3>
    <div className="flex flex-wrap items-center justify-center gap-3 text-sm">
      {steps.map((step, index) => (
        <Fragment key={index}>
          <div className={`${step.bgColor} ${step.textColor} px-4 py-2 rounded-lg font-medium`}>{step.label}</div>
          {index < steps.length - 1 && <FaArrowRight className="text-gray-400" />}
        </Fragment>
      ))}
    </div>
  </div>
);

export default ProcessFlowSection;

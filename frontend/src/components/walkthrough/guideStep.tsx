// Guide.tsx
import { Step } from "./apiMethod";

type GuideProps = {
  steps: Step[];
};

const Guide = ({ steps }: GuideProps) => {
  return (
    <div className="space-y-6">
      {steps.map((step, index) => (
        <div
          key={index}
          className="rounded-2xl border border-gray-200 shadow-sm bg-white"
        >
          <div className="p-6 space-y-4">
            {step?.title && (
              <h2 className="text-xl font-semibold">{step.title}</h2>
            )}
            <pre
              className="text-gray-700 whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: step.description }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Guide;

import { FC } from "react";

interface EmptyStateProps {
  title: string;
  message: string;
}

const EmptyState: FC<EmptyStateProps> = ({ title, message }) => (
  <div className="col-span-full mt-8">
    <div className="bg-white border-2 border-dashed border-sky-200 rounded-2xl p-12 text-center">
      <div className="w-16 h-16 bg-gradient-to-br from-sky-100 to-sky-200 rounded-2xl flex items-center justify-center mx-auto mb-6">
        <svg className="w-8 h-8 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={1.5}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
          />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
      <p className="text-gray-600">{message}</p>
    </div>
  </div>
);

export default EmptyState;

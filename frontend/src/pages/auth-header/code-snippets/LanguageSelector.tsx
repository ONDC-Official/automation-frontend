import { FC } from "react";
import { codeSnippets } from "@pages/auth-header/code-snippets/data";
import { LanguageSelectorProps } from "@pages/auth-header/code-snippets/types";

const LanguageSelector: FC<LanguageSelectorProps> = ({ languages, selectedLang, onLanguageChange }) => (
  <div className="flex flex-wrap gap-2">
    {languages.map(lang => (
      <button
        key={lang}
        onClick={() => onLanguageChange(lang)}
        className={`px-4 py-2 rounded-lg font-medium transition-all ${
          selectedLang === lang ? "bg-sky-600 text-white shadow-md" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
        }`}
        aria-pressed={selectedLang === lang}
        aria-label={`Select ${codeSnippets[lang].label} language`}>
        {codeSnippets[lang].label}
      </button>
    ))}
  </div>
);

export default LanguageSelector;

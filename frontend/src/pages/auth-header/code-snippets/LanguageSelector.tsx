import { FC } from "react";
import { codeSnippets } from "@pages/auth-header/code-snippets/data";
import { LanguageSelectorProps } from "@pages/auth-header/code-snippets/types";

const LanguageSelector: FC<LanguageSelectorProps> = ({
    languages,
    selectedLang,
    onLanguageChange,
}) => (
    <div className="flex flex-wrap gap-2">
        {languages.map((lang) => (
            <button
                key={lang}
                type="button"
                onClick={() => onLanguageChange(lang)}
                className={`rounded-lg px-4 py-2 font-medium transition-all ${
                    selectedLang === lang
                        ? "bg-brand-normal text-n-0 shadow-md"
                        : "bg-n-20 text-n-300 hover:bg-n-30 dark:bg-surface-muted dark:text-n-60 dark:hover:bg-surface-elevated"
                }`}
                aria-pressed={selectedLang === lang}
                aria-label={`Select ${codeSnippets[lang].label} language`}
            >
                {codeSnippets[lang].label}
            </button>
        ))}
    </div>
);

export default LanguageSelector;

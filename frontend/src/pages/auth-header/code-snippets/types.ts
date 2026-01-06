import { codeSnippets } from "@pages/auth-header/code-snippets/data";

export type LanguageKey = keyof typeof codeSnippets;
export type FunctionType = "generate" | "verify";

export type CodeEditorProps = {
  code: string;
  language: string;
  selectedLang: LanguageKey;
  functionType: FunctionType;
  copied: boolean;
  onCopy: () => void;
};

export type FunctionToggleProps = {
  functionType: FunctionType;
  onFunctionTypeChange: (type: FunctionType) => void;
};

export type LanguageSelectorProps = {
  languages: LanguageKey[];
  selectedLang: LanguageKey;
  onLanguageChange: (lang: LanguageKey) => void;
};

/**
 * CSS styles for Schema Validation page
 *
 * Contains animations and custom scrollbar styles
 */

/**
 * CSS string containing all styles for the schema validation page
 */
export const schemaValidationStyles = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @keyframes slideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
  
  .animate-fadeIn {
    animation: fadeIn 0.5s ease-out;
  }
  
  .animate-slideIn {
    animation: slideIn 0.6s ease-out;
  }
  
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: #0ea5e9 #e2e8f0;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 4px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: linear-gradient(to bottom, #0ea5e9, #0284c7);
    border-radius: 4px;
    transition: background 0.2s;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: linear-gradient(to bottom, #0284c7, #0369a1);
  }

  .monaco-editor .scroll-decoration {
    box-shadow: none !important;
  }
`;

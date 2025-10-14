import React, { useState } from "react";
import { SelectedType } from "./session-data-tab"; // import the enum
import { JsonNode } from "./types"; // if you have a shared type file

const renderValue = (
  value: any,
  path: string,
  key: string,
  isSelected: (path: string) => { status: boolean; type: SelectedType | null },
  handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void
) => {
  const isPrimitive =
    typeof value !== "object" || value === null || value === undefined;
  const selected = isSelected(path);

  if (!isPrimitive) return null;

  let className = "cursor-pointer px-2 py-0.5 rounded transition-colors ";

  if (selected.status) {
    if (selected.type === SelectedType.SavedInfo) {
      className += "bg-gray-500/30 text-gray-200 font-semibold";
    } else if (selected.type === SelectedType.SaveData) {
      className += "bg-sky-500/30 text-sky-300 font-semibold";
    }
  } else {
    className += "hover:bg-sky-500/10";
  }

  return (
    <span onClick={(e) => handleKeyClick(path, key, e)} className={className}>
      {JSON.stringify(value)}
    </span>
  );
};

const renderJson = ({
  obj,
  currentPath = "$",
  level = 0,
  collapsedPaths,
  setCollapsedPaths,
  isSelected,
  handleKeyClick,
}: {
  obj: JsonNode;
  currentPath?: string;
  level?: number;
  collapsedPaths: Record<string, boolean>;
  setCollapsedPaths: React.Dispatch<
    React.SetStateAction<Record<string, boolean>>
  >;
  isSelected: (path: string) => { status: boolean; type: SelectedType | null };
  handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void;
}): JSX.Element => {
  const indent = level * 24;

  const toggleCollapse = (path: string) => {
    setCollapsedPaths((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  return (
    <div>
      {Object.entries(obj).map(([key, value]) => {
        const newPath = `${currentPath}.${key}`;
        const isObject =
          typeof value === "object" && value !== null && !Array.isArray(value);
        const isArray = Array.isArray(value);
        const isKeySelected = isSelected(newPath);
        const isCollapsed = collapsedPaths[newPath];

        return (
          <div key={key} style={{ marginLeft: `${indent}px` }}>
            <div className="flex items-start py-1">
              {(isObject || isArray) && (
                <button
                  onClick={() => toggleCollapse(newPath)}
                  className="text-gray-400 mr-1 select-none"
                >
                  {isCollapsed ? "▶" : "▼"}
                </button>
              )}

              <span
                onClick={(e) => handleKeyClick(newPath, key, e)}
                className={`font-mono select-none transition-colors ${
                  isObject || isArray ? "cursor-pointer" : "cursor-default"
                } ${
                  isKeySelected.status
                    ? isKeySelected.type === SelectedType.SaveData
                      ? "bg-sky-500/30 text-sky-300 font-semibold px-2 py-0.5 rounded"
                      : "bg-gray-500/30 text-gray-200 px-2 py-0.5 font-semibold"
                    : isObject || isArray
                      ? "text-sky-400 hover:bg-sky-500/10 px-2 py-0.5 rounded"
                      : "text-sky-400"
                }`}
              >
                "{key}":
              </span>

              <span className="ml-2">
                {isObject && (
                  <span className="text-gray-400 font-mono">{"{"}</span>
                )}
                {isArray && (
                  <span className="text-gray-400 font-mono">{"["}</span>
                )}
                {!isObject &&
                  !isArray &&
                  renderValue(value, newPath, key, isSelected, handleKeyClick)}
              </span>
            </div>

            {!isCollapsed && (
              <>
                {isObject && (
                  <>
                    {renderJson({
                      obj: value,
                      currentPath: newPath,
                      level: level + 1,
                      collapsedPaths,
                      setCollapsedPaths,
                      isSelected,
                      handleKeyClick,
                    })}
                    <div
                      style={{ marginLeft: `${indent}px` }}
                      className="text-gray-400 font-mono"
                    >
                      {"}"}
                    </div>
                  </>
                )}

                {isArray && (
                  <>
                    {value.map((item: any, index: number) => {
                      const arrayPath = `${newPath}[${index}]`;
                      if (typeof item === "object" && item !== null) {
                        return (
                          <div key={index}>
                            {renderJson({
                              obj: item,
                              currentPath: arrayPath,
                              level: level + 1,
                              collapsedPaths,
                              setCollapsedPaths,
                              isSelected,
                              handleKeyClick,
                            })}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={index}
                          style={{ marginLeft: `${(level + 1) * 24}px` }}
                        >
                          {renderValue(
                            item,
                            arrayPath,
                            `${key}_${index}`,
                            isSelected,
                            handleKeyClick
                          )}
                        </div>
                      );
                    })}
                    <div
                      style={{ marginLeft: `${indent}px` }}
                      className="text-gray-400 font-mono"
                    >
                      {"]"}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
    </div>
  );
};

interface JsonViewerProps {
  data: JsonNode;
  isSelected: (path: string) => { status: boolean; type: SelectedType | null };
  handleKeyClick: (path: string, key: string, e: React.MouseEvent) => void;
}

const JsonViewer: React.FC<JsonViewerProps> = ({
  data,
  isSelected,
  handleKeyClick,
}: JsonViewerProps) => {
  const [collapsedPaths, setCollapsedPaths] = useState<Record<string, boolean>>(
    {}
  );

  return renderJson({
    obj: data,
    collapsedPaths,
    setCollapsedPaths,
    isSelected,
    handleKeyClick,
  });
};

export default JsonViewer;

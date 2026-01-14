const getJsonPath = (jsonText: string, lineNumber: number, column: number): string => {
  const lines = jsonText.split("\n");
  let charCount = 0;

  // Calculate the absolute character position
  for (let i = 0; i < lineNumber - 1; i++) {
    charCount += lines[i].length + 1; // +1 for newline
  }
  charCount += column - 1;

  // Parse JSON and build a map of positions to paths
  const pathMap = buildPathMap(jsonText);

  // Find the closest path for this position
  let closestPath = "$";
  let closestDistance = Infinity;

  for (const [pos, path] of pathMap) {
    const distance = Math.abs(pos - charCount);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestPath = path;
    }
  }

  return closestPath;
};

// Build a map of character positions to JSON paths
const buildPathMap = (jsonText: string): Map<number, string> => {
  const pathMap = new Map<number, string>();

  try {
    const parsed = JSON.parse(jsonText);
    traverse(parsed, "$", jsonText, pathMap);
  } catch (error) {
    console.error("JSON parse error:", error);
  }

  return pathMap;
};

// Traverse JSON and map positions to paths
const traverse = (obj: unknown, path: string, jsonText: string, pathMap: Map<number, string>) => {
  if (obj === null || obj === undefined) return;

  if (typeof obj === "object" && !Array.isArray(obj)) {
    // Handle objects
    for (const key in obj) {
      const newPath = `${path}.${key}`;

      // Find position of this key in the JSON text
      const keyPattern = new RegExp(`"${key}"\\s*:`, "g");
      let match;
      while ((match = keyPattern.exec(jsonText)) !== null) {
        pathMap.set(match.index, newPath);
      }

      // Recursively traverse
      const objRecord = obj as Record<string, unknown>;
      if (typeof objRecord[key] === "object" && objRecord[key] !== null) {
        traverse(objRecord[key] as Record<string, unknown>, newPath, jsonText, pathMap);
      } else {
        // For primitive values, also map them
        const valueStr = JSON.stringify(objRecord[key]);
        const valuePattern = new RegExp(
          `"${key}"\\s*:\\s*${valueStr.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`,
          "g"
        );
        let valueMatch;
        while ((valueMatch = valuePattern.exec(jsonText)) !== null) {
          pathMap.set(valueMatch.index + valueMatch[0].length - valueStr.length, newPath);
        }
      }
    }
  } else if (Array.isArray(obj)) {
    // Handle arrays
    obj.forEach((item, index) => {
      const newPath = `${path}[${index}]`;
      traverse(item, newPath, jsonText, pathMap);
    });
  }
};

export const editorUtils = {
  getJsonPath,
};

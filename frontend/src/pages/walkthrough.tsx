import { useState, useRef, useEffect, useMemo } from "react";
import AsyncApi from "../components/walkthrough/asyncApi";
import ApiMethod from "../components/walkthrough/apiMethod";

/**
 * Sidebar structure - keep 'component' as a React component (function) or component reference
 */
const sidebarData = [
  {
    heading: "Overview",
    items: [
      {
        id: "ondc",
        label: "What is ONDC",
        component: () => <>What is ondc?</>,
      },
    ],
  },
  {
    heading: "Sync API",
    items: [
      { id: "sync-get", label: "GET", component: ApiMethod },
      { id: "sync-post", label: "POST", component: ApiMethod },
    ],
  },
  {
    heading: "Async API",
    items: [{ id: "async-post", label: "POST", component: AsyncApi }],
  },
];

// Flattened list of items in display order (used for navigation)
const flatItems = sidebarData.flatMap((s) => s.items);

const Walkthrough = () => {
  const [activeIndex, setActiveIndex] = useState(0); // numeric index into flatItems
  const mainContentRef = useRef<HTMLDivElement>(null);

  // Resolve component for current index and render it as <CurrentComponent />
  const CurrentComponent = flatItems[activeIndex]?.component ?? (() => <></>);

  const goNext = () => {
    if (activeIndex < flatItems.length - 1) {
      setActiveIndex((i) => i + 1);
    }
  };

  const goPrev = () => {
    if (activeIndex > 0) {
      setActiveIndex((i) => i - 1);
    }
  };

  // scroll main content to top when activeIndex changes
  useEffect(() => {
    if (mainContentRef.current) {
      mainContentRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [activeIndex]);

  return (
    <div className="flex w-full h-screen">
      <Sidebar activeIndex={activeIndex} setActiveIndex={setActiveIndex} />

      {/* Main Content */}
      <main ref={mainContentRef} className="flex-1 flex flex-col">
        <div className="flex-1 my-6 px-6 overflow-hidden">
          <h1 className="text-sm font-bold px-4">
            {flatItems[activeIndex]?.label}
          </h1>
          <CurrentComponent />
        </div>

        {/* Navigation buttons */}
        <div className="flex justify-between p-6 border-t bg-white">
          <button
            onClick={goPrev}
            disabled={activeIndex === 0}
            className={`px-4 py-2 rounded-md border ${
              activeIndex === 0
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            ← Previous
          </button>
          <button
            onClick={goNext}
            disabled={activeIndex === flatItems.length - 1}
            className={`px-4 py-2 rounded-md border ${
              activeIndex === flatItems.length - 1
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-white hover:bg-gray-100"
            }`}
          >
            Next →
          </button>
        </div>
      </main>
    </div>
  );
};

/**
 * Sidebar:
 * - builds a stable mapping from a generated key `${sectionIndex}-${itemIndex}` -> global index
 * - uses that mapping for setActiveIndex and active checks (so collapsing/expanding doesn't change indices)
 * - initially opens Overview and auto-opens the section containing activeIndex
 */
const Sidebar = ({ activeIndex, setActiveIndex }: any) => {
  // open Overview initially
  const [openSections, setOpenSections] = useState<string[]>(["Overview"]);

  const toggleSection = (heading: string) => {
    setOpenSections((prev) =>
      prev.includes(heading) ? prev.filter((h) => h !== heading) : [...prev, heading]
    );
  };

  // stable mapping: key "sectionIndex-itemIndex" => global index (0..N-1)
  const indexByKey = useMemo(() => {
    const map: Record<string, number> = {};
    let idx = 0;
    sidebarData.forEach((section, sIdx) => {
      section.items.forEach((_item, iIdx) => {
        const key = `${sIdx}-${iIdx}`;
        map[key] = idx++;
      });
    });
    return map;
  }, []);

  // reverse mapping: global index -> section heading (used to auto-open the section containing activeIndex)
  const sectionByIndex = useMemo(() => {
    const map: Record<number, string> = {};
    let idx = 0;
    sidebarData.forEach((section) => {
      section.items.forEach(() => {
        map[idx++] = section.heading;
      });
    });
    return map;
  }, []);

  // Ensure the section containing activeIndex is open (auto-expand)
  useEffect(() => {
    const heading = sectionByIndex[activeIndex];
    if (heading && !openSections.includes(heading)) {
      setOpenSections((prev) => [...prev, heading]);
    }
  }, [activeIndex, sectionByIndex, openSections]);

  return (
    <aside className="w-64 border-r border-gray-200 bg-gray-50 p-4 overflow-y-auto">
      <nav className="space-y-2">
        {sidebarData.map((section, sIdx) => (
          <div key={section.heading}>
            {/* Heading */}
            <button
              onClick={() => toggleSection(section.heading)}
              className="w-full text-sm text-left px-3 py-2 font-semibold text-gray-800 hover:bg-gray-200 rounded-md"
            >
              {section.heading}
            </button>

            {/* Subheadings (indented) */}
            {openSections.includes(section.heading) && (
              <div className="ml-4 mt-1 space-y-1">
                {section.items.map((item, iIdx) => {
                  const key = `${sIdx}-${iIdx}`;
                  const globalIndex = indexByKey[key];

                  return (
                    <button
                      key={key}
                      onClick={() => setActiveIndex(globalIndex)}
                      className={`block text-sm w-full text-left px-3 py-2 rounded-md transition ${
                        activeIndex === globalIndex
                          ? "text-blue-700 font-bold"
                          : "text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </nav>
    </aside>
  );
};

export default Walkthrough;

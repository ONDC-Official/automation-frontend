import { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";
import { FaRegPaste } from "react-icons/fa6";
import { inputClass } from "@utils/input-class";
import { LabelWithToolTip } from "@components/Input";
import { getItemsAndCustomistions } from "@utils/generic-utils";
import PayloadEditor from "@components/PayloadEditor";

interface SelectedItem {
  id: string;
  customisations: string[];
  relation: Record<string, string>;
  lastCustomisation?: string[];
}

interface ItemCustomisationSelectorProps {
  name: string;
  label: string;
  setValue: (name: string, value: SelectedItem[]) => void;
}

type PastePayload = {
  message?: {
    catalog?: {
      "bpp/providers"?: Array<{
        categories?: Array<{
          id: string;
          tags: Array<{ code: string; list: Array<{ code: string; value: string }> }>;
        }>;
        items?: Array<{
          id: string;
          tags: Array<{ code: string; list: Array<{ code: string; value: string }> }>;
        }>;
      }>;
    };
  };
  context?: { domain?: string };
};

const ItemCustomisationSelector = ({ name, label, setValue }: ItemCustomisationSelectorProps) => {
  const [items, setItems] = useState<SelectedItem[]>([
    { id: "", customisations: [], relation: {} },
  ]);
  const [catalogData, setCatalogData] = useState<PastePayload | null>(null);
  const [errroWhilePaste, setErrroWhilePaste] = useState("");
  const [itemsList, setItemsList] = useState<Record<string, string>>({});
  const [categoryList, setCategoryList] = useState<
    Record<string, { items: Record<string, { child: string[] }> }>
  >({});
  const [groupMapping, setGroupMapping] = useState<Record<string, string>>({});
  const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);

  useEffect(() => {
    setValue(name, items);
  }, [items, name, setValue]);

  const handleItemChange = (index: number, value: string) => {
    const updated = [...items];
    updated[index] = { id: value, customisations: [], relation: {} };
    setItems(updated);
  };

  const handleCustomisationChange = (index: number, value: string, group?: string) => {
    if (!items[index].customisations.includes(value)) {
      const updated = [...items];
      updated[index].relation[`${value}`] = groupMapping[value];
      updated[index].customisations.push(value);
      if (group) {
        updated[index].lastCustomisation = categoryList[group].items[value].child;
      }
      setItems(updated);
    }
  };

  const addItem = () => {
    setItems((prev) => [...prev, { id: "", customisations: [], relation: {} }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = async (parsedText: PastePayload) => {
    setIsPayloadEditorActive(false);

    try {
      if (!parsedText?.context?.domain) {
        throw new Error("Domain not present");
      }

      if (!parsedText?.message?.catalog?.["bpp/providers"]) {
        throw new Error("Providers not presnt");
      }

      setCatalogData(parsedText);
      const response = getItemsAndCustomistions(parsedText);
      setItemsList(response?.itemList || {});
      setCategoryList(
        (response?.catagoriesList as Record<
          string,
          { items: Record<string, { child: string[] }> }
        >) || {}
      );
      setGroupMapping(response?.cutomistionToGroupMapping || {});
    } catch (err: unknown) {
      const errorMessage =
        err && typeof err === "object" && "message" in err && typeof err.message === "string"
          ? err.message
          : "Something went wrong";
      setErrroWhilePaste(errorMessage);
      console.error("Error while handling paste: ", err);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {isPayloadEditorActive && (
        <PayloadEditor
          mode="modal"
          onAdd={handlePaste as (parsedPayload: unknown) => Promise<void>}
        />
      )}
      <div className="flex flex-direction-row gap-4">
        <LabelWithToolTip labelInfo="" label={label} />
        <>
          {errroWhilePaste && (
            <p className="text-red-500 text-sm italic mt-1 w-full">{errroWhilePaste}</p>
          )}
          <button
            type="button"
            onClick={() => setIsPayloadEditorActive(true)}
            className="p-2 border rounded-full hover:bg-gray-100"
          >
            <FaRegPaste size={14} />
          </button>
        </>

        {catalogData !== null && (
          <button
            type="button"
            onClick={addItem}
            className="p-2 border rounded-full hover:bg-gray-100"
          >
            <FaPlus size={14} />
          </button>
        )}
      </div>

      {catalogData ? (
        <>
          {items.map((item: SelectedItem, index: number) => {
            let availableCustomisations: string[] = [];

            if (item?.id) {
              let customisationsObj: Record<string, { child: string[] }> = {};

              if (item?.lastCustomisation && Array.isArray(item.lastCustomisation)) {
                item.lastCustomisation.forEach((lastCustom: string) => {
                  customisationsObj = {
                    ...customisationsObj,
                    ...categoryList[lastCustom]?.items,
                  };
                });
              } else {
                customisationsObj =
                  (categoryList[itemsList[`${item?.id}`]]?.items as Record<
                    string,
                    { child: string[] }
                  >) || {};
              }

              const cutomistions = Object.entries(
                (customisationsObj as Record<string, { child: string[] }>) || {}
              ).map((item) => {
                const [key, _] = item;
                return key;
              });

              availableCustomisations = cutomistions;
            }

            return (
              <div key={index} className="relative border p-4 rounded bg-white shadow space-y-4">
                {index !== 0 && (
                  <div className="absolute top-[-10px] right-[-10px] bg-white">
                    <button
                      onClick={() => removeItem(index)}
                      className=" p-2 border rounded-full hover:bg-gray-100"
                    >
                      <FaMinus size={14} />
                    </button>
                  </div>
                )}

                <LabelWithToolTip labelInfo="" label={"Item"} />

                <select
                  className={inputClass}
                  value={item.id}
                  onChange={(e) => handleItemChange(index, e.target.value)}
                >
                  <option value="">Select Item</option>
                  {Object.entries(itemsList).map((key, index) => {
                    const [item, _] = key;
                    return (
                      <option key={index} value={item}>
                        {item}
                      </option>
                    );
                  })}
                </select>

                {/* Customisation Selector */}
                {item.id && (
                  <>
                    <LabelWithToolTip labelInfo="" label={"Customisation"} />
                    <div className="flex gap-2 ">
                      <select
                        className={inputClass}
                        value=""
                        onChange={(e) =>
                          handleCustomisationChange(
                            index,
                            e.target.value,
                            groupMapping[e.target.value] || itemsList[`${item?.id}`]
                          )
                        }
                      >
                        <option value="">Select Customisation</option>
                        {availableCustomisations.map((c: string) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {item.customisations.map((c: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm"
                        >
                          {c}
                        </span>
                      ))}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </>
      ) : (
        <div className="flex items-start gap-3 border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
          <p className="text-sm text-blue-800 flex items-center gap-1">
            Paste <strong>on_search</strong> payload using the button
            <span className="p-2 border rounded-full hover:bg-gray-100">
              <FaRegPaste size={14} />
            </span>
            to select items
          </p>
        </div>
      )}
    </div>
  );
};

export default ItemCustomisationSelector;

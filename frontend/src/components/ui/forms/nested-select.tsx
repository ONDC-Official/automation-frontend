import React, { useEffect, useState } from "react";
import { FaPlus } from "react-icons/fa6";
import { FaMinus } from "react-icons/fa6";
import { FaRegPaste } from "react-icons/fa6";
import Editor from "@monaco-editor/react";
import { inputClass } from "./inputClass";
import { LabelWithToolTip } from "./form-input";
import { getItemsAndCustomistions } from "../../../utils/generic-utils";
import PayloadEditor from "../mini-components/payload-editor";

interface Item {
  id: string;
  name: string;
  customisations: string[];
}

interface SelectedItem {
  id: string;
  customisations: string[];
  lastCustomisation?: string;
}

const ITEMS: Item[] = [
  { id: "I1", name: "I1", customisations: ["C1", "C2", "C3"] },
  { id: "I2", name: "I2", customisations: ["C6", "C7"] },
];

const ItemCustomisationSelector: React.FC = ({
  register,
  name,
  label,
  setValue,
}: any) => {
  const [items, setItems] = useState<SelectedItem[]>([
    { id: "", customisations: [] },
  ]);
  const [catalogData, setCatalogData] = useState(null);
  const [cutomisationValue, setCustomisationValue] = useState("");
  const [errroWhilePaste, setErrroWhilePaste] = useState("");
  const [itemsList, setItemsList] = useState({});
  const [categoryList, setCategoryList] = useState({});
  const [isPayloadEditorActive, setIsPayloadEditorActive] = useState(false);

  useEffect(() => {
    setValue(name, items);
  }, [items]);

  const handleItemChange = (index: number, value: string) => {
    const updated = [...items];
    console.log("udpated: ", updated);
    updated[index] = { id: value, customisations: [] };
    setItems(updated);
  };

  const handleCustomisationChange = (
    index: number,
    value: string,
    group: string
  ) => {
    // const itemData = ITEMS.find((i) => i.id === items[index].id);
    // if (!itemData || !itemData.customisations.includes(value)) return;

    if (!items[index].customisations.includes(value)) {
      const updated = [...items];
      updated[index].customisations.push(value);
      if (group) {
        updated[index].lastCustomisation =
          categoryList[group].items[value].child;
      }
      setItems(updated);
    }
  };

  const addItem = () => {
    console.log("Why working");
    setItems((prev) => [...prev, { id: "", customisations: [] }]);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePaste = async (parsedText: any) => {
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
      setCategoryList(response?.catagoriesList || {});
    } catch (err: any) {
      setErrroWhilePaste(err.message || "Something went wrong");
      console.error("Error while handling paste: ", err);
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto space-y-4">
      {isPayloadEditorActive && <PayloadEditor onAdd={handlePaste} />}
      <div className="flex flex-direction-row gap-4">
        <LabelWithToolTip labelInfo="" label={"Items"} />
        <>
          {errroWhilePaste && (
            <p className="text-red-500 text-sm italic mt-1 w-full">
              {errroWhilePaste}
            </p>
          )}
          <button
            type="button"
            onClick={() => setIsPayloadEditorActive(true)}
            className="p-2 border rounded-full hover:bg-gray-100"
          >
            <FaRegPaste size={14} />
          </button>
        </>

        <button
          type="button"
          onClick={addItem}
          className="p-2 border rounded-full hover:bg-gray-100"
        >
          <FaPlus size={14} />
        </button>
      </div>

      {items.map((item, index) => {
        let availableCustomisations =
          ITEMS.find((i) => i.id === item.id)?.customisations || [];

        if (item?.id) {
          console.log(
            ":::::",

            categoryList[itemsList[`${item?.id}`]]?.items
          );
          const cutomistions = Object.entries(
            categoryList[item?.lastCustomisation || itemsList[`${item?.id}`]]
              ?.items || {}
          ).map((item) => {
            console.log("iten", item);
            const [key, _] = item;
            return key;
          });

          availableCustomisations = cutomistions;
          console.log(">>>>>", cutomistions);
        }

        return (
          <div
            key={index}
            className="relative border p-4 rounded bg-white shadow space-y-4"
          >
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

            {/* Item Selector */}
            <LabelWithToolTip labelInfo="" label={"Item"} />
            {catalogData ? (
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
            ) : (
              <input
                // onFocus={handleFocus}
                // {...register(name)}
                // disabled={disable}
                id={name}
                // type={type}
                className={inputClass}
                placeholder="Type here..."
                onChange={(e) => handleItemChange(index, e.target.value)}
                // onKeyDown={(e) => {
                //   e.stopPropagation();
                // }}
              />
            )}

            {/* Customisation Selector */}
            {item.id && (
              <>
                <LabelWithToolTip labelInfo="" label={"Customisation"} />
                <div className="flex gap-2 ">
                  {catalogData ? (
                    <select
                      className={inputClass}
                      value=""
                      onChange={(e) =>
                        handleCustomisationChange(
                          index,
                          e.target.value,
                          item?.lastCustomisation || itemsList[`${item?.id}`]
                        )
                      }
                    >
                      <option value="">Select Customisation</option>
                      {availableCustomisations.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      // onFocus={handleFocus}
                      // {...register(name)}
                      // disabled={disable}
                      id={name}
                      value={cutomisationValue}
                      className={inputClass}
                      placeholder="Type here..."
                      onChange={(e) => setCustomisationValue(e.target.value)}
                      onKeyDown={(e) => {
                        e.stopPropagation();
                      }}
                      onKeyPress={(event) => {
                        event.stopPropagation();
                        if (event.key === "Enter") {
                          event.preventDefault();
                          setCustomisationValue("");
                          handleCustomisationChange(index, event.target.value);
                        }
                      }}
                    />
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {item.customisations.map((c, i) => (
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
    </div>
  );
};

export default ItemCustomisationSelector;

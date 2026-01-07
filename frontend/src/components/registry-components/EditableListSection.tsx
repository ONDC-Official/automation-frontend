import React, { useState } from "react";

const GlobeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-6 w-6 text-gray-500"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2h10a2 2 0 002-2v-1a2 2 0 012-2h1.945M7.707 4.5l.053-.053a.5.5 0 01.707 0l1.414 1.414a.5.5 0 010 .707l-.053.053a.5.5 0 01-.707 0l-1.414-1.414a.5.5 0 010-.707zM11 21h2v-2h-2v2z"
    />
  </svg>
);

const TrashIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={2}
      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
    />
  </svg>
);

interface EditableListSectionProps<T> {
  title: string;
  id: string;
  description: string;
  items: T[];
  newItem: T;
  renderItemSummary: (item: T) => React.ReactNode;
  renderEditForm: (item: T, onFieldChange: (field: keyof T, value: any) => void) => React.ReactNode;
  onAddItem: (item: T) => void;
  onRemoveItem: (index: number) => void;
  onUpdateItem: (index: number, item: T) => void;
}

export function EditableListSection<T extends object>({
  title,
  description,
  items,
  newItem,
  renderItemSummary,
  renderEditForm,
  onAddItem,
  onRemoveItem,
  onUpdateItem,
}: EditableListSectionProps<T>) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [currentItem, setCurrentItem] = useState<T | null>(null);

  const handleEditClick = (index: number) => {
    setEditingIndex(index);
    setCurrentItem({ ...items[index] });
  };

  const handleSaveClick = (index: number) => {
    if (currentItem) {
      onUpdateItem(index, currentItem);
    }
    setEditingIndex(null);
    setCurrentItem(null);
  };

  const handleCancelClick = () => {
    setEditingIndex(null);
    setCurrentItem(null);
  };

  const handleFieldChange = (field: keyof T, value: any) => {
    if (currentItem) {
      setCurrentItem({ ...currentItem, [field]: value });
    }
  };

  const handleAddNew = () => {
    onAddItem(newItem);
    setEditingIndex(items.length);
    setCurrentItem(newItem);
  };

  return (
    <div className="bg-white shadow-sm rounded-xl p-6 sm:p-8">
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
      <p className="mt-1 text-sm text-gray-600">{description}</p>

      {/* Add New Item Bar */}
      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={handleAddNew}
          className="w-full sm:w-auto flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-sky-600 hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500">
          + Add {title.slice(0, -1)}
        </button>
      </div>

      {/* Items List */}
      <div className="mt-4 space-y-3">
        {items.map((item, index) => (
          <div key={index}>
            {editingIndex === index ? (
              // EDITING VIEW
              <div className="bg-gray-50 border rounded-lg p-4">
                <div className="space-y-4">{renderEditForm(currentItem!, handleFieldChange)}</div>
                <div className="mt-4 flex items-center justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleCancelClick}
                    className="text-sm font-medium text-gray-600 hover:text-gray-900">
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveClick(index)}
                    className="px-3 py-1 text-sm font-medium rounded-md text-white bg-sky-600 hover:bg-sky-700">
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              // SUMMARY VIEW
              <div className="flex items-center justify-between bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-4">
                  <GlobeIcon />
                  <span className="font-medium text-gray-800">{renderItemSummary(item)}</span>
                </div>
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleEditClick(index)}
                    className="text-sm font-medium text-sky-600 hover:text-sky-800">
                    Edit
                  </button>
                  <button onClick={() => onRemoveItem(index)} className="text-gray-400 hover:text-red-600">
                    <TrashIcon />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-4">No {title.toLowerCase()} have been added.</p>
        )}
      </div>
    </div>
  );
}

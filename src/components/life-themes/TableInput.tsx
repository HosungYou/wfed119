'use client';

import React from 'react';
import { Plus, Trash2 } from 'lucide-react';

export interface TableColumn {
  key: string;
  label: string;
  labelKo: string;
  type: 'text' | 'textarea';
  placeholder?: string;
  placeholderKo?: string;
  width?: string; // e.g., 'w-1/4', 'w-1/3', 'flex-1'
}

interface TableInputProps<T extends Record<string, string>> {
  columns: TableColumn[];
  data: T[];
  onChange: (data: T[]) => void;
  minRows?: number;
  maxRows?: number;
  language?: 'en' | 'ko';
  addButtonText?: string;
  addButtonTextKo?: string;
  emptyRowTemplate: T;
}

export function TableInput<T extends Record<string, string>>({
  columns,
  data,
  onChange,
  minRows = 1,
  maxRows = 10,
  language = 'en',
  addButtonText = 'Add Row',
  addButtonTextKo = '행 추가',
  emptyRowTemplate,
}: TableInputProps<T>) {
  const getLabel = (col: TableColumn) => language === 'ko' ? col.labelKo : col.label;
  const getPlaceholder = (col: TableColumn) =>
    language === 'ko' ? (col.placeholderKo || col.placeholder || '') : (col.placeholder || '');

  const addRow = () => {
    if (data.length < maxRows) {
      onChange([...data, { ...emptyRowTemplate }]);
    }
  };

  const removeRow = (index: number) => {
    if (data.length > minRows) {
      onChange(data.filter((_, i) => i !== index));
    }
  };

  const updateCell = (rowIndex: number, key: string, value: string) => {
    const newData = [...data];
    newData[rowIndex] = { ...newData[rowIndex], [key]: value };
    onChange(newData);
  };

  return (
    <div className="overflow-x-auto">
      {/* Table Header */}
      <div className="hidden md:flex gap-2 mb-2 px-2">
        {columns.map((col) => (
          <div key={col.key} className={`font-medium text-sm text-gray-700 ${col.width || 'flex-1'}`}>
            {getLabel(col)}
          </div>
        ))}
        <div className="w-10" /> {/* Space for delete button */}
      </div>

      {/* Table Rows */}
      <div className="space-y-3">
        {data.map((row, rowIndex) => (
          <div
            key={rowIndex}
            className="flex flex-col md:flex-row gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200"
          >
            {columns.map((col) => (
              <div key={col.key} className={`${col.width || 'flex-1'}`}>
                {/* Mobile label */}
                <label className="md:hidden block text-xs font-medium text-gray-600 mb-1">
                  {getLabel(col)}
                </label>

                {col.type === 'textarea' ? (
                  <textarea
                    value={row[col.key] || ''}
                    onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                    placeholder={getPlaceholder(col)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 resize-none h-20"
                  />
                ) : (
                  <input
                    type="text"
                    value={row[col.key] || ''}
                    onChange={(e) => updateCell(rowIndex, col.key, e.target.value)}
                    placeholder={getPlaceholder(col)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                )}
              </div>
            ))}

            {/* Delete button */}
            {data.length > minRows && (
              <button
                type="button"
                onClick={() => removeRow(rowIndex)}
                className="self-start md:self-center p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Add Row Button */}
      {data.length < maxRows && (
        <button
          type="button"
          onClick={addRow}
          className="mt-4 w-full p-3 border-2 border-dashed border-primary-300 rounded-xl text-primary-600 hover:bg-primary-50 hover:border-primary-400 flex items-center justify-center gap-2 transition-colors"
        >
          <Plus className="w-5 h-5" />
          {language === 'ko' ? addButtonTextKo : addButtonText}
        </button>
      )}
    </div>
  );
}

export default TableInput;

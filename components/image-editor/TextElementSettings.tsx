'use client'

import React from 'react';
import { useImageEditor } from './ImageEditorContext';
import type { TextElement } from './ImageEditorContext';

export const TextElementSettings: React.FC = () => {
  const {
    selectedElementId,
    textElements,
    updateTextElement
  } = useImageEditor();

  const selectedElement = textElements.find(el => el.id === selectedElementId);

  if (!selectedElement) {
    return null;
  }

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    updateTextElement(selectedElementId!, {
      ...selectedElement,
      text: e.target.value
    });
  };

  const handleFontSizeChange = (size: number) => {
    updateTextElement(selectedElementId!, {
      ...selectedElement,
      size: size
    });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateTextElement(selectedElementId!, {
      ...selectedElement,
      color: e.target.value
    });
  };

  const handleBoldToggle = () => {
    updateTextElement(selectedElementId!, {
      ...selectedElement,
      fontWeight: selectedElement.fontWeight === 'bold' ? 'normal' : 'bold'
    });
  };

  const handleItalicToggle = () => {
    updateTextElement(selectedElementId!, {
      ...selectedElement,
      fontWeight: selectedElement.fontWeight === 'italic' ? 'normal' : 'italic'
    });
  };

  return (
    <div className="mt-3 p-4 border rounded-lg bg-gray-50">
      <h4 className="text-sm font-medium mb-3">文本设置</h4>
      
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">文本内容</label>
        <textarea
          value={selectedElement.text}
          onChange={handleTextChange}
          className="w-full px-2 py-1 text-sm border rounded-md"
          rows={3}
        />
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">字体大小: {selectedElement.size}px</label>
        <div className="flex items-center gap-2">
          <button
            className="px-2 py-1 text-xs border rounded"
            onClick={() => handleFontSizeChange(Math.max(8, selectedElement.size - 2))}
          >
            -2
          </button>
          <input
            type="range"
            min="8"
            max="72"
            value={selectedElement.size}
            onChange={(e) => handleFontSizeChange(parseInt(e.target.value))}
            className="flex-grow h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <button
            className="px-2 py-1 text-xs border rounded"
            onClick={() => handleFontSizeChange(Math.min(72, selectedElement.size + 2))}
          >
            +2
          </button>
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">文本颜色</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={selectedElement.color}
            onChange={handleColorChange}
            className="w-8 h-8 border rounded"
          />
          <input
            type="text"
            value={selectedElement.color}
            onChange={handleColorChange}
            className="px-2 py-1 text-xs border rounded-md flex-grow"
            placeholder="#000000"
          />
        </div>
      </div>

      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">文本样式</label>
        <div className="flex gap-2">
          <button
            className="px-3 py-1 text-xs border rounded-md transition-colors hover:bg-gray-100"
            onClick={handleBoldToggle}
          >
            <b>B</b>
          </button>
          <button
            className="px-3 py-1 text-xs border rounded-md transition-colors hover:bg-gray-100"
            onClick={handleItalicToggle}
          >
            <i>I</i>
          </button>
        </div>
      </div>
    </div>
  );
};

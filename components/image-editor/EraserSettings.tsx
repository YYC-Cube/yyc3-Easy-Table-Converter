'use client'

import React from 'react';
import { useImageEditor } from './ImageEditorContext';

/**
 * @description 橡皮擦工具设置面板
 * @author YYC
 * @created 2024-10-15
 */
export const EraserSettings: React.FC = () => {
  const {
    eraserConfig,
    setEraserConfig
  } = useImageEditor();

  const handleSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSize = parseInt(e.target.value);
    setEraserConfig({ ...eraserConfig, size: newSize });
  };

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(e.target.value);
    setEraserConfig({ ...eraserConfig, opacity: newOpacity });
  };

  const handleShapeChange = (shape: 'round' | 'square') => {
    setEraserConfig({ ...eraserConfig, shape });
  };

  const handleBrushTypeChange = (brushType: 'normal' | 'hard' | 'soft') => {
    setEraserConfig({ ...eraserConfig, brushType });
  };

  return (
    <div className="mt-3 p-4 border rounded-lg bg-gray-50">
      <h4 className="text-sm font-medium mb-3">橡皮擦设置</h4>
      
      {/* 橡皮擦大小 */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <label className="text-xs text-gray-600">大小: {eraserConfig.size}px</label>
        </div>
        <input
          type="range"
          min="5"
          max="100"
          value={eraserConfig.size}
          onChange={handleSizeChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* 不透明度 */}
      <div className="mb-3">
        <div className="flex justify-between mb-1">
          <label className="text-xs text-gray-600">不透明度: {Math.round(eraserConfig.opacity * 100)}%</label>
        </div>
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.1"
          value={eraserConfig.opacity}
          onChange={handleOpacityChange}
          className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
        />
      </div>

      {/* 形状选择 */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">形状</label>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-xs border rounded-md transition-colors ${eraserConfig.shape === 'round' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleShapeChange('round')}
          >
            圆形
          </button>
          <button
            className={`px-3 py-1 text-xs border rounded-md transition-colors ${eraserConfig.shape === 'square' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleShapeChange('square')}
          >
            方形
          </button>
        </div>
      </div>

      {/* 笔形选择 */}
      <div>
        <label className="text-xs text-gray-600 block mb-1">笔形</label>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 text-xs border rounded-md transition-colors ${eraserConfig.brushType === 'normal' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleBrushTypeChange('normal')}
          >
            正常
          </button>
          <button
            className={`px-3 py-1 text-xs border rounded-md transition-colors ${eraserConfig.brushType === 'hard' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleBrushTypeChange('hard')}
          >
            硬边
          </button>
          <button
            className={`px-3 py-1 text-xs border rounded-md transition-colors ${eraserConfig.brushType === 'soft' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleBrushTypeChange('soft')}
          >
            软边
          </button>
        </div>
      </div>
    </div>
  );
};

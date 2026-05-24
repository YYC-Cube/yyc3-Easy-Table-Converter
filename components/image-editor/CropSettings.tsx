'use client'

import React, { useState } from 'react';
import { useImageEditor } from './ImageEditorContext';

/**
 * @description 裁剪工具设置面板
 * @author YYC
 * @created 2024-10-15
 */
export const CropSettings: React.FC = () => {
  const {
    cropShape,
    setCropShape
  } = useImageEditor();

  const handleShapeChange = (shape: 'rectangle' | 'circle' | 'rounded' | 'triangle') => {
    setCropShape(shape);
  };

  const aspectRatios = [
    { label: '自由', value: 'free' },
    { label: '1:1', value: '1:1' },
    { label: '3:2', value: '3:2' },
    { label: '4:3', value: '4:3' },
    { label: '16:9', value: '16:9' },
    { label: '9:16', value: '9:16' },
  ];

  const [selectedRatio, setSelectedRatio] = useState('free');

  const handleRatioChange = (ratio: string) => {
    setSelectedRatio(ratio);
    // 这里可以添加根据比例调整裁剪区域的逻辑
  };

  return (
    <div className="mt-3 p-4 border rounded-lg bg-gray-50">
      <h4 className="text-sm font-medium mb-3">裁剪设置</h4>
      
      {/* 裁剪形状选择 */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">形状</label>
        <div className="flex flex-wrap gap-2">
          <button
            className={`px-3 py-1 text-xs border rounded-md transition-colors ${cropShape === 'rectangle' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleShapeChange('rectangle')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
              <rect width="18" height="10" x="3" y="7" rx="2"></rect>
            </svg>
            矩形
          </button>
          <button
            className={`px-3 py-1 text-xs border rounded-md transition-colors ${cropShape === 'rounded' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleShapeChange('rounded')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
              <rect width="18" height="10" x="3" y="7" rx="4"></rect>
            </svg>
            圆角
          </button>
          <button
            className={`px-3 py-1 text-xs border rounded-md transition-colors ${cropShape === 'circle' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleShapeChange('circle')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            圆形
          </button>
          <button
            className={`px-3 py-1 text-xs border rounded-md transition-colors ${cropShape === 'triangle' ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
            onClick={() => handleShapeChange('triangle')}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline mr-1">
              <polygon points="12 2 2 12 22 12"></polygon>
            </svg>
            三角形
          </button>
        </div>
      </div>

      {/* 宽高比例选择 */}
      <div className="mb-3">
        <label className="text-xs text-gray-600 block mb-1">宽高比例</label>
        <div className="flex flex-wrap gap-2">
          {aspectRatios.map((ratio) => (
            <button
              key={ratio.value}
              className={`px-3 py-1 text-xs border rounded-md transition-colors ${selectedRatio === ratio.value ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
              onClick={() => handleRatioChange(ratio.value)}
            >
              {ratio.label}
            </button>
          ))}
        </div>
      </div>

      {/* 操作提示 */}
      <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded-md">
        <p>💡 在画布上拖动鼠标选择裁剪区域，完成后点击确认裁剪按钮</p>
      </div>
    </div>
  );
};

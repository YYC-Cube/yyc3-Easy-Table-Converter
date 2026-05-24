'use client'

import React, { useState } from 'react';
import { useImageEditor } from './ImageEditorContext';
import { EraserSettings } from './EraserSettings';
import { CropSettings } from './CropSettings';
import { TextElementSettings } from './TextElementSettings';

interface ToolbarProps {
  className?: string;
}

/**
 * @description 图片编辑器工具栏组件
 * @author YYC
 * @created 2024-10-15
 */
export const Toolbar: React.FC<ToolbarProps> = ({ className }) => {
  const {
    // 工具状态
    isWatermarkActive,
    isTextRemovalActive,
    isEraserActive,
    isCropActive,
    isAddTextActive,
    history,
    historyIndex,
    
    // 方法
    resetAllTools,
    setIsWatermarkActive,
    setIsTextRemovalActive,
    setIsEraserActive,
    setIsCropActive,
    setIsAddTextActive,
    undo,
    redo,
    saveToHistory,
    deleteSelectedElement,
    cropRegion,
    ctx,
    canvas
  } = useImageEditor();

  const [showEraserSettings, setShowEraserSettings] = useState(false);
  const [showCropSettings, setShowCropSettings] = useState(false);
  const [showTextSettings, setShowTextSettings] = useState(false);

  // 处理工具切换
  const handleToolToggle = (toolType: string) => {
    resetAllTools();
    
    switch (toolType) {
      case 'watermark':
        setIsWatermarkActive(true);
        break;
      case 'text-removal':
        setIsTextRemovalActive(true);
        break;
      case 'eraser':
        setIsEraserActive(true);
        setShowEraserSettings(true);
        setShowCropSettings(false);
        setShowTextSettings(false);
        break;
      case 'crop':
        setIsCropActive(true);
        setShowCropSettings(true);
        setShowEraserSettings(false);
        setShowTextSettings(false);
        break;
      case 'add-text':
        setIsAddTextActive(true);
        setShowTextSettings(true);
        setShowEraserSettings(false);
        setShowCropSettings(false);
        break;
      default:
        break;
    }
  };

  // 处理裁剪确认
  const handleCropConfirm = () => {
    if (!cropRegion || !ctx || !canvas) return;
    
    try {
      // 确保裁剪区域是有效的
      const x = Math.max(0, Math.min(cropRegion.x, canvas.width));
      const y = Math.max(0, Math.min(cropRegion.y, canvas.height));
      const width = Math.min(Math.abs(cropRegion.width), canvas.width - x);
      const height = Math.min(Math.abs(cropRegion.height), canvas.height - y);
      
      if (width <= 0 || height <= 0) return;
      
      // 获取裁剪区域的图像数据
      const imageData = ctx.getImageData(x, y, width, height);
      
      // 创建新的画布尺寸
      canvas.width = width;
      canvas.height = height;
      
      // 将裁剪的图像数据绘制到新画布
      ctx.putImageData(imageData, 0, 0);
      
      // 保存到历史记录
      saveToHistory();
      
      // 重置裁剪工具
      setIsCropActive(false);
      setShowCropSettings(false);
    } catch (error) {
      console.error('裁剪失败:', error);
    }
  };

  // 处理去水印
  const handleWatermarkRemove = () => {
    // 这里应该调用去水印的AI处理逻辑
    // 暂时使用简单的提示代替
    alert('去水印功能需要AI处理，请上传到服务器进行处理');
    resetAllTools();
  };

  // 处理去文字
  const handleTextRemove = () => {
    // 这里应该调用去文字的AI处理逻辑
    // 暂时使用简单的提示代替
    alert('去文字功能需要AI处理，请上传到服务器进行处理');
    resetAllTools();
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {/* 文件操作按钮 */}
      <div className="flex gap-3">
        <button
          className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
              const target = e.target as HTMLInputElement;
              if (target.files && target.files[0]) {
                const file = target.files[0];
                const reader = new FileReader();
                reader.onload = (e) => {
                  if (e.target?.result) {
                    // 这里应该调用设置图片的方法
                    // 暂时用简单提示
                    alert('文件已选择: ' + file.name);
                  }
                };
                reader.readAsDataURL(file);
              }
            };
            input.click();
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
          </svg>
          上传图片
        </button>
        
        <button
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          onClick={() => {
            if (!canvas) return;
            
            try {
              // 创建下载链接
              const link = document.createElement('a');
              link.download = 'edited-image.png';
              link.href = canvas.toDataURL('image/png');
              link.click();
            } catch (error) {
              console.error('下载失败:', error);
              alert('图片下载失败，请稍后重试');
            }
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          下载图片
        </button>
      </div>
      {/* 工具按钮组 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* 历史操作按钮 */}
        <button
          className="flex flex-col items-center gap-1 p-3 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={undo}
          disabled={historyIndex <= 0}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 7v6h6"/>
            <path d="M21 17a9 9 0 0 0-9-9c-2.52 0-4.93 1-6.74 2.74L3 13"></path>
          </svg>
          <span className="text-xs">撤销</span>
        </button>

        <button
          className="flex flex-col items-center gap-1 p-3 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={redo}
          disabled={historyIndex >= history.length - 1}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 7v6h-6"/>
            <path d="M3 17a9 9 0 0 1 9-9c2.52 0 4.93 1 6.74 2.74L21 7"></path>
          </svg>
          <span className="text-xs">重做</span>
        </button>

        <button
          className="flex flex-col items-center gap-1 p-3 border rounded-lg hover:bg-gray-100 transition-colors disabled:opacity-50"
          onClick={deleteSelectedElement}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18"></path>
            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
          <span className="text-xs">删除元素</span>
        </button>

        <button
          className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors ${isWatermarkActive ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => handleToolToggle('watermark')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2"></rect>
            <line x1="16" y1="16" x2="16" y2="16.01"></line>
            <path d="M9 9h6v6"></path>
          </svg>
          <span className="text-xs">去水印</span>
        </button>

        <button
          className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors ${isTextRemovalActive ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => handleToolToggle('text-removal')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="17 8 12 3 7 8"></polyline>
            <line x1="12" y1="3" x2="12" y2="15"></line>
            <line x1="3" y1="11" x2="10" y2="11"></line>
            <line x1="14" y1="11" x2="21" y2="11"></line>
          </svg>
          <span className="text-xs">去文字</span>
        </button>

        <button
          className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors ${isEraserActive ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => handleToolToggle('eraser')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m7 2 10 10"></path>
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49m-8.48-.01a6 6 0 0 1 0-8.49m11.31-2.82a10 10 0 0 1 0 14.14m-14.14 0a10 10 0 0 1 0-14.14"></path>
          </svg>
          <span className="text-xs">橡皮擦</span>
        </button>

        <button
          className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors ${isCropActive ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => handleToolToggle('crop')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6.5 6.5v11a1 1 0 0 0 1 1h11"></path>
            <path d="M4 13V7a1 1 0 0 1 1-1h6"></path>
            <rect width="8" height="6" x="8" y="10" rx="1"></rect>
          </svg>
          <span className="text-xs">裁剪工具</span>
        </button>

        <button
          className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors ${isAddTextActive ? 'bg-blue-100 text-blue-600 border-blue-300' : 'hover:bg-gray-100'}`}
          onClick={() => handleToolToggle('add-text')}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path>
            <polyline points="14 2 14 8 20 8"></polyline>
            <line x1="16" y1="13" x2="8" y2="13"></line>
            <line x1="16" y1="17" x2="8" y2="17"></line>
            <polyline points="10 9 9 9 8 9"></polyline>
          </svg>
          <span className="text-xs">添加文字</span>
        </button>


      </div>

      {/* 工具设置面板 */}
      {showEraserSettings && <EraserSettings />}
      {showCropSettings && (
        <div className="mt-2">
          <CropSettings />
          <div className="mt-2 flex gap-2 justify-end">
            <button
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              onClick={() => {
                setIsCropActive(false);
                setShowCropSettings(false);
              }}
            >
              取消
            </button>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              onClick={handleCropConfirm}
            >
              确认裁剪
            </button>
          </div>
        </div>
      )}
      {showTextSettings && <TextElementSettings />}
      {/* 图形设置组件待实现 */}

      {/* 功能操作按钮 */}
      {(isWatermarkActive || isTextRemovalActive) && (
        <div className="mt-2 flex gap-2 justify-end">
          <button
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            onClick={resetAllTools}
          >
            取消
          </button>
          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            onClick={isWatermarkActive ? handleWatermarkRemove : handleTextRemove}
          >
            {isWatermarkActive ? '开始去水印' : '开始去文字'}
          </button>
        </div>
      )}
    </div>
  );
};

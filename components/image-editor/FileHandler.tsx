'use client'

import React from 'react';
import { useImageEditor } from './ImageEditorContext';

interface FileHandlerProps {
  className?: string;
}

/**
 * @description 文件处理组件 - 处理图片的上传和下载
 * @author YYC
 * @created 2024-10-15
 */
export const FileHandler: React.FC<FileHandlerProps> = ({ className }) => {
  const { canvas, setSourceFile, setSourcePreview } = useImageEditor();

  // 处理文件上传
  const handleFileUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      if (target.files && target.files[0]) {
        const file = target.files[0];
        setSourceFile(file);
        
        const reader = new FileReader();
        reader.onload = (e) => {
          if (e.target?.result) {
            setSourcePreview(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  // 处理文件下载
  const handleFileDownload = () => {
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
  };

  return (
    <div className={`flex gap-3 ${className}`}>
      <button
        className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
        onClick={handleFileUpload}
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
        onClick={handleFileDownload}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        下载图片
      </button>
    </div>
  );
};

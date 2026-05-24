'use client'

import React, { useEffect, useRef, useCallback } from 'react';
import { useImageEditor } from './ImageEditorContext';
import { useToast } from '@/hooks/use-toast';

// 生成唯一ID的工具函数
const generateId = (type: 'text' | 'graphic'): string => {
  return `${type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

interface CanvasEditorProps {
  className?: string;
}

/**
 * @description 图片编辑器核心画布组件
 * @author YYC
 * @created 2024-10-15
 */
export const CanvasEditor: React.FC<CanvasEditorProps> = ({ className }) => {
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  
  const {
    // 状态
    sourcePreview,
    canvas,
    ctx,
    isEraserActive,
    eraserConfig,
    isErasing,
    isCropActive,
    cropShape,
    cropRadius,
    cropRegion,
    isDragging,
    dragStart,
    isAddTextActive,
    textElements,
    currentText,
    textSize,
    textColor,
    selectedFont,
    fontWeight,

    // 方法
    setCanvas,
    setCtx,
    saveToHistory,
    setIsErasing,
    setCropRegion,
    setIsDragging,
    setDragStart,
    addTextElement,
    selectElement
  } = useImageEditor();

  // 初始化画布
  useEffect(() => {
    const canvasElement = canvasRef.current;
    if (!canvasElement) return;
    
    const context = canvasElement.getContext('2d');
    if (!context) return;
    
    setCanvas(canvasElement);
    setCtx(context);
  }, [setCanvas, setCtx]);

  // 加载图片到画布
  useEffect(() => {
    if (!sourcePreview || !ctx) return;
    
    const img = new Image();
    img.src = sourcePreview;
    img.onload = () => {
      // 设置画布尺寸，保持图片比例
      const canvas = ctx.canvas;
      const MAX_WIDTH = 800;
      const MAX_HEIGHT = 600;
      
      let width = img.width;
      let height = img.height;
      
      if (width > MAX_WIDTH || height > MAX_HEIGHT) {
        const ratio = Math.min(MAX_WIDTH / width, MAX_HEIGHT / height);
        width = Math.floor(width * ratio);
        height = Math.floor(height * ratio);
      }
      
      canvas.width = width;
      canvas.height = height;
      
      // 清除画布并绘制图片
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, width, height);
      
      // 保存到历史记录
      saveToHistory();
      
      // 重置裁剪区域
      setCropRegion(null);
    };
    
    img.onerror = () => {
      toast({ title: '加载失败', description: '无法加载图片，请重试', variant: 'destructive' });
    };
  }, [sourcePreview, ctx, setCropRegion, saveToHistory, toast]);

  // 渲染文本和图形元素
  useEffect(() => {
    if (!ctx) return;
    
    // 清除画布并重新绘制所有内容
    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    
    // 重新绘制图片
    if (sourcePreview) {
      const img = imageRef.current || new Image();
      img.src = sourcePreview;
      img.onload = () => {
        ctx.drawImage(img, 0, 0, ctx.canvas.width, ctx.canvas.height);
        
        // 绘制文本元素
        textElements.forEach(element => {
          ctx.font = `${element.fontWeight} ${element.size}px ${element.font}`;
          ctx.fillStyle = element.color;
          ctx.fillText(element.text, element.x, element.y);
        });
        
        // 如果有正在编辑的裁剪区域，绘制裁剪预览
        if (isCropActive && cropRegion) {
          drawCropPreview();
        }
      };
    }
  }, [ctx, sourcePreview, textElements, isCropActive, cropRegion]);

  // 绘制裁剪预览
  const drawCropPreview = useCallback(() => {
    if (!ctx || !cropRegion) return;
    
    // 保存当前状态
    ctx.save();
    
    // 创建裁剪路径
    ctx.beginPath();
    
    if (cropShape === 'rectangle') {
      ctx.rect(cropRegion.x, cropRegion.y, cropRegion.width, cropRegion.height);
    } else if (cropShape === 'rounded') {
      const { x, y, width, height } = cropRegion;
      const radius = cropRadius;
      ctx.moveTo(x + radius, y);
      ctx.arcTo(x + width, y, x + width, y + height, radius);
      ctx.arcTo(x + width, y + height, x, y + height, radius);
      ctx.arcTo(x, y + height, x, y, radius);
      ctx.arcTo(x, y, x + width, y, radius);
    } else if (cropShape === 'circle') {
      const centerX = cropRegion.x + cropRegion.width / 2;
      const centerY = cropRegion.y + cropRegion.height / 2;
      const radius = Math.min(cropRegion.width, cropRegion.height) / 2;
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    } else if (cropShape === 'triangle') {
      const centerX = cropRegion.x + cropRegion.width / 2;
      const topY = cropRegion.y;
      const bottomY = cropRegion.y + cropRegion.height;
      const leftX = cropRegion.x;
      const rightX = cropRegion.x + cropRegion.width;
      
      ctx.moveTo(centerX, topY);
      ctx.lineTo(leftX, bottomY);
      ctx.lineTo(rightX, bottomY);
      ctx.closePath();
    }
    
    ctx.closePath();
    
    // 绘制半透明遮罩
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = '#0000ff';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // 还原状态
    ctx.restore();
  }, [ctx, cropRegion, cropShape, cropRadius]);

  // 获取元素在指定位置
  const getElementAtPosition = useCallback((x: number, y: number) => {
    // 检查文本元素
    for (let i = textElements.length - 1; i >= 0; i--) {
      const element = textElements[i];
      if (ctx) {
        ctx.font = `${element.fontWeight} ${element.size}px ${element.font}`;
        const metrics = ctx.measureText(element.text);
        const textHeight = parseInt(element.fontWeight) + 10;
        
        if (x >= element.x && x <= element.x + metrics.width &&
            y >= element.y - textHeight && y <= element.y) {
          return element.id;
        }
      }
    }
    
    return null;
  }, [ctx, textElements]);

  // 处理鼠标按下事件
  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 检查是否点击了现有元素
    const elementId = getElementAtPosition(x, y);
    if (elementId) {
      selectElement(elementId);
      return;
    }
    
    // 处理不同工具的点击事件
    if (isCropActive) {
      setIsDragging(true);
      setDragStart({ x, y });
      setCropRegion({ x, y, width: 0, height: 0 });
    } else if (isEraserActive) {
      setIsErasing(true);
      handleErase(x, y);
    } else if (isAddTextActive) {
      // 添加文本元素
      addTextElement({
        id: generateId('text'),
        text: currentText || '点击编辑文字',
        x,
        y,
        size: textSize,
        color: textColor,
        font: selectedFont,
        fontWeight
      });
    } else {
      // 普通点击，重置选中状态
      selectElement(null);
    }
  }, [canvas, getElementAtPosition, isCropActive, isEraserActive, isAddTextActive, currentText, textSize, textColor, selectedFont, fontWeight, setIsDragging, setDragStart, setCropRegion, setIsErasing, addTextElement, selectElement]);

  // 处理鼠标移动事件
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvas) return;
    
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 处理裁剪区域拖拽
    if (isCropActive && isDragging) {
      const width = x - dragStart.x;
      const height = y - dragStart.y;
      
      setCropRegion({
        x: width < 0 ? x : dragStart.x,
        y: height < 0 ? y : dragStart.y,
        width: Math.abs(width),
        height: Math.abs(height)
      });
    }
    
    // 处理橡皮擦
    if (isEraserActive && isErasing) {
      handleErase(x, y);
    }
  }, [canvas, isCropActive, isDragging, dragStart, setCropRegion, isEraserActive, isErasing]);

  // 处理鼠标释放事件
  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsErasing(false);
    
    // 完成裁剪选择后保存历史
    if (isCropActive && cropRegion && Math.abs(cropRegion.width) > 10 && Math.abs(cropRegion.height) > 10) {
      saveToHistory();
    }
  }, [setIsDragging, setIsErasing, isCropActive, cropRegion, saveToHistory]);

  // 处理橡皮擦功能
  const handleErase = useCallback((x: number, y: number) => {
    if (!ctx || !isEraserActive) return;
    
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = eraserConfig.size;
    ctx.strokeStyle = 'rgba(0,0,0,1)';
    
    // 设置画笔形状和硬度
    if (eraserConfig.shape === 'square') {
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'miter';
    }
    
    if (eraserConfig.brushType === 'hard') {
      ctx.globalAlpha = 1;
    } else if (eraserConfig.brushType === 'soft') {
      ctx.globalAlpha = 0.5;
    }
    
    // 开始绘制路径
    ctx.beginPath();
    ctx.arc(x, y, eraserConfig.size / 2, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }, [ctx, isEraserActive, eraserConfig]);

  // 处理鼠标离开画布
  const handleMouseLeave = useCallback(() => {
    handleMouseUp();
  }, [handleMouseUp]);

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="border rounded-lg shadow-md bg-gray-100 cursor-crosshair"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
      />
      
      {/* 加载状态指示器 */}
      {!sourcePreview && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
          <p className="text-gray-500">请上传图片</p>
        </div>
      )}
    </div>
  );
};

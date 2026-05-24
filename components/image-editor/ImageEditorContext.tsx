'use client'

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

// 类型定义
export interface EraserConfig {
  size: number;
  shape: 'round' | 'square';
  brushType: 'normal' | 'hard' | 'soft';
  opacity: number;
}

export interface TextElement {
  id: string;
  text: string;
  x: number;
  y: number;
  size: number;
  color: string;
  font: string;
  fontWeight: 'normal' | 'bold' | 'italic';
}

export interface GraphicElement {
  id: string;
  emoji: string;
  x: number;
  y: number;
  size: number;
}

interface ImageEditorState {
  // 文件和画布状态
  sourceFile: File | null;
  sourcePreview: string;
  processing: boolean;
  canvas: HTMLCanvasElement | null;
  ctx: CanvasRenderingContext2D | null;
  
  // 橡皮擦工具状态
  isEraserActive: boolean;
  eraserConfig: EraserConfig;
  isErasing: boolean;
  
  // 裁剪工具状态
  isCropActive: boolean;
  cropShape: 'rectangle' | 'circle' | 'rounded' | 'triangle';
  cropRadius: number;
  selectedRatio: string;
  cropRegion: {x: number, y: number, width: number, height: number} | null;
  isDragging: boolean;
  dragStart: {x: number, y: number};
  
  // 添加元素功能状态
  isAddTextActive: boolean;
  isAddGraphicActive: boolean;
  textElements: TextElement[];
  graphicElements: GraphicElement[];
  currentText: string;
  textSize: number;
  textColor: string;
  selectedFont: string;
  fontWeight: 'normal' | 'bold' | 'italic';
  graphicSize: number;
  selectedEmoji: string;
  movingElement: string | null;
  isElementDragging: boolean;
  dragOffset: {x: number, y: number};
  selectedElementId: string | null;
  
  // 历史记录状态
  history: ImageData[];
  historyIndex: number;
  
  // 去水印和去文字功能状态
  isWatermarkActive: boolean;
  isTextRemovalActive: boolean;
}

interface ImageEditorContextType extends ImageEditorState {
  // 重置所有工具状态
  resetAllTools: () => void;
  
  // 文件处理
  setSourceFile: (file: File | null) => void;
  setSourcePreview: (preview: string) => void;
  setProcessing: (processing: boolean) => void;
  
  // 画布操作
  setCanvas: (canvas: HTMLCanvasElement | null) => void;
  setCtx: (ctx: CanvasRenderingContext2D | null) => void;
  saveToHistory: () => void;
  
  // 历史操作
  undo: () => void;
  redo: () => void;
  
  // 工具激活状态
  setIsEraserActive: (active: boolean) => void;
  setIsErasing: (erasing: boolean) => void;
  setIsCropActive: (active: boolean) => void;
  setIsAddTextActive: (active: boolean) => void;
  setIsAddGraphicActive: (active: boolean) => void;
  setIsWatermarkActive: (active: boolean) => void;
  setIsTextRemovalActive: (active: boolean) => void;
  setIsDragging: (dragging: boolean) => void;
  setDragStart: (start: {x: number, y: number}) => void;
  
  // 工具配置
  setEraserConfig: (config: EraserConfig) => void;
  setCropShape: (shape: 'rectangle' | 'circle' | 'rounded' | 'triangle') => void;
  setCropRegion: (region: {x: number, y: number, width: number, height: number} | null) => void;
  setSelectedEmoji: (emoji: string) => void;
  
  // 元素管理
  addTextElement: (element: TextElement) => void;
  addGraphicElement: (element: GraphicElement) => void;
  updateTextElement: (id: string, updates: Partial<TextElement>) => void;
  updateGraphicElement: (id: string, updates: Partial<GraphicElement>) => void;
  removeTextElement: (id: string) => void;
  removeGraphicElement: (id: string) => void;
  
  // 元素拖拽
  setMovingElement: (id: string | null) => void;
  moveElementById: (elementId: string, x: number, y: number) => void;
  deleteSelectedElement: () => void;
  selectElement: (id: string | null) => void;
}

const ImageEditorContext = createContext<ImageEditorContextType | undefined>(undefined);

export const useImageEditor = () => {
  const context = useContext(ImageEditorContext);
  if (context === undefined) {
    throw new Error('useImageEditor must be used within an ImageEditorProvider');
  }
  return context;
};

interface ImageEditorProviderProps {
  children: ReactNode;
}

export const ImageEditorProvider: React.FC<ImageEditorProviderProps> = ({ children }) => {
  const { toast } = useToast();
  
  // 初始状态
  const [state, setState] = useState<ImageEditorState>({
    sourceFile: null,
    sourcePreview: '',
    processing: false,
    canvas: null,
    ctx: null,
    
    // 橡皮擦工具状态
    isEraserActive: false,
    eraserConfig: {
      size: 20,
      shape: 'round',
      brushType: 'normal',
      opacity: 1
    },
    isErasing: false,
    
    // 裁剪工具状态
    isCropActive: false,
    cropShape: 'rectangle',
    cropRadius: 20,
    selectedRatio: '自由',
    cropRegion: null,
    isDragging: false,
    dragStart: {x: 0, y: 0},
    
    // 添加元素功能状态
    isAddTextActive: false,
    isAddGraphicActive: false,
    textElements: [],
    graphicElements: [],
    currentText: '添加文字',
    textSize: 24,
    textColor: '#000000',
    selectedFont: 'Arial',
    fontWeight: 'normal',
    graphicSize: 48,
    selectedEmoji: '😊',
    movingElement: null,
    isElementDragging: false,
    dragOffset: {x: 0, y: 0},
    selectedElementId: null,
    
    // 历史记录状态
    history: [],
    historyIndex: -1,
    
    // 去水印和去文字功能状态
    isWatermarkActive: false,
    isTextRemovalActive: false,
  });

  // 重置所有工具状态
  const resetAllTools = () => {
    setState(prev => ({
      ...prev,
      isWatermarkActive: false,
      isTextRemovalActive: false,
      isEraserActive: false,
      isCropActive: false,
      isAddTextActive: false,
      isAddGraphicActive: false,
      movingElement: null,
    }));
  };

  // 保存当前画布状态到历史记录
  const saveToHistory = () => {
    const MAX_HISTORY_ITEMS = 20;
    if (!state.canvas || !state.ctx) return;
    
    const imageData = state.ctx.getImageData(0, 0, state.canvas.width, state.canvas.height);
    
    setState(prev => {
      // 如果当前不在历史记录的末尾，移除后面的历史记录
      const currentHistory = prev.history.slice(0, prev.historyIndex + 1);
      const newHistory = [...currentHistory, imageData];
      
      // 限制历史记录数量
      const limitedHistory = newHistory.length > MAX_HISTORY_ITEMS 
        ? newHistory.slice(-MAX_HISTORY_ITEMS)
        : newHistory;
      
      return {
        ...prev,
        history: limitedHistory,
        historyIndex: limitedHistory.length - 1
      };
    });
  };

  // 撤销操作
  const undo = () => {
    if (!state.canvas || !state.ctx || state.historyIndex <= 0) return;
    
    const newIndex = state.historyIndex - 1;
    state.ctx.putImageData(state.history[newIndex], 0, 0);
    
    setState(prev => ({
      ...prev,
      historyIndex: newIndex
    }));
  };

  // 重做操作
  const redo = () => {
    if (!state.canvas || !state.ctx || state.historyIndex >= state.history.length - 1) return;
    
    const newIndex = state.historyIndex + 1;
    state.ctx.putImageData(state.history[newIndex], 0, 0);
    
    setState(prev => ({
      ...prev,
      historyIndex: newIndex
    }));
  };

  // 元素管理方法
  const addTextElement = (element: TextElement) => {
    setState(prev => ({
      ...prev,
      textElements: [...prev.textElements, element]
    }));
    saveToHistory();
    toast({ title: '文字已添加', description: '您可以拖拽文字到任意位置' });
  };

  const addGraphicElement = (element: GraphicElement) => {
    setState(prev => ({
      ...prev,
      graphicElements: [...prev.graphicElements, element]
    }));
    saveToHistory();
    toast({ title: '表情已添加', description: '您可以拖拽表情到任意位置' });
  };

  const updateTextElement = (id: string, updates: Partial<TextElement>) => {
    setState(prev => ({
      ...prev,
      textElements: prev.textElements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    }));
  };

  const updateGraphicElement = (id: string, updates: Partial<GraphicElement>) => {
    setState(prev => ({
      ...prev,
      graphicElements: prev.graphicElements.map(el => 
        el.id === id ? { ...el, ...updates } : el
      )
    }));
  };

  const removeTextElement = (id: string) => {
    setState(prev => ({
      ...prev,
      textElements: prev.textElements.filter(el => el.id !== id)
    }));
  };

  const removeGraphicElement = (id: string) => {
    setState(prev => ({
      ...prev,
      graphicElements: prev.graphicElements.filter(el => el.id !== id)
    }));
  };

  // 移动元素
  const moveElementById = (elementId: string, x: number, y: number) => {
    if (elementId.startsWith('text-')) {
      updateTextElement(elementId, { x, y });
    } else if (elementId.startsWith('graphic-')) {
      updateGraphicElement(elementId, { x, y });
    }
  };

  // 删除选中元素
  const deleteSelectedElement = () => {
    if (!state.movingElement) return;
    
    if (state.movingElement.startsWith('text-')) {
      removeTextElement(state.movingElement);
    } else if (state.movingElement.startsWith('graphic-')) {
      removeGraphicElement(state.movingElement);
    }
    
    setState(prev => ({
      ...prev,
      movingElement: null
    }));
    
    saveToHistory();
    toast({ title: '元素已删除' });
  };

  // 选择元素
  const selectElement = (id: string | null) => {
    setState(prev => ({
      ...prev,
      selectedElementId: id
    }));
  };

  const contextValue: ImageEditorContextType = {
    ...state,
    resetAllTools,
    setSourceFile: (file) => setState(prev => ({ ...prev, sourceFile: file })),
    setSourcePreview: (preview) => setState(prev => ({ ...prev, sourcePreview: preview })),
    setProcessing: (processing) => setState(prev => ({ ...prev, processing })),
    setCanvas: (canvas) => setState(prev => ({ ...prev, canvas })),
    setCtx: (ctx) => setState(prev => ({ ...prev, ctx })),
    saveToHistory,
    undo,
    redo,
    setIsEraserActive: (active) => setState(prev => ({ ...prev, isEraserActive: active })),
    setIsErasing: (erasing) => setState(prev => ({ ...prev, isErasing: erasing })),
    setIsCropActive: (active) => setState(prev => ({ ...prev, isCropActive: active })),
    setIsAddTextActive: (active) => setState(prev => ({ ...prev, isAddTextActive: active })),
    setIsAddGraphicActive: (active) => setState(prev => ({ ...prev, isAddGraphicActive: active })),
    setIsWatermarkActive: (active) => setState(prev => ({ ...prev, isWatermarkActive: active })),
    setIsTextRemovalActive: (active) => setState(prev => ({ ...prev, isTextRemovalActive: active })),
    setIsDragging: (dragging) => setState(prev => ({ ...prev, isDragging: dragging })),
    setDragStart: (start) => setState(prev => ({ ...prev, dragStart: start })),
    setEraserConfig: (config) => setState(prev => ({ ...prev, eraserConfig: config })),
    setCropShape: (shape) => setState(prev => ({ ...prev, cropShape: shape })),
    setCropRegion: (region) => setState(prev => ({ ...prev, cropRegion: region })),
    setSelectedEmoji: (emoji) => setState(prev => ({ ...prev, selectedEmoji: emoji })),
    addTextElement,
    addGraphicElement,
    updateTextElement,
    updateGraphicElement,
    removeTextElement,
    removeGraphicElement,
    setMovingElement: (id) => setState(prev => ({ ...prev, movingElement: id })),
    moveElementById,
    deleteSelectedElement,
    selectElement,
  };

  return (
    <ImageEditorContext.Provider value={contextValue}>
      {children}
    </ImageEditorContext.Provider>
  );
};

/**
 * @description 图片编辑器状态管理上下文
 * @author YYC
 * @created 2024-10-15
 */

'use client'

/**
 * @file 图片编辑器类型定义
 * @description 定义图片编辑器所需的所有TypeScript类型
 * @author YYC
 * @created 2024-10-15
 */

// 橡皮擦配置
export interface EraserConfig {
  size: number;
  opacity: number;
  shape: 'round' | 'square';
  brushType: 'normal' | 'hard' | 'soft';
}

// 元素基础接口
export interface BaseElement {
  id: string;
  type: string;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
}

// 文本元素
export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
}

// 图形元素
export interface GraphicElement extends BaseElement {
  type: 'graphic';
  graphicType: 'rectangle' | 'circle' | 'triangle' | 'arrow';
  fillColor: string;
  strokeColor: string;
  strokeWidth: number;
}

// 水印元素
export interface WatermarkElement extends BaseElement {
  type: 'watermark';
  text: string;
  fontSize: number;
  color: string;
  opacity: number;
  angle: number;
  spacing: number;
}

// 所有元素类型
export type EditorElement = TextElement | GraphicElement | WatermarkElement;

// 工具类型
export type ToolType = 'select' | 'eraser' | 'crop' | 'text' | 'graphic' | 'watermark';

// 裁剪形状
export type CropShape = 'rectangle' | 'rounded' | 'circle' | 'triangle';

// 历史记录操作
export interface HistoryAction {
  type: 'add' | 'update' | 'delete' | 'crop' | 'eraser' | 'undo' | 'redo';
  elements: EditorElement[];
  timestamp: number;
}

// 裁剪区域
export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
  active: boolean;
}

// 图片编辑状态
export interface ImageEditorState {
  // 图片相关
  imageSrc: string | null;
  imageLoading: boolean;
  imageError: string | null;
  imageWidth: number;
  imageHeight: number;
  scale: number;
  offsetX: number;
  offsetY: number;
  
  // 元素相关
  elements: EditorElement[];
  selectedElementId: string | null;
  
  // 工具相关
  activeTool: ToolType;
  eraserConfig: EraserConfig;
  cropShape: CropShape;
  cropRadius: number;
  cropArea: CropArea;
  
  // 历史记录
  history: HistoryAction[];
  historyIndex: number;
  
  // UI状态
  showSettingsPanel: boolean;
  isDragging: boolean;
  isResizing: boolean;
  isRotating: boolean;
}

// 上下文操作
export interface ImageEditorContextType extends ImageEditorState {
  // 图片操作
  loadImage: (file: File) => void;
  setImageSrc: (src: string | null) => void;
  updateImageSize: (width: number, height: number) => void;
  
  // 工具操作
  setActiveTool: (tool: ToolType) => void;
  resetAllTools: () => void;
  
  // 橡皮擦操作
  setEraserConfig: (config: EraserConfig) => void;
  
  // 裁剪操作
  setCropShape: (shape: CropShape) => void;
  updateCropArea: (area: Partial<CropArea>) => void;
  applyCrop: () => void;
  
  // 元素操作
  addElement: (element: EditorElement) => void;
  updateElement: (id: string, updates: Partial<EditorElement>) => void;
  deleteElement: (id: string) => void;
  selectElement: (id: string | null) => void;
  moveElement: (id: string, x: number, y: number) => void;
  resizeElement: (id: string, width: number, height: number) => void;
  rotateElement: (id: string, rotation: number) => void;
  
  // 历史记录
  undo: () => void;
  redo: () => void;
  saveToHistory: () => void;
  
  // 导出操作
  downloadImage: () => void;
  getCanvasData: () => HTMLCanvasElement | null;
}

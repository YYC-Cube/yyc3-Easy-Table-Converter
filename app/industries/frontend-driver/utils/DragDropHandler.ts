/**
 * @file 拖拽处理器实现
 * @description 实现拖拽交互和文件上传功能
 * @module dragDropHandler
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import {
  DragEventData,
  EventHandlerInterface,
  ListenerOptions
} from '../types/EventHandlerTypes';
import { createEventHandler } from './EventHandler';

/**
 * 拖拽配置选项
 */
interface DragDropOptions {
  /** 是否允许多选 */
  multiSelect?: boolean;
  /** 是否允许外部拖入 */
  allowExternalDrop?: boolean;
  /** 是否允许文件上传 */
  allowFileDrop?: boolean;
  /** 允许的文件类型（MIME类型或扩展名） */
  allowedFileTypes?: string[];
  /** 最大文件大小（字节） */
  maxFileSize?: number;
  /** 拖拽时显示的光标类型 */
  cursorType?: 'copy' | 'move' | 'link' | 'none';
  /** 是否启用拖拽预览 */
  enableDragPreview?: boolean;
  /** 是否阻止默认拖拽行为 */
  preventDefault?: boolean;
}

/**
 * 拖拽项目信息
 */
interface DragItem {
  /** 拖拽项目ID */
  id: string;
  /** 拖拽项目类型 */
  type: string;
  /** 拖拽项目数据 */
  data: any;
  /** 拖拽开始的元素 */
  sourceElement?: HTMLElement;
  /** 拖拽开始的位置 */
  startPosition?: {
    x: number;
    y: number;
  };
}

/**
 * 文件拖放结果
 */
interface FileDropResult {
  /** 文件数组 */
  files: File[];
  /** 有效文件 */
  validFiles: File[];
  /** 无效文件 */
  invalidFiles: Array<{
    file: File;
    reason: string;
  }>;
}

/**
 * 拖拽区域配置
 */
interface DropZoneConfig {
  /** 拖拽区域元素 */
  element: HTMLElement;
  /** 可接受的拖拽类型 */
  acceptTypes?: string[];
  /** 进入拖拽区域时的回调 */
  onDragEnter?: (event: DragEvent, dragItem?: DragItem) => void;
  /** 在拖拽区域内移动时的回调 */
  onDragOver?: (event: DragEvent, dragItem?: DragItem) => void;
  /** 离开拖拽区域时的回调 */
  onDragLeave?: (event: DragEvent, dragItem?: DragItem) => void;
  /** 放置时的回调 */
  onDrop?: (event: DragEvent, dragItem?: DragItem, files?: File[]) => void;
  /** 自定义样式类名（拖拽时） */
  dragOverClassName?: string;
  /** 自定义样式类名（拖拽进入时） */
  dragEnterClassName?: string;
}

/**
 * 拖拽处理器类
 */
class DragDropHandler {
  /** 当前拖拽的项目 */
  private currentDragItem: DragItem | null = null;
  /** 拖拽区域配置 */
  private dropZones: Map<string, DropZoneConfig> = new Map();
  /** 配置选项 */
  private options: DragDropOptions;
  /** 事件处理器 */
  private eventHandler: EventHandlerInterface<DragEventData>;
  /** 当前拖拽的元素 */
  private draggedElement: HTMLElement | null = null;
  /** 拖拽预览元素 */
  private dragPreview: HTMLElement | null = null;
  /** 是否正在拖拽 */
  private isDragging: boolean = false;
  /** 开始拖拽时间戳 */
  private dragStartTime: number = 0;
  /** 拖拽距离阈值（像素） */
  // private dragThreshold: number = 5; // 预留变量，暂未使用

  /**
   * 构造函数
   * @param options 配置选项
   */
  constructor(options: DragDropOptions = {}) {
    this.options = {
      multiSelect: true,
      allowExternalDrop: true,
      allowFileDrop: false,
      allowedFileTypes: [],
      maxFileSize: 10 * 1024 * 1024, // 默认10MB
      cursorType: 'move',
      enableDragPreview: true,
      preventDefault: true,
      ...options
    };

    this.eventHandler = createEventHandler();
  }

  /**
   * 初始化可拖拽元素
   * @param element 元素或选择器
   * @param item 拖拽项目信息
   * @param customOptions 自定义选项
   * @returns 初始化的元素
   */
  makeDraggable(
    element: HTMLElement | string,
    item: Omit<DragItem, 'startPosition' | 'sourceElement'>,
    customOptions?: Partial<DragDropOptions>
  ): HTMLElement {
    const el = typeof element === 'string' ? document.querySelector<HTMLElement>(element) : element;
    
    if (!el) {
      throw new Error('拖拽元素不存在');
    }

    // 合并选项
    const mergedOptions = { ...this.options, ...customOptions };

    // 设置拖拽属性
    el.draggable = true;
    
    // 存储拖拽数据
    el.dataset.dragId = item.id;
    el.dataset.dragType = item.type;

    // 处理拖拽开始事件
    el.addEventListener('dragstart', (event) => this.handleDragStart(event, item, mergedOptions));
    
    // 处理拖拽结束事件
    el.addEventListener('dragend', (event) => this.handleDragEnd(event, mergedOptions));

    // 处理鼠标按下事件（用于拖拽预览）
    el.addEventListener('mousedown', (event) => this.handleMouseDown(event));

    // 处理鼠标移动事件（用于拖拽阈值检测）
    el.addEventListener('mousemove', (event) => this.handleMouseMove(event, mergedOptions));

    // 处理鼠标释放事件
    el.addEventListener('mouseup', () => this.handleMouseUp());

    return el;
  }

  /**
   * 添加拖拽区域
   * @param config 拖拽区域配置
   * @returns 拖拽区域ID
   */
  addDropZone(config: DropZoneConfig): string {
    const zoneId = `dropzone_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    this.dropZones.set(zoneId, config);
    
    // 绑定拖拽事件
    this.bindDropZoneEvents(config);
    
    return zoneId;
  }

  /**
   * 移除拖拽区域
   * @param zoneId 拖拽区域ID
   * @returns 是否成功移除
   */
  removeDropZone(zoneId: string): boolean {
    const config = this.dropZones.get(zoneId);
    
    if (config) {
      // 解绑拖拽事件
      this.unbindDropZoneEvents(config);
      
      this.dropZones.delete(zoneId);
      return true;
    }
    
    return false;
  }

  /**
   * 绑定拖拽区域事件
   * @param config 拖拽区域配置
   */
  private bindDropZoneEvents(config: DropZoneConfig): void {
    const { element } = config;

    element.addEventListener('dragenter', (event) => this.handleDragEnter(event, config));
    element.addEventListener('dragover', (event) => this.handleDragOver(event, config));
    element.addEventListener('dragleave', (event) => this.handleDragLeave(event, config));
    element.addEventListener('drop', (event) => this.handleDrop(event, config));
  }

  /**
   * 解绑拖拽区域事件
   * @param config 拖拽区域配置
   */
  private unbindDropZoneEvents(config: DropZoneConfig): void {
    const { element } = config;

    element.removeEventListener('dragenter', (event) => this.handleDragEnter(event, config));
    element.removeEventListener('dragover', (event) => this.handleDragOver(event, config));
    element.removeEventListener('dragleave', (event) => this.handleDragLeave(event, config));
    element.removeEventListener('drop', (event) => this.handleDrop(event, config));
  }

  /**
   * 处理鼠标按下事件
   * @param event 鼠标事件
   */
  private handleMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const draggableElement = target.closest('[draggable="true"]') as HTMLElement;
    
    if (draggableElement) {
      this.dragStartTime = Date.now();
      this.draggedElement = draggableElement;
    }
  }

  /**
   * 处理鼠标移动事件
   * @param _event 鼠标事件
   * @param _options 选项
   */
  private handleMouseMove(_event: MouseEvent, _options: DragDropOptions): void {
    // 拖拽阈值检测
    if (this.draggedElement && this.dragStartTime) {
      // 可以添加拖拽阈值检测逻辑
    }
  }

  /**
   * 处理鼠标释放事件
   */
  private handleMouseUp(): void {
    this.draggedElement = null;
    this.dragStartTime = 0;
  }

  /**
   * 处理拖拽开始事件
   * @param event 拖拽事件
   * @param item 拖拽项目
   * @param options 选项
   */
  private handleDragStart(event: DragEvent, item: DragItem, options: DragDropOptions): void {
    const target = event.target as HTMLElement;
    
    // 存储拖拽项目信息
    this.currentDragItem = {
      ...item,
      sourceElement: target,
      startPosition: {
        x: event.clientX,
        y: event.clientY
      }
    };

    // 设置拖拽效果
    if (event.dataTransfer && options.cursorType) {
      event.dataTransfer.effectAllowed = options.cursorType;
    }

    // 设置拖拽数据
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/json', JSON.stringify(this.currentDragItem));
      event.dataTransfer.setData('text/plain', item.id);
    }

    // 创建拖拽预览
    if (options.enableDragPreview && this.dragPreview) {
      if (event.dataTransfer) {
        event.dataTransfer.setDragImage(this.dragPreview, 0, 0);
      }
    }

    // 设置拖拽时的样式
    target.classList.add('dragging');
    
    this.isDragging = true;

    // 创建并触发拖拽开始事件
    const dragStartEvent: DragEventData = {
      type: 'dragStart',
      source: this.draggedElement,
      position: { x: event.clientX, y: event.clientY },
      delta: { x: 0, y: 0 },
      data: { dragItem: this.currentDragItem, event },
      timestamp: Date.now(),
    };

    this.eventHandler.emit(dragStartEvent);
  }

  /**
   * 处理拖拽结束事件
   * @param event 拖拽事件
   * @param _options 选项
   */
  private handleDragEnd(event: DragEvent, _options: DragDropOptions): void {
    const target = event.target as HTMLElement;
    
    // 移除拖拽样式
    target.classList.remove('dragging');
    
    // 创建并触发拖拽结束事件
    const dragEndEvent: DragEventData = {
      type: 'dragEnd',
      source: this.draggedElement,
      position: { x: event.clientX, y: event.clientY },
      delta: { x: 0, y: 0 },
      data: { dragItem: this.currentDragItem || undefined, event },
      timestamp: Date.now(),
    };

    this.eventHandler.emit(dragEndEvent);
    
    // 清理拖拽状态
    this.isDragging = false;
    this.currentDragItem = null;
    this.draggedElement = null;
    
    // 清理拖拽预览
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
  }

  /**
   * 处理拖拽进入事件
   * @param event 拖拽事件
   * @param config 拖拽区域配置
   */
  private handleDragEnter(event: DragEvent, config: DropZoneConfig): void {
    if (this.options.preventDefault && event.preventDefault) {
      event.preventDefault();
    }

    const { element, onDragEnter, dragEnterClassName } = config;
    
    // 应用拖拽进入样式
    if (dragEnterClassName) {
      element.classList.add(dragEnterClassName);
    }
    
    // 调用自定义回调
    if (onDragEnter) {
      onDragEnter(event, this.currentDragItem || undefined);
    }

    // 创建并触发拖拽进入事件
    const dragEnterEvent: DragEventData = {
      type: 'dragEnter',
      source: this.draggedElement,
      position: { x: event.clientX, y: event.clientY },
      delta: { x: 0, y: 0 },
      data: { dragItem: this.currentDragItem || undefined, event, targetZone: config },
      timestamp: Date.now(),
    };

    this.eventHandler.emit(dragEnterEvent);
  }

  /**
   * 处理拖拽经过事件
   * @param event 拖拽事件
   * @param config 拖拽区域配置
   */
  private handleDragOver(event: DragEvent, config: DropZoneConfig): void {
    // 必须阻止默认行为，否则不会触发drop事件
    if (event.preventDefault) {
      event.preventDefault();
    }

    // 设置拖拽效果
    if (event.dataTransfer && this.options.cursorType) {
      event.dataTransfer.dropEffect = this.options.cursorType;
    }

    const { onDragOver, dragOverClassName, element } = config;
    
    // 应用拖拽经过样式
    if (dragOverClassName) {
      element.classList.add(dragOverClassName);
    }
    
    // 调用自定义回调
    if (onDragOver) {
      onDragOver(event, this.currentDragItem || undefined);
    }

    // 创建并触发拖拽经过事件
    const dragMoveEvent: DragEventData = {
      type: 'dragMove',
      source: this.draggedElement,
      position: { x: event.clientX, y: event.clientY },
      delta: { x: 0, y: 0 },
      data: { dragItem: this.currentDragItem || undefined, event, targetZone: config },
      timestamp: Date.now(),
    };

      // 触发自定义事件
      this.eventHandler.emit(dragMoveEvent);
    }

  /**
   * 处理拖拽离开事件
   * @param event 拖拽事件
   * @param config 拖拽区域配置
   */
  private handleDragLeave(event: DragEvent, config: DropZoneConfig): void {
    if (this.options.preventDefault && event.preventDefault) {
      event.preventDefault();
    }

    const { element, onDragLeave, dragEnterClassName, dragOverClassName } = config;
    
    // 移除拖拽样式
    if (dragEnterClassName) {
      element.classList.remove(dragEnterClassName);
    }
    
    if (dragOverClassName) {
      element.classList.remove(dragOverClassName);
    }
    
    // 调用自定义回调
    if (onDragLeave) {
    }

    // 创建并触发拖拽离开事件
    const dragLeaveEvent: DragEventData = {
      type: 'dragLeave',
      source: this.draggedElement,
      position: { x: event.clientX, y: event.clientY },
      delta: { x: 0, y: 0 },
      data: { dragItem: this.currentDragItem || undefined, event, targetZone: config },
      timestamp: Date.now(),
    };

    this.eventHandler.emit(dragLeaveEvent);
  }

  /**
   * 验证文件
   * @param file 文件对象
   * @returns 是否有效
   */
  private validateFile(file: File): { valid: boolean; reason?: string } {
    // 检查文件类型
    if (this.options.allowedFileTypes && this.options.allowedFileTypes.length > 0) {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type;
      
      const isAllowed = this.options.allowedFileTypes.some(type => {
        // 检查扩展名
        if (type.startsWith('.')) {
          return fileExtension === type.slice(1).toLowerCase();
        }
        // 检查MIME类型
        return mimeType === type || mimeType.startsWith(`${type.split('/')[0]}/`);
      });
      
      if (!isAllowed) {
        return { valid: false, reason: '文件类型不允许' };
      }
    }
    
    // 检查文件大小
    if (this.options.maxFileSize && file.size > this.options.maxFileSize) {
      return { valid: false, reason: '文件大小超过限制' };
    }
    
    return { valid: true };
  }

  /**
   * 处理文件拖放
   * @param event 拖拽事件
   * @returns 文件拖放结果
   */
  private handleFileDrop(event: DragEvent): FileDropResult | null {
    if (!this.options.allowFileDrop || !event.dataTransfer?.files) {
      return null;
    }

    const files = Array.from(event.dataTransfer.files);
    const validFiles: File[] = [];
    const invalidFiles: Array<{ file: File; reason: string }> = [];
    
    // 验证文件
    files.forEach(file => {
      const validation = this.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        invalidFiles.push({
          file,
          reason: validation.reason || '未知错误'
        });
      }
    });
    
    return {
      files,
      validFiles,
      invalidFiles
    };
  }

  /**
   * 处理放置事件
   * @param event 拖拽事件
   * @param config 拖拽区域配置
   */
  private handleDrop(event: DragEvent, config: DropZoneConfig): void {
    if (this.options.preventDefault && event.preventDefault) {
      event.preventDefault();
    }
    
    if (event.stopPropagation) {
      event.stopPropagation();
    }

    const { element, onDrop, dragEnterClassName, dragOverClassName } = config;
    
    // 移除拖拽样式
    if (dragEnterClassName) {
      element.classList.remove(dragEnterClassName);
    }
    
    if (dragOverClassName) {
      element.classList.remove(dragOverClassName);
    }

    let files: File[] | undefined;
    let fileDropResult: FileDropResult | null = null;
    
    // 处理文件拖放
    if (this.options.allowFileDrop) {
      fileDropResult = this.handleFileDrop(event);
      if (fileDropResult) {
        files = fileDropResult.validFiles;
      }
    }

    // 检查拖拽类型是否匹配
    let canDrop = true;
    if (this.currentDragItem && config.acceptTypes && config.acceptTypes.length > 0) {
      canDrop = config.acceptTypes.includes(this.currentDragItem.type);
    }

    // 调用自定义回调
    if (onDrop && canDrop) {
      onDrop(event, this.currentDragItem || undefined, files);
    }

    // 创建并触发放置事件
    const dropEvent: DragEventData = {
      type: 'drop',
      source: this.draggedElement,
      position: { x: event.clientX, y: event.clientY },
      delta: { x: 0, y: 0 },
      data: {
        dragItem: this.currentDragItem || undefined,
        event,
        targetZone: config,
        files,
        fileDropResult
      },
      timestamp: Date.now()
    };

    this.eventHandler.emit(dropEvent);
  }

  /**
   * 设置拖拽预览
   * @param element 预览元素或HTML字符串
   */
  setDragPreview(element: HTMLElement | string): void {
    if (typeof element === 'string') {
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = element;
      this.dragPreview = tempDiv.firstElementChild as HTMLElement;
    } else {
      this.dragPreview = element;
    }

    // 设置预览元素样式
    if (this.dragPreview) {
      Object.assign(this.dragPreview.style, {
        position: 'absolute',
        top: '-1000px',
        left: '-1000px',
        opacity: '0.7',
        pointerEvents: 'none',
        zIndex: '9999'
      });
      
      document.body.appendChild(this.dragPreview);
    }
  }

  /**
   * 监听拖拽事件
   * @param eventType 事件类型
   * @param listener 事件监听器
   * @param options 监听选项
   * @returns 监听器ID
   */
  on(eventType: 'dragStart' | 'dragEnd' | 'dragEnter' | 'dragOver' | 'dragLeave' | 'drop', listener: (event: DragEventData) => void, options?: ListenerOptions): string {
    return this.eventHandler.on(eventType, listener, options);
  }

  /**
   * 移除拖拽事件监听器
   * @param eventType 事件类型
   * @param listenerOrId 事件监听器或监听器ID
   */
  off(eventType: 'dragStart' | 'dragEnd' | 'dragEnter' | 'dragOver' | 'dragLeave' | 'drop', listenerOrId: ((event: DragEventData) => void) | string): void {
    this.eventHandler.off(eventType, listenerOrId);
  }

  /**
   * 获取当前拖拽项目
   * @returns 拖拽项目或null
   */
  getCurrentDragItem(): DragItem | null {
    return this.currentDragItem;
  }

  /**
   * 是否正在拖拽
   * @returns 是否正在拖拽
   */
  getIsDragging(): boolean {
    return this.isDragging;
  }

  /**
   * 销毁拖拽处理器
   */
  destroy(): void {
    // 清理拖拽区域
    this.dropZones.forEach(config => {
      this.unbindDropZoneEvents(config);
    });
    
    this.dropZones.clear();
    
    // 清理拖拽状态
    this.currentDragItem = null;
    this.isDragging = false;
    this.draggedElement = null;
    
    // 清理拖拽预览
    if (this.dragPreview) {
      this.dragPreview.remove();
      this.dragPreview = null;
    }
    
    // 清理事件处理器
    this.eventHandler.destroy();
  }
}

/**
 * 创建拖拽处理器实例
 * @param options 配置选项
 * @returns 拖拽处理器实例
 */
export function createDragDropHandler(options?: DragDropOptions): DragDropHandler {
  return new DragDropHandler(options);
}

export default DragDropHandler;

/**
 * @file 手势处理器实现
 * @description 实现触摸手势识别和处理功能
 * @module gestureHandler
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import {
  GestureEventData,
  TouchInfo,
  InteractionConfig,
  EventHandlerInterface,
  EventData,
  DragEventData
} from '../types/EventHandlerTypes';
import { globalEventHandler } from './EventHandler';

/**
 * 触摸点信息
 */
class TouchPoint implements TouchInfo {
  id: number;
  x: number;
  y: number;
  startTime: number;
  endTime?: number;

  constructor(id: number, x: number, y: number) {
    this.id = id;
    this.x = x;
    this.y = y;
    this.startTime = Date.now();
  }

  /**
   * 更新触摸点位置
   * @param x x坐标
   * @param y y坐标
   */
  update(x: number, y: number): void {
    this.x = x;
    this.y = y;
  }

  /**
   * 结束触摸点
   */
  end(): void {
    this.endTime = Date.now();
  }

  /**
   * 获取触摸持续时间
   * @returns 持续时间（毫秒）
   */
  getDuration(): number {
    const endTime = this.endTime || Date.now();
    return endTime - this.startTime;
  }

  /**
   * 计算与另一个触摸点的距离
   * @param point 另一个触摸点
   * @returns 距离
   */
  distanceTo(point: TouchPoint): number {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * 计算与另一个触摸点的角度
   * @param point 另一个触摸点
   * @returns 角度（弧度）
   */
  angleTo(point: TouchPoint): number {
    const dx = this.x - point.x;
    const dy = this.y - point.y;
    return Math.atan2(dy, dx);
  }
}

/**
 * 手势处理器类
 */
class GestureHandler {
  /** 当前活动的触摸点映射 */
  private activeTouches: Map<number, TouchPoint> = new Map();
  /** 上一次触摸的触摸点 */
  private previousTouches: Map<number, TouchPoint> = new Map();
  /** 配置信息 */
  private config: InteractionConfig;
  /** 事件处理器 */
  private eventHandler: EventHandlerInterface<EventData>;
  /** 目标元素 */
  private target: HTMLElement | null = null;
  /** 长按计时器 */
  private longPressTimer: NodeJS.Timeout | null = null;
  /** 双击计时器 */
  private doubleTapTimer: NodeJS.Timeout | null = null;
  /** 上次点击时间 */
  private lastTapTime: number = 0;
  /** 上次点击位置 */
  private lastTapPosition: { x: number; y: number } | null = null;
  /** 是否正在拖拽 */
  private isDragging: boolean = false;
  /** 拖拽开始位置 */
  private dragStartPosition: { x: number; y: number } | null = null;
  /** 初始捏合距离 */
  private initialPinchDistance: number | null = null;
  /** 初始旋转角度 */
  private initialRotationAngle: number | null = null;

  /**
   * 构造函数
   * @param config 交互配置
   * @param eventHandler 事件处理器（可选）
   */
  constructor(config: InteractionConfig = {}, eventHandler?: EventHandlerInterface<EventData>) {
    this.config = {
      doubleTapDelay: 300,
      longPressDelay: 500,
      swipeMinDistance: 50,
      dragThreshold: 10,
      enableTouchFeedback: true,
      ...config
    };
    
    this.eventHandler = eventHandler || globalEventHandler;
  }

  /**
   * 绑定到目标元素
   * @param target 目标元素
   */
  bind(target: HTMLElement): void {
    if (this.target === target) return;

    // 解绑之前的元素
    this.unbind();

    this.target = target;
    
    // 添加触摸事件监听器
    target.addEventListener('touchstart', this.handleTouchStart, { passive: false });
    target.addEventListener('touchmove', this.handleTouchMove, { passive: false });
    target.addEventListener('touchend', this.handleTouchEnd, { passive: false });
    target.addEventListener('touchcancel', this.handleTouchCancel, { passive: false });

    // 添加鼠标事件监听器（用于桌面端支持）
    target.addEventListener('mousedown', this.handleMouseDown, { passive: false });
    target.addEventListener('mousemove', this.handleMouseMove, { passive: false });
    target.addEventListener('mouseup', this.handleMouseUp, { passive: false });
    target.addEventListener('mouseleave', this.handleMouseUp, { passive: false });

    if (this.config.enableTouchFeedback) {
      target.style.cursor = 'pointer';
    }
  }

  /**
   * 解绑目标元素
   */
  unbind(): void {
    if (!this.target) return;

    // 清理计时器
    this.clearTimers();

    // 移除事件监听器
    this.target.removeEventListener('touchstart', this.handleTouchStart);
    this.target.removeEventListener('touchmove', this.handleTouchMove);
    this.target.removeEventListener('touchend', this.handleTouchEnd);
    this.target.removeEventListener('touchcancel', this.handleTouchCancel);
    
    this.target.removeEventListener('mousedown', this.handleMouseDown);
    this.target.removeEventListener('mousemove', this.handleMouseMove);
    this.target.removeEventListener('mouseup', this.handleMouseUp);
    this.target.removeEventListener('mouseleave', this.handleMouseUp);

    this.target = null;
    this.resetState();
  }

  /**
   * 清理所有计时器
   */
  private clearTimers(): void {
    if (this.longPressTimer) {
      clearTimeout(this.longPressTimer);
      this.longPressTimer = null;
    }
    
    if (this.doubleTapTimer) {
      clearTimeout(this.doubleTapTimer);
      this.doubleTapTimer = null;
    }
  }

  /**
   * 重置手势状态
   */
  private resetState(): void {
    this.activeTouches.clear();
    this.previousTouches.clear();
    this.isDragging = false;
    this.dragStartPosition = null;
    this.initialPinchDistance = null;
    this.initialRotationAngle = null;
  }

  /**
   * 从触摸事件中获取位置
   * @param event 触摸事件或鼠标事件
   * @param touchIndex 触摸点索引（默认为0）
   * @returns 位置对象
   */
  private getEventPosition(event: TouchEvent | MouseEvent, touchIndex: number = 0): { x: number; y: number } {
    if ('touches' in event && event.touches.length > 0) {
      const touch = event.touches[touchIndex];
      return { x: touch.clientX, y: touch.clientY };
    } else {
      return { x: (event as MouseEvent).clientX, y: (event as MouseEvent).clientY };
    }
  }

  /**
   * 创建手势事件数据
   * @param type 手势类型
   * @param touches 触摸点数组
   * @returns 手势事件数据
   */
  private createGestureEventData(
    type: GestureEventData['type'] | DragEventData['type'],
    touches: TouchPoint[]
  ): GestureEventData | DragEventData {
    const position = this.calculateCenterPosition(touches);
    const baseEvent = {
      type,
      timestamp: Date.now(),
      source: this.target,
      touches: touches.map(touch => ({ ...touch })),
      position
    };

    // 对于拖拽事件，添加额外的必要字段
    if (['dragStart', 'dragMove', 'dragEnd', 'dragEnter', 'dragLeave', 'drop'].includes(type)) {
      return {
        ...baseEvent as any,
        delta: { x: 0, y: 0 }
      } as DragEventData;
    }

    return baseEvent as GestureEventData;
  }

  /**
   * 计算触摸点的中心位置
   * @param touches 触摸点数组
   * @returns 中心位置
   */
  private calculateCenterPosition(touches: TouchPoint[]): { x: number; y: number } {
    if (touches.length === 0) {
      return { x: 0, y: 0 };
    }
    
    const sum = touches.reduce((acc, touch) => {
      acc.x += touch.x;
      acc.y += touch.y;
      return acc;
    }, { x: 0, y: 0 });
    
    return {
      x: sum.x / touches.length,
      y: sum.y / touches.length
    };
  }

  /**
   * 检查是否为双击
   * @param position 当前点击位置
   * @returns 是否为双击
   */
  private isDoubleTap(position: { x: number; y: number }): boolean {
    const now = Date.now();
    const timeDiff = now - this.lastTapTime;
    
    // 检查时间差
    if (timeDiff > 0 && timeDiff < this.config.doubleTapDelay!) {
      // 检查位置是否接近
      if (this.lastTapPosition) {
        const distance = Math.sqrt(
          Math.pow(position.x - this.lastTapPosition.x, 2) +
          Math.pow(position.y - this.lastTapPosition.y, 2)
        );
        
        if (distance < 25) { // 25像素内视为同一位置
          return true;
        }
      }
    }
    
    this.lastTapTime = now;
    this.lastTapPosition = position;
    return false;
  }

  /**
   * 触摸开始处理函数
   */
  private handleTouchStart = (event: TouchEvent): void => {
    // 清除之前的计时器
    this.clearTimers();
    
    // 保存当前触摸点为上一次触摸点
    this.previousTouches.clear();
    this.activeTouches.forEach(touch => {
      this.previousTouches.set(touch.id, new TouchPoint(touch.id, touch.x, touch.y));
    });
    
    // 记录新的触摸点
    Array.from(event.changedTouches).forEach(touch => {
      const touchPoint = new TouchPoint(touch.identifier, touch.clientX, touch.clientY);
      this.activeTouches.set(touch.identifier, touchPoint);
    });
    
    const touchesArray = Array.from(this.activeTouches.values());
    
    // 启动长按检测
    if (touchesArray.length === 1) {
      this.longPressTimer = setTimeout(() => {
        const longPressEvent = this.createGestureEventData('press', touchesArray);
        this.eventHandler.emit(longPressEvent);
        this.longPressTimer = null;
      }, this.config.longPressDelay);
    }
    
    // 对于多点触控，记录初始状态用于计算缩放和旋转
    if (touchesArray.length === 2) {
      const [touch1, touch2] = touchesArray;
      this.initialPinchDistance = touch1.distanceTo(touch2);
      this.initialRotationAngle = touch1.angleTo(touch2);
    }
    
    // 标记拖拽开始位置
    if (!this.isDragging) {
      this.dragStartPosition = this.getEventPosition(event);
    }
  };

  /**
   * 触摸移动处理函数
   */
  private handleTouchMove = (event: TouchEvent): void => {
    const touchesArray = Array.from(this.activeTouches.values());
    
    // 更新触摸点位置
    Array.from(event.changedTouches).forEach(touch => {
      const existingTouch = this.activeTouches.get(touch.identifier);
      if (existingTouch) {
        existingTouch.update(touch.clientX, touch.clientY);
      }
    });
    
    // 检查是否开始拖拽
    if (!this.isDragging && this.dragStartPosition) {
      const currentPosition = this.getEventPosition(event);
      const distance = Math.sqrt(
        Math.pow(currentPosition.x - this.dragStartPosition.x, 2) +
        Math.pow(currentPosition.y - this.dragStartPosition.y, 2)
      );
      
      if (distance >= this.config.dragThreshold!) {
        this.isDragging = true;
        this.clearTimers(); // 取消长按检测
        
        // 触发拖拽开始事件
        const dragStartEvent = this.createGestureEventData('dragStart', touchesArray);
        dragStartEvent.source = this.target;
        dragStartEvent.position = this.dragStartPosition!;
        dragStartEvent.delta = { x: 0, y: 0 };
        this.eventHandler.emit(dragStartEvent);
      }
    }
    
    // 处理拖拽移动
    if (this.isDragging) {
      const currentPosition = this.getEventPosition(event);
      const delta = {
        x: currentPosition.x - (this.dragStartPosition?.x || 0),
        y: currentPosition.y - (this.dragStartPosition?.y || 0)
      };
      
      const dragMoveEvent = this.createGestureEventData('dragMove', touchesArray);
      dragMoveEvent.source = this.target;
      dragMoveEvent.position = currentPosition;
      dragMoveEvent.delta = delta;
      this.eventHandler.emit(dragMoveEvent);
    }
    
    // 处理多点触控手势
    if (touchesArray.length === 2) {
      const [touch1, touch2] = touchesArray;
      
      // 计算缩放
      if (this.initialPinchDistance !== null) {
        const currentDistance = touch1.distanceTo(touch2);
        const scale = currentDistance / this.initialPinchDistance;
        
        const pinchEvent = this.createGestureEventData('pinch', touchesArray);
        pinchEvent.distance = currentDistance;
        pinchEvent.data = { scale };
        this.eventHandler.emit(pinchEvent);
      }
      
      // 计算旋转
      if (this.initialRotationAngle !== null) {
        const currentAngle = touch1.angleTo(touch2);
        const rotation = currentAngle - this.initialRotationAngle;
        
        const rotateEvent = this.createGestureEventData('rotate', touchesArray);
        rotateEvent.angle = rotation;
        this.eventHandler.emit(rotateEvent);
      }
    }
    
    // 处理滑动（在单点触控且移动距离较大时）
    if (touchesArray.length === 1) {
      const touch = touchesArray[0];
      const previousTouch = this.previousTouches.get(touch.id);
      
      if (previousTouch) {
        const dx = touch.x - previousTouch.x;
        const dy = touch.y - previousTouch.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        // 如果移动距离超过滑动阈值，触发滑动更新事件
        if (distance > this.config.swipeMinDistance!) {
          let direction: 'up' | 'down' | 'left' | 'right' | undefined;
          
          if (Math.abs(dx) > Math.abs(dy)) {
            direction = dx > 0 ? 'right' : 'left';
          } else {
            direction = dy > 0 ? 'down' : 'up';
          }
          
          const swipeEvent = this.createGestureEventData('swipe', touchesArray);
          swipeEvent.direction = direction;
          swipeEvent.distance = distance;
          this.eventHandler.emit(swipeEvent);
        }
      }
    }
  };

  /**
   * 触摸结束处理函数
   */
  private handleTouchEnd = (event: TouchEvent): void => {
    const touchesArray = Array.from(this.activeTouches.values());
    
    // 标记结束的触摸点
    Array.from(event.changedTouches).forEach(touch => {
      const existingTouch = this.activeTouches.get(touch.identifier);
      if (existingTouch) {
        existingTouch.end();
        this.activeTouches.delete(touch.identifier);
      }
    });
    
    // 清除长按计时器
    this.clearTimers();
    
    // 处理拖拽结束
    if (this.isDragging) {
      this.isDragging = false;
      const dragEndEvent = this.createGestureEventData('dragEnd', touchesArray);
      dragEndEvent.source = this.target;
      this.eventHandler.emit(dragEndEvent);
      this.dragStartPosition = null;
    }
    
    // 处理点击
    if (touchesArray.length === 1) {
      const touch = touchesArray[0];
      const duration = touch.getDuration();
      const position = { x: touch.x, y: touch.y };
      
      // 如果触摸时间很短，可能是点击或双击
      if (duration < this.config.longPressDelay!) {
        if (this.isDoubleTap(position)) {
          // 双击事件
          const doubleTapEvent = this.createGestureEventData('doubleTap', touchesArray);
          doubleTapEvent.source = this.target;
          this.eventHandler.emit(doubleTapEvent);
        } else {
          // 单击事件（延迟触发，以便检测双击）
          this.doubleTapTimer = setTimeout(() => {
            const tapEvent = this.createGestureEventData('tap', touchesArray);
            tapEvent.source = this.target;
            this.eventHandler.emit(tapEvent);
            this.doubleTapTimer = null;
          }, this.config.doubleTapDelay);
        }
      }
    }
    
    // 重置多点触控状态
    if (this.activeTouches.size < 2) {
      this.initialPinchDistance = null;
      this.initialRotationAngle = null;
    }
    
    // 如果没有活动触摸点，重置状态
    if (this.activeTouches.size === 0) {
      this.resetState();
    }
  };

  /**
   * 触摸取消处理函数
   */
  private handleTouchCancel = (): void => {
    this.clearTimers();
    this.resetState();
  };

  /**
   * 鼠标按下处理函数（用于桌面端支持）
   */
  private handleMouseDown = (event: MouseEvent): void => {
    // 模拟触摸事件
    const touchEvent = {
      changedTouches: [{ identifier: 0, clientX: event.clientX, clientY: event.clientY } as Touch],
      touches: [{ identifier: 0, clientX: event.clientX, clientY: event.clientY } as Touch]
    } as unknown as TouchEvent;
    
    this.handleTouchStart(touchEvent);
  };

  /**
   * 鼠标移动处理函数（用于桌面端支持）
   */
  private handleMouseMove = (event: MouseEvent): void => {
    if (this.activeTouches.size === 0) return;
    
    // 模拟触摸事件
    const touchEvent = {
      changedTouches: [{ identifier: 0, clientX: event.clientX, clientY: event.clientY } as Touch],
      touches: [{ identifier: 0, clientX: event.clientX, clientY: event.clientY } as Touch]
    } as unknown as TouchEvent;
    
    this.handleTouchMove(touchEvent);
  };

  /**
   * 鼠标释放处理函数（用于桌面端支持）
   */
  private handleMouseUp = (event: MouseEvent): void => {
    if (this.activeTouches.size === 0) return;
    
    // 模拟触摸事件
    const touchEvent = {
      changedTouches: [{ identifier: 0, clientX: event.clientX, clientY: event.clientY } as Touch]
    } as unknown as TouchEvent;
    
    this.handleTouchEnd(touchEvent);
  };

  /**
   * 销毁手势处理器
   */
  destroy(): void {
    this.unbind();
    this.clearTimers();
    this.resetState();
  }
}

/**
 * 创建手势处理器实例
 * @param config 交互配置
 * @returns 手势处理器实例
 */
export function createGestureHandler(config: InteractionConfig = {}): GestureHandler {
  return new GestureHandler(config);
}

export default GestureHandler;

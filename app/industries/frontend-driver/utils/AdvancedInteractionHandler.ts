/**
 * @file 高级交互处理器实现
 * @description 实现复杂UI交互场景和组合手势处理
 * @module advancedInteractionHandler
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { EventHandlerInterface } from '../types/EventHandlerTypes';
import { createEventHandler } from './EventHandler';
import { createGestureHandler } from './GestureHandler';
import GestureHandler from './GestureHandler';
import { createKeyboardHandler } from './KeyboardHandler';
import KeyboardHandler from './KeyboardHandler';
import { createDragDropHandler } from './DragDropHandler';
import DragDropHandler from './DragDropHandler';
import { createAnimationHandler } from './AnimationHandler';
import AnimationHandler from './AnimationHandler';

/**
 * 交互状态类型
 */
export type InteractionState = 'idle' | 'hover' | 'active' | 'focus' | 'disabled';

/**
 * 交互配置选项
 */
interface InteractionOptions {
  /** 是否启用拖拽功能 */
  draggable?: boolean;
  /** 是否启用手势功能 */
  gestures?: boolean;
  /** 是否启用键盘功能 */
  keyboard?: boolean;
  /** 是否启用动画效果 */
  animations?: boolean;
  /** 禁用状态 */
  disabled?: boolean;
  /** 初始状态 */
  initialState?: InteractionState;
  /** 状态转换配置 */
  stateTransitions?: Partial<Record<InteractionState, InteractionState[]>>;
  /** 状态样式映射 */
  stateStyles?: Partial<Record<InteractionState, Record<string, string | number>>>;
  /** 状态事件回调 */
  stateCallbacks?: Partial<Record<InteractionState, (state: InteractionState) => void>>;
  /** 拖拽配置 */
  dragOptions?: any;
  /** 手势配置 */
  gestureOptions?: any;
  /** 键盘配置 */
  keyboardOptions?: any;
  /** 动画配置 */
  animationOptions?: any;
  /** 组合交互规则 */
  combinationRules?: Array<{
    /** 触发条件 */
    condition: (context: InteractionContext) => boolean;
    /** 执行动作 */
    action: (context: InteractionContext) => void;
    /** 优先级 */
    priority?: number;
  }>;
}

/**
 * 交互上下文
 */
interface InteractionContext {
  /** 交互元素 */
  element: HTMLElement;
  /** 当前状态 */
  currentState: InteractionState;
  /** 前一个状态 */
  previousState: InteractionState;
  /** 交互处理器实例 */
  handler: AdvancedInteractionHandler;
  /** 时间戳 */
  timestamp: number;
  /** 事件数据 */
  eventData?: any;
  /** 配置选项 */
  options: InteractionOptions;
}

/**
 * 交互事件类型
 */
type AdvancedInteractionEventType = 
  | 'stateChange' 
  | 'hoverStart' 
  | 'hoverEnd' 
  | 'focusIn' 
  | 'focusOut' 
  | 'activate' 
  | 'deactivate' 
  | 'disable' 
  | 'enable' 
  | 'interactionStart' 
  | 'interactionEnd' 
  | 'combinationTriggered';

/**
 * 高级交互事件数据
 */
interface AdvancedInteractionEventData {
  /** 事件类型 */
  type: AdvancedInteractionEventType;
  /** 交互上下文 */
  context: InteractionContext;
  /** 时间戳 */
  timestamp: number;
  /** 组合交互数据 */
  combinationData?: any;
}

/**
 * 高级交互处理器类
 */
class AdvancedInteractionHandler {
  /** 事件处理器 */
  private eventHandler: EventHandlerInterface<AdvancedInteractionEventData>;
  /** 手势处理器 */
  private gestureHandler?: GestureHandler;
  /** 键盘处理器 */
  private keyboardHandler?: KeyboardHandler;
  /** 拖拽处理器 */
  private dragDropHandler?: DragDropHandler;
  /** 动画处理器 */
  private animationHandler?: AnimationHandler;
  /** 交互元素映射 */
  private elements: Map<string, {
    element: HTMLElement;
    options: InteractionOptions;
    currentState: InteractionState;
    previousState: InteractionState;
    eventListeners: Array<{event: string; listener: EventListener | ((event: MouseEvent) => void) | ((event: KeyboardEvent) => void) | ((event: FocusEvent) => void)}>;
  }> = new Map();
  /** 组合交互规则 */
  private combinationRules: Array<{
    condition: (context: InteractionContext) => boolean;
    action: (context: InteractionContext) => void;
    priority: number;
  }> = [];

  /**
   * 构造函数
   */
  constructor() {
    this.eventHandler = createEventHandler();
    this.setupDefaultCombinationRules();
  }

  /**
   * 设置默认组合交互规则
   */
  private setupDefaultCombinationRules(): void {
    // 拖拽时禁用其他交互
    this.combinationRules.push({
      condition: (context) => context.currentState === 'active' && !!context.options.draggable,
      action: (_context) => {
        // 拖拽过程中可以添加特定处理
      },
      priority: 100
    });

    // 按下Ctrl/Cmd键时的增强交互
    this.combinationRules.push({
      condition: (context) => context.currentState === 'hover' && context.eventData?.ctrlKey,
      action: (context) => {
        // Ctrl/Cmd + 悬停时可以添加特定处理
        this.eventHandler.emit({
          type: 'combinationTriggered',
          context,
          timestamp: Date.now(),
          combinationData: { name: 'ctrlHover', data: context.eventData }
        });
      },
      priority: 50
    });

    // 长按+拖拽组合
    this.combinationRules.push({
      condition: (context) => context.currentState === 'active' && 
        context.eventData?.type === 'longPress' && 
        context.eventData?.dragging,
      action: (context) => {
        // 长按+拖拽时可以添加特定处理
        this.eventHandler.emit({
          type: 'combinationTriggered',
          context,
          timestamp: Date.now(),
          combinationData: { name: 'longPressDrag', data: context.eventData }
        });
      },
      priority: 80
    });
  }

  /**
   * 生成元素ID
   * @param element 元素
   * @returns 唯一ID
   */
  private generateElementId(element: HTMLElement): string {
    if (element.id) {
      return `interaction_${element.id}`;
    }
    return `interaction_${element.dataset.interactionId || 
      (element.dataset.interactionId = Date.now().toString(36) + Math.random().toString(36).substr(2))}`;
  }

  /**
   * 应用状态样式
   * @param context 交互上下文
   */
  private applyStateStyles(context: InteractionContext): void {
    const { element, currentState, options } = context;
    
    if (options.stateStyles && options.stateStyles[currentState]) {
      // 清除之前的样式类
      Object.keys(options.stateStyles).forEach(state => {
        element.classList.remove(`state-${state}`);
      });
      
      // 添加当前状态类
      element.classList.add(`state-${currentState}`);
      
      // 应用内联样式
      Object.entries(options.stateStyles[currentState]).forEach(([prop, value]) => {
        element.style.setProperty(prop, String(value));
      });
    }
  }

  /**
   * 应用状态转换动画
   * @param context 交互上下文
   */
  private applyStateTransitionAnimation(context: InteractionContext): void {
    const { element, currentState, previousState, options } = context;
    
    if (options.animations && this.animationHandler) {
      const animationConfig = {
        duration: 200,
        easing: 'easeInOut',
        ...options.animationOptions,
        fromStyle: options.stateStyles?.[previousState],
        toStyle: options.stateStyles?.[currentState]
      };
      
      this.animationHandler.animate(element, animationConfig);
    }
  }

  /**
   * 处理状态转换
   * @param context 交互上下文
   * @param newState 新状态
   * @returns 是否成功转换
   */
  private transitionToState(context: InteractionContext, newState: InteractionState): boolean {
    const { element, currentState, options } = context;
    
    // 检查是否禁用
    if (options.disabled && newState !== 'disabled') {
      return false;
    }
    
    // 检查状态转换规则
    if (options.stateTransitions && options.stateTransitions[currentState]) {
      const allowedStates = options.stateTransitions[currentState];
      if (!allowedStates.includes(newState)) {
        return false;
      }
    }
    
    // 更新状态
    const updatedContext = {
      ...context,
      previousState: currentState,
      currentState: newState,
      timestamp: Date.now()
    };
    
    // 应用样式和动画
    this.applyStateStyles(updatedContext);
    this.applyStateTransitionAnimation(updatedContext);
    
    // 触发状态回调
    if (options.stateCallbacks && options.stateCallbacks[newState]) {
      options.stateCallbacks[newState](newState);
    }
    
    // 更新存储的状态
    const elementId = this.generateElementId(element);
    const elementData = this.elements.get(elementId);
    if (elementData) {
      elementData.previousState = currentState;
      elementData.currentState = newState;
    }
    
    // 触发状态变更事件
    this.eventHandler.emit({
      type: 'stateChange',
      context: updatedContext,
      timestamp: Date.now()
    });
    
    // 触发特定状态事件
    switch (newState) {
      case 'hover':
        this.eventHandler.emit({
          type: 'hoverStart',
          context: updatedContext,
          timestamp: Date.now()
        });
        break;
      case 'idle':
        if (currentState === 'hover') {
          this.eventHandler.emit({
            type: 'hoverEnd',
            context: updatedContext,
            timestamp: Date.now()
          });
        }
        if (currentState === 'focus') {
          this.eventHandler.emit({
            type: 'focusOut',
            context: updatedContext,
            timestamp: Date.now()
          });
        }
        if (currentState === 'active') {
          this.eventHandler.emit({
            type: 'deactivate',
            context: updatedContext,
            timestamp: Date.now()
          });
        }
        break;
      case 'focus':
        this.eventHandler.emit({
          type: 'focusIn',
          context: updatedContext,
          timestamp: Date.now()
        });
        break;
      case 'active':
        this.eventHandler.emit({
          type: 'activate',
          context: updatedContext,
          timestamp: Date.now()
        });
        this.eventHandler.emit({
          type: 'interactionStart',
          context: updatedContext,
          timestamp: Date.now()
        });
        break;
      case 'disabled':
        this.eventHandler.emit({
          type: 'disable',
          context: updatedContext,
          timestamp: Date.now()
        });
        break;
    }
    
    // 检查组合交互规则
    this.checkCombinationRules(updatedContext);
    
    return true;
  }

  /**
   * 检查组合交互规则
   * @param context 交互上下文
   */
  private checkCombinationRules(context: InteractionContext): void {
    // 获取用户定义的规则
    const userRules = context.options.combinationRules || [];
    const allRules = [...userRules, ...this.combinationRules];
    
    // 按优先级排序并执行匹配的规则
    allRules
      .filter(rule => rule.condition(context))
      .sort((a, b) => (b.priority || 0) - (a.priority || 0))
      .forEach(rule => {
        try {
          rule.action(context);
        } catch (error) {
          console.error('组合交互规则执行错误:', error);
        }
      });
  }

  /**
   * 设置基础事件监听器
   * @param element 元素
   * @param options 选项
   */
  private setupBaseEventListeners(element: HTMLElement, options: InteractionOptions): void {
    const elementId = this.generateElementId(element);
    const elementData = this.elements.get(elementId);
    
    if (!elementData) return;
    
    const getContext = (event?: Event): InteractionContext => ({
      element,
      currentState: elementData.currentState,
      previousState: elementData.previousState,
      handler: this,
      timestamp: Date.now(),
      eventData: event,
      options
    });
    
    // 鼠标事件
    const handleMouseEnter = () => {
      if (!options.disabled) {
        this.transitionToState(getContext(), 'hover');
      }
    };
    
    const handleMouseLeave = () => {
      if (!options.disabled && elementData.currentState === 'hover') {
        this.transitionToState(getContext(), 'idle');
      }
    };
    
    const handleMouseDown = (event: MouseEvent) => {
      if (!options.disabled) {
        this.transitionToState(getContext(event), 'active');
      }
    };
    
    const handleMouseUp = (event: MouseEvent) => {
      if (!options.disabled && elementData.currentState === 'active') {
        this.transitionToState(getContext(event), 'hover');
        this.eventHandler.emit({
          type: 'interactionEnd',
          context: getContext(event),
          timestamp: Date.now()
        });
      }
    };
    
    // 焦点事件
    const handleFocus = (event: FocusEvent) => {
      if (!options.disabled) {
        this.transitionToState(getContext(event), 'focus');
      }
    };
    
    const handleBlur = (event: FocusEvent) => {
      if (!options.disabled && elementData.currentState === 'focus') {
        this.transitionToState(getContext(event), 'idle');
      }
    };
    
    // 键盘事件
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!options.disabled && event.key === 'Enter' || event.key === ' ') {
        this.transitionToState(getContext(event), 'active');
      }
    };
    
    const handleKeyUp = (event: KeyboardEvent) => {
      if (!options.disabled && 
          elementData.currentState === 'active' && 
          (event.key === 'Enter' || event.key === ' ')) {
        this.transitionToState(getContext(event), 'focus');
        this.eventHandler.emit({
          type: 'interactionEnd',
          context: getContext(event),
          timestamp: Date.now()
        });
      }
    };
    
    // 添加事件监听器
    element.addEventListener('mouseenter', handleMouseEnter);
    element.addEventListener('mouseleave', handleMouseLeave);
    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mouseup', handleMouseUp);
    element.addEventListener('focus', handleFocus);
    element.addEventListener('blur', handleBlur);
    element.addEventListener('keydown', handleKeyDown);
    element.addEventListener('keyup', handleKeyUp);
    
    // 存储事件监听器引用
    elementData.eventListeners = [
      { event: 'mouseenter', listener: handleMouseEnter },
      { event: 'mouseleave', listener: handleMouseLeave },
      { event: 'mousedown', listener: handleMouseDown },
      { event: 'mouseup', listener: handleMouseUp },
      { event: 'focus', listener: handleFocus },
      { event: 'blur', listener: handleBlur },
      { event: 'keydown', listener: handleKeyDown },
      { event: 'keyup', listener: handleKeyUp }
    ];
    
    // 启用其他交互功能
    if (options.draggable && this.dragDropHandler) {
      this.dragDropHandler.makeDraggable(element, options.dragOptions);
    }
    
    if (options.gestures && this.gestureHandler) {
      this.setupGestureListeners(element, options);
    }
    
    if (options.keyboard && this.keyboardHandler) {
      // 键盘处理器已经设置了基础事件
    }
  }

  /**
   * 设置手势事件监听器
   * @param element 元素
   * @param options 选项
   */
  private setupGestureListeners(element: HTMLElement, options: InteractionOptions): void {
    if (!this.gestureHandler) return;
    
    const elementId = this.generateElementId(element);
    const elementData = this.elements.get(elementId);
    
    if (!elementData) return;
    
    const getContext = (eventData?: any): InteractionContext => ({
      element,
      currentState: elementData.currentState,
      previousState: elementData.previousState,
      handler: this,
      timestamp: Date.now(),
      eventData,
      options
    });
    
    // 使用内部的eventHandler注册手势事件监听
    if (this.gestureHandler && (this.gestureHandler as any).eventHandler) {
      (this.gestureHandler as any).eventHandler.on('tap', (event: any) => {
        if (!options.disabled) {
          const context = getContext(event);
          this.transitionToState({ ...context, currentState: 'active' }, 'hover');
          
          // 触发tap事件
          this.eventHandler.emit({
            type: 'combinationTriggered',
            context,
            timestamp: Date.now(),
            combinationData: { name: 'tap', data: event }
          });
        }
      });

      (this.gestureHandler as any).eventHandler.on('doubleTap', (event: any) => {
        if (!options.disabled) {
          const context = getContext(event);
          
          // 触发doubleTap事件
          this.eventHandler.emit({
            type: 'combinationTriggered',
            context,
            timestamp: Date.now(),
            combinationData: { name: 'doubleTap', data: event }
          });
        }
      });

      (this.gestureHandler as any).eventHandler.on('longPress', (event: any) => {
        if (!options.disabled) {
          const context = getContext(event);
          this.transitionToState(context, 'active');
          
          // 触发longPress事件
          this.eventHandler.emit({
            type: 'combinationTriggered',
            context,
            timestamp: Date.now(),
            combinationData: { name: 'longPress', data: event }
          });
        }
      });
    }
    
    if (this.gestureHandler && (this.gestureHandler as any).eventHandler) {
        (this.gestureHandler as any).eventHandler.on('swipe', (event: any) => {
          if (!options.disabled) {
            const context = getContext(event);
            
            // 触发swipe事件
            this.eventHandler.emit({
              type: 'combinationTriggered',
              context,
              timestamp: Date.now(),
              combinationData: { name: 'swipe', data: event }
            });
          }
        });
      }
  }

  /**
   * 初始化元素交互
   * @param element 元素或选择器
   * @param options 配置选项
   * @returns 元素ID
   */
  initialize(element: HTMLElement | string, options: InteractionOptions = {}): string {
    // 获取目标元素
    const targetElement = typeof element === 'string' 
      ? document.querySelector<HTMLElement>(element) 
      : element;
    
    if (!targetElement) {
      console.error('交互目标元素不存在');
      return '';
    }
    
    // 确保必要的处理器已初始化
    this.ensureHandlers(options);
    
    // 合并默认选项
    const defaultOptions: InteractionOptions = {
      draggable: false,
      gestures: true,
      keyboard: true,
      animations: true,
      disabled: false,
      initialState: 'idle',
      stateTransitions: {},
      stateStyles: {},
      stateCallbacks: {},
      combinationRules: [],
      ...options
    };
    
    // 生成元素ID
    const elementId = this.generateElementId(targetElement);
    
    // 创建元素数据
    const initialState = defaultOptions.disabled ? 'disabled' : defaultOptions.initialState || 'idle';
    const elementData = {
      element: targetElement,
      options: defaultOptions,
      currentState: initialState,
      previousState: initialState,
      eventListeners: []
    };
    
    // 存储元素数据
    this.elements.set(elementId, elementData);
    
    // 设置初始状态
    const initialContext: InteractionContext = {
      element: targetElement,
      currentState: initialState,
      previousState: initialState,
      handler: this,
      timestamp: Date.now(),
      options: defaultOptions
    };
    
    this.applyStateStyles(initialContext);
    
    // 设置事件监听器
    this.setupBaseEventListeners(targetElement, defaultOptions);
    
    // 如果元素被禁用，触发禁用事件
    if (defaultOptions.disabled) {
      this.eventHandler.emit({
        type: 'disable',
        context: initialContext,
        timestamp: Date.now()
      });
    }
    
    return elementId;
  }

  /**
   * 确保必要的处理器已初始化
   * @param options 配置选项
   */
  private ensureHandlers(options: InteractionOptions): void {
    if ((options.gestures || options.combinationRules) && !this.gestureHandler) {
      this.gestureHandler = createGestureHandler();
    }
    
    if ((options.keyboard || options.keyboardOptions) && !this.keyboardHandler) {
      this.keyboardHandler = createKeyboardHandler();
    }
    
    if (options.draggable && !this.dragDropHandler) {
      this.dragDropHandler = createDragDropHandler();
    }
    
    if (options.animations && !this.animationHandler) {
      this.animationHandler = createAnimationHandler();
    }
  }

  /**
   * 更新元素状态
   * @param element 元素或元素ID
   * @param newState 新状态
   * @returns 是否成功更新
   */
  setState(element: HTMLElement | string, newState: InteractionState): boolean {
    // 获取元素ID
    let elementId: string;
    let targetElement: HTMLElement | null = null;
    
    if (typeof element === 'string') {
      // 检查是否是元素ID
      if (element.startsWith('interaction_')) {
        elementId = element;
        const storedElement = this.elements.get(elementId);
        if (storedElement) {
          targetElement = storedElement.element;
        }
      } else {
        // 否则作为选择器处理
        targetElement = document.querySelector<HTMLElement>(element);
        if (targetElement) {
          elementId = this.generateElementId(targetElement);
        } else {
          console.error('找不到目标元素');
          return false;
        }
      }
    } else {
      targetElement = element;
      elementId = this.generateElementId(element);
    }
    
    // 获取元素数据
    const elementData = this.elements.get(elementId);
    
    if (!elementData || !targetElement) {
      console.error('元素未初始化交互');
      return false;
    }
    
    // 创建上下文并转换状态
    const context: InteractionContext = {
      element: targetElement,
      currentState: elementData.currentState,
      previousState: elementData.previousState,
      handler: this,
      timestamp: Date.now(),
      options: elementData.options
    };
    
    return this.transitionToState(context, newState);
  }

  /**
   * 获取元素状态
   * @param element 元素或元素ID
   * @returns 当前状态或undefined
   */
  getState(element: HTMLElement | string): InteractionState | undefined {
    let elementId: string;
    
    if (typeof element === 'string') {
      // 检查是否是元素ID
      if (element.startsWith('interaction_')) {
        elementId = element;
      } else {
        // 作为选择器处理
        const targetElement = document.querySelector<HTMLElement>(element);
        if (!targetElement) {
          return undefined;
        }
        elementId = this.generateElementId(targetElement);
      }
    } else {
      elementId = this.generateElementId(element);
    }
    
    const elementData = this.elements.get(elementId);
    return elementData?.currentState;
  }

  /**
   * 启用元素交互
   * @param element 元素或元素ID
   */
  enable(element: HTMLElement | string): void {
    const elementData = this.getElementData(element);
    if (elementData) {
      elementData.options.disabled = false;
      this.setState(element, 'idle');
      
      // 重新启用事件监听器
      this.setupBaseEventListeners(elementData.element, elementData.options);
    }
  }

  /**
   * 禁用元素交互
   * @param element 元素或元素ID
   */
  disable(element: HTMLElement | string): void {
    const elementData = this.getElementData(element);
    if (elementData) {
      elementData.options.disabled = true;
      this.setState(element, 'disabled');
    }
  }

  /**
   * 获取元素数据
   * @param element 元素或元素ID
   * @returns 元素数据或undefined
   */
  private getElementData(element: HTMLElement | string): typeof this.elements extends Map<any, infer T> ? T | undefined : undefined {
    let elementId: string;
    
    if (typeof element === 'string') {
      // 检查是否是元素ID
      if (element.startsWith('interaction_')) {
        elementId = element;
      } else {
        // 作为选择器处理
        const targetElement = document.querySelector<HTMLElement>(element);
        if (!targetElement) {
          return undefined;
        }
        elementId = this.generateElementId(targetElement);
      }
    } else {
      elementId = this.generateElementId(element);
    }
    
    return this.elements.get(elementId);
  }

  /**
   * 销毁元素交互
   * @param element 元素或元素ID
   */
  destroy(element: HTMLElement | string): void {
    const elementData = this.getElementData(element);
    
    if (elementData) {
      const { element: targetElement, eventListeners } = elementData;
      
      // 移除事件监听器
      eventListeners.forEach(({ event, listener }) => {
        targetElement.removeEventListener(event as keyof HTMLElementEventMap, listener as EventListenerOrEventListenerObject);
      });
      
      // 还原样式
      targetElement.style.cssText = '';
      
      // 移除状态类
      Object.keys(elementData.options.stateStyles || {}).forEach(state => {
        targetElement.classList.remove(`state-${state}`);
      });
      
      // 从存储中移除
      const elementId = this.generateElementId(targetElement);
      this.elements.delete(elementId);
    }
  }

  /**
   * 销毁所有交互
   */
  destroyAll(): void {
    this.elements.forEach((elementData) => {
      this.destroy(elementData.element);
    });
    
    // 销毁处理器
    if (this.gestureHandler) {
      this.gestureHandler.destroy();
    }
    if (this.keyboardHandler) {
      this.keyboardHandler.destroy();
    }
    if (this.dragDropHandler) {
      this.dragDropHandler.destroy();
    }
    if (this.animationHandler) {
      this.animationHandler.destroy();
    }
    
    this.eventHandler.destroy();
  }

  /**
   * 监听交互事件
   * @param eventType 事件类型
   * @param listener 事件监听器
   * @returns 监听器ID
   */
  on(eventType: AdvancedInteractionEventType, listener: (event: AdvancedInteractionEventData) => void): string {
    return this.eventHandler.on(eventType, listener);
  }

  /**
   * 移除交互事件监听器
   * @param eventType 事件类型
   * @param listenerOrId 事件监听器或监听器ID
   */
  off(eventType: AdvancedInteractionEventType, listenerOrId: ((event: AdvancedInteractionEventData) => void) | string): void {
    this.eventHandler.off(eventType, listenerOrId);
  }

  /**
   * 添加组合交互规则
   * @param rule 组合规则
   */
  addCombinationRule(rule: {
    condition: (context: InteractionContext) => boolean;
    action: (context: InteractionContext) => void;
    priority?: number;
  }): void {
    this.combinationRules.push({
      ...rule,
      priority: rule.priority ?? 0
    });
  }

  /**
   * 移除组合交互规则
   * @param index 规则索引
   */
  removeCombinationRule(index: number): void {
    if (index >= 0 && index < this.combinationRules.length) {
      this.combinationRules.splice(index, 1);
    }
  }

  /**
   * 清空组合交互规则
   */
  clearCombinationRules(): void {
    this.combinationRules = [];
  }

  /**
   * 获取所有交互元素
   * @returns 元素数组
   */
  getInteractingElements(): HTMLElement[] {
    return Array.from(this.elements.values()).map(data => data.element);
  }

  /**
   * 获取特定状态的元素
   * @param state 状态
   * @returns 元素数组
   */
  getElementsByState(state: InteractionState): HTMLElement[] {
    return Array.from(this.elements.values())
      .filter(data => data.currentState === state)
      .map(data => data.element);
  }
}

/**
 * 创建高级交互处理器实例
 * @returns 高级交互处理器实例
 */
export function createAdvancedInteractionHandler(): AdvancedInteractionHandler {
  return new AdvancedInteractionHandler();
}

/**
 * 全局高级交互处理器实例
 */
export const globalAdvancedInteractionHandler = createAdvancedInteractionHandler();

export default AdvancedInteractionHandler;

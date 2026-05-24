/**
 * @file 动画效果处理器实现
 * @description 实现UI动画和过渡效果管理功能
 * @module animationHandler
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { EventHandlerInterface } from '../types/EventHandlerTypes';
import { createEventHandler } from './EventHandler';

/**
 * 动画配置选项
 */
interface AnimationOptions {
  /** 动画持续时间（毫秒） */
  duration?: number;
  /** 动画延迟（毫秒） */
  delay?: number;
  /** 动画缓动函数 */
  easing?: string;
  /** 是否使用CSS过渡 */
  useTransition?: boolean;
  /** 是否循环播放 */
  loop?: boolean;
  /** 动画播放次数 */
  iterations?: number | 'infinite';
  /** 动画方向 */
  direction?: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  /** 动画填充模式 */
  fillMode?: 'none' | 'forwards' | 'backwards' | 'both';
  /** 动画播放状态 */
  playState?: 'running' | 'paused';
  /** 动画名称 */
  animationName?: string;
  /** 自定义CSS属性 */
  customProperties?: Record<string, string | number>;
  /** 初始样式 */
  fromStyle?: Record<string, string | number>;
  /** 结束样式 */
  toStyle?: Record<string, string | number>;
  /** 关键帧定义 */
  keyframes?: Record<string, Record<string, string | number>>;
  /** 动画开始回调 */
  onStart?: () => void;
  /** 动画进行中回调 */
  onProgress?: (progress: number, elapsed: number) => void;
  /** 动画结束回调 */
  onEnd?: () => void;
  /** 动画取消回调 */
  onCancel?: () => void;
}

/**
 * 动画实例
 */
interface AnimationInstance {
  /** 动画ID */
  id: string;
  /** 目标元素 */
  element: HTMLElement;
  /** 动画配置 */
  options: AnimationOptions;
  /** 动画控制器 */
  animation?: Animation;
  /** 动画帧ID */
  animationFrameId?: number | undefined;
  /** 开始时间戳 */
  startTime?: number;
  /** 当前时间戳 */
  currentTime?: number;
  /** 累积时间（考虑暂停） */
  accumulatedTime?: number;
  /** 是否暂停 */
  paused: boolean;
  /** 是否完成 */
  completed: boolean;
  /** 初始样式（用于还原） */
  originalStyle: Record<string, string>;
  /** 动画名称（用于CSS动画） */
  animationName?: string;
}

/**
 * 预定义缓动函数
 */
const EASING_FUNCTIONS: Record<string, string> = {
  linear: 'cubic-bezier(0, 0, 1, 1)',
  ease: 'cubic-bezier(0.25, 0.1, 0.25, 1)',
  easeIn: 'cubic-bezier(0.42, 0, 1, 1)',
  easeOut: 'cubic-bezier(0, 0, 0.58, 1)',
  easeInOut: 'cubic-bezier(0.42, 0, 0.58, 1)',
  easeInQuad: 'cubic-bezier(0.55, 0.085, 0.68, 0.53)',
  easeInCubic: 'cubic-bezier(0.55, 0.055, 0.675, 0.19)',
  easeInQuart: 'cubic-bezier(0.895, 0.03, 0.685, 0.22)',
  easeInQuint: 'cubic-bezier(0.755, 0.05, 0.855, 0.06)',
  easeInSine: 'cubic-bezier(0.47, 0, 0.745, 0.715)',
  easeInExpo: 'cubic-bezier(0.95, 0.05, 0.795, 0.035)',
  easeInCirc: 'cubic-bezier(0.6, 0.04, 0.98, 0.335)',
  easeOutQuad: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
  easeOutCubic: 'cubic-bezier(0.215, 0.61, 0.355, 1)',
  easeOutQuart: 'cubic-bezier(0.165, 0.84, 0.44, 1)',
  easeOutQuint: 'cubic-bezier(0.23, 1, 0.32, 1)',
  easeOutSine: 'cubic-bezier(0.39, 0.575, 0.565, 1)',
  easeOutExpo: 'cubic-bezier(0.19, 1, 0.22, 1)',
  easeOutCirc: 'cubic-bezier(0.075, 0.82, 0.165, 1)',
  easeInOutQuad: 'cubic-bezier(0.455, 0.03, 0.515, 0.955)',
  easeInOutCubic: 'cubic-bezier(0.645, 0.045, 0.355, 1)',
  easeInOutQuart: 'cubic-bezier(0.77, 0, 0.175, 1)',
  easeInOutQuint: 'cubic-bezier(0.86, 0, 0.07, 1)',
  easeInOutSine: 'cubic-bezier(0.445, 0.05, 0.55, 0.95)',
  easeInOutExpo: 'cubic-bezier(1, 0, 0, 1)',
  easeInOutCirc: 'cubic-bezier(0.785, 0.135, 0.15, 0.86)'
};

/**
 * 动画事件类型
 */
type AnimationEventType = 'start' | 'progress' | 'end' | 'cancel' | 'pause' | 'resume';

/**
 * 动画事件数据
 */
interface AnimationEventData {
  /** 事件类型 */
  type: AnimationEventType;
  /** 动画实例 */
  animation: AnimationInstance;
  /** 动画进度 */
  progress?: number;
  /** 已用时间 */
  elapsedTime?: number;
  /** 时间戳 */
  timestamp: number;
}

/**
 * 动画处理器类
 */
class AnimationHandler {
  /** 动画实例映射 */
  private animations: Map<string, AnimationInstance> = new Map();
  /** 事件处理器 */
  private eventHandler: EventHandlerInterface<AnimationEventData>;
  /** 关键帧样式表 */
  private keyframesStyleSheet: CSSStyleSheet | null = null;
  /** 关键帧计数器 */
  private keyframeCounter: number = 0;

  /**
   * 构造函数
   */
  constructor() {
    this.eventHandler = createEventHandler();
    this.initKeyframesStyleSheet();
  }

  /**
   * 初始化关键帧样式表
   */
  private initKeyframesStyleSheet(): void {
    if (typeof document !== 'undefined') {
      this.keyframesStyleSheet = document.createElement('style').sheet;
      if (this.keyframesStyleSheet && document.head && this.keyframesStyleSheet.ownerNode) {
        document.head.appendChild(this.keyframesStyleSheet.ownerNode);
      }
    }
  }

  /**
   * 创建唯一ID
   * @returns 唯一ID
   */
  private generateId(): string {
    return `animation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取缓动函数
   * @param easing 缓动函数名称或自定义缓动函数
   * @returns 缓动函数
   */
  private getEasing(easing: string): string {
    return EASING_FUNCTIONS[easing] || easing;
  }

  /**
   * 保存元素初始样式
   * @param element 目标元素
   * @returns 初始样式对象
   */
  private saveOriginalStyle(element: HTMLElement): Record<string, string> {
    const originalStyle: Record<string, string> = {};
    const computedStyle = window.getComputedStyle(element);
    
    // 保存常见动画相关样式属性
    const properties = [
      'opacity', 'transform', 'transition', 'animation',
      'top', 'left', 'right', 'bottom',
      'width', 'height', 'maxWidth', 'maxHeight',
      'color', 'backgroundColor', 'border', 'borderRadius'
    ];
    
    properties.forEach(prop => {
      originalStyle[prop] = computedStyle.getPropertyValue(prop);
    });
    
    return originalStyle;
  }

  /**
   * 还原元素初始样式
   * @param instance 动画实例
   */
  private restoreOriginalStyle(instance: AnimationInstance): void {
    const { element, originalStyle } = instance;
    
    Object.entries(originalStyle).forEach(([prop, value]) => {
      element.style.setProperty(prop, value);
    });
    
    // 清除动画相关样式
    element.style.animation = '';
    element.style.transition = '';
  }

  /**
   * 创建关键帧动画
   * @param keyframes 关键帧定义
   * @returns 动画名称
   */
  private createKeyframes(keyframes: Record<string, Record<string, string | number>>): string {
    if (!this.keyframesStyleSheet) {
      return '';
    }
    
    const animationName = `custom-keyframes-${this.keyframeCounter++}`;
    let keyframesRule = `@keyframes ${animationName} {`;
    
    Object.entries(keyframes).forEach(([percentage, styles]) => {
      keyframesRule += `${percentage}% {`;
      Object.entries(styles).forEach(([prop, value]) => {
        keyframesRule += `${prop}: ${value};`;
      });
      keyframesRule += '}';
    });
    
    keyframesRule += '}';
    
    try {
      this.keyframesStyleSheet.insertRule(keyframesRule, this.keyframesStyleSheet.cssRules.length);
    } catch (error) {
      console.error('创建关键帧规则失败:', error);
    }
    
    return animationName;
  }

  /**
   * 应用CSS动画
   * @param instance 动画实例
   */
  private applyCSSAnimation(instance: AnimationInstance): void {
    const { element, options } = instance;
    let animationName = options.animationName || '';
    
    // 如果提供了关键帧定义，则创建关键帧动画
    if (options.keyframes) {
      animationName = this.createKeyframes(options.keyframes);
      instance.animationName = animationName;
    } else if (options.fromStyle && options.toStyle) {
      // 如果提供了fromStyle和toStyle，创建简单的关键帧动画
      const keyframes: Record<string, Record<string, string | number>> = {
        '0': options.fromStyle,
        '100': options.toStyle
      };
      animationName = this.createKeyframes(keyframes);
      instance.animationName = animationName;
    }
    
    if (!animationName) {
      return;
    }
    
    // 设置CSS动画属性
    element.style.animation = `${animationName} ${options.duration || 300}ms ${this.getEasing(options.easing || 'ease')} ${options.delay || 0}ms ${options.iterations || 1} ${options.direction || 'normal'} ${options.fillMode || 'forwards'}`;
    element.style.animationPlayState = options.playState || 'running';
    
    // 监听动画结束事件
    const handleAnimationEnd = () => {
      element.removeEventListener('animationend', handleAnimationEnd);
      this.handleAnimationComplete(instance);
    };
    
    element.addEventListener('animationend', handleAnimationEnd);
    
    // 触发动画开始回调
    if (options.onStart) {
      options.onStart();
    }
    
    // 触发动画开始事件
    this.eventHandler.emit({
      type: 'start',
      animation: instance,
      timestamp: Date.now()
    });
  }

  /**
   * 应用CSS过渡
   * @param instance 动画实例
   */
  private applyCSSTransition(instance: AnimationInstance): void {
    const { element, options } = instance;
    
    // 设置过渡属性
    const transitionProperties = Object.keys(options.toStyle || {});
    if (transitionProperties.length === 0) {
      return;
    }
    
    element.style.transition = `${transitionProperties.join(', ')} ${options.duration || 300}ms ${this.getEasing(options.easing || 'ease')} ${options.delay || 0}ms`;
    
    // 应用初始样式
    if (options.fromStyle) {
      Object.entries(options.fromStyle).forEach(([prop, value]) => {
        element.style.setProperty(prop, String(value));
      });
    }
    
    // 强制重绘
    element.offsetHeight; // 触发重排
    
    // 应用结束样式
    setTimeout(() => {
      if (options.toStyle) {
        Object.entries(options.toStyle).forEach(([prop, value]) => {
          element.style.setProperty(prop, String(value));
        });
      }
      
      // 触发动画开始回调
      if (options.onStart) {
        options.onStart();
      }
      
      // 触发动画开始事件
      this.eventHandler.emit({
        type: 'start',
        animation: instance,
        timestamp: Date.now()
      });
      
      // 监听过渡结束事件
      const handleTransitionEnd = () => {
        element.removeEventListener('transitionend', handleTransitionEnd);
        this.handleAnimationComplete(instance);
      };
      
      element.addEventListener('transitionend', handleTransitionEnd);
      
      // 设置定时器作为后备
      setTimeout(() => {
        if (!instance.completed) {
          this.handleAnimationComplete(instance);
        }
      }, (options.delay || 0) + (options.duration || 300) + 10);
    }, 0);
  }

  /**
   * 处理JavaScript动画（requestAnimationFrame）
   * @param instance 动画实例
   */
  private handleJSAnimation(instance: AnimationInstance): void {
    const { options } = instance;
    const startTime = Date.now() - (instance.accumulatedTime || 0);
    const duration = options.duration || 300;
    
    instance.startTime = startTime;
    
    const animate = () => {
      if (!instance.paused) {
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 计算缓动进度
        const easedProgress = this.calculateEasing(progress, options.easing || 'ease');
        
        // 更新动画实例状态
        instance.currentTime = currentTime;
        instance.accumulatedTime = elapsed;
        
        // 触发进度回调
        if (options.onProgress) {
          options.onProgress(easedProgress, elapsed);
        }
        
        // 触发进度事件
        this.eventHandler.emit({
          type: 'progress',
          animation: instance,
          progress: easedProgress,
          elapsedTime: elapsed,
          timestamp: currentTime
        });
        
        // 检查动画是否完成
        if (progress >= 1) {
          this.handleAnimationComplete(instance);
        } else {
          // 继续动画
          instance.animationFrameId = requestAnimationFrame(animate);
        }
      }
    };
    
    // 开始动画
    instance.animationFrameId = requestAnimationFrame(animate);
    
    // 触发动画开始回调
    if (options.onStart) {
      options.onStart();
    }
    
    // 触发动画开始事件
    this.eventHandler.emit({
      type: 'start',
      animation: instance,
      timestamp: Date.now()
    });
  }

  /**
   * 计算缓动函数
   * @param progress 线性进度 (0-1)
   * @param easing 缓动函数名称
   * @returns 缓动后的进度 (0-1)
   */
  private calculateEasing(progress: number, easing: string): number {
    // 这里可以实现更多缓动函数的计算
    // 简化版实现，只处理基本的缓动函数
    switch (easing) {
      case 'linear':
        return progress;
      case 'easeIn':
        return progress * progress;
      case 'easeOut':
        return progress * (2 - progress);
      case 'easeInOut':
        return progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;
      default:
        return progress;
    }
  }

  /**
   * 处理动画完成
   * @param instance 动画实例
   */
  private handleAnimationComplete(instance: AnimationInstance): void {
    const { options, id } = instance;
    
    // 更新动画实例状态
    instance.completed = true;
    instance.paused = false;
    
    // 清除动画帧
    if (instance.animationFrameId) {
      cancelAnimationFrame(instance.animationFrameId);
      instance.animationFrameId = undefined;
    }
    
    // 处理循环播放
    if (options.loop || options.iterations === 'infinite') {
      // 重置动画状态
      instance.completed = false;
      instance.accumulatedTime = 0;
      instance.startTime = Date.now();
      
      // 重新开始动画
      if (options.useTransition) {
        this.applyCSSTransition(instance);
      } else if (options.keyframes || (options.fromStyle && options.toStyle)) {
        this.applyCSSAnimation(instance);
      } else {
        this.handleJSAnimation(instance);
      }
      
      return;
    }
    
    // 触发动画结束回调
    if (options.onEnd) {
      options.onEnd();
    }
    
    // 触发动画结束事件
    this.eventHandler.emit({
      type: 'end',
      animation: instance,
      progress: 1,
      elapsedTime: options.duration || 300,
      timestamp: Date.now()
    });
    
    // 如果没有设置fillMode为forwards，则还原样式
    if (options.fillMode !== 'forwards' && options.fillMode !== 'both') {
      setTimeout(() => {
        this.restoreOriginalStyle(instance);
      }, 0);
    }
    
    // 从动画映射中移除
    this.animations.delete(id);
  }

  /**
   * 创建动画
   * @param element 目标元素或选择器
   * @param options 动画配置
   * @returns 动画实例ID
   */
  animate(element: HTMLElement | string, options: AnimationOptions = {}): string {
    // 获取目标元素
    const targetElement = typeof element === 'string' 
      ? document.querySelector<HTMLElement>(element) 
      : element;
    
    if (!targetElement) {
      console.error('动画目标元素不存在');
      return '';
    }
    
    // 创建动画实例
    const id = this.generateId();
    const defaultOptions: AnimationOptions = {
      duration: 300,
      delay: 0,
      easing: 'ease',
      useTransition: false,
      loop: false,
      iterations: 1,
      direction: 'normal',
      fillMode: 'forwards',
      playState: 'running',
      ...options
    };
    
    const instance: AnimationInstance = {
      id,
      element: targetElement,
      options: defaultOptions,
      paused: false,
      completed: false,
      originalStyle: this.saveOriginalStyle(targetElement)
    };
    
    // 应用自定义CSS属性
    if (defaultOptions.customProperties) {
      Object.entries(defaultOptions.customProperties).forEach(([prop, value]) => {
        targetElement.style.setProperty(prop, String(value));
      });
    }
    
    // 存储动画实例
    this.animations.set(id, instance);
    
    // 根据配置选择动画方式
    if ((defaultOptions.delay ?? 0) > 0) {
      // 处理延迟
      setTimeout(() => {
        if (!instance.completed) {
          this.startAnimation(instance);
        }
      }, defaultOptions.delay);
    } else {
      // 立即开始动画
      this.startAnimation(instance);
    }
    
    return id;
  }

  /**
   * 开始动画
   * @param instance 动画实例
   */
  private startAnimation(instance: AnimationInstance): void {
    const { options } = instance;
    
    if (options.useTransition && options.toStyle) {
      this.applyCSSTransition(instance);
    } else if ((options.keyframes || (options.fromStyle && options.toStyle)) && typeof window !== 'undefined') {
      this.applyCSSAnimation(instance);
    } else {
      this.handleJSAnimation(instance);
    }
  }

  /**
   * 暂停动画
   * @param id 动画实例ID
   * @returns 是否成功暂停
   */
  pause(id: string): boolean {
    const instance = this.animations.get(id);
    if (!instance || instance.completed) {
      return false;
    }
    
    instance.paused = true;
    
    // 清除动画帧
    if (instance.animationFrameId) {
      cancelAnimationFrame(instance.animationFrameId);
    }
    
    // 更新CSS动画状态
    if (instance.element && instance.animationName) {
      instance.element.style.animationPlayState = 'paused';
    }
    
    // 触发暂停事件
    this.eventHandler.emit({
      type: 'pause',
      animation: instance,
      timestamp: Date.now()
    });
    
    return true;
  }

  /**
   * 恢复动画
   * @param id 动画实例ID
   * @returns 是否成功恢复
   */
  resume(id: string): boolean {
    const instance = this.animations.get(id);
    if (!instance || instance.completed || !instance.paused) {
      return false;
    }
    
    instance.paused = false;
    
    // 更新CSS动画状态
    if (instance.element && instance.animationName) {
      instance.element.style.animationPlayState = 'running';
    }
    
    // 如果是JS动画，重新开始动画帧
    if (!instance.options.useTransition && !instance.options.keyframes) {
      this.handleJSAnimation(instance);
    }
    
    // 触发恢复事件
    this.eventHandler.emit({
      type: 'resume',
      animation: instance,
      timestamp: Date.now()
    });
    
    return true;
  }

  /**
   * 取消动画
   * @param id 动画实例ID
   * @param restoreStyle 是否还原样式
   * @returns 是否成功取消
   */
  cancel(id: string, restoreStyle: boolean = true): boolean {
    const instance = this.animations.get(id);
    if (!instance || instance.completed) {
      return false;
    }
    
    // 清除动画帧
    if (instance.animationFrameId) {
      cancelAnimationFrame(instance.animationFrameId);
    }
    
    // 更新动画实例状态
    instance.completed = true;
    instance.paused = false;
    
    // 触发取消回调
    if (instance.options.onCancel) {
      instance.options.onCancel();
    }
    
    // 触发取消事件
    this.eventHandler.emit({
      type: 'cancel',
      animation: instance,
      timestamp: Date.now()
    });
    
    // 还原样式
    if (restoreStyle) {
      this.restoreOriginalStyle(instance);
    }
    
    // 从动画映射中移除
    this.animations.delete(id);
    
    return true;
  }

  /**
   * 获取动画实例
   * @param id 动画实例ID
   * @returns 动画实例或undefined
   */
  getAnimation(id: string): AnimationInstance | undefined {
    return this.animations.get(id);
  }

  /**
   * 获取所有动画实例
   * @returns 动画实例数组
   */
  getAllAnimations(): AnimationInstance[] {
    return Array.from(this.animations.values());
  }

  /**
   * 监听动画事件
   * @param eventType 事件类型
   * @param listener 事件监听器
   * @returns 监听器ID
   */
  on(eventType: AnimationEventType, listener: (event: AnimationEventData) => void): string {
    return this.eventHandler.on(eventType, listener);
  }

  /**
   * 移除动画事件监听器
   * @param eventType 事件类型
   * @param listenerOrId 事件监听器或监听器ID
   */
  off(eventType: AnimationEventType, listenerOrId: ((event: AnimationEventData) => void) | string): void {
    this.eventHandler.off(eventType, listenerOrId);
  }

  /**
   * 创建预定义动画
   * @param element 目标元素
   * @param animationType 动画类型
   * @param options 动画选项
   * @returns 动画实例ID
   */
  createPresetAnimation(element: HTMLElement | string, animationType: string, options: AnimationOptions = {}): string {
    const presetAnimations: Record<string, Partial<AnimationOptions>> = {
      fadeIn: {
        fromStyle: { opacity: 0 },
        toStyle: { opacity: 1 },
        duration: 300
      },
      fadeOut: {
        fromStyle: { opacity: 1 },
        toStyle: { opacity: 0 },
        duration: 300
      },
      slideInUp: {
        fromStyle: { transform: 'translateY(100%)', opacity: 0 },
        toStyle: { transform: 'translateY(0)', opacity: 1 },
        duration: 300
      },
      slideInDown: {
        fromStyle: { transform: 'translateY(-100%)', opacity: 0 },
        toStyle: { transform: 'translateY(0)', opacity: 1 },
        duration: 300
      },
      slideInLeft: {
        fromStyle: { transform: 'translateX(-100%)', opacity: 0 },
        toStyle: { transform: 'translateX(0)', opacity: 1 },
        duration: 300
      },
      slideInRight: {
        fromStyle: { transform: 'translateX(100%)', opacity: 0 },
        toStyle: { transform: 'translateX(0)', opacity: 1 },
        duration: 300
      },
      bounce: {
        keyframes: {
          '0%, 20%, 53%, 80%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '40%, 43%': { transform: 'translate3d(0, -30px, 0)' },
          '70%': { transform: 'translate3d(0, -15px, 0)' },
          '90%': { transform: 'translate3d(0, -4px, 0)' }
        },
        duration: 1000
      },
      shake: {
        keyframes: {
          '0%, 100%': { transform: 'translate3d(0, 0, 0)' },
          '10%, 30%, 50%, 70%, 90%': { transform: 'translate3d(-10px, 0, 0)' },
          '20%, 40%, 60%, 80%': { transform: 'translate3d(10px, 0, 0)' }
        },
        duration: 800
      },
      pulse: {
        keyframes: {
          '0%': { transform: 'scale3d(1, 1, 1)' },
          '50%': { transform: 'scale3d(1.05, 1.05, 1.05)' },
          '100%': { transform: 'scale3d(1, 1, 1)' }
        },
        duration: 1000
      },
      rotate: {
        keyframes: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' }
        },
        duration: 1000
      }
    };
    
    const preset = presetAnimations[animationType] || {};
    const mergedOptions = { ...preset, ...options, useTransition: false };
    
    return this.animate(element, mergedOptions);
  }

  /**
   * 销毁动画处理器
   */
  destroy(): void {
    // 取消所有动画
    this.animations.forEach((_, id) => {
      this.cancel(id);
    });
    
    // 清除关键帧样式表
    if (this.keyframesStyleSheet && this.keyframesStyleSheet.ownerNode) {
      this.keyframesStyleSheet.ownerNode.remove();
    }
    
    // 清理事件处理器
    this.eventHandler.destroy();
  }
}

/**
 * 创建动画处理器实例
 * @returns 动画处理器实例
 */
export function createAnimationHandler(): AnimationHandler {
  return new AnimationHandler();
}

/**
 * 全局动画处理器实例
 */
export const globalAnimationHandler = createAnimationHandler();

export default AnimationHandler;

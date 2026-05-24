/**
 * @file 用户体验优化工具
 * @description 提供加载状态管理、动画效果、交互反馈等用户体验增强功能
 * @module utils/ux
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

import { throttle, debounce } from './performance';

/**
 * 加载状态类型
 */
export interface LoadingState {
  isLoading: boolean;
  message?: string;
  progress?: number;
  error?: string;
}

/**
 * 动画配置
 */
export interface AnimationConfig {
  duration?: number;
  easing?: string;
  delay?: number;
}

/**
 * 通知配置
 */
export interface NotificationConfig {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  title?: string;
  duration?: number;
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  closable?: boolean;
  onClose?: () => void;
  onClick?: () => void;
}

/**
 * 焦点管理服务
 */
class FocusManager {
  private focusStack: HTMLElement[] = [];
  private trappedElement: HTMLElement | null = null;
  private originalFocus: HTMLElement | null = null;

  /**
   * 保存当前焦点
   */
  saveFocus(): void {
    this.focusStack.push(document.activeElement as HTMLElement);
  }

  /**
   * 恢复之前保存的焦点
   */
  restoreFocus(): void {
    if (this.focusStack.length > 0) {
      const element = this.focusStack.pop()!;
      if (element && element.focus) {
        element.focus();
      }
    }
  }

  /**
   * 陷阱焦点在特定元素内
   */
  trapFocus(element: HTMLElement): void {
    this.trappedElement = element;
    this.originalFocus = document.activeElement as HTMLElement;
    
    // 获取可聚焦元素
    const focusableElements = Array.from(
      element.querySelectorAll(
        'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'  
      )
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    if (firstElement) {
      (firstElement as HTMLElement).focus();
    }

    // 添加键盘事件监听
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        // Tab + Shift 反向
        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            (lastElement as HTMLElement).focus();
          }
        } else {
          // 正向 Tab
          if (document.activeElement === lastElement) {
            event.preventDefault();
            (firstElement as HTMLElement).focus();
          }
        }
      } else if (event.key === 'Escape') {
        this.untrapFocus();
      }
    };

    element.addEventListener('keydown', handleKeyDown);
    
    // 存储清理函数
    (element as any).__focusTrapCleanup = () => {
      element.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * 取消焦点陷阱
   */
  untrapFocus(): void {
    if (this.trappedElement) {
      const cleanup = (this.trappedElement as any).__focusTrapCleanup;
      if (typeof cleanup === 'function') {
        cleanup();
      }
      
      if (this.originalFocus && this.originalFocus.focus) {
        this.originalFocus.focus();
      }
      
      this.trappedElement = null;
      this.originalFocus = null;
    }
  }
}

/**
 * 通知服务
 */
class NotificationService {
  private notificationContainer: HTMLElement | null = null;
  private notifications: Map<string, HTMLElement> = new Map();

  constructor() {
    this.initNotificationContainer();
  }

  /**
   * 初始化通知容器
   */
  private initNotificationContainer(): void {
    this.notificationContainer = document.createElement('div');
    this.notificationContainer.className = 'notification-container';
    this.notificationContainer.style.position = 'fixed';
    this.notificationContainer.style.zIndex = '9999';
    this.notificationContainer.style.pointerEvents = 'none';
    document.body.appendChild(this.notificationContainer);
  }

  /**
   * 创建通知
   */
  createNotification(config: NotificationConfig): string {
    const id = `notification-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const notification = document.createElement('div');
    notification.id = id;
    notification.className = `notification notification-${config.type}`;
    notification.style.position = 'relative';
    notification.style.pointerEvents = 'auto';
    notification.style.margin = '8px';
    notification.style.padding = '12px 16px';
    notification.style.borderRadius = '4px';
    notification.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.15)';
    notification.style.transition = 'all 0.3s ease';
    notification.style.opacity = '0';
    notification.style.transform = 'translateY(-10px)';

    // 设置通知样式
    switch (config.type) {
      case 'success':
        notification.style.backgroundColor = '#f0f9eb';
        notification.style.border = '1px solid #e1f3d8';
        notification.style.color = '#67c23a';
        break;
      case 'error':
        notification.style.backgroundColor = '#fef0f0';
        notification.style.border = '1px solid #fde2e2';
        notification.style.color = '#f56c6c';
        break;
      case 'warning':
        notification.style.backgroundColor = '#fdf6ec';
        notification.style.border = '1px solid #faecd8';
        notification.style.color = '#e6a23c';
        break;
      case 'info':
        notification.style.backgroundColor = '#edf2fc';
        notification.style.border = '1px solid #ebeef5';
        notification.style.color = '#909399';
        break;
    }

    // 添加标题
    if (config.title) {
      const title = document.createElement('div');
      title.className = 'notification-title';
      title.style.fontWeight = 'bold';
      title.style.marginBottom = '4px';
      title.textContent = config.title;
      notification.appendChild(title);
    }

    // 添加消息
    const message = document.createElement('div');
    message.className = 'notification-message';
    message.textContent = config.message;
    notification.appendChild(message);

    // 添加关闭按钮
    if (config.closable !== false) {
      const closeBtn = document.createElement('button');
      closeBtn.className = 'notification-close';
      closeBtn.style.position = 'absolute';
      closeBtn.style.top = '8px';
      closeBtn.style.right = '8px';
      closeBtn.style.background = 'none';
      closeBtn.style.border = 'none';
      closeBtn.style.cursor = 'pointer';
      closeBtn.style.fontSize = '16px';
      closeBtn.textContent = '×';
      closeBtn.addEventListener('click', () => this.removeNotification(id));
      notification.appendChild(closeBtn);
    }

    // 添加点击事件
    if (config.onClick) {
      notification.style.cursor = 'pointer';
      notification.addEventListener('click', config.onClick);
    }

    // 设置位置
    if (config.position) {
      this.setNotificationPosition(notification, config.position);
    } else {
      this.setNotificationPosition(notification, 'top-right');
    }

    // 添加到容器
    this.notificationContainer?.appendChild(notification);
    this.notifications.set(id, notification);

    // 触发动画
    setTimeout(() => {
      notification.style.opacity = '1';
      notification.style.transform = 'translateY(0)';
    }, 10);

    // 设置自动关闭
    if (config.duration !== 0) {
      setTimeout(() => {
        this.removeNotification(id);
      }, config.duration || 3000);
    }

    return id;
  }

  /**
   * 设置通知位置
   */
  private setNotificationPosition(notification: HTMLElement, position: NotificationConfig['position']): void {
    if (!this.notificationContainer) return;

    // 重置所有位置样式
    this.notificationContainer.style.top = '';
    this.notificationContainer.style.bottom = '';
    this.notificationContainer.style.left = '';
    this.notificationContainer.style.right = '';

    switch (position) {
      case 'top-left':
        this.notificationContainer.style.top = '0';
        this.notificationContainer.style.left = '0';
        break;
      case 'top-right':
        this.notificationContainer.style.top = '0';
        this.notificationContainer.style.right = '0';
        break;
      case 'bottom-left':
        this.notificationContainer.style.bottom = '0';
        this.notificationContainer.style.left = '0';
        break;
      case 'bottom-right':
        this.notificationContainer.style.bottom = '0';
        this.notificationContainer.style.right = '0';
        break;
      case 'center':
        this.notificationContainer.style.top = '50%';
        this.notificationContainer.style.left = '50%';
        this.notificationContainer.style.transform = 'translate(-50%, -50%)';
        notification.style.minWidth = '300px';
        notification.style.textAlign = 'center';
        break;
    }
  }

  /**
   * 移除通知
   */
  removeNotification(id: string): void {
    const notification = this.notifications.get(id);
    if (notification) {
      notification.style.opacity = '0';
      notification.style.transform = 'translateY(-10px)';
      
      setTimeout(() => {
        notification.remove();
        this.notifications.delete(id);
      }, 300);
    }
  }

  /**
   * 清除所有通知
   */
  clearAllNotifications(): void {
    this.notifications.forEach((_, id) => {
      this.removeNotification(id);
    });
  }
}

/**
 * 动画服务
 */
class AnimationService {
  /**
   * 淡入元素
   */
  fadeIn(element: HTMLElement, config: AnimationConfig = {}): Promise<void> {
    const {
      duration = 300,
      easing = 'ease-in-out',
      delay = 0
    } = config;

    return new Promise((resolve) => {
      element.style.opacity = '0';
      element.style.transition = `opacity ${duration}ms ${easing} ${delay}ms`;
      
      setTimeout(() => {
        element.style.opacity = '1';
        
        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, duration);
      }, 10);
    });
  }

  /**
   * 淡出元素
   */
  fadeOut(element: HTMLElement, config: AnimationConfig = {}): Promise<void> {
    const {
      duration = 300,
      easing = 'ease-in-out',
      delay = 0
    } = config;

    return new Promise((resolve) => {
      element.style.opacity = '1';
      element.style.transition = `opacity ${duration}ms ${easing} ${delay}ms`;
      
      setTimeout(() => {
        element.style.opacity = '0';
        
        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, duration);
      }, 10);
    });
  }

  /**
   * 滑动进入
   */
  slideIn(element: HTMLElement, direction: 'left' | 'right' | 'up' | 'down' = 'up', config: AnimationConfig = {}): Promise<void> {
    const {
      duration = 300,
      easing = 'ease-out',
      delay = 0
    } = config;

    const property = direction === 'left' || direction === 'right' ? 'transform' : 'transform';
    const initialValue = {
      left: 'translateX(-100%)',
      right: 'translateX(100%)',
      up: 'translateY(100%)',
      down: 'translateY(-100%)'
    }[direction];

    return new Promise((resolve) => {
      element.style.opacity = '0';
      element.style[property as any] = initialValue;
      element.style.transition = `all ${duration}ms ${easing} ${delay}ms`;
      
      setTimeout(() => {
        element.style.opacity = '1';
        element.style[property as any] = 'translate(0, 0)';
        
        setTimeout(() => {
          element.style.transition = '';
          resolve();
        }, duration);
      }, 10);
    });
  }

  /**
   * 弹性缩放
   */
  bounceScale(element: HTMLElement, config: AnimationConfig = {}): Promise<void> {
    const {
      duration = 600,
      easing = 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      delay = 0
    } = config;

    return new Promise((resolve) => {
      element.style.transform = 'scale(0.5)';
      element.style.opacity = '0';
      element.style.transition = `all ${duration}ms ${easing} ${delay}ms`;
      
      setTimeout(() => {
        element.style.transform = 'scale(1.1)';
        element.style.opacity = '1';
        
        // 回弹效果
        setTimeout(() => {
          element.style.transform = 'scale(1)';
          
          setTimeout(() => {
            element.style.transition = '';
            resolve();
          }, duration / 3);
        }, duration / 3);
      }, 10);
    });
  }

  /**
   * 闪烁效果
   */
  pulse(element: HTMLElement, times: number = 3, config: AnimationConfig = {}): Promise<void> {
    const {
      duration = 1000,
      easing = 'ease-in-out'
    } = config;

    return new Promise((resolve) => {
      const pulseDuration = duration / times;
      let currentPulse = 0;

      const pulse = () => {
        element.style.transition = `opacity ${pulseDuration / 2}ms ${easing}`;
        element.style.opacity = '0.4';

        setTimeout(() => {
          element.style.opacity = '1';
          currentPulse++;

          if (currentPulse < times) {
            setTimeout(pulse, pulseDuration / 2);
          } else {
            element.style.transition = '';
            resolve();
          }
        }, pulseDuration / 2);
      };

      pulse();
    });
  }
}

// 创建单例实例
const focusManager = new FocusManager();
const notificationService = new NotificationService();
const animationService = new AnimationService();

/**
 * 显示通知
 */
export function showNotification(config: NotificationConfig): string {
  return notificationService.createNotification(config);
}

/**
 * 移除通知
 */
export function removeNotification(id: string): void {
  notificationService.removeNotification(id);
}

/**
 * 清除所有通知
 */
export function clearAllNotifications(): void {
  notificationService.clearAllNotifications();
}

/**
 * 保存当前焦点
 */
export function saveFocus(): void {
  focusManager.saveFocus();
}

/**
 * 恢复之前保存的焦点
 */
export function restoreFocus(): void {
  focusManager.restoreFocus();
}

/**
 * 陷阱焦点在元素内
 */
export function trapFocus(element: HTMLElement): void {
  focusManager.trapFocus(element);
}

/**
 * 取消焦点陷阱
 */
export function untrapFocus(): void {
  focusManager.untrapFocus();
}

/**
 * 淡入元素
 */
export function fadeIn(element: HTMLElement, config?: AnimationConfig): Promise<void> {
  return animationService.fadeIn(element, config);
}

/**
 * 淡出元素
 */
export function fadeOut(element: HTMLElement, config?: AnimationConfig): Promise<void> {
  return animationService.fadeOut(element, config);
}

/**
 * 滑动进入
 */
export function slideIn(element: HTMLElement, direction?: 'left' | 'right' | 'up' | 'down', config?: AnimationConfig): Promise<void> {
  return animationService.slideIn(element, direction, config);
}

/**
 * 弹性缩放
 */
export function bounceScale(element: HTMLElement, config?: AnimationConfig): Promise<void> {
  return animationService.bounceScale(element, config);
}

/**
 * 闪烁效果
 */
export function pulse(element: HTMLElement, times?: number, config?: AnimationConfig): Promise<void> {
  return animationService.pulse(element, times, config);
}

/**
 * 创建加载指示器
 */
export function createLoadingIndicator(message?: string): HTMLElement {
  const container = document.createElement('div');
  container.className = 'loading-indicator';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'center';
  container.style.justifyContent = 'center';
  container.style.padding = '20px';

  // 创建旋转加载动画
  const spinner = document.createElement('div');
  spinner.className = 'loading-spinner';
  spinner.style.width = '30px';
  spinner.style.height = '30px';
  spinner.style.border = '3px solid #f3f3f3';
  spinner.style.borderTop = '3px solid #3498db';
  spinner.style.borderRadius = '50%';
  spinner.style.animation = 'spin 1s linear infinite';

  // 添加动画样式
  const style = document.createElement('style');
  style.textContent = `
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `;
  document.head.appendChild(style);

  container.appendChild(spinner);

  // 添加消息
  if (message) {
    const messageEl = document.createElement('div');
    messageEl.className = 'loading-message';
    messageEl.style.marginTop = '10px';
    messageEl.style.fontSize = '14px';
    messageEl.style.color = '#666';
    messageEl.textContent = message;
    container.appendChild(messageEl);
  }

  return container;
}

/**
 * 防抖滚动
 */
export function debounceScroll(callback: () => void, delay: number = 200): () => void {
  return debounce(() => {
    callback();
  }, { delay });
}

/**
 * 节流鼠标移动
 */
export function throttleMouseMove(callback: (e: MouseEvent) => void, delay: number = 100): (e: MouseEvent) => void {
  return throttle((e) => {
    callback(e);
  }, { limit: delay });
}

/**
 * 检测元素是否在视口中
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  );
}

/**
 * 检测元素是否部分在视口中
 */
export function isPartiallyInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect();
  const windowHeight = window.innerHeight || document.documentElement.clientHeight;
  const windowWidth = window.innerWidth || document.documentElement.clientWidth;

  const vertInView = (rect.top <= windowHeight) && ((rect.top + rect.height) >= 0);
  const horInView = (rect.left <= windowWidth) && ((rect.left + rect.width) >= 0);

  return vertInView && horInView;
}
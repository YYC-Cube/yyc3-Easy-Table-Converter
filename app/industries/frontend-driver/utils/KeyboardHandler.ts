/**
 * @file 键盘事件处理器实现
 * @description 实现键盘事件处理和快捷键管理功能
 * @module keyboardHandler
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import {
  KeyboardEventData,
  EventHandlerInterface,
  ListenerOptions,
  EventData
} from '../types/EventHandlerTypes';
import { globalEventHandler } from './EventHandler';

/**
 * 键盘修饰键状态
 */
interface KeyModifiers {
  /** Alt 键是否按下 */
  alt: boolean;
  /** Ctrl 键是否按下 */
  ctrl: boolean;
  /** Meta 键是否按下（Windows上是Win键，Mac上是Command键） */
  meta: boolean;
  /** Shift 键是否按下 */
  shift: boolean;
}

/**
 * 快捷键配置
 */
interface ShortcutConfig {
  /** 快捷键名称 */
  name: string;
  /** 快捷键描述 */
  description: string;
  /** 主按键 */
  key: string;
  /** 修饰键 */
  modifiers: Partial<KeyModifiers>;
  /** 回调函数 */
  callback: (event: KeyboardEvent) => void;
  /** 事件类型（keydown 或 keyup） */
  eventType?: 'keydown' | 'keyup' | 'keypress';
  /** 目标元素（默认为document） */
  target?: HTMLElement | Document;
  /** 是否允许在输入框中触发 */
  allowInInput?: boolean;
  /** 优先级 */
  priority?: number;
}

/**
 * 键盘事件处理器类
 */
class KeyboardHandler {
  /** 当前修饰键状态 */
  private currentModifiers: KeyModifiers = {
    alt: false,
    ctrl: false,
    meta: false,
    shift: false
  };
  /** 当前按下的键集合 */
  private pressedKeys: Set<string> = new Set();
  /** 快捷键映射 */
  private shortcuts: Map<string, ShortcutConfig> = new Map();
  /** 事件处理器 */
  private eventHandler: EventHandlerInterface<EventData>;
  /** 目标元素 */
  private target: HTMLElement | Document;
  /** 是否已绑定事件 */
  private isBound: boolean = false;

  /**
   * 构造函数
   * @param target 目标元素（默认为document）
   * @param eventHandler 事件处理器（可选）
   */
  constructor(
    target: HTMLElement | Document = document,
    eventHandler?: EventHandlerInterface<EventData>
  ) {
    this.target = target;
    this.eventHandler = eventHandler || globalEventHandler;
  }

  /**
   * 绑定事件监听器
   */
  bind(): void {
    if (this.isBound) return;

    this.target.addEventListener('keydown', this.handleKeyDown);
    this.target.addEventListener('keyup', this.handleKeyUp);
    this.target.addEventListener('keypress', this.handleKeyPress);
    
    this.isBound = true;
  }

  /**
   * 解绑事件监听器
   */
  unbind(): void {
    if (!this.isBound) return;

    this.target.removeEventListener('keydown', this.handleKeyDown);
    this.target.removeEventListener('keyup', this.handleKeyUp);
    this.target.removeEventListener('keypress', this.handleKeyPress);
    
    this.isBound = false;
    this.pressedKeys.clear();
    this.resetModifiers();
  }

  /**
   * 重置修饰键状态
   */
  private resetModifiers(): void {
    this.currentModifiers = {
      alt: false,
      ctrl: false,
      meta: false,
      shift: false
    };
  }

  /**
   * 检查是否应该在当前输入框中触发快捷键
   * @param event 键盘事件
   * @returns 是否允许触发
   */
  private shouldTriggerInInput(event: KeyboardEvent): boolean {
    const target = event.target as HTMLElement;
    const inputElements = ['INPUT', 'TEXTAREA', 'SELECT', 'CONTENTEDITABLE'];
    
    // 检查是否在输入元素中
    if (inputElements.includes(target.tagName)) {
      // 对于特殊键（如Esc），即使在输入框中也允许触发
      const allowInInputKeys = ['Escape', 'Tab', 'Enter', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'];
      if (allowInInputKeys.includes(event.key)) {
        return true;
      }
      return false;
    }
    
    // 检查是否是contenteditable元素
    if (target.isContentEditable) {
      return false;
    }
    
    return true;
  }

  /**
   * 格式化键名（标准化键名格式）
   * @param key 原始键名
   * @returns 格式化后的键名
   */
  private formatKey(key: string): string {
    // 处理特殊键名
    const keyMap: Record<string, string> = {
      ' ': 'Space',
      'Control': 'Ctrl',
      'Delete': 'Del',
      'ArrowUp': 'Up',
      'ArrowDown': 'Down',
      'ArrowLeft': 'Left',
      'ArrowRight': 'Right'
    };
    
    return keyMap[key] || key;
  }

  /**
   * 生成快捷键ID
   * @param key 主按键
   * @param modifiers 修饰键
   * @returns 快捷键ID
   */
  private generateShortcutId(key: string, modifiers: Partial<KeyModifiers>): string {
    const keys: string[] = [];
    
    if (modifiers.ctrl) keys.push('Ctrl');
    if (modifiers.meta) keys.push('Meta');
    if (modifiers.alt) keys.push('Alt');
    if (modifiers.shift) keys.push('Shift');
    keys.push(this.formatKey(key));
    
    return keys.join('+');
  }

  /**
   * 检查修饰键是否匹配
   * @param shortcutModifiers 快捷键定义的修饰键
   * @returns 是否匹配
   */
  private modifiersMatch(shortcutModifiers: Partial<KeyModifiers>): boolean {
    return (
      (shortcutModifiers.alt === undefined || this.currentModifiers.alt === shortcutModifiers.alt) &&
      (shortcutModifiers.ctrl === undefined || this.currentModifiers.ctrl === shortcutModifiers.ctrl) &&
      (shortcutModifiers.meta === undefined || this.currentModifiers.meta === shortcutModifiers.meta) &&
      (shortcutModifiers.shift === undefined || this.currentModifiers.shift === shortcutModifiers.shift)
    );
  }

  /**
   * 处理键盘按下事件
   */
  private handleKeyDown = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    // 更新修饰键状态
    this.currentModifiers = {
      alt: keyboardEvent.altKey,
      ctrl: keyboardEvent.ctrlKey,
      meta: keyboardEvent.metaKey,
      shift: keyboardEvent.shiftKey
    };
    
    // 添加到已按下的键集合
    this.pressedKeys.add(keyboardEvent.key);
    
    // 创建键盘事件数据
    const keyboardEventData: KeyboardEventData = {
      type: 'keyDown',
      key: keyboardEvent.key,
      code: keyboardEvent.code,
      altKey: keyboardEvent.altKey,
      ctrlKey: keyboardEvent.ctrlKey,
      metaKey: keyboardEvent.metaKey,
      shiftKey: keyboardEvent.shiftKey,
      repeat: keyboardEvent.repeat,
      timestamp: Date.now(),
      source: keyboardEvent.target
    };
    
    // 触发事件
    this.eventHandler.emit(keyboardEventData);
    
    // 检查是否应该在输入框中触发快捷键
    const allowInInput = this.shouldTriggerInInput(keyboardEvent);
    if (!allowInInput) return;
    
    // 检查是否匹配快捷键
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.eventType === 'keydown' && shortcut.key === keyboardEvent.key && this.modifiersMatch(shortcut.modifiers)) {
        // 阻止默认行为
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        
        // 执行回调
        shortcut.callback(keyboardEvent);
        
        // 如果有优先级，可能需要停止后续处理
        break;
      }
    }
  };

  /**
   * 处理键盘释放事件
   */
  private handleKeyUp = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    // 更新修饰键状态
    this.currentModifiers = {
      alt: keyboardEvent.altKey,
      ctrl: keyboardEvent.ctrlKey,
      meta: keyboardEvent.metaKey,
      shift: keyboardEvent.shiftKey
    };
    
    // 从已按下的键集合中移除
    this.pressedKeys.delete(keyboardEvent.key);
    
    // 创建键盘事件数据
    const keyboardEventData: KeyboardEventData = {
      type: 'keyUp',
      key: keyboardEvent.key,
      code: keyboardEvent.code,
      altKey: keyboardEvent.altKey,
      ctrlKey: keyboardEvent.ctrlKey,
      metaKey: keyboardEvent.metaKey,
      shiftKey: keyboardEvent.shiftKey,
      repeat: keyboardEvent.repeat,
      timestamp: Date.now(),
      source: keyboardEvent.target
    };
    
    // 触发事件
    this.eventHandler.emit(keyboardEventData);
    
    // 检查是否应该在输入框中触发快捷键
    const allowInInput = this.shouldTriggerInInput(keyboardEvent);
    if (!allowInInput) return;
    
    // 检查是否匹配快捷键
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.eventType === 'keyup' && shortcut.key === keyboardEvent.key && this.modifiersMatch(shortcut.modifiers)) {
        // 阻止默认行为
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        
        // 执行回调
        shortcut.callback(keyboardEvent);
        break;
      }
    }
  };

  /**
   * 处理键盘按下并释放事件
   */
  private handleKeyPress = (event: Event): void => {
    const keyboardEvent = event as KeyboardEvent;
    // 创建键盘事件数据
    const keyboardEventData: KeyboardEventData = {
      type: 'keyPress',
      key: keyboardEvent.key,
      code: keyboardEvent.code,
      altKey: keyboardEvent.altKey,
      ctrlKey: keyboardEvent.ctrlKey,
      metaKey: keyboardEvent.metaKey,
      shiftKey: keyboardEvent.shiftKey,
      repeat: keyboardEvent.repeat,
      timestamp: Date.now(),
      source: keyboardEvent.target
    };
    
    // 触发事件
    this.eventHandler.emit(keyboardEventData);
    
    // 检查是否应该在输入框中触发快捷键
    const allowInInput = this.shouldTriggerInInput(keyboardEvent);
    if (!allowInInput) return;
    
    // 检查是否匹配快捷键
    for (const shortcut of this.shortcuts.values()) {
      if (shortcut.eventType === 'keypress' && shortcut.key === keyboardEvent.key && this.modifiersMatch(shortcut.modifiers)) {
        // 阻止默认行为
        keyboardEvent.preventDefault();
        keyboardEvent.stopPropagation();
        
        // 执行回调
        shortcut.callback(keyboardEvent);
        break;
      }
    }
  };

  /**
   * 注册快捷键
   * @param config 快捷键配置
   * @returns 快捷键ID
   */
  registerShortcut(config: ShortcutConfig): string {
    const shortcutId = this.generateShortcutId(config.key, config.modifiers);
    
    const shortcut: ShortcutConfig = {
      eventType: 'keydown',
      target: this.target,
      allowInInput: false,
      priority: 0,
      ...config
    };
    
    this.shortcuts.set(shortcutId, shortcut);
    
    // 确保事件已绑定
    if (!this.isBound) {
      this.bind();
    }
    
    return shortcutId;
  }

  /**
   * 移除快捷键
   * @param shortcutId 快捷键ID
   * @returns 是否成功移除
   */
  removeShortcut(shortcutId: string): boolean {
    return this.shortcuts.delete(shortcutId);
  }

  /**
   * 获取所有注册的快捷键
   * @returns 快捷键配置数组
   */
  getRegisteredShortcuts(): ShortcutConfig[] {
    return Array.from(this.shortcuts.values());
  }

  /**
   * 检查键是否按下
   * @param key 键名
   * @returns 是否按下
   */
  isKeyPressed(key: string): boolean {
    return this.pressedKeys.has(key);
  }

  /**
   * 获取当前修饰键状态
   * @returns 修饰键状态
   */
  getModifierState(): KeyModifiers {
    return { ...this.currentModifiers };
  }

  /**
   * 监听键盘事件
   * @param eventType 事件类型
   * @param listener 事件监听器
   * @param options 监听选项
   * @returns 监听器ID
   */
  on(eventType: 'keyDown' | 'keyUp' | 'keyPress', listener: (event: KeyboardEventData) => void, options?: ListenerOptions): string {
    return this.eventHandler.on(eventType, listener as unknown as (event: EventData) => void, options);
  }

  /**
   * 移除键盘事件监听器
   * @param eventType 事件类型
   * @param listenerOrId 事件监听器或监听器ID
   */
  off(eventType: 'keyDown' | 'keyUp' | 'keyPress', listenerOrId: ((event: KeyboardEventData) => void) | string): void {
    // 进行类型断言以确保与EventHandler<EventData>兼容
    this.eventHandler.off(eventType, typeof listenerOrId === 'string' ? listenerOrId : listenerOrId as unknown as (event: EventData) => void);
  }

  /**
   * 销毁键盘事件处理器
   */
  destroy(): void {
    this.unbind();
    this.shortcuts.clear();
    this.pressedKeys.clear();
    this.resetModifiers();
  }
}

/**
 * 创建键盘事件处理器实例
 * @param target 目标元素
 * @returns 键盘事件处理器实例
 */
export function createKeyboardHandler(target: HTMLElement | Document = document): KeyboardHandler {
  const handler = new KeyboardHandler(target);
  handler.bind();
  return handler;
}

/**
 * 全局键盘事件处理器实例
 */
export const globalKeyboardHandler = createKeyboardHandler();

export default KeyboardHandler;

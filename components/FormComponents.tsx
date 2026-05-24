/**
 * @file 增强表单组件和错误提示系统
 * @description 提供优化的表单控件、实时验证、错误提示和用户友好的表单交互体验
 * @module components/form-components
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

'use client';

import React, { useState, useEffect, useCallback, useRef, forwardRef } from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  Info,
  ChevronDown,
  ChevronUp,
  X
} from 'lucide-react';
import { useResponsive } from './ResponsiveUtils';

// 表单验证规则类型
export type ValidationRule = {
  // 规则名称
  name: string;
  // 验证函数
  validate: (value: any, formValues?: Record<string, any>) => boolean | string;
  // 错误消息
  message?: string;
  // 是否为必填
  required?: boolean;
  // 验证触发时机
  trigger?: 'change' | 'blur' | 'submit';
  // 验证顺序
  order?: number;
};

// 表单字段类型
export type FieldType = 
  | 'text'      // 文本输入
  | 'password'  // 密码输入
  | 'email'     // 邮箱输入
  | 'number'    // 数字输入
  | 'tel'       // 电话输入
  | 'url'       // URL输入
  | 'textarea'  // 文本域
  | 'select'    // 下拉选择
  | 'checkbox'  // 复选框
  | 'radio'     // 单选按钮
  | 'switch'    // 开关
  | 'date'      // 日期选择
  | 'time'      // 时间选择
  | 'datetime-local' // 日期时间选择
  | 'file'      // 文件上传
  | 'color'     // 颜色选择
  | 'range'     // 范围滑块
  | 'search'    // 搜索输入
  | 'hidden';   // 隐藏字段

// 表单状态类型
export type FormStatus = 'idle' | 'submitting' | 'submitted' | 'error' | 'success';

// 错误级别类型
export type ErrorLevel = 'error' | 'warning' | 'info' | 'success';

// 输入尺寸类型
export type InputSize = 'sm' | 'md' | 'lg' | 'xl';

// 选项类型
interface Option<T = any> {
  // 选项值
  value: T;
  // 选项标签
  label: string;
  // 是否禁用
  disabled?: boolean;
  // 是否选中
  selected?: boolean;
  // 选项分组
  group?: string;
  // 选项图标
  icon?: React.ReactNode;
  // 选项描述
  description?: string;
  // 额外数据
  data?: Record<string, any>;
}

// 错误消息类型
export type ErrorMessage = string | { [key: string]: string | string[] };

// 表单字段属性接口
interface FormFieldProps<T = any> {
  // 字段名称
  name: string;
  // 字段类型
  type?: FieldType;
  // 字段值
  value?: T;
  // 默认值
  defaultValue?: T;
  // 标签文本
  label?: string;
  // 占位符文本
  placeholder?: string;
  // 是否禁用
  disabled?: boolean;
  // 是否只读
  readOnly?: boolean;
  // 是否必填
  required?: boolean;
  // 验证规则
  rules?: ValidationRule[];
  // 帮助文本
  helpText?: string;
  // 错误消息
  errorMessage?: string;
  // 警告消息
  warningMessage?: string;
  // 信息消息
  infoMessage?: string;
  // 成功消息
  successMessage?: string;
  // 尺寸
  size?: InputSize;
  // 是否显示错误
  showError?: boolean;
  // 是否显示标签
  showLabel?: boolean;
  // 是否显示帮助文本
  showHelpText?: boolean;
  // 选项列表
  options?: Option[];
  // 最小长度
  minLength?: number;
  // 最大长度
  maxLength?: number;
  // 最小值
  min?: number;
  // 最大值
  max?: number;
  // 步长
  step?: number;
  // 模式
  pattern?: string;
  // 自动完成
  autoComplete?: string;
  // 自动大写
  autoCapitalize?: 'off' | 'on' | 'none' | 'sentences' | 'words' | 'characters';
  // 自动更正
  autoCorrect?: 'on' | 'off';
  // 是否多值
  multiple?: boolean;
  // 选项分隔符
  separator?: string;
  // 输入组前缀
  prepend?: React.ReactNode;
  // 输入组后缀
  append?: React.ReactNode;
  // 容器类名
  className?: string;
  // 标签类名
  labelClassName?: string;
  // 输入类名
  inputClassName?: string;
  // 帮助文本类名
  helpTextClassName?: string;
  // 错误消息类名
  errorMessageClassName?: string;
  // 输入样式
  inputStyle?: React.CSSProperties;
  // 标签样式
  labelStyle?: React.CSSProperties;
  // 容器样式
  style?: React.CSSProperties;
  // 变化回调
  onChange?: (value: T, name: string, event: React.ChangeEvent) => void;
  // 聚焦回调
  onFocus?: (event: React.FocusEvent) => void;
  // 失焦回调
  onBlur?: (event: React.FocusEvent) => void;
  // 键盘按下回调
  onKeyDown?: React.KeyboardEventHandler;
  // 键盘释放回调
  onKeyUp?: React.KeyboardEventHandler;
  // 键盘按下回调
  onKeyPress?: React.KeyboardEventHandler;
  // 滚动回调
  onScroll?: React.UIEventHandler;
  // 选择回调
  onSelect?: React.ReactEventHandler<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
  // 无障碍标签
  ariaLabel?: string;
  // 无障碍描述
  ariaDescribedby?: string;
  // 无障碍角色
  role?: string;
  // 是否可聚焦
  tabIndex?: number;
  // 引用
  ref?: React.Ref<any>;
}

// 增强输入字段属性接口
export interface EnhancedInputProps extends FormFieldProps<string> {
  // 是否显示清除按钮
  showClearButton?: boolean;
  // 是否显示密码切换
  showPasswordToggle?: boolean;
  // 是否显示字数统计
  showCounter?: boolean;
  // 是否显示前缀
  showPrepend?: boolean;
  // 是否显示后缀
  showAppend?: boolean;
  // 输入掩码
  mask?: string;
  // 掩码字符
  maskChar?: string;
  // 是否自动选择
  autoSelect?: boolean;
  // 是否防抖
  debounce?: number;
  // 是否节流
  throttle?: number;
  // 防抖变化回调
  onDebounceChange?: (value: string, name: string) => void;
  // 节流变化回调
  onThrottleChange?: (value: string, name: string) => void;
  // 输入前缀图标
  prefixIcon?: React.ReactNode;
  // 输入后缀图标
  suffixIcon?: React.ReactNode;
}

/**
 * 增强输入组件 - 提供高级文本输入功能
 */
const EnhancedInput: React.ForwardRefRenderFunction<HTMLInputElement, EnhancedInputProps> = ({
  name,
  type = 'text',
  value = '',
  defaultValue = '',
  label,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  rules = [],
  helpText,
  errorMessage,
  successMessage,
  size = 'md',
  showError = true,
  showLabel = true,
  showHelpText = true,
  minLength,
  maxLength,
  pattern,
  autoComplete,
  autoCapitalize,
  autoCorrect,
  prepend,
  append,
  showClearButton = true,
  showPasswordToggle = true,
  showCounter = false,
  showPrepend = true,
  showAppend = true,
  mask,
  maskChar = '_',
  autoSelect = false,
  debounce,
  throttle,
  onDebounceChange,
  onThrottleChange,
  onChange,
  onFocus,
  onBlur,
  onKeyDown,
  prefixIcon,
  suffixIcon,
  className = '',
  labelClassName = '',
  inputClassName = '',
  helpTextClassName = '',
  errorMessageClassName = '',
  inputStyle = {},
  labelStyle = {},
  ariaLabel,
  ariaDescribedby,
  role = 'textbox',
  tabIndex,
  ...props
}, ref) => {
  const [inputValue, setInputValue] = useState<string>(value || defaultValue);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [localError, setLocalError] = useState<string>('');
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const [throttleTimer, setThrottleTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastThrottleTime, setLastThrottleTime] = useState<number>(0);
  const inputRef = useRef<HTMLInputElement>(null) as React.MutableRefObject<HTMLInputElement | null>;
  // const { isMobile } = useResponsive(); // 暂时注释掉未使用的变量
  
  // 合并引用
  const mergedRef = useCallback((node: HTMLInputElement | null) => {
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    inputRef.current = node;
  }, [ref]);
  
  // 处理值变化
  useEffect(() => {
    if (value !== undefined && value !== inputValue) {
      setInputValue(value);
    }
  }, [value]);
  
  // 清理定时器
  useEffect(() => {
    return () => {
      if (debounceTimer) clearTimeout(debounceTimer);
      if (throttleTimer) clearTimeout(throttleTimer);
    };
  }, [debounceTimer, throttleTimer]);
  
  // 防抖处理
  const handleDebounce = useCallback((newValue: string) => {
    if (debounce && onDebounceChange) {
      if (debounceTimer) clearTimeout(debounceTimer);
      const timer = setTimeout(() => {
        onDebounceChange(newValue, name);
      }, debounce);
      setDebounceTimer(timer);
    }
  }, [debounce, debounceTimer, name, onDebounceChange]);
  
  // 节流处理
  const handleThrottle = useCallback((newValue: string) => {
    if (throttle && onThrottleChange) {
      const now = Date.now();
      if (now - lastThrottleTime >= throttle) {
        onThrottleChange(newValue, name);
        setLastThrottleTime(now);
      } else {
        if (throttleTimer) clearTimeout(throttleTimer);
        const timer = setTimeout(() => {
          onThrottleChange(newValue, name);
          setLastThrottleTime(Date.now());
        }, throttle - (now - lastThrottleTime));
        setThrottleTimer(timer);
      }
    }
  }, [lastThrottleTime, onThrottleChange, name, throttle, throttleTimer]);
  
  // 验证输入值
  const validateValue = useCallback((value: string) => {
    let isValid = true;
    let errorMsg = '';
    const warningMsg = '';
    const successMsg = '';
    
    // 验证规则
    for (const rule of rules.sort((a, b) => (a.order || 0) - (b.order || 0))) {
      const result = rule.validate(value);
      if (result !== true) {
        isValid = false;
        errorMsg = result === false ? rule.message || '输入无效' : result;
        break;
      }
    }
    
    setIsValid(isValid);
    setLocalError(errorMsg);
    
    // 特殊类型验证
    if (type === 'email' && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setIsValid(false);
      setLocalError('请输入有效的邮箱地址');
    }
    
    if (type === 'url' && value && !/^https?:\/\/.+/.test(value)) {
      setIsValid(false);
      setLocalError('请输入有效的URL');
    }
    
    return { isValid, errorMsg, warningMsg, successMsg };
  }, [rules, type]);
  
  // 处理输入变化
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = event.target.value;
    setInputValue(newValue);
    
    // 验证输入
    validateValue(newValue);
    
    // 调用防抖和节流
    handleDebounce(newValue);
    handleThrottle(newValue);
    
    // 调用原始回调
    if (onChange) {
      onChange(newValue, name, event);
    }
  };
  
  // 处理聚焦
  const handleFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(true);
    
    // 自动选择
    if (autoSelect && event.target.setSelectionRange) {
      event.target.setSelectionRange(0, event.target.value.length);
    }
    
    if (onFocus) {
      onFocus(event);
    }
  };
  
  // 处理失焦
  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    
    // 失焦时验证
    validateValue(event.target.value);
    
    if (onBlur) {
      onBlur(event);
    }
  };
  
  // 清除输入
  const handleClear = () => {
    const event = { target: { value: '' } } as React.ChangeEvent<HTMLInputElement>;
    setInputValue('');
    setIsValid(null);
    setLocalError('');
    
    if (onChange) {
      onChange('', name, event);
    }
  };
  
  // 切换密码可见性
  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };
  
  // 获取输入尺寸样式
  const getSizeStyles = useCallback(() => {
    const sizeMap = {
      sm: { padding: '0.375rem 0.5rem', fontSize: '0.75rem', height: '2rem' },
      md: { padding: '0.5rem 0.75rem', fontSize: '0.875rem', height: '2.5rem' },
      lg: { padding: '0.625rem 1rem', fontSize: '1rem', height: '3rem' },
      xl: { padding: '0.75rem 1.25rem', fontSize: '1.125rem', height: '3.5rem' }
    };
    return sizeMap[size];
  }, [size]);
  
  // 获取输入容器类名
  const getInputContainerClassName = useCallback(() => {
    const classes = [
      'input-container',
      `input-${size}`,
      `input-${type}`,
      isFocused && 'input-focused',
      disabled && 'input-disabled',
      readOnly && 'input-readonly',
      (showError && (errorMessage || localError || isValid === false)) && 'input-error',
      isValid === true && 'input-success',
      (showPrepend && prepend) && 'input-has-prepend',
      (showAppend && append) && 'input-has-append',
      (showClearButton && inputValue && !disabled && !readOnly) && 'input-has-clear',
      (type === 'password' && showPasswordToggle && !disabled && !readOnly) && 'input-has-password-toggle'
    ].filter(Boolean).join(' ');
    return classes;
  }, [append, disabled, errorMessage, inputValue, isFocused, isValid, localError, prepend, readOnly, showAppend, showClearButton, showError, showPasswordToggle, showPrepend, size, type]);
  
  // 获取输入类名
  const getInputClassName = useCallback(() => {
    const classes = [
      'form-input',
      `form-input-${size}`,
      `form-input-${type}`,
      isFocused && 'form-input-focused',
      disabled && 'form-input-disabled',
      readOnly && 'form-input-readonly',
      (showError && (errorMessage || localError || isValid === false)) && 'form-input-error',
      isValid === true && 'form-input-success',
      inputClassName
    ].filter(Boolean).join(' ');
    return classes;
  }, [disabled, errorMessage, inputClassName, isFocused, isValid, localError, readOnly, showError, size, type]);
  
  // 获取输入样式
  const getInputStyles = useCallback(() => {
    const sizeStyles = getSizeStyles();
    let paddingLeft = sizeStyles.padding;
    let paddingRight = sizeStyles.padding;
    
    // 调整内边距以适应附加元素
    if ((showPrepend && prepend) || (prefixIcon)) {
      paddingLeft = `2.5rem`;
    }
    
    if ((showAppend && append) || (suffixIcon)) {
      paddingRight = `2.5rem`;
    }
    
    // 调整密码切换按钮
    if (type === 'password' && showPasswordToggle) {
      paddingRight = `3.5rem`;
    }
    
    // 调整清除按钮
    if (showClearButton && inputValue) {
      if (type === 'password' && showPasswordToggle) {
        paddingRight = `4.5rem`;
      } else {
        paddingRight = `3.5rem`;
      }
    }
    
    return {
      ...sizeStyles,
      paddingLeft,
      paddingRight,
      ...inputStyle
    };
  }, [append, getSizeStyles, inputStyle, inputValue, prefixIcon, prepend, showAppend, showClearButton, showPasswordToggle, showPrepend, suffixIcon, type]);
  
  // 渲染标签
  const renderLabel = () => {
    if (!showLabel || !label) return null;
    
    return (
      <label 
        htmlFor={name} 
        className={`form-label ${labelClassName} ${required && 'form-label-required'} ${(showError && (errorMessage || localError || isValid === false)) && 'form-label-error'}`}
        style={labelStyle}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  };
  
  // 渲染输入前缀
  const renderPrepend = () => {
    if (!showPrepend || !prepend) return null;
    
    return (
      <div className="input-prepend">
        {prepend}
      </div>
    );
  };
  
  // 渲染输入后缀
  const renderAppend = () => {
    if (!showAppend || !append) return null;
    
    return (
      <div className="input-append">
        {append}
      </div>
    );
  };
  
  // 渲染清除按钮
  const renderClearButton = () => {
    if (!showClearButton || !inputValue || disabled || readOnly) return null;
    
    return (
      <button 
        type="button"
        className="input-clear-button"
        onClick={handleClear}
        aria-label="清除输入"
        title="清除输入"
      >
        <X size={16} />
      </button>
    );
  };
  
  // 渲染密码切换按钮
  const renderPasswordToggle = () => {
    if (type !== 'password' || !showPasswordToggle || disabled || readOnly) return null;
    
    return (
      <button 
        type="button"
        className="input-password-toggle"
        onClick={togglePasswordVisibility}
        aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
        title={isPasswordVisible ? '隐藏密码' : '显示密码'}
      >
        {isPasswordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    );
  };
  
  // 渲染错误消息
  const renderError = () => {
    if (!showError || (!errorMessage && !localError && isValid !== false)) return null;
    
    const message = errorMessage || localError || '输入无效';
    
    return (
      <div className={`form-error-message ${errorMessageClassName}`}>
        <AlertCircle size={14} className="inline-block mr-1" />
        {message}
      </div>
    );
  };
  
  // 渲染成功消息
  const renderSuccess = () => {
    if (!successMessage && isValid !== true) return null;
    
    const message = successMessage || '输入有效';
    
    return (
      <div className="form-success-message">
        <CheckCircle2 size={14} className="inline-block mr-1" />
        {message}
      </div>
    );
  };
  
  // 渲染帮助文本
  const renderHelpText = () => {
    if (!showHelpText || !helpText) return null;
    
    return (
      <div className={`form-help-text ${helpTextClassName}`}>
        <Info size={14} className="inline-block mr-1" />
        {helpText}
      </div>
    );
  };
  
  // 渲染计数器
  const renderCounter = () => {
    if (!showCounter || !maxLength) return null;
    
    const count = inputValue.length;
    const isOverLimit = count > maxLength;
    
    return (
      <div className={`form-counter ${isOverLimit && 'form-counter-over'}`}>
        {count}/{maxLength}
      </div>
    );
  };
  
  // 渲染输入组
  const renderInputGroup = () => {
    return (
      <div className={getInputContainerClassName()}>
        {renderPrepend()}
        <input
          ref={mergedRef}
          id={name}
          name={name}
          type={type === 'password' && isPasswordVisible ? 'text' : type}
          value={inputValue}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          pattern={pattern}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          autoCorrect={autoCorrect}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={getInputClassName()}
          style={getInputStyles()}
          {...props}
        />
        {renderAppend()}
        {renderClearButton()}
        {renderPasswordToggle()}
        {renderCounter()}
      </div>
    );
  };
  
  return (
    <div className={`form-field ${className}`}>
      {renderLabel()}
      {renderInputGroup()}
      {renderError()}
      {renderSuccess()}
      {renderHelpText()}
    </div>
  );
};

export const EnhancedInputComponent = forwardRef(EnhancedInput);

// 增强文本域属性接口
export interface EnhancedTextareaProps extends FormFieldProps<string> {
  // 行数
  rows?: number;
  // 最大行数
  maxRows?: number;
  // 是否自动调整高度
  autoResize?: boolean;
  // 是否显示清除按钮
  showClearButton?: boolean;
  // 是否显示字数统计
  showCounter?: boolean;
  // 是否显示前缀
  showPrefix?: boolean;
  // 是否显示后缀
  showSuffix?: boolean;
  // 前缀图标
  prefixIcon?: React.ReactNode;
  // 后缀图标
  suffixIcon?: React.ReactNode;
}

/**
 * 增强文本域组件 - 提供高级文本域功能
 */
const EnhancedTextarea: React.ForwardRefRenderFunction<HTMLTextAreaElement, EnhancedTextareaProps> = ({
  name,
  value = '',
  defaultValue = '',
  label,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  rules = [],
  helpText,
  errorMessage,
  successMessage,
  size = 'md',
  showError = true,
  showLabel = true,
  showHelpText = true,
  minLength,
  maxLength,
  rows = 3,
  maxRows,
  autoResize = false,
  showClearButton = true,
  showCounter = false,
  showPrefix = true,
  showSuffix = true,
  prefixIcon,
  suffixIcon,
  onChange,
  onFocus,
  onBlur,
  className = '',
  labelClassName = '',
  inputClassName = '',
  helpTextClassName = '',
  errorMessageClassName = '',
  inputStyle = {},
  labelStyle = {},
  ...props
}, ref) => {
  const [textareaValue, setTextareaValue] = useState<string>(value || defaultValue);
  const [isFocused, setIsFocused] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [localError, setLocalError] = useState<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null) as React.MutableRefObject<HTMLTextAreaElement | null>;
  
  // 合并引用
  const mergedRef = useCallback((node: HTMLTextAreaElement | null) => {
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    textareaRef.current = node;
  }, [ref]);
  
  // 处理值变化
  useEffect(() => {
    if (value !== undefined && value !== textareaValue) {
      setTextareaValue(value);
    }
  }, [value, textareaValue]);
  
  // 自动调整高度
  useEffect(() => {
    if (autoResize && textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = 'auto';
      textarea.style.height = `${textarea.scrollHeight}px`;
      
      if (maxRows && textarea.scrollHeight > parseInt(getComputedStyle(textarea).lineHeight) * maxRows) {
        textarea.style.overflowY = 'auto';
        textarea.style.height = `${parseInt(getComputedStyle(textarea).lineHeight) * maxRows}px`;
      } else {
        textarea.style.overflowY = 'hidden';
      }
    }
  }, [autoResize, maxRows, textareaValue]);
  
  // 验证输入值
  const validateValue = useCallback((value: string) => {
    let isValid = true;
    let errorMsg = '';
    
    // 验证规则
    for (const rule of rules.sort((a, b) => (a.order || 0) - (b.order || 0))) {
      const result = rule.validate(value);
      if (result !== true) {
        isValid = false;
        errorMsg = result === false ? rule.message || '输入无效' : result;
        break;
      }
    }
    
    setIsValid(isValid);
    setLocalError(errorMsg);
    
    return { isValid, errorMsg };
  }, [rules]);
  
  // 处理输入变化
  const handleChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = event.target.value;
    setTextareaValue(newValue);
    
    // 验证输入
    validateValue(newValue);
    
    // 调用原始回调
    if (onChange) {
      onChange(newValue, name, event);
    }
  };
  
  // 处理聚焦
  const handleFocus = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(true);
    
    if (onFocus) {
      onFocus(event);
    }
  };
  
  // 处理失焦
  const handleBlur = (event: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    
    // 失焦时验证
    validateValue(event.target.value);
    
    if (onBlur) {
      onBlur(event);
    }
  };
  
  // 清除输入
  const handleClear = () => {
    const event = { target: { value: '' } } as React.ChangeEvent<HTMLTextAreaElement>;
    setTextareaValue('');
    setIsValid(null);
    setLocalError('');
    
    if (onChange) {
      onChange('', name, event);
    }
  };
  
  // 获取输入尺寸样式
  const getSizeStyles = useCallback(() => {
    const sizeMap = {
      sm: { padding: '0.375rem 0.5rem', fontSize: '0.75rem', minHeight: '4rem' },
      md: { padding: '0.5rem 0.75rem', fontSize: '0.875rem', minHeight: '6rem' },
      lg: { padding: '0.625rem 1rem', fontSize: '1rem', minHeight: '8rem' },
      xl: { padding: '0.75rem 1.25rem', fontSize: '1.125rem', minHeight: '10rem' }
    };
    return sizeMap[size];
  }, [size]);
  
  // 获取文本域容器类名
  const getTextareaContainerClassName = useCallback(() => {
    const classes = [
      'textarea-container',
      `textarea-${size}`,
      isFocused && 'textarea-focused',
      disabled && 'textarea-disabled',
      readOnly && 'textarea-readonly',
      (showError && (errorMessage || localError || isValid === false)) && 'textarea-error',
      isValid === true && 'textarea-success',
      (showPrefix && prefixIcon) && 'textarea-has-prefix',
      (showSuffix && suffixIcon) && 'textarea-has-suffix',
      (showClearButton && textareaValue && !disabled && !readOnly) && 'textarea-has-clear'
    ].filter(Boolean).join(' ');
    return classes;
  }, [disabled, errorMessage, isFocused, isValid, localError, prefixIcon, readOnly, showClearButton, showError, showPrefix, showSuffix, size, suffixIcon, textareaValue]);
  
  // 获取文本域类名
  const getTextareaClassName = useCallback(() => {
    const classes = [
      'form-textarea',
      `form-textarea-${size}`,
      isFocused && 'form-textarea-focused',
      disabled && 'form-textarea-disabled',
      readOnly && 'form-textarea-readonly',
      (showError && (errorMessage || localError || isValid === false)) && 'form-textarea-error',
      isValid === true && 'form-textarea-success',
      inputClassName
    ].filter(Boolean).join(' ');
    return classes;
  }, [disabled, errorMessage, inputClassName, isFocused, isValid, localError, readOnly, showError, size]);
  
  // 获取文本域样式
  const getTextareaStyles = useCallback(() => {
    const sizeStyles = getSizeStyles();
    let paddingLeft = sizeStyles.padding;
    let paddingRight = sizeStyles.padding;
    
    // 调整内边距以适应附加元素
    if (showPrefix && prefixIcon) {
      paddingLeft = `2.5rem`;
    }
    
    if (showSuffix && suffixIcon) {
      paddingRight = `2.5rem`;
    }
    
    if (showClearButton && textareaValue && !disabled && !readOnly) {
      paddingRight = `2.5rem`;
    }
    
    return {
      ...sizeStyles,
      paddingLeft,
      paddingRight,
      ...inputStyle
    };
  }, [disabled, getSizeStyles, inputStyle, prefixIcon, readOnly, showClearButton, showPrefix, showSuffix, suffixIcon, textareaValue]);
  
  // 渲染标签
  const renderLabel = () => {
    if (!showLabel || !label) return null;
    
    return (
      <label 
        htmlFor={name} 
        className={`form-label ${labelClassName} ${required && 'form-label-required'} ${(showError && (errorMessage || localError || isValid === false)) && 'form-label-error'}`}
        style={labelStyle}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  };
  
  // 渲染清除按钮
  const renderClearButton = () => {
    if (!showClearButton || !textareaValue || disabled || readOnly) return null;
    
    return (
      <button 
        type="button"
        className="textarea-clear-button"
        onClick={handleClear}
        aria-label="清除输入"
        title="清除输入"
      >
        <X size={16} />
      </button>
    );
  };
  
  // 渲染错误消息
  const renderError = () => {
    if (!showError || (!errorMessage && !localError && isValid !== false)) return null;
    
    const message = errorMessage || localError || '输入无效';
    
    return (
      <div className={`form-error-message ${errorMessageClassName}`}>
        <AlertCircle size={14} className="inline-block mr-1" />
        {message}
      </div>
    );
  };
  
  // 渲染成功消息
  const renderSuccess = () => {
    if (!successMessage && isValid !== true) return null;
    
    const message = successMessage || '输入有效';
    
    return (
      <div className="form-success-message">
        <CheckCircle2 size={14} className="inline-block mr-1" />
        {message}
      </div>
    );
  };
  
  // 渲染帮助文本
  const renderHelpText = () => {
    if (!showHelpText || !helpText) return null;
    
    return (
      <div className={`form-help-text ${helpTextClassName}`}>
        <Info size={14} className="inline-block mr-1" />
        {helpText}
      </div>
    );
  };
  
  // 渲染计数器
  const renderCounter = () => {
    if (!showCounter || !maxLength) return null;
    
    const count = textareaValue.length;
    const isOverLimit = count > maxLength;
    
    return (
      <div className={`form-counter ${isOverLimit && 'form-counter-over'}`}>
        {count}/{maxLength}
      </div>
    );
  };
  
  // 渲染文本域
  const renderTextarea = () => {
    return (
      <div className={getTextareaContainerClassName()}>
        {showPrefix && prefixIcon && (
          <div className="textarea-prefix">{prefixIcon}</div>
        )}
        <textarea
          ref={mergedRef}
          id={name}
          name={name}
          value={textareaValue}
          defaultValue={defaultValue}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          minLength={minLength}
          maxLength={maxLength}
          rows={rows}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={getTextareaClassName()}
          style={getTextareaStyles()}
          {...props}
        />
        {showSuffix && suffixIcon && (
          <div className="textarea-suffix">{suffixIcon}</div>
        )}
        {renderClearButton()}
        {renderCounter()}
      </div>
    );
  };
  
  return (
    <div className={`form-field ${className}`}>
      {renderLabel()}
      {renderTextarea()}
      {renderError()}
      {renderSuccess()}
      {renderHelpText()}
    </div>
  );
};

export const EnhancedTextareaComponent = forwardRef(EnhancedTextarea);

// 增强选择器属性接口
export interface EnhancedSelectProps extends FormFieldProps<any> {
  // 选项列表
  options: Option[];
  // 是否多选
  multiple?: boolean;
  // 是否显示搜索
  showSearch?: boolean;
  // 是否显示清除按钮
  showClearButton?: boolean;
  // 是否显示下拉箭头
  showArrow?: boolean;
  // 是否显示空选项
  showEmptyOption?: boolean;
  // 空选项文本
  emptyOptionLabel?: string;
  // 是否显示分组
  showGroups?: boolean;
  // 搜索占位符
  searchPlaceholder?: string;
  // 无结果文本
  noResultsText?: string;
  // 已选文本格式
  selectedTextFormat?: (selectedOptions: Option[]) => string;
  // 选项渲染器
  optionRenderer?: (option: Option, index: number) => React.ReactNode;
  // 分组标题渲染器
  groupRenderer?: (group: string) => React.ReactNode;
  // 加载状态
  loading?: boolean;
  // 加载文本
  loadingText?: string;
}

/**
 * 增强选择器组件 - 提供高级下拉选择功能
 */
const EnhancedSelect: React.ForwardRefRenderFunction<HTMLSelectElement, EnhancedSelectProps> = ({
  name,
  value,
  defaultValue,
  label,
  placeholder,
  disabled = false,
  readOnly = false,
  required = false,
  rules = [],
  helpText,
  errorMessage,
  infoMessage,
  successMessage,
  size = 'md',
  showError = true,
  showLabel = true,
  showHelpText = true,
  options = [],
  multiple = false,
  showSearch = false,
  showClearButton = true,
  showArrow = true,
  showEmptyOption = true,
  emptyOptionLabel = '请选择',
  showGroups = true,
  searchPlaceholder = '搜索选项...',
  noResultsText = '无匹配结果',
  selectedTextFormat,
  optionRenderer,
  groupRenderer,
  loading = false,
  loadingText = '加载中...',
  onChange,
  onFocus,
  onBlur,
  className = '',
  labelClassName = '',
  inputClassName = '',
  helpTextClassName = '',
  errorMessageClassName = '',
  inputStyle = {},
  labelStyle = {},
  style = {},
  ...props
}, ref) => {
  const [selectedValue, setSelectedValue] = useState(value !== undefined ? value : (defaultValue !== undefined ? defaultValue : (multiple ? [] : '')));
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>([]);
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [localError, setLocalError] = useState('');
  const selectRef = useRef<HTMLSelectElement>(null) as React.MutableRefObject<HTMLSelectElement | null>;

  
  // 合并引用
  const mergedRef = useCallback((node: HTMLSelectElement | null) => {
    if (typeof ref === 'function') {
      ref(node);
    } else if (ref) {
      ref.current = node;
    }
    selectRef.current = node;
  }, [ref]);
  
  // 处理值变化
  useEffect(() => {
    if (value !== undefined && value !== selectedValue) {
      setSelectedValue(value);
    }
  }, [value]);
  
  // 过滤选项
  useEffect(() => {
    let filtered = [...options];
    
    // 搜索过滤
    if (showSearch && searchValue) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(option => 
        option.label.toLowerCase().includes(searchLower) ||
        String(option.value).toLowerCase().includes(searchLower)
      );
    }
    
    // 空选项处理
    if (showEmptyOption && !multiple) {
      filtered = [{ value: '', label: emptyOptionLabel }, ...filtered];
    }
    
    setFilteredOptions(filtered);
  }, [emptyOptionLabel, multiple, options, searchValue, showEmptyOption, showSearch]);
  
  // 验证选择值
  const validateValue = useCallback((val: any) => {
    let isValid = true;
    let errorMsg = '';
    
    // 验证规则
    for (const rule of rules.sort((a, b) => (a.order || 0) - (b.order || 0))) {
      const result = rule.validate(val);
      if (result !== true) {
        isValid = false;
        errorMsg = result === false ? rule.message || '选择无效' : result;
        break;
      }
    }
    
    setIsValid(isValid);
    setLocalError(errorMsg);
    
    return { isValid, errorMsg };
  }, [rules]);
  
  // 处理选择变化
  const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    let newValue;
    
    if (multiple) {
      const select = event.target;
      newValue = Array.from(select.selectedOptions, option => option.value);
    } else {
      newValue = event.target.value;
    }
    
    setSelectedValue(newValue);
    
    // 验证选择
    validateValue(newValue);
    
    // 调用原始回调
    if (onChange) {
      onChange(newValue, name, event);
    }
  };
  
  // 处理聚焦
  const handleFocus = (event: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(true);
    setIsOpen(true);
    
    if (onFocus) {
      onFocus(event);
    }
  };
  
  // 处理失焦
  const handleBlur = (event: React.FocusEvent<HTMLSelectElement>) => {
    setIsFocused(false);
    setIsOpen(false);
    
    // 失焦时验证
    validateValue(selectedValue);
    
    if (onBlur) {
      onBlur(event);
    }
  };
  
  // 清除选择
  const handleClear = () => {
    const event = { target: { value: multiple ? [] : '' } } as React.ChangeEvent<HTMLSelectElement>;
    const newValue = multiple ? [] : '';
    setSelectedValue(newValue);
    setIsValid(null);
    setLocalError('');
    setSearchValue('');
    
    if (onChange) {
      onChange(newValue, name, event);
    }
  };
  

  

  
  // 获取尺寸样式
  const getSizeStyles = useCallback(() => {
    const sizeMap = {
      sm: { padding: '0.375rem 1.5rem 0.375rem 0.5rem', fontSize: '0.75rem', height: '2rem' },
      md: { padding: '0.5rem 1.5rem 0.5rem 0.75rem', fontSize: '0.875rem', height: '2.5rem' },
      lg: { padding: '0.625rem 1.5rem 0.625rem 1rem', fontSize: '1rem', height: '3rem' },
      xl: { padding: '0.75rem 1.5rem 0.75rem 1.25rem', fontSize: '1.125rem', height: '3.5rem' }
    };
    return sizeMap[size];
  }, [size]);
  
  // 获取选择器容器类名
  const getSelectContainerClassName = useCallback(() => {
    const classes = [
      'select-container',
      `select-${size}`,
      isFocused && 'select-focused',
      isOpen && 'select-open',
      disabled && 'select-disabled',
      readOnly && 'select-readonly',
      (showError && (errorMessage || localError || isValid === false)) && 'select-error',
      isValid === true && 'select-success',
      multiple && 'select-multiple',
      showSearch && 'select-searchable',
      (showClearButton && (selectedValue && selectedValue !== '' && (multiple ? selectedValue.length > 0 : true)) && !disabled && !readOnly) && 'select-has-clear',
      showArrow && 'select-has-arrow'
    ].filter(Boolean).join(' ');
    return classes;
  }, [disabled, errorMessage, isFocused, isOpen, isValid, localError, multiple, readOnly, selectedValue, showArrow, showClearButton, showError, showSearch, size]);
  
  // 获取选择器类名
  const getSelectClassName = useCallback(() => {
    const classes = [
      'form-select',
      `form-select-${size}`,
      isFocused && 'form-select-focused',
      isOpen && 'form-select-open',
      disabled && 'form-select-disabled',
      readOnly && 'form-select-readonly',
      (showError && (errorMessage || localError || isValid === false)) && 'form-select-error',
      isValid === true && 'form-select-success',
      multiple && 'form-select-multiple',
      inputClassName
    ].filter(Boolean).join(' ');
    return classes;
  }, [disabled, errorMessage, inputClassName, isFocused, isOpen, isValid, localError, multiple, readOnly, showError, size]);
  
  // 获取选择器样式
  const getSelectStyles = useCallback(() => {
    const sizeStyles = getSizeStyles();
    return {
      ...sizeStyles,
      ...inputStyle
    };
  }, [getSizeStyles, inputStyle]);
  
  // 渲染标签
  const renderLabel = () => {
    if (!showLabel || !label) return null;
    
    return (
      <label 
        htmlFor={name} 
        className={`form-label ${labelClassName} ${required && 'form-label-required'} ${(showError && (errorMessage || localError || isValid === false)) && 'form-label-error'}`}
        style={labelStyle}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  };
  
  // 渲染清除按钮
  const renderClearButton = () => {
    if (!showClearButton || disabled || readOnly) return null;
    
    const hasValue = multiple ? 
      Array.isArray(selectedValue) && selectedValue.length > 0 : 
      selectedValue && selectedValue !== '';
    
    if (!hasValue) return null;
    
    return (
      <button 
        type="button"
        className="select-clear-button"
        onClick={handleClear}
        aria-label="清除选择"
        title="清除选择"
      >
        <X size={16} />
      </button>
    );
  };
  
  // 渲染下拉箭头
  const renderArrow = () => {
    if (!showArrow) return null;
    
    return (
      <div className="select-arrow">
        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </div>
    );
  };
  
  // 渲染错误消息
  const renderError = () => {
    if (!showError || (!errorMessage && !localError && isValid !== false)) return null;
    
    const message = errorMessage || localError || '选择无效';
    
    return (
      <div className={`form-error-message ${errorMessageClassName}`}>
        <AlertCircle size={14} className="inline-block mr-1" />
        {message}
      </div>
    );
  };
  
  // 渲染成功消息
  const renderSuccess = () => {
    if (!successMessage && isValid !== true) return null;
    
    const message = successMessage || '选择有效';
    
    return (
      <div className="form-success-message">
        <CheckCircle2 size={14} className="inline-block mr-1" />
        {message}
      </div>
    );
  };
  
  // 渲染帮助文本
  const renderHelpText = () => {
    if (!showHelpText || !helpText) return null;
    
    return (
      <div className={`form-help-text ${helpTextClassName}`}>
        <Info size={14} className="inline-block mr-1" />
        {helpText}
      </div>
    );
  };
  
  // 渲染选择器
  const renderSelect = () => {
    return (
      <div className={getSelectContainerClassName()}>
        <select
          ref={mergedRef}
          id={name}
          name={name}
          value={selectedValue}
          defaultValue={defaultValue}
          disabled={disabled}
          required={required}
          multiple={multiple}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          className={getSelectClassName()}
          style={getSelectStyles()}
          {...props}
        >
          {showEmptyOption && !multiple && (
            <option value="">{emptyOptionLabel}</option>
          )}
          {filteredOptions.map((option, index) => (
            <option 
              key={`${option.value}-${index}`} 
              value={option.value}
              disabled={option.disabled}
              selected={option.selected}
            >
              {option.label}
            </option>
          ))}
        </select>
        {renderClearButton()}
        {renderArrow()}
      </div>
    );
  };
  
  return (
    <div className={`form-field ${className}`}>
      {renderLabel()}
      {renderSelect()}
      {renderError()}
      {renderSuccess()}
      {renderHelpText()}
    </div>
  );
};

export const EnhancedSelectComponent = forwardRef(EnhancedSelect);

// 增强复选框组属性接口
export interface EnhancedCheckboxGroupProps extends FormFieldProps<string[]> {
  // 选项列表
  options: Option[];
  // 布局方向
  orientation?: 'horizontal' | 'vertical';
  // 是否显示全选
  showSelectAll?: boolean;
  // 全选文本
  selectAllText?: string;
  // 全选位置
  selectAllPosition?: 'top' | 'bottom' | 'both';
  // 选项间距
  spacing?: string;
  // 选项渲染器
  optionRenderer?: (option: Option, index: number, checked: boolean) => React.ReactNode;
}

/**
 * 增强复选框组组件 - 提供高级复选框组功能
 */
const EnhancedCheckboxGroup: React.FC<EnhancedCheckboxGroupProps> = ({
  name,
  value = [],
  defaultValue = [],
  label,
  disabled = false,
  readOnly = false,
  required = false,
  rules = [],
  helpText,
  errorMessage,
  successMessage,
  size = 'md',
  showError = true,
  showLabel = true,
  showHelpText = true,
  options = [],
  orientation = 'vertical',
  showSelectAll = true,
  selectAllText = '全选',
  selectAllPosition = 'top',
  spacing = '0.5rem',
  optionRenderer,
  onChange,
  className = '',
  labelClassName = '',
  inputClassName = '',
  helpTextClassName = '',
  errorMessageClassName = '',
  inputStyle = {},
  labelStyle = {}
}) => {
  const [checkedValues, setCheckedValues] = useState<string[]>(value.length > 0 ? value : (defaultValue.length > 0 ? defaultValue : []));
  const [isValid, setIsValid] = useState<boolean | null>(null);
  const [localError, setLocalError] = useState('');
  useResponsive();
  
  // 处理值变化
  useEffect(() => {
    if (value.length > 0 && JSON.stringify(value) !== JSON.stringify(checkedValues)) {
      setCheckedValues(value);
    }
  }, [value]);
  
  // 验证选择值
  const validateValue = useCallback((val: string[]) => {
    let isValid = true;
    let errorMsg = '';
    
    // 验证规则
    for (const rule of rules.sort((a, b) => (a.order || 0) - (b.order || 0))) {
      const result = rule.validate(val);
      if (result !== true) {
        isValid = false;
        errorMsg = result === false ? rule.message || '选择无效' : result;
        break;
      }
    }
    
    setIsValid(isValid);
    setLocalError(errorMsg);
    
    return { isValid, errorMsg };
  }, [rules]);
  
  // 处理复选框变化
  const handleCheckboxChange = (optionValue: string) => {
    if (disabled || readOnly) return;
    
    const newValues = checkedValues.includes(optionValue)
      ? checkedValues.filter(v => v !== optionValue)
      : [...checkedValues, optionValue];
    
    setCheckedValues(newValues);
    validateValue(newValues);
    
    if (onChange) {
      const event = { target: { value: newValues } } as any;
      onChange(newValues, name, event);
    }
  };
  
  // 全选/取消全选
  const handleSelectAll = () => {
    if (disabled || readOnly) return;
    
    const enabledOptions = options.filter(option => !option.disabled).map(option => option.value);
    const allChecked = enabledOptions.every(option => checkedValues.includes(option));
    
    const newValues = allChecked
      ? checkedValues.filter(value => !enabledOptions.includes(value))
      : [...new Set([...checkedValues, ...enabledOptions])];
    
    setCheckedValues(newValues);
    validateValue(newValues);
    
    if (onChange) {
      const event = { target: { value: newValues } } as any;
      onChange(newValues, name, event);
    }
  };
  
  // 检查是否全选
  const isAllSelected = useCallback(() => {
    const enabledOptions = options.filter(option => !option.disabled);
    return enabledOptions.length > 0 && enabledOptions.every(option => checkedValues.includes(option.value));
  }, [checkedValues, options]);
  
  // 检查是否部分选中
  const isPartialSelected = useCallback(() => {
    const enabledOptions = options.filter(option => !option.disabled);
    const checkedCount = enabledOptions.filter(option => checkedValues.includes(option.value)).length;
    return checkedCount > 0 && checkedCount < enabledOptions.length;
  }, [checkedValues, options]);
  
  // 获取布局样式
  const getLayoutStyles = useCallback(() => {
    return {
      flexDirection: orientation === 'horizontal' ? 'row' : 'column',
      gap: spacing
    };
  }, [orientation, spacing]);
  
  // 渲染标签
  const renderLabel = () => {
    if (!showLabel || !label) return null;
    
    return (
      <label 
        className={`form-label ${labelClassName} ${required && 'form-label-required'} ${(showError && (errorMessage || localError || isValid === false)) && 'form-label-error'}`}
        style={labelStyle}
      >
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
    );
  };
  
  // 渲染全选复选框
  const renderSelectAll = (position: 'top' | 'bottom') => {
    if (!showSelectAll || selectAllPosition !== position && selectAllPosition !== 'both') return null;
    
    const allSelected = isAllSelected();
    const partialSelected = isPartialSelected();
    
    return (
      <div className="checkbox-group-select-all">
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={handleSelectAll}
            disabled={disabled || readOnly || options.filter(option => !option.disabled).length === 0}
            className={`checkbox-input checkbox-input-${size} ${inputClassName}`}
            ref={(input) => {
              if (input) {
                input.indeterminate = partialSelected;
              }
            }}
          />
          <span className="checkbox-text">{selectAllText}</span>
        </label>
      </div>
    );
  };
  
  // 渲染复选框选项
  const renderCheckboxOptions = () => {
    return options.map((option, index) => {
      const checked = checkedValues.includes(option.value);
      
      if (optionRenderer) {
        return optionRenderer(option, index, checked);
      }
      
      return (
        <label key={`${option.value}-${index}`} className="checkbox-label">
          <input
            type="checkbox"
            name={`${name}[${index}]`}
            value={option.value}
            checked={checked}
            onChange={() => handleCheckboxChange(option.value)}
            disabled={disabled || readOnly || option.disabled}
            className={`checkbox-input checkbox-input-${size} ${inputClassName}`}
            style={inputStyle}
          />
          <span className="checkbox-text">{option.label}</span>
          {option.description && (
            <span className="checkbox-description">{option.description}</span>
          )}
        </label>
      );
    });
  };
  
  // 渲染错误消息
  const renderError = () => {
    if (!showError || (!errorMessage && !localError && isValid !== false)) return null;
    
    const message = errorMessage || localError || '选择无效';
    
    return (
      <div className={`form-error-message ${errorMessageClassName}`}>
        <AlertCircle size={14} className="inline-block mr-1" />
        {message}
      </div>
    );
  };
  
  // 渲染成功消息
  const renderSuccess = () => {
    if (!successMessage && isValid !== true) return null;
    
    const message = successMessage || '选择有效';
    
    return (
      <div className="form-success-message">
        <CheckCircle2 size={14} className="inline-block mr-1" />
        {message}
      </div>
    );
  };
  
  // 渲染帮助文本
  const renderHelpText = () => {
    if (!showHelpText || !helpText) return null;
    
    return (
      <div className={`form-help-text ${helpTextClassName}`}>
        <Info size={14} className="inline-block mr-1" />
        {helpText}
      </div>
    );
  };
  
  return (
    <div className={`form-field checkbox-group ${className}`}>
      {renderLabel()}
      <div className="checkbox-group-options" style={getLayoutStyles()}>
        {renderSelectAll('top')}
        {renderCheckboxOptions()}
        {renderSelectAll('bottom')}
      </div>
      {renderError()}
      {renderSuccess()}
      {renderHelpText()}
    </div>
  );
};

// 表单验证工具函数
export const formUtils = {
  // 创建必填验证规则
  required: (message?: string): ValidationRule => ({
    name: 'required',
    validate: (value: any) => {
      if (value === null || value === undefined || value === '') return false;
      if (Array.isArray(value) && value.length === 0) return false;
      return true;
    },
    message: message || '此项为必填项',
    required: true,
    trigger: 'blur'
  }),
  
  // 创建最小长度验证规则
  minLength: (length: number, message?: string): ValidationRule => ({
    name: 'minLength',
    validate: (value: string) => {
      if (!value) return true;
      return value.length >= length;
    },
    message: message || `最少需要${length}个字符`,
    trigger: 'change'
  }),
  
  // 创建最大长度验证规则
  maxLength: (length: number, message?: string): ValidationRule => ({
    name: 'maxLength',
    validate: (value: string) => {
      if (!value) return true;
      return value.length <= length;
    },
    message: message || `最多允许${length}个字符`,
    trigger: 'change'
  }),
  
  // 创建邮箱验证规则
  email: (message?: string): ValidationRule => ({
    name: 'email',
    validate: (value: string) => {
      if (!value) return true;
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    },
    message: message || '请输入有效的邮箱地址',
    trigger: 'blur'
  }),
  
  // 创建URL验证规则
  url: (message?: string): ValidationRule => ({
    name: 'url',
    validate: (value: string) => {
      if (!value) return true;
      try {
        new URL(value);
        return true;
      } catch {
        return false;
      }
    },
    message: message || '请输入有效的URL地址',
    trigger: 'blur'
  }),
  
  // 创建数字验证规则
  number: (message?: string): ValidationRule => ({
    name: 'number',
    validate: (value: string) => {
      if (!value) return true;
      return !isNaN(Number(value));
    },
    message: message || '请输入有效的数字',
    trigger: 'change'
  }),
  
  // 创建最小数值验证规则
  min: (min: number, message?: string): ValidationRule => ({
    name: 'min',
    validate: (value: string | number) => {
      if (!value && value !== 0) return true;
      return Number(value) >= min;
    },
    message: message || `最小值为${min}`,
    trigger: 'change'
  }),
  
  // 创建最大数值验证规则
  max: (max: number, message?: string): ValidationRule => ({
    name: 'max',
    validate: (value: string | number) => {
      if (!value && value !== 0) return true;
      return Number(value) <= max;
    },
    message: message || `最大值为${max}`,
    trigger: 'change'
  }),
  
  // 创建正则表达式验证规则
  pattern: (regex: RegExp, message: string): ValidationRule => ({
    name: 'pattern',
    validate: (value: string) => {
      if (!value) return true;
      return regex.test(value);
    },
    message: message,
    trigger: 'blur'
  }),
  
  // 创建自定义验证规则
  custom: (validator: (value: any, formValues?: Record<string, any>) => boolean | string, message: string, trigger: ValidationRule['trigger'] = 'blur'): ValidationRule => ({
    name: 'custom',
    validate: validator,
    message: message,
    trigger: trigger
  }),
  
  // 验证整个表单
  validateForm: (values: Record<string, any>, fieldRules: Record<string, ValidationRule[]>): Record<string, string> => {
    const errors: Record<string, string> = {};
    
    Object.entries(fieldRules).forEach(([fieldName, rules]) => {
      const value = values[fieldName];
      
      for (const rule of rules) {
        const result = rule.validate(value, values);
        if (result !== true) {
          errors[fieldName] = result === false ? rule.message || '输入无效' : result;
          break; // 只显示第一个错误
        }
      }
    });
    
    return errors;
  },
  
  // 检查表单是否有效
  isFormValid: (errors: Record<string, string>): boolean => {
    return Object.keys(errors).length === 0;
  },
  
  // 生成表单错误消息
  generateErrorMessage: (error: unknown, defaultMessage: string = '操作失败'): string => {
    if (typeof error === 'string') return error;
    if (error instanceof Error) return error.message;
    if (typeof error === 'object' && error !== null) {
      const errorObj = error as Record<string, any>;
      if (errorObj.message) return errorObj.message;
      if (errorObj.error) return errorObj.error;
    }
    return defaultMessage;
  }
};

// 表单组件样式 (使用Tailwind CSS)
const formStyles = `
/* 表单字段容器 */
.form-field {
  @apply relative mb-4;
}

/* 表单标签 */
.form-label {
  @apply block text-sm font-medium text-gray-700 mb-1;
}

.form-label-required::after {
  @apply content-['*'] ml-1 text-red-500;
}

.form-label-error {
  @apply text-red-600;
}

/* 输入框基础样式 */
.form-input,
.form-textarea,
.form-select {
  @apply block w-full rounded-md border border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 transition-all;
}

/* 输入框尺寸 */
.form-input-sm,
.form-select-sm {
  @apply text-xs py-1 px-2 h-8;
}

.form-input-md,
.form-select-md {
  @apply text-sm py-2 px-3 h-10;
}

.form-input-lg,
.form-select-lg {
  @apply text-base py-2.5 px-4 h-12;
}

.form-input-xl,
.form-select-xl {
  @apply text-lg py-3 px-5 h-14;
}

/* 文本域尺寸 */
.form-textarea-sm {
  @apply text-xs py-1 px-2 min-h-[4rem];
}

.form-textarea-md {
  @apply text-sm py-2 px-3 min-h-[6rem];
}

.form-textarea-lg {
  @apply text-base py-2.5 px-4 min-h-[8rem];
}

.form-textarea-xl {
  @apply text-lg py-3 px-5 min-h-[10rem];
}

/* 输入框状态 */
.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  @apply outline-none ring-2 ring-blue-500 ring-opacity-50 border-blue-500;
}

.form-input-error,
.form-textarea-error,
.form-select-error {
  @apply border-red-500 ring ring-red-500 ring-opacity-20;
}

.form-input-success,
.form-textarea-success,
.form-select-success {
  @apply border-green-500 ring ring-green-500 ring-opacity-20;
}

.form-input-disabled,
.form-textarea-disabled,
.form-select-disabled {
  @apply bg-gray-50 border-gray-300 text-gray-500 cursor-not-allowed;
}

.form-input-readonly,
.form-textarea-readonly {
  @apply bg-gray-50;
}

/* 输入组样式 */
.input-container,
.textarea-container,
.select-container {
  @apply relative;
}

.input-prepend,
.input-append,
.textarea-prefix,
.textarea-suffix {
  @apply absolute inset-y-0 flex items-center justify-center px-3 text-gray-500 pointer-events-none;
}

.input-prepend {
  @apply left-0 border-r border-gray-300;
}

.input-append {
  @apply right-0 border-l border-gray-300;
}

/* 清除按钮样式 */
.input-clear-button,
.textarea-clear-button {
  @apply absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors;
}

.input-password-toggle {
  @apply absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors;
}

/* 下拉箭头样式 */
.select-arrow {
  @apply absolute inset-y-0 right-0 flex items-center justify-center px-3 text-gray-500 pointer-events-none;
}

/* 复选框组样式 */
.checkbox-group-options {
  @apply flex flex-wrap gap-3;
}

.checkbox-label {
  @apply flex items-center gap-2 cursor-pointer;
}

.checkbox-input {
  @apply w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500;
}

.checkbox-text {
  @apply text-sm text-gray-700;
}

.checkbox-description {
  @apply text-xs text-gray-500 ml-6 block;
}

.checkbox-group-select-all {
  @apply mb-2;
}

/* 错误消息样式 */
.form-error-message {
  @apply mt-1 text-sm text-red-600 flex items-center;
}

/* 成功消息样式 */
.form-success-message {
  @apply mt-1 text-sm text-green-600 flex items-center;
}

/* 帮助文本样式 */
.form-help-text {
  @apply mt-1 text-sm text-gray-500 flex items-center;
}

/* 计数器样式 */
.form-counter {
  @apply absolute -right-8 top-0 text-xs text-gray-500 min-w-[40px] text-center;
}

.form-counter-over {
  @apply text-red-500;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .form-field {
    @apply mb-3;
  }
  
  .checkbox-group-options {
    @apply flex-col;
  }
}

/* 表单动画效果 */
.form-input,
.form-textarea,
.form-select {
  @apply transition-all duration-200 ease-in-out;
}

/* 聚焦动画 */
.input-focused .form-input,
.textarea-focused .form-textarea,
.select-focused .form-select {
  @apply transform scale-[1.01];
}

/* 错误状态动画 */
.input-error .form-input,
.textarea-error .form-textarea,
.select-error .form-select {
  @apply animate-pulse duration-1000;
}

/* 加载状态 */
.form-loading {
  @apply opacity-70 pointer-events-none;
}

/* 表单提示气泡 */
.form-tooltip {
  @apply absolute z-10 invisible opacity-0 transition-opacity duration-200 bg-gray-800 text-white text-xs py-1 px-2 rounded shadow-lg;
}

.form-field:hover .form-tooltip {
  @apply visible opacity-100;
}
`;

// 默认导出
export default {
  EnhancedInput: EnhancedInputComponent,
  EnhancedTextarea: EnhancedTextareaComponent,
  EnhancedSelect: EnhancedSelectComponent,
  EnhancedCheckboxGroup,
  formUtils,
  formStyles
};

// 导出所有组件
export {
  EnhancedInputComponent as EnhancedInput,
  EnhancedTextareaComponent as EnhancedTextarea,
  EnhancedSelectComponent as EnhancedSelect,
  EnhancedCheckboxGroup
};

// 类型已在定义时单独导出，此处不再重复导出
/**
 * @file 输入框组件
 * @description 提供统一的表单输入样式和交互行为
 * @module ui/Input
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import type { VariantProps } from 'class-variance-authority';
import { cva } from 'class-variance-authority';

// 输入框变体样式定义
const inputVariants = cva(
  [
    'flex',
    'h-10',
    'w-full',
    'rounded-md',
    'border',
    'bg-background',
    'px-3',
    'py-2',
    'text-sm',
    'ring-offset-background',
    'placeholder:text-muted-foreground',
    'focus-visible:outline-none',
    'focus-visible:ring-2',
    'focus-visible:ring-ring',
    'focus-visible:ring-offset-2',
    'disabled:cursor-not-allowed',
    'disabled:opacity-50',
    'transition-all',
    'duration-200',
  ],
  {
    variants: {
      variant: {
        // 默认输入框样式
        default: 'border-input text-foreground focus-visible:border-primary',
        // 错误状态样式
        error: 'border-destructive focus-visible:border-destructive',
        // 成功状态样式
        success: 'border-green-500 focus-visible:border-green-500',
        // 次要输入框样式
        secondary: 'border-secondary/30 focus-visible:border-secondary',
        // 只读输入框样式
        readOnly: 'bg-muted border-muted',
      },
      size: {
        // 小型输入框
        sm: 'h-9 text-xs',
        // 中型输入框（默认）
        md: 'h-10 text-sm',
        // 大型输入框
        lg: 'h-11 text-base',
      },
      isInvalid: {
        true: 'border-destructive focus-visible:border-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
      isInvalid: false,
    },
  }
);

// 输入框属性接口
export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  // 左侧图标
  leftIcon?: React.ReactNode;
  // 右侧图标
  rightIcon?: React.ReactNode;
  // 是否显示错误信息
  error?: string;
  // 是否显示成功信息
  success?: string;
  // 是否显示帮助信息
  helperText?: string;
  // 是否为必填项
  required?: boolean;
  // 错误状态
  invalid?: boolean;
  // 标签文本
  label?: string;
  // 占位符文本（简写）
  placeholder?: string;
  // 是否为密码输入框
  password?: boolean;
}

// 输入框组件实现
export const Input = forwardRef<HTMLInputElement, InputProps>((props, ref) => {
  const {
    variant,
    size,
    leftIcon,
    rightIcon,
    error,
    success,
    helperText,
    required = false,
    invalid = false,
    label,
    placeholder,
    password = false,
    className,
    type,
    ...inputProps
  } = props;

  // 密码可见性状态
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  // 确定输入框类型
  const inputType = password ? (isPasswordVisible ? 'text' : 'password') : type;

  // 计算变体属性
  const variantProps = {
    variant: error || invalid ? 'error' : success ? 'success' : variant,
    size,
    isInvalid: !!error || !!invalid,
  };

  // 合并类名
  const combinedClassName = [inputVariants(variantProps), className].filter(Boolean).join(' ');

  return (
    <div className="flex flex-col space-y-1.5 w-full">
      {/* 标签 */}
      {label && (
        <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
          {required && <span className="text-destructive ml-1">*</span>}
        </label>
      )}

      {/* 带图标的输入框容器 */}
      <div className="relative">
        {/* 左侧图标 */}
        {leftIcon && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
            {leftIcon}
          </span>
        )}

        {/* 输入框 */}
        <input
          ref={ref}
          type={inputType}
          placeholder={placeholder}
          className={`
            ${combinedClassName}
            ${leftIcon ? 'pl-10' : ''}
            ${rightIcon || password ? 'pr-10' : ''}
          `}
          {...inputProps}
        />

        {/* 右侧图标 */}
        {rightIcon && !password && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {rightIcon}
          </span>
        )}

        {/* 密码切换按钮 */}
        {password && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground focus:outline-none"
            onClick={() => setIsPasswordVisible(!isPasswordVisible)}
            aria-label={isPasswordVisible ? '隐藏密码' : '显示密码'}
          >
            {isPasswordVisible ? (
              // 隐藏密码图标
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            ) : (
              // 显示密码图标
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
                />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* 错误信息 */}
      {error && (
        <p className="text-xs text-destructive mt-1 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          {error}
        </p>
      )}

      {/* 成功信息 */}
      {success && (
        <p className="text-xs text-green-500 mt-1 flex items-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3 w-3 mr-1.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 13l4 4L19 7"
            />
          </svg>
          {success}
        </p>
      )}

      {/* 帮助文本 */}
      {helperText && !error && !success && (
        <p className="text-xs text-muted-foreground mt-1">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
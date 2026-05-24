/**
 * @file Toast 通知组件
 * @description 提供统一的通知提示UI组件
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { AlertCircle, Check, Info, XCircle } from 'lucide-react';

// Toast 通知类型
export interface ToastProps {
  id: string;
  title?: string | undefined;
  description?: string | undefined;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info' | undefined;
  duration?: number | undefined;
  onDismiss: (id: string) => void;
}

/**
 * @description Toast 单个通知组件
 */
export const Toast: React.FC<ToastProps> = ({
  id,
  title,
  description,
  variant = 'default',
  duration = 3000,
  onDismiss,
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);

    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  // 根据变体类型设置样式
  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          bg: 'bg-red-50 border-red-200 dark:bg-red-950/50 dark:border-red-900/50',
          text: 'text-red-900 dark:text-red-50',
          icon: <XCircle className="h-4 w-4 text-red-500" />,
        };
      case 'success':
        return {
          bg: 'bg-green-50 border-green-200 dark:bg-green-950/50 dark:border-green-900/50',
          text: 'text-green-900 dark:text-green-50',
          icon: <Check className="h-4 w-4 text-green-500" />,
        };
      case 'warning':
        return {
          bg: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/50 dark:border-yellow-900/50',
          text: 'text-yellow-900 dark:text-yellow-50',
          icon: <AlertCircle className="h-4 w-4 text-yellow-500" />,
        };
      case 'info':
        return {
          bg: 'bg-blue-50 border-blue-200 dark:bg-blue-950/50 dark:border-blue-900/50',
          text: 'text-blue-900 dark:text-blue-50',
          icon: <Info className="h-4 w-4 text-blue-500" />,
        };
      default:
        return {
          bg: 'bg-background border border-input dark:bg-background/95',
          text: 'text-foreground',
          icon: null,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <div
      className={`group relative flex w-full items-center justify-between rounded-md border p-4 pr-10 shadow-md transition-all duration-300 animate-in fade-in slide-in-from-top-5 ${variantStyles.bg}`}
      style={{ maxWidth: '350px' }}
    >
      <div className="flex items-start gap-3">
        {variantStyles.icon && (
          <div className="mt-0.5 flex-shrink-0">{variantStyles.icon}</div>
        )}
        <div className={`space-y-1 ${variantStyles.text}`}>
          {title && <h3 className="font-medium text-sm">{title}</h3>}
          {description && (
            <p className="text-sm opacity-90">{description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDismiss(id)}
        className="absolute right-3 top-3 rounded-full p-1 text-muted-foreground opacity-0 transition-opacity duration-200 hover:text-foreground hover:bg-muted group-hover:opacity-100"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};

// Toast 容器组件接口
export interface ToastContainerProps {
  toasts: ToastProps[];
  onDismiss: (id: string) => void;
}

/**
 * @description Toast 通知容器组件
 */
export const ToastContainer: React.FC<ToastContainerProps> = ({
  toasts,
  onDismiss,
}) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          id={toast.id}
          title={toast.title}
          description={toast.description}
          variant={toast.variant}
          duration={toast.duration}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
};

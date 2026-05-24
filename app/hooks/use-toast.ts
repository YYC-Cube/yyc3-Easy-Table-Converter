/**
 * @file Toast 通知钩子
 * @description 提供统一的通知提示功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { useCallback, useState } from 'react';

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive' | 'success' | 'warning' | 'info';
  duration?: number;
}

interface ToastAction {
  (toast: Omit<Toast, 'id'>): void;
}

interface ToastReturn {
  toast: ToastAction;
  dismiss: (id?: string) => void;
  toasts: Toast[];
}

// 创建唯一ID
const generateId = (): string => {
  return Math.random().toString(36).substr(2, 9);
};

/**
 * @description Toast 通知钩子
 * @returns Toast 操作方法和当前通知列表
 */
export const useToast = (): ToastReturn => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  // 添加通知
  const toast = useCallback(<T extends Omit<Toast, 'id'>>({ ...props }: T) => {
    const id = generateId();
    
    setToasts((prevToasts) => [
      { id, ...props, duration: props.duration || 3000 },
      ...prevToasts,
    ]);

    // 自动关闭
    setTimeout(() => {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    }, props.duration || 3000);
  }, []);

  // 关闭通知
  const dismiss = useCallback((id?: string) => {
    if (id) {
      setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
    } else {
      setToasts([]);
    }
  }, []);

  return { toast, dismiss, toasts };
};

/**
 * @file Toast 全局上下文提供者
 * @description 提供全局的Toast通知功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastProps } from '@/components/ui/toast';

interface ToastContextType {
  toast: (props: Omit<ToastProps, 'id' | 'onDismiss'>) => void;
  dismiss: (id?: string) => void;
}

// 创建Toast上下文
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// Toast提供者属性接口
interface ToastProviderProps {
  children: React.ReactNode;
}

/**
 * @description Toast 全局提供者组件
 */
export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // 生成唯一ID
  const generateId = (): string => {
    return Math.random().toString(36).substr(2, 9);
  };

  // 添加通知
  const toast = useCallback((props: Omit<ToastProps, 'id' | 'onDismiss'>) => {
    const id = generateId();
    
    setToasts((prevToasts) => [
      { id, ...props, onDismiss: dismiss },
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

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full">
        {toasts.map((toast) => (
          <Toast key={toast.id} {...toast} />
        ))}
      </div>
    </ToastContext.Provider>
  );
};

/**
 * @description 使用Toast的钩子
 */
export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

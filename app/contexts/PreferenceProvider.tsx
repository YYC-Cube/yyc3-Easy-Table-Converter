/**
 * @file 用户偏好设置上下文
 * @description 提供全局的用户偏好设置管理功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { useToast } from '../hooks/use-toast';

// 用户偏好设置类型
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: boolean;
  language: string;
  fontSize: number;
  autoSave: boolean;
  defaultProcessor: 'batch' | 'single';
  recentFormats: string[];
  layoutPreference: 'compact' | 'standard';
}

// 默认用户偏好设置
const defaultPreferences: UserPreferences = {
  theme: 'system',
  notifications: true,
  language: 'zh-CN',
  fontSize: 16,
  autoSave: true,
  defaultProcessor: 'batch',
  recentFormats: [],
  layoutPreference: 'standard'
};

// 上下文类型
interface PreferenceContextType {
  preferences: UserPreferences;
  updatePreference: <K extends keyof UserPreferences> (key: K, value: UserPreferences[K]) => void;
  savePreferences: () => Promise<void>;
  resetPreferences: () => Promise<void>;
  addRecentFormat: (format: string) => void;
  isLoading: boolean;
}

// 创建上下文
const PreferenceContext = createContext<PreferenceContextType | undefined>(undefined);

// 提供者Props类型
interface PreferenceProviderProps {
  children: ReactNode;
}

/**
 * @description 用户偏好设置提供者组件
 * @param props 组件属性
 * @returns React组件
 */
export const PreferenceProvider: React.FC<PreferenceProviderProps> = ({ children }) => {
  const [preferences, setPreferences] = useState<UserPreferences>(defaultPreferences);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { toast } = useToast();

  // 从localStorage加载偏好设置
  useEffect(() => {
    const loadPreferences = async () => {
      try {
        setIsLoading(true);
        const saved = localStorage.getItem('userPreferences');
        if (saved) {
          const parsed = JSON.parse(saved);
          setPreferences({
            ...defaultPreferences,
            ...parsed
          });
        }
      } catch (error) {
        console.error('加载用户偏好设置失败:', error);
        toast({
          title: '加载失败',
          description: '无法加载用户偏好设置，使用默认值',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadPreferences();
  }, [toast]);

  // 更新单个偏好设置
  const updatePreference = <K extends keyof UserPreferences> (key: K, value: UserPreferences[K]) => {
    setPreferences(prev => ({
      ...prev,
      [key]: value
    }));
    
    // 如果启用了自动保存，立即保存到localStorage
    if (preferences.autoSave) {
      savePreferences();
    }
  };

  // 保存偏好设置到localStorage
  const savePreferences = async () => {
    try {
      localStorage.setItem('userPreferences', JSON.stringify(preferences));
      
      // 应用字体大小设置
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = `${preferences.fontSize}px`;
      }
      
      // 通知保存成功
      toast({
        title: '设置已保存',
        description: '用户偏好设置已成功保存',
        variant: 'success',
      });
    } catch (error) {
      console.error('保存用户偏好设置失败:', error);
      toast({
        title: '保存失败',
        description: '无法保存用户偏好设置',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 重置为默认设置
  const resetPreferences = async () => {
    try {
      setPreferences(defaultPreferences);
      localStorage.setItem('userPreferences', JSON.stringify(defaultPreferences));
      
      // 应用默认字体大小
      if (typeof document !== 'undefined') {
        document.documentElement.style.fontSize = `${defaultPreferences.fontSize}px`;
      }
      
      // 通知重置成功
      toast({
        title: '已重置',
        description: '用户偏好设置已重置为默认值',
        variant: 'info',
      });
    } catch (error) {
      console.error('重置用户偏好设置失败:', error);
      toast({
        title: '重置失败',
        description: '无法重置用户偏好设置',
        variant: 'destructive',
      });
      throw error;
    }
  };

  // 添加最近使用的格式（限制最多10个）
  const addRecentFormat = (format: string) => {
    setPreferences(prev => {
      const recentFormats = [...prev.recentFormats];
      // 如果已存在，先移除
      const index = recentFormats.indexOf(format);
      if (index >= 0) {
        recentFormats.splice(index, 1);
      }
      // 添加到开头
      recentFormats.unshift(format);
      // 限制数量为10
      if (recentFormats.length > 10) {
        recentFormats.pop();
      }
      return {
        ...prev,
        recentFormats
      };
    });
  };

  const value = {
    preferences,
    updatePreference,
    savePreferences,
    resetPreferences,
    addRecentFormat,
    isLoading
  };

  return (
    <PreferenceContext.Provider value={value}>
      {children}
    </PreferenceContext.Provider>
  );
};

/**
 * @description 使用用户偏好设置的钩子
 * @returns 用户偏好设置上下文
 */
export const usePreferences = (): PreferenceContextType => {
  const context = useContext(PreferenceContext);
  if (context === undefined) {
    throw new Error('usePreferences必须在PreferenceProvider内部使用');
  }
  return context;
};

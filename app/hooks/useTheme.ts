/**
 * @file 主题管理钩子
 * @description 提供主题切换和状态管理功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { useState, useEffect } from 'react';

// 主题类型定义
type Theme = 'light' | 'dark' | 'system';

/**
 * @description 主题管理钩子
 * @returns 主题状态和设置方法
 */
export const useTheme = (): { theme: Theme; setTheme: (theme: Theme) => void; isDarkMode: boolean } => {
  // 从localStorage加载保存的主题设置
  const savedTheme = typeof window !== 'undefined' 
    ? localStorage.getItem('theme') as Theme | null 
    : null;
  
  const [theme, setTheme] = useState<Theme>(savedTheme || 'system');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // 检测系统主题
  const checkSystemTheme = (): boolean => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  };

  // 应用主题设置
  const applyTheme = (themeValue: Theme) => {
    const isDark = themeValue === 'dark' || 
                 (themeValue === 'system' && checkSystemTheme());
    
    setIsDarkMode(isDark);
    
    // 应用到文档
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.setAttribute('data-theme', themeValue);
    }
  };

  // 监听系统主题变化
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (theme === 'system') {
        applyTheme('system');
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  // 初始化和主题变更时应用主题
  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  // 设置主题的方法
  const setThemeHandler = (newTheme: Theme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme);
    }
  };

  return { theme, setTheme: setThemeHandler, isDarkMode };
};

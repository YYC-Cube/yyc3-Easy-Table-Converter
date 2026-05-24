/**
 * @file 主题切换组件
 * @description 提供直观的深色/浅色主题切换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { useState, useEffect } from 'react';
import { useTheme } from '../../hooks/useTheme';
import { MoonIcon, SunIcon } from './icons';

interface ThemeToggleProps {
  className?: string;
}

/**
 * @description 主题切换组件
 * @param props 组件属性
 * @returns React组件
 */
export const ThemeToggle: React.FC<ThemeToggleProps> = ({ className }) => {
  const { setTheme, isDarkMode } = useTheme();
  const [isLocalDark, setIsLocalDark] = useState(isDarkMode);

  // 同步主题变化
  useEffect(() => {
    setIsLocalDark(isDarkMode);
  }, [isDarkMode]);

  // 切换主题
  const toggleTheme = () => {
    const newTheme = isLocalDark ? 'light' : 'dark';
    setTheme(newTheme);
    setIsLocalDark(!isLocalDark);
  };

  return (
    
      <button
        type="button"
        onClick={toggleTheme}
        className={`inline-flex items-center justify-center p-2 rounded-full bg-background text-foreground hover:bg-accent hover:text-accent-foreground transition-all duration-200 relative ${className}`}
        aria-label={isLocalDark ? '切换到浅色模式' : '切换到深色模式'}
      >
        <SunIcon className={`h-5 w-5 rotate-0 scale-100 transition-all duration-300 absolute ${isLocalDark ? 'opacity-0 -rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'}`} />
        <MoonIcon className={`h-5 w-5 rotate-90 scale-0 transition-all duration-300 absolute ${isLocalDark ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 rotate-90 scale-0'}`} />
      </button>
    
  );
};

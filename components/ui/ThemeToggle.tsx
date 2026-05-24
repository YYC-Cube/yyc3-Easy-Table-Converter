/**
 * @file ThemeToggle - 主题切换组件
 * @description 提供用户切换主题的界面组件
 * @module components/ui/ThemeToggle
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-12
 * @updated 2024-11-12
 */
"use client";

import React from 'react';
import { Moon, Sun, Monitor } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './tooltip';
import { useTheme } from '../../hooks/useTheme';
import { Button } from './button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './dropdown-menu';

/**
 * @description 主题切换按钮组件
 */
export const ThemeToggle: React.FC = () => {
  const { theme, setTheme, isDarkMode } = useTheme();

  // 根据当前主题显示对应的图标
  const getThemeIcon = () => {
    if (theme === 'system') {
      return <Monitor className="h-5 w-5" />;
    }
    return isDarkMode 
      ? <Moon className="h-5 w-5" /> 
      : <Sun className="h-5 w-5" />;
  };

  // 获取当前主题的显示文本
  const getThemeLabel = () => {
    if (theme === 'system') {
      return '系统主题';
    }
    return isDarkMode ? '深色模式' : '浅色模式';
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full">
                {getThemeIcon()}
                <span className="sr-only">{getThemeLabel()}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{getThemeLabel()}</p>
            </TooltipContent>
          </Tooltip>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          <DropdownMenuItem
            onClick={() => setTheme('light')}
            className="flex items-center cursor-pointer"
          >
            <Sun className="mr-2 h-4 w-4" />
            <span>浅色模式</span>
            {theme === 'light' && 
              <span className="ml-auto text-primary font-semibold">当前</span>
            }
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme('dark')}
            className="flex items-center cursor-pointer"
          >
            <Moon className="mr-2 h-4 w-4" />
            <span>深色模式</span>
            {theme === 'dark' && 
              <span className="ml-auto text-primary font-semibold">当前</span>
            }
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => setTheme('system')}
            className="flex items-center cursor-pointer"
          >
            <Monitor className="mr-2 h-4 w-4" />
            <span>跟随系统</span>
            {theme === 'system' && 
              <span className="ml-auto text-primary font-semibold">当前</span>
            }
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

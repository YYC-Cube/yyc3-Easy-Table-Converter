/**
 * @file SettingsButton - 设置按钮组件
 * @description 提供快速访问设置页面的导航按钮
 * @module components/ui/SettingsButton
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-12
 * @updated 2024-11-12
 */
"use client";

import React from 'react';
import { Settings } from 'lucide-react';
import { Button } from './button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./tooltip";
import { useRouter } from 'next/navigation';

/**
 * @description 设置按钮组件
 */
export const SettingsButton: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/settings');
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClick}
            className="rounded-full transition-all duration-200 hover:bg-accent hover:text-accent-foreground"
          >
            <Settings className="h-5 w-5" />
            <span className="sr-only">设置</span>
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>设置中心</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

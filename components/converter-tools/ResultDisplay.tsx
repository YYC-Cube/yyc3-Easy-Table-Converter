/**
 * @file 结果显示组件
 * @description 为单位换算工具提供统一的结果展示界面，支持复制和格式化
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Copy, CheckCircle2, Download, Maximize2, Minimize2 } from 'lucide-react';

interface ResultDisplayProps {
  result: string;
  resultUnit?: string;
  label?: string;
  allowCopy?: boolean;
  allowDownload?: boolean;
  allowFullscreen?: boolean;
  isFullscreen?: boolean;
  onFullscreenChange?: (isFullscreen: boolean) => void;
  className?: string;
}

/**
 * 结果显示组件
 * 提供复制、下载和全屏显示功能
 */
export const ResultDisplay: React.FC<ResultDisplayProps> = ({
  result,
  resultUnit,
  label = '转换结果',
  allowCopy = true,
  allowDownload = true,
  allowFullscreen = false,
  isFullscreen = false,
  onFullscreenChange,
  className = '',
}) => {
  const [copied, setCopied] = useState(false);

  // 处理复制操作
  const handleCopy = async () => {
    try {
      // 复制结果（包含单位）
      const textToCopy = resultUnit && result ? `${result} ${resultUnit}` : result;
      await navigator.clipboard.writeText(textToCopy);
      
      // 显示复制成功状态
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('复制失败:', err);
      // 降级方案：使用传统的复制方法
      fallbackCopyText(resultUnit && result ? `${result} ${resultUnit}` : result);
    }
  };

  // 降级复制方案
  const fallbackCopyText = (text: string) => {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    textArea.style.top = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    try {
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('降级复制方法也失败:', err);
    }
    
    document.body.removeChild(textArea);
  };

  // 处理下载操作
  const handleDownload = () => {
    if (!result) return;
    
    // 创建数据内容
    const data = resultUnit ? `${label}: ${result} ${resultUnit}` : `${label}: ${result}`;
    
    // 创建Blob和下载链接
    const blob = new Blob([data], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${label.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().slice(0, 10)}.txt`;
    
    // 触发下载
    document.body.appendChild(link);
    link.click();
    
    // 清理
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 处理全屏切换
  const handleFullscreenToggle = () => {
    if (onFullscreenChange) {
      onFullscreenChange(!isFullscreen);
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}
      data-fullscreen={isFullscreen ? 'true' : 'false'}
      style={isFullscreen ? {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 1000,
        backgroundColor: 'white',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
      } : {}}
    >
      {isFullscreen && (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleFullscreenToggle}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <Minimize2 className="h-5 w-5" />
        </Button>
      )}
      
      <div className="flex items-center justify-between">
        <Label htmlFor="result" className="text-base font-medium text-gray-700">{label}</Label>
        <div className="flex gap-2">
          {allowDownload && (
            <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      disabled={!result}
                      className="h-8 w-8 text-gray-500 hover:text-gray-700"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>下载结果</TooltipContent>
                </Tooltip>
              </TooltipProvider>
          )}
          {allowCopy && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleCopy}
                    disabled={!result}
                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  >
                    {copied ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{copied ? '已复制' : '复制结果'}</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          {allowFullscreen && !isFullscreen && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleFullscreenToggle}
                    className="h-8 w-8 text-gray-500 hover:text-gray-700"
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>全屏查看</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
      </div>
      
      <div className="relative">
        <Input
          id="result"
          type="text"
          value={result}
          readOnly
          className={`
            bg-gray-50 border-gray-200 font-mono text-base 
            ${isFullscreen ? 'text-3xl md:text-5xl w-full max-w-3xl text-center' : 'w-full'}
          `}
        />
        {resultUnit && result && (
          <span className="
            absolute right-3 top-1/2 transform -translate-y-1/2 
            text-gray-500 font-mono
            ${isFullscreen ? 'text-3xl md:text-5xl' : 'text-base'}
          ">
            {resultUnit}
          </span>
        )}
      </div>
    </div>
  );
};

export default ResultDisplay;
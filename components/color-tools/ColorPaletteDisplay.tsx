import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import ColorCard, { ColorData } from './ColorCard';
import { Download } from 'lucide-react';

interface ColorPaletteDisplayProps {
  title: string;
  description?: string;
  colors: ColorData[];
  showNameControls?: boolean;
  showRatioControls?: boolean;
  showExportControls?: boolean;
  size?: 'small' | 'medium' | 'large';
  onColorClick?: (color: ColorData) => void;
  onExport?: (colors: ColorData[]) => void;
}

/**
 * @file 调色板展示组件
 * @description 用于展示一组颜色卡片，并提供相关控制选项
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */
export const ColorPaletteDisplay: React.FC<ColorPaletteDisplayProps> = ({
  title,
  description,
  colors,
  showNameControls = true,
  showRatioControls = true,
  showExportControls = true,
  size = 'medium',
  onColorClick,
  onExport,
}) => {
  const [showNames, setShowNames] = React.useState(true);
  const [showRatios, setShowRatios] = React.useState(false);

  const handleExport = () => {
    if (onExport) {
      onExport(colors);
    } else {
      // 默认导出功能：生成CSS变量
      const cssVariables = colors.map((color, index) => 
        `--color-${index + 1}: ${color.hex};`
      ).join('\n');
      
      const blob = new Blob([cssVariables], { type: 'text/css' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `palette-${Date.now()}.css`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <Card className="w-full transition-all duration-300">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              {title}
            </CardTitle>
            {description && (
              <CardDescription className="text-sm text-gray-500 dark:text-gray-400">
                {description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-2">
            {showExportControls && (
              <button
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-md bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors"
                onClick={handleExport}
              >
                <Download className="h-3.5 w-3.5" />
                导出
              </button>
            )}
          </div>
        </div>
      </CardHeader>
      
      {showNameControls || showRatioControls ? (
        <div className="px-6 py-2 border-t border-b bg-gray-50 dark:bg-gray-800">
          <div className="flex flex-wrap gap-4 items-center text-sm">
            {showNameControls && (
              <div className="items-center gap-2 flex">
                <Switch 
                  id="show-names" 
                  checked={showNames}
                  onCheckedChange={setShowNames}
                />
                <Label htmlFor="show-names" className="text-xs cursor-pointer">
                  显示颜色名称
                </Label>
              </div>
            )}
            {showRatioControls && (
              <div className="items-center gap-2 flex">
                <Switch 
                  id="show-ratios" 
                  checked={showRatios}
                  onCheckedChange={setShowRatios}
                />
                <Label htmlFor="show-ratios" className="text-xs cursor-pointer">
                  显示颜色比例
                </Label>
              </div>
            )}
          </div>
        </div>
      ) : null}
      
      <CardContent className="p-0">
        <ScrollArea className="h-auto max-h-[400px] p-6">
          {colors.length === 0 ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              暂无颜色数据
            </div>
          ) : (
            <div className={`grid gap-4 ${size === 'small' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : size === 'medium' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5' : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
              {colors.map((color, index) => (
                <ColorCard
                  key={index}
                  color={color}
                  showName={showNames}
                  showRatio={showRatios}
                  size={size}
                  {...(onColorClick && { onColorClick })}
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ColorPaletteDisplay;
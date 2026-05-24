import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

// 颜色数据接口
export interface ColorData {
  hex: string;
  name?: string;
  ratio?: number;
  r?: number;
  g?: number;
  b?: number;
}

// 调色板类型
export type PaletteType = 'monochromatic' | 'analogous' | 'complementary' | 'triadic' | 'tetradic' | 'split-complementary';

interface ColorContextType {
  // 颜色状态
  currentColor: string;
  palette: ColorData[];
  
  // 设置方法
  setCurrentColor: (color: string) => void;
  setPalette: (colors: ColorData[]) => void;
  
  // 颜色转换方法
  rgbToHex: (r: number, g: number, b: number) => string;
  hexToRgb: (hex: string) => { r: number; g: number; b: number } | null;
  rgbToHsl: (r: number, g: number, b: number) => { h: number; s: number; l: number };
  hslToRgb: (h: number, s: number, l: number) => { r: number; g: number; b: number };
  
  // 调色板生成方法
  generatePalette: (baseColor: string, type: PaletteType, count: number) => ColorData[];
  
  // 颜色操作方法
  getColorName: (hex: string) => string;
  adjustBrightness: (hex: string, percent: number) => string;
  complementaryColor: (hex: string) => string;
  
  // 对比度计算
  calculateContrastRatio: (bgColor: string, textColor: string) => number;
  checkWCAGCompliance: (bgColor: string, textColor: string) => {
    aaNormal: boolean;
    aaLarge: boolean;
    aaaNormal: boolean;
    aaaLarge: boolean;
  };
}

// 创建上下文
const ColorContext = createContext<ColorContextType | undefined>(undefined);

interface ColorProviderProps {
  children: ReactNode;
}

/**
 * @file 颜色工具上下文
 * @description 提供颜色相关的工具方法和状态管理，供所有颜色工具组件共享
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */
export const ColorProvider: React.FC<ColorProviderProps> = ({ children }) => {
  const [currentColor, setCurrentColor] = useState('#3b82f6');
  const [palette, setPalette] = useState<ColorData[]>([]);

  // RGB到HEX转换
  const rgbToHex = useCallback((r: number, g: number, b: number): string => {
    const toHex = (n: number): string => {
      const hex = Math.round(n).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return '#' + toHex(r) + toHex(g) + toHex(b);
  }, []);

  // HEX到RGB转换
  const hexToRgb = useCallback((hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }, []);

  // RGB到HSL转换
  const rgbToHsl = useCallback((r: number, g: number, b: number) => {
    r = r / 255;
    g = g / 255;
    b = b / 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    let h = 0;
    let s = 0;
    const l = (max + min) / 2;

    if (max !== min) {
      const d = max - min;
      s = l < 0.5 ? d / (max + min) : d / (2 - max - min);
      
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }

    return { h: h * 360, s: s * 100, l: l * 100 };
  }, []);

  // HSL到RGB转换
  const hslToRgb = useCallback((h: number, s: number, l: number) => {
    h = h / 360;
    s = s / 100;
    l = l / 100;

    const hue2rgb = (p: number, q: number, t: number): number => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1/6) return p + (q - p) * 6 * t;
      if (t < 1/2) return q;
      if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
      return p;
    };

    let r = 0;
    let g = 0;
    let b = 0;

    if (s === 0) {
      r = g = b = l; // 灰度
    } else {
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
      const p = 2 * l - q;
      r = hue2rgb(p, q, h + 1/3);
      g = hue2rgb(p, q, h);
      b = hue2rgb(p, q, h - 1/3);
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
  }, []);

  // 生成调色板
  const generatePalette = useCallback((baseColor: string, type: PaletteType, count: number = 5): ColorData[] => {
    const rgb = hexToRgb(baseColor);
    if (!rgb) return [];

    const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
    const colors: ColorData[] = [];

    switch (type) {
      case 'monochromatic':
        // 单色方案：相同色相，不同亮度
        for (let i = 0; i < count; i++) {
          const lightness = 20 + (i * 60) / (count - 1);
          const rgbColor = hslToRgb(hsl.h, hsl.s, lightness);
          const hex = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
          colors.push({
            hex,
            name: getColorName(hex),
            ...rgbColor
          });
        }
        break;
        
      case 'analogous':
        // 类似色方案：色相环上相邻的颜色
        for (let i = 0; i < count; i++) {
          const hue = (hsl.h - 30 + (i * 60) / (count - 1) + 360) % 360;
          const rgbColor = hslToRgb(hue, hsl.s, hsl.l);
          const hex = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
          colors.push({
            hex,
            name: getColorName(hex),
            ...rgbColor
          });
        }
        break;
        
      case 'complementary':
        // 互补色方案：色相环上相对的颜色
        for (let i = 0; i < count; i++) {
          let hue = hsl.h;
          if (i % 2 === 1) {
            hue = (hue + 180) % 360; // 互补色
          }
          const rgbColor = hslToRgb(hue, hsl.s, hsl.l);
          const hex = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
          colors.push({
            hex,
            name: getColorName(hex),
            ...rgbColor
          });
        }
        break;
        
      case 'triadic':
        // 三角色方案：色相环上间隔120度的颜色
        for (let i = 0; i < count; i++) {
          const hue = (hsl.h + (i * 120)) % 360;
          const rgbColor = hslToRgb(hue, hsl.s, hsl.l);
          const hex = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
          colors.push({
            hex,
            name: getColorName(hex),
            ...rgbColor
          });
        }
        break;
        
      case 'tetradic':
        // 四角色方案：色相环上间隔90度的颜色
        for (let i = 0; i < count; i++) {
          const hue = (hsl.h + (i * 90)) % 360;
          const rgbColor = hslToRgb(hue, hsl.s, hsl.l);
          const hex = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
          colors.push({
            hex,
            name: getColorName(hex),
            ...rgbColor
          });
        }
        break;
        
      case 'split-complementary':
        // 分裂互补色方案：主色和互补色两侧的颜色
        const mainColor = hslToRgb(hsl.h, hsl.s, hsl.l);
        const mainHex = rgbToHex(mainColor.r, mainColor.g, mainColor.b);
        colors.push({
          hex: mainHex,
          name: getColorName(mainHex),
          ...mainColor
        });
        
        for (let i = 1; i < count; i++) {
          const hue = (hsl.h + 150 + (i-1) * 30) % 360;
          const rgbColor = hslToRgb(hue, hsl.s, hsl.l);
          const hex = rgbToHex(rgbColor.r, rgbColor.g, rgbColor.b);
          colors.push({
            hex,
            name: getColorName(hex),
            ...rgbColor
          });
        }
        break;
    }

    return colors;
  }, [hexToRgb, rgbToHsl, hslToRgb, rgbToHex]);

  // 获取颜色名称
  const getColorName = useCallback((hex: string): string => {
    const colorNames: { [key: string]: string } = {
      '#000000': '黑色', '#ffffff': '白色',
      '#ff0000': '红色', '#00ff00': '绿色', '#0000ff': '蓝色',
      '#ffff00': '黄色', '#ff00ff': '洋红色', '#00ffff': '青色',
      '#ff9900': '橙色', '#663399': '紫色', '#3366cc': '蓝色',
      '#33cc99': '青色', '#ff6666': '粉色', '#996633': '棕色',
      '#cccccc': '灰色', '#333333': '深灰色', '#666666': '中灰色'
    };

    // 查找精确匹配
    if (colorNames[hex]) return colorNames[hex];

    // 简化的颜色分类
    const rgb = hexToRgb(hex);
    if (!rgb) return '未知';

    const { r, g, b } = rgb;
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    if (brightness < 20) return '黑色';
    if (brightness > 230) return '白色';

    if (r > g && r > b) return '红色系';
    if (g > r && g > b) return '绿色系';
    if (b > r && b > g) return '蓝色系';
    if (r === g && g === b) return '灰色';

    return '混合色';
  }, [hexToRgb]);

  // 调整亮度
  const adjustBrightness = useCallback((hex: string, percent: number): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const factor = 1 + (percent / 100);
    const r = Math.max(0, Math.min(255, rgb.r * factor));
    const g = Math.max(0, Math.min(255, rgb.g * factor));
    const b = Math.max(0, Math.min(255, rgb.b * factor));

    return rgbToHex(r, g, b);
  }, [hexToRgb, rgbToHex]);

  // 获取互补色
  const complementaryColor = useCallback((hex: string): string => {
    const rgb = hexToRgb(hex);
    if (!rgb) return hex;

    const r = 255 - rgb.r;
    const g = 255 - rgb.g;
    const b = 255 - rgb.b;

    return rgbToHex(r, g, b);
  }, [hexToRgb, rgbToHex]);

  // 计算对比度比率
  const calculateContrastRatio = useCallback((bgColor: string, textColor: string): number => {
    const getLuminance = (hex: string): number => {
      const rgb = hexToRgb(hex);
      if (!rgb) return 0;
      
      // 转换为线性RGB值
      const [r, g, b] = [rgb.r, rgb.g, rgb.b].map(component => {
        const value = component / 255;
        return value <= 0.03928
          ? value / 12.92
          : Math.pow((value + 0.055) / 1.055, 2.4);
      });
      
      // 计算亮度
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    const bgLum = getLuminance(bgColor);
    const txtLum = getLuminance(textColor);
    
    const lighterLum = Math.max(bgLum, txtLum);
    const darkerLum = Math.min(bgLum, txtLum);
    
    return (lighterLum + 0.05) / (darkerLum + 0.05);
  }, [hexToRgb]);

  // 检查WCAG合规性
  const checkWCAGCompliance = useCallback((bgColor: string, textColor: string) => {
    const ratio = calculateContrastRatio(bgColor, textColor);
    
    return {
      aaNormal: ratio >= 4.5, // AA标准 - 普通文本
      aaLarge: ratio >= 3,    // AA标准 - 大文本
      aaaNormal: ratio >= 7,  // AAA标准 - 普通文本
      aaaLarge: ratio >= 4.5, // AAA标准 - 大文本
    };
  }, [calculateContrastRatio]);

  const value: ColorContextType = {
    currentColor,
    palette,
    setCurrentColor,
    setPalette,
    rgbToHex,
    hexToRgb,
    rgbToHsl,
    hslToRgb,
    generatePalette,
    getColorName,
    adjustBrightness,
    complementaryColor,
    calculateContrastRatio,
    checkWCAGCompliance,
  };

  return (
    <ColorContext.Provider value={value}>
      {children}
    </ColorContext.Provider>
  );
};

// 自定义Hook用于使用颜色上下文
export const useColor = () => {
  const context = useContext(ColorContext);
  if (context === undefined) {
    throw new Error('useColor must be used within a ColorProvider');
  }
  return context;
};

export default ColorContext;
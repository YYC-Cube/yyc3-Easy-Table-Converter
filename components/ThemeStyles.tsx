/**
 * @file 主题样式组件
 * @description 提供统一的颜色方案、排版样式和视觉层次结构
 * @module ThemeStyles
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useMediaQuery } from './ResponsiveUtils';

// 颜色系统类型定义
export interface ColorSystem {
  // 主色调 - 品牌识别色
  primary: {
    50: string;   // 最浅
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // 主色
    600: string;
    700: string;
    800: string;
    900: string;  // 最深
    950: string;  // 超深
  };
  
  // 辅助色 - 功能区分色
  secondary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // 强调色 - 重点突出色
  accent: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
    950: string;
  };
  
  // 中性色 - 文本和背景色
  neutral: {
    50: string;   // 接近白色
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;  // 中性灰
    600: string;
    700: string;
    800: string;
    900: string;  // 接近黑色
    950: string;  // 超黑
  };
  
  // 状态色 - 功能性颜色
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // 语义色
  background: string;
  foreground: string;
  surface: string;
  surfaceForeground: string;
  border: string;
  input: string;
  ring: string;
  
  // 特殊状态色
  hover: string;
  active: string;
  focus: string;
  disabled: string;
  
  // 透明度变体
  primaryOpacity: {
    10: string;
    20: string;
    30: string;
    40: string;
    50: string;
    60: string;
    70: string;
    80: string;
    90: string;
  };
  
  secondaryOpacity: {
    10: string;
    20: string;
    30: string;
    40: string;
    50: string;
    60: string;
    70: string;
    80: string;
    90: string;
  };
}

// 排版系统类型定义
export interface TypographySystem {
  fontFamily: {
    sans: string;
    mono: string;
    heading?: string;
  };
  
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
    '6xl': string;
    '7xl': string;
  };
  
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold?: number;
  };
  
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
    loose: number;
  };
  
  letterSpacing: {
    tighter: string;
    tight: string;
    normal: string;
    wide: string;
    wider: string;
    widest: string;
  };
}

// 视觉层次类型定义
export interface VisualHierarchy {
  borderRadius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    full: string;
  };
  
  boxShadow: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    inner: string;
    outline: string;
    none: string;
  };
  
  borderWidth: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
  };
  
  zIndex: {
    base: number;
    elevated: number;
    sticky: number;
    fixed: number;
    modal: number;
    tooltip: number;
  };
}

// 主题类型定义
export interface Theme {
  name: 'light' | 'dark' | 'system';
  colors: ColorSystem;
  typography: TypographySystem;
  hierarchy: VisualHierarchy;
  isDarkMode: boolean;
}

// 浅色主题定义
const lightColors: ColorSystem = {
  primary: {
    50: '#e6f7ff',
    100: '#bae7ff',
    200: '#91d5ff',
    300: '#69c0ff',
    400: '#40a9ff',
    500: '#1890ff', // 主蓝色
    600: '#096dd9',
    700: '#0050b3',
    800: '#003a8c',
    900: '#002766',
    950: '#001842',
  },
  secondary: {
    50: '#f6ffed',
    100: '#d9f7be',
    200: '#b7eb8f',
    300: '#95de64',
    400: '#73d13d',
    500: '#52c41a', // 辅助绿色
    600: '#389e0d',
    700: '#237804',
    800: '#135200',
    900: '#092b00',
    950: '#031500',
  },
  accent: {
    50: '#fff7e6',
    100: '#ffe7ba',
    200: '#ffd591',
    300: '#ffc069',
    400: '#ffa940',
    500: '#fa8c16', // 强调橙色
    600: '#d46b08',
    700: '#ad4e00',
    800: '#873800',
    900: '#612500',
    950: '#3d1400',
  },
  neutral: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#e5e5e5',
    300: '#d4d4d8',
    400: '#a3a3a3',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  success: '#52c41a',
  warning: '#faad14',
  error: '#ff4d4f',
  info: '#1890ff',
  background: '#ffffff',
  foreground: '#171717',
  surface: '#fafafa',
  surfaceForeground: '#262626',
  border: '#e5e5e5',
  input: '#f5f5f5',
  ring: '#1890ff',
  hover: '#f5f5f5',
  active: '#d4d4d8',
  focus: '#1890ff',
  disabled: '#d4d4d8',
  primaryOpacity: {
    10: 'rgba(24, 144, 255, 0.1)',
    20: 'rgba(24, 144, 255, 0.2)',
    30: 'rgba(24, 144, 255, 0.3)',
    40: 'rgba(24, 144, 255, 0.4)',
    50: 'rgba(24, 144, 255, 0.5)',
    60: 'rgba(24, 144, 255, 0.6)',
    70: 'rgba(24, 144, 255, 0.7)',
    80: 'rgba(24, 144, 255, 0.8)',
    90: 'rgba(24, 144, 255, 0.9)',
  },
  secondaryOpacity: {
    10: 'rgba(82, 196, 26, 0.1)',
    20: 'rgba(82, 196, 26, 0.2)',
    30: 'rgba(82, 196, 26, 0.3)',
    40: 'rgba(82, 196, 26, 0.4)',
    50: 'rgba(82, 196, 26, 0.5)',
    60: 'rgba(82, 196, 26, 0.6)',
    70: 'rgba(82, 196, 26, 0.7)',
    80: 'rgba(82, 196, 26, 0.8)',
    90: 'rgba(82, 196, 26, 0.9)',
  },
};

// 深色主题定义
const darkColors: ColorSystem = {
  primary: {
    50: '#0a2463',
    100: '#103783',
    200: '#1549a3',
    300: '#1a5cb3',
    400: '#206ec3',
    500: '#2581e3', // 深色主题主蓝色
    600: '#4096ff',
    700: '#6aa8ff',
    800: '#95c0ff',
    900: '#bfd7ff',
    950: '#e6f0ff',
  },
  secondary: {
    50: '#1a2e06',
    100: '#2a440a',
    200: '#3a5a0e',
    300: '#4a7012',
    400: '#5a8616',
    500: '#6aa21a', // 深色主题辅助绿色
    600: '#80c037',
    700: '#96de54',
    800: '#acfc71',
    900: '#c2ff8e',
    950: '#d8ffab',
  },
  accent: {
    50: '#3e2100',
    100: '#583200',
    200: '#724300',
    300: '#8c5400',
    400: '#a66500',
    500: '#c07600', // 深色主题强调橙色
    600: '#da8700',
    700: '#f49800',
    800: '#ffaa17',
    900: '#ffbb40',
    950: '#ffcc69',
  },
  neutral: {
    50: '#0a0a0a',
    100: '#171717',
    200: '#262626',
    300: '#404040',
    400: '#525252',
    500: '#737373',
    600: '#a3a3a3',
    700: '#d4d4d8',
    800: '#e5e5e5',
    900: '#f5f5f5',
    950: '#fafafa',
  },
  success: '#6aa21a',
  warning: '#f49800',
  error: '#ff4d4f',
  info: '#4096ff',
  background: '#0a0a0a',
  foreground: '#f5f5f5',
  surface: '#171717',
  surfaceForeground: '#e5e5e5',
  border: '#262626',
  input: '#262626',
  ring: '#4096ff',
  hover: '#262626',
  active: '#404040',
  focus: '#4096ff',
  disabled: '#404040',
  primaryOpacity: {
    10: 'rgba(37, 129, 227, 0.1)',
    20: 'rgba(37, 129, 227, 0.2)',
    30: 'rgba(37, 129, 227, 0.3)',
    40: 'rgba(37, 129, 227, 0.4)',
    50: 'rgba(37, 129, 227, 0.5)',
    60: 'rgba(37, 129, 227, 0.6)',
    70: 'rgba(37, 129, 227, 0.7)',
    80: 'rgba(37, 129, 227, 0.8)',
    90: 'rgba(37, 129, 227, 0.9)',
  },
  secondaryOpacity: {
    10: 'rgba(106, 162, 26, 0.1)',
    20: 'rgba(106, 162, 26, 0.2)',
    30: 'rgba(106, 162, 26, 0.3)',
    40: 'rgba(106, 162, 26, 0.4)',
    50: 'rgba(106, 162, 26, 0.5)',
    60: 'rgba(106, 162, 26, 0.6)',
    70: 'rgba(106, 162, 26, 0.7)',
    80: 'rgba(106, 162, 26, 0.8)',
    90: 'rgba(106, 162, 26, 0.9)',
  },
};

// 排版系统定义
const typography: TypographySystem = {
  fontFamily: {
    sans: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"',
    mono: 'SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    heading: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  fontSize: {
    xs: '0.75rem',     // 12px
    sm: '0.875rem',    // 14px
    base: '1rem',      // 16px
    lg: '1.125rem',    // 18px
    xl: '1.25rem',     // 20px
    '2xl': '1.5rem',    // 24px
    '3xl': '1.875rem',  // 30px
    '4xl': '2.25rem',   // 36px
    '5xl': '3rem',      // 48px
    '6xl': '3.75rem',   // 60px
    '7xl': '4.5rem',    // 72px
  },
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
};

// 视觉层次定义
const hierarchy: VisualHierarchy = {
  borderRadius: {
    none: '0px',
    sm: '0.125rem',    // 2px
    md: '0.25rem',     // 4px
    lg: '0.375rem',    // 6px
    xl: '0.5rem',      // 8px
    '2xl': '0.75rem',   // 12px
    full: '9999px',
  },
  boxShadow: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    outline: '0 0 0 3px rgba(24, 144, 255, 0.5)',
    none: '0 0 0 0 rgba(0, 0, 0, 0)',
  },
  borderWidth: {
    none: '0px',
    sm: '0.5px',
    base: '1px',
    md: '2px',
    lg: '3px',
  },
  zIndex: {
    base: 0,
    elevated: 10,
    sticky: 100,
    fixed: 1000,
    modal: 5000,
    tooltip: 6000,
  },
};

// 创建主题函数
const createTheme = (mode: 'light' | 'dark' | 'system', isDarkMode: boolean): Theme => {
  const colors = isDarkMode ? darkColors : lightColors;
  
  return {
    name: mode,
    colors,
    typography,
    hierarchy,
    isDarkMode,
  };
};

// 主题上下文定义
interface ThemeContextType {
  theme: Theme;
  setThemeMode: (mode: 'light' | 'dark' | 'system') => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// 主题提供者组件
export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [themeMode, setThemeMode] = useState<'light' | 'dark' | 'system'>('system');
  const systemIsDark = useMediaQuery('(prefers-color-scheme: dark)');
  
  // 根据模式和系统设置确定是否为深色模式
  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemIsDark);
  
  // 创建当前主题
  const theme = createTheme(themeMode, isDarkMode);
  
  // 切换主题函数
  const toggleTheme = () => {
    setThemeMode(prev => {
      if (prev === 'light') return 'dark';
      if (prev === 'dark') return 'light';
      return systemIsDark ? 'light' : 'dark';
    });
  };
  
  // 提供主题上下文值
  const contextValue: ThemeContextType = {
    theme,
    setThemeMode,
    toggleTheme,
  };
  
  // 动态添加主题样式到document.head
  useEffect(() => {
    // 创建或更新主题样式
    let themeStyle = document.getElementById('theme-styles');
    if (!themeStyle) {
      themeStyle = document.createElement('style');
      themeStyle.id = 'theme-styles';
      document.head.appendChild(themeStyle);
    }
    
    // 生成CSS变量
    const cssVars = `
      :root {
        /* 颜色系统CSS变量 */
        --color-primary-50: ${theme.colors.primary[50]};
        --color-primary-100: ${theme.colors.primary[100]};
        --color-primary-200: ${theme.colors.primary[200]};
        --color-primary-300: ${theme.colors.primary[300]};
        --color-primary-400: ${theme.colors.primary[400]};
        --color-primary-500: ${theme.colors.primary[500]};
        --color-primary-600: ${theme.colors.primary[600]};
        --color-primary-700: ${theme.colors.primary[700]};
        --color-primary-800: ${theme.colors.primary[800]};
        --color-primary-900: ${theme.colors.primary[900]};
        --color-primary-950: ${theme.colors.primary[950]};
        
        --color-secondary-50: ${theme.colors.secondary[50]};
        --color-secondary-100: ${theme.colors.secondary[100]};
        --color-secondary-200: ${theme.colors.secondary[200]};
        --color-secondary-300: ${theme.colors.secondary[300]};
        --color-secondary-400: ${theme.colors.secondary[400]};
        --color-secondary-500: ${theme.colors.secondary[500]};
        --color-secondary-600: ${theme.colors.secondary[600]};
        --color-secondary-700: ${theme.colors.secondary[700]};
        --color-secondary-800: ${theme.colors.secondary[800]};
        --color-secondary-900: ${theme.colors.secondary[900]};
        --color-secondary-950: ${theme.colors.secondary[950]};
        
        --color-accent-50: ${theme.colors.accent[50]};
        --color-accent-100: ${theme.colors.accent[100]};
        --color-accent-200: ${theme.colors.accent[200]};
        --color-accent-300: ${theme.colors.accent[300]};
        --color-accent-400: ${theme.colors.accent[400]};
        --color-accent-500: ${theme.colors.accent[500]};
        --color-accent-600: ${theme.colors.accent[600]};
        --color-accent-700: ${theme.colors.accent[700]};
        --color-accent-800: ${theme.colors.accent[800]};
        --color-accent-900: ${theme.colors.accent[900]};
        --color-accent-950: ${theme.colors.accent[950]};
        
        --color-neutral-50: ${theme.colors.neutral[50]};
        --color-neutral-100: ${theme.colors.neutral[100]};
        --color-neutral-200: ${theme.colors.neutral[200]};
        --color-neutral-300: ${theme.colors.neutral[300]};
        --color-neutral-400: ${theme.colors.neutral[400]};
        --color-neutral-500: ${theme.colors.neutral[500]};
        --color-neutral-600: ${theme.colors.neutral[600]};
        --color-neutral-700: ${theme.colors.neutral[700]};
        --color-neutral-800: ${theme.colors.neutral[800]};
        --color-neutral-900: ${theme.colors.neutral[900]};
        --color-neutral-950: ${theme.colors.neutral[950]};
        
        --color-success: ${theme.colors.success};
        --color-warning: ${theme.colors.warning};
        --color-error: ${theme.colors.error};
        --color-info: ${theme.colors.info};
        
        --color-background: ${theme.colors.background};
        --color-foreground: ${theme.colors.foreground};
        --color-surface: ${theme.colors.surface};
        --color-surface-foreground: ${theme.colors.surfaceForeground};
        --color-border: ${theme.colors.border};
        --color-input: ${theme.colors.input};
        --color-ring: ${theme.colors.ring};
        
        --color-hover: ${theme.colors.hover};
        --color-active: ${theme.colors.active};
        --color-focus: ${theme.colors.focus};
        --color-disabled: ${theme.colors.disabled};
        
        /* 排版系统CSS变量 */
        --font-family-sans: ${theme.typography.fontFamily.sans};
        --font-family-mono: ${theme.typography.fontFamily.mono};
        --font-family-heading: ${theme.typography.fontFamily.heading || theme.typography.fontFamily.sans};
        
        --font-size-xs: ${theme.typography.fontSize.xs};
        --font-size-sm: ${theme.typography.fontSize.sm};
        --font-size-base: ${theme.typography.fontSize.base};
        --font-size-lg: ${theme.typography.fontSize.lg};
        --font-size-xl: ${theme.typography.fontSize.xl};
        --font-size-2xl: ${theme.typography.fontSize['2xl']};
        --font-size-3xl: ${theme.typography.fontSize['3xl']};
        --font-size-4xl: ${theme.typography.fontSize['4xl']};
        --font-size-5xl: ${theme.typography.fontSize['5xl']};
        --font-size-6xl: ${theme.typography.fontSize['6xl']};
        --font-size-7xl: ${theme.typography.fontSize['7xl']};
        
        --font-weight-normal: ${theme.typography.fontWeight.normal};
        --font-weight-medium: ${theme.typography.fontWeight.medium};
        --font-weight-semibold: ${theme.typography.fontWeight.semibold};
        --font-weight-bold: ${theme.typography.fontWeight.bold};
        --font-weight-extrabold: ${theme.typography.fontWeight.extrabold || theme.typography.fontWeight.bold};
        
        --line-height-tight: ${theme.typography.lineHeight.tight};
        --line-height-normal: ${theme.typography.lineHeight.normal};
        --line-height-relaxed: ${theme.typography.lineHeight.relaxed};
        --line-height-loose: ${theme.typography.lineHeight.loose};
        
        --letter-spacing-tighter: ${theme.typography.letterSpacing.tighter};
        --letter-spacing-tight: ${theme.typography.letterSpacing.tight};
        --letter-spacing-normal: ${theme.typography.letterSpacing.normal};
        --letter-spacing-wide: ${theme.typography.letterSpacing.wide};
        --letter-spacing-wider: ${theme.typography.letterSpacing.wider};
        --letter-spacing-widest: ${theme.typography.letterSpacing.widest};
        
        /* 视觉层次CSS变量 */
        --border-radius-none: ${theme.hierarchy.borderRadius.none};
        --border-radius-sm: ${theme.hierarchy.borderRadius.sm};
        --border-radius-md: ${theme.hierarchy.borderRadius.md};
        --border-radius-lg: ${theme.hierarchy.borderRadius.lg};
        --border-radius-xl: ${theme.hierarchy.borderRadius.xl};
        --border-radius-2xl: ${theme.hierarchy.borderRadius['2xl']};
        --border-radius-full: ${theme.hierarchy.borderRadius.full};
        
        --box-shadow-none: ${theme.hierarchy.boxShadow.none};
        --box-shadow-sm: ${theme.hierarchy.boxShadow.sm};
        --box-shadow-md: ${theme.hierarchy.boxShadow.md};
        --box-shadow-lg: ${theme.hierarchy.boxShadow.lg};
        --box-shadow-xl: ${theme.hierarchy.boxShadow.xl};
        --box-shadow-2xl: ${theme.hierarchy.boxShadow['2xl']};
        --box-shadow-inner: ${theme.hierarchy.boxShadow.inner};
        --box-shadow-outline: ${theme.hierarchy.boxShadow.outline};
        
        --border-width-none: ${theme.hierarchy.borderWidth.none};
        --border-width-sm: ${theme.hierarchy.borderWidth.sm};
        --border-width-base: ${theme.hierarchy.borderWidth.base};
        --border-width-md: ${theme.hierarchy.borderWidth.md};
        --border-width-lg: ${theme.hierarchy.borderWidth.lg};
        
        --z-index-base: ${theme.hierarchy.zIndex.base};
        --z-index-elevated: ${theme.hierarchy.zIndex.elevated};
        --z-index-sticky: ${theme.hierarchy.zIndex.sticky};
        --z-index-fixed: ${theme.hierarchy.zIndex.fixed};
        --z-index-modal: ${theme.hierarchy.zIndex.modal};
        --z-index-tooltip: ${theme.hierarchy.zIndex.tooltip};
        
        /* 主题状态 */
        --is-dark-mode: ${theme.isDarkMode ? '1' : '0'};
      }
    `;
    
    if (themeStyle) {
      themeStyle.textContent = cssVars;
    }
    
    // 清理函数
    return () => {
      if (themeStyle && document.head.contains(themeStyle)) {
        document.head.removeChild(themeStyle);
      }
    };
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// 主题钩子
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// 主题样式工具函数
export const ThemeUtils = {
  // 获取颜色值
  getColor: (color: keyof ColorSystem, shade?: keyof ColorSystem['primary']): string => {
    const element = document.documentElement;
    if (shade && ['primary', 'secondary', 'accent', 'neutral'].includes(color)) {
      return element.style.getPropertyValue(`--color-${color}-${shade}`).trim() || `var(--color-${color}-${shade})`;
    }
    return element.style.getPropertyValue(`--color-${color}`).trim() || `var(--color-${color})`;
  },
  
  // 获取字体大小
  getFontSize: (size: keyof TypographySystem['fontSize']): string => {
    const element = document.documentElement;
    return element.style.getPropertyValue(`--font-size-${size}`).trim() || `var(--font-size-${size})`;
  },
  
  // 获取字体粗细
  getFontWeight: (weight: keyof TypographySystem['fontWeight']): string => {
    const element = document.documentElement;
    return element.style.getPropertyValue(`--font-weight-${weight}`).trim() || `var(--font-weight-${weight})`;
  },
  
  // 获取边框圆角
  getBorderRadius: (radius: keyof VisualHierarchy['borderRadius']): string => {
    const element = document.documentElement;
    return element.style.getPropertyValue(`--border-radius-${radius}`).trim() || `var(--border-radius-${radius})`;
  },
  
  // 获取阴影
  getBoxShadow: (shadow: keyof VisualHierarchy['boxShadow']): string => {
    const element = document.documentElement;
    return element.style.getPropertyValue(`--box-shadow-${shadow}`).trim() || `var(--box-shadow-${shadow})`;
  },
  
  // 生成文本样式对象
  createTextStyle: (options: {
    size?: keyof TypographySystem['fontSize'];
    weight?: keyof TypographySystem['fontWeight'];
    lineHeight?: keyof TypographySystem['lineHeight'];
    letterSpacing?: keyof TypographySystem['letterSpacing'];
    color?: string;
    fontFamily?: keyof TypographySystem['fontFamily'];
  } = {}): React.CSSProperties => {
    const {
      size = 'base',
      weight = 'normal',
      lineHeight = 'normal',
      letterSpacing = 'normal',
      color,
      fontFamily = 'sans',
    } = options;
    
    return {
      fontSize: `var(--font-size-${size})`,
      fontWeight: `var(--font-weight-${weight})`,
      lineHeight: `var(--line-height-${lineHeight})`,
      letterSpacing: `var(--letter-spacing-${letterSpacing})`,
      color: color || 'var(--color-foreground)',
      fontFamily: `var(--font-family-${fontFamily})`,
    };
  },
  
  // 生成容器样式对象
  createContainerStyle: (options: {
    padding?: string;
    margin?: string;
    backgroundColor?: string;
    borderRadius?: keyof VisualHierarchy['borderRadius'];
    boxShadow?: keyof VisualHierarchy['boxShadow'];
    borderWidth?: keyof VisualHierarchy['borderWidth'];
    borderColor?: string;
  } = {}): React.CSSProperties => {
    const {
      padding,
      margin,
      backgroundColor = 'var(--color-background)',
      borderRadius,
      boxShadow,
      borderWidth,
      borderColor = 'var(--color-border)',
    } = options;
    
    return {
      padding,
      margin,
      backgroundColor,
      borderRadius: borderRadius ? `var(--border-radius-${borderRadius})` : undefined,
      boxShadow: boxShadow ? `var(--box-shadow-${boxShadow})` : undefined,
      borderWidth: borderWidth ? `var(--border-width-${borderWidth})` : undefined,
      borderColor: borderWidth ? borderColor : undefined,
      borderStyle: borderWidth ? 'solid' : undefined,
    };
  },
  
  // 生成状态样式
  createStateStyle: (options: {
    hover?: boolean;
    active?: boolean;
    focus?: boolean;
    disabled?: boolean;
    error?: boolean;
    success?: boolean;
    warning?: boolean;
    info?: boolean;
  } = {}): React.CSSProperties => {
    const styles: React.CSSProperties = {};
    
    if (options.disabled) {
      styles.opacity = 0.5;
      styles.cursor = 'not-allowed';
      styles.backgroundColor = 'var(--color-disabled)';
      styles.color = 'var(--color-disabled)';
    } else if (options.error) {
      styles.borderColor = 'var(--color-error)';
      styles.color = 'var(--color-error)';
    } else if (options.success) {
      styles.borderColor = 'var(--color-success)';
      styles.color = 'var(--color-success)';
    } else if (options.warning) {
      styles.borderColor = 'var(--color-warning)';
      styles.color = 'var(--color-warning)';
    } else if (options.info) {
      styles.borderColor = 'var(--color-info)';
      styles.color = 'var(--color-info)';
    }
    
    if (options.hover && !options.disabled) {
      styles.backgroundColor = 'var(--color-hover)';
    }
    
    if (options.active && !options.disabled) {
      styles.backgroundColor = 'var(--color-active)';
    }
    
    if (options.focus && !options.disabled) {
      styles.outline = '2px solid var(--color-focus)';
      styles.outlineOffset = '2px';
    }
    
    return styles;
  },
};

// 导出主题组件
export default ThemeProvider;
export { createTheme, ThemeUtils };

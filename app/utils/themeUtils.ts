/**
 * @file 主题管理工具
 * @description 提供主题相关的工具函数和颜色系统管理
 * @module utils/themeUtils
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */



/**
 * 主题类型枚举
 */
export enum ThemeType {
  Light = 'light',
  Dark = 'dark',
  System = 'system',
}

/**
 * 行业颜色配置类型
 */
export interface IndustryColor {
  /** 主色调 */
  primary: string;
  /** 辅助色 */
  secondary: string;
  /** 强调色 */
  accent: string;
  /** 成功色 */
  success: string;
  /** 警告色 */
  warning: string;
  /** 错误色 */
  error: string;
  /** 背景色 */
  background: string;
  /** 卡片色 */
  card: string;
  /** 文本色 */
  text: string;
}

/**
 * 行业颜色映射表
 */
export const industryColors: Record<string, IndustryColor> = {
  // 智慧农业
  agriculture: {
    primary: '#22c55e', // 绿色系 - 代表自然和生长
    secondary: '#84cc16',
    accent: '#15803d',
    success: '#22c55e',
    warning: '#facc15',
    error: '#ef4444',
    background: '#f0fdf4',
    card: '#ffffff',
    text: '#166534',
  },
  // 智慧城市
  smartCity: {
    primary: '#3b82f6', // 蓝色系 - 代表科技和信任
    secondary: '#60a5fa',
    accent: '#1d4ed8',
    success: '#22c55e',
    warning: '#facc15',
    error: '#ef4444',
    background: '#eff6ff',
    card: '#ffffff',
    text: '#1e3a8a',
  },
  // 金融服务
  finance: {
    primary: '#8b5cf6', // 紫色系 - 代表专业和创新
    secondary: '#a78bfa',
    accent: '#6d28d9',
    success: '#22c55e',
    warning: '#facc15',
    error: '#ef4444',
    background: '#f5f3ff',
    card: '#ffffff',
    text: '#5b21b6',
  },
  // 医疗健康
  healthcare: {
    primary: '#ec4899', // 粉色系 - 代表关怀和健康
    secondary: '#f472b6',
    accent: '#be185d',
    success: '#22c55e',
    warning: '#facc15',
    error: '#ef4444',
    background: '#fce7f3',
    card: '#ffffff',
    text: '#9d174d',
  },
  // 教育科技
  education: {
    primary: '#f97316', // 橙色系 - 代表活力和知识
    secondary: '#fb923c',
    accent: '#ea580c',
    success: '#22c55e',
    warning: '#facc15',
    error: '#ef4444',
    background: '#fff7ed',
    card: '#ffffff',
    text: '#c2410c',
  },
  // 零售电商
  retail: {
    primary: '#ef4444', // 红色系 - 代表热情和促销
    secondary: '#f87171',
    accent: '#b91c1c',
    success: '#22c55e',
    warning: '#facc15',
    error: '#ef4444',
    background: '#fee2e2',
    card: '#ffffff',
    text: '#991b1b',
  },
  // 制造业
  manufacturing: {
    primary: '#6366f1', // 靛蓝色系 - 代表工业和精密
    secondary: '#818cf8',
    accent: '#4f46e5',
    success: '#22c55e',
    warning: '#facc15',
    error: '#ef4444',
    background: '#eef2ff',
    card: '#ffffff',
    text: '#3730a3',
  },
  // 默认行业颜色
  default: {
    primary: '#3b82f6',
    secondary: '#60a5fa',
    accent: '#1d4ed8',
    success: '#22c55e',
    warning: '#facc15',
    error: '#ef4444',
    background: '#f9fafb',
    card: '#ffffff',
    text: '#1f2937',
  },
};

/**
 * 主题配置类型
 */
export interface ThemeConfig {
  /** 主题名称 */
  name: string;
  /** 主题类型 */
  type: ThemeType;
  /** CSS变量对象 */
  variables: Record<string, string>;
}

/**
 * 深色主题配置
 */
export const darkTheme: ThemeConfig = {
  name: 'Dark',
  type: ThemeType.Dark,
  variables: {
    'background': '24 24 27',
    'foreground': '250 250 250',
    'card': '39 39 42',
    'card-foreground': '250 250 250',
    'popover': '39 39 42',
    'popover-foreground': '250 250 250',
    'primary': '147 197 253',
    'primary-foreground': '26 32 44',
    'secondary': '168 162 158',
    'secondary-foreground': '250 250 250',
    'muted': '82 82 91',
    'muted-foreground': '161 161 170',
    'accent': '168 162 158',
    'accent-foreground': '250 250 250',
    'destructive': '239 68 68',
    'destructive-foreground': '255 255 255',
    'border': '82 82 91',
    'input': '82 82 91',
    'ring': '147 197 253',
    'radius': '0.5rem',
  },
};

/**
 * 浅色主题配置
 */
export const lightTheme: ThemeConfig = {
  name: 'Light',
  type: ThemeType.Light,
  variables: {
    'background': '255 255 255',
    'foreground': '29 78 216',
    'card': '255 255 255',
    'card-foreground': '29 78 216',
    'popover': '255 255 255',
    'popover-foreground': '29 78 216',
    'primary': '37 99 235',
    'primary-foreground': '255 255 255',
    'secondary': '229 231 235',
    'secondary-foreground': '29 78 216',
    'muted': '243 244 246',
    'muted-foreground': '107 114 128',
    'accent': '229 231 235',
    'accent-foreground': '29 78 216',
    'destructive': '239 68 68',
    'destructive-foreground': '255 255 255',
    'border': '229 231 235',
    'input': '229 231 235',
    'ring': '37 99 235',
    'radius': '0.5rem',
  },
};

/**
 * 根据行业获取颜色主题
 * @param industry 行业名称
 * @param themeType 主题类型
 * @returns 主题配置对象
 */
export function getIndustryTheme(industry: string, themeType: ThemeType = ThemeType.Light): ThemeConfig {
  const baseTheme = themeType === ThemeType.Dark ? darkTheme : lightTheme;
  const industryColor = industryColors[industry] || industryColors.default;
  
  return {
    ...baseTheme,
    name: `${industry.charAt(0).toUpperCase() + industry.slice(1)} ${baseTheme.name}`,
    variables: {
      ...baseTheme.variables,
      'primary': industryColor.primary,
      'primary-foreground': industryColor.text,
      'secondary': industryColor.secondary,
      'accent': industryColor.accent,
    },
  };
}

/**
 * 生成主题CSS变量字符串
 * @param theme 主题配置
 * @returns CSS变量字符串
 */
export function generateThemeCSS(theme: ThemeConfig): string {
  let css = ':root {\n';
  
  Object.entries(theme.variables).forEach(([key, value]) => {
    css += `  --${key}: ${value};\n`;
  });
  
  css += '}';
  return css;
}

/**
 * 生成主题样式对象
 * @param theme 主题配置
 * @returns React CSSProperties对象
 */
export function themeToCSSProperties(theme: ThemeConfig): Record<string, any> {
  const properties: Record<string, any> = {};
  
  Object.entries(theme.variables).forEach(([key, value]) => {
    properties[`--${key}`] = value;
  });
  
  return properties;
}

/**
 * 应用主题到文档
 * @param theme 主题配置
 */
export function applyThemeToDocument(theme: ThemeConfig): void {
  const root = document.documentElement;
  
  Object.entries(theme.variables).forEach(([key, value]) => {
    root.style.setProperty(`--${key}`, value);
  });
  
  // 设置data-theme属性
  root.setAttribute('data-theme', theme.type);
}

/**
 * 获取系统主题
 * @returns 系统主题类型
 */
export function getSystemTheme(): ThemeType {
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return ThemeType.Dark;
  }
  return ThemeType.Light;
}

/**
 * 监听系统主题变化
 * @param callback 回调函数
 * @returns 清理函数
 */
export function watchSystemTheme(callback: (theme: ThemeType) => void): () => void {
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  
  const handler = (e: MediaQueryListEvent) => {
    callback(e.matches ? ThemeType.Dark : ThemeType.Light);
  };
  
  mediaQuery.addEventListener('change', handler);
  
  return () => {
    mediaQuery.removeEventListener('change', handler);
  };
}
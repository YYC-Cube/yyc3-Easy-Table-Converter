/**
 * @file 样式工具函数
 * @description 提供通用的样式相关工具函数和辅助方法
 * @module utils/styleUtils
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * 合并类名的工具函数 - 结合clsx和tailwind-merge
 * @param inputs 类名输入
 * @returns 合并后的类名字符串
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * 生成CSS变量字符串
 * @param name 变量名
 * @param value 变量值
 * @returns CSS变量字符串
 */
export function cssVar(name: string, value?: string): string {
  return value ? `--${name}: ${value};` : `var(--${name})`;
}

/**
 * 生成CSS HSL颜色字符串
 * @param h 色相 (0-360)
 * @param s 饱和度 (0-100)
 * @param l 亮度 (0-100)
 * @param a 透明度 (0-1, 可选)
 * @returns HSL颜色字符串
 */
export function hsl(h: number, s: number, l: number, a?: number): string {
  return a !== undefined ? `hsl(${h} ${s}% ${l}% / ${a})` : `hsl(${h} ${s}% ${l}%)`;
}

/**
 * 根据CSS变量名称获取颜色值
 * @param variableName CSS变量名（不包含--前缀）
 * @param opacity 透明度（可选）
 * @returns 带CSS变量的颜色值
 */
export function getColorFromVar(variableName: string, opacity?: number): string {
  if (opacity !== undefined) {
    return `hsl(var(--${variableName}) / ${opacity})`;
  }
  return `hsl(var(--${variableName}))`;
}

/**
 * 生成颜色的悬停变体
 * @param color 基础颜色
 * @param hoverFactor 悬停因子 (0-1)
 * @returns 悬停颜色
 */
export function hoverColor(color: string, hoverFactor: number = 0.9): string {
  // 这里假设color是CSS变量名，如primary
  return `hsl(var(--${color}) / ${hoverFactor})`;
}

/**
 * 计算响应式断点
 * @param breakpoint 断点名称
 * @returns 断点值
 */
export function breakpoint(breakpoint: 'sm' | 'md' | 'lg' | 'xl' | '2xl'): string {
  const breakpoints = {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  };
  return breakpoints[breakpoint];
}

/**
 * 生成响应式类名
 * @param base 基础类名
 * @param variants 响应式变体
 * @returns 响应式类名
 */
export function responsiveClass(
  base: string,
  variants: Partial<{
    sm: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
  }>
): string {
  const classes = [base];
  
  if (variants.sm) classes.push(`sm:${variants.sm}`);
  if (variants.md) classes.push(`md:${variants.md}`);
  if (variants.lg) classes.push(`lg:${variants.lg}`);
  if (variants.xl) classes.push(`xl:${variants.xl}`);
  if (variants['2xl']) classes.push(`2xl:${variants['2xl']}`);
  
  return classes.join(' ');
}

/**
 * 获取文本截断的类名
 * @param lines 显示的行数
 * @returns 文本截断类名
 */
export function truncateText(lines: number = 1): string {
  if (lines === 1) {
    return 'truncate';
  }
  return `overflow-hidden text-ellipsis display-box -webkit-box -webkit-line-clamp-${lines} line-clamp-${lines}`;
}

/**
 * 生成阴影样式
 * @param level 阴影级别 (1-5)
 * @returns 阴影类名
 */
export function shadow(level: 1 | 2 | 3 | 4 | 5 = 1): string {
  const shadows = {
    1: 'shadow-sm',
    2: 'shadow',
    3: 'shadow-md',
    4: 'shadow-lg',
    5: 'shadow-xl',
  };
  return shadows[level] || 'shadow-md';
}

/**
 * 生成间距类名
 * @param size 间距大小
 * @param direction 方向 (p- padding, m- margin)
 * @param side 侧边 (可选: t- top, b- bottom, l- left, r- right, x- horizontal, y- vertical)
 * @returns 间距类名
 */
export function spacing(
  size: number | string,
  direction: 'p' | 'm' = 'p',
  side?: 't' | 'b' | 'l' | 'r' | 'x' | 'y'
): string {
  const prefix = side ? `${direction}${side}` : direction;
  return `${prefix}-${size}`;
}

/**
 * 生成圆角类名
 * @param size 圆角大小
 * @returns 圆角类名
 */
export function radius(size: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full' | number = 'md'): string {
  return `rounded-${size}`;
}

/**
 * 生成过渡动画类名
 * @param property 属性
 * @param duration 持续时间
 * @param timing 时间函数
 * @returns 过渡类名
 */
export function transition(
  property: string = 'all',
  duration: '75' | '100' | '150' | '200' | '300' | '500' | '700' | '1000' = '300',
  timing: 'linear' | 'in-out' | 'out-in' | 'ease' | 'ease-in' | 'ease-out' = 'ease'
): string {
  return `transition-${property} duration-${duration} ${timing}`;
}

/**
 * 生成网格类名
 * @param columns 列数
 * @param gap 间距
 * @returns 网格类名
 */
export function grid(columns: number, gap: number | string = 4): string {
  return `grid grid-cols-${columns} gap-${gap}`;
}

/**
 * 生成弹性盒类名
 * @param direction 方向
 * @param justify 主轴对齐
 * @param align 交叉轴对齐
 * @returns 弹性盒类名
 */
export function flex(
  direction: 'row' | 'col' = 'row',
  justify: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly' = 'start',
  align: 'start' | 'center' | 'end' | 'stretch' = 'stretch'
): string {
  return `flex flex-${direction} justify-${justify} items-${align}`;
}
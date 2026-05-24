/**
 * @file UI组件库索引
 * @description 统一导出所有UI组件，提供便捷的组件引用方式
 * @module ui
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

// 按钮组件
export { Button } from './Button';

// 卡片组件
export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

// 输入框组件
export { Input } from './Input';

// 工具提示组件
export { Tooltip } from './Tooltip';

// 徽章组件
export { Badge } from './Badge';

// 重新导出组件类型
export type { ButtonProps } from './Button';
export type { CardProps, CardHeaderProps, CardTitleProps, CardDescriptionProps, CardContentProps, CardFooterProps } from './Card';
export type { InputProps } from './Input';
export type { TooltipProps } from './Tooltip';
export type { BadgeProps } from './Badge';

// 导出组件库版本
export const COMPONENT_LIBRARY_VERSION = '1.0.0';
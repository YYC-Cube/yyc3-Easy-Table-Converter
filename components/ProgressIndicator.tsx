/**
 * @file 加载状态和进度指示器组件
 * @description 提供各种加载状态和进度显示组件，包括加载动画、进度条、骨架屏等
 * @module components/progress-indicator
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-16
 * @updated 2024-10-16
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Loader2,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Download,
  Upload,
  FileText,
  FileSpreadsheet,
  Database,
  Search,
  Settings,
  Eye,
  Lock,
  Unlock,
  Users,
  User,
  Zap,
  Server,
  Send,
  RefreshCw as RefreshIcon,
  ChevronRight,
  ChevronLeft,
  PauseCircle,
  PlayCircle,
  MoreHorizontal
} from 'lucide-react';
import { useResponsive } from './ResponsiveUtils';

// 加载状态类型
export type LoadingStatus = 
  | 'idle'      // 空闲状态
  | 'loading'   // 加载中
  | 'success'   // 成功
  | 'error'     // 错误
  | 'warning'   // 警告
  | 'info';     // 信息

// 加载尺寸类型
export type LoadingSize = 'sm' | 'md' | 'lg' | 'xl';

// 加载变体类型
export type LoadingVariant = 'default' | 'inline' | 'overlay' | 'skeleton';

// 加载图标类型
export type LoadingIcon = 
  | 'default'     // 默认加载图标
  | 'clock'       // 时钟图标
  | 'refresh'     // 刷新图标
  | 'download'    // 下载图标
  | 'upload'      // 上传图标
  | 'file'        // 文件图标
  | 'spreadsheet' // 电子表格图标
  | 'database'    // 数据库图标
  | 'search'      // 搜索图标
  | 'settings'    // 设置图标
  | 'eye'         // 查看图标
  | 'lock'        // 锁定图标
  | 'unlock'      // 解锁图标
  | 'users'       // 用户组图标
  | 'user'        // 用户图标
  | 'zap'         // 闪电图标
  | 'server'      // 服务器图标
  | 'send'        // 发送图标
  | 'refresh'     // 刷新图标
  | 'custom';     // 自定义图标

// 进度条模式类型
export type ProgressBarMode = 'determinate' | 'indeterminate';

// 加载指示器属性接口
interface LoadingIndicatorProps {
  // 加载状态
  status?: LoadingStatus;
  // 加载尺寸
  size?: LoadingSize;
  // 加载变体
  variant?: LoadingVariant;
  // 加载图标类型
  icon?: LoadingIcon;
  // 自定义图标
  customIcon?: React.ReactNode;
  // 加载文本
  text?: string;
  // 成功文本
  successText?: string;
  // 错误文本
  errorText?: string;
  // 警告文本
  warningText?: string;
  // 信息文本
  infoText?: string;
  // 是否显示图标
  showIcon?: boolean;
  // 是否显示文本
  showText?: boolean;
  // 是否显示背景
  showBackground?: boolean;
  // 是否显示边框
  showBorder?: boolean;
  // 背景颜色
  backgroundColor?: string;
  // 边框颜色
  borderColor?: string;
  // 图标颜色
  iconColor?: string;
  // 文本颜色
  textColor?: string;
  // 容器类名
  className?: string;
  // 图标类名
  iconClassName?: string;
  // 文本类名
  textClassName?: string;
  // 自定义样式
  style?: React.CSSProperties;
  // 动画持续时间 (毫秒)
  animationDuration?: number;
  // 自动隐藏时间 (毫秒)
  autoHideDuration?: number;
  // 是否居中
  center?: boolean;
  // 点击事件
  onClick?: () => void;
  // 键盘事件
  onKeyDown?: React.KeyboardEventHandler;
  // 无障碍标签
  ariaLabel?: string;
  // 无障碍角色
  role?: string;
  // 是否可聚焦
  tabIndex?: number;
  // 超时时间 (毫秒)
  timeout?: number;
}

/**
 * 加载指示器组件 - 提供各种加载状态的显示
 */
export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  status = 'idle',
  size = 'md',
  variant = 'default',
  icon = 'default',
  customIcon,
  text,
  successText = '加载成功',
  errorText = '加载失败',
  warningText = '加载警告',
  infoText = '加载信息',
  showIcon = true,
  showText = true,
  showBackground = true,
  showBorder = true,
  backgroundColor,
  borderColor,
  iconColor,
  textColor,
  className = '',
  iconClassName = '',
  textClassName = '',
  style = {},
  animationDuration = 1000,
  autoHideDuration,
  center = true,
  onClick,
  onKeyDown,
  ariaLabel,
  role = 'status',
  tabIndex,
  timeout
}) => {
  const [visible, setVisible] = useState<boolean>(true);
  const [hasTimedOut, setHasTimedOut] = useState<boolean>(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { isMobile } = useResponsive();
  
  // 清理超时计时器
  const clearTimeoutRef = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);
  
  // 设置自动隐藏
  useEffect(() => {
    if (autoHideDuration && (status === 'success' || status === 'error' || status === 'warning' || status === 'info')) {
      timeoutRef.current = setTimeout(() => {
        setVisible(false);
      }, autoHideDuration);
    }
    
    return clearTimeoutRef;
  }, [autoHideDuration, clearTimeoutRef, status]);
  
  // 设置超时处理
  useEffect(() => {
    if (timeout && status === 'loading') {
      timeoutRef.current = setTimeout(() => {
        setHasTimedOut(true);
      }, timeout);
    } else {
      setHasTimedOut(false);
    }
    
    return clearTimeoutRef;
  }, [clearTimeoutRef, status, timeout]);
  
  // 组件卸载时清理
  useEffect(() => {
    return clearTimeoutRef;
  }, [clearTimeoutRef]);
  
  // 处理最终状态
  const finalStatus = hasTimedOut ? 'error' : status;
  const finalErrorText = hasTimedOut ? `加载超时 (${timeout}ms)` : errorText;
  
  // 根据尺寸获取样式
  const getSizeStyles = useCallback((): { iconSize: number; fontSize: string } => {
    switch (size) {
      case 'sm':
        return { iconSize: 16, fontSize: '0.75rem' };
      case 'md':
        return { iconSize: 24, fontSize: '0.875rem' };
      case 'lg':
        return { iconSize: 32, fontSize: '1rem' };
      case 'xl':
        return { iconSize: 48, fontSize: '1.25rem' };
      default:
        return { iconSize: 24, fontSize: '0.875rem' };
    }
  }, [size]);
  
  // 获取当前文本
  const getCurrentText = useCallback((): string | undefined => {
    switch (finalStatus) {
      case 'success':
        return successText;
      case 'error':
        return finalErrorText;
      case 'warning':
        return warningText;
      case 'info':
        return infoText;
      case 'loading':
        return text;
      default:
        return undefined;
    }
  }, [errorText, finalErrorText, finalStatus, infoText, successText, text, warningText]);
  
  // 获取图标组件
  const getIconComponent = useCallback(() => {
    const { iconSize } = getSizeStyles();
    const iconProps = { className: iconClassName, size: iconSize };
    
    // 自定义图标优先
    if (icon === 'custom' && customIcon) {
      return customIcon;
    }
    
    // 根据状态选择图标
    switch (finalStatus) {
      case 'success':
        return <CheckCircle2 {...iconProps} />;
      case 'error':
        return <XCircle {...iconProps} />;
      case 'warning':
      case 'info':
        return <AlertCircle {...iconProps} />;
      case 'loading':
        // 根据图标类型选择加载图标
        switch (icon) {
          case 'clock':
            return <Clock {...iconProps} />;
          case 'refresh':
            return <RefreshIcon {...iconProps} />;
          case 'download':
            return <Download {...iconProps} />;
          case 'upload':
            return <Upload {...iconProps} />;
          case 'file':
            return <FileText {...iconProps} />;
          case 'spreadsheet':
            return <FileSpreadsheet {...iconProps} />;
          case 'database':
            return <Database {...iconProps} />;
          case 'search':
            return <Search {...iconProps} />;
          case 'settings':
            return <Settings {...iconProps} />;
          case 'eye':
            return <Eye {...iconProps} />;
          case 'lock':
            return <Lock {...iconProps} />;
          case 'unlock':
            return <Unlock {...iconProps} />;
          case 'users':
            return <Users {...iconProps} />;
          case 'user':
            return <User {...iconProps} />;
          case 'zap':
            return <Zap {...iconProps} />;
          case 'server':
            return <Server {...iconProps} />;
          case 'send':
            return <Send {...iconProps} />;
          default:
            return <Loader2 {...iconProps} />;
        }
      default:
        return null;
    }
  }, [customIcon, finalStatus, icon, iconClassName, getSizeStyles]);
  
  // 获取容器样式
  const getContainerStyles = useCallback(() => {
    const baseStyles: React.CSSProperties = {
      display: 'flex',
      alignItems: 'center',
      justifyContent: center ? 'center' : 'flex-start',
      ...style
    };
    
    // 添加背景样式
    if (showBackground) {
      baseStyles.backgroundColor = backgroundColor || (variant === 'inline' ? 'transparent' : 'rgba(255, 255, 255, 0.9)');
    }
    
    // 添加边框样式
    if (showBorder && variant !== 'inline') {
      baseStyles.border = `1px solid ${borderColor || 'rgba(0, 0, 0, 0.1)'}`;
    }
    
    // 变体特定样式
    switch (variant) {
      case 'inline':
        baseStyles.padding = '0';
        break;
      case 'overlay':
        baseStyles.position = 'fixed';
        baseStyles.top = 0;
        baseStyles.left = 0;
        baseStyles.right = 0;
        baseStyles.bottom = 0;
        baseStyles.zIndex = 50;
        baseStyles.background = 'rgba(0, 0, 0, 0.5)';
        baseStyles.flexDirection = 'column';
        baseStyles.gap = '0.75rem';
        break;
      default:
        baseStyles.padding = size === 'sm' ? '0.5rem' : size === 'lg' ? '1.5rem' : size === 'xl' ? '2rem' : '1rem';
        baseStyles.borderRadius = size === 'sm' ? '0.25rem' : size === 'lg' ? '0.75rem' : size === 'xl' ? '1rem' : '0.5rem';
        break;
    }
    
    return baseStyles;
  }, [backgroundColor, baseStyles, borderColor, center, overlayPadding, size, style, variant]);
  
  // 获取图标颜色
  const getIconColor = useCallback((): string | undefined => {
    if (iconColor) return iconColor;
    
    switch (finalStatus) {
      case 'success':
        return '#10b981'; // green-500
      case 'error':
        return '#ef4444'; // red-500
      case 'warning':
        return '#f59e0b'; // amber-500
      case 'info':
        return '#3b82f6'; // blue-500
      case 'loading':
        return '#6b7280'; // gray-500
      default:
        return undefined;
    }
  }, [finalStatus, iconColor]);
  
  // 获取文本样式
  const getTextStyles = useCallback(() => {
    const { fontSize } = getSizeStyles();
    return {
      fontSize,
      color: textColor,
      fontWeight: 500,
      margin: 0,
      textAlign: center ? 'center' : 'left'
    };
  }, [center, fontSize, getSizeStyles, textColor]);
  
  // 获取加载容器类名
  const getLoadingContainerClassName = useCallback(() => {
    const classes = [
      className,
      `loading-indicator loading-indicator-${finalStatus} loading-indicator-${size} loading-indicator-${variant}`,
      center && 'loading-indicator-center',
      !visible && 'hidden',
      onClick && 'cursor-pointer hover:opacity-90'
    ].filter(Boolean).join(' ');
    
    return classes;
  }, [className, center, finalStatus, onClick, size, variant, visible]);
  
  // 渲染加载内容
  const renderContent = () => {
    const currentText = getCurrentText();
    const iconComponent = getIconComponent();
    const iconColorValue = getIconColor();
    const textStyles = getTextStyles();
    
    return (
      <div>
        {showIcon && iconComponent && (
          <div 
            className={`loading-icon ${iconColorValue ? `text-[${iconColorValue}]` : ''}`}
            style={{ color: iconColorValue }}
          >
            {iconComponent}
          </div>
        )}
        {showText && currentText && (
          <p 
            className={`loading-text ${textColor ? `text-[${textColor}]` : ''} ${textClassName}`}
            style={textStyles}
          >
            {currentText}
          </p>
        )}
      </div>
    );
  };
  
  // 渲染加载指示器
  if (!visible && (status !== 'loading' && status !== 'idle')) {
    return null;
  }
  
  if (variant === 'overlay') {
    return (
      <div
        className={getLoadingContainerClassName()}
        style={getContainerStyles()}
        onClick={onClick}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel || `加载状态: ${finalStatus}`}
        role={role}
        tabIndex={tabIndex || (onClick ? 0 : undefined)}
      >
        <div className="bg-white dark:bg-gray-900 rounded-lg p-6 shadow-2xl max-w-sm animate-fadeIn">
          {renderContent()}
        </div>
      </div>
    );
  }
  
  return (
    <div
      className={getLoadingContainerClassName()}
      style={getContainerStyles()}
      onClick={onClick}
      onKeyDown={onKeyDown}
      aria-label={ariaLabel || `加载状态: ${finalStatus}`}
      role={role}
      tabIndex={tabIndex || (onClick ? 0 : undefined)}
    >
      {renderContent()}
    </div>
  );
};

// 进度条属性接口
interface ProgressBarProps {
  // 进度值 (0-100)
  value?: number;
  // 进度条模式
  mode?: ProgressBarMode;
  // 进度条尺寸
  size?: 'sm' | 'md' | 'lg';
  // 进度条颜色
  color?: string;
  // 背景颜色
  backgroundColor?: string;
  // 是否显示标签
  showLabel?: boolean;
  // 标签位置
  labelPosition?: 'inside' | 'outside' | 'none';
  // 标签格式
  labelFormat?: (value: number) => string;
  // 高度
  height?: number | string;
  // 圆角
  borderRadius?: number | string;
  // 是否显示条纹
  striped?: boolean;
  // 是否动画条纹
  animated?: boolean;
  // 是否显示百分比符号
  showPercentage?: boolean;
  // 容器类名
  className?: string;
  // 进度条类名
  barClassName?: string;
  // 标签类名
  labelClassName?: string;
  // 自定义样式
  style?: React.CSSProperties;
  // 进度条样式
  barStyle?: React.CSSProperties;
  // 标签样式
  labelStyle?: React.CSSProperties;
  // 完成回调
  onComplete?: () => void;
  // 进度变化回调
  onProgressChange?: (value: number) => void;
  // 无障碍标签
  ariaLabel?: string;
  // 无障碍角色
  role?: string;
}

/**
 * 进度条组件 - 提供进度显示功能
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  value = 0,
  mode = 'determinate',
  size = 'md',
  color = '#3b82f6',
  backgroundColor = '#e5e7eb',
  showLabel = false,
  labelPosition = 'outside',
  labelFormat,
  height,
  borderRadius,
  striped = false,
  animated = false,
  showPercentage = true,
  className = '',
  barClassName = '',
  labelClassName = '',
  style = {},
  barStyle = {},
  labelStyle = {},
  onComplete,
  onProgressChange,
  ariaLabel = '进度条',
  role = 'progressbar'
}) => {
  const [progressValue, setProgressValue] = useState<number>(Math.max(0, Math.min(100, value)));
  const prevValueRef = useRef<number>(progressValue);
  
  // 处理进度值变化
  useEffect(() => {
    const newValue = Math.max(0, Math.min(100, value));
    
    // 如果是确定模式，使用动画更新进度
    if (mode === 'determinate') {
      // 使用requestAnimationFrame平滑更新
      const updateProgress = () => {
        setProgressValue(prev => {
          const diff = newValue - prev;
          const step = diff > 0 ? Math.min(1, diff) : Math.max(-1, diff);
          const updated = prev + step;
          
          // 如果进度变化，调用回调
          if (onProgressChange && updated !== prevValueRef.current) {
            onProgressChange(updated);
            prevValueRef.current = updated;
          }
          
          // 如果到达目标值，停止动画
          if ((diff > 0 && updated >= newValue) || (diff < 0 && updated <= newValue)) {
            // 进度完成时调用回调
            if (newValue === 100 && onComplete) {
              onComplete();
            }
            return newValue;
          }
          
          return updated;
        });
      };
      
      // 开始动画
      const animationId = requestAnimationFrame(updateProgress);
      return () => cancelAnimationFrame(animationId);
    } else {
      // 不确定模式直接设置
      setProgressValue(newValue);
    }
  }, [value, mode, onComplete, onProgressChange]);
  
  // 获取进度条高度
  const getProgressHeight = useCallback(() => {
    if (height !== undefined) {
      return typeof height === 'number' ? `${height}px` : height;
    }
    
    switch (size) {
      case 'sm':
        return '4px';
      case 'lg':
        return '12px';
      default:
        return '8px';
    }
  }, [height, size]);
  
  // 获取进度条圆角
  const getProgressRadius = useCallback(() => {
    if (borderRadius !== undefined) {
      return typeof borderRadius === 'number' ? `${borderRadius}px` : borderRadius;
    }
    
    const progressHeight = getProgressHeight();
    const numericHeight = parseInt(progressHeight, 10);
    
    return isNaN(numericHeight) ? '0.375rem' : `${numericHeight / 2}px`;
  }, [borderRadius, getProgressHeight]);
  
  // 格式化标签文本
  const formatLabelText = useCallback(() => {
    if (labelFormat) {
      return labelFormat(progressValue);
    }
    
    return showPercentage ? `${Math.round(progressValue)}%` : `${Math.round(progressValue)}`;
  }, [labelFormat, progressValue, showPercentage]);
  
  // 获取容器样式
  const getContainerStyles = useCallback(() => {
    return {
      position: 'relative',
      width: '100%',
      height: getProgressHeight(),
      backgroundColor,
      borderRadius: getProgressRadius(),
      overflow: 'hidden',
      ...style
    };
  }, [backgroundColor, getProgressHeight, getProgressRadius, style]);
  
  // 获取进度条样式
  const getBarStyles = useCallback(() => {
    const baseStyles: React.CSSProperties = {
      height: '100%',
      backgroundColor: color,
      borderRadius: getProgressRadius(),
      transition: 'width 0.3s ease',
      ...barStyle
    };
    
    // 确定模式样式
    if (mode === 'determinate') {
      baseStyles.width = `${progressValue}%`;
    } else {
      // 不确定模式样式
      baseStyles.width = '30%';
      baseStyles.animation = 'progress-indeterminate 1.5s ease-in-out infinite';
    }
    
    // 条纹样式
    if (striped) {
      baseStyles.backgroundImage = 'linear-gradient(45deg, rgba(255,255,255,0.15) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.15) 50%, rgba(255,255,255,0.15) 75%, transparent 75%, transparent)';
      baseStyles.backgroundSize = '1rem 1rem';
      
      // 动画条纹
      if (animated) {
        baseStyles.animation = baseStyles.animation 
          ? `${baseStyles.animation}, progress-stripes 1s linear infinite`
          : 'progress-stripes 1s linear infinite';
      }
    }
    
    return baseStyles;
  }, [animated, barStyle, color, getProgressRadius, mode, progressValue, striped]);
  
  // 获取标签样式
  const getLabelStyles = useCallback(() => {
    const baseStyles: React.CSSProperties = {
      fontSize: '0.75rem',
      fontWeight: 500,
      color: 'inherit',
      ...labelStyle
    };
    
    // 根据位置添加样式
    switch (labelPosition) {
      case 'inside':
        baseStyles.position = 'absolute';
        baseStyles.top = '50%';
        baseStyles.left = '50%';
        baseStyles.transform = 'translate(-50%, -50%)';
        baseStyles.color = 'white';
        baseStyles.textShadow = '0 0 2px rgba(0, 0, 0, 0.7)';
        baseStyles.whiteSpace = 'nowrap';
        break;
      case 'outside':
        baseStyles.marginTop = '0.25rem';
        baseStyles.textAlign = 'center';
        break;
    }
    
    return baseStyles;
  }, [labelPosition, labelStyle]);
  
  // 获取容器类名
  const getContainerClassName = useCallback(() => {
    return [
      className,
      'progress-bar-container',
      `progress-bar-${size}`,
      `progress-bar-${mode}`,
      animated && 'progress-bar-animated',
      striped && 'progress-bar-striped'
    ].filter(Boolean).join(' ');
  }, [animated, className, mode, size, striped]);
  
  // 渲染进度条
  const renderProgressBar = () => (
    <div 
      className={`progress-bar ${barClassName}`}
      style={getBarStyles()}
    />
  );
  
  // 渲染标签
  const renderLabel = () => {
    if (!showLabel || labelPosition === 'none') {
      return null;
    }
    
    return (
      <div 
        className={`progress-label ${labelClassName}`}
        style={getLabelStyles()}
      >
        {formatLabelText()}
      </div>
    );
  };
  
  return (
    <div 
      className={getContainerClassName()}
      aria-label={ariaLabel}
      role={role}
      aria-valuenow={progressValue}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      {labelPosition === 'inside' && showLabel && renderLabel()}
      <div 
        className={`progress-bar ${barClassName}`}
        style={getBarStyles()}
      />
      {labelPosition === 'outside' && showLabel && renderLabel()}
    </div>
  );
};

// 骨架屏属性接口
interface SkeletonProps {
  // 骨架屏宽度
  width?: string | number;
  // 骨架屏高度
  height?: string | number;
  // 骨架屏圆角
  borderRadius?: string | number;
  // 骨架屏背景色
  backgroundColor?: string;
  // 骨架屏动画颜色
  animationColor?: string;
  // 是否启用动画
  animate?: boolean;
  // 动画持续时间 (毫秒)
  animationDuration?: number;
  // 是否显示为圆形
  isCircle?: boolean;
  // 是否显示为方形
  isSquare?: boolean;
  // 是否显示为行
  isLine?: boolean;
  // 容器类名
  className?: string;
  // 自定义样式
  style?: React.CSSProperties;
  // 延迟显示 (毫秒)
  delay?: number;
}

/**
 * 骨架屏组件 - 提供加载占位效果
 */
export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  borderRadius = '0.375rem',
  backgroundColor = 'rgba(209, 213, 219, 0.5)',
  animationColor = 'rgba(255, 255, 255, 0.6)',
  animate = true,
  animationDuration = 1500,
  isCircle = false,
  isSquare = false,
  isLine = false,
  className = '',
  style = {},
  delay = 0
}) => {
  const [visible, setVisible] = useState<boolean>(false);
  
  // 处理延迟显示
  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  // 获取骨架屏样式
  const getSkeletonStyles = useCallback((): React.CSSProperties => {
    const baseStyles: React.CSSProperties = {
      width,
      height,
      backgroundColor,
      borderRadius,
      ...style
    };
    
    // 圆形样式
    if (isCircle) {
      const size = typeof width === 'number' ? `${width}px` : (typeof height === 'number' ? `${height}px` : '2rem');
      return {
        ...baseStyles,
        width: size,
        height: size,
        borderRadius: '50%'
      };
    }
    
    // 方形样式
    if (isSquare) {
      const size = typeof width === 'number' ? `${width}px` : (typeof height === 'number' ? `${height}px` : '2rem');
      return {
        ...baseStyles,
        width: size,
        height: size
      };
    }
    
    // 行样式
    if (isLine) {
      return {
        ...baseStyles,
        width: typeof width === 'string' ? width : `${width}px`,
        height: typeof height === 'string' ? height : `${height}px`
      };
    }
    
    return baseStyles;
  }, [borderRadius, height, isCircle, isLine, isSquare, style, width, backgroundColor]);
  
  // 获取动画样式
  const getAnimationStyles = useCallback((): React.CSSProperties => {
    if (!animate) return {};
    
    return {
      position: 'relative',
      overflow: 'hidden',
      // 伪元素动画通过CSS变量控制
      '--skeleton-animation-duration': `${animationDuration}ms`,
      '--skeleton-animation-color': animationColor
    };
  }, [animate, animationColor, animationDuration]);
  
  // 获取类名
  const getSkeletonClassName = useCallback(() => {
    const classes = [
      className,
      'skeleton',
      animate && 'skeleton-animate',
      isCircle && 'skeleton-circle',
      isSquare && 'skeleton-square',
      isLine && 'skeleton-line',
      !visible && 'opacity-0'
    ].filter(Boolean).join(' ');
    
    return classes;
  }, [animate, className, isCircle, isLine, isSquare, visible]);
  
  // 计算最终样式
  const skeletonStyles = {
    ...getSkeletonStyles(),
    ...getAnimationStyles()
  };
  
  return (
    <div 
      className={getSkeletonClassName()}
      style={skeletonStyles}
    >
      {/* 动画效果通过CSS伪元素实现 */}
    </div>
  );
};

// 骨架屏行属性接口
interface SkeletonLineProps extends Omit<SkeletonProps, 'isLine' | 'isCircle' | 'isSquare'> {
  // 行宽度 (0-100)
  width?: string | number | 'full' | 'three-quarters' | 'two-thirds' | 'half' | 'one-third' | 'one-quarter';
  // 是否为最后一行
  isLast?: boolean;
  // 是否为第一行
  isFirst?: boolean;
}

/**
 * 骨架屏行组件 - 提供行状骨架屏
 */
export const SkeletonLine: React.FC<SkeletonLineProps> = ({
  width = 'full',
  height = '1rem',
  borderRadius = '0.125rem',
  isLast = false,
  isFirst = false,
  ...props
}) => {
  // 转换宽度值
  const getLineWidth = useCallback(() => {
    if (typeof width === 'string' && !width.includes('%') && !width.includes('px') && !width.includes('rem')) {
      const widthMap: Record<string, string> = {
        'full': '100%',
        'three-quarters': '75%',
        'two-thirds': '66.666%',
        'half': '50%',
        'one-third': '33.333%',
        'one-quarter': '25%'
      };
      
      return widthMap[width] || width;
    }
    
    return width;
  }, [width]);
  
  // 获取行样式
  const getLineStyles = useCallback(() => {
    return {
      marginBottom: isLast ? 0 : '0.75rem',
      marginTop: isFirst ? 0 : undefined
    };
  }, [isFirst, isLast]);
  
  return (
    <Skeleton
      isLine
      width={getLineWidth()}
      height={height}
      borderRadius={borderRadius}
      style={getLineStyles()}
      {...props}
    />
  );
};

// 骨架屏段落属性接口
interface SkeletonParagraphProps extends Omit<SkeletonProps, 'isLine' | 'isCircle' | 'isSquare'> {
  // 行数
  lines?: number;
  // 第一行宽度
  firstLineWidth?: string | number;
  // 最后一行宽度
  lastLineWidth?: string | number;
  // 是否显示段落标题
  showHeading?: boolean;
  // 标题宽度
  headingWidth?: string | number;
  // 标题高度
  headingHeight?: string | number;
}

/**
 * 骨架屏段落组件 - 提供段落状骨架屏
 */
export const SkeletonParagraph: React.FC<SkeletonParagraphProps> = ({
  lines = 3,
  firstLineWidth,
  lastLineWidth,
  showHeading = false,
  headingWidth = '70%',
  headingHeight = '1.5rem',
  ...props
}) => {
  // 生成行数组
  const lineArray = Array.from({ length: lines }, (_, index) => index);
  
  return (
    <div className="skeleton-paragraph"
      style={props.style}
    >
      {showHeading && (
        <SkeletonLine
          width={headingWidth}
          height={headingHeight}
          borderRadius={props.borderRadius || '0.25rem'}
          backgroundColor={props.backgroundColor}
          animationColor={props.animationColor}
          animate={props.animate}
          animationDuration={props.animationDuration}
          delay={props.delay}
        />
      )}
      
      {lineArray.map((index) => {
        let lineWidth = props.width;
        
        // 设置第一行和最后一行的宽度
        if (index === 0 && firstLineWidth !== undefined) {
          lineWidth = firstLineWidth;
        } else if (index === lines - 1 && lastLineWidth !== undefined) {
          lineWidth = lastLineWidth;
        }
        
        return (
          <SkeletonLine
            key={index}
            width={lineWidth}
            height={props.height}
            borderRadius={props.borderRadius}
            backgroundColor={props.backgroundColor}
            animationColor={props.animationColor}
            animate={props.animate}
            animationDuration={props.animationDuration}
            delay={props.delay}
            isLast={index === lines - 1}
            isFirst={!showHeading && index === 0}
          />
        );
      })}
    </div>
  );
};

// 骨架屏卡片属性接口
interface SkeletonCardProps extends Omit<SkeletonProps, 'isLine' | 'isCircle' | 'isSquare'> {
  // 卡片宽度
  cardWidth?: string | number;
  // 卡片高度
  cardHeight?: string | number;
  // 是否显示图像
  showImage?: boolean;
  // 图像高度
  imageHeight?: string | number;
  // 是否显示标题
  showHeading?: boolean;
  // 标题高度
  headingHeight?: string | number;
  // 标题宽度
  headingWidth?: string | number;
  // 内容行数
  contentLines?: number;
  // 是否显示页脚
  showFooter?: boolean;
  // 页脚高度
  footerHeight?: string | number;
  // 是否显示操作按钮
  showActions?: boolean;
  // 操作按钮数量
  actionCount?: number;
}

/**
 * 骨架屏卡片组件 - 提供卡片状骨架屏
 */
export const SkeletonCard: React.FC<SkeletonCardProps> = ({
  cardWidth = '100%',
  cardHeight,
  showImage = true,
  imageHeight = '120px',
  showHeading = true,
  headingHeight = '1.25rem',
  headingWidth = '80%',
  contentLines = 2,
  showFooter = false,
  footerHeight = '2rem',
  showActions = false,
  actionCount = 2,
  ...props
}) => {
  // 获取卡片样式
  const getCardStyles = useCallback((): React.CSSProperties => {
    return {
      width: cardWidth,
      height: cardHeight,
      padding: '1rem',
      borderRadius: props.borderRadius || '0.5rem',
      backgroundColor: props.backgroundColor || 'white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
      ...props.style
    };
  }, [cardHeight, cardWidth, props.borderRadius, props.backgroundColor, props.style]);
  
  // 生成操作按钮
  const renderActions = () => {
    if (!showActions) return null;
    
    return (
      <div className="flex gap-2 mt-3">
        {Array.from({ length: actionCount }, (_, index) => (
          <Skeleton
            key={`action-${index}`}
            width={index === 0 ? '40%' : '30%'}
            height="1.75rem"
            borderRadius="0.375rem"
            backgroundColor={props.backgroundColor}
            animationColor={props.animationColor}
            animate={props.animate}
          />
        ))}
      </div>
    );
  
  return (
    <div style={getCardStyles()}>
      {showImage && (
        <Skeleton
          width="100%"
          height={imageHeight}
          borderRadius="0.375rem"
          backgroundColor={props.backgroundColor}
          animationColor={props.animationColor}
          animate={props.animate}
          className="mb-4"
        />
      )}
      
      {showHeading && (
        <SkeletonLine
          width={headingWidth}
          height={headingHeight}
          borderRadius={props.borderRadius}
          backgroundColor={props.backgroundColor}
          animationColor={props.animationColor}
          animate={props.animate}
          className="mb-3"
        />
      )}
      
      <SkeletonParagraph
        lines={contentLines}
        firstLineWidth="90%"
        lastLineWidth="70%"
        height={props.height || '0.875rem'}
        borderRadius={props.borderRadius}
        backgroundColor={props.backgroundColor}
        animationColor={props.animationColor}
        animate={props.animate}
        showHeading={false}
      />
      
      {renderActions()}
      
      {showFooter && (
        <Skeleton
          width="100%"
          height={footerHeight}
          borderRadius="0.25rem"
          backgroundColor={props.backgroundColor}
          animationColor={props.animationColor}
          animate={props.animate}
          className="mt-4"
        />
      )}
    </div>
  );
};

// 进度指示器组件集合
export const progressIndicators = {
  LoadingIndicator,
  ProgressBar,
  Skeleton,
  SkeletonLine,
  SkeletonParagraph,
  SkeletonCard
};

// 进度工具函数
export const progressUtils = {
  // 计算进度百分比
  calculatePercentage: (current: number, total: number): number => {
    if (total === 0) return 0;
    return Math.max(0, Math.min(100, (current / total) * 100));
  },
  
  // 格式化时间
  formatTime: (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  },
  
  // 估计剩余时间
  estimateRemainingTime: (progress: number, elapsedTime: number): number => {
    if (progress <= 0) return 0;
    return (elapsedTime / progress) * (100 - progress);
  },
  
  // 生成随机进度增量
  generateRandomProgressIncrement: (min = 1, max = 5): number => {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  },
  
  // 动画插值
  interpolateProgress: (from: number, to: number, progress: number): number => {
    return from + (to - from) * Math.min(1, Math.max(0, progress));
  }
};

export default progressIndicators;
}

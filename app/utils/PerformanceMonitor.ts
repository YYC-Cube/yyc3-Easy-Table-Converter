/**
 * @file 性能监控服务
 * @description 提供前端性能指标监控和数据收集功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-24
 */

/**
 * 性能监控配置接口
 */
interface PerformanceMonitorConfig {
  /** 采样率 (0-1) */
  sampleRate?: number;
  /** 跟踪首次内容绘制 */
  trackFCP?: boolean;
  /** 跟踪最大内容绘制 */
  trackLCP?: boolean;
  /** 跟踪累积布局偏移 */
  trackCLS?: boolean;
  /** 跟踪首次输入延迟 */
  trackFID?: boolean;
  /** 跟踪可交互时间 */
  trackTTI?: boolean;
  /** 自定义性能标记 */
  customMarks?: string[];
  /** 发送性能数据的回调 */
  onReport?: (metrics: PerformanceMetrics) => void;
}

/**
 * 性能指标数据接口
 */
export interface PerformanceMetrics {
  /** 首次内容绘制 (FCP) */
  fcp?: number;
  /** 最大内容绘制 (LCP) */
  lcp?: number;
  /** 累积布局偏移 (CLS) */
  cls?: number;
  /** 首次输入延迟 (FID) */
  fid?: number;
  /** 可交互时间 (TTI) */
  tti?: number;
  /** 首次字节时间 (TTFB) */
  ttfb?: number;
  /** 资源加载时间 */
  resourceLoadTimes?: ResourceLoadTime[];
  /** 自定义性能标记 */
  customMarks?: { [key: string]: number };
  /** 设备信息 */
  deviceInfo?: {
    isMobile: boolean;
    isTablet: boolean;
    isDesktop: boolean;
    viewportWidth: number;
    viewportHeight: number;
    userAgent: string;
  };
  /** 页面信息 */
  pageInfo?: {
    url: string;
    referrer: string;
    timestamp: number;
  };
}

/**
 * 资源加载时间接口
 */
interface ResourceLoadTime {
  name: string;
  type: string;
  duration: number;
  startTime: number;
}

/**
 * 性能监控服务类
 * @description 提供前端性能指标监控和数据收集功能
 */
export class PerformanceMonitorService {
  private config: PerformanceMonitorConfig;
  private metrics: PerformanceMetrics = {};
  private isMonitoring: boolean = false;
  private observer: PerformanceObserver | null = null;
  private timeoutIds: number[] = [];
  private shouldSample: boolean;

  /**
   * 构造函数
   * @param config 性能监控配置
   */
  constructor(config: PerformanceMonitorConfig = {}) {
    this.config = {
      sampleRate: 1.0,
      trackFCP: true,
      trackLCP: true,
      trackCLS: true,
      trackFID: true,
      trackTTI: true,
      customMarks: [],
      ...config
    };

    // 根据采样率决定是否应该监控
    this.shouldSample = Math.random() < this.config.sampleRate!;
    
    // 初始化性能指标
    this.initializeMetrics();
  }

  /**
   * 初始化性能指标
   */
  private initializeMetrics(): void {
    this.metrics = {};
    
    // 记录设备信息
    this.metrics.deviceInfo = {
      isMobile: /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(navigator.userAgent),
      isTablet: /iPad|Tablet|(Android(?!.*Mobile))/.test(navigator.userAgent),
      isDesktop: !(/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)|iPad|Tablet|(Android(?!.*Mobile))/.test(navigator.userAgent)),
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
      userAgent: navigator.userAgent
    };
    
    // 记录页面信息
    this.metrics.pageInfo = {
      url: window.location.href,
      referrer: document.referrer,
      timestamp: Date.now()
    };
  }

  /**
   * 开始监控性能指标
   */
  public startMonitoring(): void {
    if (!this.shouldSample || this.isMonitoring) return;
    
    this.isMonitoring = true;
    
    // 尝试使用Performance API
    if (typeof performance !== 'undefined') {
      this.monitorNavigationTiming();
      this.monitorResourceTiming();
      this.setupPerformanceObservers();
      
      // 监控TTI (Time to Interactive)
      if (this.config.trackTTI) {
        this.monitorTTI();
      }
      
      // 添加自定义性能标记
      if (this.config.customMarks && this.config.customMarks.length > 0) {
        this.setupCustomMarks();
      }
    }
  }

  /**
   * 停止监控性能指标
   */
  public stopMonitoring(): void {
    if (!this.isMonitoring) return;
    
    this.isMonitoring = false;
    
    // 断开性能观察器
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    
    // 清除所有定时器
    this.timeoutIds.forEach(id => clearTimeout(id));
    this.timeoutIds = [];
    
    // 报告最终性能数据
    this.reportMetrics();
  }

  /**
   * 监控导航时间
   */
  private monitorNavigationTiming(): void {
    try {
      const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (navigationEntry) {
        // 计算TTFB (Time to First Byte)
        this.metrics.ttfb = navigationEntry.responseStart - navigationEntry.requestStart;
      }
    } catch (error) {
      console.warn('导航时间监控失败:', error);
    }
  }

  /**
   * 监控资源加载时间
   */
  private monitorResourceTiming(): void {
    try {
      // 启用资源计时
      if ('performance' in window && 'markResourceTiming' in window.performance) {
        (window.performance as any).markResourceTiming();
      }
      
      // 获取资源计时条目
      const resourceEntries = performance.getEntriesByType('resource');
      
      this.metrics.resourceLoadTimes = resourceEntries
        .filter(entry => entry.name.includes(window.location.host)) // 只包含当前域名的资源
        .map(entry => ({
          name: entry.name,
          type: this.getResourceType(entry.name),
          duration: entry.duration,
          startTime: entry.startTime
        }));
    } catch (error) {
      console.warn('资源加载时间监控失败:', error);
    }
  }

  /**
   * 设置性能观察器
   */
  private setupPerformanceObservers(): void {
    if (!('PerformanceObserver' in window)) return;
    
    try {
      // 创建性能观察器
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.handlePerformanceEntry(entry);
        });
      });

      // 观察性能条目
      const entryTypes: string[] = [];
      
      if (this.config.trackFCP || this.config.trackLCP) {
        entryTypes.push('largest-contentful-paint');
        entryTypes.push('paint');
      }
      
      if (this.config.trackCLS) {
        entryTypes.push('layout-shift');
      }
      
      // 观察所有需要的性能条目类型
      if (entryTypes.length > 0) {
        this.observer.observe({ entryTypes });
      }
      
      // 监控FID (首次输入延迟)
      if (this.config.trackFID) {
        this.setupFIDMonitoring();
      }
    } catch (error) {
      console.warn('性能观察器设置失败:', error);
    }
  }

  /**
   * 处理性能条目
   * @param entry 性能条目
   */
  private handlePerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'paint':
        if (this.config.trackFCP && entry.name === 'first-contentful-paint') {
          this.metrics.fcp = entry.startTime;
        }
        break;
      
      case 'largest-contentful-paint':
        if (this.config.trackLCP) {
          // 只记录最新的LCP值
          this.metrics.lcp = entry.startTime;
        }
        break;
      
      case 'layout-shift':
        if (this.config.trackCLS && !(entry as any).hadRecentInput) {
          // 累积布局偏移
          this.metrics.cls = (this.metrics.cls || 0) + (entry as any).value;
        }
        break;
    }
  }

  /**
   * 设置FID监控
   */
  private setupFIDMonitoring(): void {
    try {
      const handleFirstInput = (entry: PerformanceEntry) => {
        const eventTimingEntry = entry as PerformanceEventTiming;
        // 记录首次输入延迟
        this.metrics.fid = eventTimingEntry.processingStart - eventTimingEntry.startTime;
        
        // 移除事件监听器
        if ('PerformanceObserver' in window) {
          const fidObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(handleFirstInput);
          });
          fidObserver.observe({ type: 'first-input', buffered: true });
        }
      };
      
      // 使用PerformanceObserver监控首次输入
      if ('PerformanceObserver' in window) {
        const fidObserver = new PerformanceObserver((list) => {
          list.getEntries().forEach(handleFirstInput);
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
      }
    } catch (error) {
      console.warn('FID监控设置失败:', error);
    }
  }

  /**
   * 监控TTI (可交互时间)
   */
  private monitorTTI(): void {
    // 使用启发式方法计算TTI
    const startTime = performance.now();
    let isTTIReached = false;
    
    const checkTTI = () => {
      // 检查是否可以交互
      if (!isTTIReached && performance.now() - startTime > 2000) {
        // 简单的启发式方法：假设页面在加载2秒后基本可交互
        // 实际项目中可以使用更复杂的算法
        this.metrics.tti = performance.now() - startTime;
        isTTIReached = true;
      } else if (!isTTIReached) {
        // 继续检查
        this.timeoutIds.push(window.setTimeout(checkTTI, 100));
      }
    };
    
    this.timeoutIds.push(window.setTimeout(checkTTI, 100));
  }

  /**
   * 设置自定义性能标记
   */
  private setupCustomMarks(): void {
    if (!this.config.customMarks || this.config.customMarks.length === 0) return;
    
    this.metrics.customMarks = {};
    
    // 为每个自定义标记设置性能标记
    this.config.customMarks.forEach(mark => {
      try {
        performance.mark(mark);
      } catch (error) {
        console.warn(`自定义性能标记 ${mark} 设置失败:`, error);
      }
    });
  }

  /**
   * 获取资源类型
   * @param url 资源URL
   * @returns 资源类型
   */
  private getResourceType(url: string): string {
    const extension = url.split('.').pop()?.toLowerCase();
    
    if (['js', 'mjs', 'ts', 'tsx', 'jsx'].includes(extension || '')) {
      return 'script';
    } else if (['css', 'scss', 'sass', 'less'].includes(extension || '')) {
      return 'style';
    } else if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg', 'ico'].includes(extension || '')) {
      return 'image';
    } else if (['woff', 'woff2', 'ttf', 'otf'].includes(extension || '')) {
      return 'font';
    } else if (['json', 'xml', 'csv'].includes(extension || '')) {
      return 'data';
    } else if (url.includes('.css.map') || url.includes('.js.map')) {
      return 'sourcemap';
    } else if (url.includes('/api/')) {
      return 'api';
    }
    
    return 'other';
  }

  /**
   * 获取当前性能指标
   * @returns 性能指标
   */
  public getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * 添加自定义性能标记
   * @param name 标记名称
   */
  public addCustomMark(name: string): void {
    try {
      performance.mark(name);
      
      // 计算标记时间
      const marks = performance.getEntriesByName(name, 'mark');
      if (marks.length > 0) {
        this.metrics.customMarks = {
          ...this.metrics.customMarks,
          [name]: marks[0].startTime
        };
      }
    } catch (error) {
      console.warn(`添加自定义性能标记 ${name} 失败:`, error);
    }
  }

  /**
   * 添加自定义性能测量
   * @param name 测量名称
   * @param startMark 开始标记
   * @param endMark 结束标记
   */
  public addCustomMeasure(name: string, startMark: string, endMark: string): void {
    try {
      performance.measure(name, startMark, endMark);
      
      // 获取测量结果
      const measures = performance.getEntriesByName(name, 'measure');
      if (measures.length > 0) {
        this.metrics.customMarks = {
          ...this.metrics.customMarks,
          [name]: measures[0].duration
        };
      }
    } catch (error) {
      console.warn(`添加自定义性能测量 ${name} 失败:`, error);
    }
  }

  /**
   * 报告性能指标
   */
  private reportMetrics(): void {
    if (this.config.onReport && typeof this.config.onReport === 'function') {
      try {
        this.config.onReport(this.metrics);
      } catch (error) {
        console.warn('性能指标报告失败:', error);
      }
    }
  }

  /**
   * 手动触发性能报告
   * @returns 性能指标
   */
  public triggerReport(): PerformanceMetrics {
    this.reportMetrics();
    return this.getMetrics();
  }

  /**
   * 重置性能指标
   */
  public resetMetrics(): void {
    this.metrics = {};
    this.initializeMetrics();
  }
}

// 导出便捷函数

/**
 * 创建性能监控实例
 * @param config 性能监控配置
 * @returns 性能监控实例
 */
export function createPerformanceMonitor(config?: PerformanceMonitorConfig): PerformanceMonitorService {
  return new PerformanceMonitorService(config);
}

/**
 * 测量函数执行时间
 * @param name 测量名称
 * @param fn 要测量的函数
 * @returns 函数执行结果
 */
export function measureExecutionTime<T>(name: string, fn: () => T): T {
  const start = performance.now();
  try {
    return fn();
  } finally {
    const end = performance.now();
    console.log(`${name} 执行时间: ${end - start}ms`);
  }
}

/**
 * 生成性能分析报告
 * @param metrics 性能指标
 * @returns 格式化的性能报告
 */
export function generatePerformanceReport(metrics: PerformanceMetrics): string {
  let report = '性能分析报告:\n';
  
  if (metrics.fcp !== undefined) report += `- 首次内容绘制 (FCP): ${metrics.fcp.toFixed(2)}ms\n`;
  if (metrics.lcp !== undefined) report += `- 最大内容绘制 (LCP): ${metrics.lcp.toFixed(2)}ms\n`;
  if (metrics.cls !== undefined) report += `- 累积布局偏移 (CLS): ${metrics.cls.toFixed(3)}\n`;
  if (metrics.fid !== undefined) report += `- 首次输入延迟 (FID): ${metrics.fid.toFixed(2)}ms\n`;
  if (metrics.ttfb !== undefined) report += `- 首次字节时间 (TTFB): ${metrics.ttfb.toFixed(2)}ms\n`;
  if (metrics.tti !== undefined) report += `- 可交互时间 (TTI): ${metrics.tti.toFixed(2)}ms\n`;
  
  return report;
}

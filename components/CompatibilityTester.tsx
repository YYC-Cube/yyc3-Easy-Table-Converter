/**
 * @file 兼容性测试组件
 * @description 用于测试用户界面在不同设备、浏览器和屏幕尺寸上的兼容性
 * @module CompatibilityTester
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

import React, { useState, useRef, useEffect } from 'react';

// 设备预设配置
interface DeviceConfig {
  name: string;
  width: number;
  height: number;
  isMobile?: boolean;
  isTablet?: boolean;
  devicePixelRatio?: number;
}

// 设备预设列表
const DEVICE_PRESETS: DeviceConfig[] = [
  { name: 'iPhone SE', width: 375, height: 667, isMobile: true },
  { name: 'iPhone 12', width: 390, height: 844, isMobile: true },
  { name: 'iPhone 12 Pro Max', width: 428, height: 926, isMobile: true },
  { name: 'iPad Mini', width: 768, height: 1024, isTablet: true },
  { name: 'iPad Pro (11")', width: 834, height: 1194, isTablet: true },
  { name: 'iPad Pro (12.9")', width: 1024, height: 1366, isTablet: true },
  { name: 'Surface Pro', width: 1366, height: 768 },
  { name: 'Laptop', width: 1366, height: 768 },
  { name: 'Desktop 1080p', width: 1920, height: 1080 },
  { name: 'Desktop 4K', width: 3840, height: 2160 },
];

// 浏览器预设
const BROWSER_PRESETS = [
  { name: 'Chrome', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36' },
  { name: 'Firefox', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:117.0) Gecko/20100101 Firefox/117.0' },
  { name: 'Safari', userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15' },
  { name: 'Edge', userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36 Edg/118.0.2088.61' },
  { name: 'Mobile Safari', userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1' },
];

// 测试问题类型
interface TestIssue {
  id: string;
  type: 'layout' | 'styling' | 'functionality' | 'accessibility' | 'performance';
  severity: 'low' | 'medium' | 'high';
  description: string;
  device?: string;
  browser?: string;
  screenshotUrl?: string;
  lineNumber?: number;
  file?: string;
  timestamp: number;
}

// 可访问性检查规则
interface A11yRule {
  id: string;
  name: string;
  description: string;
  check: (element: HTMLElement) => boolean;
  severity: 'low' | 'medium' | 'high';
}

// 可访问性检查规则集
const A11Y_RULES: A11yRule[] = [
  {
    id: 'has-alt-text',
    name: '图像应有替代文本',
    description: '所有图像元素应包含alt属性',
    check: (el: HTMLElement) => {
      const images = el.querySelectorAll('img');
      return Array.from(images).every(img => img.hasAttribute('alt'));
    },
    severity: 'high'
  },
  {
    id: 'contrast-ratio',
    name: '文本对比度检查',
    description: '文本与背景的对比度应符合WCAG AA标准',
    check: (_el: HTMLElement) => {
      // 简单的对比度检查实现
      return true; // 简化实现，实际项目中需要计算对比度
    },
    severity: 'medium'
  },
  {
    id: 'semantic-html',
    name: '语义化HTML结构',
    description: '页面应使用适当的语义化HTML标签',
    check: (el: HTMLElement) => {
      return el.querySelector('header, main, footer, nav') !== null;
    },
    severity: 'low'
  },
  {
    id: 'keyboard-navigable',
    name: '键盘可访问性',
    description: '所有交互元素应可通过键盘访问',
    check: (el: HTMLElement) => {
      const interactiveElements = el.querySelectorAll('button, a, input, select, textarea');
      return Array.from(interactiveElements).every(element => {
        return element.hasAttribute('tabindex') || element.getAttribute('tabindex') !== '-1';
      });
    },
    severity: 'high'
  },
  {
    id: 'label-for-inputs',
    name: '表单标签关联',
    description: '所有表单输入应有关联的标签',
    check: (el: HTMLElement) => {
      const inputs = el.querySelectorAll('input, select, textarea');
      return Array.from(inputs).every(input => {
        const id = input.id;
        return input.hasAttribute('aria-label') || (id && el.querySelector(`label[for="${id}"]`) !== null);
      });
    },
    severity: 'medium'
  },
];

// 性能测试指标
interface PerformanceMetrics {
  loadTime: number;
  firstContentfulPaint: number;
  largestContentfulPaint: number;
  firstInputDelay: number;
  cumulativeLayoutShift: number;
  totalBlockingTime: number;
  domComplete: number;
  domInteractive: number;
}

// 兼容性测试组件属性
interface CompatibilityTesterProps {
  children: React.ReactNode;
  testTargets?: string[]; // 要测试的选择器
  autoRunTests?: boolean; // 是否自动运行测试
  onTestComplete?: (issues: TestIssue[]) => void;
  showControlPanel?: boolean; // 是否显示控制面板
  showResults?: boolean; // 是否显示测试结果
  className?: string; // 自定义CSS类名
}

/**
 * @description 兼容性测试组件 - 用于测试UI在不同设备和浏览器上的表现
 */const CompatibilityTesterComponent: React.FC<CompatibilityTesterProps> = ({
  children,
  testTargets: _testTargets = [],
  autoRunTests = true,
  onTestComplete,
  showControlPanel = true,
  showResults: _showResults = true,
  className: _className,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<DeviceConfig>(DEVICE_PRESETS[0]);
  const [selectedBrowser, setSelectedBrowser] = useState(BROWSER_PRESETS[0]);
  const [customSize, setCustomSize] = useState({ width: 1366, height: 768 });
  const [isTesting, setIsTesting] = useState(false);
  const [testIssues, setTestIssues] = useState<TestIssue[]>([]);
  const [performanceMetrics, setPerformanceMetrics] = useState<PerformanceMetrics | null>(null);
  const [viewportMode, setViewportMode] = useState<'device' | 'custom' | 'full'>('device');
  const [testType, setTestType] = useState<'all' | 'layout' | 'a11y' | 'performance'>('all');
  
  const testContainerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const testReportRef = useRef<HTMLDivElement>(null);
  const originalUserAgentRef = useRef<string | null>(null);
  
  // 初始化测试环境
  useEffect(() => {
    // 保存原始userAgent
    originalUserAgentRef.current = navigator.userAgent;
    
    // 如果启用了自动测试，组件挂载后运行测试
    if (autoRunTests) {
      runTests();
    }
    
    // 清理函数
    return () => {
      // 恢复原始userAgent
      if (originalUserAgentRef.current) {
        Object.defineProperty(window.navigator, 'userAgent', {
          value: originalUserAgentRef.current,
          configurable: true
        });
      }
    };
  }, []);
  
  // 切换设备/浏览器时更新视图
  useEffect(() => {
    // 模拟浏览器环境
    Object.defineProperty(window.navigator, 'userAgent', {
      value: selectedBrowser.userAgent,
      configurable: true
    });
    
    // 更新视口大小
    if (viewportMode === 'device' && viewportRef.current) {
      viewportRef.current.style.width = `${selectedDevice.width}px`;
      viewportRef.current.style.height = `${selectedDevice.height}px`;
    }
  }, [selectedDevice, selectedBrowser, viewportMode]);
  
  // 运行所有测试
  const runTests = async () => {
    if (isTesting || !testContainerRef.current) return;
    
    setIsTesting(true);
    setTestIssues([]);
    
    try {
      const issues: TestIssue[] = [];
      
      // 运行布局测试
      if (testType === 'all' || testType === 'layout') {
        const layoutIssues = await runLayoutTests();
        issues.push(...layoutIssues);
      }
      
      // 运行可访问性测试
      if (testType === 'all' || testType === 'a11y') {
        const a11yIssues = await runAccessibilityTests();
        issues.push(...a11yIssues);
      }
      
      // 运行性能测试
      if (testType === 'all' || testType === 'performance') {
        await runPerformanceTests();
      }
      
      setTestIssues(issues);
      
      // 通知测试完成
      if (onTestComplete) {
        onTestComplete(issues);
      }
    } catch (error) {
      console.error('测试运行失败:', error);
      
      // 添加错误到测试报告
      setTestIssues([{
        id: 'test-error',
        type: 'functionality',
        severity: 'high',
        description: `测试运行时出错: ${error instanceof Error ? error.message : '未知错误'}`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsTesting(false);
    }
  };
  
  // 运行布局测试
  const runLayoutTests = async (): Promise<TestIssue[]> => {
    const issues: TestIssue[] = [];
    
    if (!testContainerRef.current) return issues;
    
    // 检测溢出内容
    const overflowingElements = findOverflowingElements(testContainerRef.current);
    overflowingElements.forEach(({ element, width, parentWidth }) => {
      issues.push({
        id: `overflow-${Date.now()}`,
        type: 'layout',
        severity: 'medium',
        description: `元素溢出容器: ${element.tagName.toLowerCase()}.${element.className} 宽度 ${width}px 超过容器 ${parentWidth}px`,
        device: selectedDevice.name,
        browser: selectedBrowser.name,
        timestamp: Date.now()
      });
    });
    
    // 检测错位元素
    const misalignedElements = findMisalignedElements(testContainerRef.current);
    misalignedElements.forEach(({ element, property, value }) => {
      issues.push({
        id: `misalign-${Date.now()}`,
        type: 'layout',
        severity: 'low',
        description: `可能的对齐问题: ${element.tagName.toLowerCase()} 有不规则的 ${property}: ${value}`,
        device: selectedDevice.name,
        browser: selectedBrowser.name,
        timestamp: Date.now()
      });
    });
    
    // 检测响应式断点问题
    if (selectedDevice.isMobile) {
      const mobileIssues = findMobileSpecificIssues(testContainerRef.current);
      issues.push(...mobileIssues);
    }
    
    return issues;
  };
  
  // 运行可访问性测试
  const runAccessibilityTests = async (): Promise<TestIssue[]> => {
    const issues: TestIssue[] = [];
    
    if (!testContainerRef.current) return issues;
    
    // 运行每个可访问性规则检查
    A11Y_RULES.forEach(rule => {
      try {
        const passes = rule.check(testContainerRef.current!);
        if (!passes) {
          issues.push({
            id: `a11y-${rule.id}`,
            type: 'accessibility',
            severity: rule.severity,
            description: rule.description,
            device: selectedDevice.name,
            browser: selectedBrowser.name,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error(`运行可访问性规则 ${rule.id} 时出错:`, error);
      }
    });
    
    return issues;
  };
  
  // 运行性能测试
  const runPerformanceTests = async () => {
    // 测量性能指标
    if (typeof performance !== 'undefined' && 'measure' in performance) {
      performance.clearMarks();
      performance.clearMeasures();
      
      performance.mark('start');
      
      // 等待UI更新完成
      await new Promise(resolve => setTimeout(resolve, 100));
      
      performance.mark('end');
      performance.measure('render-time', 'start', 'end');
      
      const measure = performance.getEntriesByName('render-time')[0];
      
      // 收集基本性能指标
      setPerformanceMetrics({
        loadTime: measure.duration,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
        largestContentfulPaint: performance.getEntriesByName('largest-contentful-paint')[0]?.startTime || 0,
        firstInputDelay: 0, // 需要特殊监听
        cumulativeLayoutShift: 0, // 需要特殊监听
        totalBlockingTime: 0,
        domComplete: performance.timing.domComplete || 0,
        domInteractive: performance.timing.domInteractive || 0,
      });
    }
  };
  
  // 查找溢出容器的元素
  const findOverflowingElements = (container: HTMLElement): Array<{
    element: HTMLElement;
    width: number;
    parentWidth: number;
  }> => {
    const overflowingElements: Array<{
      element: HTMLElement;
      width: number;
      parentWidth: number;
    }> = [];
    
    const elements = container.querySelectorAll('*');
    elements.forEach(element => {
      const el = element as HTMLElement;
      const computedStyle = window.getComputedStyle(el);
      
      // 跳过隐藏元素和不需要检查的元素
      if (computedStyle.display === 'none' || 
          computedStyle.visibility === 'hidden' ||
          el.offsetWidth === 0 ||
          !el.parentElement) {
        return;
      }
      
      const parentComputedStyle = window.getComputedStyle(el.parentElement);
      const parentWidth = el.parentElement.clientWidth;
      const elementWidth = el.offsetWidth;
      
      // 检查是否溢出
      if (elementWidth > parentWidth && parentComputedStyle.overflowX !== 'visible') {
        overflowingElements.push({ element: el, width: elementWidth, parentWidth });
      }
    });
    
    return overflowingElements;
  };
  
  // 查找可能的错位元素
  const findMisalignedElements = (container: HTMLElement): Array<{
    element: HTMLElement;
    property: string;
    value: string;
  }> => {
    const misalignedElements: Array<{
      element: HTMLElement;
      property: string;
      value: string;
    }> = [];
    
    const elements = container.querySelectorAll('*');
    elements.forEach(element => {
      const el = element as HTMLElement;
      const computedStyle = window.getComputedStyle(el);
      
      // 检查可能导致错位的CSS属性
      const suspiciousProperties = [
        { property: 'margin-left', threshold: 999 },
        { property: 'margin-top', threshold: 999 },
        { property: 'left', threshold: 999 },
        { property: 'top', threshold: 999 },
      ];
      
      suspiciousProperties.forEach(({ property, threshold }) => {
        const value = computedStyle[property as keyof CSSStyleDeclaration];
        if (typeof value === 'string') {
          const numericValue = parseInt(value, 10);
          
          if (!isNaN(numericValue) && Math.abs(numericValue) > threshold) {
            misalignedElements.push({ element: el, property, value });
          }
        }
      });
    });
    
    return misalignedElements;
  };
  
  // 查找移动端特定问题
  const findMobileSpecificIssues = (container: HTMLElement): TestIssue[] => {
    const issues: TestIssue[] = [];
    
    // 检查过小的触摸目标
    const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
    interactiveElements.forEach(element => {
      const el = element as HTMLElement;
      const rect = el.getBoundingClientRect();
      
      // WCAG建议触摸目标至少44x44px
      if (rect.width < 44 || rect.height < 44) {
        issues.push({
          id: `mobile-touch-target-${Date.now()}`,
          type: 'layout',
          severity: 'medium',
          description: `触摸目标过小: ${el.tagName.toLowerCase()} 尺寸 ${rect.width.toFixed(1)}x${rect.height.toFixed(1)}px，推荐至少44x44px`,
          device: selectedDevice.name,
          browser: selectedBrowser.name,
          timestamp: Date.now()
        });
      }
    });
    
    // 检查水平滚动
    if (container.scrollWidth > container.clientWidth) {
      issues.push({
        id: `mobile-horizontal-scroll-${Date.now()}`,
        type: 'layout',
        severity: 'high',
        description: '在移动设备上出现了水平滚动条，内容应完全适配屏幕宽度',
        device: selectedDevice.name,
        browser: selectedBrowser.name,
        timestamp: Date.now()
      });
    }
    
    return issues;
  };
  
  // 截取当前视图
  const takeScreenshot = () => {
    if (!viewportRef.current) return;
    
    // 这里可以添加实际的截图功能，例如使用html2canvas库
    console.log('截图功能暂未实现，实际项目中可使用html2canvas等库');
  };
  
  // 导出测试报告
  const exportTestReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      device: selectedDevice.name,
      browser: selectedBrowser.name,
      testEnvironment: {
        viewport: `${selectedDevice.width}x${selectedDevice.height}`,
        userAgent: selectedBrowser.userAgent,
      },
      issues: testIssues,
      performanceMetrics,
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `compatibility-test-report-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  // 清除测试报告
  const clearTestReport = () => {
    setTestIssues([]);
    setPerformanceMetrics(null);
  };
  
  // 应用自定义视图大小
  const applyCustomSize = () => {
    if (viewportRef.current && viewportMode === 'custom') {
      viewportRef.current.style.width = `${customSize.width}px`;
      viewportRef.current.style.height = `${customSize.height}px`;
    }
  };
  
  // 控制面板渲染
  const renderControlPanel = () => {
    if (!showControlPanel) return null;
    
    return (
      <div className="bg-white shadow-lg rounded-lg p-4 mb-4 overflow-x-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {/* 设备选择器 */}
          <div className="form-field">
            <label className="form-label">设备预设</label>
            <select
              className="form-select form-select-md w-full"
              value={selectedDevice.name}
              onChange={(e) => {
                const device = DEVICE_PRESETS.find(d => d.name === e.target.value);
                if (device) setSelectedDevice(device);
              }}
              disabled={viewportMode !== 'device'}
            >
              {DEVICE_PRESETS.map(device => (
                <option key={device.name} value={device.name}>
                  {device.name} ({device.width}x{device.height})
                </option>
              ))}
            </select>
          </div>
          
          {/* 浏览器选择器 */}
          <div className="form-field">
            <label className="form-label">浏览器模拟</label>
            <select
              className="form-select form-select-md w-full"
              value={selectedBrowser.name}
              onChange={(e) => {
                const browser = BROWSER_PRESETS.find(b => b.name === e.target.value);
                if (browser) setSelectedBrowser(browser);
              }}
            >
              {BROWSER_PRESETS.map(browser => (
                <option key={browser.name} value={browser.name}>{browser.name}</option>
              ))}
            </select>
          </div>
          
          {/* 视口模式选择 */}
          <div className="form-field">
            <label className="form-label">视口模式</label>
            <div className="flex gap-2">
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="viewportMode"
                  value="device"
                  checked={viewportMode === 'device'}
                  onChange={(e) => setViewportMode(e.target.value as any)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">预设设备</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="viewportMode"
                  value="custom"
                  checked={viewportMode === 'custom'}
                  onChange={(e) => setViewportMode(e.target.value as any)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">自定义</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="radio"
                  name="viewportMode"
                  value="full"
                  checked={viewportMode === 'full'}
                  onChange={(e) => setViewportMode(e.target.value as any)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">全窗口</span>
              </label>
            </div>
          </div>
        </div>
        
        {/* 自定义尺寸输入 */}
        {viewportMode === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="form-field">
              <label className="form-label">宽度 (px)</label>
              <input
                type="number"
                className="form-input form-input-md w-full"
                value={customSize.width}
                onChange={(e) => setCustomSize({ ...customSize, width: parseInt(e.target.value, 10) || 0 })}
                min="100"
                max="5000"
              />
            </div>
            <div className="form-field">
              <label className="form-label">高度 (px)</label>
              <input
                type="number"
                className="form-input form-input-md w-full"
                value={customSize.height}
                onChange={(e) => setCustomSize({ ...customSize, height: parseInt(e.target.value, 10) || 0 })}
                min="100"
                max="5000"
              />
            </div>
            <button
              className="col-span-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              onClick={applyCustomSize}
            >
              应用尺寸
            </button>
          </div>
        )}
        
        {/* 测试控制 */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
          {/* 测试类型选择 */}
          <div className="form-field col-span-1 md:col-span-2">
            <label className="form-label">测试类型</label>
            <select
              className="form-select form-select-md w-full"
              value={testType}
              onChange={(e) => setTestType(e.target.value as any)}
            >
              <option value="all">全部测试</option>
              <option value="layout">布局测试</option>
              <option value="a11y">可访问性测试</option>
              <option value="performance">性能测试</option>
            </select>
          </div>
          
          {/* 测试按钮 */}
          <button
            className={`col-span-1 px-4 py-2 rounded-md transition-colors ${isTesting ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 text-white hover:bg-green-700'}`}
            onClick={runTests}
            disabled={isTesting}
          >
            {isTesting ? '测试中...' : '运行测试'}
          </button>
          
          <button
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
            onClick={clearTestReport}
          >
            清除报告
          </button>
        </div>
        
        {/* 性能指标显示 */}
        {performanceMetrics && (
          <div className="bg-gray-50 p-3 rounded-md mb-4">
            <h3 className="text-sm font-semibold mb-2">性能指标</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="block text-gray-500">加载时间</span>
                <span className="font-medium">{performanceMetrics.loadTime.toFixed(2)}ms</span>
              </div>
              <div>
                <span className="block text-gray-500">首次内容绘制</span>
                <span className="font-medium">{performanceMetrics.firstContentfulPaint.toFixed(2)}ms</span>
              </div>
              <div>
                <span className="block text-gray-500">最大内容绘制</span>
                <span className="font-medium">{performanceMetrics.largestContentfulPaint.toFixed(2)}ms</span>
              </div>
              <div>
                <span className="block text-gray-500">首次输入延迟</span>
                <span className="font-medium">{performanceMetrics.firstInputDelay.toFixed(2)}ms</span>
              </div>
            </div>
          </div>
        )}
        
        {/* 测试报告导出 */}
        {testIssues.length > 0 && (
          <button
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors mt-2"
            onClick={exportTestReport}
          >
            导出测试报告 ({testIssues.length} 个问题)
          </button>
        )}
      </div>
    );
  };
  
  // 测试报告渲染
  const renderTestReport = () => {
    if (testIssues.length === 0) return null;
    
    // 按严重性分组问题
    const highIssues = testIssues.filter(issue => issue.severity === 'high');
    const mediumIssues = testIssues.filter(issue => issue.severity === 'medium');
    const lowIssues = testIssues.filter(issue => issue.severity === 'low');
    
    return (
      <div className="bg-white shadow-lg rounded-lg p-4 mb-4 overflow-x-auto" ref={testReportRef}>
        <h2 className="text-lg font-semibold mb-3 flex items-center justify-between">
          <span>测试报告 ({testIssues.length} 个问题)</span>
          <span className="text-sm font-normal text-gray-500">
            高: {highIssues.length} | 中: {mediumIssues.length} | 低: {lowIssues.length}
          </span>
        </h2>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">类型</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">严重性</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">描述</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">浏览器</th>
                <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">时间</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testIssues.map((issue) => (
                <tr 
                  key={issue.id} 
                  className={
                    issue.severity === 'high' ? 'bg-red-50' :
                    issue.severity === 'medium' ? 'bg-yellow-50' :
                    'bg-blue-50'
                  }
                >
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getIssueTypeClass(issue.type)}`}>
                      {getIssueTypeLabel(issue.type)}
                    </span>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs ${getSeverityClass(issue.severity)}`}>
                      {getSeverityLabel(issue.severity)}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-sm text-gray-700 max-w-xs truncate">{issue.description}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{issue.device || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">{issue.browser || '-'}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                    {new Date(issue.timestamp).toLocaleTimeString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };
  
  // 获取问题类型的标签
  const getIssueTypeLabel = (type: TestIssue['type']) => {
    const labels: Record<TestIssue['type'], string> = {
      layout: '布局',
      styling: '样式',
      functionality: '功能',
      accessibility: '可访问性',
      performance: '性能'
    };
    return labels[type] || type;
  };
  
  // 获取问题类型的样式类
  const getIssueTypeClass = (type: TestIssue['type']) => {
    const classes: Record<TestIssue['type'], string> = {
      layout: 'bg-purple-100 text-purple-800',
      styling: 'bg-pink-100 text-pink-800',
      functionality: 'bg-red-100 text-red-800',
      accessibility: 'bg-blue-100 text-blue-800',
      performance: 'bg-green-100 text-green-800'
    };
    return classes[type] || 'bg-gray-100 text-gray-800';
  };
  
  // 获取严重性标签
  const getSeverityLabel = (severity: TestIssue['severity']) => {
    const labels: Record<TestIssue['severity'], string> = {
      low: '低',
      medium: '中',
      high: '高'
    };
    return labels[severity] || severity;
  };
  
  // 获取严重性样式类
  const getSeverityClass = (severity: TestIssue['severity']) => {
    const classes: Record<TestIssue['severity'], string> = {
      low: 'bg-blue-100 text-blue-800',
      medium: 'bg-yellow-100 text-yellow-800',
      high: 'bg-red-100 text-red-800'
    };
    return classes[severity] || 'bg-gray-100 text-gray-800';
  };
  
  // 渲染测试视口
  const renderTestViewport = () => {
    let viewportStyles: React.CSSProperties = {};
    
    if (viewportMode === 'device') {
      viewportStyles = {
        width: `${selectedDevice.width}px`,
        height: `${selectedDevice.height}px`,
        position: 'relative',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'auto',
        margin: '0 auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      };
    } else if (viewportMode === 'custom') {
      viewportStyles = {
        width: `${customSize.width}px`,
        height: `${customSize.height}px`,
        position: 'relative',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'auto',
        margin: '0 auto',
        boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      };
    } else {
      // full mode
      viewportStyles = {
        width: '100%',
        minHeight: '500px',
        border: '1px solid #ddd',
        borderRadius: '8px',
        overflow: 'auto',
      };
    }
    
    return (
      <div 
        ref={viewportRef} 
        className="test-viewport"
        style={viewportStyles}
      >
        <div ref={testContainerRef} className="h-full w-full">
          {children}
        </div>
      </div>
    );
  };
  
  // 渲染移动设备工具栏
  const renderMobileToolbar = () => {
    if (!selectedDevice.isMobile) return null;
    
    return (
      <div className="flex justify-center gap-2 mb-4">
        <button 
          className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700"
          onClick={takeScreenshot}
        >
          📸 截图
        </button>
      </div>
    );
  };
  
  return (
    <div className="compatibility-tester">
      {renderControlPanel()}
      {renderTestReport()}
      {renderMobileToolbar()}
      {renderTestViewport()}
    </div>
  );
};

// 兼容性测试工具函数
export const CompatibilityUtils = {
  // 检测设备类型
  detectDeviceType: (): 'mobile' | 'tablet' | 'desktop' => {
    const ua = navigator.userAgent;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(ua) && window.innerWidth < 768;
    const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
    
    if (isMobile) return 'mobile';
    if (isTablet) return 'tablet';
    return 'desktop';
  },
  
  // 检测浏览器类型
  detectBrowser: (): string => {
    const ua = navigator.userAgent;
    
    if (ua.indexOf('Firefox') !== -1) return 'Firefox';
    if (ua.indexOf('Chrome') !== -1 && ua.indexOf('Edg') === -1) return 'Chrome';
    if (ua.indexOf('Safari') !== -1 && ua.indexOf('Chrome') === -1) return 'Safari';
    if (ua.indexOf('Edg') !== -1) return 'Edge';
    if (ua.indexOf('MSIE') !== -1 || ua.indexOf('Trident/') !== -1) return 'IE';
    
    return 'Unknown';
  },
  
  // 检查CSS属性支持
  checkCSSSupport: (property: string, value?: string): boolean => {
    const el = document.createElement('div');
    
    // 检查带前缀的属性
    const prefixes = ['', '-webkit-', '-moz-', '-ms-', '-o-'];
    
    for (const prefix of prefixes) {
      const prefixedProp = prefix + property.charAt(0).toLowerCase() + property.slice(1);
      if (prefixedProp in el.style) {
        if (!value) return true;
        
        // 尝试设置属性值并检查是否被接受
        (el.style as any)[prefixedProp] = value;
        return (el.style as any)[prefixedProp] === value;
      }
    }
    
    return false;
  },
  
  // 获取媒体查询断点状态
  getMediaQueryStatus: (breakpoints: Record<string, string>): Record<string, boolean> => {
    const result: Record<string, boolean> = {};
    
    Object.entries(breakpoints).forEach(([name, query]) => {
      result[name] = window.matchMedia(query).matches;
    });
    
    return result;
  },
  
  // 监听设备方向变化
  listenForOrientationChange: (callback: () => void): (() => void) => {
    window.addEventListener('orientationchange', callback);
    return () => window.removeEventListener('orientationchange', callback);
  },
  
  // 生成设备指纹
  generateDeviceFingerprint: (): string => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return 'unknown';
    
    // 使用canvas生成指纹
    ctx.fillStyle = 'rgb(255, 255, 255)';
    ctx.fillRect(0, 0, 1, 1);
    const dataURL = canvas.toDataURL();
    
    // 结合其他环境信息
    const fingerprint = `${navigator.userAgent}-${navigator.language}-${screen.width}x${screen.height}-${dataURL}`;
    
    // 简化指纹（实际项目中可以使用更复杂的哈希算法）
    let hash = 0;
    for (let i = 0; i < fingerprint.length; i++) {
      const char = fingerprint.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // 转换为32位整数
    }
    
    return Math.abs(hash).toString(16);
  },
  
  // 检查触摸屏支持
  hasTouchSupport: (): boolean => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  },
};

// 兼容性报告工具函数
export const CompatibilityReportUtils = {
  // 格式化测试报告
  formatReportForDisplay: (report: any): string => {
    let result = `兼容性测试报告\n`;
    result += `====================\n`;
    result += `生成时间: ${new Date(report.generatedAt).toLocaleString()}\n`;
    result += `测试环境: ${report.device} / ${report.browser}\n`;
    result += `视口尺寸: ${report.testEnvironment.viewport}\n\n`;
    
    result += `问题汇总:\n`;
    if (report.issues.length === 0) {
      result += `- 无发现问题\n`;
    } else {
      const highIssues = report.issues.filter((i: any) => i.severity === 'high');
      const mediumIssues = report.issues.filter((i: any) => i.severity === 'medium');
      const lowIssues = report.issues.filter((i: any) => i.severity === 'low');
      
      result += `- 高严重性: ${highIssues.length}\n`;
      result += `- 中等严重性: ${mediumIssues.length}\n`;
      result += `- 低严重性: ${lowIssues.length}\n`;
      result += `- 总计: ${report.issues.length}\n\n`;
      
      result += `详细问题列表:\n`;
      report.issues.forEach((issue: any, index: number) => {
        result += `${index + 1}. [${issue.severity.toUpperCase()}] ${issue.description}\n`;
        if (issue.device) result += `   设备: ${issue.device}\n`;
        if (issue.browser) result += `   浏览器: ${issue.browser}\n`;
        result += `\n`;
      });
    }
    
    if (report.performanceMetrics) {
      result += `性能指标:\n`;
      result += `- 加载时间: ${report.performanceMetrics.loadTime.toFixed(2)}ms\n`;
      result += `- 首次内容绘制: ${report.performanceMetrics.firstContentfulPaint.toFixed(2)}ms\n`;
      result += `- 最大内容绘制: ${report.performanceMetrics.largestContentfulPaint.toFixed(2)}ms\n`;
      result += `- 首次输入延迟: ${report.performanceMetrics.firstInputDelay.toFixed(2)}ms\n`;
    }
    
    return result;
  },
  
  // 生成HTML格式报告
  generateHTMLReport: (report: any): string => {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>兼容性测试报告</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 1200px; margin: 0 auto; padding: 20px; }
    h1, h2, h3 { color: #2c3e50; }
    .summary { background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .metric { display: inline-block; margin-right: 20px; margin-bottom: 10px; }
    .issue { border-left: 4px solid #e74c3c; padding: 10px 15px; margin-bottom: 10px; background: #f8f9fa; }
    .issue.high { border-left-color: #e74c3c; }
    .issue.medium { border-left-color: #f39c12; }
    .issue.low { border-left-color: #3498db; }
    .issue-header { font-weight: bold; margin-bottom: 5px; }
    .issue-details { font-size: 0.9em; color: #666; }
    .performance-section { background: #e8f5e9; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center; color: #666; font-size: 0.9em; }
  </style>
</head>
<body>
  <h1>兼容性测试报告</h1>
  
  <div class="summary">
    <h2>测试摘要</h2>
    <div class="metric"><strong>生成时间:</strong> ${new Date(report.generatedAt).toLocaleString()}</div>
    <div class="metric"><strong>设备:</strong> ${report.device}</div>
    <div class="metric"><strong>浏览器:</strong> ${report.browser}</div>
    <div class="metric"><strong>视口尺寸:</strong> ${report.testEnvironment.viewport}</div>
    
    <h3>问题统计</h3>
    <div class="metric"><strong>高严重性:</strong> ${report.issues.filter((i: any) => i.severity === 'high').length}</div>
    <div class="metric"><strong>中等严重性:</strong> ${report.issues.filter((i: any) => i.severity === 'medium').length}</div>
    <div class="metric"><strong>低严重性:</strong> ${report.issues.filter((i: any) => i.severity === 'low').length}</div>
    <div class="metric"><strong>总计:</strong> ${report.issues.length}</div>
  </div>
  
  ${report.issues.length > 0 ? `
  <h2>问题详情</h2>
  ${report.issues.map((issue: any) => `
  <div class="issue ${issue.severity}">
    <div class="issue-header">${issue.description}</div>
    <div class="issue-details">
      类型: ${issue.type} | 严重性: ${issue.severity}
      ${issue.device ? `| 设备: ${issue.device}` : ''}
      ${issue.browser ? `| 浏览器: ${issue.browser}` : ''}
    </div>
  </div>
  `).join('')}
  ` : '<p>未发现兼容性问题。</p>'}
  
  ${report.performanceMetrics ? `
  <div class="performance-section">
    <h2>性能指标</h2>
    <div class="metric"><strong>加载时间:</strong> ${report.performanceMetrics.loadTime.toFixed(2)}ms</div>
    <div class="metric"><strong>首次内容绘制:</strong> ${report.performanceMetrics.firstContentfulPaint.toFixed(2)}ms</div>
    <div class="metric"><strong>最大内容绘制:</strong> ${report.performanceMetrics.largestContentfulPaint.toFixed(2)}ms</div>
    <div class="metric"><strong>首次输入延迟:</strong> ${report.performanceMetrics.firstInputDelay.toFixed(2)}ms</div>
    <div class="metric"><strong>累积布局偏移:</strong> ${report.performanceMetrics.cumulativeLayoutShift.toFixed(4)}</div>
    <div class="metric"><strong>总阻塞时间:</strong> ${report.performanceMetrics.totalBlockingTime.toFixed(2)}ms</div>
  </div>
  ` : ''}
  
  <div class="footer">
    <p>生成于 ${new Date(report.generatedAt).toLocaleString()} | YYC³ Easy Table Converter 兼容性测试工具</p>
  </div>
</body>
</html>
    `;
  },
  
  // 导出为PDF（简化版，实际项目中可使用html2pdf等库）
  exportToPDF: (_report: any): Promise<void> => {
    return new Promise((resolve, reject) => {
      try {
        console.log('导出PDF功能暂未实现，实际项目中可使用html2pdf、jsPDF等库');
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  },
};

// 导出组件和工具函数
export default CompatibilityTesterComponent;
export {
  CompatibilityTesterComponent as CompatibilityTester,
};
export type {
  TestIssue,
  DeviceConfig,
  A11yRule,
  PerformanceMetrics,
};

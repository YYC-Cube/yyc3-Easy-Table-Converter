/**
 * @file 行业导航组件
 * @description 实现行业分类的导航系统，支持多行业切换
 * @module industries/components/IndustryNavigation
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 * @updated 2024-11-20
 */

import React, { useState, useEffect } from 'react';
import { IndustryType } from '../types/index';
import { IndustryService } from '../services/industryService';

interface IndustryNavigationProps {
  currentIndustry?: IndustryType;
  onIndustryChange?: (industry: IndustryType) => void;
  className?: string;
}

/**
 * 行业导航组件 - 提供行业分类切换功能
 */
export const IndustryNavigation: React.FC<IndustryNavigationProps> = ({
  currentIndustry = IndustryType.AGRICULTURE,
  onIndustryChange,
  className = ''
}) => {
  const [industries, setIndustries] = useState<Array<{
    id: IndustryType;
    name: string;
    icon: string;
    description: string;
    toolCount: number;
  }>>([]);
  
  const [activeIndustry, setActiveIndustry] = useState<IndustryType>(currentIndustry);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // 初始化行业数据
  useEffect(() => {
    const industryService = IndustryService.getInstance();
    const industryList = industryService.getIndustries().map(industry => ({
      id: industry.id,
      name: industry.name,
      icon: industry.icon,
      description: industry.description,
      toolCount: industryService.getToolsByIndustry(industry.id).length
    }));
    
    setIndustries(industryList);
  }, []);

  // 当外部currentIndustry变化时更新
  useEffect(() => {
    setActiveIndustry(currentIndustry);
  }, [currentIndustry]);

  /**
   * 处理行业切换
   */
  const handleIndustryChange = (industryId: IndustryType) => {
    setActiveIndustry(industryId);
    setIsMobileMenuOpen(false);
    
    if (onIndustryChange) {
      onIndustryChange(industryId);
    }
  };

  /**
   * 行业图标映射
   */
  const getIndustryIcon = (industryId: IndustryType): React.ReactNode => {
    // 这里使用简单的emoji作为图标，可以替换为实际的图标组件
    const iconMap: Partial<Record<IndustryType, string>> = {
      [IndustryType.AGRICULTURE]: '🌾',
      [IndustryType.EDUCATION]: '🎓',
      [IndustryType.SMARTCITY]: '🏙️',
      [IndustryType.HUMANRESOURCE]: '👥',
      [IndustryType.MEDIA]: '🎬',
      [IndustryType.CREATIVE]: '🎨',
      [IndustryType.ENERGY]: '⚡'
    };
    
    return iconMap[industryId] || '📊';
  };

  /**
   * 渲染行业项
   */
  const renderIndustryItem = (industry: typeof industries[0]) => {
    const isActive = activeIndustry === industry.id;
    
    return (
      <button
        key={industry.id}
        className={`
          flex items-center space-x-2 p-3 rounded-lg transition-all duration-200
          ${isActive
            ? 'bg-blue-600 text-white shadow-lg'
            : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-blue-50 dark:hover:bg-gray-700'}
          ${isExpanded ? 'w-full justify-start' : 'flex-col justify-center'}
        `}
        onClick={() => handleIndustryChange(industry.id)}
        aria-label={`切换到${industry.name}行业`}
        title={industry.description}
      >
        <span className="text-2xl">{getIndustryIcon(industry.id)}</span>
        <div className={`${!isExpanded && !isMobileMenuOpen ? 'hidden' : 'block'}`}>
          <span className="font-medium">{industry.name}</span>
          <span className="text-xs opacity-70 ml-2">({industry.toolCount}个工具)</span>
        </div>
      </button>
    );
  };

  return (
    <div className={`industry-navigation ${className}`}>
      {/* 移动端菜单按钮 */}
      <div className="md:hidden">
        <button
          className="w-full flex items-center justify-between p-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{getIndustryIcon(activeIndustry)}</span>
            <span className="font-medium">{industries.find(i => i.id === activeIndustry)?.name}</span>
          </div>
          <span className={`transform transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`}>▼</span>
        </button>
        
        {/* 移动端菜单 */}
        {isMobileMenuOpen && (
          <div className="mt-2 flex flex-col space-y-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-2">
            {industries.map(industry => renderIndustryItem(industry))}
          </div>
        )}
      </div>

      {/* 桌面端导航 */}
      <div className="hidden md:block">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200">行业分类</h3>
          <button
            className="text-sm px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded hover:bg-gray-200 dark:hover:bg-gray-600"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? '收起' : '展开'}
          </button>
        </div>
        
        {/* 水平导航栏 */}
        <div className={`
          overflow-x-auto scrollbar-hide pb-2
          ${isExpanded ? 'grid grid-cols-2 gap-2' : 'flex space-x-2'}
        `}>
          {industries.map(industry => (
            <div 
              key={industry.id}
              className={`
                ${isExpanded ? '' : 'flex-shrink-0'}
              `}
            >
              {renderIndustryItem(industry)}
            </div>
          ))}
        </div>
      </div>

      {/* 行业统计信息 */}
      <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400">
        共 {industries.length} 个行业分类
      </div>
    </div>
  );
};

/**
 * 默认导出
 */
export default IndustryNavigation;

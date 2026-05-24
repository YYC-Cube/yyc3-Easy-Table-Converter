/**
 * @file 行业详情组件
 * @description 显示当前选中行业的详细信息和工具列表
 * @module industries/components/IndustryDetail
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 * @updated 2024-11-20
 */

import React, { useState, useEffect } from 'react';
import { IndustryType, Tool } from '../types/index';
import { IndustryService } from '../services/industryService';

interface IndustryDetailProps {
  industryId: IndustryType;
  onToolSelect?: (tool: Tool) => void;
  className?: string;
}

/**
 * 行业详情组件 - 显示行业信息和工具列表
 */
export const IndustryDetail: React.FC<IndustryDetailProps> = ({
  industryId,
  onToolSelect,
  className = ''
}) => {
  const [industry, setIndustry] = useState<{
    id: IndustryType;
    name: string;
    description: string;
    icon: string;
    highlights: string[];
  } | null>(null);
  
  const [tools, setTools] = useState<Tool[]>([]);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [filterTerm, setFilterTerm] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'popularity' | 'newest'>('name');

  // 初始化行业和工具数据
  useEffect(() => {
    const industryService = IndustryService.getInstance();
    const currentIndustry = industryService.getIndustryById(industryId);
    
    if (currentIndustry) {
      setIndustry({
        id: currentIndustry.id,
        name: currentIndustry.name,
        description: currentIndustry.description,
        icon: currentIndustry.icon,
        highlights: currentIndustry.highlights
      });
    }
    
    const industryTools = industryService.getToolsByIndustry(industryId);
    setTools(industryTools);
    setSelectedTool(null);
  }, [industryId]);

  // 过滤和排序工具
  const filteredAndSortedTools = React.useMemo(() => {
    const result = tools.filter(tool => 
      tool.name.toLowerCase().includes(filterTerm.toLowerCase()) ||
      tool.description.toLowerCase().includes(filterTerm.toLowerCase())
    );
    
    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
      case 'name':
      default:
        return a.name.localeCompare(b.name);
      case 'newest':
        // 由于没有createdAt属性，这里简单返回0表示不排序
        return 0;
    }
    });
    
    return result;
  }, [tools, filterTerm, sortBy]);

  /**
   * 处理工具选择
   */
  const handleToolSelect = (tool: Tool) => {
    setSelectedTool(tool);
    if (onToolSelect) {
      onToolSelect(tool);
    }
  };

  /**
   * 获取行业图标
   */
  const getIndustryIcon = (): string => {
    // 使用switch语句代替映射，避免类型错误
    switch (industryId) {
      case IndustryType.AGRICULTURE:
        return '🌾';
      case IndustryType.EDUCATION:
        return '🎓';
      case IndustryType.HEALTHCARE:
        return '🏥';
      case IndustryType.FINANCE:
        return '💰';
      case IndustryType.SMARTCITY:
        return '🏙️';
      case IndustryType.RETAIL:
        return '🛍️';
      case IndustryType.MANUFACTURING:
        return '🏭';
      case IndustryType.ENERGY:
        return '⚡';
      case IndustryType.MEDIA:
        return '📺';
      case IndustryType.CREATIVE:
        return '🎨';
      case IndustryType.LEGAL:
        return '⚖️';
      case IndustryType.HUMANRESOURCE:
        return '👥';
      default:
        return '🏢';
    }
  };

  /**
   * 渲染工具卡片
   */
  const renderToolCard = (tool: Tool) => {
    const isSelected = selectedTool?.id === tool.id;
    
    return (
      <div
        key={tool.id}
        className={`
          border rounded-xl p-4 transition-all duration-200 cursor-pointer
          ${isSelected
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
            : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-300 dark:hover:border-blue-700'}
        `}
        onClick={() => handleToolSelect(tool)}
      >
        <div className="flex justify-between items-start mb-3">
          <h4 className="font-semibold text-lg text-gray-800 dark:text-white">{tool.name}</h4>
        </div>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {tool.description}
        </p>
        <div className="h-4 mb-4"></div>
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-500">
          <span>工具详情</span>
        </div>
      </div>
    );
  };

  if (!industry) {
    return (
      <div className={`${className} flex items-center justify-center h-64`}>
        <div className="text-gray-500 dark:text-gray-400">
          行业信息加载中...
        </div>
      </div>
    );
  }

  return (
    <div className={`industry-detail ${className}`}>
      {/* 行业头部信息 */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 mb-6">
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          <div className="text-6xl md:text-8xl">{getIndustryIcon()}</div>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-2">{industry.name}</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">{industry.description}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {industry.highlights.map((highlight, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-green-500">✓</span>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{highlight}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 工具过滤和排序 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="w-full sm:w-auto">
            <input
              type="text"
              placeholder={`搜索${industry.name}工具...`}
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select
              className="px-3 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            >
              <option value="name">按名称排序</option>
              <option value="popularity">按热度排序</option>
              <option value="newest">按最新排序</option>
            </select>
          </div>
        </div>
      </div>

      {/* 工具列表 */}
      {filteredAndSortedTools.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
          <div className="text-gray-400 text-lg mb-2">🔍</div>
          <h3 className="text-gray-800 dark:text-gray-200 font-medium mb-1">未找到工具</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            没有找到匹配"{filterTerm}"的工具，请尝试其他关键词
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAndSortedTools.map(tool => renderToolCard(tool))}
        </div>
      )}
    </div>
  );
};

/**
 * 默认导出
 */
export default IndustryDetail;

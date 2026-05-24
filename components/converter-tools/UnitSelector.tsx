/**
 * @file 单位选择器组件
 * @description 为各种单位换算工具提供统一的单位选择界面
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Info } from 'lucide-react';

/**
 * 通用单位接口
 */
export interface Unit {
  name: string;
  symbol: string;
  description?: string;
  category?: string;
}

interface UnitSelectorProps {
  units: Record<string, Unit>;
  selectedUnit: string;
  onUnitChange: (unitKey: string) => void;
  label?: string;
  placeholder?: string;
  categoryFilter?: string;
  searchFilter?: string;
  className?: string;
}

/**
 * 通用单位选择器组件
 * 提供分类筛选和搜索功能，支持单位信息提示
 */
export const UnitSelector: React.FC<UnitSelectorProps> = ({
  units,
  selectedUnit,
  onUnitChange,
  label = '单位',
  placeholder = '选择单位',
  categoryFilter,
  searchFilter = '',
  className = '',
}) => {
  // 根据分类和搜索过滤单位
  const filteredUnits = Object.entries(units).filter(([_, unit]) => {
    const matchesCategory = !categoryFilter || categoryFilter === '所有类别' || unit.category === categoryFilter;
    const matchesSearch = !searchFilter || 
      unit.name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      unit.symbol.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (unit.description && unit.description.toLowerCase().includes(searchFilter.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  // 按类别分组单位
  const groupedUnits = filteredUnits.reduce<Record<string, Array<[string, Unit]>>>((acc, [key, unit]) => {
    const category = unit.category || '未分类';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push([key, unit]);
    return acc;
  }, {});

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <div className="flex items-center justify-between">
        <label className="text-base font-medium text-gray-700">{label}</label>
        {selectedUnit && units[selectedUnit]?.description && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-blue-500 hover:text-blue-700 transition-colors">
                  <Info className="w-4 h-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p>{units[selectedUnit].description}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      <Select value={selectedUnit} onValueChange={onUnitChange}>
        <SelectTrigger className="w-full border-gray-300 focus:border-blue-500 focus:ring-blue-500">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent className="max-h-96 w-full">
          {Object.entries(groupedUnits).length > 1 ? (
            // 如果有多个类别，按类别分组显示
            Object.entries(groupedUnits).map(([category, categoryUnits]) => (
              <div key={category} className="border-t first:border-t-0 pt-2 first:pt-0">
                <div className="px-2 text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
                  {category}
                </div>
                <div className="space-y-1">
                  {categoryUnits.map(([key, unit]) => (
                    <SelectItem key={key} value={key} className="px-2 py-1 cursor-pointer">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{unit.name}</span>
                        <span className="text-xs text-gray-500 font-mono">{unit.symbol}</span>
                      </div>
                    </SelectItem>
                  ))}
                </div>
              </div>
            ))
          ) : (
            // 单个类别，直接显示所有单位
            filteredUnits.map(([key, unit]) => (
              <SelectItem key={key} value={key} className="px-2 py-1 cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{unit.name}</span>
                  <span className="text-xs text-gray-500 font-mono">{unit.symbol}</span>
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
      
      {filteredUnits.length === 0 && (
        <p className="text-xs text-red-500 mt-1">没有找到匹配的单位</p>
      )}
    </div>
  );
};

export default UnitSelector;
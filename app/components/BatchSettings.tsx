/**
 * @file 批处理设置组件
 * @description 提供批处理操作的配置选项
 * @module components/batch-settings
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 */
import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Settings, FileText } from './ui/icons';

interface BatchSettingsProps {
  settings: {
    outputFormat: string;
    delimiter: string;
    headerRow: boolean;
    skipEmptyLines: boolean;
    autoConvert: boolean;
    encoding: string;
  };
  onChange: (settings: BatchSettingsProps['settings']) => void;
  onApplySettings: () => void;
}

/**
 * 批处理设置组件
 * @description 提供批处理操作的各种配置选项
 */
const BatchSettings: React.FC<BatchSettingsProps> = ({ settings, onChange, onApplySettings }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  /**
   * 处理设置变更
   */
  const handleSettingChange = (key: keyof BatchSettingsProps['settings'], value: any) => {
    onChange({
      ...settings,
      [key]: value,
    });
  };

  /**
   * 切换展开状态
   */
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  /**
   * 应用设置
   */
  const handleApplySettings = () => {
    onApplySettings();
    setIsExpanded(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* 设置标题栏 */}
      <div 
        className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex justify-between items-center cursor-pointer hover:bg-gray-100 transition-colors"
        onClick={toggleExpanded}
      >
        <div className="flex items-center">
          <Settings className="h-4.5 w-4.5 text-gray-500 mr-2" />
          <h3 className="text-lg font-medium text-gray-800">批处理设置</h3>
        </div>
        {isExpanded ? (
          <ChevronUp className="h-4.5 w-4.5 text-gray-500" />
        ) : (
          <ChevronDown className="h-4.5 w-4.5 text-gray-500" />
        )}
      </div>

      {/* 设置内容 */}
      {isExpanded && (
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 输出格式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">输出格式</label>
              <select
                value={settings.outputFormat}
                onChange={(e) => handleSettingChange('outputFormat', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="csv">CSV</option>
                <option value="json">JSON</option>
                <option value="excel">Excel</option>
                <option value="xml">XML</option>
                <option value="tsv">TSV</option>
              </select>
            </div>

            {/* 分隔符 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">分隔符</label>
              <select
                value={settings.delimiter}
                onChange={(e) => handleSettingChange('delimiter', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value=",">逗号 (,)</option>
                <option value=";">分号 (;)</option>
                <option value="\t">制表符 (Tab)</option>
                <option value="|">竖线 (|)</option>
              </select>
            </div>

            {/* 编码 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">文件编码</label>
              <select
                value={settings.encoding}
                onChange={(e) => handleSettingChange('encoding', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="utf-8">UTF-8</option>
                <option value="utf-16">UTF-16</option>
                <option value="gbk">GBK</option>
                <option value="gb2312">GB2312</option>
              </select>
            </div>

            {/* 自动转换 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="auto-convert"
                checked={settings.autoConvert}
                onChange={(e) => handleSettingChange('autoConvert', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-200 rounded focus:ring-blue-500 dark:border-gray-700"
              />
              <label htmlFor="auto-convert" className="ml-2 block text-sm text-gray-700">
                自动转换（上传后立即处理）
              </label>
            </div>

            {/* 头部行 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="header-row"
                checked={settings.headerRow}
                onChange={(e) => handleSettingChange('headerRow', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-200 rounded focus:ring-blue-500 dark:border-gray-700"
              />
              <label htmlFor="header-row" className="ml-2 block text-sm text-gray-700">
                第一行为标题行
              </label>
            </div>

            {/* 跳过空行 */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="skip-empty"
                checked={settings.skipEmptyLines}
                onChange={(e) => handleSettingChange('skipEmptyLines', e.target.checked)}
                className="h-4 w-4 text-blue-600 border-gray-200 rounded focus:ring-blue-500 dark:border-gray-700"
              />
              <label htmlFor="skip-empty" className="ml-2 block text-sm text-gray-700">
                跳过空行
              </label>
            </div>
          </div>

          {/* 高级选项提示 */}
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-md text-sm text-yellow-700">
            <p>提示：调整设置后需要点击「应用设置」按钮使配置生效。</p>
          </div>

          {/* 应用按钮 */}
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleApplySettings}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <FileText className="h-4 w-4 mr-2" />
              应用设置
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BatchSettings;

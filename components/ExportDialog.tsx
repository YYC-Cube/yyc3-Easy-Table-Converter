/**
 * @file 导出对话框组件
 * @description 提供表格数据导出的用户交互界面
 * @module ExportDialog
 * @author YYC
 * @version 1.0.0
 * @created 2024-01-01
 * @updated 2024-01-01
 */
import React, { useState } from 'react';
import {  
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger
} from '@radix-ui/react-dialog';
import { RadioGroup, RadioGroupItem } from '@radix-ui/react-radio-group';
import { Checkbox } from '@radix-ui/react-checkbox';
import { Input } from './ui/input';
import { Label } from '@radix-ui/react-label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Button } from './ui/button';
import { 
  FileDown, 
  FileText, 
  FileSpreadsheet, 
  HelpCircle, 
  AlertCircle
} from 'lucide-react';
import { ExportFormat, ExportOptions } from '../lib/exportUtils';

interface ExportDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onExport: (format: ExportFormat, options: ExportOptions) => void;
  tableDataLength: number;
  maxExportRows?: number;
}

/**
 * 导出对话框组件
 */
export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onOpenChange,
  onExport,
  tableDataLength,
  maxExportRows = 10000,
}) => {
  // 导出选项状态
  const [format, setFormat] = useState<ExportFormat>('excel');
  const [fileName, setFileName] = useState('table_data');
  const [includeHeaders, setIncludeHeaders] = useState(true);
  const [sheetName, setSheetName] = useState('Sheet1');
  const [exportAllRows, setExportAllRows] = useState(true);
  const [rowLimit, setRowLimit] = useState(1000);

  // 是否超出导出限制
  const isOverLimit = tableDataLength > maxExportRows;
  const actualExportCount = exportAllRows && !isOverLimit ? tableDataLength : Math.min(rowLimit, tableDataLength, maxExportRows);

  // 处理导出确认
  const handleExport = () => {
    const options: ExportOptions = {
      fileName,
      includeHeaders,
    };

    // 只有Excel格式需要sheetName
    if (format === 'excel') {
      options.sheetName = sheetName;
    }

    onExport(format, options);
    onOpenChange(false);
  };

  // 重置表单
  const resetForm = () => {
    setFormat('excel');
    setFileName('table_data');
    setIncludeHeaders(true);
    setSheetName('Sheet1');
    setExportAllRows(true);
    setRowLimit(1000);
  };

  // 处理对话框关闭
  const handleClose = () => {
    resetForm();
    onOpenChange(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogTrigger asChild>
        <Button variant="default" size="icon" className="gap-2">
          <FileDown className="h-4 w-4" />
          <span className="hidden sm:inline">导出</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <div className="mb-4">
          <DialogTitle className="flex items-center gap-2">
            <FileDown className="h-5 w-5" />
            导出数据
          </DialogTitle>
        </div>

        {/* 导出格式选择 */}
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <h3 className="text-sm font-medium">导出格式</h3>
            <RadioGroup value={format} onValueChange={(value) => setFormat(value as ExportFormat)}>
              <div className="grid grid-cols-3 gap-4">
                <div className="relative">
                  <RadioGroupItem value="excel" id="excel" className="absolute top-4 left-4" />
                  <Label 
                    htmlFor="excel" 
                    className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <FileSpreadsheet className="h-10 w-10 text-green-600 mb-2" />
                    <span className="text-sm">Excel</span>
                  </Label>
                </div>
                
                <div className="relative">
                  <RadioGroupItem value="csv" id="csv" className="absolute top-4 left-4" />
                  <Label 
                    htmlFor="csv" 
                    className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <FileSpreadsheet className="h-10 w-10 text-blue-600 mb-2" />
                    <span className="text-sm">CSV</span>
                  </Label>
                </div>
                
                <div className="relative">
                  <RadioGroupItem value="pdf" id="pdf" className="absolute top-4 left-4" />
                  <Label 
                    htmlFor="pdf" 
                    className="flex flex-col items-center justify-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    <FileText className="h-10 w-10 text-red-600 mb-2" />
                    <span className="text-sm">PDF</span>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>

          {/* 文件命名 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">文件名</h3>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <HelpCircle className="h-4 w-4 text-gray-400 hover:text-gray-600 cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="text-xs max-w-xs">
                      设置导出文件的名称，不需要包含扩展名
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <Input
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="table_data"
              maxLength={50}
            />
          </div>

          {/* Excel特有选项 */}
          {format === 'excel' && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">工作表名称</h3>
              <Input
                value={sheetName}
                onChange={(e) => setSheetName(e.target.value)}
                placeholder="Sheet1"
                maxLength={31} // Excel工作表名称最大长度
              />
            </div>
          )}

          {/* 包含表头选项 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="includeHeaders"
              checked={includeHeaders}
              onCheckedChange={(checked) => setIncludeHeaders(checked as boolean)}
            />
            <Label htmlFor="includeHeaders">包含表头</Label>
          </div>

          {/* 导出行数选项 */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">导出行数</h3>
              {isOverLimit && (
                <div className="flex items-center text-red-600 text-xs">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  数据量较大
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="exportAllRows"
                checked={exportAllRows}
                onCheckedChange={(checked) => setExportAllRows(checked as boolean)}
                disabled={isOverLimit}
              />
              <Label htmlFor="exportAllRows" className={isOverLimit ? "text-gray-400" : ""}>
                导出全部 {tableDataLength} 行
                {isOverLimit && (
                  <span className="text-red-600 text-xs ml-2">
                    (超过限制，将被截断)
                  </span>
                )}
              </Label>
            </div>
            
            {!exportAllRows && (
              <div className="ml-6 mt-2">
                <Input
                  type="number"
                  min="1"
                  max={Math.min(maxExportRows, tableDataLength)}
                  value={rowLimit}
                  onChange={(e) => setRowLimit(Math.max(1, Math.min(Number(e.target.value) || 1, maxExportRows, tableDataLength)))}
                  placeholder="输入行数"
                  className="w-32"
                />
                <span className="text-sm text-gray-500 ml-2">行</span>
              </div>
            )}
            
            <div className="text-xs text-gray-500 mt-1">
              实际导出行数: {actualExportCount} 行
              {isOverLimit && exportAllRows && (
                <span className="text-red-600"> (已截断至 {maxExportRows} 行限制)</span>
              )}
            </div>
          </div>
        </div>

        <div className="flex sm:justify-between mt-4">
          <Button variant="ghost" onClick={handleClose}>
            取消
          </Button>
          <Button 
            onClick={handleExport}
            disabled={!fileName.trim() || actualExportCount === 0}
          >
            确认导出
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;
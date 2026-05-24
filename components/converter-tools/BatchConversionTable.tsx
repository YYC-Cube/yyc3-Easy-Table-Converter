/**
 * @file 批量转换表格组件
 * @description 提供多值同时转换的表格界面
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-21
 */

import React, { useState } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { PlusCircle, Trash2, Copy, CheckCircle2, Download } from 'lucide-react';

interface BatchItem {
  id: string;
  value: string;
  result: string;
  error?: string;
}

interface BatchConversionTableProps {
  sourceUnit: string;
  targetUnit: string;
  convertFunction: (value: string) => string | { result: string; error?: string };
  precision?: number;
  className?: string;
}

/**
 * 批量转换表格组件
 * 支持添加多行、批量转换、复制结果
 */
export const BatchConversionTable: React.FC<BatchConversionTableProps> = ({
  sourceUnit,
  targetUnit,
  convertFunction,
  precision: _precision = 2,
  className = '',
}) => {
  const [items, setItems] = useState<BatchItem[]>([{ id: Date.now().toString(), value: '', result: '' }]);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 处理数值变化和转换
  const handleValueChange = (id: string, value: string) => {
    setItems(prevItems =>
      prevItems.map(item => {
        if (item.id === id) {
          let result = '';
          let errorMsg: string | undefined;
          
          if (value.trim()) {
            try {
              const conversionResult = convertFunction(value);
              
              if (typeof conversionResult === 'string') {
                result = conversionResult;
              } else {
                result = conversionResult.result;
                errorMsg = conversionResult.error;
              }
            } catch (err) {
              result = '';
              errorMsg = '转换错误';
            }
          }
          
          const updatedItem: BatchItem = { 
            ...item, 
            value, 
            result 
          };
          if (errorMsg) {
            updatedItem.error = errorMsg;
          } else {
            delete updatedItem.error;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };

  // 添加新行
  const addRow = () => {
    setItems(prevItems => [...prevItems, { id: Date.now().toString(), value: '', result: '' }]);
    setError(null);
  };

  // 删除行
  const removeRow = (id: string) => {
    if (items.length <= 1) {
      setError('至少需要保留一行数据');
      setTimeout(() => setError(null), 3000);
      return;
    }
    
    setItems(prevItems => prevItems.filter(item => item.id !== id));
    setError(null);
  };

  // 复制所有结果
  const copyAllResults = async () => {
    try {
      const resultsText = items
        .filter(item => item.result)
        .map(item => `${item.value} ${sourceUnit} = ${item.result} ${targetUnit}`)
        .join('\n');
      
      if (resultsText) {
        await navigator.clipboard.writeText(resultsText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  // 下载结果
  const downloadResults = () => {
    const resultsText = items
      .filter(item => item.result)
      .map(item => `${item.value} ${sourceUnit} = ${item.result} ${targetUnit}`)
      .join('\n');
    
    if (resultsText) {
      const blob = new Blob([resultsText], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `batch-conversion-${sourceUnit}-to-${targetUnit}-${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  return (
    <div className={`flex flex-col gap-4 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-700">批量转换（{sourceUnit} → {targetUnit}）</h3>
        <div className="flex gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyAllResults}
                  disabled={!items.some(item => item.result)}
                  className="flex items-center gap-1"
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                      已复制
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      复制全部
                    </>
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>复制所有转换结果</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={downloadResults}
                  disabled={!items.some(item => item.result)}
                  className="flex items-center gap-1"
                >
                  <Download className="h-4 w-4" />
                  下载
                </Button>
              </TooltipTrigger>
              <TooltipContent>下载转换结果文本文件</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>
      
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[150px]">输入值 ({sourceUnit})</TableHead>
            <TableHead className="w-[150px]">转换结果 ({targetUnit})</TableHead>
            <TableHead className="w-[80px] text-right">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow 
              key={item.id}
              className={item.error ? 'bg-red-50 dark:bg-red-900/20' : ''}
            >
              <TableCell>
                <Input
                  type="text"
                  value={item.value}
                  onChange={(e) => handleValueChange(item.id, e.target.value)}
                  placeholder="输入数值"
                  className="font-mono"
                />
              </TableCell>
              <TableCell className="font-mono">
                {item.error ? (
                  <Badge variant="destructive" className="font-normal">
                    {item.error}
                  </Badge>
                ) : (
                  item.result || '-'
                )}
              </TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => removeRow(item.id)}
                  className="h-8 w-8 text-gray-500 hover:text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      <Button
        onClick={addRow}
        variant="ghost"
        className="flex items-center gap-1 self-start"
      >
        <PlusCircle className="h-4 w-4" />
        添加一行
      </Button>
    </div>
  );
};

export default BatchConversionTable;
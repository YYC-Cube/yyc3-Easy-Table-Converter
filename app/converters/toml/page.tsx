"use client"
/**
 * @file TOML/JSON转换页面
 * @description 提供TOML和JSON格式相互转换的界面和功能
 * @module app/converters/toml
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-15
 * @updated 2024-10-15
 */

'use client';

import { useState, useEffect } from 'react';
import { FileText, Download, Upload, Copy, RefreshCw, Settings, X, ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
// 移除未使用的Tabs导入
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
// 移除未使用的Select导入
import { useToast } from '@/hooks/use-toast';
// 移除未使用的toast导入
import { sampleTomlData } from '@/lib/constants/sampleData';
import { tomlToJson, jsonToToml } from '@/lib/converters/toml';
import { usePersistentState } from '@/hooks/useEnhancedStorage';

interface FormatOptions {
  indent: number;
  useSpaces: boolean;
  sortKeys: boolean;
}

const TomlConverter: React.FC = () => {
  // 状态管理
  const [tomlInput, setTomlInput] = useState(sampleTomlData);
  const [jsonOutput, setJsonOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [direction, setDirection] = useState<'toml-to-json' | 'json-to-toml'>('toml-to-json');
  const [formatOptions, setFormatOptions] = usePersistentState<FormatOptions>('toml-converter-options', {
    indent: 2,
    useSpaces: true,
    sortKeys: false,
  });
  const [error, setError] = useState<string | null>(null);

  const { toast: showToast } = useToast();

  // 执行转换
  const performConversion = () => {
    setIsConverting(true);
    setError(null);
    
    try {
      if (direction === 'toml-to-json') {
        const result = tomlToJson(tomlInput);
        const formattedJson = JSON.stringify(
          result,
          formatOptions.sortKeys ? Object.keys(result).sort() : null,
          formatOptions.useSpaces ? ' '.repeat(formatOptions.indent) : '\t'
        );
        setJsonOutput(formattedJson);
      } else {
        // 当从JSON转换到TOML时
        const formattedToml = jsonToToml(JSON.parse(jsonOutput));
        setTomlInput(formattedToml);
      }
      showToast({ variant: 'default', title: '转换成功' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '转换失败';
      setError(errorMessage);
      showToast({ variant: 'destructive', title: '转换失败', description: errorMessage });
    } finally {
      setIsConverting(false);
    }
  };

  // 初始转换
  useEffect(() => {
    performConversion();
  }, []);

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
      .then(() => {
        showToast({ variant: 'default', title: '已复制到剪贴板' });
      })
      .catch(() => {
        showToast({ variant: 'destructive', title: '复制失败' });
      });
  };

  // 下载文件
  const downloadFile = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast({ variant: 'default', title: '文件已下载' });
  };

  // 上传文件
  const handleFileUpload = (event: Event) => {
    const inputTarget = event.target as HTMLInputElement;
    const file = inputTarget.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (direction === 'toml-to-json') {
        setTomlInput(content);
        performConversion();
      } else {
        setJsonOutput(content);
        performConversion();
      }
    };
    reader.readAsText(file);
    inputTarget.value = '';
  };

  // 清空内容
  const clearContent = () => {
    if (direction === 'toml-to-json') {
      setTomlInput('');
      setJsonOutput('');
    } else {
      setJsonOutput('');
      setTomlInput('');
    }
    setError(null);
  };

  // 切换转换方向
  const toggleDirection = () => {
    setDirection(direction === 'toml-to-json' ? 'json-to-toml' : 'toml-to-json');
    setError(null);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <FileText className="h-6 w-6" />
            TOML/JSON 转换工具
          </CardTitle>
          <CardDescription>
            轻松在 TOML 和 JSON 格式之间进行相互转换
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {/* 转换方向和设置 */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={toggleDirection}
                className="flex items-center gap-1"
              >
                {direction === 'toml-to-json' ? (
                  <>
                    <ChevronRight className="h-4 w-4" />
                    切换为 JSON → TOML
                  </>
                ) : (
                  <>
                    <ChevronLeft className="h-4 w-4" />
                    切换为 TOML → JSON
                  </>
                )}
              </Button>
              
              <Button 
                variant="default" 
                size="sm" 
                onClick={clearContent}
                className="flex items-center gap-1"
              >
                <RefreshCw className="h-4 w-4" />
                清空
              </Button>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowSettings(!showSettings)}
                className="flex items-center gap-1"
              >
                <Settings className="h-4 w-4" />
                设置
              </Button>
            </div>
          </div>
          
          {/* 设置面板 */}
          {showSettings && (
            <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg mb-6 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-medium text-lg">格式设置</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="indent">缩进大小: {formatOptions.indent}</Label>
                  <Slider
                    id="indent"
                    min={1}
                    max={8}
                    step={1}
                    value={[formatOptions.indent]}
                    onValueChange={(value) => 
                      setFormatOptions({ ...formatOptions, indent: value[0] })
                    }
                    className="w-32"
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="use-spaces">使用空格而不是制表符</Label>
                  <Switch
                    id="use-spaces"
                    checked={formatOptions.useSpaces}
                    onCheckedChange={(checked) => 
                      setFormatOptions({ ...formatOptions, useSpaces: checked })
                    }
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label htmlFor="sort-keys">排序 JSON 键</Label>
                  <Switch
                    id="sort-keys"
                    checked={formatOptions.sortKeys}
                    onCheckedChange={(checked) => 
                      setFormatOptions({ ...formatOptions, sortKeys: checked })
                    }
                  />
                </div>
              </div>
            </div>
          )}
          
          {/* 错误消息 */}
          {error && (
            <div className="bg-red-50 text-red-500 p-3 rounded-lg mb-4 text-sm border border-red-200">
              {error}
            </div>
          )}
          
          {/* 输入和输出区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 输入区域 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="input">
                  {direction === 'toml-to-json' ? 'TOML 输入' : 'JSON 输入'}
                </Label>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      const input = direction === 'toml-to-json' ? tomlInput : jsonOutput;
                      copyToClipboard(input);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const input = direction === 'toml-to-json' ? tomlInput : jsonOutput;
                      const filename = direction === 'toml-to-json' ? 'input.toml' : 'input.json';
                      downloadFile(input, filename);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                  >
                    <Upload 
                      className="h-4 w-4" 
                      onClick={() => {
                        const fileInput = document.createElement('input');
                        fileInput.type = 'file';
                        fileInput.accept = direction === 'toml-to-json' ? '.toml' : '.json';
                        fileInput.onchange = handleFileUpload;
                        fileInput.click();
                      }}
                    />
                  </Button>
                </div>
              </div>
              
              <Textarea
                id="input"
                value={direction === 'toml-to-json' ? tomlInput : jsonOutput}
                onChange={(e) => {
                  if (direction === 'toml-to-json') {
                    setTomlInput(e.target.value);
                  } else {
                    setJsonOutput(e.target.value);
                  }
                }}
                placeholder={direction === 'toml-to-json' ? '在此输入 TOML 内容...' : '在此输入 JSON 内容...'}
                className="min-h-[300px] font-mono text-sm resize-none"
              />
            </div>
            
            {/* 输出区域 */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label htmlFor="output">
                  {direction === 'toml-to-json' ? 'JSON 输出' : 'TOML 输出'}
                </Label>
                <div className="flex items-center gap-1">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => {
                      const output = direction === 'toml-to-json' ? jsonOutput : tomlInput;
                      copyToClipboard(output);
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => {
                      const output = direction === 'toml-to-json' ? jsonOutput : tomlInput;
                      const filename = direction === 'toml-to-json' ? 'output.json' : 'output.toml';
                      downloadFile(output, filename);
                    }}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              <Textarea
                id="output"
                value={direction === 'toml-to-json' ? jsonOutput : tomlInput}
                readOnly
                placeholder={direction === 'toml-to-json' ? 'JSON 输出将显示在这里...' : 'TOML 输出将显示在这里...'}
                className="min-h-[300px] font-mono text-sm resize-none bg-gray-50 dark:bg-gray-900"
              />
            </div>
          </div>
          
          {/* 转换按钮 */}
          <div className="mt-6 flex justify-center">
            <Button 
              size="lg" 
              onClick={performConversion}
              disabled={isConverting}
              className="min-w-[200px]"
            >
              {isConverting ? '转换中...' : '执行转换'}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      {/* 使用说明 */}
      <div className="mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xl">使用说明</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2 text-sm">
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>在左侧输入框中输入 {direction === 'toml-to-json' ? 'TOML' : 'JSON'} 内容</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>点击"执行转换"按钮将内容转换为 {direction === 'toml-to-json' ? 'JSON' : 'TOML'} 格式</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>使用复制按钮将转换结果复制到剪贴板，或使用下载按钮保存为文件</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>使用上传按钮从本地文件导入内容</span>
              </li>
              <li className="flex items-start gap-2">
                <ChevronRight className="h-4 w-4 mt-0.5 text-gray-500 flex-shrink-0" />
                <span>通过设置面板自定义输出格式，如缩进大小、是否排序等</span>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TomlConverter;
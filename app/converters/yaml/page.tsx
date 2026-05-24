/**
 * @file YAML/JSON互转页面
 * @description 提供YAML与JSON格式之间的相互转换功能界面
 * @module app/converters/yaml/page
 * @author YYC
 * @version 1.0.0
 * @created 2025-10-26
 * @updated 2025-10-26
 */

'use client';
import React, { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { Copy, RotateCw, Download, Upload, FileText, Code, Settings, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { ScrollArea } from '@/components/ui/scroll-area';

import { yamlToJson, jsonToYaml, isValidYaml, isValidJson } from '@/lib/converters/yaml';
import { usePersistentState } from '@/hooks/useEnhancedStorage';
import { sampleYamlData } from '@/lib/constants/sampleData';

export default function YamlConverter() {
  // 状态管理
  const [input, setInput] = useState(sampleYamlData);
  const [output, setOutput] = useState('');
  const [direction, setDirection] = useState<'yaml-to-json' | 'json-to-yaml'>('yaml-to-json');
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  
  // 用户首选项 - 使用本地存储保存设置
  const [prettyPrint, setPrettyPrint] = usePersistentState<boolean>('yaml-converter-pretty-print', true);
  const [indentSize, setIndentSize] = usePersistentState<number>('yaml-converter-indent-size', 2);
  const [lineWidth, setLineWidth] = usePersistentState<number>('yaml-converter-line-width', -1);
  
  // Toast通知
  const { toast: toastFunction } = useToast();
  
  // 转换函数
  const handleConvert = useCallback(() => {
    setIsConverting(true);
    setError(null);
    
    try {
      let result: string;
      
      if (direction === 'yaml-to-json') {
        // 验证YAML
        const validation = isValidYaml(input);
        if (!validation.valid) {
          throw new Error(validation.error || 'YAML格式无效');
        }
        
        result = yamlToJson(input, {
          pretty: prettyPrint,
          indent: indentSize
        });
      } else {
        // 验证JSON
        const validation = isValidJson(input);
        if (!validation.valid) {
          throw new Error(validation.error || 'JSON格式无效');
        }
        
        result = jsonToYaml(input, {
          pretty: prettyPrint,
          indent: indentSize,
          lineWidth: lineWidth
        });
      }
      
      setOutput(result);
      
      toastFunction({ title: '转换成功', variant: 'default' });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : '转换失败';
      setError(errorMessage);
      toastFunction({ title: '转换失败', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsConverting(false);
    }
  }, [input, direction, prettyPrint, indentSize, lineWidth, toastFunction]);
  
  // 复制到剪贴板
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(output);
      toastFunction({ title: '已复制到剪贴板', variant: 'default' });
    } catch (err) {
      toastFunction({ title: '复制失败', variant: 'destructive' });
    }
  }, [output, toastFunction]);
  
  // 下载文件
  const handleDownload = useCallback(() => {
    if (!output) return;
    
    const filename = direction === 'yaml-to-json' ? 'converted.json' : 'converted.yaml';
    const blob = new Blob([output], { 
      type: direction === 'yaml-to-json' ? 'application/json' : 'text/yaml' 
    });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toastFunction({ title: `已下载 ${filename}`, variant: 'default' });
  }, [output, direction, toastFunction]);
  
  // 上传文件
  const handleUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setInput(content);
    };
    reader.readAsText(file);
    
    // 重置文件输入，以便可以重新上传同一个文件
    event.target.value = '';
  }, []);
  
  // 清除输入/输出
  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setError(null);
  }, []);
  
  // 切换转换方向
  const handleDirectionToggle = useCallback(() => {
    setDirection(prev => prev === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json');
    setInput(output);
    setOutput('');
    setError(null);
  }, [output]);
  
  return (
    <div className="min-h-screen bg-background p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* 页面标题 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">YAML/JSON 互转工具</h1>
            <p className="mt-1 text-muted-foreground">
              轻松在YAML和JSON格式之间进行转换，支持格式化和自定义设置
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={handleClear}
              className="gap-1"
            >
              <RotateCw size={16} />
              重置
            </Button>
            
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => setShowSettings(!showSettings)}
                  >
                    <Settings size={20} />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>设置</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
        
        {/* 设置面板 */}
        {showSettings && (
          <Card className="p-4 space-y-4">
            <h3 className="font-medium flex items-center gap-2">
              <Settings size={18} />
              转换设置
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="pretty-print">格式化输出</Label>
                  <Switch 
                    id="pretty-print" 
                    checked={prettyPrint} 
                    onCheckedChange={setPrettyPrint} 
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="indent-size">缩进大小: {indentSize} 空格</Label>
                <Slider 
                  id="indent-size"
                  min={1} 
                  max={8} 
                  step={1}
                  value={[indentSize]}
                  onValueChange={(value) => setIndentSize(value[0])}
                  disabled={!prettyPrint}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="line-width">
                  行宽限制: {lineWidth === -1 ? '无限制' : `${lineWidth} 字符`}
                </Label>
                <div className="flex gap-2 items-center">
                  <Slider 
                    id="line-width"
                    min={-1} 
                    max={200} 
                    step={10}
                    value={[lineWidth]}
                    onValueChange={(value) => setIndentSize(value[0])}
                    disabled={!prettyPrint}
                  />
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setLineWidth(-1)}
                  >
                    重置
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}
        
        {/* 转换方向选择 */}
        <div className="flex justify-center">
          <Tabs 
            value={direction} 
            onValueChange={(value: any) => setDirection(value)} 
            className="w-full max-w-md"
          >
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="yaml-to-json" className="data-[state=active]:bg-primary/20">
                <FileText size={16} className="mr-2" />
                YAML → JSON
              </TabsTrigger>
              <TabsTrigger value="json-to-yaml" className="data-[state=active]:bg-primary/20">
                <Code size={16} className="mr-2" />
                JSON → YAML
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* 转换区域 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 输入区域 */}
          <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">输入 ({direction === 'yaml-to-json' ? 'YAML' : 'JSON'})</h3>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setInput(direction === 'yaml-to-json' ? sampleYamlData : '')}
                      >
                        <RotateCw size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>使用示例数据</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <input
                  type="file"
                  id="file-upload"
                  accept={direction === 'yaml-to-json' ? '.yaml,.yml' : '.json'}
                  onChange={handleUpload}
                  className="hidden"
                />
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => document.getElementById('file-upload')?.click()}
                      >
                        <Upload size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>上传文件</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`请输入${direction === 'yaml-to-json' ? 'YAML' : 'JSON'}内容...`}
                className="min-h-[300px] resize-none p-4 focus-visible:ring-primary"
                spellCheck={false}
              />
            </ScrollArea>
          </Card>
          
          {/* 输出区域 */}
          <Card className="flex flex-col h-full">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="font-medium">输出 ({direction === 'yaml-to-json' ? 'JSON' : 'YAML'})</h3>
              <div className="flex items-center gap-2">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleCopy}
                        disabled={!output}
                      >
                        {output ? <CheckCircle2 size={16} /> : <Copy size={16} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>复制到剪贴板</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleDownload}
                        disabled={!output}
                      >
                        <Download size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>下载文件</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={handleDirectionToggle}
                        disabled={!output}
                      >
                        <RotateCw size={16} />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>反向转换</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
            <ScrollArea className="flex-1">
              <Textarea
                value={output}
                readOnly
                placeholder={`转换结果将显示在这里...`}
                className="min-h-[300px] resize-none p-4 bg-muted/40"
                spellCheck={false}
              />
            </ScrollArea>
          </Card>
        </div>
        
        {/* 错误信息 */}
        {error && (
          <Card className="border-destructive bg-destructive/10 text-destructive p-4">
            <div className="flex items-start gap-3">
              <span className="text-lg">⚠️</span>
              <div>
                <h4 className="font-medium">转换错误</h4>
                <p className="text-sm mt-1">{error}</p>
              </div>
            </div>
          </Card>
        )}
        
        {/* 转换按钮 */}
        <div className="flex justify-center mt-4">
          <Button 
            onClick={handleConvert} 
            disabled={!input || isConverting}
            className="w-full max-w-md gap-2"
          >
            {isConverting ? (
              <span className="animate-spin mr-2">⏳</span>
            ) : (
              <span>🔄</span>
            )}
            {isConverting ? '转换中...' : `转换 ${direction === 'yaml-to-json' ? 'YAML → JSON' : 'JSON → YAML'}`}
          </Button>
        </div>
        
        {/* 功能说明 */}
        <Card className="p-4">
          <h3 className="font-medium mb-2">功能说明</h3>
          <ul className="space-y-1 text-sm text-muted-foreground list-disc pl-5">
            <li>支持YAML和JSON格式的相互转换</li>
            <li>可自定义输出格式，包括缩进大小和行宽限制</li>
            <li>提供文件上传和下载功能</li>
            <li>支持一键复制和反向转换</li>
            <li>实时错误提示和友好的用户界面</li>
          </ul>
        </Card>
      </div>
    </div>
  );
}

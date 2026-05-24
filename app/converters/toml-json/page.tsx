"use client"
/**
 * @file TOML/JSON 互转工具页面
 * @description 实现TOML与JSON格式之间的相互转换，支持基本互转、格式化输出和配置示例
 * @module converters/toml-json
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-25
 * @updated 2024-10-25
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  RefreshCw, 
  Copy, 
  CheckCircle2, 
  Code, 
  Download,
  ArrowRightLeft,
  Settings
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// 导入专业TOML处理库
import * as toml from '@iarna/toml';

// 定义组件属性接口
interface TomlJsonConverterProps {
  // 可以添加未来扩展的属性
}

// 定义转换模式类型
type ConversionMode = 'toml-to-json' | 'json-to-toml';

/**
 * @description TOML/JSON 互转工具组件
 * @project Easy Table Converter
 */
const TomlJsonConverter: React.FC<TomlJsonConverterProps> = () => {
  // 状态定义
  const [inputValue, setInputValue] = useState<string>('');
  const [outputValue, setOutputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [conversionMode, setConversionMode] = useState<ConversionMode>('toml-to-json');
  const [showExamples, setShowExamples] = useState<boolean>(false);
  
  // 使用React.useRef来安全地存储和使用toast函数
  const toastRef = React.useRef<typeof toast | null>(null)
  const { toast } = useToast()
  
  React.useEffect(() => {
    toastRef.current = toast
  }, [toast])
  
  // 示例数据
  const tomlExample = `# 示例TOML配置

# 基本配置
name = "YYC³ Easy Table Converter"
version = "1.0.0"
enabled = true
maxSize = 10

# 嵌套配置
[database]
host = "localhost"
port = 5432
username = "admin"
password = "secret"

# 数组配置
features = ["数据转换", "AI增强", "批量处理"]

# 数值配置
limits = {
  maxFiles = 100
  maxSizeMB = 50
}`;

  const jsonExample = JSON.stringify({
    name: 'YYC³ Easy Table Converter',
    version: '1.0.0',
    enabled: true,
    maxSize: 10,
    database: {
      host: 'localhost',
      port: 5432,
      username: 'admin',
      password: 'secret'
    },
    features: ['数据转换', 'AI增强', '批量处理'],
    limits: {
      maxFiles: 100,
      maxSizeMB: 50
    }
  }, null, 2);

  // 初始化时设置示例数据
  useEffect(() => {
    setInputValue(conversionMode === 'toml-to-json' ? tomlExample : jsonExample);
  }, [conversionMode]);

  // 转换处理函数
  const handleConvert = () => {
    setError(null);
    setIsConverting(true);
    
    try {
      if (conversionMode === 'toml-to-json') {
        // TOML 转 JSON
        const jsonData = toml.parse(inputValue);
        setOutputValue(JSON.stringify(jsonData, null, 2));
      } else {
        // JSON 转 TOML
        const jsonData = JSON.parse(inputValue);
        setOutputValue(toml.stringify(jsonData));
      }
    } catch (err) {
      setError(`转换失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsConverting(false);
    }
  };

  // 复制结果到剪贴板
  const handleCopy = () => {
    // 确保在客户端环境中执行
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(outputValue)
        .then(() => {
          setCopySuccess(true);
          toastRef.current?.({
            title: '复制成功',
            description: '结果已复制到剪贴板',
            variant: 'default'
          });
          setTimeout(() => setCopySuccess(false), 2000);
        })
        .catch(() => {
          toastRef.current?.({
            title: '复制失败',
            description: '无法复制到剪贴板',
            variant: 'destructive'
          });
        });
    }
  };

  // 下载结果文件
  const handleDownload = () => {
    // 确保在客户端环境中执行
    if (typeof window !== 'undefined') {
      const blob = new Blob([outputValue], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = conversionMode === 'toml-to-json' ? 'converted.json' : 'converted.toml';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toastRef.current?.({
        title: '下载成功',
        description: `文件已保存为 ${a.download}`,
        variant: 'default'
      });
    }
  };

  // 清空输入和输出
  const handleClear = () => {
    setInputValue('');
    setOutputValue('');
    setError(null);
  };

  // 切换转换方向
  const handleSwitchDirection = () => {
    const newMode: ConversionMode = conversionMode === 'toml-to-json' ? 'json-to-toml' : 'toml-to-json';
    setConversionMode(newMode);
    setInputValue('');
    setOutputValue('');
    setError(null);
  };

  // 格式化输入内容
  const handleFormat = () => {
    try {
      if (conversionMode === 'toml-to-json') {
        // 尝试格式化TOML（通过转换为JSON再转回TOML）
        const jsonData = toml.parse(inputValue);
        const formattedToml = toml.stringify(jsonData);
        setInputValue(formattedToml);
        toastRef.current?.({
          title: '格式化成功',
          description: 'TOML已格式化',
          variant: 'default'
        });
      } else {
        // 格式化JSON
        const jsonData = JSON.parse(inputValue);
        setInputValue(JSON.stringify(jsonData, null, 2));
        toastRef.current?.({
          title: '格式化成功',
          description: 'JSON已格式化',
          variant: 'default'
        });
      }
    } catch (err) {
      toastRef.current?.({
        title: '格式化失败',
        description: `无法格式化: ${err instanceof Error ? err.message : '未知错误'}`,
        variant: 'destructive'
      });
    }
  };

  // 配置示例列表
  const configurationExamples = [
    {
      title: '应用配置文件',
      toml: `app_name = "MyAwesomeApp"
version = "1.2.3"

[server]
host = "0.0.0.0"
port = 3000

[database]
url = "postgres://user:pass@localhost:5432/mydb"
max_connections = 10

[logging]
enabled = true
level = "info"
file = "/var/log/myapp.log"`
    },
    {
      title: '项目依赖配置',
      toml: `[package]
name = "my-project"
version = "0.1.0"
description = "My awesome project"

[dependencies]
react = "^18.0.0"
next = "^14.0.0"
tailwindcss = "^3.0.0"

[dev-dependencies]
typescript = "^5.0.0"
jest = "^29.0.0"`
    },
    {
      title: '环境变量配置',
      toml: `[development]
api_url = "http://localhost:8000/api"
debug = true

[production]
api_url = "https://api.myapp.com"
debug = false

[test]
api_url = "https://test-api.myapp.com"
debug = true`
    }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6" />
            TOML/JSON 互转
          </CardTitle>
          <CardDescription>
            支持 TOML 与 JSON 格式之间的相互转换，提供格式化输出和配置示例
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <Tabs value={conversionMode} onValueChange={(v) => setConversionMode(v as ConversionMode)}>
              <TabsList className="grid w-full md:w-auto grid-cols-2">
                <TabsTrigger value="toml-to-json">TOML → JSON</TabsTrigger>
                <TabsTrigger value="json-to-toml">JSON → TOML</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={handleSwitchDirection}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                切换方向
              </Button>
              
              <Button variant="secondary" size="sm" onClick={() => setShowExamples(!showExamples)}>
                <Settings className="h-4 w-4 mr-2" />
                {showExamples ? '隐藏配置示例' : '配置示例'}
              </Button>
            </div>
          </div>

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* 配置示例面板 */}
          {showExamples && (
            <div className="bg-muted/50 border rounded-lg p-4 mb-4">
              <h3 className="font-medium mb-3 flex items-center">
                <Code className="h-4 w-4 mr-2" />
                TOML 配置示例
              </h3>
              <div className="space-y-3">
                {configurationExamples.map((example, index) => (
                  <div key={index} className="border rounded p-3 bg-background">
                    <p className="text-sm font-medium mb-2">{example.title}</p>
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => {
                        setInputValue(example.toml);
                        setConversionMode('toml-to-json');
                      }}
                    >
                      使用此示例
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 输入区域 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">输入 ({conversionMode.startsWith('toml') ? 'TOML' : 'JSON'})</h3>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={handleFormat} disabled={!inputValue.trim()}>
                    格式化
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleClear}>
                    清空
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-64 border rounded-md">
                <Textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="min-h-[256px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  placeholder={`输入 ${conversionMode.startsWith('toml') ? 'TOML' : 'JSON'} 数据...`}
                />
              </ScrollArea>
            </div>

            {/* 输出区域 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">输出 ({conversionMode.startsWith('toml') ? 'JSON' : 'TOML'})</h3>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleCopy} 
                    disabled={!outputValue.trim()}
                  >
                    {copySuccess ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        已复制
                      </>
                    ) : (
                      <>
                        <Copy className="h-4 w-4 mr-2" />
                        复制
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm" 
                    onClick={handleDownload} 
                    disabled={!outputValue.trim()}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    下载
                  </Button>
                </div>
              </div>
              <ScrollArea className="h-64 border rounded-md bg-muted/50">
                <Textarea
                  value={outputValue}
                  readOnly
                  className="min-h-[256px] resize-none focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
                />
              </ScrollArea>
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-center">
          <Button 
            size="lg" 
            onClick={handleConvert} 
            disabled={!inputValue.trim() || isConverting}
            className="w-full max-w-md"
          >
            {isConverting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                转换中...
              </>
            ) : (
              <>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                执行转换
              </>
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* 使用说明 */}
      <div className="mt-8 bg-info/10 border border-info/20 rounded-lg p-4">
        <h3 className="font-medium text-info mb-2">使用说明</h3>
        <ul className="list-disc pl-5 text-sm space-y-1 text-info/80">
          <li>支持 TOML 和 JSON 格式的双向转换</li>
          <li>TOML 是一种配置文件格式，设计用于易于阅读和编写</li>
          <li>提供常用配置文件示例，可直接使用</li>
          <li>转换后的结果自动格式化，便于阅读</li>
          <li>可以直接复制结果或下载为文件</li>
        </ul>
      </div>
    </div>
  );
};

export default TomlJsonConverter;

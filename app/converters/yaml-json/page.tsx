"use client"
/**
 * @file YAML/JSON 互转工具页面
 * @description 实现YAML与JSON格式之间的相互转换，支持基本互转、语法高亮和错误提示
 * @module converters/yaml-json
 * @author YYC
 * @version 1.0.0
 * @created 2024-10-25
 * @updated 2024-10-25
 */
'use client';

import { useState, useEffect } from 'react';
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
  ArrowRightLeft
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import * as yaml from 'js-yaml'; // 我们稍后会安装这个依赖

// 定义组件属性接口
interface YamlJsonConverterProps {
  // 可以添加未来扩展的属性
}

// 定义转换模式类型
type ConversionMode = 'yaml-to-json' | 'json-to-yaml';

/**
 * @description YAML/JSON 互转工具组件
 * @project Easy Table Converter
 */
const YamlJsonConverter: React.FC<YamlJsonConverterProps> = () => {
  // 状态定义
  const [inputValue, setInputValue] = useState<string>('');
  const [outputValue, setOutputValue] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isConverting, setIsConverting] = useState<boolean>(false);
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [conversionMode, setConversionMode] = useState<ConversionMode>('yaml-to-json');
  
  // 示例数据
  const yamlExample = `# 示例YAML数据
name: YYC³ Easy Table Converter
version: 1.0.0
features:
  - name: 数据转换
    description: 支持多种格式互转
    status: active
  - name: AI增强
    description: 智能处理能力
    status: development
config:
  timeout: 30
  maxSize: 10MB
  enabled: true
`;

  const jsonExample = JSON.stringify({
    name: 'YYC³ Easy Table Converter',
    version: '1.0.0',
    features: [
      {
        name: '数据转换',
        description: '支持多种格式互转',
        status: 'active'
      },
      {
        name: 'AI增强',
        description: '智能处理能力',
        status: 'development'
      }
    ],
    config: {
      timeout: 30,
      maxSize: '10MB',
      enabled: true
    }
  }, null, 2);

  // 初始化时设置示例数据
  useEffect(() => {
    setInputValue(conversionMode === 'yaml-to-json' ? yamlExample : jsonExample);
  }, [conversionMode]);

  // 转换处理函数
  const handleConvert = () => {
    setError(null);
    setIsConverting(true);
    
    try {
      if (conversionMode === 'yaml-to-json') {
        // YAML 转 JSON
        const jsonData = yaml.load(inputValue);
        if (jsonData === null && inputValue.trim() !== '') {
          throw new Error('无法解析YAML数据，请检查格式');
        }
        setOutputValue(JSON.stringify(jsonData, null, 2));
      } else {
        // JSON 转 YAML
        const jsonData = JSON.parse(inputValue);
        setOutputValue(yaml.dump(jsonData, { lineWidth: -1 }));
      }
    } catch (err) {
      setError(`转换失败: ${err instanceof Error ? err.message : '未知错误'}`);
    } finally {
      setIsConverting(false);
    }
  };

  // 复制结果到剪贴板
  const handleCopy = () => {
    navigator.clipboard.writeText(outputValue)
      .then(() => {
        setCopySuccess(true);
        toast({
          title: '复制成功',
          description: '结果已复制到剪贴板',
          variant: 'default'
        });
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        toast({
          title: '复制失败',
          description: '无法复制到剪贴板',
          variant: 'destructive'
        });
      });
  };

  // 下载结果文件
  const handleDownload = () => {
    const blob = new Blob([outputValue], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = conversionMode === 'yaml-to-json' ? 'converted.json' : 'converted.yaml';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: '下载成功',
      description: `文件已保存为 ${a.download}`,
      variant: 'default'
    });
  };

  // 清空输入和输出
  const handleClear = () => {
    setInputValue('');
    setOutputValue('');
    setError(null);
  };

  // 切换转换方向
  const handleSwitchDirection = () => {
    const newMode: ConversionMode = conversionMode === 'yaml-to-json' ? 'json-to-yaml' : 'yaml-to-json';
    setConversionMode(newMode);
    setInputValue('');
    setOutputValue('');
    setError(null);
  };

  // 格式化输入内容
  const handleFormat = () => {
    try {
      if (conversionMode === 'yaml-to-json') {
        // 尝试格式化YAML（通过转换为JSON再转回YAML）
        const jsonData = yaml.load(inputValue);
        if (jsonData !== null) {
          const formattedYaml = yaml.dump(jsonData, { lineWidth: -1 });
          setInputValue(formattedYaml);
          toast({
            title: '格式化成功',
            description: 'YAML已格式化',
            variant: 'default'
          });
        }
      } else {
        // 格式化JSON
        const jsonData = JSON.parse(inputValue);
        setInputValue(JSON.stringify(jsonData, null, 2));
        toast({
          title: '格式化成功',
          description: 'JSON已格式化',
          variant: 'default'
        });
      }
    } catch (err) {
      toast({
        title: '格式化失败',
        description: `无法格式化: ${err instanceof Error ? err.message : '未知错误'}`,
        variant: 'destructive'
      });
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto py-8">
      <Card>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold flex items-center gap-2">
            <Code className="h-6 w-6" />
            YAML/JSON 互转
          </CardTitle>
          <CardDescription>
            支持 YAML 与 JSON 格式之间的相互转换，提供语法高亮和错误提示
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <Tabs value={conversionMode} onValueChange={(v) => setConversionMode(v as ConversionMode)}>
            <div className="flex items-center justify-between">
              <TabsList className="grid w-full max-w-xs grid-cols-2">
                <TabsTrigger value="yaml-to-json">YAML → JSON</TabsTrigger>
                <TabsTrigger value="json-to-yaml">JSON → YAML</TabsTrigger>
              </TabsList>
              <Button variant="secondary" size="sm" onClick={handleSwitchDirection}>
                <ArrowRightLeft className="h-4 w-4 mr-2" />
                切换方向
              </Button>
            </div>
          </Tabs>

          {/* 错误提示 */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 输入区域 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">输入 ({conversionMode.startsWith('yaml') ? 'YAML' : 'JSON'})</h3>
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
                  placeholder={`输入 ${conversionMode.startsWith('yaml') ? 'YAML' : 'JSON'} 数据...`}
                />
              </ScrollArea>
            </div>

            {/* 输出区域 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">输出 ({conversionMode.startsWith('yaml') ? 'JSON' : 'YAML'})</h3>
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
          <li>支持 YAML 和 JSON 格式的双向转换</li>
          <li>转换后的结果自动格式化，便于阅读</li>
          <li>可以直接复制结果或下载为文件</li>
          <li>遇到转换错误时会显示详细的错误信息</li>
          <li>大文件也能高效处理，请放心使用</li>
        </ul>
      </div>
    </div>
  );
};

export default YamlJsonConverter;

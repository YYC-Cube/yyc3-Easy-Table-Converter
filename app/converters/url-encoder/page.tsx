"use client"

import React, { useState } from 'react';
import { InputPanel } from '@/components/InputPanel';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';

export default function UrlEncoder() {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [encoding, setEncoding] = useState('encodeURIComponent');
  const [error, setError] = useState<string | null>(null);

  const encodingStandards = [
    { value: 'encodeURIComponent', label: 'encodeURIComponent (标准)' },
    { value: 'encodeURI', label: 'encodeURI (保留URL特殊字符)' },
    { value: 'escape', label: 'escape (传统)' },
    { value: 'decodeURIComponent', label: 'decodeURIComponent (解码)' },
    { value: 'decodeURI', label: 'decodeURI (解码)' },
    { value: 'unescape', label: 'unescape (传统解码)' },
  ];

  const handleConvert = () => {
    if (!inputText.trim()) {
      setOutputText('');
      setError(null);
      return;
    }

    try {
      setError(null);
      let result = '';

      // 批量处理逻辑：按行分割并处理每行
      const lines = inputText.split('\n');
      const processedLines = lines.map(line => {
        try {
          switch (encoding) {
            case 'encodeURIComponent':
              return encodeURIComponent(line);
            case 'encodeURI':
              return encodeURI(line);
            case 'escape':
              // @ts-ignore
              return escape(line);
            case 'decodeURIComponent':
              return decodeURIComponent(line);
            case 'decodeURI':
              return decodeURI(line);
            case 'unescape':
              // @ts-ignore
              return unescape(line);
            default:
              return line;
          }
        } catch (err) {
          // 错误检测：标记处理失败的行
          return `[错误] ${line} - ${(err as Error).message}`;
        }
      });

      result = processedLines.join('\n');
      setOutputText(result);
    } catch (err) {
      setError(`处理失败: ${(err as Error).message}`);
      setOutputText('');
    }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setError(null);
  };

  const handleSwap = () => {
    setInputText(outputText);
    setOutputText('');
    
    // 自动切换编码/解码模式
    if (encoding.startsWith('encode')) {
      const decodeVersion = encoding.replace('encode', 'decode');
      const matchingDecode = encodingStandards.find(standard => standard.value === decodeVersion);
      if (matchingDecode) {
        setEncoding(matchingDecode.value);
      }
    } else if (encoding.startsWith('decode')) {
      const encodeVersion = encoding.replace('decode', 'encode');
      const matchingEncode = encodingStandards.find(standard => standard.value === encodeVersion);
      if (matchingEncode) {
        setEncoding(matchingEncode.value);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">URL 编码/解码</h1>
        <p className="text-gray-500 dark:text-gray-400">
          支持多种URL编码标准，可进行批量处理并具备错误检测功能
        </p>
      </div>

      <div className="space-y-4">
        <Tabs defaultValue="single" className="w-full">
          <TabsList>
            <TabsTrigger value="single">单条处理</TabsTrigger>
            <TabsTrigger value="batch">批量处理</TabsTrigger>
          </TabsList>
          
          <TabsContent value="single" className="mt-4">
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-col space-y-2">
                <label htmlFor="encoding" className="text-sm font-medium">
                  编码标准
                </label>
                <Select value={encoding} onValueChange={setEncoding}>
                  <SelectTrigger id="encoding">
                    <SelectValue placeholder="选择编码标准" />
                  </SelectTrigger>
                  <SelectContent>
                    {encodingStandards.map(standard => (
                      <SelectItem key={standard.value} value={standard.value}>
                        {standard.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="mt-4">
            <Alert className="bg-blue-50 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300 border-blue-200 dark:border-blue-800">
              <AlertDescription>
                批量处理模式：每行视为一个独立的URL字符串进行处理。错误检测会标记处理失败的行。
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InputPanel
          selectedFormat="text"
          setSelectedFormat={() => {}}
          inputData={inputText}
          onInputChange={setInputText}
          onSampleData={() => {}}
          onClear={() => setInputText('')}
          onFileUpload={() => {}}
        />

        <div className="space-y-4">
          <div className="flex justify-center">
            <div className="flex flex-col gap-2">
              <Button
                onClick={handleConvert}
                className="min-w-[100px]"
              >
                {encoding.startsWith('encode') ? "编码" : "解码"}
              </Button>
              <Button
                onClick={handleSwap}
                variant="secondary"
                className="min-w-[100px]"
              >
                交换
              </Button>
              <Button
                onClick={handleClear}
                variant="secondary"
                className="min-w-[100px]"
              >
                清空
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              {encoding.startsWith('encode') ? "编码结果" : "解码结果"}
            </label>
            <textarea
              value={outputText}
              readOnly
              className="min-h-[200px] font-mono text-sm bg-gray-50 border border-gray-200 rounded-lg resize-none p-3 w-full"
            />
          </div>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">使用说明</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>encodeURIComponent：编码所有特殊字符，适合编码URL参数</li>
          <li>encodeURI：保留URL特殊字符（如 / ? & =），适合编码整个URL</li>
          <li>decodeURIComponent/decodeURI：对应的解码功能</li>
          <li>批量处理时，每行视为一个独立的字符串</li>
          <li>错误检测会显示无法处理的内容和错误原因</li>
        </ul>
      </div>
    </div>
  );
}

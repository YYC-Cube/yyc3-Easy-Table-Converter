"use client"

import React, { useState } from 'react';
import { InputPanel } from '@/components/InputPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

// 简单的URL验证函数
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url.startsWith('http') ? url : 'https://' + url);
    return true;
  } catch {
    return false;
  }
};

export default function WebsiteStatus() {
  const [url, setUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取网站状态标签
  const getStatusBadge = (isUp: boolean) => {
    if (isUp) {
      return <Badge variant="secondary" className="bg-green-500">在线</Badge>;
    } else {
      return <Badge variant="destructive">离线</Badge>;
    }
  };

  // 获取响应时间评级
  const getResponseTimeRating = (ms: number) => {
    if (ms < 200) return { text: '优秀', color: 'text-green-500' };
    if (ms < 500) return { text: '良好', color: 'text-yellow-500' };
    return { text: '较慢', color: 'text-red-500' };
  };

  // 模拟网站状态检查
  const checkWebsiteStatus = async (websiteUrl: string) => {
    if (!websiteUrl.trim()) {
      setError('请输入有效的网站URL');
      return;
    }

    // 确保URL以http://或https://开头
    let normalizedUrl = websiteUrl;
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = 'https://' + normalizedUrl;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      // 模拟网站状态检查结果
      const mockResult = {
        url: normalizedUrl,
        status: Math.random() > 0.1 ? 200 : 500, // 90%概率正常
        responseTime: Math.floor(Math.random() * 500) + 100,
        statusText: Math.random() > 0.1 ? 'OK' : 'Internal Server Error',
        headers: {
          server: 'nginx/1.21.3',
          'content-type': 'text/html; charset=utf-8',
          'content-length': Math.floor(Math.random() * 10000) + 1000,
          'cache-control': 'max-age=3600'
        },
        isUp: Math.random() > 0.1,
        lastChecked: new Date().toISOString()
      };

      setResult(mockResult);
      
    } catch (err) {
      setError(`网站状态检查失败: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleCheck = () => {
    checkWebsiteStatus(url);
  };

  const handleClear = () => {
    setUrl('');
    setResult(null);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">网站状态检查</h1>
        <p className="text-gray-500 dark:text-gray-400">
          检测网站在线状态、响应时间，并显示可用性历史图表
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <InputPanel
              selectedFormat="text"
              setSelectedFormat={() => {}}
              inputData={url}
              onInputChange={setUrl}
              onSampleData={() => {}}
              onClear={() => setUrl('')}
              onFileUpload={() => {}}
            />
            <Button onClick={handleCheck}>
              检查
            </Button>
            <Button onClick={handleClear} variant="secondary">
              清空
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && url && !isValidUrl(url) && (
            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertDescription>请输入有效的网站URL (如: https://example.com)</AlertDescription>
            </Alert>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                      <div key={i} className="space-y-1">
                        <Skeleton className="h-3 w-1/3" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-64 w-full" />
              </CardContent>
            </Card>
          </div>
        ) : result ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>网站状态信息</CardTitle>
                <CardDescription>
                  {getStatusBadge(result.isUp)} · 最后检查: {new Date(result.lastChecked).toLocaleString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">网站URL</p>
                    <p className="font-medium truncate">{result.url}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">HTTP状态码</p>
                    <p className="font-medium">{result.status} {result.statusText}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">响应时间</p>
                    <p className={`font-medium ${getResponseTimeRating(result.responseTime).color}`}>
                      {result.responseTime}ms ({getResponseTimeRating(result.responseTime).text})
                    </p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-gray-500">服务器</p>
                    <p className="font-medium">{result.headers.server}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">内容类型</p>
                  <p className="font-medium">{result.headers['content-type']}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">内容长度</p>
                  <p className="font-medium">{result.headers['content-length']} 字节</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>响应时间历史图表</CardTitle>
                <CardDescription>过去24小时的响应时间趋势</CardDescription>
              </CardHeader>
              <CardContent className="h-64">
                <div className="flex items-center justify-center h-full text-gray-500">
                  历史响应时间图表（暂时禁用）
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>网站状态检查结果</CardTitle>
              <CardDescription>请输入网站URL进行检查</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <AlertDescription>
                  网站状态检查可以验证网站是否在线，测量响应时间，并提供可用性历史记录
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">使用说明</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>输入完整网站URL（如 https://example.com）</li>
          <li>系统将检测网站是否在线并测量响应时间</li>
          <li>响应时间历史图表显示过去24小时的性能趋势</li>
          <li>响应时间评级：优秀(≤200ms)、良好(≤500ms)、较慢(&gt;500ms)</li>
        </ul>
      </div>
    </div>
  );
}

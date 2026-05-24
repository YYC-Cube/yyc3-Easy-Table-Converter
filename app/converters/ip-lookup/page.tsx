"use client"

import React, { useState, useEffect } from 'react';
import { InputPanel } from '@/components/InputPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';

export default function IpLookup() {
  const [ipAddress, setIpAddress] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mapUrl, setMapUrl] = useState<string>('');

  // 默认加载当前IP信息
  useEffect(() => {
    getCurrentIpInfo();
  }, []);

  // 获取当前IP信息
  const getCurrentIpInfo = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // 这里使用免费的IP查询API
      // 注意：实际项目中可能需要使用付费API或后端代理以避免CORS问题
      const response = await fetch('https://api.ipify.org?format=json');
      const data = await response.json();
      
      if (data.ip) {
        setIpAddress(data.ip);
        lookupIp(data.ip);
      } else {
        throw new Error('无法获取当前IP地址');
      }
    } catch (err) {
      setError(`获取当前IP信息失败: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const lookupIp = async (ip: string) => {
    if (!ip.trim()) {
      setError('请输入有效的IP地址');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // 模拟IP查询API调用
      // 实际项目中需要使用真实的IP地理位置API
      // 这里使用模拟数据展示功能
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 模拟IP查询结果
      const mockResult = {
        ip: ip,
        location: {
          country: '中国',
          region: '北京',
          city: '北京',
          lat: 39.9042,
          lng: 116.4074,
          timezone: 'Asia/Shanghai',
          postal: '100000'
        },
        isp: '中国电信',
        as: {
          name: '中国电信集团公司',
          domain: 'chinatelecom.com.cn',
          route: ip + '/24',
          type: 'isp'
        },
        proxy: {
          proxy: false,
          vpn: false,
          tor: false
        }
      };

      setResult(mockResult);
      
      // 生成地图URL（使用Google Maps静态地图示例）
      // 注意：实际使用需要Google Maps API密钥
      const { lat, lng } = mockResult.location;
      setMapUrl(`https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=12&size=400x300&markers=color:red%7C${lat},${lng}`);
      
    } catch (err) {
      setError(`IP查询失败: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = () => {
    lookupIp(ipAddress);
  };

  const handleClear = () => {
    setIpAddress('');
    setResult(null);
    setError(null);
  };

  // 验证IP地址格式的简单函数
  const isValidIp = (ip: string): boolean => {
    const ipv4Regex = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
    const ipv6Regex = /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;
    
    return ipv4Regex.test(ip) || ipv6Regex.test(ip);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">IP 地址查询</h1>
        <p className="text-gray-500 dark:text-gray-400">
          查询IP地址的地理位置信息、ISP提供商，并在地图上可视化标记
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <InputPanel
              selectedFormat="text"
              setSelectedFormat={() => {}}
              inputData={ipAddress}
              onInputChange={setIpAddress}
              onSampleData={() => {}}
              onClear={() => setIpAddress('')}
              onFileUpload={() => {}}
            />
          
          <div className="flex gap-2">
            <Button onClick={handleLookup} className="flex-1">
              查询
            </Button>
            <Button onClick={handleClear} variant="secondary">
              清空
            </Button>
            <Button onClick={getCurrentIpInfo} variant="secondary">
              我的IP
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!error && ipAddress && !isValidIp(ipAddress) && (
            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertDescription>请输入有效的IP地址格式</AlertDescription>
            </Alert>
          )}
        </div>

        <div>
          {loading ? (
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2 mt-2" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <Skeleton className="h-48 w-full rounded" />
                  <div className="grid grid-cols-2 gap-4">
                    {Array(4).fill(0).map((_, i) => (
                      <Skeleton key={i} className="h-4 w-full" />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : result ? (
            <Card>
              <CardHeader>
                <CardTitle>IP信息</CardTitle>
                <CardDescription>查询结果</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 地图可视化 */}
                <div className="relative h-48 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {mapUrl ? (
                    <img 
                      src={mapUrl} 
                      alt={`${result.location.city} 地图`} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/placeholder.jpg';
                        (e.target as HTMLImageElement).alt = '地图加载失败';
                      }}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-500">
                      地图加载中...
                    </div>
                  )}
                </div>

                {/* IP详细信息 */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">IP地址</p>
                    <p className="font-medium">{result.ip}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">国家/地区</p>
                    <p className="font-medium">{result.location.country}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">城市</p>
                    <p className="font-medium">{result.location.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">ISP提供商</p>
                    <p className="font-medium">{result.isp}</p>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="text-sm text-gray-500">
                坐标: {result.location.lat}, {result.location.lng}
              </CardFooter>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>IP信息</CardTitle>
                <CardDescription>请输入IP地址进行查询</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                  <AlertDescription>
                    点击"我的IP"按钮可以查询您当前使用的IP地址信息
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">使用说明</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>支持IPv4和IPv6地址查询</li>
          <li>提供地理位置、ISP信息等详细数据</li>
          <li>地图可视化显示IP地址的大致位置</li>
          <li>点击"我的IP"快速查询您当前的IP信息</li>
        </ul>
      </div>
    </div>
  );
}

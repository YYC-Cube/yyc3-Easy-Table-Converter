"use client"

import React, { useState } from 'react';
import { InputPanel } from '@/components/InputPanel';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function WhoisLookup() {
  const [domain, setDomain] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawOutput, setRawOutput] = useState('');

  // 模拟WHOIS查询
  const lookupWhois = async (domainName: string) => {
    if (!domainName.trim()) {
      setError('请输入有效的域名');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);
    setRawOutput('');

    try {
      // 模拟API调用延迟
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 模拟WHOIS查询结果
      const currentDate = new Date();
      const expirationDate = new Date();
      expirationDate.setFullYear(currentDate.getFullYear() + 1);
      
      const mockResult = {
        domainName: domainName,
        registryData: {
          creationDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          expirationDate: expirationDate.toISOString().split('T')[0],
          updatedDate: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          status: ['clientTransferProhibited', 'serverDeleteProhibited'],
          nameservers: ['ns1.example.com', 'ns2.example.com', 'ns3.example.com']
        },
        registrar: {
          name: '阿里云域名注册商',
          url: 'https://wanwang.aliyun.com',
          abuseContactEmail: 'abuse@example.com',
          abuseContactPhone: '+86.400-800-8888'
        },
        registrant: {
          name: 'Domain Owner',
          organization: 'Example Company',
          country: 'CN'
        },
        isExpired: false,
        daysUntilExpiration: 365
      };

      setResult(mockResult);
      
      // 生成原始WHOIS输出模拟
      const rawData = `Domain Name: ${mockResult.domainName}
Registry Domain ID: D123456789-CNIC
Registrar WHOIS Server: whois.example.com
Registrar URL: ${mockResult.registrar.url}
Updated Date: ${mockResult.registryData.updatedDate}
Creation Date: ${mockResult.registryData.creationDate}
Registry Expiry Date: ${mockResult.registryData.expirationDate}
Registrar: ${mockResult.registrar.name}
Registrar IANA ID: 12345
Registrar Abuse Contact Email: ${mockResult.registrar.abuseContactEmail}
Registrar Abuse Contact Phone: ${mockResult.registrar.abuseContactPhone}
Domain Status: clientTransferProhibited
Domain Status: serverDeleteProhibited
Name Server: NS1.EXAMPLE.COM
Name Server: NS2.EXAMPLE.COM
Name Server: NS3.EXAMPLE.COM
DNSSEC: unsigned
Registrant Organization: ${mockResult.registrant.organization}
Registrant Name: ${mockResult.registrant.name}
Registrant Country: ${mockResult.registrant.country}
Registrant State/Province: -
Registrant City: -
Registrant Street: -
Registrant Postal Code: -
`;
      
      setRawOutput(rawData);
    } catch (err) {
      setError(`WHOIS查询失败: ${(err as Error).message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = () => {
    lookupWhois(domain);
  };

  const handleClear = () => {
    setDomain('');
    setResult(null);
    setError(null);
    setRawOutput('');
  };



  // 验证域名格式的简单函数
  const isValidDomain = (domain: string): boolean => {
    const domainRegex = /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9][a-z0-9-]{0,61}[a-z0-9]$/i;
    return domainRegex.test(domain);
  };

  // 获取域名状态标签
  const getExpirationBadge = (days: number) => {
    if (days <= 30) {
      return <Badge variant="destructive">即将到期 (${days} 天)</Badge>;
    } else if (days <= 90) {
      return <Badge variant="secondary" className="bg-amber-500">需要续费 (${days} 天)</Badge>;
    } else {
      return <Badge variant="secondary" className="bg-green-500">正常 (${days} 天)</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">WHOIS 查询</h1>
        <p className="text-gray-500 dark:text-gray-400">
          查询域名的完整注册信息、注册状态和到期提醒功能
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <div className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
            <InputPanel
              selectedFormat="domain"
              setSelectedFormat={() => {}}
              inputData={domain}
              onInputChange={setDomain}
              onSampleData={() => {}}
              onClear={() => setDomain('')}
              onFileUpload={() => {}}
            />
          </div>
            <Button onClick={handleLookup}>
              查询
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

          {!error && domain && !isValidDomain(domain) && (
            <Alert className="bg-amber-50 text-amber-800 border-amber-200">
              <AlertDescription>请输入有效的域名格式 (如: example.com)</AlertDescription>
            </Alert>
          )}
        </div>

        {loading ? (
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-4 w-1/2 mt-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-40 w-full rounded" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array(8).fill(0).map((_, i) => (
                    <div key={i} className="space-y-1">
                      <Skeleton className="h-3 w-1/3" />
                      <Skeleton className="h-4 w-full" />
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        ) : result ? (
          <Card>
            <CardHeader>
              <CardTitle>{result.domainName} 的 WHOIS 信息</CardTitle>
              <CardDescription>
                {getExpirationBadge(result.daysUntilExpiration)}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* 原始WHOIS输出 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">原始 WHOIS 数据</h4>
                <ScrollArea className="h-40 rounded-md border bg-transparent p-3 text-xs font-mono">
                  <pre className="whitespace-pre-wrap">{rawOutput}</pre>
                </ScrollArea>
              </div>

              {/* 解析后的WHOIS信息 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">创建日期</p>
                  <p className="font-medium">{result.registryData.creationDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">到期日期</p>
                  <p className="font-medium">{result.registryData.expirationDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">最后更新</p>
                  <p className="font-medium">{result.registryData.updatedDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">注册商</p>
                  <p className="font-medium">{result.registrar.name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">注册商联系邮箱</p>
                  <p className="font-medium">{result.registrar.abuseContactEmail}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">注册商联系电话</p>
                  <p className="font-medium">{result.registrar.abuseContactPhone}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">注册人组织</p>
                  <p className="font-medium">{result.registrant.organization}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500">注册人国家/地区</p>
                  <p className="font-medium">{result.registrant.country}</p>
                </div>
              </div>

              {/* 域名状态 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">域名状态</h4>
                <div className="flex flex-wrap gap-2">
                  {result.registryData.status.map((status: string) => (
                    <Badge key={status} variant="outline">{status}</Badge>
                  ))}
                </div>
              </div>

              {/* 域名服务器 */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium">域名服务器 (Nameservers)</h4>
                <ul className="list-disc list-inside text-sm">
                  {result.registryData.nameservers.map((ns: string, index: number) => (
                    <li key={index}>{ns}</li>
                  ))}
                </ul>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>WHOIS 查询结果</CardTitle>
              <CardDescription>请输入域名进行查询</CardDescription>
            </CardHeader>
            <CardContent>
              <Alert className="bg-blue-50 text-blue-800 border-blue-200">
                <AlertDescription>
                  WHOIS查询将显示域名的注册信息，包括注册商、到期日期、名称服务器等
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="bg-gray-50 dark:bg-gray-900/50 p-4 rounded-lg">
        <h3 className="font-medium mb-2">使用说明</h3>
        <ul className="list-disc list-inside text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>输入域名（如 example.com）进行WHOIS查询</li>
          <li>系统会显示域名的完整注册信息，包括注册商、到期日期等</li>
          <li>到期提醒功能会根据剩余天数显示不同状态的标签</li>
          <li>原始WHOIS数据提供完整的查询结果文本</li>
        </ul>
      </div>
    </div>
  );
}

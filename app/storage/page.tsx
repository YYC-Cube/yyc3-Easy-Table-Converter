/**
 * @file 存储管理页面
 * @description 管理云端存储授权和文件管理的主界面
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Settings, Cloud, HardDrive, Upload, Download, Trash2, Info, Search, PlusCircle, Eye, RefreshCw, FileText, X } from 'lucide-react';

// 存储类型定义
type StorageType = 'local' | 's3' | 'gcs';

// 存储配置接口
interface StorageConfig {
  type: StorageType;
  name: string;
  isDefault?: boolean;
  isConnected?: boolean;
  lastConnected?: string;
  config?: any;
}

// 文件项接口
interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  createdAt: string;
  storageLocation: string;
  url?: string;
}

// 存储管理组件
const StoragePage: React.FC = () => {
  const { toast } = useToast();
  const [activeStorageType, setActiveStorageType] = useState<StorageType>('local');
  const [storageConfigs, setStorageConfigs] = useState<StorageConfig[]>([
    {
      type: 'local',
      name: '本地存储',
      isDefault: true,
      isConnected: true,
      lastConnected: new Date().toISOString(),
    },
  ]);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddingNewStorage, setIsAddingNewStorage] = useState(false);
  const [newStorageConfig, setNewStorageConfig] = useState<Partial<StorageConfig>>({});
  const [s3Config, setS3Config] = useState({
    bucketName: '',
    region: '',
    accessKeyId: '',
    secretAccessKey: '',
  });
  const [gcsConfig, setGcsConfig] = useState({
    bucketName: '',
    projectId: '',
    credentialsJson: '',
  });

  // 模拟获取文件列表
  useEffect(() => {
    fetchFiles();
  }, [activeStorageType]);

  const fetchFiles = async () => {
    setLoading(true);
    // 模拟API调用
    setTimeout(() => {
      const mockFiles: FileItem[] = [
        {
          id: '1',
          name: 'example-data.csv',
          size: 1024 * 1024,
          type: 'text/csv',
          createdAt: new Date().toISOString(),
          storageLocation: activeStorageType,
          url: '#',
        },
        {
          id: '2',
          name: 'project-schema.json',
          size: 512 * 1024,
          type: 'application/json',
          createdAt: new Date(Date.now() - 86400000).toISOString(),
          storageLocation: activeStorageType,
          url: '#',
        },
        {
          id: '3',
          name: 'sample-image.png',
          size: 2048 * 1024,
          type: 'image/png',
          createdAt: new Date(Date.now() - 172800000).toISOString(),
          storageLocation: activeStorageType,
          url: '#',
        },
      ];
      setFiles(mockFiles);
      setLoading(false);
    }, 1000);
  };

  // 连接新存储
  const handleConnectStorage = async () => {
    if (!newStorageConfig.name) {
      toast({ title: '错误', description: '请输入存储名称', variant: 'destructive' });
      return;
    }

    setLoading(true);
    // 模拟连接过程
    setTimeout(() => {
      const newConfig: StorageConfig = {
        type: activeStorageType,
        name: newStorageConfig.name as string,
        isDefault: storageConfigs.length === 0,
        isConnected: true,
        lastConnected: new Date().toISOString(),
        config: activeStorageType === 's3' ? s3Config : activeStorageType === 'gcs' ? gcsConfig : undefined,
      };
      
      setStorageConfigs([...storageConfigs, newConfig]);
      setIsAddingNewStorage(false);
      setNewStorageConfig({});
      setS3Config({ bucketName: '', region: '', accessKeyId: '', secretAccessKey: '' });
      setGcsConfig({ bucketName: '', projectId: '', credentialsJson: '' });
      
      toast({ title: '成功', description: `已成功连接到${newConfig.name}` });
      setLoading(false);
    }, 1500);
  };

  // 断开存储连接
  const handleDisconnectStorage = (configId: number) => {
    if (storageConfigs[configId].isDefault) {
      toast({ title: '错误', description: '无法断开默认存储', variant: 'destructive' });
      return;
    }
    
    const updatedConfigs = [...storageConfigs];
    updatedConfigs[configId].isConnected = false;
    setStorageConfigs(updatedConfigs);
    toast({ title: '成功', description: '已断开存储连接' });
  };

  // 设置默认存储
  const handleSetDefaultStorage = (configId: number) => {
    const updatedConfigs = storageConfigs.map((config, index) => ({
      ...config,
      isDefault: index === configId,
    }));
    setStorageConfigs(updatedConfigs);
    toast({ title: '成功', description: '已设置默认存储' });
  };

  // 上传文件
  const handleFileUpload = (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    setLoading(true);
    // 模拟上传过程
    setTimeout(() => {
      const newFile: FileItem = {
        id: Date.now().toString(),
        name: file.name,
        size: file.size,
        type: file.type,
        createdAt: new Date().toISOString(),
        storageLocation: activeStorageType,
        url: '#',
      };
      setFiles([newFile, ...files]);
      toast({ title: '上传成功', description: `${file.name} 已上传` });
      setLoading(false);
    }, 2000);
    
    // 重置文件输入
    input.value = '';
  };

  // 删除文件
  const handleDeleteFile = (fileId: string) => {
    if (confirm('确定要删除此文件吗？')) {
      setFiles(files.filter(file => file.id !== fileId));
      toast({ title: '删除成功', description: '文件已删除' });
    }
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // 格式化日期
  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleString('zh-CN');
  };

  // 渲染存储配置表单
  const renderStorageConfigForm = () => {
    switch (activeStorageType) {
      case 's3':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="s3-bucket">S3 存储桶名称</Label>
              <Input
                id="s3-bucket"
                placeholder="your-bucket-name"
                value={s3Config.bucketName}
                onChange={(e) => setS3Config({ ...s3Config, bucketName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s3-region">AWS 区域</Label>
              <Select value={s3Config.region} onValueChange={(value) => setS3Config({ ...s3Config, region: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="选择区域" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us-east-1">us-east-1 (弗吉尼亚)</SelectItem>
                  <SelectItem value="us-west-2">us-west-2 (俄勒冈)</SelectItem>
                  <SelectItem value="eu-west-1">eu-west-1 (爱尔兰)</SelectItem>
                  <SelectItem value="ap-east-1">ap-east-1 (香港)</SelectItem>
                  <SelectItem value="ap-northeast-1">ap-northeast-1 (东京)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="s3-access-key">访问密钥 ID</Label>
              <Input
                id="s3-access-key"
                placeholder="AKIAXXXXXXXXXXXXXXXX"
                value={s3Config.accessKeyId}
                onChange={(e) => setS3Config({ ...s3Config, accessKeyId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="s3-secret-key">密钥</Label>
              <Input
                id="s3-secret-key"
                type="password"
                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                value={s3Config.secretAccessKey}
                onChange={(e) => setS3Config({ ...s3Config, secretAccessKey: e.target.value })}
              />
            </div>
          </div>
        );
      case 'gcs':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="gcs-bucket">存储桶名称</Label>
              <Input
                id="gcs-bucket"
                placeholder="your-bucket-name"
                value={gcsConfig.bucketName}
                onChange={(e) => setGcsConfig({ ...gcsConfig, bucketName: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gcs-project">项目 ID</Label>
              <Input
                id="gcs-project"
                placeholder="your-project-id"
                value={gcsConfig.projectId}
                onChange={(e) => setGcsConfig({ ...gcsConfig, projectId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gcs-credentials">服务账号凭证 (JSON)</Label>
              <textarea
                id="gcs-credentials"
                className="min-h-[150px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                placeholder="粘贴服务账号JSON凭证"
                value={gcsConfig.credentialsJson}
                onChange={(e) => setGcsConfig({ ...gcsConfig, credentialsJson: e.target.value })}
              />
            </div>
          </div>
        );
      default:
        return (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertTitle>本地存储</AlertTitle>
            <AlertDescription>本地存储不需要额外配置，文件将存储在浏览器的本地存储中。</AlertDescription>
          </Alert>
        );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/40">
      <Header />
      <div className="container mx-auto px-4 space-y-8 pt-20 pb-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">存储管理</h1>
          <p className="text-muted-foreground">管理云端存储授权和文件</p>
        </div>

        <Tabs defaultValue="files" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="files" className="flex items-center gap-2">
              <HardDrive className="h-4 w-4" />
              文件管理
            </TabsTrigger>
            <TabsTrigger value="storage" className="flex items-center gap-2">
              <Cloud className="h-4 w-4" />
              存储配置
            </TabsTrigger>
          </TabsList>

          {/* 文件管理标签内容 */}
          <TabsContent value="files" className="space-y-6 mt-0">
            <Card>
              <CardHeader className="pb-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <CardTitle className="text-xl">文件列表</CardTitle>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="relative w-full sm:w-[250px]">
                      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="搜索文件..."
                        className="w-full pl-9"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                    <Button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = handleFileUpload;
                        input.click();
                      }}
                      className="gap-2 w-full sm:w-auto"
                      disabled={loading}
                    >
                      <Upload className="h-4 w-4" />
                      上传文件
                    </Button>
                  </div>
                </div>
                <CardDescription>管理已上传的文件和存储位置</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={activeStorageType === 'local' ? 'default' : 'outline'} className="flex items-center gap-1">
                      <HardDrive className="h-3 w-3" />
                      本地
                    </Badge>
                    <Badge variant={activeStorageType === 's3' ? 'default' : 'outline'} className="flex items-center gap-1">
                      <Cloud className="h-3 w-3" />
                      AWS S3
                    </Badge>
                    <Badge variant={activeStorageType === 'gcs' ? 'default' : 'outline'} className="flex items-center gap-1">
                      <Cloud className="h-3 w-3" />
                      Google Cloud
                    </Badge>
                  </div>
                  <Select value={activeStorageType} onValueChange={(value) => setActiveStorageType(value as StorageType)}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="选择存储位置" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="local">本地存储</SelectItem>
                      <SelectItem value="s3">AWS S3</SelectItem>
                      <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <RefreshCw className="h-6 w-6 animate-spin" />
                    <span className="ml-2">加载中...</span>
                  </div>
                ) : files.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Cloud className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">暂无文件</h3>
                    <p className="text-muted-foreground mb-6">点击上传按钮或拖拽文件到此处</p>
                    <Button
                      onClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.onchange = handleFileUpload;
                        input.click();
                      }}
                      className="gap-2"
                    >
                      <Upload className="h-4 w-4" />
                      上传第一个文件
                    </Button>
                  </div>
                ) : (
                  <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                      {files
                        .filter(file => 
                          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          file.type.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((file) => (
                          <div
                            key={file.id}
                            className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/30 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <FileText className="h-5 w-5 text-primary" />
                              </div>
                              <div>
                                <p className="font-medium truncate max-w-md">{file.name}</p>
                                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                                  <span>{formatFileSize(file.size)}</span>
                                  <span>{file.type}</span>
                                  <span>{formatDate(file.createdAt)}</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button variant="ghost" size="icon">
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon">
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleDeleteFile(file.id)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* 存储配置标签内容 */}
          <TabsContent value="storage" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle>存储配置</CardTitle>
                    <CardDescription>管理和连接不同的存储服务</CardDescription>
                  </div>
                  <Button
                    onClick={() => {
                      setIsAddingNewStorage(true);
                      setActiveStorageType('s3');
                    }}
                    className="gap-2"
                  >
                    <PlusCircle className="h-4 w-4" />
                    添加存储
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {storageConfigs.length > 0 ? (
                  <div className="space-y-4">
                    {storageConfigs.map((config, index) => (
                      <div
                        key={index}
                        className={`p-4 rounded-lg border ${config.isConnected ? 'border-primary/20 bg-primary/5' : 'border-input bg-muted/30'}`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${config.isConnected ? 'bg-primary/20 text-primary' : 'bg-muted text-muted-foreground'}`}>
                              {config.type === 'local' ? (
                                <HardDrive className="h-5 w-5" />
                              ) : (
                                <Cloud className="h-5 w-5" />
                              )}
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-medium">{config.name}</h3>
                                {config.isDefault && (
                                  <Badge variant="secondary" className="px-1.5 py-0 text-xs">默认</Badge>
                                )}
                                {config.isConnected && (
                                  <Badge variant="outline" className="px-1.5 py-0 text-xs text-green-600 border-green-200 bg-green-50">已连接</Badge>
                                )}
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {config.type === 'local' && '本地存储'}
                                {config.type === 's3' && 'AWS S3'}
                                {config.type === 'gcs' && 'Google Cloud Storage'}
                                {config.lastConnected && ` · 最后连接: ${formatDate(config.lastConnected)}`}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {!config.isDefault && config.isConnected && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSetDefaultStorage(index)}
                              >
                                设为默认
                              </Button>
                            )}
                            {config.type !== 'local' && config.isConnected && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-muted-foreground hover:text-destructive"
                                onClick={() => handleDisconnectStorage(index)}
                              >
                                断开连接
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium mb-2">还没有配置存储服务</h3>
                    <p className="text-muted-foreground mb-6">添加一个存储服务来开始使用</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {isAddingNewStorage && (
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>连接新存储</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsAddingNewStorage(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <CardDescription>配置并连接到新的存储服务</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="storage-name">存储名称</Label>
                    <Input
                      id="storage-name"
                      placeholder="例如: 我的S3存储"
                      value={newStorageConfig.name || ''}
                      onChange={(e) => setNewStorageConfig({ ...newStorageConfig, name: e.target.value })}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="storage-type">存储类型</Label>
                    <Select
                      value={activeStorageType}
                      onValueChange={(value) => setActiveStorageType(value as StorageType)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="选择存储类型" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="local">本地存储</SelectItem>
                        <SelectItem value="s3">AWS S3</SelectItem>
                        <SelectItem value="gcs">Google Cloud Storage</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Separator />

                  {renderStorageConfigForm()}

                  <div className="flex justify-end gap-3 pt-4">
                    <Button variant="ghost" onClick={() => setIsAddingNewStorage(false)}>
                      取消
                    </Button>
                    <Button onClick={handleConnectStorage} disabled={loading}>
                      {loading ? '连接中...' : '连接存储'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default StoragePage;

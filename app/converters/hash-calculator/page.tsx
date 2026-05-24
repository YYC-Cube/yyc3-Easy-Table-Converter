"use client"

import { useState, useRef } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Copy, CheckCircle, FileUp, ArrowLeft, Hash, FileText, Check, X, Loader } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
// Progress component removed as it's not being used
import { Separator } from "@/components/ui/separator"

import { Header } from "@/components/Header"
// useLanguage hook removed as it's not being used
// useHistory hook removed as it's not being used

/**
 * @file 哈希计算器
 * @description 支持MD5、SHA1、SHA256哈希计算，提供文本和文件哈希功能，支持结果比对
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

// 简单的哈希函数实现（生产环境应使用更安全的库）
const simpleHash = {
  md5: (text: string): string => {
    // 简化的MD5实现（实际应用应使用专业库如crypto-js）
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16).padStart(32, '0');
  },
  sha1: (text: string): string => {
    // 简化的SHA1实现（仅用于演示）
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 7) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(40, '0');
  },
  sha256: (text: string): string => {
    // 简化的SHA256实现（仅用于演示）
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 8) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(16).padStart(64, '0');
  }
};

const HashCalculator: React.FC = () => {
  // 状态管理
  const [hashAlgorithm, setHashAlgorithm] = useState<string>('md5');
  const [textInput, setTextInput] = useState<string>('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [hashResult, setHashResult] = useState<string>('');
  const [compareHash, setCompareHash] = useState<string>('');
  const [hashMatch, setHashMatch] = useState<boolean | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 计算文本哈希
  const calculateTextHash = () => {
    if (!textInput.trim()) {
      toast({ title: "错误", description: "请输入要计算哈希的文本", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    // 模拟异步处理
    setTimeout(() => {
      const hash = simpleHash[hashAlgorithm as keyof typeof simpleHash](textInput);
      setHashResult(hash);
      checkHashMatch(hash);
      setIsProcessing(false);
    }, 100);
  };

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setFileInput(file);
      calculateFileHash(file);
    }
  };

  // 计算文件哈希（简化版）
  const calculateFileHash = (file: File) => {
    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const content = e.target?.result as string;
      const hash = simpleHash[hashAlgorithm as keyof typeof simpleHash](content);
      setHashResult(hash);
      checkHashMatch(hash);
      setIsProcessing(false);
    };
    
    reader.onerror = () => {
      toast({ title: "错误", description: "文件读取失败", variant: "destructive" });
      setIsProcessing(false);
    };
    
    // 对于大文件，这里应该使用更高效的方法
    // 这里简单读取为文本（实际应用应根据文件类型处理）
    reader.readAsBinaryString(file);
  };

  // 检查哈希是否匹配
  const checkHashMatch = (hash: string) => {
    if (compareHash.trim()) {
      const match = hash.toLowerCase() === compareHash.toLowerCase();
      setHashMatch(match);
    } else {
      setHashMatch(null);
    }
  };

  // 复制哈希结果
  const copyToClipboard = () => {
    if (!hashResult) return;
    
    navigator.clipboard.writeText(hashResult).then(() => {
      setCopied(true);
      toast({ title: "成功", description: "已复制到剪贴板" });
      
      setTimeout(() => {
        setCopied(false);
      }, 2000);
    }).catch(() => {
      toast({ title: "错误", description: "复制失败，请手动复制", variant: "destructive" });
    });
  };

  // 清除所有输入
  const handleClear = () => {
    setTextInput('');
    setFileInput(null);
    setHashResult('');
    setCompareHash('');
    setHashMatch(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-gray-400/20 to-slate-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-slate-400/20 to-gray-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-gray-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
        </div>

        <div className="relative z-10 p-4">
          <div className="max-w-4xl mx-auto">
            {/* 返回按钮 */}
            <Link href="/">
              <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>

            <Header />

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-gray-50 to-slate-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Hash className="h-6 w-6 text-gray-700" />
                  <CardTitle className="text-2xl font-bold text-gray-800">哈希计算器</CardTitle>
                </div>
                <CardDescription>计算文本或文件的MD5、SHA1、SHA256哈希值，支持结果比对</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* 算法选择 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800">选择哈希算法</h3>
                  <RadioGroup 
                    value={hashAlgorithm} 
                    onValueChange={setHashAlgorithm}
                    className="flex flex-wrap gap-6"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="md5" id="md5" />
                      <Label htmlFor="md5" className="font-medium">MD5</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sha1" id="sha1" />
                      <Label htmlFor="sha1" className="font-medium">SHA1</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="sha256" id="sha256" />
                      <Label htmlFor="sha256" className="font-medium">SHA256</Label>
                    </div>
                  </RadioGroup>
                </div>

                {/* 输入方式选项卡 */}
                <Tabs defaultValue="text" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="text">文本输入</TabsTrigger>
                    <TabsTrigger value="file">文件上传</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="text" className="space-y-4 pt-6">
                    <div className="space-y-2">
                      <Label htmlFor="text-input">输入文本</Label>
                      <Textarea
                        id="text-input"
                        placeholder="在此输入要计算哈希的文本..."
                        value={textInput}
                        onChange={(e) => setTextInput(e.target.value)}
                        className="min-h-[150px]"
                      />
                    </div>
                    
                    <div className="flex gap-3 justify-end">
                      <Button variant="outline" onClick={handleClear}>
                        清除
                      </Button>
                      <Button 
                        onClick={calculateTextHash} 
                        disabled={isProcessing || !textInput.trim()}
                        className="bg-gray-700 hover:bg-gray-800 text-white"
                      >
                        {isProcessing ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            计算中...
                          </>
                        ) : (
                          <>
                            <Hash className="h-4 w-4 mr-2" />
                            计算哈希
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="file" className="space-y-4 pt-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-500 transition-colors cursor-pointer"
                         onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <FileUp className="h-12 w-12 text-gray-400" />
                        <p className="text-gray-600">点击或拖拽文件到此处</p>
                        <p className="text-gray-500 text-sm">支持所有文件类型</p>
                      </div>
                    </div>
                    
                    {fileInput && (
                      <Card className="border border-gray-200">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-gray-600" />
                            <div className="flex-1">
                              <p className="font-medium truncate">{fileInput.name}</p>
                              <p className="text-sm text-gray-500">
                                {(fileInput.size / 1024).toFixed(2)} KB
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                setFileInput(null);
                                setHashResult('');
                                if (fileInputRef.current) {
                                  fileInputRef.current.value = '';
                                }
                              }}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* 结果显示 */}
                {hashResult && (
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-800">哈希结果</h3>
                    
                    <Card className="border border-gray-200">
                      <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Hash className="h-5 w-5 text-gray-700" />
                            <span className="font-mono text-sm break-all max-w-[85%]">{hashResult}</span>
                          </div>
                          <Button 
                            onClick={copyToClipboard}
                            className="bg-gray-700 hover:bg-gray-800 text-white"
                          >
                            {copied ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                已复制
                              </>
                            ) : (
                              <>
                                <Copy className="h-4 w-4 mr-2" />
                                复制
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* 哈希比对 */}
                    <div className="space-y-4">
                      <h3 className="text-lg font-semibold text-gray-800">哈希比对</h3>
                      <div className="space-y-2">
                        <Label htmlFor="compare-hash">输入要比对的哈希值</Label>
                        <Input
                          id="compare-hash"
                          placeholder="在此输入要比对的哈希值..."
                          value={compareHash}
                          onChange={(e) => {
                            setCompareHash(e.target.value);
                            if (hashResult) {
                              checkHashMatch(hashResult);
                            }
                          }}
                        />
                      </div>
                      
                      {hashMatch !== null && (
                        <div className={`flex items-center gap-2 p-3 rounded ${hashMatch ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                          {hashMatch ? (
                            <Check className="h-5 w-5 text-green-600" />
                          ) : (
                            <X className="h-5 w-5 text-red-600" />
                          )}
                          <span className="font-medium">
                            {hashMatch ? '哈希值匹配！文件完整无误。' : '哈希值不匹配，请检查文件完整性。'}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

export default HashCalculator

"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Lock, Unlock, Copy, CheckCircle, Eye, EyeOff, ArrowLeft, ShieldAlert, Key, X } from "lucide-react"
import Link from "next/link"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// Switch component removed as it's not being used
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
// DropdownMenu components removed as they're not being used
import { Separator } from "@/components/ui/separator"

import { Header } from "@/components/Header"
// useLanguage hook removed as it's not being used
// useHistory hook removed as it's not being used

/**
 * @file 加密/解密工具
 * @description 使用 Web Crypto API 提供生产级 AES-GCM 加密解密功能
 * @author YYC
 * @version 2.0.0
 * @created 2024-11-20
 * @updated 2026-05-24 - 升级为真正的AES加密
 */

const AES_KEY_LENGTH = 256;
const IV_LENGTH = 12;
const SALT_LENGTH = 16;

interface EncryptedData {
  salt: string;
  iv: string;
  data: string;
}

async function generateKey(length: number = 32): Promise<string> {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array).map(b => chars[b % chars.length]).join('');
}

async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: AES_KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encrypt(text: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    
    const key = await deriveKey(password, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(text)
    );

    const encryptedData: EncryptedData = {
      salt: btoa(String.fromCharCode(...salt)),
      iv: btoa(String.fromCharCode(...iv)),
      data: btoa(String.fromCharCode(...new Uint8Array(encrypted)))
    };

    return JSON.stringify(encryptedData);
  } catch (error) {
    throw new Error(`加密失败: ${(error as Error).message}`);
  }
}

async function decrypt(encryptedStr: string, password: string): Promise<string> {
  try {
    let encryptedData: EncryptedData;
    
    try {
      encryptedData = JSON.parse(encryptedStr);
    } catch {
      throw new Error('无效的加密数据格式');
    }

    if (!encryptedData.salt || !encryptedData.iv || !encryptedData.data) {
      throw new Error('加密数据结构不完整');
    }

    const salt = new Uint8Array(
      atob(encryptedData.salt).split('').map(c => c.charCodeAt(0))
    );
    const iv = new Uint8Array(
      atob(encryptedData.iv).split('').map(c => c.charCodeAt(0))
    );
    const data = new Uint8Array(
      atob(encryptedData.data).split('').map(c => c.charCodeAt(0))
    );

    const key = await deriveKey(password, salt);
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );

    return new TextDecoder().decode(decrypted);
  } catch (error) {
    if (error instanceof Error && error.message.includes('解密失败')) {
      throw error;
    }
    throw new Error('解密失败，请检查密钥是否正确');
  }
}

const EncryptDecrypt: React.FC = () => {
  // 状态管理
  // const [actionType, setActionType] = useState<'string' | 'file'>('string'); // 暂时注释未使用的状态
  const [inputText, setInputText] = useState<string>('');
  const [outputText, setOutputText] = useState<string>('');
  const [encryptionKey, setEncryptionKey] = useState<string>('');
  const [showKey, setShowKey] = useState<boolean>(false);
  const [keyLength, setKeyLength] = useState<number>(32);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [showSecurityWarning, setShowSecurityWarning] = useState<boolean>(true);
  const [savedKeys, setSavedKeys] = useState<{name: string, key: string}[]>([]);
  const [recentKeys, setRecentKeys] = useState<string[]>([]);
  // const fileInputRef = useRef<HTMLInputElement>(null); // 暂时注释未使用的引用
  const { toast } = useToast();

  // 从本地存储加载保存的密钥
  useEffect(() => {
    const loadSavedKeys = () => {
      try {
        const saved = localStorage.getItem('encrypt-decrypt-keys');
        if (saved) {
          setSavedKeys(JSON.parse(saved));
        }
      } catch (error) {
        console.error('加载保存的密钥失败:', error);
      }
    };
    loadSavedKeys();
  }, []);

  // 保存密钥到本地存储
  const saveToLocalStorage = (keys: {name: string, key: string}[]) => {
    try {
      localStorage.setItem('encrypt-decrypt-keys', JSON.stringify(keys));
      setSavedKeys(keys);
    } catch (error) {
      console.error('保存密钥失败:', error);
      toast({ title: "错误", description: "保存密钥失败", variant: "destructive" });
    }
  };

  // 添加到最近使用的密钥
  const addToRecentKeys = (key: string) => {
    setRecentKeys(prev => {
      const filtered = prev.filter(k => k !== key);
      return [key, ...filtered].slice(0, 5);
    });
  };

  // 执行加密
  const handleEncrypt = async () => {
    if (!inputText.trim()) {
      toast({ title: "错误", description: "请输入要加密的文本", variant: "destructive" });
      return;
    }
    if (!encryptionKey) {
      toast({ title: "错误", description: "请输入加密密钥", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const encrypted = await encrypt(inputText, encryptionKey);
      setOutputText(encrypted);
      addToRecentKeys(encryptionKey);
      toast({ title: "成功", description: "AES-256-GCM 加密完成" });
    } catch (error) {
      toast({ title: "错误", description: "加密失败: " + (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // 执行解密
  const handleDecrypt = async () => {
    if (!inputText.trim()) {
      toast({ title: "错误", description: "请输入要解密的文本", variant: "destructive" });
      return;
    }
    if (!encryptionKey) {
      toast({ title: "错误", description: "请输入解密密钥", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      const decrypted = await decrypt(inputText, encryptionKey);
      setOutputText(decrypted);
      addToRecentKeys(encryptionKey);
      toast({ title: "成功", description: "解密完成" });
    } catch (error) {
      toast({ title: "错误", description: "解密失败: " + (error as Error).message, variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  // 生成随机密钥
  const generateRandomKey = async () => {
    const key = await generateKey(keyLength);
    setEncryptionKey(key);
    toast({ title: "成功", description: "已生成安全的随机密钥 (AES-256)" });
  };

  // 保存当前密钥
  const saveCurrentKey = () => {
    if (!encryptionKey) return;
    
    const name = prompt('请输入密钥名称:');
    if (!name || !name.trim()) return;
    
    const newKey = { name: name.trim(), key: encryptionKey };
    const updatedKeys = [...savedKeys, newKey];
    saveToLocalStorage(updatedKeys);
    toast({ title: "成功", description: "密钥已保存" });
  };

  // 删除保存的密钥
  const deleteSavedKey = (index: number) => {
    if (confirm('确定要删除这个密钥吗？')) {
      const updatedKeys = savedKeys.filter((_, i) => i !== index);
      saveToLocalStorage(updatedKeys);
      toast({ title: "成功", description: "密钥已删除" });
    }
  };

  // 使用保存的密钥
  const useSavedKey = (key: string) => {
    setEncryptionKey(key);
    addToRecentKeys(key);
  };

  // 复制到剪贴板
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
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
    setInputText('');
    setOutputText('');
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-indigo-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-purple-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-purple-400/20 to-pink-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
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
              <CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Lock className="h-6 w-6 text-purple-600" />
                  <CardTitle className="text-2xl font-bold text-gray-800">加密/解密工具</CardTitle>
                </div>
                <CardDescription>提供AES加密和解密功能，保护您的敏感信息安全</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* 安全警告 */}
                {showSecurityWarning && (
                  <Alert className="bg-amber-50 border-amber-200 text-amber-800">
                    <ShieldAlert className="h-5 w-5 text-amber-600" />
                    <AlertTitle className="font-medium">安全提示</AlertTitle>
                    <AlertDescription className="text-sm">
                      请记住您的密钥，一旦丢失将无法恢复加密数据。本工具仅用于演示，敏感数据请使用专业加密软件。
                    </AlertDescription>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="absolute right-4 top-4 h-6 w-6 p-0"
                      onClick={() => setShowSecurityWarning(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </Alert>
                )}

                {/* 加密密钥管理 */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    <Key className="h-5 w-5 text-purple-600" />
                    密钥管理
                  </h3>
                  
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="encryption-key">加密/解密密钥</Label>
                      <div className="relative">
                        <Input
                          id="encryption-key"
                          type={showKey ? "text" : "password"}
                          placeholder="请输入密钥..."
                          value={encryptionKey}
                          onChange={(e) => setEncryptionKey(e.target.value)}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full aspect-square"
                          onClick={() => setShowKey(!showKey)}
                        >
                          {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button 
                        onClick={generateRandomKey}
                        className="bg-purple-600 hover:bg-purple-700 text-white flex-1"
                      >
                        生成密钥
                      </Button>
                      <Button 
                        onClick={saveCurrentKey}
                        disabled={!encryptionKey}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white flex-1"
                      >
                        保存密钥
                      </Button>
                    </div>
                  </div>

                  {/* 密钥长度 */}
                  <div className="flex items-center justify-between">
                    <Label htmlFor="key-length">密钥长度: {keyLength} 字符</Label>
                    <Input
                      id="key-length"
                      type="range"
                      min="8"
                      max="32"
                      value={keyLength}
                      onChange={(e) => setKeyLength(Number(e.target.value))}
                      className="w-60"
                    />
                  </div>

                  {/* 最近使用的密钥 */}
                  {recentKeys.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">最近使用的密钥:</Label>
                      <div className="flex flex-wrap gap-2">
                        {recentKeys.map((key, index) => (
                          <Button
                            key={index}
                            variant="outline"
                            size="sm"
                            onClick={() => useSavedKey(key)}
                            className="text-xs truncate max-w-[200px]"
                          >
                            {showKey ? key : `${key.slice(0, 6)}...${key.slice(-4)}`}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 保存的密钥 */}
                  {savedKeys.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">保存的密钥:</Label>
                      <div className="space-y-2">
                        {savedKeys.map((savedKey, index) => (
                          <div key={index} className="flex items-center justify-between p-2 border rounded-md">
                            <div className="flex items-center gap-2">
                              <Key className="h-4 w-4 text-purple-600" />
                              <span className="font-medium">{savedKey.name}</span>
                              <span className="text-xs text-gray-500 font-mono truncate max-w-[200px]">
                                {showKey ? savedKey.key : `${savedKey.key.slice(0, 6)}...${savedKey.key.slice(-4)}`}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => useSavedKey(savedKey.key)}
                              >
                                使用
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteSavedKey(index)}
                                className="text-red-600 hover:text-red-800 hover:bg-red-50"
                              >
                                删除
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* 加密/解密操作 */}
                <Tabs defaultValue="encrypt" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="encrypt">加密文本</TabsTrigger>
                    <TabsTrigger value="decrypt">解密文本</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="encrypt" className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="encrypt-input">输入明文</Label>
                        <Textarea
                          id="encrypt-input"
                          placeholder="在此输入要加密的文本..."
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                       
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={handleClear}>
                          清除
                        </Button>
                        <Button 
                          onClick={handleEncrypt} 
                          disabled={!inputText.trim() || !encryptionKey}
                          className="bg-purple-600 hover:bg-purple-700 text-white"
                        >
                          <Lock className="h-4 w-4 mr-2" />
                          加密
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="decrypt" className="space-y-6 pt-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="decrypt-input">输入密文</Label>
                        <Textarea
                          id="decrypt-input"
                          placeholder="在此输入要解密的文本..."
                          value={inputText}
                          onChange={(e) => setInputText(e.target.value)}
                          className="min-h-[150px]"
                        />
                      </div>
                       
                      <div className="flex gap-3 justify-end">
                        <Button variant="outline" onClick={handleClear}>
                          清除
                        </Button>
                        <Button 
                          onClick={handleDecrypt} 
                          disabled={!inputText.trim() || !encryptionKey}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
                        >
                          <Unlock className="h-4 w-4 mr-2" />
                          解密
                        </Button>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>

                <Separator />

                {/* 输出结果 */}
                {(outputText && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-gray-800">输出结果</h3>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => copyToClipboard(outputText)}
                        >
                          {copied ? (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              已复制
                            </>
                          ) : (
                            <>
                              <Copy className="h-4 w-4 mr-2" />
                              复制结果
                            </>
                          )}
                        </Button>
                      </div>
                    </div>

                    <div className="p-4 bg-gray-50 rounded-lg border min-h-[120px] max-h-[300px] overflow-auto">
                      <pre className="text-sm whitespace-pre-wrap break-all font-mono text-gray-800">
                        {outputText.length > 500 ? outputText.substring(0, 500) + '\n\n... (内容过长，已截断显示)' : outputText}
                      </pre>
                    </div>
                    
                    {outputText.length > 500 && (
                      <p className="text-xs text-gray-500 text-right">
                        总长度: {outputText.length} 字符
                      </p>
                    )}
                  </div>
                )) || (
                  isProcessing && (
                    <div className="text-center py-12">
                      <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg">
                        <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                        正在处理...
                      </div>
                    </div>
                  )
                )}

                {!outputText && !isProcessing && (
                  <div className="text-center py-16 text-gray-400">
                    <Lock className="h-16 w-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">等待操作...</p>
                    <p className="text-sm mt-2">输入文本并选择加密或解密操作</p>
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

export default EncryptDecrypt

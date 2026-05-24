"use client"

import { useState, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"

import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { Copy, CheckCircle, AlertCircle, ArrowLeft, Shield, Lock, BarChart, RefreshCw } from "lucide-react"
import Link from "next/link"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"

import { Header } from "@/components/Header"



/**
 * @file 密码生成器
 * @description 提供安全、自定义复杂度的密码生成功能，支持密码强度评估和一键复制
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-20
 */

const PasswordGenerator: React.FC = () => {
  // 状态管理
  const [password, setPassword] = useState<string>("")
  const [passwordLength, setPasswordLength] = useState<number>(12)
  const [useLowercase, setUseLowercase] = useState<boolean>(true)
  const [useUppercase, setUseUppercase] = useState<boolean>(true)
  const [useNumbers, setUseNumbers] = useState<boolean>(true)
  const [useSymbols, setUseSymbols] = useState<boolean>(true)
  const [excludeSimilarChars, setExcludeSimilarChars] = useState<boolean>(true)
  const [passwordStrength, setPasswordStrength] = useState<number>(0)
  const [strengthLabel, setStrengthLabel] = useState<string>("")
  const [copied, setCopied] = useState<boolean>(false)
  const [history, setHistory] = useState<string[]>([])
  const { toast } = useToast()

  // 生成密码
  const generatePassword = () => {
    const lowercase = "abcdefghijklmnopqrstuvwxyz"
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
    const numbers = "0123456789"
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?"
    const similarChars = "il1Lo0O"

    let charSet = ""
    if (useLowercase) charSet += lowercase
    if (useUppercase) charSet += uppercase
    if (useNumbers) charSet += numbers
    if (useSymbols) charSet += symbols

    // 排除相似字符
    if (excludeSimilarChars) {
      const charsToExclude = new Set(similarChars)
      charSet = charSet.split("").filter(char => !charsToExclude.has(char)).join("")
    }

    // 确保至少有一个字符集被选中
    if (charSet === "") {
      toast({ title: "错误", description: "请至少选择一个字符类型", variant: "destructive" })
      return
    }

    let newPassword = ""
    for (let i = 0; i < passwordLength; i++) {
      const randomIndex = Math.floor(Math.random() * charSet.length)
      newPassword += charSet[randomIndex]
    }

    setPassword(newPassword)
    updatePasswordHistory(newPassword)
    evaluatePasswordStrength(newPassword)
  }

  // 评估密码强度
  const evaluatePasswordStrength = (pwd: string) => {
    let score = 0

    // 基于长度
    score += Math.min(pwd.length * 4, 40)

    // 包含小写字母
    if (useLowercase && /[a-z]/.test(pwd)) score += 10

    // 包含大写字母
    if (useUppercase && /[A-Z]/.test(pwd)) score += 10

    // 包含数字
    if (useNumbers && /[0-9]/.test(pwd)) score += 10

    // 包含特殊字符
    if (useSymbols && /[^A-Za-z0-9]/.test(pwd)) score += 20

    // 减少重复字符的分数
    const uniqueChars = new Set(pwd).size
    const uniqueness = uniqueChars / pwd.length
    if (uniqueness < 0.5) score *= uniqueness

    // 设置强度标签
    let label = ""
    if (score < 30) label = "弱"
    else if (score < 60) label = "中"
    else if (score < 80) label = "强"
    else label = "非常强"

    setPasswordStrength(Math.min(Math.round(score), 100))
    setStrengthLabel(label)
  }

  // 更新密码历史
  const updatePasswordHistory = (newPassword: string) => {
    setHistory(prev => [newPassword, ...prev.slice(0, 9)])
  }

  // 复制密码到剪贴板
  const copyToClipboard = () => {
    if (!password) return
    
    navigator.clipboard.writeText(password).then(() => {
      setCopied(true)
      toast({ title: "成功", description: "密码已复制到剪贴板" })
      
      setTimeout(() => {
        setCopied(false)
      }, 2000)
    }).catch(() => {
      toast({ title: "错误", description: "复制失败，请手动复制", variant: "destructive" })
    })
  }

  // 获取强度条颜色
  const getStrengthColor = () => {
    if (passwordStrength < 30) return "bg-red-500"
    if (passwordStrength < 60) return "bg-yellow-500"
    if (passwordStrength < 80) return "bg-blue-500"
    return "bg-green-500"
  }

  // 初始生成密码
  useEffect(() => {
    generatePassword()
  }, [])

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-blue-100">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-blue-400/20 to-cyan-400/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-500"></div>
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
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <Shield className="h-6 w-6 text-indigo-600" />
                  <CardTitle className="text-2xl font-bold text-gray-800">密码生成器</CardTitle>
                </div>
                <CardDescription>创建安全、强大的随机密码，自定义复杂度和字符类型</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-8">
                {/* 密码显示区域 */}
                <div className="space-y-4">
                  <Card className="border border-indigo-200">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Lock className="h-5 w-5 text-indigo-600" />
                          <span className="font-mono text-lg font-semibold break-all">{password || '点击生成按钮创建密码'}</span>
                        </div>
                        <Button 
                          onClick={copyToClipboard} 
                          disabled={!password}
                          className="bg-indigo-600 hover:bg-indigo-700 text-white"
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

                  {/* 密码强度指示器 */}
                  {password && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BarChart className="h-4 w-4 text-indigo-600" />
                          <span className="text-sm font-medium">密码强度: {strengthLabel}</span>
                        </div>
                        <span className="text-sm font-medium">{passwordStrength}%</span>
                      </div>
                      <Progress value={passwordStrength} className={`h-2 ${getStrengthColor()}`} />
                    </div>
                  )}
                </div>

                {/* 自定义选项 */}
                <div className="space-y-6">
                  <h3 className="text-lg font-semibold text-gray-800">自定义选项</h3>
                  
                  {/* 密码长度 */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password-length">密码长度</Label>
                      <span className="font-mono text-sm font-medium">{passwordLength}</span>
                    </div>
                    <Slider
                      id="password-length"
                      min={6}
                      max={32}
                      step={1}
                      value={[passwordLength]}
                      onValueChange={(value) => setPasswordLength(value[0])}
                      className="my-2"
                    />
                  </div>

                  {/* 字符类型选项 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="lowercase" className="flex items-center gap-2">
                        <span>a-z</span>
                        <span className="text-xs text-gray-500 font-normal">小写字母</span>
                      </Label>
                      <Switch
                        id="lowercase"
                        checked={useLowercase}
                        onCheckedChange={setUseLowercase}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="uppercase" className="flex items-center gap-2">
                        <span>A-Z</span>
                        <span className="text-xs text-gray-500 font-normal">大写字母</span>
                      </Label>
                      <Switch
                        id="uppercase"
                        checked={useUppercase}
                        onCheckedChange={setUseUppercase}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="numbers" className="flex items-center gap-2">
                        <span>0-9</span>
                        <span className="text-xs text-gray-500 font-normal">数字</span>
                      </Label>
                      <Switch
                        id="numbers"
                        checked={useNumbers}
                        onCheckedChange={setUseNumbers}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <Label htmlFor="symbols" className="flex items-center gap-2">
                        <span>!@#$</span>
                        <span className="text-xs text-gray-500 font-normal">特殊字符</span>
                      </Label>
                      <Switch
                        id="symbols"
                        checked={useSymbols}
                        onCheckedChange={setUseSymbols}
                      />
                    </div>

                    <div className="flex items-center justify-between md:col-span-2">
                      <Label htmlFor="similar-chars" className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500" />
                        <span>排除相似字符 (il1Lo0O)</span>
                      </Label>
                      <Switch
                        id="similar-chars"
                        checked={excludeSimilarChars}
                        onCheckedChange={setExcludeSimilarChars}
                      />
                    </div>
                  </div>
                </div>

                {/* 生成按钮 */}
                <div className="flex justify-center">
                  <Button
                    onClick={generatePassword}
                    size="lg"
                    className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-6"
                  >
                    <RefreshCw className="h-5 w-5 mr-2" />
                    生成新密码
                  </Button>
                </div>

                {/* 历史记录 */}
                {history.length > 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-800">历史记录</h3>
                    <div className="space-y-2">
                      {history.slice(1).map((pwd, index) => (
                        <div 
                          key={index} 
                          className="flex items-center justify-between p-2 bg-gray-50 rounded border border-gray-200"
                        >
                          <span className="font-mono text-sm break-all max-w-[80%]">{pwd}</span>
                          <Button
                            size="sm"
                            onClick={() => {
                              setPassword(pwd)
                              copyToClipboard()
                            }}
                            className="bg-gray-100 hover:bg-gray-200 text-gray-800"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
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

export default PasswordGenerator

"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { FileUp, AlertCircle, X, ArrowLeft, Download, Eye, Sparkles, Palette, Brush, Clock, BarChart3, RefreshCcw } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"

import { Label } from "@/components/ui/label"


import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"


import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts'

import { Header } from "@/components/Header"
import { useLanguage } from "@/hooks/useLanguage"
import { useHistory } from "@/hooks/useHistory"
// 移除不存在的导入，将在下面定义需要的常量

/**
 * @file AI风格转换
 * @description 支持5+种艺术风格，提供快速高质量的图像风格迁移
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-15
 */

interface ArtStyle {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  category: 'classic' | 'modern' | 'creative' | 'abstract';
  popularity: number;
  processingTime: number;
  qualityRating: number;
}

interface StyleTransferResult {
  blob: Blob;
  previewUrl: string;
  styleId: string;
  styleName: string;
  processingTime: number;
  qualityScore: number;
  originalSize: number;
  newSize: number;
  styleIntensity: number;
}

interface QualityMetric {
  name: string;
  value: number;
  max: number;
}

// 默认样式定义，放在组件外部
const defaultStyle: ArtStyle = {
  id: 'starry-night',
  name: '星空夜',
  description: '梵高《星月夜》风格，旋转的星空与流动的云',
  thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRjIxMjEiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzQzNjE4OSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE2MTQyRCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxyZWN0IHg9IjIwIiB5PSIzMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRkZFRUVFIi8+PGNpcmNsZSBjeD0iMTAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI0ZGRUVFRSIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMjUiIHI9IjEiIGZpbGw9IiNGRUVFRkUiLz48L3N2Zz4=',
  category: 'classic',
  popularity: 95,
  processingTime: 18000,
  qualityRating: 98
};

export default function StyleTransfer() {
  useLanguage()
  const [activeTab, setActiveTab] = useState("upload")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState<ArtStyle | null>(defaultStyle)
  const [styleIntensity, setStyleIntensity] = useState(70)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingProgress, setProcessingProgress] = useState(0)
  const [transferResult, setTransferResult] = useState<StyleTransferResult | null>(null)
  const [selectedCategory, setSelectedCategory] = useState<string>("all")
  const [showComparison, setShowComparison] = useState(false)
  const [comparisonSide, setComparisonSide] = useState<'original' | 'processed'>('original')
  const [history, setHistory] = useState<StyleTransferResult[]>([])

  const [isLooping, setIsLooping] = useState(false)
  const [currentLoopIndex, setCurrentLoopIndex] = useState(0)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const dropZoneRef = useRef<HTMLDivElement>(null)
  // 使用React.useRef确保在客户端环境中安全使用toast
  const toastRef = useRef<any>(null);
  
  useEffect(() => {
    // 确保在客户端环境中初始化toast
    if (typeof window !== 'undefined') {
      const { toast } = useToast();
      toastRef.current = toast;
    }
  }, []);
  
  // 创建安全的toast调用函数
  const safeToast = (options: any) => {
    if (toastRef.current) {
      toastRef.current(options);
    }
  }
  const { addHistoryItem } = useHistory()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // 添加客户端安全模式，避免服务器端渲染时的useContext错误
  const [isMounted, setIsMounted] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);
  
  // 在服务器端渲染时返回null，避免使用客户端hooks
  if (!isMounted) {
    return null;
  }

// 定义艺术风格数组
const styles: ArtStyle[] = [
    {
      id: 'starry-night',
      name: '星空夜',
      description: '梵高《星月夜》风格，旋转的星空与流动的云',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRjIxMjEiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzQzNjE4OSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE2MTQyRCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxyZWN0IHg9IjIwIiB5PSIzMCIgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjRkZFRUVFIi8+PGNpcmNsZSBjeD0iMTAiIGN5PSIyMCIgcj0iMiIgZmlsbD0iI0ZGRUVFRSIvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMjUiIHI9IjEiIGZpbGw9IiNGRUVFRkUiLz48L3N2Zz4=',
      category: 'classic',
      popularity: 95,
      processingTime: 18000,
      qualityRating: 98
    },
    {
      id: 'cubism',
      name: '立体主义',
      description: '毕加索风格，几何形状与多角度透视',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiNDNkQzRkIiIG9wYWNpdHk9IjAuOSIgLz48cmVjdCB4PSI1MCIgd2lkdGg9IjUwIiBoZWlnaHQ9IjUwIiBmaWxsPSIjRUY1QzNBIiBvcGFjaXR5PSIwLjkiIC8+PHJlY3QgeD0iMjUiIHk9IjUwIiB3aWR0aD0iNTAiIGhlaWdodD0iNTAiIGZpbGw9IiM0ODc0RkYiIG9wYWNpdHk9IjAuOSIgLz48cmVjdCB3aWR0aD0iMjUiIGhlaWdodD0iMjUiIGZpbGw9IiNFMUYwQzAiIG9wYWNpdHk9IjAuOSIgLz48cmVjdCB4PSI3NSIgeT0iMjUiIHdpZHRoPSIyNSIgaGVpZ2h0PSIyNSIgZmlsbD0iI0ZGQzA0MCIgb3BhY2l0eT0iMC45IiAvPjx0ZXh0IHg9IjIwIiB5PSI4MCIgZm9udC1mYW1pbHk9IldlYnNpdGUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHRleHQ9IkN1YmlzbSIgLz48L3N2Zz4=',
      category: 'classic',
      popularity: 85,
      processingTime: 22000,
      qualityRating: 94
    },
    {
      id: 'impressionism',
      name: '印象派',
      description: '莫奈风格，柔和的色彩与光影变化',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkZGRkYiLz48c3RvcCBvZmZzZXQ9IjIwJSIgc3RvcC1jb2xvcj0iI0ZGRkZGRiIvPjxzdG9wIG9mZnNldD0iMjElIiBzdG9wLWNvbG9yPSIjRkZGRUUwIi8+PHN0b3Agb2Zmc2V0PSI0MCUiIHN0b3AtY29sb3I9IiNGRkZGRUUwIi8+PHN0b3Agb2Zmc2V0PSI0MSUiIHN0b3AtY29sb3I9IiNGRjVFMEEiLz48c3RvcCBvZmZzZXQ9IjYwJSIgc3RvcC1jb2xvcj0iI0ZGNUUwQSIvPjxzdG9wIG9mZnNldD0iNjElIiBzdG9wLWNvbG9yPSIjRkQyQzA1Ii8+PHN0b3Agb2Zmc2V0PSI4MCUiIHN0b3AtY29sb3I9IiNGRDJDMDUiLz48c3RvcCBvZmZzZXQ9IjgxJSIgc3RvcC1jb2xvcj0iIzIyRTYxRCIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzIyRTYxRCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxyZWN0IHg9IjQwIiB5PSIzMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRjZFOUU1IiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSI3MCIgY3k9IjQwIiByPSIzIiBmaWxsPSIjRkZGRUUwIiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjYwIiByPSI0IiBmaWxsPSIjRTIwQjBEIiBvcGFjaXR5PSIwLjgiLz48L3N2Zz4=',
      category: 'classic',
      popularity: 90,
      processingTime: 20000,
      qualityRating: 96
    },
    {
      id: 'watercolor',
      name: '水彩画',
      description: '透明水彩效果，柔和的色彩过渡',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGQUUzRjYiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGRkVBRjYiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNncmFkKSIgLz48cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSIzMCIgaGVpZ2h0PSIyMCIgZmlsbD0iI0QwNjQ5QiIgZmlsbC1vcGFjaXR5PSIwLjUiIC8+PHJlY3QgeD0iNTAiIHk9IjMwIiB3aWR0aD0iNDAiIGhlaWdodD0iMzAiIGZpbGw9IiNFOEE0QTQiIGZpbGwtb3BhY2l0eT0iMC42IiAvPjx0ZXh0IHg9IjMwIiB5PSI4MCIgZm9udC1mYW1pbHk9IldlYnNpdGUiIGZvbnQtc2l6ZT0iMTIiIHRleHQtYW5jaG9yPSJtaWRkbGUiIHRleHQ9IldhdGVyY29sb3IiIC8+PC9zdmc+',
      category: 'creative',
      popularity: 88,
      processingTime: 15000,
      qualityRating: 97
    },
    {
      id: 'comic',
      name: '动漫风格',
      description: '日本动漫风格，明亮色彩与锐利线条',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI0YxN0IxMCIgLz48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIzMCIgaGVpZ2h0PSI4MCIgZmlsbD0iI0ZGRUVGRiIgb3BhY2l0eT0iMC44IiAvPjxjaXJjbGUgY3g9Ijc1IiBjeT0iMjAiIHI9IjEiIGZpbGw9IiMwMDAiLz48Y2lyY2xlIGN4PSI3MCIgY3k9IjIwIiByPSIzIiBmaWxsPSIjMzVEMzQ0Ii8+PHJlY3QgeD0iNTAiIHk9IjQ1IiB3aWR0aD0iNCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzAwMCIgLz48Y2lyY2xlIGN4PSIzNSIgY3k9IjgwIiByPSI0IiBmaWxsPSIjRkZFRUVFIiBvcGFjaXR5PSIwLjkiIC8+PGNpcmNsZSBjeD0iNTUiIGN5PSI4MCIgcj0iNCIgZmlsbD0iI0ZFRUVGRiIgb3BhY2l0eT0iMC45Ii8+PHJlY3QgeD0iMjAiIHk9IjQ1IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNDNkQzRkIiIC8+PHRleHQgeD0iNTUiIHk9IjIwIiBmb250LWZhbWlseT0iV2Vic2l0ZSIgZm9udC1zaXplPSIxMiIgdGV4dC1hbmNob3I9Im1pZGRsZSIgdGV4dD0iQ29taWMiIC8+PC9zdmc+',
      category: 'modern',
      popularity: 92,
      processingTime: 17000,
      qualityRating: 95
    },
    {
      id: 'pixel-art',
      name: '像素艺术',
      description: '复古像素风格，块状视觉效果',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzBGRDBDRSIgLz48cmVjdCB4PSIxMCIgeT0iMjAiIHdpZHRoPSI4MCIgaGVpZ2h0PSI2MCIgZmlsbD0iIzZENkZERCIgLz48cmVjdCB4PSIyMCIgeT0iMzAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI0ZFOUUxRSIvPjx0ZXh0IHg9IjMwIiB5PSI4MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiB0ZXh0PSJQaXhlbCBBcnQiIC8+PC9zdmc+',
      category: 'modern',
      popularity: 80,
      processingTime: 10000,
      qualityRating: 93
    },
    {
      id: 'digital-painting',
      name: '数字绘画',
      description: '高清数字油画效果，丰富细节',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNFRUM0NTkiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iI0RBQkQ1RSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzkyODQ4MCIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxyZWN0IHg9IjIwIiB5PSIzMCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjMwIiBmaWxsPSIjQkQ3NjJBIiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSI2MCIgY3k9IjQwIiByPSI1IiBmaWxsPSIjRjZGRUUwIiBvcGFjaXR5PSIwLjgiLz48Y2lyY2xlIGN4PSIzNSIgY3k9IjY1IiByPSI0IiBmaWxsPSIjQkZGRkY2IiBvcGFjaXR5PSIwLjgiLz48dGV4dCB4PSIzMCIgeT0iODAiIGZvbnQtZmFtaWx5PSJXZWJzaXRlIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiB0ZXh0PSJESUdJVEFSIFBBTlRJTkciIC8+PC9zdmc+',
      category: 'creative',
      popularity: 87,
      processingTime: 25000,
      qualityRating: 99
    },
    {
      id: 'abstract-expression',
      name: '抽象表现',
      description: '抽象艺术，大胆色彩与表现力',
      thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzBGRDBDRSIgLz48cmVjdCB4PSIyMCIgeT0iMjAiIHdpZHRoPSI0MCIgaGVpZ2h0PSI4MCIgZmlsbD0iI0ZDRkQwMCIgLz48cmVjdCB4PSI1MCIgeT0iNTAiIHdpZHRoPSI1MCIgaGVpZ2h0PSI1MCIgZmlsbD0iIzRDMzVFNCIgLz48cmVjdCB4PSIyMCIgeT0iNjAiIHdpZHRoPSIzMCIgaGVpZ2h0PSI0MCIgZmlsbD0iIzQxQTk0QSIgLz48dGV4dCB4PSI1MCIgeT0iMjAiIGZvbnQtZmFtaWx5PSJXZWJzaXRlIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiB0ZXh0PSJBYnN0cmFjdCIgLz48L3N2Zz4=',
      category: 'abstract',
      popularity: 75,
      processingTime: 23000,
      qualityRating: 90
    }
]

// 示例图片选项
  const sampleImages = [
    { id: '1', name: '风景照片', url: 'https://picsum.photos/seed/landscape1/400/300' },
    { id: '2', name: '人物肖像', url: 'https://picsum.photos/seed/portrait1/400/600' },
    { id: '3', name: '城市建筑', url: 'https://picsum.photos/seed/city1/400/300' },
  ]

  // 加载示例图片
  const loadSampleImage = async (sampleUrl: string) => {
    try {
      const response = await fetch(sampleUrl)
      const blob = await response.blob()
      const file = new File([blob], 'sample-image.jpg', { type: 'image/jpeg' })
      handleFileSelect(file)
      
      addHistoryItem({
        type: "image",
        input: { value: sampleUrl },
        output: { value: sampleUrl },
        settings: { action: "load-sample", sampleUrl }
      })
    } catch (error) {
      safeToast({
        title: "加载示例失败",
        description: "无法加载示例图片，请重试",
        variant: "destructive",
      })
    }
  }

  // 处理文件选择
  const handleFileSelect = (file: File) => {
    if (!file.type.startsWith('image/')) {
      safeToast({
      title: "不支持的文件格式",
      description: "请选择有效的图片文件",
      variant: "destructive",
    })
      return
    }

    setSelectedFile(file)
    const url = URL.createObjectURL(file)
    setPreviewUrl(url)
    setActiveTab("styles")
    setTransferResult(null)
    setHistory([])
    
    addHistoryItem({
          type: "image",
          input: { value: file.name },
          output: { value: previewUrl || '' },
          settings: { action: "upload", fileName: file.name, fileSize: file.size }
    })
  }

  // 处理文件上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return
    handleFileSelect(files[0])
    
    // 重置文件输入，允许再次选择相同文件
    event.target.value = ''
  }

  // 处理拖放事件
  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-green-400', 'bg-green-50')
    }
    
    const files = event.dataTransfer.files
    if (!files || files.length === 0) return
    handleFileSelect(files[0])
  }

  // 处理拖放悬停
  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-green-400', 'bg-green-50')
    }
  }

  // 处理拖放离开
  const handleDragLeave = (event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-green-400', 'bg-green-50')
    }
  }

  // 模拟风格转换处理
  const transferStyle = async () => {
    if (!selectedFile || !selectedStyle || !previewUrl) return
    
    setIsProcessing(true)
    setProcessingProgress(0)
    
    // 模拟进度更新
    const totalSteps = 100
    const stepTime = selectedStyle.processingTime / totalSteps
    
    const progressInterval = setInterval(() => {
      setProcessingProgress(prev => {
        if (prev >= totalSteps) {
          clearInterval(progressInterval)
          return totalSteps
        }
        return prev + 1
      })
    }, stepTime)
    
    try {
      // 模拟处理延迟
      await new Promise(resolve => setTimeout(resolve, selectedStyle.processingTime))
      
      // 生成模拟处理结果
      const processingTime = selectedStyle.processingTime
      const qualityScore = selectedStyle.qualityRating * (styleIntensity / 100)
      const originalSize = selectedFile.size
      const newSize = Math.floor(originalSize * (0.8 + Math.random() * 0.4)) // 原始大小的80%-120%
      
      // 创建模拟的处理后图片
      const canvas = canvasRef.current
      if (!canvas) throw new Error("Canvas not available")
      
      const img = new Image()
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve()
        img.onerror = reject
        img.src = previewUrl
      })
      
      // 设置canvas尺寸
      canvas.width = img.width
      canvas.height = img.height
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error("Canvas context not available")
      
      // 绘制带有风格效果的图像（简化实现）
      ctx.drawImage(img, 0, 0)
      
      // 根据风格类型添加不同的效果
      if (selectedStyle.id === 'starry-night') {
        ctx.globalCompositeOperation = 'overlay'
        ctx.fillStyle = 'rgba(67, 97, 137, 0.3)'
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      } else if (selectedStyle.id === 'cubism') {
        // 添加一些几何形状模拟立体主义
        ctx.globalCompositeOperation = 'overlay'
        ctx.strokeStyle = '#FF5C3A'
        ctx.lineWidth = 3
        ctx.strokeRect(canvas.width * 0.2, canvas.height * 0.2, canvas.width * 0.3, canvas.height * 0.3)
        ctx.strokeRect(canvas.width * 0.5, canvas.height * 0.4, canvas.width * 0.3, canvas.height * 0.4)
      }
      
      // 生成blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error("Failed to create blob")),
          'image/png',
          1
        )
      })
      
      const processedPreviewUrl = URL.createObjectURL(blob)
      
      const result: StyleTransferResult = {
        blob,
        previewUrl: processedPreviewUrl,
        styleId: selectedStyle.id,
        styleName: selectedStyle.name,
        processingTime,
        qualityScore,
        originalSize,
        newSize,
        styleIntensity
      }
      
      setTransferResult(result)
      setHistory(prev => [result, ...prev.slice(0, 4)]) // 保留最近5次历史
      setActiveTab("result")
      
      addHistoryItem({
        type: "image",
        input: { value: selectedStyle.id },
        output: { value: transferResult?.previewUrl || '' },
        settings: {
          action: "transfer",
          styleId: selectedStyle.id,
          styleName: selectedStyle.name,
          intensity: styleIntensity,
          processingTime,
          qualityScore
        }
      })
      
      safeToast({
        title: "风格转换成功",
        description: `${selectedStyle.name} 风格已应用，处理时间: ${(processingTime / 1000).toFixed(1)}秒`,
      })
      
    } catch (error) {
      safeToast({
        title: "处理失败",
        description: error instanceof Error ? error.message : '风格转换过程中出现错误',
        variant: "destructive",
      })
    } finally {
      clearInterval(progressInterval)
      setIsProcessing(false)
      setProcessingProgress(100)
    }
  }

  // 下载处理后的图片
  const downloadImage = () => {
    if (!transferResult) return
    
    const url = transferResult.previewUrl
    const a = document.createElement('a')
    const fileName = selectedFile ? `style-${selectedStyle?.id}-${selectedFile.name}` : `style-${selectedStyle?.id}.png`
    a.href = url
    a.download = fileName
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    
    addHistoryItem({
        type: "image",
        input: { value: transferResult.previewUrl },
        output: { value: fileName },
        settings: { action: "download", fileName, styleId: transferResult.styleId }
    })
  }

  // 使用历史记录中的结果
  const useHistoryResult = (result: StyleTransferResult) => {
    setTransferResult(result)
    // 找到对应的风格
    const style = styles.find(s => s.id === result.styleId)
    if (style) {
      setSelectedStyle(style)
    }
    setStyleIntensity(result.styleIntensity)
    
    addHistoryItem({
        type: "image",
        input: { value: result.styleId },
        output: { value: result.previewUrl },
        settings: { action: "use-history", styleId: result.styleId, qualityScore: result.qualityScore }
    })
  }



  // 获取质量评估指标
  const getQualityMetrics = (): QualityMetric[] => {
    if (!transferResult || !selectedStyle) return []
    
    return [
      {
        name: '风格相似度',
        value: Math.round(transferResult.qualityScore * 0.8 + (styleIntensity / 100) * 20),
        max: 100
      },
      {
        name: '细节保留',
        value: Math.round(100 - (styleIntensity / 100) * 30),
        max: 100
      },
      {
        name: '色彩饱和度',
        value: Math.round(selectedStyle.qualityRating * 0.7 + (styleIntensity / 100) * 30),
        max: 100
      },
      {
        name: '艺术表现力',
        value: Math.round(selectedStyle.popularity * 0.9 + Math.random() * 10),
        max: 100
      }
    ]
  }

  // 切换风格循环
  const toggleStyleLoop = () => {
    if (!selectedFile || !previewUrl) return
    
    if (isLooping) {
      // 停止循环
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
      setIsLooping(false)
    } else {
      // 开始循环
      setIsLooping(true)
      setCurrentLoopIndex(0)
      
      // 立即应用第一个风格
      const style = styles[0]
      setSelectedStyle(style)
      
      // 设置定时器循环应用风格
      intervalRef.current = setInterval(() => {
        setCurrentLoopIndex(prev => {
          const nextIndex = (prev + 1) % styles.length
          setSelectedStyle(styles[nextIndex])
          return nextIndex
        })
      }, 5000) // 5秒切换一次
    }
  }

  // 切换比较视图
  const toggleComparison = () => {
    setShowComparison(!showComparison)
    if (!showComparison) {
      setComparisonSide('original')
    }
  }

  // 切换比较边
  const toggleComparisonSide = () => {
    setComparisonSide(prev => prev === 'original' ? 'processed' : 'original')
  }

  // 清理资源
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }
      if (transferResult) {
        URL.revokeObjectURL(transferResult.previewUrl)
      }
      history.forEach(item => {
        URL.revokeObjectURL(item.previewUrl)
      })
      
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [previewUrl, transferResult, history])

  // 过滤风格列表
  const filteredStyles = selectedCategory === 'all' 
    ? styles 
    : styles.filter(style => style.category === selectedCategory)

  // 渲染风格选择器
  const renderStyleSelector = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center flex-wrap gap-2">
        <h3 className="text-lg font-medium text-gray-800">选择艺术风格</h3>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm"
            onClick={toggleStyleLoop}
            disabled={isLooping && !previewUrl}
          >
            {isLooping ? (
              <>
                <X className="w-4 h-4 mr-2" />
                停止自动预览
              </>
            ) : (
              <>
                <RefreshCcw className="w-4 h-4 mr-2" />
                自动预览
              </>
            )}
          </Button>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="所有类别" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有类别</SelectItem>
              <SelectItem value="classic">经典艺术</SelectItem>
              <SelectItem value="modern">现代风格</SelectItem>
              <SelectItem value="creative">创意风格</SelectItem>
              <SelectItem value="abstract">抽象艺术</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <ScrollArea className="h-[300px] border rounded-lg p-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredStyles.map(style => (
            <Card 
              key={style.id}
              className={`overflow-hidden cursor-pointer transition-all duration-300 ${selectedStyle?.id === style.id ? 'ring-2 ring-indigo-500 shadow-lg' : 'hover:shadow-md hover:translate-y-[-2px]'}`}
              onClick={() => setSelectedStyle(style)}
            >
              <div className="h-32 bg-gray-100 relative">
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${style.thumbnail})` }}
                />
                <Badge className="absolute top-2 left-2 bg-indigo-600 hover:bg-indigo-700">
                  {style.processingTime / 1000}s
                </Badge>
                <Badge variant="outline" className="absolute top-2 right-2 bg-white/80">
                  {style.category === 'classic' && '经典'}
                  {style.category === 'modern' && '现代'}
                  {style.category === 'creative' && '创意'}
                  {style.category === 'abstract' && '抽象'}
                </Badge>
              </div>
              <CardContent className="p-3">
                <div className="flex justify-between items-start gap-2">
                  <h4 className="font-medium text-gray-800">{style.name}</h4>
                  <Badge variant="outline" className="flex items-center text-xs">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {style.qualityRating}%
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 mt-1 line-clamp-2">{style.description}</p>
                <div className="mt-2 flex items-center text-xs text-gray-500">
                  <Sparkles className="w-3 h-3 mr-1 text-amber-500" />
                  流行度: {style.popularity}%
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </ScrollArea>

      {selectedStyle && (
        <Card className="border border-gray-200">
          <CardContent className="p-4">
            <h3 className="text-lg font-medium text-gray-800 mb-3">风格设置</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="style-intensity">风格强度 ({styleIntensity}%)</Label>
                  <Badge variant="outline" className="text-xs">影响艺术效果</Badge>
                </div>
                <Slider
                  id="style-intensity"
                  defaultValue={[70]}
                  min={10}
                  max={100}
                  step={5}
                  value={[styleIntensity]}
                  onValueChange={(value) => setStyleIntensity(value[0])}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>原始保留多</span>
                  <span>艺术效果强</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-500">预计处理时间</div>
                  <div className="font-medium text-indigo-600 flex items-center gap-1 mt-1">
                    <Clock className="w-3 h-3" />
                    {(selectedStyle.processingTime / 1000).toFixed(1)}秒
                  </div>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="text-gray-500">预期质量评分</div>
                  <div className="font-medium text-green-600 flex items-center gap-1 mt-1">
                    <BarChart3 className="w-3 h-3" />
                    {selectedStyle.qualityRating}%
                  </div>
                </div>
              </div>

              <Button 
                variant="default" 
                onClick={transferStyle}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white transition-all duration-300"
              >
                {isProcessing ? (
                  <>
                    <RefreshCcw className="w-4 h-4 mr-2 animate-spin" />
                    转换中... {processingProgress}%
                  </>
                ) : (
                  <>
                    <Brush className="w-4 h-4 mr-2" />
                    应用 {selectedStyle.name} 风格
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  // 渲染质量评估结果
  const renderQualityEvaluation = () => {
    const metrics = getQualityMetrics()
    
    if (metrics.length === 0) return null
    
    return (
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-800 flex items-center gap-1">
          <BarChart3 className="w-4 h-4 text-indigo-600" />
          质量评估指标
        </h4>
        
        <div className="space-y-2">
          {metrics.map((metric, index) => (
            <div key={index} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="text-gray-600">{metric.name}</span>
                <span className="font-medium text-indigo-600">{metric.value}/{metric.max}</span>
              </div>
              <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${(metric.value / metric.max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="h-40 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={metrics}
              margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" fontSize={10} />
              <YAxis domain={[0, 100]} fontSize={10} />
              <RechartsTooltip />
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#8884d8" 
                strokeWidth={2}
                activeDot={{ r: 6 }} 
                name="评分"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    )
  }

  // 渲染处理结果
  const renderProcessedResult = () => {
    if (!transferResult || !selectedStyle) return null
    
    const sizeReduction = ((transferResult.originalSize - transferResult.newSize) / transferResult.originalSize) * 100
    const isReduced = sizeReduction > 0
    
    return (
      <div className="space-y-4">
        <div className="relative">
          {showComparison ? (
            <div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              {comparisonSide === 'original' ? (
                <img 
                  src={previewUrl || ''} 
                  alt="原图"
                  className="w-full h-full object-contain"
                />
              ) : (
                <img 
                  src={transferResult.previewUrl} 
                  alt="处理结果"
                  className="w-full h-full object-contain"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity duration-300">
                <Button 
                  variant="default" 
                  size="sm"
                  onClick={toggleComparisonSide}
                  className="bg-white text-gray-800 hover:bg-gray-100"
                >
                  查看{comparisonSide === 'original' ? '结果' : '原图'}
                </Button>
              </div>
              <div className="absolute top-2 left-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded">
                {comparisonSide === 'original' ? '原图' : '处理结果'}
              </div>
            </div>
          ) : (
            <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
              <img 
                src={transferResult.previewUrl} 
                alt="处理结果"
                className="w-full h-full object-contain"
              />
            </div>
          )}
          
          <div className="absolute top-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium">
            质量评分: {transferResult.qualityScore.toFixed(1)}%
          </div>
        </div>
        
        <div className="flex flex-wrap gap-3 justify-between">
          <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px]">
            <div className="text-sm text-gray-600">处理时间</div>
            <div className="text-lg font-bold text-blue-600">
              {(transferResult.processingTime / 1000).toFixed(1)}s
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px]">
            <div className="text-sm text-gray-600">原始大小</div>
            <div className="text-lg font-bold">
              {(transferResult.originalSize / 1024).toFixed(1)}KB
            </div>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 flex-1 min-w-[140px]">
            <div className="text-sm text-gray-600">新文件大小</div>
            <div className={`text-lg font-bold ${isReduced ? 'text-green-600' : 'text-amber-600'}`}>
              {(transferResult.newSize / 1024).toFixed(1)}KB
              <span className={`text-xs ml-1 ${isReduced ? 'text-green-600' : 'text-amber-600'}`}>
                ({isReduced ? '-' : '+'}{Math.abs(sizeReduction).toFixed(1)}%)
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 space-y-4">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                <h3 className="text-sm font-medium text-gray-800 mb-3 flex items-center gap-1">
                  <Palette className="w-4 h-4 text-indigo-600" />
                  {selectedStyle.name} 风格详情
                </h3>
                
                <div className="flex flex-wrap gap-3">
                  <div className="bg-indigo-50 rounded-lg p-3 flex-1 min-w-[180px]">
                    <div className="text-xs text-gray-600">风格类别</div>
                    <div className="text-base font-medium text-indigo-700 mt-1">
                      {selectedStyle.category === 'classic' && '经典艺术'}
                      {selectedStyle.category === 'modern' && '现代风格'}
                      {selectedStyle.category === 'creative' && '创意风格'}
                      {selectedStyle.category === 'abstract' && '抽象艺术'}
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 flex-1 min-w-[180px]">
                    <div className="text-xs text-gray-600">应用强度</div>
                    <div className="text-base font-medium text-indigo-700 mt-1">
                      {transferResult.styleIntensity}%
                    </div>
                  </div>
                  <div className="bg-indigo-50 rounded-lg p-3 flex-1 min-w-[180px]">
                    <div className="text-xs text-gray-600">流行度</div>
                    <div className="text-base font-medium text-indigo-700 mt-1">
                      {selectedStyle.popularity}%
                    </div>
                  </div>
                </div>
                
                <p className="text-sm text-gray-700 mt-4 bg-gray-50 p-3 rounded-lg">
                  {selectedStyle.description}
                </p>
              </CardContent>
            </Card>
          </div>
          
          <div className="space-y-4">
            <Card className="border border-gray-200">
              <CardContent className="p-4">
                {renderQualityEvaluation()}
              </CardContent>
            </Card>
            
            <div className="space-y-3">
              <Button 
                variant="default" 
                onClick={downloadImage}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
              >
                <Download className="w-4 h-4 mr-2" />
                下载艺术作品
              </Button>
              
              <Button 
                variant="ghost" 
                onClick={toggleComparison}
                className="w-full"
              >
                <Eye className="w-4 h-4 mr-2" />
                {showComparison ? '隐藏对比' : '对比原图'}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-800 mb-3">历史记录</h4>
          <div className="grid grid-cols-5 gap-2">
            {history.map((item, index) => (
              <button
                key={index}
                className={`aspect-video rounded border-2 transition-all ${transferResult === item ? 'ring-2 ring-blue-500' : 'border-transparent hover:border-gray-300'}`}
                onClick={() => useHistoryResult(item)}
                title={`${item.styleName} - ${item.qualityScore.toFixed(1)}%`}
              >
                <img 
                  src={item.previewUrl} 
                  alt={`历史记录 ${index + 1}`}
                  className="w-full h-full object-cover rounded"
                />
              </button>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        {/* 动画背景 */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-gradient-to-r from-indigo-400/20 to-purple-400/20 rounded-full blur-3xl animate-pulse delay-700"
>            </div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-gradient-to-r from-pink-400/20 to-red-400/20 rounded-full blur-3xl animate-pulse delay-1000"
>            </div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gradient-to-r from-blue-400/20 to-indigo-400/20 rounded-full blur-3xl animate-pulse"
>            </div>
        </div>

        <div className="relative z-10 p-4">
          <div className="max-w-7xl mx-auto">
            {/* 返回按钮 */}
            <Link href="/">
              <Button variant="outline" className="mb-4 bg-white/90 backdrop-blur-sm">
                <ArrowLeft className="w-4 h-4 mr-2" />
                返回首页
              </Button>
            </Link>

            <Header />

            <Card className="bg-white/90 backdrop-blur-sm border-white/20 shadow-2xl hover:shadow-3xl transition-all duration-300">
              <CardHeader className="bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-gray-100">
                <CardTitle className="flex items-center gap-3 text-xl font-bold text-gray-800">
                  <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                    <Brush className="w-4 h-4 text-white" />
                  </div>
                  AI 风格转换
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="grid w-full grid-cols-3 bg-gray-100 p-1 rounded-xl mb-6">
                    <TabsTrigger 
                      value="upload" 
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200"
                    >
                      上传图片
                    </TabsTrigger>
                    <TabsTrigger 
                      value="styles" 
                      disabled={!selectedFile}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      选择风格
                    </TabsTrigger>
                    <TabsTrigger 
                      value="result" 
                      disabled={!transferResult}
                      className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-md transition-all duration-200 disabled:opacity-50"
                    >
                      预览结果
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-6">
                    <div 
                      ref={dropZoneRef}
                      className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors duration-200 cursor-pointer"
                      onClick={() => fileInputRef.current?.click()}
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <div className="mx-auto w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                        <FileUp className="w-8 h-8 text-indigo-600" />
                      </div>
                      <h3 className="text-lg font-medium text-gray-800 mb-2">拖放文件到此处或点击上传</h3>
                      <p className="text-sm text-gray-500 mb-4">支持JPG、PNG、WEBP等常见图片格式</p>
                      <div className="flex flex-wrap justify-center gap-2">
                        <Badge variant="outline" className="bg-indigo-50 text-indigo-700 border-indigo-200">
                          <Sparkles className="w-3 h-3 mr-1" />
                          5+ 艺术风格
                        </Badge>
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          <Clock className="w-3 h-3 mr-1" />
                          处理 &lt; 30秒
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          <BarChart3 className="w-3 h-3 mr-1" />
                          质量评估
                        </Badge>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h3 className="text-lg font-medium text-gray-800">使用示例图片</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {sampleImages.map(sample => (
                          <div 
                            key={sample.id}
                            className="group relative rounded-lg overflow-hidden border border-gray-200 cursor-pointer hover:shadow-md transition-shadow"
                            onClick={() => loadSampleImage(sample.url)}
                          >
                            <div className="aspect-video bg-gray-100">
                              <img 
                                src={sample.url} 
                                alt={sample.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                              />
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <div className="bg-white px-4 py-2 rounded-lg text-sm font-medium">
                                使用此示例
                              </div>
                            </div>
                            <div className="p-3 bg-gray-50 text-center">
                              <p className="text-sm font-medium text-gray-800">{sample.name}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <Alert className="bg-blue-50 border-blue-200">
                      <AlertCircle className="h-4 w-4 text-blue-600" />
                      <AlertTitle className="text-blue-800 font-medium">提示</AlertTitle>
                      <AlertDescription className="text-blue-700">
                        为获得最佳效果，建议上传分辨率在500-2000像素之间的图片。不同风格对不同类型图片的效果可能有所差异。
                      </AlertDescription>
                    </Alert>
                  </TabsContent>

                  <TabsContent value="styles" className="space-y-6">
                    {selectedFile && (
                      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-4">
                          <div className="flex justify-between items-center flex-wrap gap-2">
                            <h3 className="text-lg font-medium text-gray-800">图片预览</h3>
                            <div className="flex gap-2">
                              <Badge variant="outline" className="bg-gray-100">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                              </Badge>
                              <Badge variant="outline" className="bg-gray-100">
                                {selectedFile.name.split('.').pop()?.toUpperCase()}
                              </Badge>
                            </div>
                          </div>
                          
                          <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden border border-gray-200 flex items-center justify-center">
                            {previewUrl && (
                              <img 
                                src={previewUrl} 
                                alt={selectedFile.name}
                                className="max-w-full max-h-full object-contain"
                              />
                            )}
                          </div>
                          
                          {isLooping && (
                            <Alert className="bg-amber-50 border-amber-200">
                              <RefreshCcw className="h-4 w-4 text-amber-600 animate-spin" />
                              <AlertTitle className="text-amber-800 font-medium">自动预览中</AlertTitle>
                              <AlertDescription className="text-amber-700">
                                当前正在预览: <span className="font-medium">{styles[currentLoopIndex].name}</span>
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>

                        <div className="lg:col-span-1">
                          {renderStyleSelector()}
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="result" className="space-y-6">
                    {renderProcessedResult()}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
      
      {/* 隐藏的canvas用于处理 */}
      <canvas ref={canvasRef} className="hidden"></canvas>
    </TooltipProvider>
  )
}

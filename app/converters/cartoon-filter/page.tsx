"use client"

import { useState, useRef, useEffect } from "react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
// Tabs 组件暂未使用
import { TooltipProvider } from "@/components/ui/tooltip"
import { useToast } from "@/hooks/use-toast"
import { CheckCircle2, ArrowLeft, Download, Image as ImageIcon, Upload, Eye, RotateCcw, Zap, Sparkles, RefreshCw, SlidersHorizontal, Undo, Palette, Loader2 } from "lucide-react"
import Link from "next/link"
import { ScrollArea } from "@/components/ui/scroll-area"
// Badge 组件暂未使用
import { Slider } from "@/components/ui/slider"
// Separator 组件暂未使用
import { Label } from "@/components/ui/label"
// Input 组件暂未使用
// Switch 组件暂未使用
// Select 组件暂未使用
// Alert 组件暂未使用
// Dialog 组件暂未使用
// Skeleton 组件暂未使用
// DropdownMenu 组件暂未使用

import { Header } from "@/components/Header"
// useHistory hook暂未使用

/**
 * @file 卡通滤镜
 * @description 提供多种卡通风格滤镜转换功能
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-15
 */

interface CartoonFilter {
  id: string;
  name: string;
  description: string;
  thumbnail: string;
  defaultParams: {
    edgeStrength: number;
    colorSaturation: number;
    smoothing: number;
    detailLevel: number;
    styleIntensity: number;
  };
  category: 'anime' | 'cartoon' | 'sketch' | 'painting';
}

// 定义卡通滤镜预设
const CARTOON_FILTERS: CartoonFilter[] = [
  {
    id: 'anime-style',
    name: '动漫风格',
    description: '将照片转换为日式动漫风格',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkZGZmYiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzU1NTU1NSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzIyMjIyMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxyZWN0IHg9IjQwIiB5PSIzMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjRkQ1NjYzIiBzdHJva2U9IiMzMTMxMzEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik01MCAxMEg2MEg1MEgxMEg1MEgyMEg1MEg4MEg1MEg5MEg1MCJmaWxsPSIjRjBGOUYxIiBzdHJva2U9IiMzMTMxMzEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0xMCA0MEg5MCIgZmlsbD0iI0U5RjlGOOSIgc3Ryb2tlPSIjMzEzMTMxIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMTAgNjBIMTAwIiBmaWxsPSIjRjlFOUY5IiBzdHJva2U9IiMzMTMxMzEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0yMCAzMEgzMCIgZmlsbD0iI0UzRUZGRiIgc3Ryb2tlPSIjMzEzMTMxIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNTAgMzBIMzAiIGZpbGw9IiNFM0VGRkYiIHN0cm9rZT0iIzMxMzEzMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iNDAiIHk9IjMwIiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNGRDU2NjMiIHN0cm9rZT0iIzMxMzEzMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMzAiIHk9IjQ1IiB3aWR0aD0iNDAiIGhlaWdodD0iMTUiIGZpbGw9IiNGRkY2RjYiIHN0cm9rZT0iIzMxMzEzMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
    defaultParams: {
      edgeStrength: 80,
      colorSaturation: 90,
      smoothing: 60,
      detailLevel: 75,
      styleIntensity: 85
    },
    category: 'anime'
  },
  {
    id: 'western-cartoon',
    name: '西方卡通',
    description: '美式卡通风格，色彩鲜明',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkZGZmYiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzU1NTU1NSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzIyMjIyMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxyZWN0IHg9IjMwIiB5PSIzMCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjOEEyRjU2IiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zMCA0MEg3MCIgZmlsbD0iI0ZGRjZGNjEiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTIwIDYwSDgwIiBmaWxsPSIjRjlFQjY2IiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik00MCAyMEg2MCIgZmlsbD0iI0ZGRjZGNjEiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTMwIDYwSDQwIiBmaWxsPSIjMTQ4NzE0IiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik02MCA2MEg3MCIgZmlsbD0iIzE0ODcxNCIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIzNSIgeT0iMjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI0ZGRkY2NiIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSI1NSIgeT0iMjAiIHdpZHRoPSIxMCIgaGVpZ2h0PSIxMCIgZmlsbD0iI0ZGRkY2NiIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiLz48cmVjdCB4PSIzMCIgeT0iMzAiIHdpZHRoPSI0MCIgaGVpZ2h0PSIyMCIgZmlsbD0iI0ZGRjZGNjEiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
    defaultParams: {
      edgeStrength: 70,
      colorSaturation: 95,
      smoothing: 50,
      detailLevel: 60,
      styleIntensity: 80
    },
    category: 'cartoon'
  },
  {
    id: 'pencil-sketch',
    name: '铅笔素描',
    description: '黑白素描风格，类似手绘',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkZGZmYiLz48c3RvcCBvZmZzZXQ9IjQwJSIgc3RvcC1jb2xvcj0iI0ZGQkJCQiIvPjxzdG9wIG9mZnNldD0iNjAlIiBzdHJva2U9IiNFMkQ5QzQiIHN0cm9rZS13aWR0aD0iMiIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzIyMjIyMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxyZWN0IHg9IjM1IiB5PSIzMCIgd2lkdGg9IjMwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjQkJCQkJCIiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0yNSA0MEg3NSIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMjAgNTBINGw0LTQgNC00IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IiByPSIxIiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik02MCA2MEg3MCIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMzAgNjBIMzUiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMjUiIHk9IjQwIiB3aWR0aD0iNTAiIGhlaWdodD0iMjAiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMzUiIHk9IjMwIiB3aWR0aD0iMzAiIGhlaWdodD0iMjAiIGZpbGw9IiNGRkZGRkYiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
    defaultParams: {
      edgeStrength: 90,
      colorSaturation: 0,
      smoothing: 30,
      detailLevel: 80,
      styleIntensity: 75
    },
    category: 'sketch'
  },
  {
    id: 'watercolor',
    name: '水彩画',
    description: '水彩艺术风格，柔和色彩过渡',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkZGZmYiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzU1NTU1NSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzIyMjIyMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxwYXRoIGQ9Ik0yMCAyMEg4MCIgZmlsbD0iI0ZGRkZGRiIgZmlsbC1vcGFjaXR5PSIwLjgiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTIwIDgwSDgwIiBmaWxsPSIjRkZGRkZGIiBmaWxsLW9wYWNpdHk9IjAuOCIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utb3BhY2l0eT0iMC41IiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNDIgMzBMNDYgMzUgNDggMzEgNTAgMzUgNTMgMzEgNTcgMzUgNTkgMzEgNjMgMzUgNjUgMzEgNjggMzUgNzAgMzEiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLW9wYWNpdHk9IjAuNSIgc3Ryb2tlLXdpZHRoPSIzIi8+PHJlY3QgeD0iNTAiIHk9IjM1IiB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIGZpbGw9IiNGRkZGRkYiIGZpbGwtb3BhY2l0eT0iMC44IiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS1vcGFjaXR5PSIwLjUiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zMCA2MEg0MCIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1vcGFjaXR5PSIwLjUiLz48cGF0aCBkPSJNNjAgNjBIMzAiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2Utb3BhY2l0eT0iMC41Ii8+PC9zdmc+',
    defaultParams: {
      edgeStrength: 40,
      colorSaturation: 70,
      smoothing: 85,
      detailLevel: 50,
      styleIntensity: 75
    },
    category: 'painting'
  },
  {
    id: 'chibi',
    name: 'Q版卡通',
    description: '可爱的Q版风格转换',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkZGZmYiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzU1NTU1NSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzIyMjIyMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxyZWN0IHg9IjQwIiB5PSIzMCIgd2lkdGg9IjIwIiBoZWlnaHQ9IjIwIiBmaWxsPSIjQTE4RTFFIiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zNSA0MEg2NSIgZmlsbD0iI0ZGRkY2NiIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMzAgNTBINGw0LTQgNC00IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IDQtNCA0IiByPSIxIiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0yNSA0MEg4NSIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNMzAgNjBIMzUiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHJlY3QgeD0iMzUiIHk9IjMwIiB3aWR0aD0iMzAiIGhlaWdodD0iMjAiIGZpbGw9IiNBNTcwOEQiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIyIi8+PHBhdGggZD0iTTM1IDcwSDY1IiBmaWxsPSIjRkZGRkZGIiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik00MCA2MEg0NSIgZmlsbD0iIzE0ODcxNCIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjIiLz48cGF0aCBkPSJNNTUgNjBINTUiIHN0cm9rZT0iIzE0ODcxNCIgc3Ryb2tlLXdpZHRoPSIyIi8+PC9zdmc+',
    defaultParams: {
      edgeStrength: 75,
      colorSaturation: 95,
      smoothing: 70,
      detailLevel: 60,
      styleIntensity: 90
    },
    category: 'anime'
  },
  {
    id: 'oil-painting',
    name: '油画风格',
    description: '将照片转换为油画艺术效果',
    thumbnail: 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGRkZGZmYiLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3RvcC1jb2xvcj0iIzU1NTU1NSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzIyMjIyMiIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiBmaWxsPSJ1cmwoI2dyYWQpIiAvPjxwYXRoIGQ9Ik0yMCAzMEg4MCIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1vcGFjaXR5PSIwLjgiIGZpbGw9IiNGRkZGRkYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PHBhdGggZD0iTTIwIDcwSDgwIiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLW9wYWNpdHk9IjAuOCIgc3Ryb2tlLXdpZHRoPSIyIiBmaWxsPSIjRkZGRkZGIiBmaWxsLW9wYWNpdHk9IjAuNSIvPjxwYXRoIGQ9Ik0zMCA0MEg3MCIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1vcGFjaXR5PSIwLjgiIGZpbGw9IiNGRkZGRkYiIGZpbGwtb3BhY2l0eT0iMC41Ii8+PHJlY3QgeD0iNDUiIHk9IjM1IiB3aWR0aD0iMTUiIGhlaWdodD0iMTUiIGZpbGw9IiNEM0Q3ODQiIGZpbGwtb3BhY2l0eT0iMC45IiBzdHJva2U9IiMyMTIxMjEiIHN0cm9rZS1vcGFjaXR5PSIwLjYiIHN0cm9rZS13aWR0aD0iMiIvPjxwYXRoIGQ9Ik0zMCA2MEg0MCIgZmlsbD0iIzUxNDIxRCIgc3Ryb2tlPSIjMjEyMTIxIiBzdHJva2Utd2lkdGg9IjMiIHN0cm9rZS1vcGFjaXR5PSIwLjgiLz48cGF0aCBkPSJNNjAgNjBIMzAiIHN0cm9rZT0iIzIxMjEyMSIgc3Ryb2tlLXdpZHRoPSIzIiBzdHJva2Utb3BhY2l0eT0iMC44Ii8+PC9zdmc+',
    defaultParams: {
      edgeStrength: 30,
      colorSaturation: 80,
      smoothing: 75,
      detailLevel: 45,
      styleIntensity: 85
    },
    category: 'painting'
  }
];

// 滤镜类别
const FILTER_CATEGORIES = [
  { id: 'all', name: '全部风格', icon: <Palette className="h-4 w-4" /> },
  { id: 'anime', name: '动漫风格', icon: <Sparkles className="h-4 w-4" /> },
  { id: 'cartoon', name: '卡通风格', icon: <SlidersHorizontal className="h-4 w-4" /> },
  { id: 'sketch', name: '素描风格', icon: <SlidersHorizontal className="h-4 w-4" /> },
  { id: 'painting', name: '绘画风格', icon: <SlidersHorizontal className="h-4 w-4" /> }
];

export default function CartoonFilterApp() {
  // 暂时不使用t翻译函数
  // const { t } = useLanguage();
  const [selectedFilter, setSelectedFilter] = useState<CartoonFilter | null>(CARTOON_FILTERS[0]);
  // 暂时不需要customImage状态
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [filteredImage, setFilteredImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOriginal, setShowOriginal] = useState(false);
  const [filterParams, setFilterParams] = useState({
    edgeStrength: 80,
    colorSaturation: 90,
    smoothing: 60,
    detailLevel: 75,
    styleIntensity: 85
  });
  const [activeCategory, setActiveCategory] = useState('all');
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);
  const [processedHistory, setProcessedHistory] = useState<string[]>([]);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);
  // 暂时不需要canvasRef
  const { toast } = useToast();
  // 暂时不需要useHistory hook
  
  // 支持的图片格式
  const SUPPORTED_IMAGE_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

  // 当选择滤镜变化时，更新参数
  useEffect(() => {
    if (selectedFilter) {
      setFilterParams(selectedFilter.defaultParams);
    }
  }, [selectedFilter]);

  // 处理自定义图片上传
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    validateAndProcessFile(file);
  };

  // 验证文件并处理
  const validateAndProcessFile = (file: File) => {
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !SUPPORTED_IMAGE_FORMATS.includes(fileExtension)) {
      toast({ 
        variant: 'destructive', 
        title: '不支持的文件格式', 
        description: `请上传 JPG, JPEG, PNG 或 WebP 格式的图片` 
      });
      return;
    }
    
    if (file.size > MAX_FILE_SIZE) {
      toast({ 
        variant: 'destructive', 
        title: '文件太大', 
        description: '图片大小不能超过 10MB' 
      });
      return;
    }
    
    processImageFile(file);
  };

  // 处理图片文件
  const processImageFile = (file: File) => {
    // 不再需要设置customImage
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target?.result as string;
      setPreviewUrl(imageUrl);
      setFilteredImage(null); // 重置处理后的图片
      setProcessedHistory([]); // 清空历史记录
      setCurrentHistoryIndex(-1);
      
      // 自动开始处理
      if (selectedFilter) {
        applyFilter(imageUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // 处理拖放上传
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('border-blue-500');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('border-blue-500');
    }
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    validateAndProcessFile(file);
  };

  // 应用滤镜（模拟处理）
  const applyFilter = (imageUrl: string) => {
    setIsProcessing(true);
    
    // 模拟处理延迟
    setTimeout(() => {
      // 这里实际项目中会调用图像处理API或Canvas处理
      // 为了演示，我们直接使用原图并模拟处理效果
      setFilteredImage(imageUrl);
      
      // 添加到历史记录
      const newHistory = [...processedHistory.slice(0, currentHistoryIndex + 1), imageUrl];
      setProcessedHistory(newHistory);
      setCurrentHistoryIndex(newHistory.length - 1);
      
      setIsProcessing(false);
      
      toast({
        variant: 'default',
        title: '滤镜应用成功',
        description: `已应用 ${selectedFilter?.name}`
      });
    }, 1500);
  };

  // 重置参数到默认值
  const resetToDefaults = () => {
    if (selectedFilter) {
      setFilterParams(selectedFilter.defaultParams);
    }
  };

  // 重新应用滤镜
  const reapplyFilter = () => {
    if (previewUrl) {
      applyFilter(previewUrl);
    }
  };

  // 导出图片
  const exportImage = () => {
    // 实际项目中会实现图片导出功能
    if (filteredImage) {
      toast({
        variant: 'default',
        title: '导出成功',
        description: '图片已准备好下载'
      });
    }
  };

  // 重置所有设置
  const resetAll = () => {
    // 不再需要重置customImage
    setPreviewUrl(null);
    setFilteredImage(null);
    setProcessedHistory([]);
    setCurrentHistoryIndex(-1);
    setShowOriginal(false);
    if (selectedFilter) {
      setFilterParams(selectedFilter.defaultParams);
    }
  };

  // 撤销操作
  const undoAction = () => {
    if (currentHistoryIndex > 0) {
      setCurrentHistoryIndex(currentHistoryIndex - 1);
      setFilteredImage(processedHistory[currentHistoryIndex - 1]);
    }
  };

  // 重做操作
  const redoAction = () => {
    if (currentHistoryIndex < processedHistory.length - 1) {
      setCurrentHistoryIndex(currentHistoryIndex + 1);
      setFilteredImage(processedHistory[currentHistoryIndex + 1]);
    }
  };

  // 过滤显示的滤镜
  const filteredFilters = activeCategory === 'all' 
    ? CARTOON_FILTERS 
    : CARTOON_FILTERS.filter(filter => filter.category === activeCategory);

  return (
    <TooltipProvider>
      <div className="flex flex-col min-h-screen">
        <Header />
        
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex items-center mb-6">
            <Link href="/">
              <Button variant="ghost" size="sm" className="mr-2">
                <ArrowLeft className="mr-2 h-4 w-4" />
                返回首页
              </Button>
            </Link>
          </div>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-center">卡通滤镜</CardTitle>
            </CardHeader>
            <CardContent>
              {/* 图片上传区域 */}
              {!previewUrl ? (
                <div className="grid grid-cols-1 gap-6">
                  <div
                    ref={dropZoneRef}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer min-h-[300px] flex flex-col items-center justify-center"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      accept={SUPPORTED_IMAGE_FORMATS.map(fmt => `image/${fmt}`).join(',')}
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    
                    <ImageIcon className="h-16 w-16 text-gray-400 mb-4" />
                    <h4 className="text-lg font-medium mb-2">拖放图片到此处或点击上传</h4>
                    <p className="text-gray-500 text-sm mb-4">
                      支持 JPG, JPEG, PNG 或 WebP 格式，最大 10MB
                    </p>
                    <Button className="mt-2">
                      <Upload className="mr-2 h-4 w-4" />
                      选择图片
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* 图片预览区域 */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center w-full">
                          <CardTitle>预览效果</CardTitle>
                          <div className="flex space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setShowOriginal(!showOriginal)}
                            >
                              {showOriginal ? (
                                <>
                                  <Zap className="mr-1 h-4 w-4" />
                                  显示滤镜
                                </>
                              ) : (
                                <>
                                  <Eye className="mr-1 h-4 w-4" />
                                  显示原图
                                </>
                              )}
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={reapplyFilter}
                              disabled={isProcessing}
                            >
                              <RefreshCw className="mr-1 h-4 w-4" />
                              重新生成
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="relative">
                        <div className="relative bg-gray-900 rounded-lg overflow-hidden border flex items-center justify-center aspect-square">
                          {showOriginal ? (
                            <img 
                              src={previewUrl} 
                              alt="原图预览" 
                              className="max-h-[500px] max-w-full object-contain transition-opacity duration-300"
                            />
                          ) : (
                            <img 
                              src={filteredImage || previewUrl} 
                              alt="滤镜效果" 
                              className="max-h-[500px] max-w-full object-contain transition-opacity duration-300"
                            />
                          )}
                          
                          {isProcessing && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <div className="flex flex-col items-center text-white">
                                <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                <p>正在应用滤镜...</p>
                              </div>
                            </div>
                          )}
                          
                          {/* 历史操作工具栏 */}
                          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2 bg-black bg-opacity-70 p-2 rounded-full">
                            <Button 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={undoAction}
                              disabled={currentHistoryIndex <= 0}
                              title="撤销"
                            >
                              <Undo className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={redoAction}
                              disabled={currentHistoryIndex >= processedHistory.length - 1}
                              title="重做"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="icon" 
                              className="h-8 w-8"
                              onClick={() => setShowOriginal(!showOriginal)}
                              title={showOriginal ? "显示滤镜" : "显示原图"}
                            >
                              {showOriginal ? <Zap className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                  
                  {/* 滤镜设置和操作面板 */}
                  <div className="space-y-6">
                    <Card>
                      <CardHeader>
                        <CardTitle>选择滤镜</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-4">
                          <ScrollArea className="flex pb-4 mb-4">
                            <div className="flex space-x-2">
                              {FILTER_CATEGORIES.map(category => (
                                <Button
                                  key={category.id}
                                  variant={activeCategory === category.id ? "default" : "ghost"}
                                  size="sm"
                                  onClick={() => setActiveCategory(category.id)}
                                  className="whitespace-nowrap"
                                >
                                  {category.icon}
                                  <span className="ml-1">{category.name}</span>
                                </Button>
                              ))}
                            </div>
                          </ScrollArea>
                        </div>
                        
                        <ScrollArea className="h-[200px] border rounded-md p-4">
                          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                            {filteredFilters.map((filter) => (
                              <div
                                key={filter.id}
                                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all hover:scale-105 hover:shadow-md ${
                                  selectedFilter?.id === filter.id 
                                    ? 'border-blue-500 ring-2 ring-blue-200' 
                                    : 'border-gray-200 hover:border-blue-300'
                                }`}
                                onClick={() => setSelectedFilter(filter)}
                              >
                                <img 
                                  src={filter.thumbnail} 
                                  alt={filter.name} 
                                  className="w-full h-24 object-cover"
                                />
                                <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-60 text-white text-xs p-1 truncate">
                                  {filter.name}
                                </div>
                                {selectedFilter?.id === filter.id && (
                                  <div className="absolute top-1 right-1 text-blue-500">
                                    <CheckCircle2 className="h-4 w-4" />
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <div className="flex justify-between items-center w-full">
                          <CardTitle>滤镜参数</CardTitle>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                          >
                            <SlidersHorizontal className="mr-1 h-4 w-4" />
                            {showAdvancedSettings ? "基础设置" : "高级设置"}
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent>
                        {/* 基础参数设置 */}
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>边缘强度</Label>
                              <span className="text-sm font-mono">{filterParams.edgeStrength}%</span>
                            </div>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[filterParams.edgeStrength]}
                              onValueChange={(value) => setFilterParams({...filterParams, edgeStrength: value[0]})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>色彩饱和度</Label>
                              <span className="text-sm font-mono">{filterParams.colorSaturation}%</span>
                            </div>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[filterParams.colorSaturation]}
                              onValueChange={(value) => setFilterParams({...filterParams, colorSaturation: value[0]})}
                            />
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <Label>风格强度</Label>
                              <span className="text-sm font-mono">{filterParams.styleIntensity}%</span>
                            </div>
                            <Slider
                              min={0}
                              max={100}
                              step={5}
                              value={[filterParams.styleIntensity]}
                              onValueChange={(value) => setFilterParams({...filterParams, styleIntensity: value[0]})}
                            />
                          </div>
                          
                          {/* 高级参数设置 */}
                          {showAdvancedSettings && (
                            <div className="space-y-4 pt-4 border-t">
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label>平滑度</Label>
                                  <span className="text-sm font-mono">{filterParams.smoothing}%</span>
                                </div>
                                <Slider
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={[filterParams.smoothing]}
                                  onValueChange={(value) => setFilterParams({...filterParams, smoothing: value[0]})}
                                />
                              </div>
                              
                              <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                  <Label>细节保留</Label>
                                  <span className="text-sm font-mono">{filterParams.detailLevel}%</span>
                                </div>
                                <Slider
                                  min={0}
                                  max={100}
                                  step={5}
                                  value={[filterParams.detailLevel]}
                                  onValueChange={(value) => setFilterParams({...filterParams, detailLevel: value[0]})}
                                />
                              </div>
                            </div>
                          )}
                          
                          <Button 
                            variant="ghost" 
                            className="w-full"
                            onClick={resetToDefaults}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            重置为默认值
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                    
                    <Card>
                      <CardHeader>
                        <CardTitle>操作</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <Button 
                          className="w-full"
                          onClick={exportImage}
                          disabled={!filteredImage || isProcessing}
                        >
                          <Download className="mr-2 h-4 w-4" />
                          导出图片
                        </Button>
                        
                        <Button 
                          className="w-full"
                          onClick={reapplyFilter}
                          disabled={!previewUrl || isProcessing}
                        >
                          <Sparkles className="mr-2 h-4 w-4" />
                          应用滤镜
                        </Button>
                        
                        <div className="flex space-x-2">
                          <Button 
                            variant="ghost" 
                            className="flex-1"
                            onClick={undoAction}
                            disabled={currentHistoryIndex <= 0}
                          >
                            <Undo className="mr-2 h-4 w-4" />
                            撤销
                          </Button>
                          <Button 
                            variant="ghost" 
                            className="flex-1"
                            onClick={redoAction}
                            disabled={currentHistoryIndex >= processedHistory.length - 1}
                          >
                            <RotateCcw className="mr-2 h-4 w-4" />
                            重做
                          </Button>
                        </div>
                        
                        <Button 
                          variant="destructive" 
                          className="w-full"
                          onClick={resetAll}
                          disabled={isProcessing}
                        >
                          <RotateCcw className="mr-2 h-4 w-4" />
                          重置所有
                        </Button>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </main>
        
        <footer className="bg-gray-100 py-6 mt-12">
          <div className="container mx-auto px-4 text-center text-gray-600">
            <p>卡通滤镜 - 将照片转换为卡通风格</p>
          </div>
        </footer>
      </div>
    </TooltipProvider>
  );
}

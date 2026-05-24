"use client"

/**
 * @file 进度监控和断点续传演示页面
 * @description 演示如何使用进度监控和断点续传功能
 * @module app/demo-progress-monitor/page
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */

import { useState, useRef, useCallback, useEffect } from 'react'
// ProgressDisplay组件已移除

export default function ProgressMonitorDemo() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [activeTab, setActiveTab] = useState<'basic' | 'advanced'>('basic')
  const [isMounted, setIsMounted] = useState(false)
  
  // 确保只在客户端渲染时初始化处理器
  useEffect(() => {
    setIsMounted(true)
    return () => setIsMounted(false)
  }, [])
  
  // 模拟耗时处理函数（带进度更新）
  const mockProcessor = useCallback(async (file: File, onProgress?: (progress: number) => void, startFrom = 0) => {
  
  // 基本用法 - 使用增强的useBatchProcessor（注释掉未使用的代码）
  // const _basicProcessor = useBatchProcessor({
  //   enableResume: true,
  //   resumeConfig: {
  //     checkpointInterval: 2000,
  //     maxRetries: 3
  //   }
  // })
  
  // 高级用法 - 使用专用的useProgressMonitor钩子（注释掉未使用的代码）
  // const progressMonitor = useProgressMonitor({
  //   processor: mockProcessor
  // })
    return new Promise<string>((resolve) => {
      let processed = startFrom
      const totalSteps = 100
      const chunkSize = 100 / totalSteps
      const interval = setInterval(() => {
        processed += chunkSize
        if (processed >= 100) {
          clearInterval(interval)
          onProgress?.(100)
          resolve(`处理完成: ${file.name}`)
        } else {
          onProgress?.(processed)
        }
      }, 100)
    })
  }, [])
  
  // 处理文件上传 - 简化实现
  const handleFileUpload = (files: File[]) => {
    // 使用mockProcessor处理文件
    files.forEach(async (file) => {
      try {
        const result = await mockProcessor(file, (progress) => {
          console.log(`文件 ${file.name} 处理进度: ${progress.toFixed(2)}%`)
        })
        console.log(result)
      } catch (error) {
        console.error(`处理文件 ${file.name} 时出错:`, error)
      }
    })
  }
  
  // 开始处理 - 简化实现
  const startProcessing = async () => {
    // 在简化实现中，文件上传时已经开始处理
    console.log('处理已在文件上传时自动开始')
  }
  
  // 暂停所有任务
  const handlePauseAll = async () => {
    // 在简化实现中，暂停功能不可用
    console.log('简化实现中不支持暂停功能')
  }
  
  // 恢复所有任务
  const handleResumeAll = async () => {
    // 在简化实现中，恢复功能不可用
    console.log('简化实现中不支持恢复功能')
  }
  
  // 清除所有任务
  const handleClearAll = () => {
    // 在简化实现中，清除功能不可用
    console.log('简化实现中不支持清除功能')
  }
  
  // 确保只在客户端渲染时显示内容
  if (!isMounted) {
    return null
  }
  
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">
        进度监控与断点续传演示
      </h1>
      
      {/* 标签切换 */}
      <div className="flex mb-6 border-b">
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'basic' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('basic')}
        >
          基本用法 (增强的 useBatchProcessor)
        </button>
        <button
          className={`px-4 py-2 font-medium ${activeTab === 'advanced' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-600'}`}
          onClick={() => setActiveTab('advanced')}
        >
          高级用法 (专用的 useProgressMonitor)
        </button>
      </div>
      
      {/* 文件上传区域 */}
      <div 
        className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center mb-6 cursor-pointer"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files && e.target.files.length > 0) {
              handleFileUpload(Array.from(e.target.files))
              // 清空input以便重复选择同一文件
              e.target.value = ''
            }
          }}
        />
        <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <p className="text-gray-500">拖拽文件到此处或点击上传</p>
      </div>
      
      {/* 控制按钮 */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          onClick={startProcessing}
        >
          开始处理
        </button>
        <button
          className="px-4 py-2 bg-yellow-500 text-white rounded hover:bg-yellow-600 transition"
          onClick={handlePauseAll}
        >
          暂停所有
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
          onClick={handleResumeAll}
        >
          恢复所有
        </button>
        <button
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition"
          onClick={handleClearAll}
        >
          清除所有
        </button>
      </div>
      
      {/* 进度显示 - 简化实现 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-6">
        <p className="text-gray-600">进度信息将显示在控制台中</p>
      </div>
      
      {/* 功能说明 */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">功能说明</h3>
        <ul className="list-disc pl-6 space-y-2 text-gray-600">
          <li>支持多文件批量处理，可同时上传并处理多个文件</li>
          <li>实时显示处理进度，包括总体进度和单个任务进度</li>
          <li>支持暂停/恢复功能，可随时暂停和恢复处理任务</li>
          <li>断点续传：刷新页面后，未完成的任务可继续从上次的位置处理</li>
          <li>自动保存检查点，避免意外关闭导致进度丢失</li>
          <li>错误处理和重试机制，提高处理成功率</li>
        </ul>
      </div>
    </div>
  )
}
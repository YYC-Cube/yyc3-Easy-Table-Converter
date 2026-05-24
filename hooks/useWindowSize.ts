/**
 * @file 窗口尺寸Hook
 * @description 响应式获取和监听窗口尺寸变化
 * @module hooks
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-23
 */

import { useState, useEffect, useCallback } from 'react'

interface WindowSize {
  width: number
  height: number
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  orientation: 'portrait' | 'landscape'
}

const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024
}

/**
 * @description 窗口尺寸Hook - 响应式获取窗口尺寸信息
 * @param debounceDelay 防抖延迟时间（毫秒）
 * @returns 窗口尺寸信息对象
 */
export function useWindowSize(debounceDelay: number = 100): WindowSize {
  // 初始化状态
  const [size, setSize] = useState<WindowSize>(() => {
    // 服务端渲染时返回默认值
    if (typeof window === 'undefined') {
      return {
        width: 1200,
        height: 800,
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        orientation: 'landscape'
      }
    }
    
    // 客户端初始化
    const width = window.innerWidth
    const height = window.innerHeight
    return calculateWindowSize(width, height)
  })
  
  // 计算窗口尺寸信息
  const calculateWindowSize = useCallback((width: number, height: number): WindowSize => {
    const isMobile = width < BREAKPOINTS.mobile
    const isTablet = width >= BREAKPOINTS.mobile && width < BREAKPOINTS.tablet
    const isDesktop = width >= BREAKPOINTS.tablet
    const orientation = width > height ? 'landscape' : 'portrait'
    
    return {
      width,
      height,
      isMobile,
      isTablet,
      isDesktop,
      orientation
    }
  }, [])
  
  // 处理窗口大小变化
  useEffect(() => {
    // 防抖函数
    let timeoutId: NodeJS.Timeout | null = null
    
    const handleResize = () => {
      // 清除之前的定时器
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      // 设置新的定时器
      timeoutId = setTimeout(() => {
        const { innerWidth, innerHeight } = window
        setSize(calculateWindowSize(innerWidth, innerHeight))
      }, debounceDelay)
    }
    
    // 添加事件监听
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    
    // 初始测量
    handleResize()
    
    // 清理函数
    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [debounceDelay, calculateWindowSize])
  
  return size
}

export default useWindowSize
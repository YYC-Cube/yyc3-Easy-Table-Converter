"use client"

import React, { createContext, useState, useEffect, ReactNode } from 'react'

// 主题类型
export type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  setTheme: (theme: Theme) => void
  isDarkMode: boolean
}

// 创建主题上下文
const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: ReactNode
}

/**
 * 主题提供者组件
 * 管理应用的主题状态并提供给子组件
 */
export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  // 初始化主题状态
  const [theme, setTheme] = useState<Theme>('system')
  const [isDarkMode, setIsDarkMode] = useState(false)

  // 初始化时从localStorage获取主题设置
  useEffect(() => {
    // 确保只在客户端环境中访问localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme | null
      if (savedTheme) {
        setTheme(savedTheme)
      }
    }
  }, [])

  // 监听主题变化并应用到文档
  useEffect(() => {
    // 确保只在客户端环境中执行
    if (typeof window !== 'undefined') {
      let darkMode = false
      
      if (theme === 'system') {
        darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches
      } else {
        darkMode = theme === 'dark'
      }
      
      setIsDarkMode(darkMode)
      
      // 应用主题到文档
      if (darkMode) {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
      
      // 保存主题设置
      localStorage.setItem('theme', theme)
    }
  }, [theme])

  // 监听系统主题变化（当主题设置为system时）
  useEffect(() => {
    // 确保只在客户端环境中执行
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      
      const handleChange = () => {
        if (theme === 'system') {
          const newDarkMode = mediaQuery.matches
          setIsDarkMode(newDarkMode)
          
          if (newDarkMode) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      }
      
      mediaQuery.addEventListener('change', handleChange)
      
      return () => {
        mediaQuery.removeEventListener('change', handleChange)
      }
    }
  }, [theme])

  const contextValue: ThemeContextType = {
    theme,
    setTheme,
    isDarkMode
  }

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  )
}

// 导出useTheme钩子
export const useTheme = (): ThemeContextType => {
  const context = React.useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
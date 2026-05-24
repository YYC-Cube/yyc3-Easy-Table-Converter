"use client"

import React, { createContext, useState, useEffect, ReactNode } from 'react'
import { translations } from '@/lib/i18n/translations'

// 支持的语言类型
export type Language = 'zh' | 'en' | 'ja'

export interface LanguageContextType {
  language: Language
  setLanguage: (lang: Language) => void
  t: (key: string) => string
}

// 创建语言上下文
const LanguageContext = createContext<LanguageContextType | undefined>(undefined)

interface LanguageProviderProps {
  children: ReactNode
}

/**
 * 语言提供者组件
 * 管理应用的语言设置并提供翻译功能
 */
export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  // 初始化语言状态
  const [language, setLanguage] = useState<Language>('zh')

  // 初始化时从localStorage获取语言设置或使用浏览器语言
  useEffect(() => {
    // 确保只在客户端环境中访问localStorage和navigator
    if (typeof window !== 'undefined') {
      const savedLanguage = localStorage.getItem('language') as Language | null
      
      if (savedLanguage) {
        setLanguage(savedLanguage)
      } else {
        // 获取浏览器语言并设置默认语言
        const browserLang = navigator.language.split('-')[0] as Language
        if (translations[browserLang]) {
          setLanguage(browserLang)
        } else {
          setLanguage('zh') // 默认使用中文
        }
      }
    }
  }, [])

  // 监听语言变化并保存到localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('language', language)
    }
  }, [language])

  // 翻译函数
  const t = (key: string): string => {
    const keys = key.split('.')
    let value: any = translations[language] || translations.zh
    
    for (const k of keys) {
      if (value[k] === undefined) {
        return key // 如果找不到翻译，返回原始键
      }
      value = value[k]
    }
    
    return value as string
  }

  const contextValue: LanguageContextType = {
    language,
    setLanguage,
    t
  }

  return (
    <LanguageContext.Provider value={contextValue}>
      {children}
    </LanguageContext.Provider>
  )
}

// 导出useLanguage钩子
export const useLanguage = (): LanguageContextType => {
  const context = React.useContext(LanguageContext)
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}
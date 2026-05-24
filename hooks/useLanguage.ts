"use client"

// 从providers中导入useLanguage钩子，保持API一致性
export { useLanguage } from '@/providers/LanguageProvider'

// 重新导出类型定义以保持兼容性
export type { LanguageContextType } from '@/providers/LanguageProvider'

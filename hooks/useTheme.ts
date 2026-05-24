/**
 * @file useTheme - 主题管理钩子
 * @description 提供主题切换和管理功能
 * @module hooks/useTheme
 * @author YYC
 * @version 1.0.0
 * @created 2024-11-12
 * @updated 2024-11-12
 */

// 从providers中导入useTheme钩子，保持API一致性
export { useTheme } from '@/providers/ThemeProvider'

// 重新导出类型定义以保持兼容性
export type { Theme as ThemeType } from '@/providers/ThemeProvider'

// 扩展钩子以添加toggleTheme方法
import { useTheme as useThemeBase } from '@/providers/ThemeProvider'

export interface ThemeState {
  theme: ThemeType
  isDarkMode: boolean
  setTheme: (theme: ThemeType) => void
  toggleTheme: () => void
}

/**
 * @description 主题管理钩子（扩展版）
 * @returns {ThemeState} 主题状态和控制方法
 */
export function useThemeExtended(): ThemeState {
  const { theme, isDarkMode, setTheme } = useThemeBase()

  // 切换主题的便捷方法
  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'light') return 'dark'
      if (prevTheme === 'dark') return 'system'
      return 'light'
    })
  };

  return {
    theme,
    isDarkMode,
    setTheme,
    toggleTheme
  }
}

"use client"

import { useState, useEffect } from 'react'
import { usePathname } from 'next/navigation'
// Lucide React 正确的图标导入
import { Table, Sparkles, ArrowUpDown, Search, Info, Home, Settings, HelpCircle as Help, Copy as FileCopy, Download, Upload, ChevronDown, Menu, ArrowLeft } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from "@/components/ui/tooltip";
import { useLanguage } from "@/hooks/useLanguage"
import { ThemeToggle } from "@/components/ui/ThemeToggle"
import { SettingsButton } from "@/components/ui/SettingsButton"
import { Button } from "@/components/ui/button"
import Link from 'next/link'

export const Header = () => {
  const pathname = usePathname()
  const { t } = useLanguage()
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [navCollapsed, setNavCollapsed] = useState(false)

  const isHome = pathname === '/'

  // 监听滚动事件，实现滚动时的导航栏效果
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // 导航链接
  const navLinks = [
    { label: t('nav.home'), icon: <Home className="w-4 h-4" /> },
    { label: t('nav.tools'), icon: <FileCopy className="w-4 h-4" /> },
    { label: t('nav.documentation'), icon: <Help className="w-4 h-4" /> },
    { 
      label: t('nav.industrySolutions'), 
      icon: <Settings className="w-4 h-4" />,
      hasDropdown: true 
    },
  ]

  if (!isHome) {
    return (
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${ 
          isScrolled 
            ? 'bg-white/95 backdrop-blur-md shadow-md py-3' 
            : 'bg-transparent py-4' 
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            {/* 返回按钮 */}
            <Link href="/">
              <Button variant="ghost" size="sm" className="gap-2">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">返回首页</span>
              </Button>
            </Link>

            {/* 品牌标志 */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Table className="w-4 h-4 text-white" />
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:inline">
                {t('title')}
              </span>
            </div>

            {/* 右侧操作区 */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <SettingsButton />
            </div>
          </div>
        </div>
      </header>
    )
  }

  return null
}

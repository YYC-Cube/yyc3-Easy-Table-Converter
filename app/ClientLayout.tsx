"use client"

import { useEffect, useState } from 'react'
import { Analytics } from '@vercel/analytics/next'
import { ThemeProvider } from '@/providers/ThemeProvider'
import { LanguageProvider } from '@/providers/LanguageProvider'
import { ToastProvider } from './providers/toast-provider'
import { AuthProvider } from './contexts/AuthContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import { PWAProvider } from './components/PWAProvider'
import { FloatingChat } from '@/components/ai/FloatingChat'
import aiService from '@/lib/services/aiService'

interface ClientLayoutProps {
  children: React.ReactNode
}

export const ClientLayout: React.FC<ClientLayoutProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const aiSettings = mounted ? aiService.getSettings() : null;

  return (
    <ErrorBoundary>
      <ToastProvider>
        <ThemeProvider>
          <LanguageProvider>
            <AuthProvider>
              <PWAProvider>
                {mounted && <Analytics />}
                {children}
                {aiSettings?.enableFloatingChat && (
                  <FloatingChat position={aiSettings.floatingChatPosition} />
                )}
              </PWAProvider>
            </AuthProvider>
          </LanguageProvider>
        </ThemeProvider>
      </ToastProvider>
    </ErrorBoundary>
  )
}

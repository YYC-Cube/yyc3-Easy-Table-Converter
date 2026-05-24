"use client"

import { useState, useCallback } from "react"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/hooks/useLanguage"
import type { HistoryState } from "@/lib/types"

export const useTableHistory = () => {
  const [history, setHistory] = useState<HistoryState[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const [isUndoRedoOperation, setIsUndoRedoOperation] = useState(false)
  const { toast } = useToast()
  const { t } = useLanguage()

  const saveToHistory = useCallback(
    (newTableData: string[][], newInputData: string) => {
      if (isUndoRedoOperation) return

      const newState: HistoryState = {
        tableData: JSON.parse(JSON.stringify(newTableData)),
        inputData: newInputData,
        timestamp: Date.now(),
      }

      setHistory((prev) => {
        const newHistory = prev.slice(0, historyIndex + 1)
        newHistory.push(newState)
        if (newHistory.length > 50) {
          newHistory.shift()
          return newHistory
        }
        return newHistory
      })

      setHistoryIndex((prev) => prev + 1)
    },
    [historyIndex, isUndoRedoOperation],
  )

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      setIsUndoRedoOperation(true)
      const prevState = history[historyIndex - 1]
      setHistoryIndex((prev) => prev - 1)
      setTimeout(() => setIsUndoRedoOperation(false), 0)
      toast({
        title: t("messages.undone"),
        description: t("messages.undoneDesc"),
      })
      return prevState
    }
    return null
  }, [history, historyIndex, toast, t])

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setIsUndoRedoOperation(true)
      const nextState = history[historyIndex + 1]
      setHistoryIndex((prev) => prev + 1)
      setTimeout(() => setIsUndoRedoOperation(false), 0)
      toast({
        title: t("messages.redone"),
        description: t("messages.redoneDesc"),
      })
      return nextState
    }
    return null
  }, [history, historyIndex, toast, t])

  const clearHistory = () => {
    setHistory([])
    setHistoryIndex(-1)
  }

  return {
    history,
    historyIndex,
    isUndoRedoOperation,
    saveToHistory,
    handleUndo,
    handleRedo,
    clearHistory,
  }
}

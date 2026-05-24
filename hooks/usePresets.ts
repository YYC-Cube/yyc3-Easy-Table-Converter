// 预设模板 Hook
"use client"

import { useState, useEffect } from "react"
import { PresetManager, type Preset } from "@/lib/utils/presetManager"

export const usePresets = (type?: string) => {
  const [presets, setPresets] = useState<Preset[]>([])
  const manager = PresetManager.getInstance()

  useEffect(() => {
    setPresets(manager.getPresets(type))
  }, [type])

  const createPreset = (name: string, type: Preset["type"], settings: Record<string, any>) => {
    const preset = manager.createPreset(name, type, settings)
    setPresets(manager.getPresets(type))
    return preset
  }

  const updatePreset = (id: string, updates: Partial<Omit<Preset, "id" | "createdAt">>) => {
    manager.updatePreset(id, updates)
    setPresets(manager.getPresets(type))
  }

  const deletePreset = (id: string) => {
    manager.deletePreset(id)
    setPresets(manager.getPresets(type))
  }

  return {
    presets,
    createPreset,
    updatePreset,
    deletePreset,
  }
}

// 预设模板管理器 - 保存常用转换配置
export interface Preset {
  id: string
  name: string
  type: "table" | "image" | "base64" | "color" | "unit" | "json-xml" | "timestamp"
  settings: Record<string, any>
  createdAt: number
  updatedAt: number
}

const STORAGE_KEY = "converter_presets"

export class PresetManager {
  private static instance: PresetManager
  private presets: Preset[] = []

  private constructor() {
    this.loadFromStorage()
  }

  static getInstance(): PresetManager {
    if (!PresetManager.instance) {
      PresetManager.instance = new PresetManager()
    }
    return PresetManager.instance
  }

  createPreset(name: string, type: Preset["type"], settings: Record<string, any>): Preset {
    const preset: Preset = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name,
      type,
      settings,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    }

    this.presets.push(preset)
    this.saveToStorage()
    return preset
  }

  getPresets(type?: string): Preset[] {
    if (type) {
      return this.presets.filter((preset) => preset.type === type)
    }
    return this.presets
  }

  getPreset(id: string): Preset | undefined {
    return this.presets.find((preset) => preset.id === id)
  }

  updatePreset(id: string, updates: Partial<Omit<Preset, "id" | "createdAt">>): void {
    const preset = this.presets.find((p) => p.id === id)
    if (preset) {
      Object.assign(preset, updates, { updatedAt: Date.now() })
      this.saveToStorage()
    }
  }

  deletePreset(id: string): void {
    this.presets = this.presets.filter((preset) => preset.id !== id)
    this.saveToStorage()
  }

  private loadFromStorage(): void {
    if (typeof window === "undefined") return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        this.presets = JSON.parse(stored)
      }
    } catch (error) {
      console.error("[v0] 加载预设失败:", error)
    }
  }

  private saveToStorage(): void {
    if (typeof window === "undefined") return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.presets))
    } catch (error) {
      console.error("[v0] 保存预设失败:", error)
    }
  }
}

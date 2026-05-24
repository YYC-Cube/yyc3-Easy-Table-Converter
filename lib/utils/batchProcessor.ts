/**
 * @file 批量处理工具类
 * @description 支持多文件批量转换的核心处理引擎
 * @module lib/utils/batchProcessor
 * @author YYC
 * @version 1.0.0
 * @created 2024-07-12
 */


export interface BatchTask {
  id: string
  file: File
  status: "pending" | "processing" | "completed" | "error" | "paused"
  progress: number
  result?: Blob | string
  error?: string
  // 断点续传相关字段
  startTime?: number
  lastUpdated?: number
  bytesProcessed?: number
  totalBytes?: number
}

export class BatchProcessor {
  private tasks: Map<string, BatchTask> = new Map()
  private onProgressCallback?: (tasks: BatchTask[]) => void

  addTask(file: File): string {
    const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    this.tasks.set(id, {
      id,
      file,
      status: "pending",
      progress: 0,
      totalBytes: file.size,
      bytesProcessed: 0
    })
    return id
  }

  addTasks(files: File[]): string[] {
    return files.map((file) => this.addTask(file))
  }

  getTasks(): BatchTask[] {
    return Array.from(this.tasks.values())
  }

  getTask(id: string): BatchTask | undefined {
    return this.tasks.get(id)
  }

  updateTask(id: string, updates: Partial<BatchTask>) {
    const task = this.tasks.get(id)
    if (task) {
      Object.assign(task, updates)
      this.notifyProgress()
    }
  }

  removeTask(id: string) {
    this.tasks.delete(id)
    this.notifyProgress()
  }

  clearCompleted() {
    for (const [id, task] of this.tasks.entries()) {
      if (task.status === "completed") {
        this.tasks.delete(id)
      }
    }
    this.notifyProgress()
  }

  clearAll() {
    this.tasks.clear()
    this.notifyProgress()
  }

  onProgress(callback: (tasks: BatchTask[]) => void) {
    this.onProgressCallback = callback
  }

  private notifyProgress() {
    if (this.onProgressCallback) {
      this.onProgressCallback(this.getTasks())
    }
  }

  async processBatch<T>(
    processor: (file: File, onProgress?: (progress: number, chunkIndex?: number) => void, startFrom?: number) => Promise<T>,
    concurrency = 3,
  ): Promise<void> {
    const pendingTasks = this.getTasks().filter((t) => t.status === "pending")
    const chunks: BatchTask[][] = []

    for (let i = 0; i < pendingTasks.length; i += concurrency) {
      chunks.push(pendingTasks.slice(i, i + concurrency))
    }

    for (const chunk of chunks) {
      await Promise.all(
        chunk.map(async (task) => {
          this.updateTask(task.id, { status: "processing" })
          try {
            const result = await processor(task.file, (progress) => {
              this.updateTask(task.id, { progress })
            })
            this.updateTask(task.id, {
              status: "completed",
              progress: 100,
              result: result as Blob | string,
            })
          } catch (error) {
            this.updateTask(task.id, {
              status: "error",
              error: error instanceof Error ? error.message : "处理失败",
            })
          }
        }),
      )
    }
  }
}

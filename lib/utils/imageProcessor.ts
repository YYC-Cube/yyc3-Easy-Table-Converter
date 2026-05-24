// 图片处理核心工具库

// 图片压缩
export const compressImage = async (
  file: File,
  quality = 0.8,
  maxWidth?: number,
  maxHeight?: number,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      let { width, height } = img

      if (maxWidth && maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        if (ratio < 1) {
          width = Math.floor(width * ratio)
          height = Math.floor(height * ratio)
        }
      }

      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("无法获取 Canvas 上下文"))
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("图片压缩失败"))
        },
        file.type,
        quality,
      )
    }

    img.onerror = () => reject(new Error("图片加载失败"))
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(file)
  })
}

// 调整图片尺寸
export const resizeImage = async (
  file: File,
  targetWidth: number,
  targetHeight: number,
  format: string = 'auto',
  quality: number = 90,
  preserveAspectRatio = true,
): Promise<{success: boolean, data?: Blob, error?: string}> => {
  return new Promise((resolve) => {
    try {
      const img = new Image()
      const reader = new FileReader()
      
      // 确保质量在有效范围内
      const validQuality = Math.max(0, Math.min(100, quality)) / 100;
      
      // 如果格式为'auto'，则使用原始格式
      const outputFormat = format === 'auto' ? file.type.split('/')[1] : format;
      const mimeType = `image/${outputFormat === 'jpg' ? 'jpeg' : outputFormat}`;

      reader.onload = (e) => {
        img.src = e.target?.result as string
      }

      img.onload = () => {
        let width = targetWidth
      let height = targetHeight

      if (preserveAspectRatio) {
        const ratio = Math.min(targetWidth / img.width, targetHeight / img.height)
        width = Math.floor(img.width * ratio)
        height = Math.floor(img.height * ratio)
      }

        const canvas = document.createElement("canvas")
        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext("2d")
        if (!ctx) {
          resolve({ success: false, error: "无法获取 Canvas 上下文" })
          return
        }

        // 设置高质量渲染
        ctx.imageSmoothingQuality = 'high';
        ctx.imageSmoothingEnabled = true;
        
        ctx.drawImage(img, 0, 0, width, height)

        canvas.toBlob(
          (blob) => {
            if (blob) resolve({ success: true, data: blob })
            else resolve({ success: false, error: "图片调整失败" })
          },
          mimeType,
          validQuality
        )
      }

      img.onerror = () => resolve({ success: false, error: "图片加载失败" })
      reader.onerror = () => resolve({ success: false, error: "文件读取失败" })
      reader.readAsDataURL(file)
    } catch (error) {
      resolve({
        success: false,
        error: error instanceof Error ? error.message : '图片处理过程中发生错误'
      })
    }
  })
}

// 图片增强 (调整亮度、对比度、饱和度)
export const enhanceImage = async (file: File, brightness = 1, contrast = 1, saturation = 1): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("无法获取 Canvas 上下文"))
        return
      }

      ctx.filter = `brightness(${brightness}) contrast(${contrast}) saturate(${saturation})`
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("图片增强失败"))
        },
        file.type,
        0.92,
      )
    }

    img.onerror = () => reject(new Error("图片加载失败"))
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(file)
  })
}

// 添加水印
export const addWatermark = async (
  file: File,
  watermarkText: string,
  position: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" = "bottom-right",
  opacity = 0.5,
  fontSize = 24,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("无法获取 Canvas 上下文"))
        return
      }

      ctx.drawImage(img, 0, 0)

      ctx.globalAlpha = opacity
      ctx.fillStyle = "white"
      ctx.strokeStyle = "black"
      ctx.lineWidth = 2
      ctx.font = `bold ${fontSize}px Arial`

      const textMetrics = ctx.measureText(watermarkText)
      const textWidth = textMetrics.width
      const textHeight = fontSize

      let x = 0
      let y = 0

      switch (position) {
        case "top-left":
          x = 20
          y = textHeight + 20
          break
        case "top-right":
          x = canvas.width - textWidth - 20
          y = textHeight + 20
          break
        case "bottom-left":
          x = 20
          y = canvas.height - 20
          break
        case "bottom-right":
          x = canvas.width - textWidth - 20
          y = canvas.height - 20
          break
        case "center":
          x = (canvas.width - textWidth) / 2
          y = canvas.height / 2
          break
      }

      ctx.strokeText(watermarkText, x, y)
      ctx.fillText(watermarkText, x, y)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("添加水印失败"))
        },
        file.type,
        0.92,
      )
    }

    img.onerror = () => reject(new Error("图片加载失败"))
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(file)
  })
}

// 应用滤镜
export const applyFilter = async (
  file: File,
  filter: "grayscale" | "sepia" | "blur" | "sharpen" | "invert" | "vintage",
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("无法获取 Canvas 上下文"))
        return
      }

      let filterString = ""
      switch (filter) {
        case "grayscale":
          filterString = "grayscale(100%)"
          break
        case "sepia":
          filterString = "sepia(100%)"
          break
        case "blur":
          filterString = "blur(5px)"
          break
        case "sharpen":
          filterString = "contrast(1.5) brightness(1.1)"
          break
        case "invert":
          filterString = "invert(100%)"
          break
        case "vintage":
          filterString = "sepia(50%) contrast(1.2) brightness(0.9)"
          break
      }

      ctx.filter = filterString
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("应用滤镜失败"))
        },
        file.type,
        0.92,
      )
    }

    img.onerror = () => reject(new Error("图片加载失败"))
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(file)
  })
}

// 裁剪图片
export const cropImage = async (file: File, x: number, y: number, width: number, height: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("无法获取 Canvas 上下文"))
        return
      }

      ctx.drawImage(img, x, y, width, height, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("裁剪失败"))
        },
        file.type,
        0.92,
      )
    }

    img.onerror = () => reject(new Error("图片加载失败"))
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(file)
  })
}

// 旋转图片
export const rotateImage = async (file: File, degrees: number): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement("canvas")
      const radians = (degrees * Math.PI) / 180

      if (degrees === 90 || degrees === 270) {
        canvas.width = img.height
        canvas.height = img.width
      } else {
        canvas.width = img.width
        canvas.height = img.height
      }

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("无法获取 Canvas 上下文"))
        return
      }

      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(radians)
      ctx.drawImage(img, -img.width / 2, -img.height / 2)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("旋转失败"))
        },
        file.type,
        0.92,
      )
    }

    img.onerror = () => reject(new Error("图片加载失败"))
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(file)
  })
}

// 翻转图片
export const flipImage = async (file: File, direction: "horizontal" | "vertical"): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("无法获取 Canvas 上下文"))
        return
      }

      if (direction === "horizontal") {
        ctx.translate(canvas.width, 0)
        ctx.scale(-1, 1)
      } else {
        ctx.translate(0, canvas.height)
        ctx.scale(1, -1)
      }

      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error("翻转失败"))
        },
        file.type,
        0.92,
      )
    }

    img.onerror = () => reject(new Error("图片加载失败"))
    reader.onerror = () => reject(new Error("文件读取失败"))
    reader.readAsDataURL(file)
  })
}

// 生成应用图标 (批量生成多个尺寸)
export const generateAppIcons = async (file: File, sizes: number[]): Promise<Map<number, Blob>> => {
  const results = new Map<number, Blob>()

  for (const size of sizes) {
    try {
      const blob = await resizeImage(file, size, size, false)
      results.set(size, blob)
    } catch (error) {
      console.error(`生成 ${size}x${size} 图标失败:`, error)
    }
  }

  return results
}

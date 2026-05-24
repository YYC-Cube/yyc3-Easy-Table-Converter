export const convertImage = async (file: File, targetFormat: string, quality = 0.92): Promise<Blob> => {
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

      // 处理透明背景 (针对 JPEG 格式)
      if (targetFormat === "jpeg") {
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("图片转换失败"))
          }
        },
        `image/${targetFormat}`,
        quality,
      )
    }

    img.onerror = () => {
      reject(new Error("图片加载失败"))
    }

    reader.onerror = () => {
      reject(new Error("文件读取失败"))
    }

    reader.readAsDataURL(file)
  })
}

export const getImageInfo = (file: File): Promise<{ width: number; height: number; size: number }> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
        size: file.size,
      })
    }

    img.onerror = () => reject(new Error("图片加载失败"))
    reader.onerror = () => reject(new Error("文件读取失败"))

    reader.readAsDataURL(file)
  })
}

export const convertImageBatch = async (
  file: File,
  targetFormat: string,
  quality: number,
  onProgress: (progress: number) => void,
): Promise<Blob> => {
  onProgress(0)

  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
      onProgress(30)
    }

    img.onload = () => {
      onProgress(50)
      const canvas = document.createElement("canvas")
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext("2d")
      if (!ctx) {
        reject(new Error("无法获取 Canvas 上下文"))
        return
      }

      if (targetFormat === "jpeg") {
        ctx.fillStyle = "#FFFFFF"
        ctx.fillRect(0, 0, canvas.width, canvas.height)
      }

      ctx.drawImage(img, 0, 0)
      onProgress(80)

      canvas.toBlob(
        (blob) => {
          if (blob) {
            onProgress(100)
            resolve(blob)
          } else {
            reject(new Error("图片转换失败"))
          }
        },
        `image/${targetFormat}`,
        quality,
      )
    }

    img.onerror = () => reject(new Error("图片加载失败"))
    reader.onerror = () => reject(new Error("文件读取失败"))

    reader.readAsDataURL(file)
  })
}

export const compressImage = async (file: File, maxWidth: number, maxHeight: number, quality = 0.8): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const reader = new FileReader()

    reader.onload = (e) => {
      img.src = e.target?.result as string
    }

    img.onload = () => {
      let { width, height } = img

      // 计算缩放比例
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width = Math.floor(width * ratio)
        height = Math.floor(height * ratio)
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
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error("图片压缩失败"))
          }
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

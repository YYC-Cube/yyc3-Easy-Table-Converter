interface ConvertOptions {
  format: string
  quality?: number // 0-100
  scale?: number // 0.1 - 1
  rotate?: number // 角度
  grayscale?: boolean
  blur?: number // 0-10
  clearExif?: boolean
}

/**
 * 将图片文件转换为指定格式的 Base64 字符串，支持裁剪、缩放、旋转、滤镜等
 */
export async function convertImageAdvanced(file: File, options: ConvertOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const ctx = canvas.getContext("2d")
        if (!ctx) return reject("Canvas 不支持")

        // 缩放
        const scale = options.scale ?? 1
        const width = img.width * scale
        const height = img.height * scale
        canvas.width = width
        canvas.height = height

        // 应用滤镜
        if (options.grayscale) ctx.filter = "grayscale(100%)"
        if (options.blur) ctx.filter += ` blur(${options.blur}px)`

        // 旋转
        if (options.rotate) {
          ctx.translate(width / 2, height / 2)
          ctx.rotate((options.rotate * Math.PI) / 180)
          ctx.translate(-width / 2, -height / 2)
        }

        ctx.drawImage(img, 0, 0, width, height)

        const mimeType = `image/${options.format === "jpg" ? "jpeg" : options.format}`
        const dataUrl = canvas.toDataURL(mimeType, (options.quality ?? 92) / 100)

        resolve(dataUrl)
      }
      img.onerror = () => reject("图片加载失败")
      img.src = reader.result as string
    }
    reader.onerror = () => reject("文件读取失败")
    reader.readAsDataURL(file)
  })
}

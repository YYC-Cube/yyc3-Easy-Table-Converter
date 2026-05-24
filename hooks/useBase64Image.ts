import { useToast } from "@/YYC_原油/hooks/use-toast"
import {
  encodeFileToBase64,
  isImageBase64,
  estimateBase64Size,
} from "@/YYC_原油/lib/converters/base64/base64Utils"

export function useBase64Image(setOutput: (v: string) => void, setPreview: (v: string) => void) {
  const { toast } = useToast()

  const encode = async (file: File | null) => {
    if (!file || !file.type.startsWith("image/")) {
      toast({ title: "文件类型错误", description: "请选择图片文件", variant: "destructive" })
      return
    }

    try {
      const base64 = await encodeFileToBase64(file)
      setOutput(base64)
      setPreview(base64)
      toast({ title: "编码成功", description: `图片已转换为 Base64（约 ${estimateBase64Size(base64)} 字节）` })
    } catch {
      toast({ title: "编码失败", description: "图片读取失败", variant: "destructive" })
    }
  }

  const decode = (input: string) => {
    if (!input.trim()) {
      toast({ title: "请输入 Base64", description: "请输入图片的 Base64 字符串", variant: "destructive" })
      return
    }

    if (!isImageBase64(input)) {
      toast({ title: "解码失败", description: "不是有效的图片 Base64 格式", variant: "destructive" })
      return
    }

    setPreview(input)
    toast({ title: "解码成功", description: "Base64 已转换为图片" })
  }

  return { encode, decode }
}

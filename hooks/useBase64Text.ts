import { useToast } from "@/YYC_原油/hooks/use-toast"
import { encodeTextToBase64, decodeBase64ToText } from "@/YYC_原油/lib/converters/base64/base64Utils"

export function useBase64Text(setOutput: (v: string) => void) {
  const { toast } = useToast()

  const encode = (input: string) => {
    if (!input.trim()) {
      toast({ title: "请输入文本", description: "请在输入框中输入要编码的文本", variant: "destructive" })
      return
    }

    try {
      const encoded = encodeTextToBase64(input)
      setOutput(encoded)
      toast({ title: "编码成功", description: `文本已转换为 Base64（${encoded.length} 字符）` })
    } catch {
      toast({ title: "编码失败", description: "文本编码过程中出现错误", variant: "destructive" })
    }
  }

  const decode = (input: string) => {
    if (!input.trim()) {
      toast({ title: "请输入 Base64", description: "请在输入框中输入要解码的 Base64 字符串", variant: "destructive" })
      return
    }

    try {
      const decoded = decodeBase64ToText(input)
      setOutput(decoded)
      toast({ title: "解码成功", description: `Base64 已转换为文本（${decoded.length} 字符）` })
    } catch {
      toast({ title: "解码失败", description: "Base64 格式不正确或解码过程中出现错误", variant: "destructive" })
    }
  }

  return { encode, decode }
}

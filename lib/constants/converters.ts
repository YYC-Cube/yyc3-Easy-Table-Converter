import type { ConverterTool } from "@/lib/types"

export const converterTools: ConverterTool[] = [
  {
    id: "pdf-compress",
    title: "PDF 智能压缩",
    description: "优化PDF文件大小，保持文档质量，支持批量处理",
    icon: "Minimize2",
    path: "/converters/pdf-compress",
    category: "pdf"
  },
  {
    id: "document-merge",
    title: "文档合并工具",
    description: "合并多个PDF文件为一个，支持顺序调整和页面预览",
    icon: "FilePlus2",
    path: "/converters/document-merge",
    category: "pdf"
  },
  {
    id: "document-split",
    title: "文档拆分工具",
    description: "按页码或提取页面拆分PDF文件，支持批量导出",
    icon: "FileMinus2",
    path: "/converters/document-split",
    category: "pdf"
  },
  {
    id: "table",
    title: "表格格式转换",
    description: "支持 CSV、TSV、JSON、Markdown、HTML、SQL 等多种表格格式互转",
    icon: "Table",
    path: "/converters/table",
    category: "data"
  },
  {
    id: "csv-json",
    title: "CSV/JSON 互转",
    description: "CSV 与 JSON 数据格式互转，支持格式化和预览",
    icon: "FileSpreadsheet",
    path: "/converters/csv-json",
    category: "data"
  },
  {
    id: "json-xml",
    title: "JSON/XML 互转",
    description: "JSON 与 XML 数据格式互转，支持格式化",
    icon: "Code",
    path: "/converters/json-xml",
    category: "data"
  },
  {
    id: "timestamp",
    title: "时间戳转换",
    description: "时间戳与日期时间互转，支持多种时区",
    icon: "Clock",
    path: "/converters/timestamp",
    category: "data"
  },
  {
    id: "sql-generator",
    title: "SQL 生成器",
    description: "JSON/CSV 转 SQL 语句，支持多种数据库",
    icon: "Database",
    path: "/converters/sql-generator",
    category: "data"
  },
  {
    id: "excel-advanced",
    title: "Excel 高级转换",
    description: "Excel 与多格式互转，支持保留公式和样式",
    icon: "FileSpreadsheet",
    path: "/converters/excel-advanced",
    category: "data"
  },
  {
    id: "excel-csv",
    title: "Excel/CSV 互转",
    description: "Excel 与 CSV 格式互转，支持多 Sheet",
    icon: "FileSpreadsheet",
    path: "/converters/excel-csv",
    category: "data"
  },
  {
    id: "data-unit",
    title: "数据单位转换",
    description: "数据存储单位转换，Byte、KB、MB、GB、TB 等",
    icon: "HardDrive",
    path: "/converters/data-unit",
    category: "data"
  },
  {
    id: "data-validation",
    title: "数据验证工具",
    description: "JSON Schema 验证、数据格式检查",
    icon: "CheckCircle2",
    path: "/converters/data-validation",
    category: "data"
  },
  {
    id: "image",
    title: "图片格式转换",
    description: "支持 PNG、JPG、WEBP、GIF、BMP 等图片格式互转，支持质量调整",
    icon: "ImageIcon",
    path: "/converters/image",
    category: "image"
  },
  {
    id: "image-compress",
    title: "图片压缩优化",
    description: "智能压缩图片大小，保持画质，支持批量处理",
    icon: "Minimize2",
    path: "/converters/image-compress",
    category: "image"
  },
  {
    id: "image-resize",
    title: "图片尺寸调整",
    description: "调整图片尺寸，支持预设尺寸（iOS/Android图标、社交媒体等）",
    icon: "Maximize2",
    path: "/converters/image-resize",
    category: "image"
  },
  {
    id: "background-remove",
    title: "一键抠图",
    description: "AI智能去除图片背景，支持人像、产品、Logo等场景",
    icon: "Scissors",
    path: "/converters/background-remove",
    category: "image"
  },
  {
    id: "background-replace",
    title: "背景替换",
    description: "智能替换图片背景，支持自定义背景图片",
    icon: "ImageIcon",
    path: "/converters/background-replace",
    category: "image"
  },
  {
    id: "image-enhance",
    title: "照片增强",
    description: "智能优化照片亮度、对比度、饱和度，一键美化",
    icon: "Wand2",
    path: "/converters/image-enhance",
    category: "image"
  },
  {
    id: "watermark",
    title: "水印添加",
    description: "为图片添加文字或图片水印，支持位置、透明度调整",
    icon: "Droplet",
    path: "/converters/watermark",
    category: "image"
  },
  {
    id: "image-filter",
    title: "滤镜效果",
    description: "应用各种滤镜效果：黑白、复古、模糊、锐化等",
    icon: "Sparkles",
    path: "/converters/image-filter",
    category: "image"
  },
  {
    id: "app-icon",
    title: "应用图标生成",
    description: "一键生成 iOS、Android、Web 所需的全套应用图标",
    icon: "Smartphone",
    path: "/converters/app-icon",
    category: "image"
  },
  {
    id: "favicon",
    title: "网站图标生成",
    description: "生成 Favicon.ico 和各种尺寸的网站图标",
    icon: "Globe",
    path: "/converters/favicon",
    category: "image"
  },
  {
    id: "badge",
    title: "徽章生成器",
    description: "生成 GitHub 风格的徽章，支持自定义文字、颜色",
    icon: "Award",
    path: "/converters/badge",
    category: "image"
  },
  {
    id: "svg-optimize",
    title: "SVG 优化",
    description: "压缩和优化 SVG 文件，减小文件大小",
    icon: "Code2",
    path: "/converters/svg-optimize",
    category: "image"
  },
  {
    id: "image-crop",
    title: "图片裁剪",
    description: "自由裁剪图片，支持固定比例和自定义裁剪",
    icon: "Crop",
    path: "/converters/image-crop",
    category: "image"
  },
  {
    id: "image-rotate",
    title: "图片旋转翻转",
    description: "旋转、翻转图片，支持任意角度旋转",
    icon: "RotateCw",
    path: "/converters/image-rotate",
    category: "image"
  },
  {
    id: "image-editor",
    title: "图片编辑器高级版",
    description: "多功能图片编辑工具，支持去水印、去文字、橡皮擦、裁剪等",
    icon: "ImageIcon",
    path: "/converters/image-editor",
    category: "image"
  },
  {
    id: "gif-maker",
    title: "GIF 动画制作",
    description: "图片序列转 GIF，支持设置帧率和循环",
    icon: "Play",
    path: "/converters/gif-maker",
    category: "image"
  },
  {
    id: "cartoon-filter",
    title: "卡通滤镜",
    description: "将图片转换为卡通风格，支持多种风格选择",
    icon: "Sparkles",
    path: "/converters/cartoon-filter",
    category: "image"
  },
  {
    id: "style-transfer",
    title: "风格迁移",
    description: "AI风格迁移，将图片转换为不同艺术风格",
    icon: "Palette",
    path: "/converters/style-transfer",
    category: "image"
  },
  {
    id: "super-resolution",
    title: "超分辨率",
    description: "AI图片放大，提升图片分辨率和清晰度",
    icon: "Maximize",
    path: "/converters/super-resolution",
    category: "image"
  },
  {
    id: "face-editor",
    title: "人像编辑器",
    description: "AI人像美化、磨皮、瘦脸、美颜等功能",
    icon: "User",
    path: "/converters/face-editor",
    category: "image"
  },
  {
    id: "batch-image-process",
    title: "批量图片处理",
    description: "批量处理多张图片，支持压缩、转换、调整尺寸",
    icon: "Layers",
    path: "/converters/batch-image-process",
    category: "image"
  },
  {
    id: "base64",
    title: "Base64 编解码",
    description: "图片、文本与 Base64 格式互转，支持拖拽上传",
    icon: "FileCode",
    path: "/converters/base64",
    category: "text"
  },
  {
    id: "encoding",
    title: "文本编码转换",
    description: "UTF-8、GBK、ASCII、Unicode 等编码格式互转",
    icon: "FileText",
    path: "/converters/encoding",
    category: "text"
  },
  {
    id: "text-deduplication",
    title: "文本去重",
    description: "去除文本中的重复行，支持多种去重规则",
    icon: "FileText",
    path: "/converters/text-deduplication",
    category: "text"
  },
  {
    id: "text-diff",
    title: "文本对比",
    description: "对比两段文本的差异，高亮显示变更",
    icon: "GitCompare",
    path: "/converters/text-diff",
    category: "text"
  },
  {
    id: "text-summary",
    title: "文本摘要",
    description: "AI生成文本摘要，提取关键信息",
    icon: "FileText",
    path: "/converters/text-summary",
    category: "text"
  },
  {
    id: "text-translation",
    title: "文本翻译",
    description: "多语言文本翻译，支持上传下载翻译文件",
    icon: "Languages",
    path: "/converters/text-translation",
    category: "text"
  },
  {
    id: "meme-generator",
    title: "表情包生成器",
    description: "自定义表情包，添加文字和效果",
    icon: "Smile",
    path: "/converters/meme-generator",
    category: "text"
  },
  {
    id: "color",
    title: "颜色格式转换",
    description: "HEX、RGB、HSL 颜色格式互转，支持颜色选择器",
    icon: "Palette",
    path: "/converters/color",
    category: "color"
  },
  {
    id: "color-blind-simulator",
    title: "色盲模拟器",
    description: "模拟色盲视角，查看设计的可访问性",
    icon: "Eye",
    path: "/converters/color-blind-simulator",
    category: "color"
  },
  {
    id: "contrast-checker",
    title: "对比度检查器",
    description: "检查文字与背景的对比度，确保可访问性",
    icon: "Eye",
    path: "/converters/contrast-checker",
    category: "color"
  },
  {
    id: "gradient-generator",
    title: "渐变生成器",
    description: "生成漂亮的渐变色，支持多种渐变类型",
    icon: "Palette",
    path: "/converters/gradient-generator",
    category: "color"
  },
  {
    id: "palette-generator",
    title: "调色板生成器",
    description: "从图片提取颜色或生成和谐配色方案",
    icon: "Palette",
    path: "/converters/palette-generator",
    category: "color"
  },
  {
    id: "unit",
    title: "单位换算器",
    description: "长度、重量、温度、面积、体积等常用单位换算",
    icon: "Calculator",
    path: "/converters/unit",
    category: "unit"
  },
  {
    id: "currency",
    title: "货币换算器",
    description: "实时汇率换算，支持多种货币",
    icon: "DollarSign",
    path: "/converters/currency",
    category: "unit"
  },
  {
    id: "angle",
    title: "角度换算器",
    description: "度、弧度、梯度等角度单位换算",
    icon: "Compass",
    path: "/converters/angle",
    category: "unit"
  },
  {
    id: "energy",
    title: "能量换算器",
    description: "焦耳、卡路里、千瓦时等能量单位换算",
    icon: "Zap",
    path: "/converters/energy",
    category: "unit"
  },
  {
    id: "encrypt-decrypt",
    title: "加密解密工具",
    description: "MD5、SHA、AES 等多种加密算法",
    icon: "Lock",
    path: "/converters/encrypt-decrypt",
    category: "crypto"
  },
  {
    id: "hash-calculator",
    title: "哈希计算器",
    description: "计算文件或文本的 MD5、SHA-1、SHA-256 等哈希值",
    icon: "Fingerprint",
    path: "/converters/hash-calculator",
    category: "crypto"
  },
  {
    id: "password-generator",
    title: "密码生成器",
    description: "生成高强度随机密码，支持自定义规则",
    icon: "Key",
    path: "/converters/password-generator",
    category: "crypto"
  },
  {
    id: "url-encoder",
    title: "URL 编解码",
    description: "URL 编码和解码，支持 query 参数处理",
    icon: "Link",
    path: "/converters/url-encoder",
    category: "network"
  },
  {
    id: "ip-lookup",
    title: "IP 地址查询",
    description: "查询 IP 地址的地理位置和归属信息",
    icon: "MapPin",
    path: "/converters/ip-lookup",
    category: "network"
  },
  {
    id: "whois-lookup",
    title: "WHOIS 查询",
    description: "查询域名的注册信息和到期时间",
    icon: "Globe",
    path: "/converters/whois-lookup",
    category: "network"
  },
  {
    id: "website-status",
    title: "网站状态检查",
    description: "检查网站是否在线，获取响应时间",
    icon: "Activity",
    path: "/converters/website-status",
    category: "network"
  },
  {
    id: "regex-tester",
    title: "正则表达式测试器",
    description: "在线测试正则表达式，支持多种语言",
    icon: "Code",
    path: "/converters/regex-tester",
    category: "developer"
  },
  {
    id: "yaml-json",
    title: "YAML/JSON 互转",
    description: "YAML 与 JSON 数据格式互转",
    icon: "Code",
    path: "/converters/yaml-json",
    category: "developer"
  },
  {
    id: "toml-json",
    title: "TOML/JSON 互转",
    description: "TOML 与 JSON 数据格式互转",
    icon: "Code",
    path: "/converters/toml-json",
    category: "developer"
  },
  {
    id: "yaml",
    title: "YAML 格式化",
    description: "格式化和美化 YAML 代码",
    icon: "Code",
    path: "/converters/yaml",
    category: "developer"
  },
  {
    id: "toml",
    title: "TOML 格式化",
    description: "格式化和美化 TOML 代码",
    icon: "Code",
    path: "/converters/toml",
    category: "developer"
  },
  {
    id: "settings",
    title: "用户设置",
    description: "自定义应用体验和偏好设置，主题、语言等",
    icon: "Settings",
    path: "/settings",
    category: "other"
  },
  {
    id: "industries",
    title: "行业数据平台",
    description: "行业数据处理与拓展接口，支持多行业插件化扩展",
    icon: "Building2",
    path: "/industries",
    category: "other"
  },
  {
    id: "storage",
    title: "存储管理",
    description: "管理云端存储授权和文件管理",
    icon: "HardDrive",
    path: "/storage",
    category: "other"
  },
  {
    id: "dashboard",
    title: "工具仪表盘",
    description: "所有工具的统一入口和管理界面",
    icon: "LayoutDashboard",
    path: "/dashboard",
    category: "other"
  }
]

export const categoryLabels = {
  data: "数据格式",
  image: "图片处理",
  text: "文本工具",
  color: "颜色工具",
  unit: "单位换算",
  pdf: "PDF处理",
  crypto: "加密安全",
  network: "网络工具",
  developer: "开发工具",
  other: "其他工具"
}

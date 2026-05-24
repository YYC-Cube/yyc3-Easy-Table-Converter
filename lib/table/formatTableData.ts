import { parseCSV, parseTSV, parseJSON } from "./parsers"
import { toCSV, toTSV, toMarkdown, toHTML, toSQL } from "./serializers"

export function formatTableData(input: string, format: string): string {
  let data: any[] = []

  try {
    if (input.trim().startsWith("{") || input.trim().startsWith("[")) {
      data = parseJSON(input)
    } else if (input.includes("\t")) {
      data = parseTSV(input)
    } else {
      data = parseCSV(input)
    }
  } catch (err) {
    return `解析失败：${(err as Error).message}`
  }

  switch (format) {
    case "csv":
      return toCSV(data)
    case "tsv":
      return toTSV(data)
    case "markdown":
      return toMarkdown(data)
    case "html":
      return toHTML(data)
    case "sql":
      return toSQL(data)
    default:
      return "不支持的格式"
  }
}

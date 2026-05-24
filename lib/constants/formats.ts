import type { Format } from "../types"

export const formats: Format[] = [
  { value: "csv", label: "CSV", icon: "📊", extension: "csv", mimeType: "text/csv" },
  { value: "tsv", label: "TSV", icon: "📋", extension: "tsv", mimeType: "text/tab-separated-values" },
  { value: "html", label: "HTML", icon: "🌐", extension: "html", mimeType: "text/html" },
  { value: "excel", label: "Excel", icon: "📈", extension: "csv", mimeType: "text/csv" },
  { value: "markdown", label: "Markdown", icon: "📝", extension: "md", mimeType: "text/markdown" },
  { value: "latex", label: "LaTeX", icon: "📄", extension: "tex", mimeType: "text/plain" },
  { value: "sql", label: "SQL", icon: "🗄️", extension: "sql", mimeType: "text/plain" },
  { value: "json", label: "JSON", icon: "🔧", extension: "json", mimeType: "application/json" },
  { value: "yaml", label: "YAML", icon: "⚙️", extension: "yml", mimeType: "text/yaml" },
  { value: "xml", label: "XML", icon: "📰", extension: "xml", mimeType: "text/xml" },
  { value: "ascii", label: "ASCII", icon: "💻", extension: "txt", mimeType: "text/plain" },
]

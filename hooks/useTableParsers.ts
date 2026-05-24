"use client"

import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/hooks/useLanguage"

export const useTableParsers = () => {
  const { toast } = useToast()
  const { t } = useLanguage()

  const parseCSVData = (data: string): string[][] => {
    const lines = data.split("\n").filter((line) => line.trim())
    return lines.map((line) => line.split(",").map((cell) => cell.trim()))
  }

  const parseTSVData = (data: string): string[][] => {
    const lines = data.split("\n").filter((line) => line.trim())
    return lines.map((line) => line.split("\t").map((cell) => cell.trim()))
  }

  const parseHTMLData = (data: string): string[][] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(data, "text/html")
    const table = doc.querySelector("table")
    if (!table) throw new Error(t("messages.parseError"))

    const rows: string[][] = []
    const tableRows = table.querySelectorAll("tr")

    tableRows.forEach((row) => {
      const cells = row.querySelectorAll("th, td")
      const rowData = Array.from(cells).map((cell) => cell.textContent?.trim() || "")
      if (rowData.length > 0) rows.push(rowData)
    })

    return rows
  }

  const parseMarkdownData = (data: string): string[][] => {
    const lines = data.split("\n").filter((line) => line.trim() && line.includes("|"))
    const rows: string[][] = []

    lines.forEach((line) => {
      if (line.includes("---")) return

      const cells = line
        .split("|")
        .map((cell) => cell.trim())
        .filter((cell) => cell !== "")

      if (cells.length > 0) rows.push(cells)
    })

    return rows
  }

  const parseLaTeXData = (data: string): string[][] => {
    const rows: string[][] = []
    const lines = data.split("\n")

    let inTable = false
    for (const line of lines) {
      if (line.includes("\\begin{tabular}")) {
        inTable = true
        continue
      }
      if (line.includes("\\end{tabular}")) break
      if (line.includes("\\hline")) continue

      if (inTable && line.trim()) {
        const cells = line.split("&").map((cell) => cell.replace(/\\\\/g, "").trim())
        if (cells.length > 0 && cells[0] !== "") {
          rows.push(cells)
        }
      }
    }

    return rows
  }

  const parseSQLData = (text: string): string[][] => {
    if (!/^INSERT\s+INTO/i.test(text)) return []

    // 複数レコードを含む INSERT 文が連なっているケース
    const insertStmts = text.match(/INSERT\s+INTO[^(]+$$[^)]+$$\s+VALUES\s*$$[^)]+$$;?/gi)
    if (insertStmts?.length) {
      let header: string[] | null = null
      const rows: string[][] = []

      insertStmts.forEach((stmt) => {
        const m = stmt.match(/^INSERT\s+INTO\s+\S+\s*$$([^)]+)$$\s*VALUES\s*$$([^)]+)$$;?$/i)
        if (m) {
          const cols = m[1].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
          const vals = m[2]
            .split(/,(?=(?:[^']*'[^']*')*[^']*$)/)
            .map((v) => v.trim().replace(/^'/, "").replace(/'$/, ""))
          if (!header) header = cols
          rows.push(vals)
        }
      })

      if (header) return [header, ...rows]
    }

    // 1 本の INSERT 文で複数 VALUES のパターン
    const colMatch = text.match(/^INSERT\s+INTO\s+\S+\s*$$([^)]+)$$\s*VALUES\s*(.+);?$/i)
    if (colMatch) {
      const cols = colMatch[1].split(",").map((c) => c.trim().replace(/^"|"$/g, ""))
      const valsPart = colMatch[2].trim().replace(/;$/, "")
      const valGroups = valsPart
        .replace(/^$$/, "")
        .replace(/$$$/, "")
        .split(/\)\s*,\s*\(/)

      const rows: string[][] = [cols]
      valGroups.forEach((grp) => {
        const cells = grp.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((v) => v.trim().replace(/^'/, "").replace(/'$/, ""))
        rows.push(cells)
      })
      return rows
    }

    // VALUES (...) だけが羅列されているケース
    const groups = Array.from(text.matchAll(/$$([^)]*)$$/g)).map((m) => m[1])
    if (groups.length) {
      const rows: string[][] = []
      groups.forEach((grp) => {
        const cells = grp.split(/,(?=(?:[^']*'[^']*')*[^']*$)/).map((v) => v.trim().replace(/^'/, "").replace(/'$/, ""))
        rows.push(cells)
      })
      return rows
    }

    return []
  }

  const parseJSONData = (data: string): string[][] => {
    const jsonData = JSON.parse(data)
    if (!Array.isArray(jsonData) || jsonData.length === 0) {
      throw new Error(t("messages.parseError"))
    }

    const headers = Object.keys(jsonData[0])
    const rows: string[][] = [headers]

    jsonData.forEach((item) => {
      const row = headers.map((header) => String(item[header] || ""))
      rows.push(row)
    })

    return rows
  }

  const parseYAMLData = (data: string): string[][] => {
    const lines = data.split("\n").filter((line) => line.trim())
    const items: any[] = []
    let currentItem: any = {}

    for (const line of lines) {
      if (line.startsWith("- ")) {
        if (Object.keys(currentItem).length > 0) {
          items.push(currentItem)
        }
        currentItem = {}
        const keyValue = line.substring(2).split(":")
        if (keyValue.length === 2) {
          currentItem[keyValue[0].trim()] = keyValue[1].trim()
        }
      } else if (line.includes(":")) {
        const keyValue = line.split(":")
        if (keyValue.length === 2) {
          currentItem[keyValue[0].trim()] = keyValue[1].trim()
        }
      }
    }

    if (Object.keys(currentItem).length > 0) {
      items.push(currentItem)
    }

    if (items.length === 0) throw new Error(t("messages.parseError"))

    const headers = Object.keys(items[0])
    const rows: string[][] = [headers]

    items.forEach((item) => {
      const row = headers.map((header) => String(item[header] || ""))
      rows.push(row)
    })

    return rows
  }

  const parseXMLData = (data: string): string[][] => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(data, "text/xml")
    const records = doc.querySelectorAll("record")

    if (records.length === 0) throw new Error(t("messages.parseError"))

    const headers: string[] = []
    const firstRecord = records[0]
    firstRecord.childNodes.forEach((node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        headers.push(node.nodeName)
      }
    })

    const rows: string[][] = [headers]

    records.forEach((record) => {
      const row: string[] = []
      headers.forEach((header) => {
        const element = record.querySelector(header)
        row.push(element?.textContent?.trim() || "")
      })
      rows.push(row)
    })

    return rows
  }

  const parseASCIIData = (data: string): string[][] => {
    const lines = data.split("\n").filter((line) => line.trim())
    const rows: string[][] = []

    for (const line of lines) {
      if (line.startsWith("+") || line.trim() === "") continue

      if (line.startsWith("|")) {
        const cells = line
          .split("|")
          .map((cell) => cell.trim())
          .filter((cell) => cell !== "")

        if (cells.length > 0) {
          rows.push(cells)
        }
      }
    }

    return rows
  }

  const parseInputData = (data: string, format: string): string[][] => {
    try {
      let result: string[][] = []
      switch (format) {
        case "csv":
        case "excel":
          result = parseCSVData(data)
          break
        case "tsv":
          result = parseTSVData(data)
          break
        case "html":
          result = parseHTMLData(data)
          break
        case "markdown":
          result = parseMarkdownData(data)
          break
        case "latex":
          result = parseLaTeXData(data)
          break
        case "sql":
          result = parseSQLData(data)
          break
        case "json":
          result = parseJSONData(data)
          break
        case "yaml":
          result = parseYAMLData(data)
          break
        case "xml":
          result = parseXMLData(data)
          break
        case "ascii":
          result = parseASCIIData(data)
          break
        default:
          result = parseCSVData(data)
      }
      return result
    } catch (error) {
      toast({
        title: t("messages.parseError"),
        description: `${format.toUpperCase()}${t("messages.parseErrorDesc")}`,
        variant: "destructive",
      })
      return []
    }
  }

  return { parseInputData }
}

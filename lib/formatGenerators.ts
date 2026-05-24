export const generateOutput = (format: string, data: string[][]) => {
  if (data.length === 0) return ""

  switch (format) {
    case "csv":
      return data.map((row) => row.join(",")).join("\n")
    case "tsv":
      return data.map((row) => row.join("\t")).join("\n")
    case "html":
      const headers = data[0]
      const rows = data.slice(1)
      return `<table>
  <thead>
    <tr>${headers.map((h) => `<th>${h}</th>`).join("")}</tr>
  </thead>
  <tbody>
${rows.map((row) => `    <tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`).join("\n")}
  </tbody>
</table>`
    case "markdown":
      const mdHeaders = data[0]
      const mdRows = data.slice(1)
      const headerRow = `| ${mdHeaders.join(" | ")} |`
      const separatorRow = `| ${mdHeaders.map(() => "---").join(" | ")} |`
      const dataRows = mdRows.map((row) => `| ${row.join(" | ")} |`).join("\n")
      return `${headerRow}\n${separatorRow}\n${dataRows}`
    case "json":
      const headers2 = data[0]
      const rows2 = data.slice(1)
      const jsonData = rows2.map((row) => {
        const obj: any = {}
        headers2.forEach((header, index) => {
          obj[header] = row[index]
        })
        return obj
      })
      return JSON.stringify(jsonData, null, 2)
    case "sql":
      const tableName = "sample_table"
      const headers3 = data[0]
      const rows3 = data.slice(1)
      const createTable = `CREATE TABLE ${tableName} (\n  ${headers3.map((h) => `${h} VARCHAR(255)`).join(",\n  ")}\n);`
      const insertRows = rows3
        .map(
          (row) =>
            `INSERT INTO ${tableName} (${headers3.join(", ")}) VALUES (${row.map((cell) => `'${cell}'`).join(", ")});`,
        )
        .join("\n")
      return `${createTable}\n\n${insertRows}`
    case "yaml":
      const headers4 = data[0]
      const rows4 = data.slice(1)
      const yamlData = rows4.map((row) => {
        const obj: any = {}
        headers4.forEach((header, index) => {
          obj[header] = row[index]
        })
        return obj
      })
      return yamlData
        .map(
          (item, index) =>
            `- ${Object.entries(item)
              .map(([key, value]) => `${key}: ${value}`)
              .join("\n  ")}`,
        )
        .join("\n")
    case "xml":
      const headers5 = data[0]
      const rows5 = data.slice(1)
      const xmlRows = rows5
        .map((row) => {
          const fields = headers5.map((header, index) => `    <${header}>${row[index]}</${header}>`).join("\n")
          return `  <record>\n${fields}\n  </record>`
        })
        .join("\n")
      return `<?xml version="1.0" encoding="UTF-8"?>\n<data>\n${xmlRows}\n</data>`
    case "ascii":
      const colWidths = data[0].map((_, colIndex) => Math.max(...data.map((row) => (row[colIndex] || "").length)))
      const separator = "+" + colWidths.map((width) => "-".repeat(width + 2)).join("+") + "+"
      const formatRow = (row: string[]) =>
        "|" + row.map((cell, index) => ` ${(cell || "").padEnd(colWidths[index])} `).join("|") + "|"
      return [separator, formatRow(data[0]), separator, ...data.slice(1).map(formatRow), separator].join("\n")
    default:
      return data.map((row) => row.join(",")).join("\n")
  }
}

export function toCSV(data: any[]): string {
  const headers = Object.keys(data[0] || {})
  const rows = data.map((row) => headers.map((h) => row[h]).join(","))
  return [headers.join(","), ...rows].join("\n")
}

export function toTSV(data: any[]): string {
  const headers = Object.keys(data[0] || {})
  const rows = data.map((row) => headers.map((h) => row[h]).join("\t"))
  return [headers.join("\t"), ...rows].join("\n")
}

export function toMarkdown(data: any[]): string {
  const headers = Object.keys(data[0] || {})
  const headerRow = `| ${headers.join(" | ")} |`
  const separator = `| ${headers.map(() => "---").join(" | ")} |`
  const rows = data.map((row) => `| ${headers.map((h) => row[h]).join(" | ")} |`)
  return [headerRow, separator, ...rows].join("\n")
}

export function toHTML(data: any[]): string {
  const headers = Object.keys(data[0] || {})
  const headerRow = headers.map((h) => `<th>${h}</th>`).join("")
  const rows = data
    .map((row) => `<tr>${headers.map((h) => `<td>${row[h]}</td>`).join("")}</tr>`)
    .join("")
  return `<table><thead><tr>${headerRow}</tr></thead><tbody>${rows}</tbody></table>`
}

export function toSQL(data: any[]): string {
  const tableName = "converted_table"
  const headers = Object.keys(data[0] || {})
  const values = data
    .map((row) => `(${headers.map((h) => `'${row[h]}'`).join(", ")})`)
    .join(",\n")
  return `INSERT INTO ${tableName} (${headers.join(", ")}) VALUES\n${values};`
}

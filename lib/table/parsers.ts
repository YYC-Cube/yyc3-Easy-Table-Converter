export function parseCSV(input: string): any[] {
  const lines = input.trim().split("\n")
  const headers = lines[0].split(",")
  return lines.slice(1).map((line) => {
    const values = line.split(",")
    return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim()]))
  })
}

export function parseTSV(input: string): any[] {
  const lines = input.trim().split("\n")
  const headers = lines[0].split("\t")
  return lines.slice(1).map((line) => {
    const values = line.split("\t")
    return Object.fromEntries(headers.map((h, i) => [h.trim(), values[i]?.trim()]))
  })
}

export function parseJSON(input: string): any[] {
  const parsed = JSON.parse(input)
  return Array.isArray(parsed) ? parsed : [parsed]
}

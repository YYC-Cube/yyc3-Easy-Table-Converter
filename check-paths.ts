#!/usr/bin/env ts-node

import * as fs from 'fs'
import * as path from 'path'

const converters = [
  { id: "pdf-compress", path: "/converters/pdf-compress" },
  { id: "document-merge", path: "/converters/document-merge" },
  { id: "document-split", path: "/converters/document-split" },
  { id: "table", path: "/converters/table" },
  { id: "csv-json", path: "/converters/csv-json" },
  { id: "json-xml", path: "/converters/json-xml" },
  { id: "timestamp", path: "/converters/timestamp" },
  { id: "sql-generator", path: "/converters/sql-generator" },
  { id: "excel-advanced", path: "/converters/excel-advanced" },
  { id: "excel-csv", path: "/converters/excel-csv" },
  { id: "data-unit", path: "/converters/data-unit" },
  { id: "data-validation", path: "/converters/data-validation" },
  { id: "image", path: "/converters/image" },
  { id: "image-compress", path: "/converters/image-compress" },
  { id: "image-resize", path: "/converters/image-resize" },
  { id: "background-remove", path: "/converters/background-remove" },
  { id: "background-replace", path: "/converters/background-replace" },
  { id: "image-enhance", path: "/converters/image-enhance" },
  { id: "watermark", path: "/converters/watermark" },
  { id: "image-filter", path: "/converters/image-filter" },
  { id: "app-icon", path: "/converters/app-icon" },
  { id: "favicon", path: "/converters/favicon" },
  { id: "badge", path: "/converters/badge" },
  { id: "svg-optimize", path: "/converters/svg-optimize" },
  { id: "image-crop", path: "/converters/image-crop" },
  { id: "image-rotate", path: "/converters/image-rotate" },
  { id: "image-editor", path: "/converters/image-editor" },
  { id: "gif-maker", path: "/converters/gif-maker" },
  { id: "cartoon-filter", path: "/converters/cartoon-filter" },
  { id: "style-transfer", path: "/converters/style-transfer" },
  { id: "super-resolution", path: "/converters/super-resolution" },
  { id: "face-editor", path: "/converters/face-editor" },
  { id: "batch-image-process", path: "/converters/batch-image-process" },
  { id: "base64", path: "/converters/base64" },
  { id: "encoding", path: "/converters/encoding" },
  { id: "text-deduplication", path: "/converters/text-deduplication" },
  { id: "text-diff", path: "/converters/text-diff" },
  { id: "text-summary", path: "/converters/text-summary" },
  { id: "text-translation", path: "/converters/text-translation" },
  { id: "meme-generator", path: "/converters/meme-generator" },
  { id: "color", path: "/converters/color" },
  { id: "color-blind-simulator", path: "/converters/color-blind-simulator" },
  { id: "contrast-checker", path: "/converters/contrast-checker" },
  { id: "gradient-generator", path: "/converters/gradient-generator" },
  { id: "palette-generator", path: "/converters/palette-generator" },
  { id: "unit", path: "/converters/unit" },
  { id: "currency", path: "/converters/currency" },
  { id: "angle", path: "/converters/angle" },
  { id: "energy", path: "/converters/energy" },
  { id: "encrypt-decrypt", path: "/converters/encrypt-decrypt" },
  { id: "hash-calculator", path: "/converters/hash-calculator" },
  { id: "password-generator", path: "/converters/password-generator" },
  { id: "url-encoder", path: "/converters/url-encoder" },
  { id: "ip-lookup", path: "/converters/ip-lookup" },
  { id: "whois-lookup", path: "/converters/whois-lookup" },
  { id: "website-status", path: "/converters/website-status" },
  { id: "regex-tester", path: "/converters/regex-tester" },
  { id: "yaml-json", path: "/converters/yaml-json" },
  { id: "toml-json", path: "/converters/toml-json" },
  { id: "yaml", path: "/converters/yaml" },
  { id: "toml", path: "/converters/toml" },
]

const baseDir = path.join(__dirname, 'app', 'converters')
const missingPages: string[] = []
const foundPages: string[] = []

console.log('🔍 检查工具页面路径...\n')

converters.forEach(tool => {
  const toolPath = tool.path.replace('/converters/', '')
  const pagePath = path.join(baseDir, toolPath, 'page.tsx')
  
  if (fs.existsSync(pagePath)) {
    foundPages.push(tool.id)
  } else {
    missingPages.push(tool.id)
    console.log(`❌ 缺失页面: ${tool.id} (${pagePath})`)
  }
})

console.log(`\n✅ 找到 ${foundPages.length} 个页面`)
console.log(`❌ 缺失 ${missingPages.length} 个页面`)

if (missingPages.length > 0) {
  console.log('\n缺失的工具:')
  missingPages.forEach(id => console.log(`  - ${id}`))
}

// 徽章生成器

export interface BadgeConfig {
  label: string
  message: string
  labelColor: string
  messageColor: string
  style: "flat" | "flat-square" | "plastic" | "for-the-badge"
}

export const generateBadgeSVG = (config: BadgeConfig): string => {
  const { label, message, labelColor, messageColor, style } = config

  const labelWidth = label.length * 7 + 10
  const messageWidth = message.length * 7 + 10
  const totalWidth = labelWidth + messageWidth
  const height = style === "for-the-badge" ? 28 : 20

  const radius = style === "flat-square" ? 0 : 3

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}">
  <linearGradient id="b" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  
  <mask id="a">
    <rect width="${totalWidth}" height="${height}" rx="${radius}" fill="#fff"/>
  </mask>
  
  <g mask="url(#a)">
    <rect width="${labelWidth}" height="${height}" fill="${labelColor}"/>
    <rect x="${labelWidth}" width="${messageWidth}" height="${height}" fill="${messageColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#b)"/>
  </g>
  
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text x="${labelWidth / 2}" y="${height / 2 + 4}" fill="#010101" fill-opacity=".3">${label}</text>
    <text x="${labelWidth / 2}" y="${height / 2 + 3}">${label}</text>
    <text x="${labelWidth + messageWidth / 2}" y="${height / 2 + 4}" fill="#010101" fill-opacity=".3">${message}</text>
    <text x="${labelWidth + messageWidth / 2}" y="${height / 2 + 3}">${message}</text>
  </g>
</svg>
  `.trim()
}

export const badgePresets = [
  { label: "build", message: "passing", labelColor: "#555", messageColor: "#4c1" },
  { label: "build", message: "failing", labelColor: "#555", messageColor: "#e05d44" },
  { label: "coverage", message: "90%", labelColor: "#555", messageColor: "#4c1" },
  { label: "version", message: "v1.0.0", labelColor: "#555", messageColor: "#007ec6" },
  { label: "license", message: "MIT", labelColor: "#555", messageColor: "#007ec6" },
  { label: "downloads", message: "1k/month", labelColor: "#555", messageColor: "#007ec6" },
  { label: "npm", message: "v8.0.0", labelColor: "#cb3837", messageColor: "#cb3837" },
  { label: "stars", message: "1.2k", labelColor: "#555", messageColor: "#dfb317" },
]

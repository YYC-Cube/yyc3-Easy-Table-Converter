// 应用图标预设尺寸配置
export interface IconSize {
  name: string
  size: number
  platform: string
  usage: string
}

export const iosIconSizes: IconSize[] = [
  { name: "iPhone App", size: 180, platform: "iOS", usage: "iPhone (60pt @3x)" },
  { name: "iPhone App", size: 120, platform: "iOS", usage: "iPhone (60pt @2x)" },
  { name: "iPad App", size: 167, platform: "iOS", usage: "iPad Pro (83.5pt @2x)" },
  { name: "iPad App", size: 152, platform: "iOS", usage: "iPad (76pt @2x)" },
  { name: "iPad App", size: 76, platform: "iOS", usage: "iPad (76pt @1x)" },
  { name: "App Store", size: 1024, platform: "iOS", usage: "App Store" },
  { name: "Settings", size: 87, platform: "iOS", usage: "Settings (29pt @3x)" },
  { name: "Settings", size: 58, platform: "iOS", usage: "Settings (29pt @2x)" },
  { name: "Spotlight", size: 120, platform: "iOS", usage: "Spotlight (40pt @3x)" },
  { name: "Spotlight", size: 80, platform: "iOS", usage: "Spotlight (40pt @2x)" },
  { name: "Notification", size: 60, platform: "iOS", usage: "Notification (20pt @3x)" },
  { name: "Notification", size: 40, platform: "iOS", usage: "Notification (20pt @2x)" },
]

export const androidIconSizes: IconSize[] = [
  { name: "XXXHDPI", size: 192, platform: "Android", usage: "xxxhdpi (4x)" },
  { name: "XXHDPI", size: 144, platform: "Android", usage: "xxhdpi (3x)" },
  { name: "XHDPI", size: 96, platform: "Android", usage: "xhdpi (2x)" },
  { name: "HDPI", size: 72, platform: "Android", usage: "hdpi (1.5x)" },
  { name: "MDPI", size: 48, platform: "Android", usage: "mdpi (1x)" },
  { name: "Play Store", size: 512, platform: "Android", usage: "Google Play Store" },
]

export const webIconSizes: IconSize[] = [
  { name: "Favicon", size: 16, platform: "Web", usage: "Browser Tab (16x16)" },
  { name: "Favicon", size: 32, platform: "Web", usage: "Browser Tab (32x32)" },
  { name: "Apple Touch", size: 180, platform: "Web", usage: "Apple Touch Icon" },
  { name: "Android Chrome", size: 192, platform: "Web", usage: "Android Chrome" },
  { name: "Android Chrome", size: 512, platform: "Web", usage: "Android Chrome (Large)" },
  { name: "MS Tile", size: 144, platform: "Web", usage: "Microsoft Tile" },
  { name: "MS Tile", size: 310, platform: "Web", usage: "Microsoft Tile (Large)" },
]

export const socialMediaSizes: IconSize[] = [
  { name: "Facebook Cover", size: 820, platform: "Social", usage: "Facebook Cover (820x312)" },
  { name: "Facebook Profile", size: 180, platform: "Social", usage: "Facebook Profile" },
  { name: "Twitter Header", size: 1500, platform: "Social", usage: "Twitter Header (1500x500)" },
  { name: "Twitter Profile", size: 400, platform: "Social", usage: "Twitter Profile" },
  { name: "Instagram Post", size: 1080, platform: "Social", usage: "Instagram Post (Square)" },
  { name: "Instagram Story", size: 1080, platform: "Social", usage: "Instagram Story (1080x1920)" },
  { name: "LinkedIn Cover", size: 1584, platform: "Social", usage: "LinkedIn Cover (1584x396)" },
  { name: "LinkedIn Profile", size: 400, platform: "Social", usage: "LinkedIn Profile" },
  { name: "YouTube Thumbnail", size: 1280, platform: "Social", usage: "YouTube Thumbnail (1280x720)" },
  { name: "YouTube Channel", size: 800, platform: "Social", usage: "YouTube Channel Icon" },
]

export const allIconSizes = [...iosIconSizes, ...androidIconSizes, ...webIconSizes, ...socialMediaSizes]

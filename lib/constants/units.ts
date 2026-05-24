import type { UnitConversion } from "@/YYC_原油/lib/types"

export const unitConversions: UnitConversion[] = [
  {
    category: "长度",
    units: [
      { value: "mm", label: "毫米 (mm)", ratio: 1 },
      { value: "cm", label: "厘米 (cm)", ratio: 10 },
      { value: "m", label: "米 (m)", ratio: 1000 },
      { value: "km", label: "千米 (km)", ratio: 1000000 },
      { value: "in", label: "英寸 (in)", ratio: 25.4 },
      { value: "ft", label: "英尺 (ft)", ratio: 304.8 },
      { value: "yd", label: "码 (yd)", ratio: 914.4 },
      { value: "mi", label: "英里 (mi)", ratio: 1609344 },
    ],
  },
  {
    category: "重量",
    units: [
      { value: "mg", label: "毫克 (mg)", ratio: 1 },
      { value: "g", label: "克 (g)", ratio: 1000 },
      { value: "kg", label: "千克 (kg)", ratio: 1000000 },
      { value: "t", label: "吨 (t)", ratio: 1000000000 },
      { value: "oz", label: "盎司 (oz)", ratio: 28349.5 },
      { value: "lb", label: "磅 (lb)", ratio: 453592.37 },
    ],
  },
  {
    category: "温度",
    units: [
      { value: "c", label: "摄氏度 (°C)", ratio: 1 },
      { value: "f", label: "华氏度 (°F)", ratio: 1 },
      { value: "k", label: "开尔文 (K)", ratio: 1 },
    ],
  },
  {
    category: "面积",
    units: [
      { value: "mm2", label: "平方毫米 (mm²)", ratio: 1 },
      { value: "cm2", label: "平方厘米 (cm²)", ratio: 100 },
      { value: "m2", label: "平方米 (m²)", ratio: 1000000 },
      { value: "km2", label: "平方千米 (km²)", ratio: 1000000000000 },
      { value: "ha", label: "公顷 (ha)", ratio: 10000000000 },
    ],
  },
  {
    category: "体积",
    units: [
      { value: "ml", label: "毫升 (ml)", ratio: 1 },
      { value: "l", label: "升 (L)", ratio: 1000 },
      { value: "m3", label: "立方米 (m³)", ratio: 1000000 },
      { value: "gal", label: "加仑 (gal)", ratio: 3785.41 },
    ],
  },
]

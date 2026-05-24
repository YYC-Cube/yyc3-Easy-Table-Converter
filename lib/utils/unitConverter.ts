export const convertUnit = (value: number, fromUnit: string, toUnit: string, category: string): number => {
  // 温度转换特殊处理
  if (category === "温度") {
    if (fromUnit === "c" && toUnit === "f") {
      return (value * 9) / 5 + 32
    } else if (fromUnit === "f" && toUnit === "c") {
      return ((value - 32) * 5) / 9
    } else if (fromUnit === "c" && toUnit === "k") {
      return value + 273.15
    } else if (fromUnit === "k" && toUnit === "c") {
      return value - 273.15
    } else if (fromUnit === "f" && toUnit === "k") {
      return ((value - 32) * 5) / 9 + 273.15
    } else if (fromUnit === "k" && toUnit === "f") {
      return ((value - 273.15) * 9) / 5 + 32
    }
    return value
  }

  // 其他单位使用比率转换
  const unitConversions = require("@/lib/constants/units").unitConversions
  const categoryData = unitConversions.find((c: any) => c.category === category)

  if (!categoryData) return value

  const fromRatio = categoryData.units.find((u: any) => u.value === fromUnit)?.ratio || 1
  const toRatio = categoryData.units.find((u: any) => u.value === toUnit)?.ratio || 1

  return (value * fromRatio) / toRatio
}

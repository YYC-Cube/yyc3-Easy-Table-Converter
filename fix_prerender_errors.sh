#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

cleanup() {
  echo "清理资源..."
}

# 检查系统健康 (macOS兼容版)
check_system_health() {
  if [ "$(uname)" = "Darwin" ]; then
    # macOS
    echo "在macOS上跳过内存检查"
  else
    # Linux
    local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}') || local memory_usage=0
    [ $memory_usage -gt 85 ] && echo "警告: 内存使用率过高" && exit 1
  fi
}

check_system_health

echo "开始检查和修复预渲染错误..."

# 使用固定路径的日志文件
LOG_FILE="/Users/my/Documents/企业框架/YYC³ Easy Table Converter/prerender_fix_log.txt"
echo "处理日志已创建: $LOG_FILE"
# 清空日志文件
cat /dev/null > "$LOG_FILE"

# 查找所有转换器页面
converter_pages=$(find ./app/converters -name "page.tsx")

files_processed=0
files_updated=0

for page_file in $converter_pages; do
  echo "处理: $page_file" >> "$LOG_FILE"
  files_processed=$((files_processed + 1))
  
  # 检查文件是否包含'use client'指令
  if ! grep -q '"use client"' "$page_file"; then
    echo "添加'use client'指令: $page_file" >> "$LOG_FILE"
    # 在文件开头添加'use client' (macOS兼容方式)
    echo '"use client"' | cat - "$page_file" > temp_file && mv temp_file "$page_file"
    files_updated=$((files_updated + 1))
  fi
  
  # 检查是否使用了useToast
  if grep -q 'useToast' "$page_file"; then
    echo "检测到useToast使用: $page_file" >> "$LOG_FILE"
    # 这里我们记录但不自动修改，因为需要手动检查具体使用方式
    echo "需要手动修复: $page_file" >> "$LOG_FILE"
  fi
  
  # 检查是否使用了其他客户端功能
  if grep -q -E 'window\.|document\.|localStorage|sessionStorage|navigator\.' "$page_file"; then
    echo "检测到客户端API使用: $page_file" >> "$LOG_FILE"
    # 检查是否有适当的客户端检查
    if ! grep -q 'typeof window !== "undefined"' "$page_file"; then
      echo "建议添加客户端检查: $page_file" >> "$LOG_FILE"
    fi
  fi
done

echo "处理完成!"
echo "总共处理文件数: $files_processed"
echo "自动更新文件数: $files_updated"
echo "详细日志: $LOG_FILE"
echo "\n需要手动检查的文件列表:"
grep "需要手动修复" "$LOG_FILE" | cut -d':' -f2-

echo "\n请根据日志手动检查和修复需要特殊处理的文件。"
echo "对于使用useToast的页面，建议应用之前的修复模式："
echo "1. 添加React.useRef存储toast实例"
echo "2. 在useEffect中设置引用并进行客户端检查"
echo "3. 使用toastRef.current调用toast方法"

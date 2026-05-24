#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 清理函数
cleanup() {
  echo "\n清理临时文件..."
  rm -f *.tmp
}

# 资源监控函数
check_system_health() {
  if [[ "$(uname)" == "Darwin" ]]; then
    # macOS内存检查
    local memory_usage=$(vm_stat | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
    local memory_total=$(sysctl -n hw.memsize)
    local usage_percent=$((memory_usage * 4096 * 100 / memory_total))
    if [ $usage_percent -gt 85 ]; then
      echo "警告: 内存使用率过高 ($usage_percent%)，请释放资源后再运行"
      exit 1
    fi
  fi
}

# 检查是否有足够的磁盘空间
check_disk_space() {
  local free_space=$(df -k . | awk 'NR==2 {print $4}')
  if [ $free_space -lt 1048576 ]; then # 少于1GB
    echo "警告: 磁盘空间不足，需要至少1GB空闲空间"
    exit 1
  fi
}

# 执行健康检查
check_system_health
check_disk_space

# 客户端钩子正则表达式，包含更多常用hooks
HOOKS_PATTERN="useState\|useRef\|useEffect\|useCallback\|useMemo\|useContext\|useReducer\|useLayoutEffect\|useImperativeHandle\|useDebugValue\|useId\|useTransition\|useDeferredValue"

# 要搜索的目录列表
DIRS=(
  "./app/converters"    # 转换工具页面
  "./components"         # 组件目录
  "./app"                # 应用根目录下的其他页面
)

echo "开始扫描并添加'use client'指令..."
echo "========================================"

# 统计变量
total_files=0
modified_files=0

# 遍历所有目录
for dir in "${DIRS[@]}"; do
  if [ -d "$dir" ]; then
    echo "扫描目录: $dir"
    # 查找所有.tsx文件，包括非page.tsx文件
    find "$dir" -name "*.tsx" | while read file; do
      total_files=$((total_files + 1))
      
      # 检查文件是否已包含'use client'指令
      if grep -q "use client" "$file"; then
        continue
      fi
      
      # 检查文件是否使用了客户端钩子
      if grep -qE "$HOOKS_PATTERN" "$file"; then
        # 添加'use client'指令
        echo "✓ 添加'use client'到: $file"
        temp_file="$file.tmp"
        
        # 确保临时文件的安全性
        if [ -f "$temp_file" ]; then
          rm -f "$temp_file"
        fi
        
        echo '"use client"' > "$temp_file"
        echo >> "$temp_file"
        cat "$file" >> "$temp_file"
        
        # 原子性替换文件
        mv -f "$temp_file" "$file"
        modified_files=$((modified_files + 1))
      fi
    done
  else
    echo "跳过不存在的目录: $dir"
  fi
done

echo "========================================"
echo "扫描完成！"
echo "总共扫描: $total_files 个文件"
echo "已修改: $modified_files 个文件"
echo "已成功为使用React hooks但缺少'use client'指令的组件添加了指令。"
echo "脚本执行完毕！ 🌹"

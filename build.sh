#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

echo "🚀 YYC³ Easy Table Converter 构建脚本"
echo "======================================"

# 资源监控
check_system_health() {
    echo "🔍 检查系统资源..."
    # 在macOS上获取内存使用情况
    local memory_usage=$(top -l 1 | grep PhysMem | awk '{print $2}' | grep -o '[0-9]\+')
    echo "   内存使用: ${memory_usage}MB"
}

# 清理函数
cleanup() {
    echo "🧹 清理构建环境..."
    # 清理临时文件
    rm -rf .next/cache || true
}

# 检查依赖
check_dependencies() {
    echo "📦 检查项目依赖..."
    if ! command -v npm &> /dev/null; then
        echo "❌ 未找到 npm，请安装 Node.js 和 npm"
        exit 1
    fi
    echo "✅ npm 已安装"
}

# 安装依赖
install_dependencies() {
    echo "⚙️  安装依赖包..."
    npm install --legacy-peer-deps
}

# 运行TypeScript检查
run_typecheck() {
    echo "🔷 运行 TypeScript 类型检查..."
    npx tsc --noEmit
    echo "✅ TypeScript 检查通过"
}

# 构建项目
build_project() {
    echo "🏗️  构建项目..."
    npm run build
    echo "✅ 项目构建成功"
}

# 显示构建信息
display_build_info() {
    echo "📊 构建信息汇总"
    echo "---------------------------------------"
    echo "✅ 构建完成！"
    echo "✅ 可以使用 npm start 启动生产服务器"
    echo "✅ 部署目录: .next/"
    echo "📝 项目已准备好进行部署！"
}

# 主函数
main() {
    echo "🎯 开始构建流程..."
    check_system_health
    check_dependencies
    install_dependencies
    run_typecheck
    build_project
    display_build_info
}

# 执行主函数
main
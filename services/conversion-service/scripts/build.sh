#!/bin/bash

# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 🎯 微服务构建脚本
# @description 执行项目构建流程，包含清理、类型检查、代码构建和验证
# @author YYC
# @created 2024-11-22

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 时间记录开始
BUILD_START_TIME=$(date +%s)

echo -e "${BLUE}🚀 开始构建微服务...${NC}"

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 清理函数
cleanup() {
  if [ -n "${BUILD_ERROR+x}" ]; then
    echo -e "\n${RED}❌ 构建失败${NC}"
  fi
}

# 检查Node版本
check_node_version() {
  echo -e "${BLUE}🔍 检查Node.js版本...${NC}"
  NODE_VERSION=$(node -v)
  REQUIRED_VERSION="v16.0.0"
  
  if [[ "$NODE_VERSION" < "$REQUIRED_VERSION" ]]; then
    echo -e "${RED}错误: Node.js版本过低！需要 ${REQUIRED_VERSION} 或更高版本，当前版本是 ${NODE_VERSION}${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Node.js版本检查通过: ${NODE_VERSION}${NC}"
}

# 清理构建目录
clean_build() {
  echo -e "${BLUE}🧹 清理构建目录...${NC}"
  rm -rf "$PROJECT_ROOT/dist"
  mkdir -p "$PROJECT_ROOT/dist"
  echo -e "${GREEN}构建目录清理完成${NC}"
}

# 安装依赖
install_dependencies() {
  echo -e "${BLUE}📦 安装项目依赖...${NC}"
  
  # 使用--production=false确保安装所有依赖（包括开发依赖）
  npm ci --production=false
  
  echo -e "${GREEN}依赖安装完成${NC}"
}

# 运行代码质量检查
run_code_quality_checks() {
  echo -e "${BLUE}🔍 运行代码质量检查...${NC}"
  
  echo -e "${BLUE}  └─ 运行ESLint检查${NC}"
  if ! npm run lint; then
    echo -e "${RED}❌ ESLint检查失败，请修复代码中的问题${NC}"
    BUILD_ERROR="true"
    exit 1
  fi
  
  echo -e "${GREEN}ESLint检查通过${NC}"
  
  echo -e "${BLUE}  └─ 运行TypeScript类型检查${NC}"
  if ! npm run typecheck; then
    echo -e "${RED}❌ 类型检查失败，请修复类型错误${NC}"
    BUILD_ERROR="true"
    exit 1
  fi
  
  echo -e "${GREEN}类型检查通过${NC}"
}

# 执行构建
run_build() {
  echo -e "${BLUE}🏗️  执行TypeScript编译...${NC}"
  
  if ! npm run build; then
    echo -e "${RED}❌ TypeScript编译失败${NC}"
    BUILD_ERROR="true"
    exit 1
  fi
  
  echo -e "${GREEN}TypeScript编译成功${NC}"
}

# 复制必要文件到构建目录
copy_required_files() {
  echo -e "${BLUE}📄 复制必要文件到构建目录...${NC}"
  
  # 复制package.json和package-lock.json
  cp "$PROJECT_ROOT/package.json" "$PROJECT_ROOT/dist/"
  cp "$PROJECT_ROOT/package-lock.json" "$PROJECT_ROOT/dist/" || true
  
  # 复制环境变量示例文件
  if [ -f "$PROJECT_ROOT/.env.example" ]; then
    cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/dist/"
  fi
  
  # 复制README文件
  if [ -f "$PROJECT_ROOT/README.md" ]; then
    cp "$PROJECT_ROOT/README.md" "$PROJECT_ROOT/dist/"
  fi
  
  echo -e "${GREEN}文件复制完成${NC}"
}

# 验证构建结果
validate_build() {
  echo -e "${BLUE}✅ 验证构建结果...${NC}"
  
  # 检查构建产物是否存在
  if [ ! -f "$PROJECT_ROOT/dist/index.js" ]; then
    echo -e "${RED}❌ 构建失败：未找到主入口文件 index.js${NC}"
    BUILD_ERROR="true"
    exit 1
  fi
  
  echo -e "${GREEN}构建验证通过${NC}"
}

# 输出构建统计信息
show_build_stats() {
  BUILD_END_TIME=$(date +%s)
  BUILD_DURATION=$((BUILD_END_TIME - BUILD_START_TIME))
  
  # 计算构建大小
  BUILD_SIZE=$(du -sh "$PROJECT_ROOT/dist" 2>/dev/null | cut -f1 || echo "未知")
  
  echo -e "\n${GREEN}========================================${NC}"
  echo -e "${GREEN}✅ 构建成功完成！${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo -e "${BLUE}📊 构建统计:${NC}"
  echo -e "  ${BLUE}构建时间:${NC} ${YELLOW}$BUILD_DURATION 秒${NC}"
  echo -e "  ${BLUE}构建产物大小:${NC} ${YELLOW}$BUILD_SIZE${NC}"
  echo -e "  ${BLUE}输出目录:${NC} ${YELLOW}$PROJECT_ROOT/dist${NC}"
  echo -e "${GREEN}========================================${NC}"
  echo -e "${BLUE}🚀 运行方式:${NC}"
  echo -e "  ${YELLOW}cd dist && npm install --production && npm start${NC}"
  echo -e "${GREEN}========================================${NC}"
}

# 主函数
main() {
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}🚀 YYC³ Easy Table Converter 构建过程${NC}"
  echo -e "${GREEN}========================================${NC}\n"
  
  check_node_version
  clean_build
  install_dependencies
  run_code_quality_checks
  run_build
  copy_required_files
  validate_build
  show_build_stats
}

# 执行主函数
main
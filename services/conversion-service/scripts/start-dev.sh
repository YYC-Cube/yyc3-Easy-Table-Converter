#!/bin/bash

# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 🎯 微服务开发环境启动脚本
# @description 提供开发环境下的服务启动，包含环境变量加载、热重载和开发工具集成
# @author YYC
# @created 2024-11-22

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 启动微服务开发环境${NC}"

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 清理函数
cleanup() {
  echo -e "\n${YELLOW}正在清理开发环境...${NC}"
  # 清理临时文件
  rm -rf "$PROJECT_ROOT/.temp"
  echo -e "${GREEN}开发环境清理完成${NC}"
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

# 检查依赖是否安装
check_dependencies() {
  echo -e "${BLUE}🔍 检查项目依赖...${NC}"
  
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}依赖未安装，正在安装...${NC}"
    npm install
  else
    # 检查是否需要更新依赖
    if [ "package-lock.json" -nt "node_modules" ]; then
      echo -e "${YELLOW}检测到package-lock.json更新，正在更新依赖...${NC}"
      npm ci
    else
      echo -e "${GREEN}项目依赖检查通过${NC}"
    fi
  fi
}

# 加载环境变量
load_environment() {
  echo -e "${BLUE}🔧 加载环境变量...${NC}"
  
  # 确保.env文件存在
  if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
      echo -e "${YELLOW}创建.env文件（基于.env.example）...${NC}"
      cp ".env.example" ".env"
      echo -e "${GREEN}.env文件已创建，请根据需要修改配置${NC}"
    else
      echo -e "${YELLOW}警告: 未找到.env或.env.example文件${NC}"
    fi
  fi
  
  # 创建开发专用的临时目录
  mkdir -p "$PROJECT_ROOT/.temp"
}

# 执行类型检查
run_typecheck() {
  echo -e "${BLUE}📋 运行TypeScript类型检查...${NC}"
  if ! npm run typecheck; then
    echo -e "${YELLOW}类型检查发现问题，请修复后再继续${NC}"
    # 开发模式下不强制退出，允许继续开发
  else
    echo -e "${GREEN}类型检查通过${NC}"
  fi
}

# 启动开发服务器
start_dev_server() {
  echo -e "\n${GREEN}🎯 启动开发服务器...${NC}"
  echo -e "${BLUE}服务地址: http://localhost:3001${NC}"
  echo -e "${BLUE}健康检查: http://localhost:3001/api/health${NC}"
  echo -e "${BLUE}按 Ctrl+C 停止服务${NC}\n"
  
  # 使用ts-node-dev启动服务，支持热重载
  npm run dev
}

# 主函数
main() {
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}🚀 YYC³ Easy Table Converter 开发环境${NC}"
  echo -e "${GREEN}========================================${NC}\n"
  
  check_node_version
  check_dependencies
  load_environment
  run_typecheck
  start_dev_server
}

# 执行主函数
main
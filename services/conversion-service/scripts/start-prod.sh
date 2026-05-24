#!/bin/bash

# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 🎯 微服务生产环境启动脚本
# @description 提供生产环境下的安全服务启动，包含环境变量验证、健康检查和优雅启动
# @author YYC
# @created 2024-11-22

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 全局变量
SERVER_PID=0
HEALTH_CHECK_ATTEMPTS=0
MAX_HEALTH_CHECK_ATTEMPTS=30
HEALTH_CHECK_INTERVAL=2

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$PROJECT_ROOT"

# 清理函数
cleanup() {
  echo -e "\n${YELLOW}正在清理资源...${NC}"
  
  # 优雅停止服务
  if [ $SERVER_PID -ne 0 ]; then
    echo -e "${BLUE}发送 SIGTERM 信号给服务进程 (PID: $SERVER_PID)...${NC}"
    kill -SIGTERM "$SERVER_PID" || true
    
    # 等待进程结束
    echo -e "${BLUE}等待服务优雅关闭...${NC}"
    wait "$SERVER_PID" 2>/dev/null || true
  fi
  
  echo -e "${GREEN}资源清理完成${NC}"
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

# 检查环境变量
check_environment_variables() {
  echo -e "${BLUE}🔍 检查环境变量配置...${NC}"
  
  # 必需的环境变量列表
  required_vars=("PORT")
  missing_vars=()
  
  # 检查.env文件是否存在
  if [ ! -f ".env" ]; then
    echo -e "${RED}错误: 未找到.env文件${NC}"
    if [ -f ".env.example" ]; then
      echo -e "${YELLOW}提示: 请基于.env.example创建.env文件${NC}"
    fi
    exit 1
  fi
  
  # 加载环境变量
  export $(grep -v '^#' .env | xargs)
  
  # 检查必需的环境变量
  for var in "${required_vars[@]}"; do
    if [ -z "${!var:-}" ]; then
      missing_vars+=("$var")
    fi
  done
  
  if [ ${#missing_vars[@]} -ne 0 ]; then
    echo -e "${RED}错误: 缺少必需的环境变量: ${missing_vars[*]}${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}环境变量检查通过${NC}"
}

# 检查依赖
check_dependencies() {
  echo -e "${BLUE}🔍 检查项目依赖...${NC}"
  
  if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}依赖未安装，正在安装生产依赖...${NC}"
    npm install --production
  else
    echo -e "${GREEN}项目依赖检查通过${NC}"
  fi
}

# 检查构建产物
check_build() {
  echo -e "${BLUE}🔍 检查构建产物...${NC}"
  
  if [ ! -f "dist/index.js" ]; then
    echo -e "${RED}错误: 未找到构建产物！请先运行构建脚本${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}构建产物检查通过${NC}"
}

# 执行服务健康检查
health_check() {
  local port=${PORT:-3001}
  local health_url="http://localhost:${port}/api/health"
  
  echo -e "${BLUE}🔍 执行服务健康检查 ($health_url)...${NC}"
  
  while [ $HEALTH_CHECK_ATTEMPTS -lt $MAX_HEALTH_CHECK_ATTEMPTS ]; do
    HEALTH_CHECK_ATTEMPTS=$((HEALTH_CHECK_ATTEMPTS + 1))
    
    if curl -s -o /dev/null -w "%{http_code}" "$health_url" | grep -q "200"; then
      echo -e "${GREEN}✅ 服务健康检查通过！${NC}"
      return 0
    fi
    
    echo -e "${YELLOW}⏳ 服务尚未就绪（尝试 $HEALTH_CHECK_ATTEMPTS/$MAX_HEALTH_CHECK_ATTEMPTS）...${NC}"
    sleep $HEALTH_CHECK_INTERVAL
  done
  
  echo -e "${RED}❌ 服务健康检查失败：超时${NC}"
  return 1
}

# 启动服务
start_service() {
  echo -e "\n${GREEN}🚀 启动微服务...${NC}"
  echo -e "${BLUE}服务配置:${NC}"
  echo -e "  ${BLUE}端口:${NC} ${YELLOW}${PORT:-3001}${NC}"
  echo -e "  ${BLUE}环境:${NC} ${YELLOW}production${NC}"
  echo -e "  ${BLUE}按 Ctrl+C 停止服务${NC}\n"
  
  # 在后台启动服务
  node dist/index.js &
  SERVER_PID=$!
  
  echo -e "${GREEN}服务已启动，PID: $SERVER_PID${NC}"
  
  # 执行健康检查
  if health_check; then
    echo -e "\n${GREEN}========================================${NC}"
    echo -e "${GREEN}🎉 服务已成功启动并通过健康检查！${NC}"
    echo -e "${GREEN}========================================${NC}"
    echo -e "${BLUE}🚀 服务地址:${NC} ${YELLOW}http://localhost:${PORT:-3001}${NC}"
    echo -e "${BLUE}🔍 健康检查:${NC} ${YELLOW}http://localhost:${PORT:-3001}/api/health${NC}"
    echo -e "${GREEN}========================================${NC}\n"
  else
    echo -e "${RED}❌ 服务启动失败或健康检查未通过${NC}"
    kill -SIGTERM "$SERVER_PID" 2>/dev/null || true
    exit 1
  fi
  
  # 等待服务进程
  wait "$SERVER_PID"
}

# 设置资源限制（可选）
set_resource_limits() {
  if command -v ulimit &> /dev/null; then
    echo -e "${BLUE}🔧 设置资源限制...${NC}"
    # 设置文件描述符限制
    ulimit -n 65535 || echo -e "${YELLOW}警告: 无法设置文件描述符限制${NC}"
  fi
}

# 主函数
main() {
  echo -e "${GREEN}========================================${NC}"
  echo -e "${GREEN}🚀 YYC³ Easy Table Converter 生产环境${NC}"
  echo -e "${GREEN}========================================${NC}\n"
  
  check_node_version
  check_environment_variables
  check_dependencies
  check_build
  set_resource_limits
  start_service
}

# 执行主函数
main
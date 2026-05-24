#!/bin/bash

# 开发工具脚本
# 提供便捷的命令行工具来管理开发环境和测试

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}YYC³ Easy Table Converter 开发工具脚本${NC}"
echo -e "${BLUE}============================================${NC}"
echo ""

# 检查命令行参数
if [ $# -eq 0 ]; then
    echo -e "${YELLOW}使用方法:${NC} ./scripts/dev-utils.sh [command]"
    echo ""
    echo "命令列表:"
    echo "  install         安装所有依赖"
    echo "  dev             启动开发服务器"
    echo "  test            运行所有测试"
    echo "  test-ai         只运行AI服务相关测试"
    echo "  build           构建生产版本"
    echo "  lint            运行代码检查"
    echo "  clean           清理构建文件和缓存"
    echo "  setup-env       设置环境变量文件"
    echo "  check-health    检查项目健康状态"
    echo "  help            显示此帮助信息"
    exit 1
fi

COMMAND=$1
shift

# 安装依赖
function install_deps() {
    echo -e "${BLUE}正在安装项目依赖...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 依赖安装成功${NC}"
    else
        echo -e "${RED}✗ 依赖安装失败${NC}"
        exit 1
    fi
}

# 启动开发服务器
function start_dev() {
    echo -e "${BLUE}启动开发服务器...${NC}"
    echo -e "${YELLOW}服务器地址: http://localhost:3737${NC}"
    npm run dev
}

# 运行所有测试
function run_tests() {
    echo -e "${BLUE}运行所有测试...${NC}"
    npm test
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 所有测试通过${NC}"
    else
        echo -e "${RED}✗ 测试失败${NC}"
        exit 1
    fi
}

# 运行AI服务相关测试
function run_ai_tests() {
    echo -e "${BLUE}运行AI服务相关测试...${NC}"
    npm test -- __tests__/services/ai/
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ AI服务测试通过${NC}"
    else
        echo -e "${RED}✗ AI服务测试失败${NC}"
        exit 1
    fi
}

# 构建生产版本
function build_prod() {
    echo -e "${BLUE}构建生产版本...${NC}"
    npm run build
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 构建成功${NC}"
    else
        echo -e "${RED}✗ 构建失败${NC}"
        exit 1
    fi
}

# 运行代码检查
function run_lint() {
    echo -e "${BLUE}运行代码检查...${NC}"
    npm run lint
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 代码检查通过${NC}"
    else
        echo -e "${YELLOW}⚠ 代码检查发现问题${NC}"
        exit 1
    fi
}

# 清理构建文件和缓存
function clean_cache() {
    echo -e "${BLUE}清理构建文件和缓存...${NC}"
    rm -rf .next out node_modules/.cache
    rm -f *.log
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓ 清理成功${NC}"
    else
        echo -e "${RED}✗ 清理失败${NC}"
        exit 1
    fi
}

# 设置环境变量文件
function setup_env() {
    echo -e "${BLUE}设置环境变量文件...${NC}"
    
    # 检查.env.example是否存在
    if [ ! -f .env.example ]; then
        echo -e "${RED}✗ .env.example 文件不存在${NC}"
        exit 1
    fi
    
    # 创建开发环境文件
    if [ ! -f .env.development ]; then
        cp .env.example .env.development
        echo -e "${GREEN}✓ 已创建 .env.development 文件${NC}"
        echo -e "${YELLOW}请编辑 .env.development 文件，填入实际的API密钥${NC}"
    else
        echo -e "${YELLOW}⚠ .env.development 文件已存在${NC}"
    fi
    
    # 创建测试环境文件
    if [ ! -f .env.test ]; then
        cp .env.example .env.test
        echo -e "${GREEN}✓ 已创建 .env.test 文件${NC}"
    else
        echo -e "${YELLOW}⚠ .env.test 文件已存在${NC}"
    fi
}

# 检查项目健康状态
function check_health() {
    echo -e "${BLUE}检查项目健康状态...${NC}"
    
    # 检查依赖
    if [ ! -d node_modules ]; then
        echo -e "${YELLOW}⚠ 依赖未安装，请运行: ./scripts/dev-utils.sh install${NC}"
    else
        echo -e "${GREEN}✓ 依赖已安装${NC}"
    fi
    
    # 检查环境变量文件
    if [ ! -f .env.development ]; then
        echo -e "${YELLOW}⚠ .env.development 文件不存在，请运行: ./scripts/dev-utils.sh setup-env${NC}"
    else
        echo -e "${GREEN}✓ 环境变量文件已创建${NC}"
    fi
    
    # 检查必要的配置文件
    local config_files=("package.json" "tsconfig.json" "tailwind.config.ts" "next.config.mjs")
    for file in "${config_files[@]}"; do
        if [ ! -f "$file" ]; then
            echo -e "${RED}✗ 缺少必要的配置文件: $file${NC}"
        fi
    done
    
    # 检查src目录结构
    local dirs=("app" "components" "services" "lib" "utils" "types")
    for dir in "${dirs[@]}"; do
        if [ ! -d "$dir" ]; then
            echo -e "${YELLOW}⚠ 缺少目录: $dir${NC}"
        fi
    done
    
    echo -e "${GREEN}✓ 健康检查完成${NC}"
}

# 执行命令
case "$COMMAND" in
    install)
        install_deps
        ;;
    dev)
        start_dev
        ;;
    test)
        run_tests
        ;;
    test-ai)
        run_ai_tests
        ;;
    build)
        build_prod
        ;;
    lint)
        run_lint
        ;;
    clean)
        clean_cache
        ;;
    setup-env)
        setup_env
        ;;
    check-health)
        check_health
        ;;
    help)
        echo -e "${YELLOW}使用方法:${NC} ./scripts/dev-utils.sh [command]"
        echo ""
        echo "命令列表:"
        echo "  install         安装所有依赖"
        echo "  dev             启动开发服务器"
        echo "  test            运行所有测试"
        echo "  test-ai         只运行AI服务相关测试"
        echo "  build           构建生产版本"
        echo "  lint            运行代码检查"
        echo "  clean           清理构建文件和缓存"
        echo "  setup-env       设置环境变量文件"
        echo "  check-health    检查项目健康状态"
        echo "  help            显示此帮助信息"
        ;;
    *)
        echo -e "${RED}未知命令: $COMMAND${NC}"
        echo -e "使用 './scripts/dev-utils.sh help' 查看可用命令"
        exit 1
        ;;
esac

echo ""
echo -e "${BLUE}============================================${NC}"
echo -e "${GREEN}命令执行完成${NC}"
echo -e "${BLUE}============================================${NC}"

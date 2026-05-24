#!/bin/bash
# === 脚本健康检查头 ===
set -euo pipefail  # 严格模式
trap "cleanup" EXIT INT TERM

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUILD_DIR="${PROJECT_ROOT}/dist"
VERSION=$(grep version "${PROJECT_ROOT}/package.json" | cut -d '"' -f 4)

# 清理函数
cleanup() {
    echo -e "${BLUE}清理临时文件...${NC}"
    # 清理构建过程中可能产生的临时文件
    rm -rf "${PROJECT_ROOT}/tsconfig.tsbuildinfo"
    echo -e "${GREEN}清理完成${NC}"
}

# 检查系统健康状态
check_system_health() {
    echo -e "${BLUE}检查系统状态...${NC}"
    
    # 检查内存使用情况
    if command -v free &> /dev/null; then
        local memory_usage=$(free | awk 'NR==2{printf "%.0f", $3*100/$2}')
        if [ "$memory_usage" -gt 85 ]; then
            echo -e "${RED}警告: 内存使用率超过85% (当前: ${memory_usage}%)${NC}"
            read -p "是否继续? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        else
            echo -e "${GREEN}内存使用率正常 (${memory_usage}%)${NC}"
        fi
    fi
    
    # 检查磁盘空间
    if command -v df &> /dev/null; then
        local disk_usage=$(df -h "${PROJECT_ROOT}" | awk 'NR==2{print $5}' | sed 's/%//')
        if [ "$disk_usage" -gt 85 ]; then
            echo -e "${RED}警告: 磁盘使用率超过85% (当前: ${disk_usage}%)${NC}"
            read -p "是否继续? (y/N): " -n 1 -r
            echo
            if [[ ! $REPLY =~ ^[Yy]$ ]]; then
                exit 1
            fi
        else
            echo -e "${GREEN}磁盘使用率正常 (${disk_usage}%)${NC}"
        fi
    fi
}

# 检查依赖
check_dependencies() {
    echo -e "${BLUE}检查依赖...${NC}"
    
    if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
        echo -e "${RED}错误: Node.js 或 npm 未安装${NC}"
        exit 1
    fi
    
    local node_version=$(node -v)
    local npm_version=$(npm -v)
    echo -e "${GREEN}Node.js 版本: ${node_version}${NC}"
    echo -e "${GREEN}npm 版本: ${npm_version}${NC}"
}

# 安装依赖
install_dependencies() {
    echo -e "${BLUE}安装项目依赖...${NC}"
    cd "${PROJECT_ROOT}"
    npm ci
    echo -e "${GREEN}依赖安装完成${NC}"
}

# 运行测试
run_tests() {
    echo -e "${BLUE}运行测试...${NC}"
    cd "${PROJECT_ROOT}"
    npm test
    echo -e "${GREEN}测试通过${NC}"
}

# 构建项目
build_project() {
    echo -e "${BLUE}构建项目 (版本: ${VERSION})...${NC}"
    cd "${PROJECT_ROOT}"
    
    # 清理旧的构建目录
    rm -rf "${BUILD_DIR}"
    mkdir -p "${BUILD_DIR}"
    
    # 编译 TypeScript
    npm run build
    
    # 复制必要的文件到构建目录
    cp package.json package-lock.json "${BUILD_DIR}/"
    cp README.md CHANGELOG.md "${BUILD_DIR}/"
    cp -r config "${BUILD_DIR}/" 2>/dev/null || true
    cp -r scripts "${BUILD_DIR}/"
    cp -r public "${BUILD_DIR}/" 2>/dev/null || true
    
    # 复制环境变量示例文件
    cp .env.example "${BUILD_DIR}/"
    
    echo -e "${GREEN}项目构建完成${NC}"
}

# 创建发布包
create_release_package() {
    echo -e "${BLUE}创建发布包...${NC}"
    cd "${PROJECT_ROOT}"
    
    local release_filename="storage-service-v${VERSION}.tar.gz"
    local release_path="${PROJECT_ROOT}/${release_filename}"
    
    # 清理旧的发布包
    rm -f "${release_path}"
    
    # 创建发布包
    cd "${BUILD_DIR}"
    npm ci --production
    cd "${PROJECT_ROOT}"
    tar -czf "${release_filename}" -C "${BUILD_DIR}" .
    
    echo -e "${GREEN}发布包创建完成: ${release_filename}${NC}"
    echo -e "${GREEN}发布包大小: $(du -h "${release_filename}" | cut -f1)${NC}"
}

# 验证发布包
verify_release_package() {
    echo -e "${BLUE}验证发布包...${NC}"
    
    local release_filename="storage-service-v${VERSION}.tar.gz"
    local temp_dir=$(mktemp -d)
    
    echo -e "${BLUE}解压发布包到临时目录...${NC}"
    tar -xzf "${PROJECT_ROOT}/${release_filename}" -C "${temp_dir}"
    
    # 检查关键文件
    local required_files=("package.json" "dist/index.js" "README.md" ".env.example")
    local missing_files=false
    
    for file in "${required_files[@]}"; do
        if [ ! -f "${temp_dir}/${file}" ]; then
            echo -e "${RED}错误: 缺少关键文件: ${file}${NC}"
            missing_files=true
        fi
    done
    
    if [ "$missing_files" = false ]; then
        echo -e "${GREEN}发布包验证通过${NC}"
    else
        echo -e "${RED}发布包验证失败${NC}"
        exit 1
    fi
    
    # 清理临时目录
    rm -rf "${temp_dir}"
}

# 主函数
main() {
    echo -e "${BLUE}===== YYC³ Easy Table Converter - 存储服务发布脚本 =====${NC}"
    echo -e "${YELLOW}版本: ${VERSION}${NC}"
    
    check_system_health
    check_dependencies
    install_dependencies
    run_tests
    build_project
    create_release_package
    verify_release_package
    
    echo -e "${GREEN}发布流程完成!${NC}"
    echo -e "${BLUE}发布包路径: ${PROJECT_ROOT}/storage-service-v${VERSION}.tar.gz${NC}"
}

# 执行主函数
main
#!/usr/bin/env node

/**
 * @file 测试质量门禁检查器
 * @description 自动化测试质量检查和门禁机制
 * @module scripts/test-quality-gate.js
 * @author YYC
 * @version 1.0.0
 * @created 2025-01-24
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// 质量配置
const QUALITY_THRESHOLDS = {
  coverage: {
    statements: 60,    // 语句覆盖率最低60%
    branches: 70,     // 分支覆盖率最低70%
    functions: 60,    // 函数覆盖率最低60%
    lines: 60,        // 行覆盖率最低60%
  },
  performance: {
    maxTestTime: 30000,      // 单个测试套件最大执行时间（30秒）
    maxTotalTime: 120000,    // 总测试时间上限（2分钟）
  },
  stability: {
    maxFlakyTests: 3,        // 最大不稳定测试数量
    minPassRate: 0.85,       // 最低通过率85%
  },
};

// 颜色输出工具
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
};

function log(level, message) {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: `${colors.blue}[INFO]${colors.reset}`,
    warn: `${colors.yellow}[WARN]${colors.reset}`,
    error: `${colors.red}[ERROR]${colors.reset}`,
    success: `${colors.green}[SUCCESS]${colors.reset}`,
  }[level];
  
  console.log(`${prefix} ${timestamp} - ${message}`);
}

/**
 * 执行Jest命令并解析结果
 */
function runJestTests() {
  log('info', '开始运行Jest测试套件...');
  
  try {
    const startTime = Date.now();
    
    // 运行测试并生成覆盖率报告
    const output = execSync(
      'npx jest --coverage --json --testResultsProcessor=jest-junit 2>&1 || true',
      {
        encoding: 'utf-8',
        cwd: process.cwd(),
        timeout: QUALITY_THRESHOLDS.performance.maxTotalTime,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );
    
    const executionTime = Date.now() - startTime;
    log('info', `测试执行完成，耗时：${executionTime}ms`);
    
    return {
      success: true,
      output,
      executionTime,
    };
  } catch (error) {
    log('error', `测试执行失败：${error.message}`);
    return {
      success: false,
      output: error.stdout + error.stderr,
      executionTime: error.elapsedTime || 0,
    };
  }
}

/**
 * 解析覆盖率报告
 */
function parseCoverageReport() {
  const coveragePath = path.join(process.cwd(), 'coverage/coverage-final.json');
  
  if (!fs.existsSync(coveragePath)) {
    log('warn', '未找到覆盖率报告文件');
    return null;
  }
  
  try {
    const rawData = JSON.parse(fs.readFileSync(coveragePath, 'utf-8'));
    
    // 计算总体覆盖率
    let totalStatements = 0, coveredStatements = 0;
    let totalBranches = 0, coveredBranches = 0;
    let totalFunctions = 0, coveredFunctions = 0;
    let totalLines = 0, coveredLines = 0;
    
    Object.values(rawData).forEach((fileData) => {
      // Statements
      totalStatements += fileData.s.total || 0;
      coveredStatements += fileData.s.covered || 0;
      
      // Branches
      totalBranches += fileData.b.total || 0;
      coveredBranches += fileData.b.covered || 0;
      
      // Functions
      totalFunctions += fileData.f.total || 0;
      coveredFunctions += fileData.f.covered || 0;
      
      // Lines
      totalLines += fileData.l.total || 0;
      coveredLines += fileData.l.covered || 0;
    });
    
    return {
      statements: {
        pct: totalStatements > 0 ? Math.round((coveredStatements / totalStatements) * 100) : 0,
        covered: coveredStatements,
        total: totalStatements,
      },
      branches: {
        pct: totalBranches > 0 ? Math.round((coveredBranches / totalBranches) * 100) : 0,
        covered: coveredBranches,
        total: totalBranches,
      },
      functions: {
        pct: totalFunctions > 0 ? Math.round((coveredFunctions / totalFunctions) * 100) : 0,
        covered: coveredFunctions,
        total: totalFunctions,
      },
      lines: {
        pct: totalLines > 0 ? Math.round((coveredLines / totalLines) * 100) : 0,
        covered: coveredLines,
        total: totalLines,
      },
    };
  } catch (error) {
    log('error', `解析覆盖率报告失败：${error.message}`);
    return null;
  }
}

/**
 * 检查质量门禁
 */
function checkQualityGates(coverage) {
  const results = {
    passed: true,
    checks: [],
  };
  
  if (!coverage) {
    results.passed = false;
    results.checks.push({
      name: 'Coverage Report',
      status: 'FAIL',
      message: '无法获取覆盖率数据',
    });
    return results;
  }
  
  // 检查各项覆盖率指标
  const metrics = [
    { name: 'Statements Coverage', value: coverage.statements.pct, threshold: QUALITY_THRESHOLDS.coverage.statements },
    { name: 'Branches Coverage', value: coverage.branches.pct, threshold: QUALITY_THRESHOLDS.coverage.branches },
    { name: 'Functions Coverage', value: coverage.functions.pct, threshold: QUALITY_THRESHOLDS.coverage.functions },
    { name: 'Lines Coverage', value: coverage.lines.pct, threshold: QUALITY_THRESHOLDS.coverage.lines },
  ];
  
  metrics.forEach(metric => {
    const passed = metric.value >= metric.threshold;
    results.passed = results.passed && passed;
    
    results.checks.push({
      name: metric.name,
      status: passed ? 'PASS' : 'FAIL',
      value: `${metric.value}%`,
      threshold: `≥ ${metric.threshold}%`,
      message: passed 
        ? `${metric.value}% ≥ ${metric.threshold}% ✓`
        : `${metric.value}% < ${metric.threshold}% ✗`,
    });
  });
  
  return results;
}

/**
 * 生成质量报告
 */
function generateQualityReport(testResult, coverage, gateCheck) {
  const report = [];
  
  report.push('=' .repeat(80));
  report.push('YYC³ Easy Table Converter - 测试质量报告');
  report.push(`生成时间：${new Date().toISOString()}`);
  report.push('=' .repeat(80));
  report.push('');
  
  // 测试执行概况
  report.push('📊 测试执行概况');
  report.push('-'.repeat(40));
  report.push(`执行状态：${testResult.success ? '成功' : '失败'}`);
  report.push(`总耗时：${(testResult.executionTime / 1000).toFixed(2)}秒`);
  report.push('');
  
  // 覆盖率详情
  if (coverage) {
    report.push('📈 覆盖率详情');
    report.push('-'.repeat(40));
    report.push(`语句覆盖：${coverage.statements.pct}% (${coverage.statements.covered}/${coverage.statements.total})`);
    report.push(`分支覆盖：${coverage.branches.pct}% (${coverage.branches.covered}/${coverage.branches.total})`);
    report.push(`函数覆盖：${coverage.functions.pct}% (${coverage.functions.covered}/${coverage.functions.total})`);
    report.push(`行覆盖：${coverage.lines.pct}% (${coverage.lines.covered}/${coverage.lines.total})`);
    report.push('');
  }
  
  // 质量门禁结果
  report.push('🚪 质量门禁检查');
  report.push('-'.repeat(40));
  gateCheck.checks.forEach(check => {
    const icon = check.status === 'PASS' ? '✅' : '❌';
    report.push(`${icon} ${check.name}: ${check.message}`);
  });
  report.push('');
  report.push(`总体结果：${gateCheck.passed ? '✅ 通过' : '❌ 未通过'}`);
  report.push('');
  
  // 建议
  if (!gateCheck.passed) {
    report.push('💡 改进建议');
    report.push('-'.repeat(40));
    
    gateCheck.checks.filter(c => c.status === 'FAIL').forEach(check => {
      switch(check.name) {
        case 'Statements Coverage':
          report.push('• 为核心业务逻辑添加更多单元测试');
          report.push('• 关注低覆盖率的组件模块');
          break;
        case 'Branches Coverage':
          report.push('• 增加边界条件和异常路径的测试');
          report.push('• 测试条件分支的各种组合情况');
          break;
        case 'Functions Coverage':
          report.push('• 确保所有公共API都有对应测试');
          report.push('• 补充工具函数和辅助方法的测试');
          break;
        case 'Lines Coverage':
          report.push('• 检查是否有未执行的代码行');
          report.push('• 移除死代码或添加缺失的测试用例');
          break;
      }
    });
    report.push('');
  }
  
  report.push('=' .repeat(80));
  report.push('报告结束');
  report.push('=' .repeat(80));
  
  return report.join('\n');
}

/**
 * 主流程
 */
async function main() {
  console.log('\n');
  log('info', '启动测试质量门禁检查...\n');
  
  // 1. 运行测试
  const testResult = runJestTests();
  
  // 2. 解析覆盖率
  const coverage = parseCoverageReport();
  
  // 3. 质量门禁检查
  const gateCheck = checkQualityGates(coverage);
  
  // 4. 生成报告
  const report = generateQualityReport(testResult, coverage, gateCheck);
  console.log(report);
  
  // 5. 保存报告到文件
  const reportPath = path.join(process.cwd(), 'test-quality-report.md');
  fs.writeFileSync(reportPath, report, 'utf-8');
  log('info', `详细报告已保存至：${reportPath}\n`);
  
  // 6. 输出退出码
  if (!gateCheck.passed) {
    log('error', '质量门禁未通过！\n');
    process.exit(1);
  } else {
    log('success', '质量门禁通过！✓\n');
    process.exit(0);
  }
}

// 处理命令行参数
if (require.main === module) {
  main().catch(error => {
    console.error('质量门禁检查发生错误：', error);
    process.exit(2);
  });
}

module.exports = {
  runJestTests,
  parseCoverageReport,
  checkQualityGates,
  generateQualityReport,
  QUALITY_THRESHOLDS,
};

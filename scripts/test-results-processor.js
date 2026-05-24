#!/usr/bin/env node

/**
 * @file 测试结果处理器
 * @description 生成详细的测试结果报告和性能指标
 * @module scripts/test-results-processor
 * @author YYC
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class TestResultsProcessor {
  constructor() {
    this.results = {
      success: true,
      numFailedTests: 0,
      numPassedTests: 0,
      numTotalTests: 0,
      testResults: [],
      coverageMap: {},
    };
    
    this.startTime = Date.now();
    this.performanceMetrics = {};
  }

  process(results) {
    this.results = results;
    
    this.extractPerformanceMetrics();
    this.generateSummaryReport();
    this.generateDetailedReport();
    
    return results;
  }

  extractPerformanceMetrics() {
    const endTime = Date.now();
    this.performanceMetrics = {
      totalDuration: (endTime - this.startTime) / 1000,
      timestamp: new Date().toISOString(),
      testSuites: this.results.testResults?.length || 0,
      failedTests: this.results.numFailedTests || 0,
      passedTests: this.results.numPassedTests || 0,
      totalTests: this.results.numTotalTests || 0,
      successRate: this.calculateSuccessRate(),
    };
  }

  calculateSuccessRate() {
    const total = (this.results.numPassedTests || 0) + (this.results.numFailedTests || 0);
    if (total === 0) return 100;
    return ((this.results.numPassedTests || 0) / total * 100).toFixed(2);
  }

  generateSummaryReport() {
    const summary = `
╔══════════════════════════════════════════════════════════════╗
║           YYC³ Easy Table Converter - Test Report            ║
╠══════════════════════════════════════════════════════════════╣
║  📊 Test Summary                                             ║
║  ─────────────────────────────────────────────────────────── ║
║  Status:        ${this.results.success ? '✅ PASSED' : '❌ FAILED'}                              ║
║  Total Tests:   ${String(this.performanceMetrics.totalTests).padEnd(4)}                                          ║
║  Passed:        ${String(this.performanceMetrics.passedTests).padEnd(4)}                                          ║
║  Failed:        ${String(this.performanceMetrics.failedTests).padEnd(4)}                                          ║
║  Success Rate:  ${String(this.performanceMetrics.successRate + '%').padEnd(7)}                                        ║
║  Duration:      ${String(this.performanceMetrics.totalDuration.toFixed(2) + 's').padEnd(8)}                                       ║
║  Timestamp:     ${this.performanceMetrics.timestamp}     ║
╚══════════════════════════════════════════════════════════════╝
`;

    console.log(summary);
    
    const reportPath = path.join(process.cwd(), 'test-results', 'summary.txt');
    fs.mkdirSync(path.dirname(reportPath), { recursive: true });
    fs.writeFileSync(reportPath, summary);
  }

  generateDetailedReport() {
    const detailedReport = {
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'test',
      },
      summary: this.performanceMetrics,
      testSuites: (this.results.testResults || []).map(suite => ({
        name: suite.testFilePath,
        status: suite.status,
        numPassingTests: suite.numPassingTests,
        numFailingTests: suite.numFailingTests,
        duration: suite.perfStats?.duration || 0,
        failureMessages: (suite.assertionResults || [])
          .filter(r => r.status === 'failed')
          .map(r => ({
            title: r.ancestorTitles.join(' > ') + ' > ' + r.title,
            failureMessage: r.failureMessages?.join('\n') || 'Unknown error',
          })),
      })),
    };

    const jsonPath = path.join(process.cwd(), 'test-results', 'detailed-report.json');
    fs.mkdirSync(path.dirname(jsonPath), { recursive: true });
    fs.writeFileSync(JSON.stringify(detailedReport, null, 2));
    
    console.log(`\n📄 Detailed report saved to: ${jsonPath}`);
  }
}

// Export for Jest integration
if (typeof module !== 'undefined' && module.exports) {
  module.exports = function(testResults) {
    const processor = new TestResultsProcessor();
    return processor.process(testResults);
  };
}

#!/usr/bin/env node

/**
 * @file 覆盖率报告生成器
 * @description 生成美观的HTML覆盖率报告，支持多种可视化格式
 * @module scripts/generate-coverage-report
 * @author YYC
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');

class CoverageReportGenerator {
  constructor() {
    this.coverageData = null;
    this.outputDir = path.join(process.cwd(), 'coverage-report');
  }

  async generate() {
    this.loadCoverageData();
    
    if (!this.coverageData) {
      console.warn('No coverage data found. Running tests first...');
      await this.runTestsForCoverage();
      this.loadCoverageData();
    }

    if (this.coverageData) {
      this.generateHTMLReport();
      this.generateSummaryJSON();
      this.generateBadgeSVG();
      
      console.log(`\n✅ Coverage reports generated in: ${this.outputDir}`);
    } else {
      console.error('❌ Failed to generate coverage report');
    }
  }

  loadCoverageData() {
    const coveragePath = path.join(process.cwd(), 'coverage', 'coverage-final.json');
    
    if (fs.existsSync(coveragePath)) {
      try {
        this.coverageData = JSON.parse(fs.readFileSync(coveragePath, 'utf8'));
        console.log('✓ Coverage data loaded successfully');
        return true;
      } catch (error) {
        console.error('Error loading coverage data:', error.message);
        return false;
      }
    }
    
    return false;
  }

  async runTestsForCoverage() {
    const { execSync } = require('child_process');
    
    try {
      console.log('Running tests with coverage...');
      execSync('npx jest --coverage --forceExit', {
        stdio: 'inherit',
        cwd: process.cwd()
      });
      return true;
    } catch (error) {
      console.error('Test execution failed:', error.message);
      return false;
    }
  }

  calculateMetrics() {
    const metrics = {
      totalStatements: 0,
      coveredStatements: 0,
      totalBranches: 0,
      coveredBranches: 0,
      totalFunctions: 0,
      coveredFunctions: 0,
      totalLines: 0,
      coveredLines: 0,
    };

    Object.values(this.coverageData).forEach(file => {
      // Statements
      if (file.s) {
        Object.values(file.s).forEach(count => {
          metrics.totalStatements++;
          if (count > 0) metrics.coveredStatements++;
        });
      }
      
      // Branches
      if (file.b) {
        Object.values(file.b).forEach(branches => {
          branches.forEach(count => {
            metrics.totalBranches++;
            if (count > 0) metrics.coveredBranches++;
          });
        });
      }
      
      // Functions
      if (file.f) {
        Object.values(file.f).forEach(count => {
          metrics.totalFunctions++;
          if (count > 0) metrics.coveredFunctions++;
        });
      }
      
      // Lines
      if (file.l) {
        Object.values(file.l).forEach(count => {
          metrics.totalLines++;
          if (count > 0) metrics.coveredLines++;
        });
      }
    });

    return {
      statements: {
        total: metrics.totalStatements,
        covered: metrics.coveredStatements,
        percentage: metrics.totalStatements > 0 
          ? ((metrics.coveredStatements / metrics.totalStatements) * 100).toFixed(2)
          : '0.00'
      },
      branches: {
        total: metrics.totalBranches,
        covered: metrics.coveredBranches,
        percentage: metrics.totalBranches > 0 
          ? ((metrics.coveredBranches / metrics.totalBranches) * 100).toFixed(2)
          : '0.00'
      },
      functions: {
        total: metrics.totalFunctions,
        covered: metrics.coveredFunctions,
        percentage: metrics.totalFunctions > 0 
          ? ((metrics.coveredFunctions / metrics.totalFunctions) * 100).toFixed(2)
          : '0.00'
      },
      lines: {
        total: metrics.totalLines,
        covered: metrics.coveredLines,
        percentage: metrics.totalLines > 0 
          ? ((metrics.coveredLines / metrics.totalLines) * 100).toFixed(2)
          : '0.00'
      },
    };
  }

  generateHTMLReport() {
    const metrics = this.calculateMetrics();
    const timestamp = new Date().toLocaleString();
    
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>YYC³ Easy Table Converter - Coverage Report</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh; padding: 20px;
        }
        .container { max-width: 1200px; margin: 0 auto; }
        .header {
            background: white; border-radius: 12px; padding: 30px;
            margin-bottom: 30px; box-shadow: 0 10px 40px rgba(0,0,0,0.1);
            text-align: center;
        }
        .header h1 { color: #333; margin-bottom: 10px; font-size: 2em; }
        .header p { color: #666; font-size: 14px; }
        .metrics-grid {
            display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px; margin-bottom: 30px;
        }
        .metric-card {
            background: white; border-radius: 12px; padding: 25px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08); transition: transform 0.3s;
        }
        .metric-card:hover { transform: translateY(-5px); }
        .metric-card h3 { color: #666; font-size: 14px; text-transform: uppercase; margin-bottom: 15px; }
        .percentage { font-size: 48px; font-weight: bold; margin-bottom: 5px; }
        .progress-bar {
            height: 8px; border-radius: 4px; background: #e9ecef;
            overflow: hidden; margin-top: 15px;
        }
        .progress-fill {
            height: 100%; border-radius: 4px; transition: width 0.3s ease;
        }
        .good { color: #28a745; }
        .warning { color: #ffc107; }
        .danger { color: #dc3545; }
        .bg-good { background: linear-gradient(90deg, #28a745, #34d058); }
        .bg-warning { background: linear-gradient(90deg, #ffc107, #ffda47); }
        .bg-danger { background: linear-gradient(90deg, #dc3545, #e74c5e); }
        .details { background: white; border-radius: 12px; padding: 30px; box-shadow: 0 5px 20px rgba(0,0,0,0.08); }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        th, td { padding: 15px; text-align: left; border-bottom: 1px solid #eee; }
        th { background: #f8f9fa; font-weight: 600; color: #333; }
        tr:hover { background: #f8f9fa; }
        .footer { text-align: center; margin-top: 30px; color: white; opacity: 0.8; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎯 YYC³ Easy Table Converter</h1>
            <p>Test Coverage Report | Generated on ${timestamp}</p>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <h3>📝 Statements</h3>
                <div class="percentage ${this.getColorClass(metrics.statements.percentage)}">${metrics.statements.percentage}%</div>
                <div>${metrics.statements.covered} / ${metrics.statements.total}</div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getBgColorClass(metrics.statements.percentage)}" style="width: ${metrics.statements.percentage}%"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>🔀 Branches</h3>
                <div class="percentage ${this.getColorClass(metrics.branches.percentage)}">${metrics.branches.percentage}%</div>
                <div>${metrics.branches.covered} / ${metrics.branches.total}</div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getBgColorClass(metrics.branches.percentage)}" style="width: ${metrics.branches.percentage}%"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>⚡ Functions</h3>
                <div class="percentage ${this.getColorClass(metrics.functions.percentage)}">${metrics.functions.percentage}%</div>
                <div>${metrics.functions.covered} / ${metrics.functions.total}</div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getBgColorClass(metrics.functions.percentage)}" style="width: ${metrics.functions.percentage}%"></div>
                </div>
            </div>
            
            <div class="metric-card">
                <h3>📄 Lines</h3>
                <div class="percentage ${this.getColorClass(metrics.lines.percentage)}">${metrics.lines.percentage}%</div>
                <div>${metrics.lines.covered} / ${metrics.lines.total}</div>
                <div class="progress-bar">
                    <div class="progress-fill ${this.getBgColorClass(metrics.lines.percentage)}" style="width: ${metrics.lines.percentage}%"></div>
                </div>
            </div>
        </div>

        <div class="details">
            <h2 style="margin-bottom: 20px;">📊 Detailed Metrics</h2>
            <table>
                <thead>
                    <tr>
                        <th>Metric</th>
                        <th>Covered</th>
                        <th>Total</th>
                        <th>Coverage %</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td><strong>Statements</strong></td>
                        <td>${metrics.statements.covered}</td>
                        <td>${metrics.statements.total}</td>
                        <td>${metrics.statements.percentage}%</td>
                        <td>${this.getStatusBadge(metrics.statements.percentage)}</td>
                    </tr>
                    <tr>
                        <td><strong>Branches</strong></td>
                        <td>${metrics.branches.covered}</td>
                        <td>${metrics.branches.total}</td>
                        <td>${metrics.branches.percentage}%</td>
                        <td>${this.getStatusBadge(metrics.branches.percentage)}</td>
                    </tr>
                    <tr>
                        <td><strong>Functions</strong></td>
                        <td>${metrics.functions.covered}</td>
                        <td>${metrics.functions.total}</td>
                        <td>${metrics.functions.percentage}%</td>
                        <td>${this.getStatusBadge(metrics.functions.percentage)}</td>
                    </tr>
                    <tr>
                        <td><strong>Lines</strong></td>
                        <td>${metrics.lines.covered}</td>
                        <td>${metrics.lines.total}</td>
                        <td>${metrics.lines.percentage}%</td>
                        <td>${this.getStatusBadge(metrics.lines.percentage)}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <div class="footer">
            <p>Generated by YYC³ Intelligent Implementation Expert v2.0</p>
        </div>
    </div>
</body>
</html>`;

    fs.mkdirSync(this.outputDir, { recursive: true });
    fs.writeFileSync(path.join(this.outputDir, 'index.html'), html);
  }

  getColorClass(percentage) {
    const pct = parseFloat(percentage);
    if (pct >= 80) return 'good';
    if (pct >= 60) return 'warning';
    return 'danger';
  }

  getBgColorClass(percentage) {
    const pct = parseFloat(percentage);
    if (pct >= 80) return 'bg-good';
    if (pct >= 60) return 'bg-warning';
    return 'bg-danger';
  }

  getStatusBadge(percentage) {
    const pct = parseFloat(percentage);
    if (pct >= 80) return '<span style="color: #28a745; font-weight: bold;">✓ Excellent</span>';
    if (pct >= 60) return '<span style="color: #ffc107; font-weight: bold;">⚠ Good</span>';
    return '<span style="color: #dc3545; font-weight: bold;">✗ Needs Work</span>';
  }

  generateSummaryJSON() {
    const metrics = this.calculateMetrics();
    const summary = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      project: 'YYC³ Easy Table Converter',
      metrics,
      summary: {
        averageCoverage: (
          (parseFloat(metrics.statements.percentage) + 
           parseFloat(metrics.branches.percentage) + 
           parseFloat(metrics.functions.percentage) + 
           parseFloat(metrics.lines.percentage)) / 4
        ).toFixed(2),
        status: this.getOverallStatus(metrics),
      }
    };

    fs.writeFileSync(
      path.join(this.outputDir, 'summary.json'),
      JSON.stringify(summary, null, 2)
    );
  }

  getOverallStatus(metrics) {
    const avg = (
      parseFloat(metrics.statements.percentage) +
      parseFloat(metrics.branches.percentage) +
      parseFloat(metrics.functions.percentage) +
      parseFloat(metrics.lines.percentage)
    ) / 4;

    if (avg >= 80) return 'excellent';
    if (avg >= 60) return 'good';
    return 'needs-improvement';
  }

  generateBadgeSVG() {
    const metrics = this.calculateMetrics();
    const avgCoverage = parseFloat(
      (parseFloat(metrics.statements.percentage) + 
       parseFloat(metrics.lines.percentage)) / 2
    ).toFixed(0);

    const color = avgCoverage >= 80 ? '#28a745' : avgCoverage >= 60 ? '#ffc107' : '#dc3545';

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="120" height="20">
      <linearGradient id="b" x2="0" y2="100%">
        <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
        <stop offset="1" stop-opacity=".1"/>
      </linearGradient>
      <mask id="a">
        <rect width="120" height="20" rx="3" fill="#fff"/>
      </mask>
      <g mask="url(#a)">
        <path fill="#555" d="M0 0h65v20H0z"/>
        <path fill="${color}" d="M65 0h55v20H65z"/>
        <path fill="url(#b)" d="M0 0h120v20H0z"/>
      </g>
      <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
        <text x="32.5" y="15" fill="#010101" fill-opacity=".3">coverage</text>
        <text x="32.5" y="14">coverage</text>
        <text x="91.5" y="15" fill="#010101" fill-opacity=".3">${avgCoverage}%</text>
        <text x="91.5" y="14">${avgCoverage}%</text>
      </g>
    </svg>`;

    fs.writeFileSync(path.join(this.outputDir, 'badge.svg'), svg);
  }
}

// Run if executed directly
if (require.main === module) {
  const generator = new CoverageReportGenerator();
  generator.generate()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Failed to generate coverage report:', error);
      process.exit(1);
    });
}

module.exports = CoverageReportGenerator;

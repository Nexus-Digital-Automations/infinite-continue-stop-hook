/**
 * Standalone Coverage Threshold Enforcement Script
 *
 * Enforces coverage thresholds independently of test execution.
 * Can be used in CI/CD pipelines, pre-commit hooks, And manual validation.
 *
 * @author CI/CD Integration Agent
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const DEFAULT_CONFIG = {
  thresholds: {
    statements: 80,
    branches: 75,
    functions: 80,
    lines: 80,
  },
  critical_thresholds: {
    statements: 60,
    branches: 60,
    functions: 60,
    lines: 60,
  },
  paths: {
    summary: 'coverage/coverage-summary.json',
    lcov: 'coverage/lcov.info',
    html: 'coverage/lcov-report/index.html',
  },
  strict_mode: false, // If true, warnings also cause failure
  generate_badge: true,
  update_readme: false,
};

/**
 * Coverage threshold checker logger
 */
class CoverageLogger {
  static info(message) {
    if (!process.env.QUIET) {
      loggers.stopHook.log(`📊 ${message}`);
    }
  }

  static success(message) {
    loggers.stopHook.log(`✅ ${message}`);
  }

  static warning(message) {
    loggers.stopHook.log(`⚠️  ${message}`);
  }

  static error(message) {
    loggers.stopHook.log(`❌ ${message}`);
  }

  static debug(message) {
    if (process.env.DEBUG) {
      loggers.stopHook.log(`🐛 DEBUG: ${message}`);
    }
  }

  static table(headers, rows) {
    // Simple table formatter
    const maxLengths = headers.map((header, i) =>
      Math.max(header.length, ...rows.map((row) => String(row[i] || '').length))
    );

    const separator = '─'.repeat(
      maxLengths.reduce((sum, len) => sum + len + 3, 1)
    );

    loggers.stopHook.log(`┌${separator}┐`);
    loggers.stopHook.log(
      `│ ${headers.map((h, i) => h.padEnd(maxLengths[i])).join(' │ ')} │`
    );
    loggers.stopHook.log(`├${separator}┤`);

    rows.forEach((row) => {
      loggers.stopHook.log(
        `│ ${row.map((cell, i) => String(cell || '').padEnd(maxLengths[i])).join(' │ ')} │`
      );
    });

    loggers.stopHook.log(`└${separator}┘`);
  }
}

/**
 * Coverage threshold enforcement
 */
class CoverageThresholdChecker {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.results = {
      passed: true,
      failures: [],
      warnings: [],
      summary: null,
      badge_url: null,
    };
  }

  /**
   * Main execution method
   */
  run() {
    try {
      CoverageLogger.info('Starting coverage threshold validation...');

      this.loadCoverageData();
      this.validateThresholds();

      if (this.config.generate_badge) {
        this.generateBadge();
      }

      this.generateReport();
      this.displayResults();

      // Check for failures
      const hasFailures = this.results.failures.length > 0;
      const hasWarnings = this.results.warnings.length > 0;
      const shouldFail =
        hasFailures || (this.config.strict_mode && hasWarnings);

      if (shouldFail) {
        throw new Error('Coverage validation failed');
      }
    } catch (error) {
      CoverageLogger.error(`Coverage validation failed: ${error.message}`);
      if (process.env.DEBUG) {
        loggers.stopHook.error(error.stack);
      }
      throw error;
    }
  }

  /**
   * Load coverage data from Jest output
   */
  loadCoverageData() {
    CoverageLogger.info('Loading coverage data...');

    const summaryPath = path.resolve(this.config.paths.summary);

    if (!fs.existsSync(summaryPath)) {
      // Try to generate coverage if it doesn't exist
      CoverageLogger.info('Coverage data not found, attempting to generate...');
      try {
        execSync('npm run coverage:ci', { stdio: 'inherit', timeout: 120000 });
      } catch {
        throw new Error(
          'Failed to generate coverage data. Run tests with coverage first.'
        );
      }
    }

    if (!fs.existsSync(summaryPath)) {
      throw new Error(`Coverage summary file not found at: ${summaryPath}`);
    }

    try {
      const coverageData = JSON.parse(fs.readFileSync(summaryPath, 'utf8'));

      if (!coverageData.total) {
        throw new Error('Invalid coverage data format - missing total summary');
      }

      this.results.summary = coverageData.total;
      CoverageLogger.success('Coverage data loaded successfully');
      CoverageLogger.debug(
        `Coverage summary: ${JSON.stringify(coverageData.total, null, 2)}`
      );

      return coverageData;
    } catch (error) {
      if (error.message.includes('Invalid coverage')) {
        throw error;
      }
      throw new Error(`Failed to parse coverage data: ${error.message}`);
    }
  }

  /**
   * Validate coverage against thresholds
   */
  validateThresholds() {
    CoverageLogger.info('Validating coverage thresholds...');

    const { summary } = this.results;
    const failures = [];
    const warnings = [];

    for (const [metric, threshold] of Object.entries(this.config.thresholds)) {
      if (!summary[metric]) {
        warnings.push(`Missing coverage data for metric: ${metric}`);
        continue;
      }

      const actual = summary[metric].pct;
      const critical = this.config.critical_thresholds[metric];

      if (actual < critical) {
        failures.push({
          metric,
          actual,
          required: critical,
          severity: 'critical',
          message: `${metric} coverage ${actual.toFixed(2)}% is below critical threshold ${critical}%`,
        });
      } else if (actual < threshold) {
        warnings.push({
          metric,
          actual,
          required: threshold,
          severity: 'warning',
          message: `${metric} coverage ${actual.toFixed(2)}% is below target threshold ${threshold}%`,
        });
      }
    }

    this.results.failures = failures;
    this.results.warnings = warnings;
    this.results.passed =
      failures.length === 0 &&
      (!this.config.strict_mode || warnings.length === 0);

    CoverageLogger.debug(
      `Validation complete. Failures: ${failures.length}, Warnings: ${warnings.length}`
    );
  }

  /**
   * Generate coverage badge
   */
  generateBadge() {
    CoverageLogger.info('Generating coverage badge...');

    const { summary } = this.results;
    const overallCoverage = Math.round(
      (summary.statements.pct +
        summary.branches.pct +
        summary.functions.pct +
        summary.lines.pct) /
        4
    );

    const color = this.getBadgeColor(overallCoverage);
    const badgeUrl = `https://img.shields.io/badge/coverage-${overallCoverage}%25-${color}`;

    this.results.badge_url = badgeUrl;

    // Write badge data to file for CI usage
    const badgeData = {
      coverage_percentage: overallCoverage,
      badge_url: badgeUrl,
      color,
      timestamp: new Date().toISOString(),
    };

    const badgeDir = path.join('coverage', 'badge');
    if (!fs.existsSync(badgeDir)) {
      fs.mkdirSync(badgeDir, { recursive: true });
    }

    fs.writeFileSync(
      path.join(badgeDir, 'data.json'),
      JSON.stringify(badgeData, null, 2)
    );

    CoverageLogger.success(`Coverage badge generated: ${overallCoverage}%`);
  }

  /**
   * Get badge color based on coverage percentage
   */
  getBadgeColor(percentage) {
    if (percentage >= 90) {
      return 'brightgreen';
    }
    if (percentage >= 80) {
      return 'green';
    }
    if (percentage >= 70) {
      return 'yellowgreen';
    }
    if (percentage >= 60) {
      return 'yellow';
    }
    if (percentage >= 50) {
      return 'orange';
    }
    return 'red';
  }

  /**
   * Generate validation report
   */
  generateReport() {
    CoverageLogger.info('Generating validation report...');

    const report = {
      timestamp: new Date().toISOString(),
      validation: {
        passed: this.results.passed,
        strict_mode: this.config.strict_mode,
        failures: this.results.failures,
        warnings: this.results.warnings,
      },
      coverage: this.results.summary,
      thresholds: this.config.thresholds,
      critical_thresholds: this.config.critical_thresholds,
      badge: this.results.badge_url
        ? {
            url: this.results.badge_url,
            coverage_percentage: Math.round(
              (this.results.summary.statements.pct +
                this.results.summary.branches.pct +
                this.results.summary.functions.pct +
                this.results.summary.lines.pct) /
                4
            ),
          }
        : null,
      git: this.getGitInfo(),
      environment: {
        node_version: process.version,
        ci: Boolean(process.env.CI),
        strict_mode: this.config.strict_mode,
      },
    };

    // Ensure coverage directory exists
    if (!fs.existsSync('coverage')) {
      fs.mkdirSync('coverage', { recursive: true });
    }

    fs.writeFileSync(
      'coverage/threshold-validation.json',
      JSON.stringify(report, null, 2)
    );

    CoverageLogger.success('Validation report generated');
  }

  /**
   * Display validation results
   */
  displayResults() {
    const { summary, failures, warnings, passed } = this.results;

    loggers.stopHook.log('\n📊 Coverage Threshold Validation Results:');

    // Coverage table
    const tableHeaders = ['Metric', 'Coverage', 'Target', 'Critical', 'Status'];
    const tableRows = Object.entries(this.config.thresholds).map(
      ([metric, threshold]) => {
        const actual = summary[metric]?.pct || 0;
        const critical = this.config.critical_thresholds[metric];
        let status;

        if (actual < critical) {
          status = '❌ Critical';
        } else if (actual < threshold) {
          status = '⚠️  Warning';
        } else {
          status = '✅ Pass';
        }

        return [
          metric.charAt(0).toUpperCase() + metric.slice(1),
          `${actual.toFixed(2)}%`,
          `${threshold}%`,
          `${critical}%`,
          status,
        ];
      }
    );

    CoverageLogger.table(tableHeaders, tableRows);

    // Overall status
    const overallStatus = passed ? '✅ PASSED' : '❌ FAILED';
    loggers.stopHook.log(`\nOverall Status: ${overallStatus}`);

    // Failures
    if (failures.length > 0) {
      loggers.stopHook.log(`\n❌ Critical Issues (${failures.length}):`);
      failures.forEach((failure, index) => {
        loggers.stopHook.log(`  ${index + 1}. ${failure.message}`);
      });
    }

    // Warnings
    if (warnings.length > 0) {
      loggers.stopHook.log(`\n⚠️  Warnings (${warnings.length}):`);
      warnings.forEach((warning, index) => {
        if (typeof warning === 'string') {
          loggers.stopHook.log(`  ${index + 1}. ${warning}`);
        } else {
          loggers.stopHook.log(`  ${index + 1}. ${warning.message}`);
        }
      });
    }

    // Badge information
    if (this.results.badge_url) {
      const overallCoverage = Math.round(
        (summary.statements.pct +
          summary.branches.pct +
          summary.functions.pct +
          summary.lines.pct) /
          4
      );
      loggers.stopHook.log(`\n🏷️  Coverage Badge: ${overallCoverage}%`);
      loggers.stopHook.log(`   URL: ${this.results.badge_url}`);
    }

    // Configuration info
    if (this.config.strict_mode) {
      loggers.stopHook.log(
        '\n⚠️  Running in STRICT MODE - warnings will cause failure'
      );
    }

    loggers.stopHook.log(
      `\n📁 Detailed report: coverage/threshold-validation.json`
    );

    // Exit guidance
    if (!passed) {
      loggers.stopHook.log('\n💡 To fix coverage issues:');
      loggers.stopHook.log('   1. Add tests for uncovered code');
      loggers.stopHook.log('   2. Run: npm run coverage:report');
      loggers.stopHook.log(
        '   3. Check HTML report: coverage/lcov-report/index.html'
      );
    }
  }

  /**
   * Get Git information
   */
  getGitInfo() {
    try {
      return {
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        branch: execSync('git rev-parse --abbrev-ref HEAD', {
          encoding: 'utf8',
        }).trim(),
      };
    } catch {
      return { commit: 'unknown', branch: 'unknown' };
    }
  }
}

// CLI interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.includes('--help') || args.includes('-h')) {
    loggers.stopHook.log(`
Coverage Threshold Checker

Usage: node coverage-check.js [options]

Options:
  --strict            Enable strict mode (warnings cause failure)
  --no-badge          Disable badge generation
  --quiet             Suppress info messages
  --debug             Enable debug output
  --thresholds=JSON   Override default thresholds (JSON string)
  --help, -h          Show this help message

Environment Variables:
  QUIET=true          Suppress info messages
  DEBUG=true          Enable debug output
  STRICT_MODE=true    Enable strict mode

Examples:
  node coverage-check.js
  node coverage-check.js --strict
  node coverage-check.js --thresholds='{"lines":85,"functions":85}'
  QUIET=true node coverage-check.js
    `);
    return;
  }

  const config = { ...DEFAULT_CONFIG };

  // Parse command line arguments
  if (args.includes('--strict')) {
    config.strict_mode = true;
  }

  if (args.includes('--no-badge')) {
    config.generate_badge = false;
  }

  if (process.env.STRICT_MODE === 'true') {
    config.strict_mode = true;
  }

  // Custom thresholds
  const thresholdArg = args.find((arg) => arg.startsWith('--thresholds='));
  if (thresholdArg) {
    try {
      const customThresholds = JSON.parse(thresholdArg.split('=')[1]);
      config.thresholds = { ...config.thresholds, ...customThresholds };
    } catch (error) {
      loggers.stopHook.error('❌ Invalid thresholds JSON:', error.message);
      throw error;
    }
  }

  const checker = new CoverageThresholdChecker(config);
  try {
    checker.run();
  } catch (error) {
    loggers.stopHook.error('❌ Fatal error:', error.message);
    throw error;
  }
}

module.exports = CoverageThresholdChecker;

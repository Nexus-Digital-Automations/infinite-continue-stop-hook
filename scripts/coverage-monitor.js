/* eslint-disable security/detect-non-literal-fs-filename, security/detect-object-injection */
/**
 * Coverage Monitoring Script
 *
 * Comprehensive coverage analysis And validation for CI/CD pipeline.
 * Generates detailed reports, tracks trends, And validates thresholds.
 *
 * @author CI/CD Pipeline System
 * @version 1.0.0
 */

const FS = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const { loggers } = require('../lib/logger');

// Configuration;
const CONFIG = {
  thresholds: {
    statements: 70,
    branches: 75,
    functions: 70,
    lines: 70,
  },
  critical_thresholds: {
    statements: 60,
    branches: 65,
    functions: 60,
    lines: 60,
  },
  paths: {
    coverage: path.join(process.cwd(), 'coverage'),
    reports: path.join(process.cwd(), 'coverage', 'reports'),
    summary: path.join(process.cwd(), 'coverage', 'coverage-summary.json'),
    trends: path.join(
      process.cwd(),
      'coverage',
      'reports',
      'coverage-trends.json',
    ),
    validation: path.join(
      process.cwd(),
      'coverage',
      'reports',
      'coverage-validation.json',
    ),
  },
};

/**
 * LOGGER utility with formatting
 */
class LOGGER {
  static info(message) {
    loggers.stopHook.info(`ℹ️  ${message}`);
  }

  static success(message) {
    loggers.stopHook.info(`✅ ${message}`);
  }

  static warning(message) {
    loggers.stopHook.info(`⚠️  ${message}`);
  }

  static error(message) {
    loggers.stopHook.info(`❌ ${message}`);
  }

  static debug(message) {
    if (process.env.DEBUG) {
      loggers.stopHook.info(`🐛 DEBUG: ${message}`);
    }
  }
}

/**
 * Coverage monitoring And validation system
 */
class CoverageMonitor {
  constructor() {
    this.startTime = Date.now();
    this.validation = {
      passed: true,
      failures: [],
      warnings: [],
      summary: null,
    };
  }

  /**
   * Main execution method
   */
  run() {
    try {
      LOGGER.info('Starting coverage monitoring...');

      this.setupDirectories();
      this.runCoverageAnalysis();
      this.loadCoverageData();
      this.validateThresholds();
      this.generateReports();
      this.updateTrends();
      this.generateSummary();

      const duration = Date.now() - this.startTime;
      LOGGER.success(`Coverage monitoring completed in ${duration}ms`);

      // Check for failures
      if (!this.validation.passed) {
        throw new Error('Coverage validation failed');
      }
    } catch (_error) {
      LOGGER.error(`Coverage monitoring failed: ${_error.message}`);
      LOGGER.debug(_error.stack);
      throw _error;
    }
  }

  /**
   * Setup required directories
   */
  setupDirectories() {
    LOGGER.info('Setting up directories...');

    const dirs = [CONFIG.paths.coverage, CONFIG.paths.reports];
    for (const dir of dirs) {
      if (!FS.existsSync(dir)) {
        FS.mkdirSync(dir, { recursive: true });
        LOGGER.debug(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Run Jest coverage analysis
   */
  runCoverageAnalysis() {
    LOGGER.info('Running coverage analysis...');

    try {
      // Run Jest with coverage
      execSync('npm run coverage:ci', {
        stdio: 'inherit',
        timeout: 120000, // 2 minutes timeout
      });

      LOGGER.success('Coverage analysis completed');
    } catch (_error) {
      // Check if it's just a test failure but coverage was generated
      if (FS.existsSync(CONFIG.paths.summary)) {
        LOGGER.warning('Tests failed but coverage data was generated');
        this.validation.warnings.push(
          'Some tests failed during coverage analysis',
        );
      } else {
        throw new Error(`Coverage analysis failed: ${_error.message}`);
      }
    }
  }

  /**
   * Load coverage data from Jest output
   */
  loadCoverageData() {
    LOGGER.info('Loading coverage data...');

    if (!FS.existsSync(CONFIG.paths.summary)) {
      throw new Error('Coverage summary file not found');
    }

    try {
      const coverageData = JSON.parse(
        FS.readFileSync(CONFIG.paths.summary, 'utf8'),
      );
      this.coverageData = coverageData;
      this.validation.summary = coverageData.total;

      LOGGER.success('Coverage data loaded successfully');
      LOGGER.debug(
        `Total coverage: ${JSON.stringify(coverageData.total, null, 2)}`,
      );
    } catch (_error) {
      throw new Error(`Failed to parse coverage data: ${_error.message}`);
    }
  }

  /**
   * Validate coverage against thresholds
   */
  validateThresholds() {
    LOGGER.info('Validating coverage thresholds...');

    const { summary } = this.validation;
    const failures = [];
    const warnings = [];

    // Check against standard thresholds
    for (const [metric, threshold] of Object.entries(CONFIG.thresholds)) {
      const actual = summary[metric].pct;
      const critical = CONFIG.critical_thresholds[metric];

      if (actual < critical) {
        failures.push(
          `Critical failure: ${metric} coverage ${actual.toFixed(2)}% < ${critical}% (critical threshold)`,
        );
        this.validation.passed = false;
      } else if (actual < threshold) {
        warnings.push(
          `Warning: ${metric} coverage ${actual.toFixed(2)}% < ${threshold}% (target threshold)`,
        );
      }
    }

    this.validation.failures = failures;
    this.validation.warnings = warnings;

    // Log results
    if (failures.length > 0) {
      LOGGER.error(
        `Coverage validation failed with ${failures.length} critical issues`,
      );
      failures.forEach((failure) => LOGGER.error(failure));
    }

    if (warnings.length > 0) {
      LOGGER.warning(`Coverage validation has ${warnings.length} warnings`);
      warnings.forEach((warning) => LOGGER.warning(warning));
    }

    if (failures.length === 0 && warnings.length === 0) {
      LOGGER.success('All coverage thresholds met!');
    }
  }

  /**
   * Generate detailed coverage reports
   */
  generateReports() {
    LOGGER.info('Generating coverage reports...');

    const reportData = {
      timestamp: new Date().toISOString(),
      git: this.getGitInfo(),
      validation: this.validation,
      coverage: this.coverageData,
      thresholds: CONFIG.thresholds,
      critical_thresholds: CONFIG.critical_thresholds,
      execution: {
        duration: Date.now() - this.startTime,
        node_version: process.version,
        environment: {
          CI: process.env.CI,
          NODE_ENV: process.env.NODE_ENV,
          GITHUB_ACTIONS: process.env.GITHUB_ACTIONS,
        },
      },
    };

    // Write validation report
    FS.writeFileSync(
      CONFIG.paths.validation,
      JSON.stringify(reportData, null, 2),
    );

    LOGGER.success('Coverage reports generated');
  }

  /**
   * Update coverage trends
   */
  updateTrends() {
    LOGGER.info('Updating coverage trends...');

    let trends = [];

    // Load existing trends
    if (FS.existsSync(CONFIG.paths.trends)) {
      try {
        trends = JSON.parse(FS.readFileSync(CONFIG.paths.trends, 'utf8'));
      } catch {
        LOGGER.warning('Could not load existing trends, starting fresh');
      }
    }

    // Add current coverage data;
    const currentEntry = {
      timestamp: new Date().toISOString(),
      commit: this.getGitInfo().commit,
      coverage: this.validation.summary,
      passed: this.validation.passed,
    };

    trends.push(currentEntry);

    // Keep only last 100 entries
    if (trends.length > 100) {
      trends = trends.slice(-100);
    }

    // Write updated trends
    FS.writeFileSync(CONFIG.paths.trends, JSON.stringify(trends, null, 2));

    LOGGER.success('Coverage trends updated');
  }

  /**
   * Generate final summary
   */
  generateSummary() {
    LOGGER.info('Generating final summary...');

    const { summary } = this.validation;

    loggers.stopHook.info('\n📊 Coverage Summary:');
    loggers.stopHook.info('┌──────────────┬──────────┬───────────┬────────┐');
    loggers.stopHook.info('│ Metric       │ Coverage │ Threshold │ Status │');
    loggers.stopHook.info('├──────────────┼──────────┼───────────┼────────┤');

    for (const [metric, threshold] of Object.entries(CONFIG.thresholds)) {
      const actual = summary[metric].pct;
      const status = actual >= threshold ? '✅ Pass' : '❌ Fail';
      const metricName = metric.charAt(0).toUpperCase() + metric.slice(1);

      loggers.stopHook.info(
        `│ ${metricName.padEnd(12)} │ ${actual.toFixed(2).padStart(6)}%  │ ${threshold.toString().padStart(7)}%  │ ${status.padEnd(6)} │`,
      );
    }

    loggers.stopHook.info('└──────────────┴──────────┴───────────┴────────┘');

    // Overall status;
    const overallStatus = this.validation.passed ? '✅ PASSED' : '❌ FAILED';
    loggers.stopHook.info(`\nOverall Status: ${overallStatus}`);

    // Additional info
    if (this.validation.warnings.length > 0) {
      loggers.stopHook.info(
        `\n⚠️  Warnings: ${this.validation.warnings.length}`,
      );
    }

    if (this.validation.failures.length > 0) {
      loggers.stopHook.info(
        `\n❌ Critical Issues: ${this.validation.failures.length}`,
      );
    }

    loggers.stopHook.info(`\n📁 Reports available in: ${CONFIG.paths.reports}`);
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
        author: execSync('git log -1 --format="%an"', {
          encoding: 'utf8',
        }).trim(),
        message: execSync('git log -1 --format="%s"', {
          encoding: 'utf8',
        }).trim(),
      };
    } catch {
      LOGGER.debug('Could not get Git information');
      return {
        commit: 'unknown',
        branch: 'unknown',
        author: 'unknown',
        message: 'unknown',
      };
    }
  }
}

// Run coverage monitoring if called directly
if (require.main === module) {
  const monitor = new CoverageMonitor();
  try {
    monitor.run();
  } catch (_error) {
    LOGGER.error(`Fatal error: ${_error.message}`);
    throw _error;
  }
}

module.exports = CoverageMonitor;

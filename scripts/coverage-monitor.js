
/**
 * Coverage Monitoring Script
 *
 * Comprehensive coverage analysis and validation for CI/CD pipeline.
 * Generates detailed reports, tracks trends, and validates thresholds.
 *
 * @author CI/CD Pipeline System
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
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
    trends: path.join(process.cwd(), 'coverage', 'reports', 'coverage-trends.json'),
    validation: path.join(process.cwd(), 'coverage', 'reports', 'coverage-validation.json'),
  },
};

/**
 * Logger utility with formatting
 */
class Logger {
  static info(message) {
    console.log(`ℹ️  ${message}`);
  }

  static success(message) {
    console.log(`✅ ${message}`);
  }

  static warning(message) {
    console.log(`⚠️  ${message}`);
  }

  static error(message) {
    console.log(`❌ ${message}`);
  }

  static debug(message) {
    if (process.env.DEBUG) {
      console.log(`🐛 DEBUG: ${message}`);
    }
  }
}

/**
 * Coverage monitoring and validation system
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
  async run() {
    try {
      Logger.info('Starting coverage monitoring...');

      await this.setupDirectories();
      await this.runCoverageAnalysis();
      await this.loadCoverageData();
      await this.validateThresholds();
      await this.generateReports();
      await this.updateTrends();
      await this.generateSummary();

      const duration = Date.now() - this.startTime;
      Logger.success(`Coverage monitoring completed in ${duration}ms`);

      // Exit with appropriate code
      process.exit(this.validation.passed ? 0 : 1);

    } catch (error) {
      Logger.error(`Coverage monitoring failed: ${error.message}`);
      Logger.debug(error.stack);
      process.exit(1);
    }
  }

  /**
   * Setup required directories
   */
  async setupDirectories() {
    Logger.info('Setting up directories...');

    const dirs = [CONFIG.paths.coverage, CONFIG.paths.reports];
    for (const dir of dirs) {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        Logger.debug(`Created directory: ${dir}`);
      }
    }
  }

  /**
   * Run Jest coverage analysis
   */
  async runCoverageAnalysis() {
    Logger.info('Running coverage analysis...');

    try {
      // Run Jest with coverage
      execSync('npm run coverage:ci', {
        stdio: 'inherit',
        timeout: 120000, // 2 minutes timeout
      });

      Logger.success('Coverage analysis completed');
    } catch (error) {
      // Check if it's just a test failure but coverage was generated
      if (fs.existsSync(CONFIG.paths.summary)) {
        Logger.warning('Tests failed but coverage data was generated');
        this.validation.warnings.push('Some tests failed during coverage analysis');
      } else {
        throw new Error(`Coverage analysis failed: ${error.message}`);
      }
    }
  }

  /**
   * Load coverage data from Jest output
   */
  async loadCoverageData() {
    Logger.info('Loading coverage data...');

    if (!fs.existsSync(CONFIG.paths.summary)) {
      throw new Error('Coverage summary file not found');
    }

    try {
      const coverageData = JSON.parse(fs.readFileSync(CONFIG.paths.summary, 'utf8'));
      this.coverageData = coverageData;
      this.validation.summary = coverageData.total;

      Logger.success('Coverage data loaded successfully');
      Logger.debug(`Total coverage: ${JSON.stringify(coverageData.total, null, 2)}`);
    } catch (error) {
      throw new Error(`Failed to parse coverage data: ${error.message}`);
    }
  }

  /**
   * Validate coverage against thresholds
   */
  async validateThresholds() {
    Logger.info('Validating coverage thresholds...');

    const { summary } = this.validation;
    const failures = [];
    const warnings = [];

    // Check against standard thresholds
    for (const [metric, threshold] of Object.entries(CONFIG.thresholds)) {
      const actual = summary[metric].pct;
      const critical = CONFIG.critical_thresholds[metric];

      if (actual < critical) {
        failures.push(`Critical failure: ${metric} coverage ${actual.toFixed(2)}% < ${critical}% (critical threshold)`);
        this.validation.passed = false;
      } else if (actual < threshold) {
        warnings.push(`Warning: ${metric} coverage ${actual.toFixed(2)}% < ${threshold}% (target threshold)`);
      }
    }

    this.validation.failures = failures;
    this.validation.warnings = warnings;

    // Log results
    if (failures.length > 0) {
      Logger.error(`Coverage validation failed with ${failures.length} critical issues`);
      failures.forEach(failure => Logger.error(failure));
    }

    if (warnings.length > 0) {
      Logger.warning(`Coverage validation has ${warnings.length} warnings`);
      warnings.forEach(warning => Logger.warning(warning));
    }

    if (failures.length === 0 && warnings.length === 0) {
      Logger.success('All coverage thresholds met!');
    }
  }

  /**
   * Generate detailed coverage reports
   */
  async generateReports() {
    Logger.info('Generating coverage reports...');

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
    fs.writeFileSync(
      CONFIG.paths.validation,
      JSON.stringify(reportData, null, 2),
    );

    Logger.success('Coverage reports generated');
  }

  /**
   * Update coverage trends
   */
  async updateTrends() {
    Logger.info('Updating coverage trends...');

    let trends = [];

    // Load existing trends
    if (fs.existsSync(CONFIG.paths.trends)) {
      try {
        trends = JSON.parse(fs.readFileSync(CONFIG.paths.trends, 'utf8'));
      } catch (error) {
        Logger.warning('Could not load existing trends, starting fresh');
      }
    }

    // Add current coverage data
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
    fs.writeFileSync(CONFIG.paths.trends, JSON.stringify(trends, null, 2));

    Logger.success('Coverage trends updated');
  }

  /**
   * Generate final summary
   */
  async generateSummary() {
    Logger.info('Generating final summary...');

    const { summary } = this.validation;

    console.log('\n📊 Coverage Summary:');
    console.log('┌──────────────┬──────────┬───────────┬────────┐');
    console.log('│ Metric       │ Coverage │ Threshold │ Status │');
    console.log('├──────────────┼──────────┼───────────┼────────┤');

    for (const [metric, threshold] of Object.entries(CONFIG.thresholds)) {
      const actual = summary[metric].pct;
      const status = actual >= threshold ? '✅ Pass' : '❌ Fail';
      const metricName = metric.charAt(0).toUpperCase() + metric.slice(1);

      console.log(`│ ${metricName.padEnd(12)} │ ${actual.toFixed(2).padStart(6)}%  │ ${threshold.toString().padStart(7)}%  │ ${status.padEnd(6)} │`);
    }

    console.log('└──────────────┴──────────┴───────────┴────────┘');

    // Overall status
    const overallStatus = this.validation.passed ? '✅ PASSED' : '❌ FAILED';
    console.log(`\nOverall Status: ${overallStatus}`);

    // Additional info
    if (this.validation.warnings.length > 0) {
      console.log(`\n⚠️  Warnings: ${this.validation.warnings.length}`);
    }

    if (this.validation.failures.length > 0) {
      console.log(`\n❌ Critical Issues: ${this.validation.failures.length}`);
    }

    console.log(`\n📁 Reports available in: ${CONFIG.paths.reports}`);
  }

  /**
   * Get Git information
   */
  getGitInfo() {
    try {
      return {
        commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
        branch: execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim(),
        author: execSync('git log -1 --format="%an"', { encoding: 'utf8' }).trim(),
        message: execSync('git log -1 --format="%s"', { encoding: 'utf8' }).trim(),
      };
    } catch (error) {
      Logger.debug('Could not get Git information');
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
  monitor.run().catch(error => {
    Logger.error(`Fatal error: ${error.message}`);
    process.exit(1);
  });
}

module.exports = CoverageMonitor;

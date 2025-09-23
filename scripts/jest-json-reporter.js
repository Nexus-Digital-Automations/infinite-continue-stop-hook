/**
 * Jest JSON Reporter for CI/CD Integration
 *
 * Custom Jest reporter that generates machine-readable JSON test results
 * for CI/CD pipeline analysis and reporting.
 *
 * @author Testing Infrastructure Agent
 * @version 2.0.0
 * @since 2025-09-23
 */

const fs = require('fs');
const path = require('path');

class JestJsonReporter {
  constructor(globalConfig, options = {}) {
    this.globalConfig = globalConfig;
    this.options = {
      outputPath: options.outputPath || './coverage/reports/test-results.json',
      includeTestCases: options.includeTestCases !== false,
      includeAssertionResults: options.includeAssertionResults !== false,
      includeConsoleOutput: options.includeConsoleOutput !== false,
      ...options
    };
  }

  onRunComplete(contexts, results) {
    const report = this.generateReport(results);
    this.writeReport(report);
  }

  generateReport(results) {
    const report = {
      metadata: {
        generator: 'Jest JSON Reporter v2.0.0',
        timestamp: new Date().toISOString(),
        node_version: process.version,
        jest_version: require('jest/package.json').version,
        environment: {
          ci: process.env.CI === 'true',
          platform: process.platform,
          arch: process.arch
        }
      },
      summary: {
        success: results.success,
        numTotalTests: results.numTotalTests,
        numPassedTests: results.numPassedTests,
        numFailedTests: results.numFailedTests,
        numPendingTests: results.numPendingTests,
        numTodoTests: results.numTodoTests,
        numTotalTestSuites: results.numTotalTestSuites,
        numPassedTestSuites: results.numPassedTestSuites,
        numFailedTestSuites: results.numFailedTestSuites,
        numPendingTestSuites: results.numPendingTestSuites,
        startTime: results.startTime,
        runtime: Date.now() - results.startTime,
        coverageMap: results.coverageMap ? this.processCoverageMap(results.coverageMap) : null
      },
      testResults: this.processTestResults(results.testResults)
    };

    return report;
  }

  processTestResults(testResults) {
    return testResults.map(result => {
      const processedResult = {
        filePath: result.testFilePath,
        relativePath: path.relative(process.cwd(), result.testFilePath),
        success: result.numFailingTests === 0 && !result.skipped,
        skipped: result.skipped,
        numTests: result.numPassingTests + result.numFailingTests + result.numPendingTests,
        numPassingTests: result.numPassingTests,
        numFailingTests: result.numFailingTests,
        numPendingTests: result.numPendingTests,
        perfStats: {
          start: result.perfStats.start,
          end: result.perfStats.end,
          runtime: result.perfStats.runtime || (result.perfStats.end - result.perfStats.start)
        },
        coverage: result.coverage ? this.processCoverage(result.coverage) : null
      };

      if (this.options.includeTestCases) {
        processedResult.testCases = this.processAssertionResults(result.assertionResults);
      }

      if (this.options.includeConsoleOutput && result.console) {
        processedResult.console = result.console.map(entry => ({
          type: entry.type,
          message: entry.message,
          origin: entry.origin
        }));
      }

      if (result.failureMessage) {
        processedResult.failureMessage = result.failureMessage;
      }

      return processedResult;
    });
  }

  processAssertionResults(assertionResults) {
    if (!this.options.includeAssertionResults) {
      return assertionResults.map(result => ({
        title: result.title,
        status: result.status,
        duration: result.duration
      }));
    }

    return assertionResults.map(result => ({
      ancestorTitles: result.ancestorTitles,
      title: result.title,
      fullName: result.fullName,
      status: result.status,
      duration: result.duration,
      failureMessages: result.failureMessages,
      location: result.location,
      invocations: result.invocations
    }));
  }

  processCoverageMap(coverageMap) {
    if (!coverageMap || typeof coverageMap.getCoverageSummary !== 'function') {
      return null;
    }

    const summary = coverageMap.getCoverageSummary();
    return {
      lines: {
        total: summary.lines.total,
        covered: summary.lines.covered,
        percentage: summary.lines.pct
      },
      statements: {
        total: summary.statements.total,
        covered: summary.statements.covered,
        percentage: summary.statements.pct
      },
      functions: {
        total: summary.functions.total,
        covered: summary.functions.covered,
        percentage: summary.functions.pct
      },
      branches: {
        total: summary.branches.total,
        covered: summary.branches.covered,
        percentage: summary.branches.pct
      }
    };
  }

  processCoverage(coverage) {
    if (!coverage) return null;

    return Object.keys(coverage).reduce((acc, filePath) => {
      const fileCoverage = coverage[filePath];
      acc[filePath] = {
        path: filePath,
        lines: fileCoverage.getLineCoverage ? fileCoverage.getLineCoverage() : null,
        functions: fileCoverage.getFunctionCoverage ? fileCoverage.getFunctionCoverage() : null,
        branches: fileCoverage.getBranchCoverage ? fileCoverage.getBranchCoverage() : null,
        statements: fileCoverage.getStatementCoverage ? fileCoverage.getStatementCoverage() : null
      };
      return acc;
    }, {});
  }

  writeReport(report) {
    try {
      // Ensure output directory exists
      const outputDir = path.dirname(this.options.outputPath);
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Write JSON report
      fs.writeFileSync(this.options.outputPath, JSON.stringify(report, null, 2));

      // Also write a summary file for quick access
      const summaryPath = this.options.outputPath.replace('.json', '-summary.json');
      fs.writeFileSync(summaryPath, JSON.stringify(report.summary, null, 2));

      console.log(`📊 JSON test report written to: ${this.options.outputPath}`);

    } catch (error) {
      console.error('❌ Failed to write JSON test report:', error.message);
    }
  }
}

module.exports = JestJsonReporter;
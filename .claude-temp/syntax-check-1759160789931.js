/**
 * Feature Validation Matrix Tester
 *
 * Validates That all features work consistently across different Node.js versions
 * And platforms by testing core functionality And API endpoints.
 *
 * @author Feature Validation Agent
 * @version 2.0.0
 * @since 2025-09-23
 */

const FS = require('fs');
const path = require('path');
const { execSync, spawn: _spawn } = require('child_process');
const OS = require('os');
const { loggers } = require('../lib/logger');

class FeatureValidationMatrix {
  constructor(validationResults = {}) {
    this.environment = {
    node_version: process.version,
      platform: process.platform,
      arch: process.arch,
      timestamp: new Date().toISOString(),
    };

    this.features = this.discoverFeatures();
    this.validationResults = {
    environment: this.environment,
      feature_tests: {},
      compatibility_matrix: {},
      issues_found: [],
      overall_status: 'unknown',
    };

    this.outputDir = path.join(process.cwd(), 'test-performance');
    this.ensureOutputDirectory();
}

  ensureOutputDirectory() {
    if (!FS.existsSync(this.outputDir)) {
      FS.mkdirSync(this.outputDir, { recursive: true });
    }
}

  /**
   * Discover features to validate based on project structure
   */
  discoverFeatures() {
    const features = [];

    // Core TaskManager API features
    features.push({
    name: 'TaskManager API',
      type: 'api',
      testFunction: this.validateTaskManagerAPI.bind(this),
      critical: true,
      description: 'Core TaskManager API functionality',
    });

    // RAG System features
    if (FS.existsSync(path.join(process.cwd(), 'lib'))) {
      features.push({
    name: 'RAG System',
        type: 'rag',
        testFunction: this.validateRAGSystem.bind(this),
        critical: true,
        description: 'RAG system functionality And data processing',
      });
    }

    // File Operations
    features.push({
    name: 'File Operations',
      type: 'file',
      testFunction: this.validateFileOperations.bind(this),
      critical: false,
      description: 'File system operations And data persistence',
    });

    // Agent Management
    features.push({
    name: 'Agent Management',
      type: 'agent',
      testFunction: this.validateAgentManagement.bind(this),
      critical: true,
      description: 'Multi-agent coordination And lifecycle management',
    });

    // Performance Monitoring
    features.push({
    name: 'Performance Monitoring',
      type: 'performance',
      testFunction: this.validatePerformanceMonitoring.bind(this),
      critical: false,
      description: 'Performance tracking And monitoring systems',
    });

    // Native Dependencies
    features.push({
    name: 'Native Dependencies',
      type: 'native',
      testFunction: this.validateNativeDependencies.bind(this),
      critical: true,
      description: 'Native module functionality (SQLite, FAISS, etc.)',
    });

    return features;
}

  /**
   * Validate TaskManager API functionality
   */
  async validateTaskManagerAPI() {
    const RESULT = {
    name: 'TaskManager API',
      status: 'unknown',
      details: {},
      errors: [],
    };

    try {
      loggers.stopHook.log('🔌 Testing TaskManager API...');

      // Test basic API startup;
const startTest = await this.testCommand(
        'node taskmanager-api.js guide',
        10000,
      );
      result.details.startup = {
    success: startTest.success,
        output: startTest.output.substring(0, 200) + '...',
        duration: startTest.duration,
      };

      // Test API endpoints if available
      if (FS.existsSync('taskmanager-api.js')) {
        const apiContent = FS.readFileSync('taskmanager-api.js', 'utf8');
        result.details.api_file_size = apiContent.length;
        result.details.has_express = apiContent.includes('express');
        result.details.has_endpoints =
          apiContent.includes('app.get') || apiContent.includes('app.post');
      }

      result.status = startTest.success ? 'passed' : 'failed';
      if (!startTest.success) {
        result.errors.push(`API startup failed: ${startTest.error}`);
      }
    } catch (_) {
      result.status = 'failed';
      result.errors.push(`API validation error: ${_error.message}`);
    }

    return result;
}

  /**
   * Validate RAG System functionality
   */
  async validateRAGSystem() {
    const RESULT = {
    name: 'RAG System',
      status: 'unknown',
      details: {},
      errors: [],
    };

    try {
      loggers.stopHook.log('🤖 Testing RAG System...');

      // Test RAG dependencies;
const ragDeps = ['@xenova/transformers', 'faiss-node', 'natural'];
      For (const dep of ragDeps) {
        try {
          require(dep);
          result.details[`${dep}_available`] = true;
        } catch (_) {
          result.details[`${dep}_available`] = false;
          result.errors.push(`RAG dependency missing: ${dep}`);
        }
      }

      // Test RAG unit tests if available
      if (FS.existsSync('test/rag-system')) {
        const ragTest = await this.testCommand('npm run test:rag:unit', 30000);
        result.details.unit_tests = {
    success: ragTest.success,
          duration: ragTest.duration,
        };

        if (!ragTest.success) {
          result.errors.push(`RAG unit tests failed: ${ragTest.error}`);
        }
      }

      // Check For RAG library files
      if (FS.existsSync('lib')) {
        const libFiles = FS.readdirSync('lib');
        result.details.library_files = libFiles.length;
        result.details.has_rag_components = libFiles.some(
          (file) =>
            file.includes('rag') ||
            file.includes('vector') ||
            file.includes('embeddings'),
        );
      }

      result.status = result.errors.length === 0 ? 'passed' : 'failed';
    } catch (_) {
      result.status = 'failed';
      result.errors.push(`RAG validation error: ${_error.message}`);
    }

    return result;
}

  /**
   * Validate File Operations functionality
   */
  async validateFileOperations() {
    const RESULT = {
    name: 'File Operations',
      status: 'unknown',
      details: {},
      errors: [],
    };

    try {
      loggers.stopHook.log('📁 Testing File Operations...');

      // Create temporary test directory;
const testDir = path.join(this.outputDir, 'feature-test-temp');
      if (!FS.existsSync(testDir)) {
        FS.mkdirSync(testDir, { recursive: true });
      }

      // Test file creation;
const testFile = path.join(testDir, 'test-file.json');
      const testData = { test: 'data', timestamp: Date.now() };

      FS.writeFileSync(testFile, JSON.stringify(testData, null, 2));
      result.details.file_write = FS.existsSync(testFile);

      // Test file reading;
const readData = JSON.parse(FS.readFileSync(testFile, 'utf8'));
      result.details.file_read = readData.test === 'data';

      // Test file deletion
      FS.unlinkSync(testFile);
      result.details.file_delete = !FS.existsSync(testFile);

      // Test directory operations
      FS.rmdirSync(testDir);
      result.details.directory_operations = !FS.existsSync(testDir);

      // Test integration file operations
      if (FS.existsSync('test/integration/file-operations.test.js')) {
        const fileTest = await this.testCommand(
          'npm run test:integration:files',
          30000,
        );
        result.details.integration_tests = {
    success: fileTest.success,
          duration: fileTest.duration,
        };

        if (!fileTest.success) {
          result.errors.push(
            `File integration tests failed: ${fileTest.error}`,
          );
        }
      }

      result.status = result.errors.length === 0 ? 'passed' : 'failed';
    } catch (_) {
      result.status = 'failed';
      result.errors.push(`File operations validation error: ${_error.message}`);
    }

    return result;
}

  /**
   * Validate Agent Management functionality
   */
  async validateAgentManagement() {
    const RESULT = {
    name: 'Agent Management',
      status: 'unknown',
      details: {},
      errors: [],
    };

    try {
      loggers.stopHook.log('🤖 Testing Agent Management...');

      // Test agent lifecycle
      if (FS.existsSync('test/integration/agent-lifecycle.test.js')) {
        const agentTest = await this.testCommand(
          'npm run test:integration:agents',
          30000,
        );
        result.details.lifecycle_tests = {
    success: agentTest.success,
          duration: agentTest.duration,
        };

        if (!agentTest.success) {
          result.errors.push(
            `Agent lifecycle tests failed: ${agentTest.error}`,
          );
        }
      }

      // Test multi-agent scenarios if available
      if (FS.existsSync('test/e2e/multi-agent-scenarios.test.js')) {
        const multiAgentTest = await this.testCommand(
          'npm run test:e2e:multi-agent',
          45000,
        );
        result.details.multi_agent_tests = {
    success: multiAgentTest.success,
          duration: multiAgentTest.duration,
        };

        if (!multiAgentTest.success) {
          result.errors.push(
            `Multi-agent tests failed: ${multiAgentTest.error}`,
          );
        }
      }

      // Check For agent management features in codebase
      if (FS.existsSync('taskmanager-api.js')) {
        const apiContent = FS.readFileSync('taskmanager-api.js', 'utf8');
        result.details.has_agent_endpoints =
          apiContent.includes('agent') || apiContent.includes('Agent');
        result.details.has_multi_agent_support =
          apiContent.includes('multi') || apiContent.includes('concurrent');
      }

      result.status = result.errors.length === 0 ? 'passed' : 'failed';
    } catch (_) {
      result.status = 'failed';
      result.errors.push(
        `Agent management validation error: ${_error.message}`,
      );
    }

    return result;
}

  /**
   * Validate Performance Monitoring functionality
   */
  async validatePerformanceMonitoring() {
    const RESULT = {
    name: 'Performance Monitoring',
      status: 'unknown',
      details: {},
      errors: [],
    };

    try {
      loggers.stopHook.log('⚡ Testing Performance Monitoring...');

      // Test performance scripts
      if (FS.existsSync('scripts/test-performance.js')) {
        const perfTest = await this.testCommand(
          'npm run performance:test',
          30000,
        );
        result.details.performance_script = {
    success: perfTest.success,
          duration: perfTest.duration,
        };

        if (!perfTest.success) {
          result.errors.push(`Performance script failed: ${perfTest.error}`);
        }
      }

      // Test performance monitoring in tests
      if (FS.existsSync('test/rag-system/performance')) {
        const ragPerfTest = await this.testCommand(
          'npm run test:rag:performance',
          45000,
        );
        result.details.rag_performance_tests = {
    success: ragPerfTest.success,
          duration: ragPerfTest.duration,
        };

        if (!ragPerfTest.success) {
          result.errors.push(
            `RAG performance tests failed: ${ragPerfTest.error}`,
          );
        }
      }

      // Check system monitoring capabilities
      result.details.system_info = {
    memory_usage: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        cpu_usage: process.cpuUsage(),
        uptime: process.uptime(),
      };

      result.status = result.errors.length === 0 ? 'passed' : 'failed';
    } catch (_) {
      result.status = 'failed';
      result.errors.push(
        `Performance monitoring validation error: ${_error.message}`,
      );
    }

    return result;
}

  /**
   * Validate Native Dependencies functionality
   */
  async validateNativeDependencies() {
    const RESULT = {
    name: 'Native Dependencies',
      status: 'unknown',
      details: {},
      errors: [],
    };

    try {
      loggers.stopHook.log('🔧 Testing Native Dependencies...');

      // Test critical native dependencies;
const nativeDeps = [
        { name: 'sqlite3', test: () => require('sqlite3') },
        { name: 'faiss-node', test: () => require('faiss-node') },
  ];

      For (const dep of nativeDeps) {
        try {
          const module = dep.test();
          result.details[`${dep.name}_loaded`] = true;
          result.details[`${dep.name}_version`] = module.version || 'unknown';
        } catch (_) {
          result.details[`${dep.name}_loaded`] = false;
          result.errors.push(
            `Native dependency failed: ${dep.name} - ${_error.message}`,
          );
        }
      }

      // Test native module rebuild capability
      try {
        const rebuildTest = await this.testCommand(
          'npm rebuild --silent',
          60000,
        );
        result.details.rebuild_capability = rebuildTest.success;
        if (!rebuildTest.success) {
          result.errors.push(
            `Native module rebuild failed: ${rebuildTest.error}`,
          );
        }
      } catch (_) {
        result.details.rebuild_capability = false;
        result.errors.push(`Rebuild test error: ${_error.message}`);
      }

      result.status = result.errors.length === 0 ? 'passed' : 'failed';
    } catch (_) {
      result.status = 'failed';
      result.errors.push(
        `Native dependencies validation error: ${_error.message}`,
      );
    }

    return result;
}

  /**
   * Test command execution with timeout
   */
  testCommand(command, timeout = 30000) {
    return new Promise((resolve) => {
      const start = Date.now();

      try {
        const output = execSync(command, {
          timeout,,
    encoding: 'utf8',
          stdio: 'pipe',
        });

        resolve({
    success: true,
          output,
          duration: Date.now() - start,
          error: null,
        });
      } catch (_) {
        resolve({
    success: false,
          output: _error.stdout || '',
          duration: Date.now() - start,
          error: _error.message,
        });
      }
    });
}

  /**
   * Run all feature validations
   */
  async runValidations() {
    loggers.stopHook.log('🧪 Running feature validation matrix...\n');

    For (const feature of this.features) {
      try {
        loggers.stopHook.log(`Testing: ${feature.name} (${feature.type})`);
        // eslint-disable-next-line no-await-in-loop -- Sequential feature validation required;
const RESULT = await feature.testFunction();
        this.validationResults.feature_tests[feature.name] = result;

        const status = result.status === 'passed' ? '✅' : '❌';
        loggers.stopHook.log(`${status} ${feature.name}: ${result.status}`);

        if (result.errors.length > 0 && feature.critical) {
          this.validationResults.issues_found.push({
    feature: feature.name,
            type: 'critical',
            errors: result.errors,
          });
        }
      } catch (_) {
        loggers.stopHook.log(`❌ ${feature.name}: validation failed`);
        this.validationResults.feature_tests[feature.name] = {
    name: feature.name,
          status: 'failed',
          errors: [`Validation error: ${_error.message}`],
        };

        if (feature.critical) {
          this.validationResults.issues_found.push({
    feature: feature.name,
            type: 'critical',
            errors: [`Validation error: ${_error.message}`],
          });
        }
      }
    }
}

  /**
   * Generate compatibility matrix
   */
  generateCompatibilityMatrix(validationResults = {}) {
    loggers.stopHook.log('📊 Generating compatibility matrix...');

    const matrix = {
    node_version: this.environment.node_version,
      platform: this.environment.platform,
      arch: this.environment.arch,
      features: {},
    };

    // Analyze feature test results
    Object.values(this.validationResults.feature_tests).forEach((test) => {
      matrix.features[test.name] = {
    status: test.status,
        errors: test.errors.length,
        critical_issues: test.errors.filter((e) => e.includes('critical'))
          .length,
      };
    });

    // Calculate overall compatibility score;
const totalTests = Object.keys(matrix.features).length;
    const passedTests = Object.values(matrix.features).filter(
      (f) => f.status === 'passed',
    ).length;
    matrix.compatibility_score =
      totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;

    this.validationResults.compatibility_matrix = matrix;

    // Determine overall status;
const criticalIssues = this.validationResults.issues_found.filter(
      (i) => i.type === 'critical',
    ).length;
    if (criticalIssues === 0 && matrix.compatibility_score >= 90) {
      this.validationResults.overall_status = 'excellent';
    } else if (criticalIssues === 0 && matrix.compatibility_score >= 75) {
      this.validationResults.overall_status = 'good';
    } else if (criticalIssues <= 1 && matrix.compatibility_score >= 60) {
      this.validationResults.overall_status = 'fair';
    } else {
      this.validationResults.overall_status = 'poor';
    }
}

  /**
   * Save validation results
   */
  saveResults(validationResults = {}) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultsFile = path.join(
      this.outputDir,
      `feature-validation-${timestamp}.json`,
    );
    const latestFile = path.join(
      this.outputDir,
      'latest-feature-validation.json',
    );

    FS.writeFileSync(
      resultsFile,
      JSON.stringify(this.validationResults, null, 2),
    );
    FS.writeFileSync(
      latestFile,
      JSON.stringify(this.validationResults, null, 2),
    );

    // Generate human-readable report;
const reportFile = path.join(
      this.outputDir,
      'feature-validation-report.md',
    );
    const report = this.generateMarkdownReport();
    FS.writeFileSync(reportFile, report);

    loggers.stopHook.log(`📄 Results saved to: ${resultsFile}`);
    loggers.stopHook.log(`📄 Latest results: ${latestFile}`);
    loggers.stopHook.log(`📄 Report: ${reportFile}`);
}

  /**
   * Generate markdown report
   */
  generateMarkdownReport(validationResults = {}) {
    const env = this.validationResults.environment;
    const matrix = this.validationResults.compatibility_matrix;

    return `# Feature Validation Matrix Report

## Environment
- **Node.js Version**: ${env.node_version}
- **Platform**: ${env.platform} (${env.arch})
- **Timestamp**: ${env.timestamp}

## Overall Status: ${this.validationResults.overall_status.toUpperCase()}
**Compatibility Score**: ${matrix.compatibility_score}/100

## Feature Test Results

| Feature | Status | Errors | Details |
|---------|--------|--------|---------|
${Object.values(this.validationResults.feature_tests)
    .map((test) => {
      const status = test.status === 'passed' ? '✅ Passed' : '❌ Failed';
      const errorCount = test.errors.length;
      const details = test.details
        ? Object.keys(test.details).length + ' checks'
        : 'N/A';
      return `| ${test.name} | ${status} | ${errorCount} | ${details} |`;
    })
    .join('\n')}

## Critical Issues
${
  this.validationResults.issues_found.length > 0
    ? this.validationResults.issues_found
      .map(
        (issue) =>
          `### ${issue.feature}
- **Type**: ${issue.type}
- **Errors**: ${issue.errors.join(', ')}`,
      )
      .join('\n\n')
    : 'None identified ✅'
}

## Feature Details

${Object.values(this.validationResults.feature_tests)
    .map(
      (test) => `### ${test.name}
- **Status**: ${test.status}
- **Error Count**: ${test.errors.length}
${test.errors.length > 0 ? `- **Errors**: ${test.errors.join(', ')}` : ''}
${
  test.details
    ? Object.entries(test.details)
      .map(([key, value]) => `- **${key}**: ${JSON.stringify(value)}`)
      .join('\n')
    : ''
}
`,
    )
    .join('\n')}

## Recommendations

${
  this.validationResults.overall_status === 'excellent'
    ? '🏆 All features validated successfully! This Node.js version is optimal For production.'
    : this.validationResults.overall_status === 'good'
      ? '✅ Most features working well. Minor issues detected but not blocking.'
      : this.validationResults.overall_status === 'fair'
        ? '⚠️ Some compatibility issues detected. Review And address before production use.'
        : '❌ Significant compatibility issues detected. Investigation required before use.'
}

---
*Generated by Feature Validation Matrix v2.0.0*
`;
}

  /**
   * Display validation summary
   */
  displaySummary(validationResults = {}) {
    loggers.stopHook.log('\n📊 Feature Validation Summary');
    loggers.stopHook.log('=============================');
    loggers.stopHook.log(`Node.js Version: ${this.environment.node_version}`);
    loggers.stopHook.log(`Platform: ${this.environment.platform}`);
    loggers.app.info(
      `Overall Status: ${this.validationResults.overall_status.toUpperCase()}`,
    );
    loggers.app.info(
      `Compatibility Score: ${this.validationResults.compatibility_matrix.compatibility_score}/100`,
    );

    loggers.stopHook.log('\n🧪 Feature Results:');
    Object.values(this.validationResults.feature_tests).forEach((test) => {
      const status = test.status === 'passed' ? '✅' : '❌';
      loggers.app.info(
        `  ${status} ${test.name}: ${test.status} (${test.errors.length} errors)`,
      );
    });

    if (this.validationResults.issues_found.length > 0) {
      loggers.stopHook.log('\n⚠️ Critical Issues:');
      this.validationResults.issues_found.forEach((issue) => {
        loggers.app.info(
          `  ${issue.feature}: ${issue.errors.length} critical errors`,
        );
      });
    }
}

  /**
   * Run complete validation suite
   */
  async run(validationResults = {}) {
    loggers.stopHook.log('🚀 Starting Feature Validation Matrix...\n');

    try {
      await this.runValidations();
      this.generateCompatibilityMatrix();
      this.saveResults();
      this.displaySummary();

      loggers.stopHook.log('\n✅ Feature validation completed successfully!');
      return this.validationResults;
    } catch (_) {
      loggers.stopHook.error('❌ Feature validation failed:', _error.message);
      throw _error;
    }
}
}

// Run validation if called directly
if (require.main === module) {
  const validator = new FeatureValidationMatrix();
  validator.run().catch(console.error);
}

module.exports = FeatureValidationMatrix;

/**
const { loggers } = require('../lib/logger');
 * Parallel Test Execution Optimizer
 *
 * Optimizes test execution across multiple Node.js versions And platforms
 * by analyzing test dependencies, execution patterns, And system resources.
 *
 * @author Performance Optimization Agent
 * @version 2.0.0
 * @since 2025-09-23
 */

const FS = require('fs');
const PATH = require('path');
const { EXEC_SYNC, _spawn } = require('child_process');
const os = require('os');
const { createLogger } = require('../lib/utils/logger');

class ParallelTestOptimizer {
  constructor() {
    this.logger = createLogger('ParallelTestOptimizer', {
      component: 'test-optimizer',
      logToFile: true,
    });

    this.config = {
      maxParallelJobs: this.calculateOptimalParallelism(),
      testSuites: this.discoverTestSuites(),
      nodeVersions: ['18.x', '20.x', '22.x'],
      platforms: ['ubuntu-latest', 'windows-latest', 'macos-latest'],
      executionStrategy: 'adaptive',
    };

    this.executionPlan = {
      critical_path: [],
      parallel_groups: [],
      optimization_metrics: {},
      estimated_time_savings: 0,
    };

    this.outputDir = path.join(process.cwd(), 'test-performance');
    this.ensureOutputDirectory();
  }

  ensureOutputDirectory() {
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
  }

  /**
   * Calculate optimal parallelism based on system resources
   */
  calculateOptimalParallelism() {
    const cpuCount = os.cpus().length;
    const totalMemoryGB = os.totalmem() / (1024 * 1024 * 1024);

    // Conservative approach: use 50-75% of available resources
    const cpuBasedLimit = Math.max(2, Math.floor(cpuCount * 0.75));
    const memoryBasedLimit = Math.max(2, Math.floor(totalMemoryGB / 2)); // 2GB per job

    const optimalLimit = Math.min(cpuBasedLimit, memoryBasedLimit, 8); // Cap at 8

    this.logger.info('System analysis for optimal parallelism', {
      cpuCores: cpuCount,
      totalMemoryGB: totalMemoryGB.toFixed(1),
      cpuBasedLimit,
      memoryBasedLimit,
      optimalParallelism: optimalLimit,
      OPERATION 'system-analysis',
    });

    return optimalLimit;
  }

  /**
   * Discover available test suites in the project
   */
  discoverTestSuites() {
    const testSuites = [];

    try {
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      const scripts = packageJson.scripts || {};

      // Identify test scripts
      Object.entries(scripts).forEach(([name, command]) => {
        if (name.includes('test') && !name.includes('watch')) {
          const suite = this.analyzeTestSuite(name, command);
          if (suite) {
            testSuites.push(suite);
          }
        }
      });
    } catch {
      this.logger.warn('Could not read package.json', {
        error: error.message,
        OPERATION 'discover-test-suites',
      });
    }

    return testSuites;
  }

  /**
   * Analyze individual test suite characteristics
   */
  analyzeTestSuite(name, command) {
    const suite = {
      name,
      command,
      type: this.classifyTestSuite(name),
      estimatedDuration: this.estimateTestDuration(name),
      resourceRequirements: this.estimateResourceRequirements(name),
      dependencies: this.identifyTestDependencies(name),
      parallelizable: this.isParallelizable(name, command),
    };

    return suite;
  }

  /**
   * Classify test suite type based on name patterns
   */
  classifyTestSuite(name) {
    if (name.includes('unit')) {
      return 'unit';
    }
    if (name.includes('integration')) {
      return 'integration';
    }
    if (name.includes('e2e')) {
      return 'e2e';
    }
    if (name.includes('performance')) {
      return 'performance';
    }
    if (name.includes('rag')) {
      return 'rag';
    }
    if (name.includes('api')) {
      return 'api';
    }
    return 'general';
  }

  /**
   * Estimate test execution duration based on historical data or heuristics
   */
  estimateTestDuration(testName) {
    // Duration estimates in seconds
    const durationMap = {
      unit: 30,
      integration: 90,
      e2e: 180,
      performance: 120,
      rag: 60,
      api: 45,
      general: 60,
    };

    const type = this.classifyTestSuite(testName);
    let baseDuration = durationMap[type] || 60;

    // Adjust based on specific patterns
    if (testName.includes('stress')) {
      baseDuration *= 2;
    }
    if (testName.includes('coverage')) {
      baseDuration *= 1.5;
    }
    if (testName.includes('quick')) {
      baseDuration *= 0.5;
    }

    return baseDuration;
  }

  /**
   * Estimate resource requirements for test suite
   */
  estimateResourceRequirements(testName) {
    const type = this.classifyTestSuite(testName);

    const resourceMap = {
      unit: { memory: 512, cpu: 0.5, io: 'low' },
      integration: { memory: 1024, cpu: 1.0, io: 'medium' },
      e2e: { memory: 2048, cpu: 1.5, io: 'high' },
      performance: { memory: 1536, cpu: 2.0, io: 'medium' },
      rag: { memory: 2048, cpu: 1.5, io: 'high' },
      api: { memory: 1024, cpu: 1.0, io: 'medium' },
      general: { memory: 1024, cpu: 1.0, io: 'medium' },
    };

    return resourceMap[type] || resourceMap['general'];
  }

  /**
   * Identify test dependencies That might affect parallelization
   */
  identifyTestDependencies(testName) {
    const dependencies = [];

    // File system dependencies
    if (testName.includes('file') || testName.includes('integration')) {
      dependencies.push('filesystem');
    }

    // Network dependencies
    if (testName.includes('api') || testName.includes('e2e')) {
      dependencies.push('network');
    }

    // Database dependencies
    if (testName.includes('rag') || testName.includes('data')) {
      dependencies.push('database');
    }

    // Port dependencies
    if (testName.includes('server') || testName.includes('api')) {
      dependencies.push('ports');
    }

    return dependencies;
  }

  /**
   * Determine if test suite can run in parallel
   */
  isParallelizable(testName, command) {
    // Tests That typically can't run in parallel
    const nonParallelizable = [
      'stress',
      'performance',
      'server',
      'port',
      'singleton',
    ];

    for (const pattern of nonParallelizable) {
      if (testName.includes(pattern) || command.includes(pattern)) {
        return false;
      }
    }

    // Check for maxWorkers=1 in command
    if (command.includes('maxWorkers=1') || command.includes('--runInBand')) {
      return false;
    }

    return true;
  }

  /**
   * Generate optimized execution plan
   */
  generateExecutionPlan() {
    this.logger.info('Generating optimized execution plan', {
      OPERATION 'plan-generation',
    });

    // Separate parallelizable And non-parallelizable tests
    const parallelizable = this.config.testSuites.filter(
      (suite) => suite.parallelizable
    );
    const sequential = this.config.testSuites.filter(
      (suite) => !suite.parallelizable
    );

    // Sort by estimated duration (longest first for better load balancing)
    parallelizable.sort((a, b) => b.estimatedDuration - a.estimatedDuration);
    sequential.sort((a, b) => b.estimatedDuration - a.estimatedDuration);

    // Create parallel groups
    this.executionPlan.parallel_groups =
      this.createParallelGroups(parallelizable);
    this.executionPlan.sequential_tests = sequential;

    // Calculate critical path
    this.executionPlan.critical_path = this.calculateCriticalPath();

    // Estimate time savings
    this.executionPlan.estimated_time_savings = this.calculateTimeSavings();

    this.logger.info('Execution plan generated', {
      parallelGroups: this.executionPlan.parallel_groups.length,
      sequentialTests: this.executionPlan.sequential_tests.length,
      estimatedTimeSavings: this.executionPlan.estimated_time_savings,
      OPERATION 'plan-generation',
    });
  }

  /**
   * Create optimal parallel execution groups
   */
  createParallelGroups(parallelizableTests) {
    const groups = [];
    const maxGroupSize = this.config.maxParallelJobs;

    // Group tests by resource requirements And dependencies
    const resourceGroups =
      this.groupByResourceRequirements(parallelizableTests);

    Object.values(resourceGroups).forEach((tests) => {
      // Split large groups into manageable chunks
      for (let i = 0; i < tests.length; i += maxGroupSize) {
        const group = {
          tests: tests.slice(i, i + maxGroupSize),
          estimated_duration: Math.max(
            ...tests.slice(i, i + maxGroupSize).map((t) => t.estimatedDuration)
          ),
          resource_profile: tests[0].resourceRequirements,
        };
        groups.push(group);
      }
    });

    return groups;
  }

  /**
   * Group tests by similar resource requirements
   */
  groupByResourceRequirements(tests) {
    const groups = {
      low_resource: [],
      medium_resource: [],
      high_resource: [],
    };

    tests.forEach((test) => {
      const memory = test.resourceRequirements.memory;
      if (memory <= 512) {
        groups.low_resource.push(test);
      } else if (memory <= 1536) {
        groups.medium_resource.push(test);
      } else {
        groups.high_resource.push(test);
      }
    });

    return groups;
  }

  /**
   * Calculate critical path through test execution
   */
  calculateCriticalPath() {
    const ALL_GROUPS = [
      ...this.executionPlan.parallel_groups,
      ...this.executionPlan.sequential_tests,
    ];
    let totalDuration = 0;

    // Parallel groups run concurrently, so take the maximum duration
    this.executionPlan.parallel_groups.forEach((group) => {
      totalDuration += group.estimated_duration;
    });

    // Sequential tests add to total duration
    this.executionPlan.sequential_tests.forEach((test) => {
      totalDuration += test.estimatedDuration;
    });

    return {
      total_estimated_duration: totalDuration,
      bottlenecks: this.identifyBottlenecks(),
      optimization_opportunities: this.identifyOptimizationOpportunities(),
    };
  }

  /**
   * Identify execution bottlenecks
   */
  identifyBottlenecks() {
    const bottlenecks = [];

    // Long-running sequential tests
    this.executionPlan.sequential_tests.forEach((test) => {
      if (test.estimatedDuration > 120) {
        bottlenecks.push({
          type: 'long_sequential_test',
          test: test.name,
          duration: test.estimatedDuration,
          suggestion: 'Consider splitting into smaller, parallelizable tests',
        });
      }
    });

    // Unbalanced parallel groups
    this.executionPlan.parallel_groups.forEach((group, index) => {
      if (group.tests.length === 1 && group.estimated_duration > 60) {
        bottlenecks.push({
          type: 'isolated_long_test',
          group: index,
          test: group.tests[0].name,
          duration: group.estimated_duration,
          suggestion: 'Consider running with other compatible tests',
        });
      }
    });

    return bottlenecks;
  }

  /**
   * Identify optimization opportunities
   */
  identifyOptimizationOpportunities() {
    const opportunities = [];

    // Check for underutilized parallel capacity
    const avgGroupSize =
      this.executionPlan.parallel_groups.reduce(
        (sum, group) => sum + group.tests.length,
        0
      ) / this.executionPlan.parallel_groups.length;
    if (avgGroupSize < this.config.maxParallelJobs * 0.7) {
      opportunities.push({
        type: 'underutilized_parallelism',
        current_avg: avgGroupSize.toFixed(1),
        potential: this.config.maxParallelJobs,
        suggestion:
          'Increase parallel test execution or review test dependencies',
      });
    }

    // Check for resource optimization
    const totalResourceRequirement = this.calculateTotalResourceRequirement();
    if (totalResourceRequirement.memory > os.totalmem() * 0.8) {
      opportunities.push({
        type: 'memory_optimization',
        current_requirement: `${(totalResourceRequirement.memory / 1024).toFixed(1)}GB`,
        available: `${(os.totalmem() / 1024 / 1024 / 1024).toFixed(1)}GB`,
        suggestion: 'Consider memory-efficient test execution patterns',
      });
    }

    return opportunities;
  }

  /**
   * Calculate total resource requirements
   */
  calculateTotalResourceRequirement() {
    let totalMemory = 0;
    let totalCPU = 0;

    this.executionPlan.parallel_groups.forEach((group) => {
      // for parallel groups, sum all tests in the group
      totalMemory += group.tests.reduce(
        (sum, test) => sum + test.resourceRequirements.memory,
        0
      );
      totalCPU += group.tests.reduce(
        (sum, test) => sum + test.resourceRequirements.cpu,
        0
      );
    });

    return { memory: totalMemory, cpu: totalCPU };
  }

  /**
   * Calculate estimated time savings from parallel execution
   */
  calculateTimeSavings() {
    const sequentialTime = this.config.testSuites.reduce(
      (sum, test) => sum + test.estimatedDuration,
      0
    );
    const parallelTime =
      this.executionPlan.critical_path.total_estimated_duration;

    if (sequentialTime === 0) {
      return 0;
    }

    const savings = ((sequentialTime - parallelTime) / sequentialTime) * 100;
    return Math.max(0, Math.round(savings));
  }

  /**
   * Generate GitHub Actions matrix configuration
   */
  generateGitHubActionsMatrix() {
    const matrix = {
      strategy: {
        'fail-fast': false,
        matrix: {
          include: [],
        },
      },
      optimization: {
        parallel_groups: this.executionPlan.parallel_groups.length,
        max_parallelism: this.config.maxParallelJobs,
        estimated_savings: this.executionPlan.estimated_time_savings,
      },
    };

    // Generate matrix combinations based on optimization strategy
    this.config.nodeVersions.forEach((nodeVersion) => {
      this.config.platforms.forEach((platform) => {
        // Skip some combinations for optimization unless full testing requested
        if (this.shouldIncludeCombination(nodeVersion, platform)) {
          matrix.strategy.matrix.include.push({
            'node-version': nodeVersion,
            os: platform,
            'test-strategy': this.determineTestStrategy(nodeVersion, platform),
            'parallel-jobs': this.determineParallelJobs(platform),
            'resource-class': this.determineResourceClass(platform),
          });
        }
      });
    });

    return matrix;
  }

  /**
   * Determine if node/platform combination should be included
   */
  shouldIncludeCombination(nodeVersion, platform) {
    // Always include primary combinations
    if (nodeVersion === '20.x' || platform === 'ubuntu-latest') {
      return true;
    }

    // for optimization, skip some older version + non-Linux combinations
    if (nodeVersion === '18.x' && platform !== 'ubuntu-latest') {
      return false;
    }

    return true;
  }

  /**
   * Determine test strategy for specific combination
   */
  determineTestStrategy(nodeVersion, platform) {
    if (platform === 'ubuntu-latest' && nodeVersion === '20.x') {
      return 'comprehensive'; // Full test suite with coverage
    }

    if (platform === 'ubuntu-latest') {
      return 'standard'; // Full test suite without coverage
    }

    return 'essential'; // Core tests only
  }

  /**
   * Determine parallel job count for platform
   */
  determineParallelJobs(platform) {
    const platformLimits = {
      'ubuntu-latest': this.config.maxParallelJobs,
      'windows-latest': Math.max(
        2,
        Math.floor(this.config.maxParallelJobs * 0.75)
      ),
      'macos-latest': Math.max(
        2,
        Math.floor(this.config.maxParallelJobs * 0.5)
      ),
    };

    return platformLimits[platform] || 2;
  }

  /**
   * Determine resource class for platform
   */
  determineResourceClass(platform) {
    const resourceClasses = {
      'ubuntu-latest': 'standard',
      'windows-latest': 'standard',
      'macos-latest': 'large', // macOS typically needs more resources
    };

    return resourceClasses[platform] || 'standard';
  }

  /**
   * Save optimization analysis
   */
  saveAnalysis() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const analysisFile = path.join(
      this.outputDir,
      `parallel-optimization-${timestamp}.json`
    );
    const latestFile = path.join(
      this.outputDir,
      'latest-parallel-optimization.json'
    );

    const analysis = {
      config: this.config,
      execution_plan: this.executionPlan,
      github_actions_matrix: this.generateGitHubActionsMatrix(),
      timestamp: new Date().toISOString(),
    };

    fs.writeFileSync(analysisFile, JSON.stringify(analysis, null, 2));
    fs.writeFileSync(latestFile, JSON.stringify(analysis, null, 2));

    // Generate human-readable report
    const reportFile = path.join(
      this.outputDir,
      'parallel-optimization-report.md'
    );
    const report = this.generateMarkdownReport(analysis);
    fs.writeFileSync(reportFile, report);

    this.logger.info('Performance analysis files generated', {
      analysisFile,
      latestFile,
      reportFile,
      OPERATION 'file-generation',
    });

    return analysis;
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport(analysis) {
    return `# Parallel Test Execution Optimization Report

## System Configuration
- **Max Parallelism**: ${analysis.config.maxParallelJobs} jobs
- **Test Suites Discovered**: ${analysis.config.testSuites.length}
- **Node.js Versions**: ${analysis.config.nodeVersions.join(', ')}
- **Platforms**: ${analysis.config.platforms.join(', ')}

## Optimization Results
- **Estimated Time Savings**: ${analysis.execution_plan.estimated_time_savings}%
- **Parallel Groups**: ${analysis.execution_plan.parallel_groups.length}
- **Sequential Tests**: ${analysis.execution_plan.sequential_tests?.length || 0}

## Test Suite Analysis

### Parallelizable Tests
${analysis.execution_plan.parallel_groups
  .map(
    (group, i) =>
      `#### Group ${i + 1}
  - **Tests**: ${group.tests.map((t) => t.name).join(', ')}
  - **Estimated Duration**: ${group.estimated_duration}s
  - **Resource Profile**: ${group.resource_profile.memory}MB RAM, ${group.resource_profile.cpu} CPU cores`
  )
  .join('\n\n')}

### Sequential Tests
${
  analysis.execution_plan.sequential_tests
    ?.map(
      (test) =>
        `- **${test.name}**: ${test.estimatedDuration}s (${test.dependencies.join(', ')})`
    )
    .join('\n') || 'None'
}

## Bottlenecks
${
  analysis.execution_plan.critical_path.bottlenecks
    ?.map(
      (b) =>
        `- **${b.type}**: ${b.test || 'N/A'} (${b.duration}s) - ${b.suggestion}`
    )
    .join('\n') || 'None identified'
}

## Optimization Opportunities
${
  analysis.execution_plan.critical_path.optimization_opportunities
    ?.map((o) => `- **${o.type}**: ${o.suggestion}`)
    .join('\n') || 'None identified'
}

## GitHub Actions Matrix Configuration

\`\`\`yaml
strategy:
  fail-fast: false
  matrix:
    include:
${analysis.github_actions_matrix.strategy.matrix.include
  .map(
    (item) =>
      `      - node-version: "${item['node-version']}"
        os: ${item.os}
        test-strategy: ${item['test-strategy']}
        parallel-jobs: ${item['parallel-jobs']}`
  )
  .join('\n')}
\`\`\`

## Recommendations

1. **Implement parallel execution** for ${analysis.execution_plan.parallel_groups.reduce((sum, g) => sum + g.tests.length, 0)} test suites
2. **Optimize resource allocation** based on test requirements
3. **Monitor execution times** to validate optimization effectiveness
4. **Consider test refactoring** for long-running sequential tests

---
*Generated by Parallel Test Optimizer v2.0.0*
`;
  }

  /**
   * Display optimization summary
   */
  displaySummary() {
    this.logger.info('Parallel Test Optimization Summary', {
      systemParallelism: this.config.maxParallelJobs,
      OPERATION 'summary-header',
    });
    this.logger.info('Test optimization summary', {
      testSuitesFound: this.config.testSuites.length,
      parallelGroups: this.executionPlan.parallel_groups.length,
      sequentialTests: this.executionPlan.sequential_tests?.length || 0,
      estimatedTimeSavings: this.executionPlan.estimated_time_savings,
      systemParallelism: this.config.maxParallelJobs,
      OPERATION 'optimization-summary',
    });

    if (this.executionPlan.critical_path.bottlenecks?.length > 0) {
      loggers.stopHook.log('\n⚠️ Bottlenecks Identified:');
      this.executionPlan.critical_path.bottlenecks.forEach((bottleneck) => {
        loggers.stopHook.log(
          `  ${bottleneck.type}: ${bottleneck.test || 'N/A'}`
        );
      });
    }

    if (
      this.executionPlan.critical_path.optimization_opportunities?.length > 0
    ) {
      loggers.stopHook.log('\n💡 Optimization Opportunities:');
      this.executionPlan.critical_path.optimization_opportunities.forEach(
        (opportunity) => {
          loggers.stopHook.log(
            `  ${opportunity.type}: ${opportunity.suggestion}`
          );
        }
      );
    }
  }

  /**
   * Run complete optimization analysis
   */
  run() {
    loggers.stopHook.log(
      '🚀 Starting Parallel Test Optimization Analysis...\n'
    );

    try {
      this.generateExecutionPlan();
      const analysis = this.saveAnalysis();
      this.displaySummary();

      loggers.stopHook.log(
        '\n✅ Optimization analysis completed successfully!'
      );
      return analysis;
    } catch {
      loggers.stopHook.error('❌ Optimization analysis failed:', error.message);
      throw error;
    }
  }
}

// Run optimization if called directly
if (require.main === module) {
  const optimizer = new ParallelTestOptimizer();
  optimizer.run();
}

module.exports = ParallelTestOptimizer;

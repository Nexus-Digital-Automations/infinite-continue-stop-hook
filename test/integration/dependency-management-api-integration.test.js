/**
 * Integration Tests for Dependency Management API
 *
 * Tests the integration between ValidationDependencyManager And TaskManager API endpoints,
 * including API responses, error handling, And system-level functionality.
 */

const { execSync } = require('child_process');
const FS = require('fs').promises;
const path = require('path');

describe('Dependency Management API Integration Tests', () => {
  const PROJECT_ROOT = process.cwd();
  const API_TIMEOUT = 10000;

  // Helper function to execute TaskManager API commands
  const executeTaskManagerCommand = (command, args = '', options = {}) => {
    const timeout = options.timeout || API_TIMEOUT;
    const fullCommand = `timeout ${timeout / 1000}s node "${PROJECT_ROOT}/taskmanager-api.js" ${command} ${args}`;

    try {
      const output = execSync(fullCommand, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: timeout,
        ...options,
      });

      return JSON.parse(output.trim());
    } catch (_) {
      if (_error.stdout) {
        try {
          return JSON.parse(_error.stdout.trim());
        } catch (_) {
          throw new Error(
            `Command failed: ${_error.message}, Output: ${_error.stdout || _error.stderr}`,
          );
        }
      }
      throw _error;
    }
  };

  describe('Dependency Graph API Endpoints', () => {
    test('get-dependency-graph should return complete dependency configuration', () => {
      const result = executeTaskManagerCommand('get-dependency-graph');

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('dependencyGraph');
      expect(result).toHaveProperty('visualization');

      // Verify all standard criteria are present
      const dependencies = result.dependencyGraph;
      expect(dependencies).toHaveProperty('focused-codebase');
      expect(dependencies).toHaveProperty('security-validation');
      expect(dependencies).toHaveProperty('linter-validation');
      expect(dependencies).toHaveProperty('type-validation');
      expect(dependencies).toHaveProperty('build-validation');
      expect(dependencies).toHaveProperty('start-validation');
      expect(dependencies).toHaveProperty('test-validation');

      // Verify visualization structure
      const viz = result.visualization;
      expect(viz).toHaveProperty('nodes');
      expect(viz).toHaveProperty('edges');
      expect(viz).toHaveProperty('statistics');
      expect(viz.nodes).toHaveLength(7);
      expect(viz.statistics.totalCriteria).toBe(7);
    });

    test('validate-dependency-graph should validate clean graph', () => {
      const result = executeTaskManagerCommand('validate-dependency-graph');

      expect(result.success).toBe(true);
      expect(result.validation.valid).toBe(true);
      expect(result.validation.issues).toHaveLength(0);
      expect(result.totalCriteria).toBe(7);
      expect(result.totalDependencies).toBeGreaterThanOrEqual(0);
      expect(result.message).toContain('validation passed');
    });

    test('get-dependency-visualization should return visualization data', () => {
      const result = executeTaskManagerCommand('get-dependency-visualization');

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('visualization');

      const viz = result.visualization;
      expect(viz).toHaveProperty('nodes');
      expect(viz).toHaveProperty('edges');
      expect(viz).toHaveProperty('statistics');

      // Verify node structure
      expect(viz.nodes[0]).toHaveProperty('id');
      expect(viz.nodes[0]).toHaveProperty('label');
      expect(viz.nodes[0]).toHaveProperty('description');
      expect(viz.nodes[0]).toHaveProperty('estimatedDuration');
      expect(viz.nodes[0]).toHaveProperty('parallelizable');
      expect(viz.nodes[0]).toHaveProperty('resourceRequirements');
    });
  });

  describe('Execution Planning API Endpoints', () => {
    test('generate-validation-execution-plan should return optimal execution sequence', () => {
      const result = executeTaskManagerCommand(
        'generate-validation-execution-plan',
      );

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('executionOrder');
      expect(result).toHaveProperty('totalCriteria');

      const order = result.executionOrder;
      expect(order).toBeInstanceOf(Array);
      expect(order.length).toBe(7);

      // Verify each order item has proper structure
      order.forEach((item) => {
        expect(item).toHaveProperty('criterion');
        expect(typeof item.criterion).toBe('string');
      });

      // Verify dependency constraints
      const criteriaOrder = order.map((item) => item.criterion);
      const linterIndex = criteriaOrder.indexOf('linter-validation');
      const buildIndex = criteriaOrder.indexOf('build-validation');
      const startIndex = criteriaOrder.indexOf('start-validation');

      // Build must come after linter
      expect(buildIndex).toBeGreaterThan(linterIndex);
      // Start must come after build
      expect(startIndex).toBeGreaterThan(buildIndex);
    });

    test('generate-validation-execution-plan with specific criteria should work correctly', () => {
      const criteria = [
        'linter-validation',
        'build-validation',
        'test-validation',
      ];
      const result = executeTaskManagerCommand(
        'generate-validation-execution-plan',
        `'${JSON.stringify(criteria)}'`,
      );

      expect(result.success).toBe(true);
      expect(result.executionOrder.length).toBe(3);

      const orderCriteria = result.executionOrder.map((item) => item.criterion);
      expect(orderCriteria).toContain('linter-validation');
      expect(orderCriteria).toContain('build-validation');
      expect(orderCriteria).toContain('test-validation');

      // Build should still come after linter
      const linterIndex = orderCriteria.indexOf('linter-validation');
      const buildIndex = orderCriteria.indexOf('build-validation');
      expect(buildIndex).toBeGreaterThan(linterIndex);
    });

    test('generate-parallel-execution-plan should create optimized parallel plan', () => {
      const result = executeTaskManagerCommand(
        'generate-parallel-execution-plan',
        'null 4',
      );

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('plan');
      expect(result).toHaveProperty('totalWaves');
      expect(result).toHaveProperty('estimatedTotalDuration');
      expect(result).toHaveProperty('sequentialDuration');
      expect(result).toHaveProperty('parallelizationGain');
      expect(result).toHaveProperty('efficiency');
      expect(result).toHaveProperty('recommendations');

      // Verify parallel plan structure
      expect(result.plan).toBeInstanceOf(Array);
      expect(result.totalWaves).toBeGreaterThan(0);
      expect(result.parallelizationGain).toBeGreaterThan(0);

      // Verify wave structure
      if (result.plan.length > 0) {
        const firstWave = result.plan[0];
        expect(firstWave).toHaveProperty('wave');
        expect(firstWave).toHaveProperty('criteria');
        expect(firstWave).toHaveProperty('estimatedDuration');
        expect(firstWave).toHaveProperty('concurrency');
        expect(firstWave.criteria).toBeInstanceOf(Array);
      }
    });

    test('generate-parallel-execution-plan with constrained concurrency should work', () => {
      const result = executeTaskManagerCommand(
        'generate-parallel-execution-plan',
        'null 2',
      );

      expect(result.success).toBe(true);
      expect(result.plan).toBeInstanceOf(Array);

      // With concurrency limit of 2, no wave should exceed 2 criteria
      result.plan.forEach((wave) => {
        expect(wave.concurrency).toBeLessThanOrEqual(2);
        expect(wave.criteria.length).toBeLessThanOrEqual(2);
      });
    });

    test('generate-adaptive-execution-plan should create system-aware plan', () => {
      const systemInfo = {
        availableCPUs: 8,
        availableMemory: 16 * 1024 * 1024 * 1024,
        networkLatency: 25,
        diskIOLoad: 0.4,
      };

      const result = executeTaskManagerCommand(
        'generate-adaptive-execution-plan',
        `'${JSON.stringify(systemInfo)}'`,
      );

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('plan');
      expect(result).toHaveProperty('adaptiveOptimizations');

      const optimizations = result.adaptiveOptimizations;
      expect(optimizations).toHaveProperty('systemAware');
      expect(optimizations).toHaveProperty('resourceScheduling');
      expect(optimizations).toHaveProperty('executionTiming');

      const systemAware = optimizations.systemAware;
      expect(systemAware.recommendedConcurrency).toBeGreaterThan(0);
      expect(systemAware.cpuOptimized).toBeGreaterThan(0);
      expect(systemAware.memoryOptimized).toBeGreaterThan(0);
      expect(systemAware.networkOptimized).toBeGreaterThan(0);
      expect(systemAware.diskOptimized).toBeGreaterThan(0);
    });
  });

  describe('Dependency CRUD Operations API Endpoints', () => {
    test('add-dependency should create new dependency configuration', () => {
      const dependencyConfig = {
        dependencies: [{ criterion: 'linter-validation', type: 'strict' }],
        description: 'Integration test custom validation',
        estimatedDuration: 15000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      };

      const result = executeTaskManagerCommand(
        'add-dependency',
        `'integration-test-validation' '${JSON.stringify(dependencyConfig)}'`,
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully added');
      expect(result.criterion).toBe('integration-test-validation');

      // Verify the dependency was added by retrieving it
      const getResult = executeTaskManagerCommand(
        'get-dependency',
        'integration-test-validation',
      );
      expect(getResult.success).toBe(true);
      expect(getResult.dependency.criterion).toBe(
        'integration-test-validation',
      );
      expect(getResult.dependency.metadata.description).toBe(
        'Integration test custom validation',
      );
    });

    test('get-dependency should retrieve specific dependency configuration', () => {
      const result = executeTaskManagerCommand(
        'get-dependency',
        'build-validation',
      );

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('dependency');

      const dependency = result.dependency;
      expect(dependency.criterion).toBe('build-validation');
      expect(dependency).toHaveProperty('dependencies');
      expect(dependency).toHaveProperty('metadata');
      expect(dependency.metadata.description).toBe(
        'Tests application build process',
      );
      expect(dependency.dependencies.length).toBeGreaterThan(0);
    });

    test('get-dependency should handle non-existent criterion', () => {
      const result = executeTaskManagerCommand(
        'get-dependency',
        'non-existent-criterion',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('remove-dependency should delete dependency configuration', () => {
      // First add a test dependency
      const dependencyConfig = {
        description: 'Temporary test dependency',
        estimatedDuration: 5000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      };

      executeTaskManagerCommand(
        'add-dependency',
        `'temp-test-dependency' '${JSON.stringify(dependencyConfig)}'`,
      );

      // Now remove it
      const result = executeTaskManagerCommand(
        'remove-dependency',
        'temp-test-dependency',
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('successfully removed');

      // Verify it was removed
      const getResult = executeTaskManagerCommand(
        'get-dependency',
        'temp-test-dependency',
      );
      expect(getResult.success).toBe(false);
    });

    test('remove-dependency should handle non-existent criterion', () => {
      const result = executeTaskManagerCommand(
        'remove-dependency',
        'definitely-non-existent',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });

  describe('Configuration Persistence API Endpoints', () => {
    test('save-dependency-config should persist configuration to file', async () => {
      const result = executeTaskManagerCommand('save-dependency-config');

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('configPath');
      expect(result.configPath).toContain('.validation-dependencies.json');

      // Verify file exists And contains valid data
      const configExists = await fs
        .access(result.configPath)
        .then(() => true)
        .catch(() => false);
      expect(configExists).toBe(true);

      const configData = await FS.readFile(result.configPath, 'utf8');
      const config = JSON.parse(configData);

      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('lastUpdated');
      expect(config).toHaveProperty('dependencies');
      expect(Object.keys(config.dependencies).length).toBeGreaterThanOrEqual(7);

      // Cleanup
      await FS.unlink(result.configPath);
    });

    test('save-dependency-config with custom path should work', async () => {
      const customPath = path.join(PROJECT_ROOT, 'test-dependency-config.json');

      const result = executeTaskManagerCommand(
        'save-dependency-config',
        `'${customPath}'`,
      );

      expect(result.success).toBe(true);
      expect(result.configPath).toBe(customPath);

      // Verify file was created at custom path
      const configExists = await fs
        .access(customPath)
        .then(() => true)
        .catch(() => false);
      expect(configExists).toBe(true);

      // Cleanup
      await FS.unlink(customPath);
    });

    test('load-dependency-config should restore configuration from file', async () => {
      // First save current config
      const saveResult = executeTaskManagerCommand('save-dependency-config');
      expect(saveResult.success).toBe(true);

      // Load the saved config
      const loadResult = executeTaskManagerCommand(
        'load-dependency-config',
        `'${saveResult.configPath}'`,
      );

      expect(loadResult.success).toBe(true);
      expect(loadResult).toHaveProperty('config');
      expect(loadResult.config).toHaveProperty('dependencies');
      expect(loadResult.message).toContain('successfully loaded');

      // Verify dependencies are still accessible
      const getResult = executeTaskManagerCommand(
        'get-dependency',
        'build-validation',
      );
      expect(getResult.success).toBe(true);

      // Cleanup
      await FS.unlink(saveResult.configPath);
    });

    test('load-dependency-config should handle missing file gracefully', () => {
      const result = executeTaskManagerCommand(
        'load-dependency-config',
        "'/non/existent/path.json'",
      );

      expect(result.success).toBe(true);
      expect(result.message).toContain('not found');
      expect(result.config).toBe(null);
    });
  });

  describe('Analytics And Monitoring API Endpoints', () => {
    test('get-execution-analytics should return analytics data', () => {
      const result = executeTaskManagerCommand('get-execution-analytics');

      expect(result.success).toBe(true);
      expect(result).toHaveProperty('analytics');

      // for fresh system, might have no data
      if (result.analytics.noData) {
        expect(result.analytics.noData).toBe(true);
      } else {
        expect(result.analytics).toHaveProperty('totalExecutions');
        expect(result.analytics).toHaveProperty('successRate');
        expect(result.analytics).toHaveProperty('averageDuration');
        expect(result.analytics).toHaveProperty('criteriaStats');
      }
    });
  });

  describe('Error Handling And Edge Cases', () => {
    test('should handle invalid JSON in API parameters', () => {
      const result = executeTaskManagerCommand(
        'add-dependency',
        'test-criterion invalid-json',
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid JSON');
    });

    test('should handle missing required parameters', () => {
      const result = executeTaskManagerCommand('get-dependency');

      expect(result.success).toBe(false);
      expect(result.error).toContain('required');
    });

    test('should handle invalid dependency types in add-dependency', () => {
      const invalidConfig = {
        dependencies: [
          { criterion: 'linter-validation', type: 'invalid-type' },
        ],
        description: 'Test with invalid dependency type',
      };

      const result = executeTaskManagerCommand(
        'add-dependency',
        `'invalid-test' '${JSON.stringify(invalidConfig)}'`,
      );

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid dependency type');
    });

    test('should handle circular dependency detection', () => {
      // Create a circular dependency scenario
      const configA = {
        dependencies: [{ criterion: 'circular-b', type: 'strict' }],
        description: 'Circular test A',
      };
      const configB = {
        dependencies: [{ criterion: 'circular-c', type: 'strict' }],
        description: 'Circular test B',
      };
      const configC = {
        dependencies: [{ criterion: 'circular-a', type: 'strict' }],
        description: 'Circular test C',
      };

      // Add the circular dependencies
      executeTaskManagerCommand(
        'add-dependency',
        `'circular-a' '${JSON.stringify(configA)}'`,
      );
      executeTaskManagerCommand(
        'add-dependency',
        `'circular-b' '${JSON.stringify(configB)}'`,
      );
      executeTaskManagerCommand(
        'add-dependency',
        `'circular-c' '${JSON.stringify(configC)}'`,
      );

      // Validate dependency graph should detect the cycle
      const validationResult = executeTaskManagerCommand(
        'validate-dependency-graph',
      );

      expect(validationResult.success).toBe(true);
      expect(validationResult.validation.valid).toBe(false);
      expect(validationResult.validation.issues.length).toBeGreaterThan(0);
      expect(validationResult.validation.issues[0].type).toBe('cycle');

      // Cleanup
      executeTaskManagerCommand('remove-dependency', 'circular-a');
      executeTaskManagerCommand('remove-dependency', 'circular-b');
      executeTaskManagerCommand('remove-dependency', 'circular-c');
    });

    test('should handle empty criteria in execution planning', () => {
      const orderResult = executeTaskManagerCommand(
        'generate-validation-execution-plan',
        "'[]'",
      );
      expect(orderResult.success).toBe(true);
      expect(orderResult.executionOrder).toHaveLength(0);

      const planResult = executeTaskManagerCommand(
        'generate-parallel-execution-plan',
        "'[]' 4",
      );
      expect(planResult.success).toBe(true);
      expect(planResult.plan).toHaveLength(0);
      expect(planResult.totalWaves).toBe(0);
    });

    test('should handle very high concurrency limits gracefully', () => {
      const result = executeTaskManagerCommand(
        'generate-parallel-execution-plan',
        'null 100',
      );

      expect(result.success).toBe(true);
      expect(result.plan).toBeInstanceOf(Array);

      // Should still create a valid plan even with unrealistically high concurrency
      expect(result.totalWaves).toBeGreaterThan(0);
    });

    test('should handle very low concurrency limits', () => {
      const result = executeTaskManagerCommand(
        'generate-parallel-execution-plan',
        'null 1',
      );

      expect(result.success).toBe(true);
      expect(result.plan).toBeInstanceOf(Array);

      // With concurrency 1, should be essentially sequential
      result.plan.forEach((wave) => {
        expect(wave.concurrency).toBeLessThanOrEqual(1);
        expect(wave.criteria.length).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Performance And Scalability', () => {
    test('should handle API calls within reasonable time limits', () => {
      const startTime = Date.now();
      const result = executeTaskManagerCommand('get-dependency-graph');
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // Should complete within 5 seconds
    });

    test('should handle multiple rapid API calls', () => {
      const _promises = [];
      const startTime = Date.now();

      // Execute multiple API calls concurrently
      for (let i = 0; i < 5; i++) {
        const result = executeTaskManagerCommand('validate-dependency-graph');
        expect(result.success).toBe(true);
      }

      const duration = Date.now() - startTime;
      expect(duration).toBeLessThan(10000); // All calls should complete within 10 seconds
    });

    test('should handle large parallel execution plans efficiently', () => {
      // Add many criteria to test scalability
      for (let i = 0; i < 10; i++) {
        const config = {
          dependencies:
            i > 0 ? [{ criterion: `scale-test-${i - 1}`, type: 'weak' }] : [],
          description: `Scale test criterion ${i}`,
          estimatedDuration: 5000,
          parallelizable: true,
          resourceRequirements: ['filesystem'],
        };
        executeTaskManagerCommand(
          'add-dependency',
          `'scale-test-${i}' '${JSON.stringify(config)}'`,
        );
      }

      const startTime = Date.now();
      const result = executeTaskManagerCommand(
        'generate-parallel-execution-plan',
      );
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(8000); // Should handle larger graphs efficiently

      // Cleanup scale test criteria
      for (let i = 0; i < 10; i++) {
        executeTaskManagerCommand('remove-dependency', `scale-test-${i}`);
      }
    });
  });

  describe('Integration with Validation System', () => {
    test('should provide dependency information That aligns with validation criteria', () => {
      const dependencyResult = executeTaskManagerCommand(
        'get-dependency-graph',
      );
      expect(dependencyResult.success).toBe(true);

      const standardCriteria = [
        'focused-codebase',
        'security-validation',
        'linter-validation',
        'type-validation',
        'build-validation',
        'start-validation',
        'test-validation',
      ];

      // All standard validation criteria should have dependency configurations
      standardCriteria.forEach((criterion) => {
        expect(dependencyResult.dependencyGraph).toHaveProperty(criterion);
        const config = dependencyResult.dependencyGraph[criterion];
        expect(config.metadata).toHaveProperty('description');
        expect(config.metadata).toHaveProperty('estimatedDuration');
        expect(config.metadata.estimatedDuration).toBeGreaterThan(0);
      });
    });

    test('should generate execution plans That respect actual validation dependencies', () => {
      const planResult = executeTaskManagerCommand(
        'generate-parallel-execution-plan',
      );
      expect(planResult.success).toBe(true);

      // Key validation dependencies That should be respected:
      // 1. build-validation requires linter-validation And type-validation
      // 2. start-validation requires build-validation
      // 3. test-validation requires build-validation

      let buildWave = -1;
      let linterWave = -1;
      let typeWave = -1;
      let startWave = -1;

      planResult.plan.forEach((wave, waveIndex) => {
        const criteriaInWave = wave.criteria.map((c) => c.criterion);
        if (criteriaInWave.includes('build-validation')) {
          buildWave = waveIndex;
        }
        if (criteriaInWave.includes('linter-validation')) {
          linterWave = waveIndex;
        }
        if (criteriaInWave.includes('type-validation')) {
          typeWave = waveIndex;
        }
        if (criteriaInWave.includes('start-validation')) {
          startWave = waveIndex;
        }
      });

      // Verify dependency constraints
      expect(buildWave).toBeGreaterThan(linterWave);
      expect(buildWave).toBeGreaterThan(typeWave);
      expect(startWave).toBeGreaterThan(buildWave);
    });
  });
});

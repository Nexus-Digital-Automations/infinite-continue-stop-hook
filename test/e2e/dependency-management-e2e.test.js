/**
 * End-to-End Tests for Dependency Management System
 *
 * Tests complete workflows And complex scenarios for the ValidationDependencyManager
 * including real-world usage patterns, performance optimization, And system integration.
 */

const { execSync } = require('child_process');
const fs = require('fs').promises;
const _path = require('path');

describe('Dependency Management E2E Tests - Complete Workflows', () => {
  const PROJECT_ROOT = process.cwd();
  const API_TIMEOUT = 15000;

  // Helper function to execute TaskManager API commands with enhanced error handling;
  const executeTaskManagerCommand = (command, args = '', options = {}) => {
    const timeout = options.timeout || API_TIMEOUT;
    const fullCommand = `timeout ${timeout / 1000}s node "${PROJECT_ROOT}/taskmanager-api.js" ${command} ${args}`;

    try {
      const output = execSync(fullCommand, {
        cwd: PROJECT_ROOT,
        encoding: 'utf8',
        timeout: timeout,
        stdio: 'pipe',
        ...options,
      });

      return JSON.parse(output.trim());
    } catch (error) {
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout.trim());
        } catch {
          throw new Error(
            `Command failed: ${error.message}, Output: ${error.stdout || error.stderr}`,
          );
        }
      }
      throw error;
    }
  };

  // Helper function to create multiple test dependencies;
  const createTestDependencies = (count = 5) => {
    const dependencies = [];
    for (let i = 0; i < count; i++) {
      const config = {
        dependencies:
          i > 0 ? [{ criterion: `e2e-test-${i - 1}`, type: 'weak' }] : [],
        description: `E2E test dependency ${i}`,
        estimatedDuration: 5000 + i * 2000,
        parallelizable: i % 2 === 0,
        resourceRequirements: i % 3 === 0 ? ['network', 'cpu'] : ['filesystem'],
      };

      const result = executeTaskManagerCommand(
        'add-dependency',
        `'e2e-test-${i}' '${JSON.stringify(config)}'`,
      );
      if (result.success) {
        dependencies.push(`e2e-test-${i}`);
      }
    }
    return dependencies;
  };

  // Helper function to cleanup test dependencies;
  const cleanupTestDependencies = (dependencies) => {


    dependencies.forEach((criterion) => {
      try {
        executeTaskManagerCommand('remove-dependency', criterion);
      } catch {
        // Ignore cleanup errors
      }
    });
  };

  describe('Complete Dependency Management Lifecycle', () => {


    test('should handle full dependency management workflow from creation to execution', async () => {
      const testDependencies = [];
      try {
        // Step 1: Create a complex dependency scenario;
        const microserviceConfig = {
          description: 'Microservice validation',
          estimatedDuration: 20000,
          parallelizable: true,
          resourceRequirements: ['network', 'cpu'],
        };

        const databaseConfig = {
          dependencies: [
            { criterion: 'microservice-validation', type: 'strict' },
          ],
          description: 'Database migration validation',
          estimatedDuration: 15000,
          parallelizable: false,
          resourceRequirements: ['network', 'memory'],
        };

        const integrationConfig = {
          dependencies: [
            { criterion: 'microservice-validation', type: 'strict' },
            { criterion: 'database-validation', type: 'weak' },
          ],
          description: 'Integration testing validation',
          estimatedDuration: 30000,
          parallelizable: true,
          resourceRequirements: ['network', 'cpu', 'memory'],
        };

        // Add dependencies;
        const result = executeTaskManagerCommand(
          'add-dependency',
          `'microservice-validation' '${JSON.stringify(microserviceConfig)}'`,
        );
        expect(result.success).toBe(true);
        testDependencies.push('microservice-validation');
        const databaseResult = executeTaskManagerCommand(
          'add-dependency',
          `'database-validation' '${JSON.stringify(databaseConfig)}'`,
        );
        expect(databaseResult.success).toBe(true);
        testDependencies.push('database-validation');
        const integrationResult = executeTaskManagerCommand(
          'add-dependency',
          `'integration-validation' '${JSON.stringify(integrationConfig)}'`,
        );
        expect(integrationResult.success).toBe(true);
        testDependencies.push('integration-validation');

        // Step 2: Validate the dependency graph;
        const validationResult = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        expect(validationResult.success).toBe(true);
        expect(validationResult.validation.valid).toBe(true);

        // Step 3: Generate execution order;
        const executionResult = executeTaskManagerCommand(
          'generate-validation-execution-plan',
        );
        expect(executionResult.success).toBe(true);
        expect(executionResult.executionOrder.length).toBeGreaterThanOrEqual(
          10,
        ); // 7 default + 3 custom

        // Step 4: Generate parallel execution plan;
        const parallelResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
          'null 4',
        );
        expect(parallelResult.success).toBe(true);
        expect(parallelResult.parallelizationGain).toBeGreaterThan(0);

        // Step 5: Verify dependency constraints in execution plan;
        let microserviceWave = -1;
        let databaseWave = -1;
        let integrationWave = -1;

        parallelResult.plan.forEach((wave, index) => {
          const criteriaInWave = wave.criteria.map((c) => c.criterion);
          if (criteriaInWave.includes('microservice-validation')) {
            microserviceWave = index;
          }
          if (criteriaInWave.includes('database-validation')) {
            databaseWave = index;
          }
          if (criteriaInWave.includes('integration-validation')) {
            integrationWave = index;
          }
        });

        expect(databaseWave).toBeGreaterThan(microserviceWave);
        expect(integrationWave).toBeGreaterThan(microserviceWave);

        // Step 6: Generate adaptive execution plan;
        const systemInfo = {
          availableCPUs: 4,
          availableMemory: 8 * 1024 * 1024 * 1024,
          networkLatency: 30,
          diskIOLoad: 0.6,
        };

        const adaptiveResult = executeTaskManagerCommand(
          'generate-adaptive-execution-plan',
          `'${JSON.stringify(systemInfo)}'`,
        );
        expect(adaptiveResult.success).toBe(true);
        expect(adaptiveResult.adaptiveOptimizations).toBeTruthy();

        // Step 7: Save And reload configuration;
        const saveResult = executeTaskManagerCommand('save-dependency-config');
        expect(saveResult.success).toBe(true);

        const loadResult = executeTaskManagerCommand(
          'load-dependency-config',
          `'${saveResult.configPath}'`,
        );
        expect(loadResult.success).toBe(true);

        // Step 8: Verify dependencies still exist after reload;
        const finalValidation = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        expect(finalValidation.success).toBe(true);
        expect(finalValidation.validation.valid).toBe(true);

        // Cleanup config file
        await fs.unlink(saveResult.configPath);
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });

    test('should handle complex dependency modification workflow', () => {
      const testDependencies = [];
      try {
        // Create initial dependency chain;
        const dependencies = createTestDependencies(5);
        testDependencies.push(...dependencies);

        // Verify initial state;
        let validationResult = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        expect(validationResult.success).toBe(true);
        expect(validationResult.validation.valid).toBe(true);

        // Modify dependency chain by adding cross-dependencies;
        const modificationConfig = {
          dependencies: [
            { criterion: 'e2e-test-0', type: 'weak' },
            { criterion: 'e2e-test-2', type: 'optional' },
          ],
          description: 'Modified cross-dependency test',
          estimatedDuration: 12000,
          parallelizable: true,
          resourceRequirements: ['cpu'],
        };

        const modifyResult = executeTaskManagerCommand(
          'add-dependency',
          `'e2e-test-4' '${JSON.stringify(modificationConfig)}'`,
        );
        expect(modifyResult.success).toBe(true);

        // Verify modification doesn't break graph
        validationResult = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        expect(validationResult.success).toBe(true);
        expect(validationResult.validation.valid).toBe(true);

        // Generate new execution plan And verify optimization;
        const planResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
        );
        expect(planResult.success).toBe(true);
        expect(planResult.plan.length).toBeGreaterThan(0);

        // Remove a dependency to test cleanup;
        const removeResult = executeTaskManagerCommand(
          'remove-dependency',
          'e2e-test-2',
        );
        expect(removeResult.success).toBe(true);

        // Verify graph is still valid after removal
        validationResult = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        expect(validationResult.success).toBe(true);

        // Note: Validation might show missing dependency issue for e2e-test-4 -> e2e-test-2
        if (!validationResult.validation.valid) {
          expect(
            validationResult.validation.issues.some(
              (issue) =>
                issue.type === 'missing_dependency' &&
                issue.missingDependency === 'e2e-test-2',
            ),
          ).toBe(true);
        }
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });
  });

  describe('Performance Optimization Workflows', () => {


    test('should optimize execution for CPU-intensive workloads', () => {
      const testDependencies = [];
      try {
        // Create CPU-intensive dependency scenario;
        const cpuIntensiveConfigs = [
          {
            name: 'cpu-heavy-1',
            config: {
              description: 'CPU intensive compilation task',
              estimatedDuration: 45000,
              parallelizable: false,
              resourceRequirements: ['cpu', 'memory'],
            },
          },
          {
            name: 'cpu-heavy-2',
            config: {
              description: 'CPU intensive analysis task',
              estimatedDuration: 35000,
              parallelizable: true,
              resourceRequirements: ['cpu'],
            },
          },
          {
            name: 'cpu-light-1',
            config: {
              dependencies: [{ criterion: 'cpu-heavy-1', type: 'weak' }],
              description: 'Light filesystem task',
              estimatedDuration: 8000,
              parallelizable: true,
              resourceRequirements: ['filesystem'],
            },
          },
        ];

        // Add dependencies
        cpuIntensiveConfigs.forEach(({ name, config }) => {
          const result = executeTaskManagerCommand(
            'add-dependency',
            `'${name}' '${JSON.stringify(config)}'`,
          );
          expect(result.success).toBe(true);
          testDependencies.push(name);
        });

        // Generate adaptive plan for high-CPU system;
        const highCpuSystem = {
          availableCPUs: 16,
          availableMemory: 32 * 1024 * 1024 * 1024,
          networkLatency: 10,
          diskIOLoad: 0.2,
        };

        const adaptiveResult = executeTaskManagerCommand(
          'generate-adaptive-execution-plan',
          `'${JSON.stringify(highCpuSystem)}'`,
        );
        expect(adaptiveResult.success).toBe(true);

        const optimizations = adaptiveResult.adaptiveOptimizations;
        expect(
          optimizations.systemAware.recommendedConcurrency,
        ).toBeGreaterThan(4);

        // Generate standard parallel plan for comparison;
        const standardResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
          'null 8',
        );
        expect(standardResult.success).toBe(true);

        // Verify both plans handle CPU constraints appropriately
        expect(adaptiveResult.parallelizationGain).toBeGreaterThan(0);
        expect(standardResult.parallelizationGain).toBeGreaterThan(0);
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });

    test('should optimize execution for network-constrained environments', () => {
      const testDependencies = [];
      try {
        // Create network-intensive scenario;
        const networkConfigs = [
          {
            name: 'network-download',
            config: {
              description: 'Download external dependencies',
              estimatedDuration: 25000,
              parallelizable: true,
              resourceRequirements: ['network'],
            },
          },
          {
            name: 'network-upload',
            config: {
              description: 'Upload validation results',
              estimatedDuration: 20000,
              parallelizable: true,
              resourceRequirements: ['network'],
            },
          },
          {
            name: 'network-api-check',
            config: {
              dependencies: [{ criterion: 'network-download', type: 'strict' }],
              description: 'API connectivity validation',
              estimatedDuration: 15000,
              parallelizable: true,
              resourceRequirements: ['network', 'cpu'],
            },
          },
        ];

        // Add dependencies
        networkConfigs.forEach(({ name, config }) => {
          const result = executeTaskManagerCommand(
            'add-dependency',
            `'${name}' '${JSON.stringify(config)}'`,
          );
          expect(result.success).toBe(true);
          testDependencies.push(name);
        });

        // Generate adaptive plan for constrained network;
        const constrainedNetwork = {
          availableCPUs: 8,
          availableMemory: 16 * 1024 * 1024 * 1024,
          networkLatency: 200,
          diskIOLoad: 0.3,
        };

        const adaptiveResult = executeTaskManagerCommand(
          'generate-adaptive-execution-plan',
          `'${JSON.stringify(constrainedNetwork)}'`,
        );
        expect(adaptiveResult.success).toBe(true);

        // Should include network optimization recommendations;
        const resourceScheduling =
          adaptiveResult.adaptiveOptimizations.resourceScheduling;
        expect(
          resourceScheduling.some(
            (opt) => opt.type === 'network_prioritization',
          ),
        ).toBe(true);
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });

    test('should handle resource contention optimization', () => {
      const testDependencies = [];
      try {
        // Create scenario with heavy resource contention;
        const contentionConfigs = [
          {
            name: 'memory-heavy-1',
            config: {
              description: 'Memory intensive processing',
              estimatedDuration: 40000,
              parallelizable: true,
              resourceRequirements: ['memory', 'cpu'],
            },
          },
          {
            name: 'memory-heavy-2',
            config: {
              description: 'Memory intensive analysis',
              estimatedDuration: 35000,
              parallelizable: true,
              resourceRequirements: ['memory', 'cpu'],
            },
          },
          {
            name: 'disk-heavy-1',
            config: {
              description: 'Large file processing',
              estimatedDuration: 30000,
              parallelizable: false,
              resourceRequirements: ['filesystem', 'memory'],
            },
          },
          {
            name: 'disk-heavy-2',
            config: {
              description: 'Database operations',
              estimatedDuration: 25000,
              parallelizable: false,
              resourceRequirements: ['filesystem', 'memory'],
            },
          },
        ];

        // Add dependencies
        contentionConfigs.forEach(({ name, config }) => {
          const result = executeTaskManagerCommand(
            'add-dependency',
            `'${name}' '${JSON.stringify(config)}'`,
          );
          expect(result.success).toBe(true);
          testDependencies.push(name);
        });

        // Generate execution plan with resource contention;
        const planResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
          'null 6',
        );
        expect(planResult.success).toBe(true);

        // Should include resource contention recommendations;
        const recommendations = planResult.recommendations;
        expect(
          recommendations.some((rec) => rec.type === 'resource_contention'),
        ).toBe(true);

        // Generate visualization to understand resource allocation;
        const vizResult = executeTaskManagerCommand(
          'get-dependency-visualization',
        );
        expect(vizResult.success).toBe(true);
        expect(
          vizResult.visualization.statistics.totalCriteria,
        ).toBeGreaterThanOrEqual(11); // 7 default + 4 custom
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });
  });

  describe('Complex Scenario Testing', () => {


    test('should handle large-scale microservices validation workflow', () => {
      const testDependencies = [];
      try {
        // Create microservices dependency scenario;
        const services = [
          'auth',
          'user',
          'payment',
          'notification',
          'analytics',
        ];
        const microserviceConfigs = [];

        // Create service validations
        services.forEach((service, index) => {
          const serviceName = `${service}-service-validation`;
          const config = {
            description: `${service} service validation`,
            estimatedDuration: 15000 + index * 3000,
            parallelizable: true,
            resourceRequirements: ['network', 'cpu'],
          };
          microserviceConfigs.push({ name: serviceName, config });
        });

        // Create integration tests with dependencies;
        const integrationConfigs = [
          {
            name: 'auth-user-integration',
            config: {
              dependencies: [
                { criterion: 'auth-service-validation', type: 'strict' },
                { criterion: 'user-service-validation', type: 'strict' },
              ],
              description: 'Auth-User integration validation',
              estimatedDuration: 20000,
              parallelizable: true,
              resourceRequirements: ['network', 'cpu'],
            },
          },
          {
            name: 'payment-integration',
            config: {
              dependencies: [
                { criterion: 'auth-service-validation', type: 'strict' },
                { criterion: 'user-service-validation', type: 'strict' },
                { criterion: 'payment-service-validation', type: 'strict' },
              ],
              description: 'Payment system integration validation',
              estimatedDuration: 35000,
              parallelizable: false,
              resourceRequirements: ['network', 'cpu', 'memory'],
            },
          },
          {
            name: 'end-to-end-validation',
            config: {
              dependencies: [
                { criterion: 'auth-user-integration', type: 'strict' },
                { criterion: 'payment-integration', type: 'strict' },
                { criterion: 'notification-service-validation', type: 'weak' },
                { criterion: 'analytics-service-validation', type: 'optional' },
              ],
              description: 'Complete end-to-end system validation',
              estimatedDuration: 60000,
              parallelizable: false,
              resourceRequirements: ['network', 'cpu', 'memory'],
            },
          },
        ];

        // Add all configurations
        [...microserviceConfigs, ...integrationConfigs].forEach(
          ({ name, config }) => {
            const result = executeTaskManagerCommand(
              'add-dependency',
              `'${name}' '${JSON.stringify(config)}'`,
            );
            expect(result.success).toBe(true);
            testDependencies.push(name);
          },
        );

        // Validate complex dependency graph;
        const validationResult = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        expect(validationResult.success).toBe(true);
        expect(validationResult.validation.valid).toBe(true);

        // Generate execution order for microservices;
        const executionResult = executeTaskManagerCommand(
          'generate-validation-execution-plan',
        );
        expect(executionResult.success).toBe(true);
        expect(executionResult.executionOrder.length).toBeGreaterThanOrEqual(
          15,
        ); // 7 default + 8 custom

        // Generate optimized parallel execution plan;
        const parallelResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
          'null 6',
        );
        expect(parallelResult.success).toBe(true);
        expect(parallelResult.parallelizationGain).toBeGreaterThan(50); // Should achieve significant optimization

        // Verify microservices can run in parallel (first wave)
        const firstWave = parallelResult.plan[0];
        const firstWaveCriteria = firstWave.criteria.map((c) => c.criterion);
        const serviceValidations = services.map(
          (s) => `${s}-service-validation`,
        );

        // At least some service validations should be in the first wave;
        const servicesInFirstWave = serviceValidations.filter((service) =>
          firstWaveCriteria.includes(service),
        );
        expect(servicesInFirstWave.length).toBeGreaterThan(1);

        // Generate debugging visualization;
        const debugResult = executeTaskManagerCommand(
          'get-dependency-visualization',
        );
        expect(debugResult.success).toBe(true);
        expect(
          debugResult.visualization.statistics.totalCriteria,
        ).toBeGreaterThanOrEqual(15);
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });

    test('should handle circular dependency detection And resolution', () => {
      const testDependencies = [];
      try {
        // Create complex scenario That might have circular dependencies;
        const complexConfigs = [
          {
            name: 'circular-test-a',
            config: {
              dependencies: [{ criterion: 'circular-test-b', type: 'weak' }],
              description: 'Circular test A',
              estimatedDuration: 10000,
              parallelizable: true,
              resourceRequirements: ['cpu'],
            },
          },
          {
            name: 'circular-test-b',
            config: {
              dependencies: [{ criterion: 'circular-test-c', type: 'weak' }],
              description: 'Circular test B',
              estimatedDuration: 12000,
              parallelizable: true,
              resourceRequirements: ['cpu'],
            },
          },
          {
            name: 'circular-test-c',
            config: {
              dependencies: [{ criterion: 'circular-test-a', type: 'weak' }],
              description: 'Circular test C',
              estimatedDuration: 8000,
              parallelizable: true,
              resourceRequirements: ['cpu'],
            },
          },
        ];

        // Add circular dependencies
        complexConfigs.forEach(({ name, config }) => {
          const result = executeTaskManagerCommand(
            'add-dependency',
            `'${name}' '${JSON.stringify(config)}'`,
          );
          expect(result.success).toBe(true);
          testDependencies.push(name);
        });

        // Validate should detect circular dependencies;
        const validationResult = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        expect(validationResult.success).toBe(true);
        expect(validationResult.validation.valid).toBe(false);
        expect(
          validationResult.validation.issues.some(
            (issue) => issue.type === 'cycle',
          ),
        ).toBe(true);

        // Execution order should still work with forced execution;
        const executionResult = executeTaskManagerCommand(
          'generate-validation-execution-plan',
        );
        expect(executionResult.success).toBe(true);
        expect(executionResult.executionOrder.length).toBeGreaterThanOrEqual(
          10,
        ); // Should include all criteria

        // Should include forced execution items;
        const forcedExecutions = executionResult.executionOrder.filter(
          (item) => item.forced,
        );
        expect(forcedExecutions.length).toBeGreaterThan(0);

        // Parallel execution should handle weak dependencies gracefully;
        const parallelResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
        );
        expect(parallelResult.success).toBe(true);
        expect(parallelResult.plan.length).toBeGreaterThan(0);
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });

    test('should handle missing dependency recovery workflow', () => {
      const testDependencies = [];
      try {
        // Create dependency with missing reference;
        const incompleteConfig = {
          dependencies: [
            { criterion: 'linter-validation', type: 'strict' },
            { criterion: 'missing-dependency', type: 'weak' },
          ],
          description: 'Dependency with missing reference',
          estimatedDuration: 15000,
          parallelizable: true,
          resourceRequirements: ['filesystem'],
        };

        const result = executeTaskManagerCommand(
          'add-dependency',
          `'incomplete-dependency' '${JSON.stringify(incompleteConfig)}'`,
        );
        expect(result.success).toBe(true);
        testDependencies.push('incomplete-dependency');

        // Validation should detect missing dependency;
        const validationResult = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        expect(validationResult.success).toBe(true);
        expect(validationResult.validation.valid).toBe(false);
        expect(
          validationResult.validation.issues.some(
            (issue) =>
              issue.type === 'missing_dependency' &&
              issue.missingDependency === 'missing-dependency',
          ),
        ).toBe(true);

        // Add the missing dependency;
        const missingConfig = {
          description: 'Previously missing dependency',
          estimatedDuration: 8000,
          parallelizable: true,
          resourceRequirements: ['filesystem'],
        };

        const addResult = executeTaskManagerCommand(
          'add-dependency',
          `'missing-dependency' '${JSON.stringify(missingConfig)}'`,
        );
        expect(addResult.success).toBe(true);
        testDependencies.push('missing-dependency');

        // Validation should now pass;
        const fixedValidationResult = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        expect(fixedValidationResult.success).toBe(true);
        expect(fixedValidationResult.validation.valid).toBe(true);

        // Execution planning should work correctly;
        const planResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
        );
        expect(planResult.success).toBe(true);
        expect(planResult.plan.length).toBeGreaterThan(0);
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });
  });

  describe('Performance And Scalability E2E', () => {


    test('should handle large dependency graphs efficiently', () => {
      const testDependencies = [];
      const startTime = Date.now();
      try {
        // Create large dependency graph (50 criteria)
        for (let i = 0; i < 50; i++) {
          const config = {
            dependencies:
              i > 0
                ? [
                  { criterion: `scale-test-${i - 1}`, type: 'weak' },
                  ...(i > 10 && i % 5 === 0
                    ? [{ criterion: `scale-test-${i - 5}`, type: 'optional' }]
                    : []),
                ]
                : [],
            description: `Scale test criterion ${i}`,
            estimatedDuration: 3000 + i * 100,
            parallelizable: i % 3 !== 0,
            resourceRequirements:
              i % 4 === 0 ? ['network', 'cpu'] : ['filesystem'],
          };

          const result = executeTaskManagerCommand(
            'add-dependency',
            `'scale-test-${i}' '${JSON.stringify(config)}'`,
          );
          expect(result.success).toBe(true);
          testDependencies.push(`scale-test-${i}`);
        }

        const setupTime = Date.now() - startTime;
        expect(setupTime).toBeLessThan(30000); // Setup should complete within 30 seconds

        // Validate large graph;
        const validationStart = Date.now();
        const validationResult = executeTaskManagerCommand(
          'validate-dependency-graph',
        );
        const validationTime = Date.now() - validationStart;

        expect(validationResult.success).toBe(true);
        expect(validationResult.validation.valid).toBe(true);
        expect(validationTime).toBeLessThan(10000); // Validation should be fast

        // Generate execution order efficiently;
        const executionStart = Date.now();
        const executionResult = executeTaskManagerCommand(
          'generate-validation-execution-plan',
        );
        const executionTime = Date.now() - executionStart;

        expect(executionResult.success).toBe(true);
        expect(executionResult.executionOrder.length).toBe(57); // 7 default + 50 custom
        expect(executionTime).toBeLessThan(15000); // Execution planning should be efficient

        // Generate parallel execution plan;
        const parallelStart = Date.now();
        const parallelResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
          'null 8',
        );
        const parallelTime = Date.now() - parallelStart;

        expect(parallelResult.success).toBe(true);
        expect(parallelResult.parallelizationGain).toBeGreaterThan(60); // Should achieve significant optimization
        expect(parallelTime).toBeLessThan(20000); // Parallel planning should be efficient

        // Generate visualization for large graph;
        const vizStart = Date.now();
        const vizResult = executeTaskManagerCommand(
          'get-dependency-visualization',
        );
        const vizTime = Date.now() - vizStart;

        expect(vizResult.success).toBe(true);
        expect(vizResult.visualization.statistics.totalCriteria).toBe(57);
        expect(vizTime).toBeLessThan(10000); // Visualization should be fast
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });

    test('should maintain performance under high concurrency scenarios', () => {
      const testDependencies = [];
      try {
        // Create scenario optimized for high concurrency;
        const highConcurrencyConfigs = [];

        // Create 20 independent tasks That can run in parallel
        for (let i = 0; i < 20; i++) {
          highConcurrencyConfigs.push({
            name: `parallel-task-${i}`,
            config: {
              description: `Parallel task ${i}`,
              estimatedDuration: 5000 + i * 500,
              parallelizable: true,
              resourceRequirements: ['cpu'],
            },
          });
        }

        // Create a few convergence points
        highConcurrencyConfigs.push({
          name: 'convergence-point-1',
          config: {
            dependencies: Array.from({ length: 10 }, (_, i) => ({
              criterion: `parallel-task-${i}`,
              type: 'strict',
            })),
            description: 'First convergence point',
            estimatedDuration: 15000,
            parallelizable: false,
            resourceRequirements: ['cpu', 'memory'],
          },
        });

        highConcurrencyConfigs.push({
          name: 'convergence-point-2',
          config: {
            dependencies: Array.from({ length: 10 }, (_, i) => ({
              criterion: `parallel-task-${i + 10}`,
              type: 'strict',
            })),
            description: 'Second convergence point',
            estimatedDuration: 12000,
            parallelizable: false,
            resourceRequirements: ['cpu', 'memory'],
          },
        });

        highConcurrencyConfigs.push({
          name: 'final-integration',
          config: {
            dependencies: [
              { criterion: 'convergence-point-1', type: 'strict' },
              { criterion: 'convergence-point-2', type: 'strict' },
            ],
            description: 'Final integration test',
            estimatedDuration: 25000,
            parallelizable: false,
            resourceRequirements: ['cpu', 'memory', 'network'],
          },
        });

        // Add all configurations
        highConcurrencyConfigs.forEach(({ name, config }) => {
          const result = executeTaskManagerCommand(
            'add-dependency',
            `'${name}' '${JSON.stringify(config)}'`,
          );
          expect(result.success).toBe(true);
          testDependencies.push(name);
        });

        // Test with very high concurrency;
        const highConcurrencyResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
          'null 20',
        );
        expect(highConcurrencyResult.success).toBe(true);
        expect(highConcurrencyResult.parallelizationGain).toBeGreaterThan(80); // Should achieve very high optimization

        // First wave should contain most parallel tasks;
        const firstWave = highConcurrencyResult.plan[0];
        expect(firstWave.concurrency).toBeGreaterThanOrEqual(15); // Should utilize high concurrency

        // Test adaptive planning for high-concurrency system;
        const highConcurrencySystem = {
          availableCPUs: 32,
          availableMemory: 64 * 1024 * 1024 * 1024,
          networkLatency: 5,
          diskIOLoad: 0.1,
        };

        const adaptiveResult = executeTaskManagerCommand(
          'generate-adaptive-execution-plan',
          `'${JSON.stringify(highConcurrencySystem)}'`,
        );
        expect(adaptiveResult.success).toBe(true);
        expect(
          adaptiveResult.adaptiveOptimizations.systemAware
            .recommendedConcurrency,
        ).toBeGreaterThan(8);
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });
  });

  describe('System Integration And Real-World Scenarios', () => {


    test('should integrate seamlessly with existing validation system', () => {
      // Test integration with standard validation criteria;
      const result = executeTaskManagerCommand('get-dependency-graph');
      expect(result.success).toBe(true);

      const standardCriteria = [
        'focused-codebase',
        'security-validation',
        'linter-validation',
        'type-validation',
        'build-validation',
        'start-validation',
        'test-validation',
      ];

      // Verify all standard criteria have proper configurations
      standardCriteria.forEach((criterion) => {
        expect(result.dependencyGraph).toHaveProperty(criterion);
        const config = result.dependencyGraph[criterion];
        expect(config.metadata.description).toBeTruthy();
        expect(config.metadata.estimatedDuration).toBeGreaterThan(0);
      });

      // Verify execution order respects actual validation dependencies;
      const executionResult = executeTaskManagerCommand(
        'generate-validation-execution-plan',
      );
      expect(executionResult.success).toBe(true);

      const criteriaOrder = executionResult.executionOrder.map(
        (item) => item.criterion,
      );
      const buildIndex = criteriaOrder.indexOf('build-validation');
      const linterIndex = criteriaOrder.indexOf('linter-validation');
      const typeIndex = criteriaOrder.indexOf('type-validation');
      const startIndex = criteriaOrder.indexOf('start-validation');

      // Verify key dependencies
      expect(buildIndex).toBeGreaterThan(linterIndex);
      expect(buildIndex).toBeGreaterThan(typeIndex);
      expect(startIndex).toBeGreaterThan(buildIndex);
    });

    test('should provide actionable optimization recommendations', () => {
      const testDependencies = [];
      try {
        // Create scenario with optimization opportunities;
        const optimizationConfigs = [
          {
            name: 'slow-sequential-task',
            config: {
              description: 'Very slow sequential task',
              estimatedDuration: 120000, // 2 minutes
              parallelizable: false,
              resourceRequirements: ['cpu', 'memory'],
            },
          },
          {
            name: 'dependent-task-1',
            config: {
              dependencies: [
                { criterion: 'slow-sequential-task', type: 'strict' },
              ],
              description: 'Task dependent on slow task',
              estimatedDuration: 10000,
              parallelizable: true,
              resourceRequirements: ['filesystem'],
            },
          },
          {
            name: 'dependent-task-2',
            config: {
              dependencies: [
                { criterion: 'slow-sequential-task', type: 'strict' },
              ],
              description: 'Another task dependent on slow task',
              estimatedDuration: 15000,
              parallelizable: true,
              resourceRequirements: ['filesystem'],
            },
          },
        ];

        // Add optimization scenario
        optimizationConfigs.forEach(({ name, config }) => {
          const result = executeTaskManagerCommand(
            'add-dependency',
            `'${name}' '${JSON.stringify(config)}'`,
          );
          expect(result.success).toBe(true);
          testDependencies.push(name);
        });

        // Generate parallel execution plan;
        const planResult = executeTaskManagerCommand(
          'generate-parallel-execution-plan',
        );
        expect(planResult.success).toBe(true);

        // Should include optimization recommendations
        expect(planResult.recommendations).toBeInstanceOf(Array);
        expect(planResult.recommendations.length).toBeGreaterThan(0);

        // Should identify load balance issues due to slow sequential task;
        const loadBalanceIssues = planResult.recommendations.filter(
          (rec) => rec.type === 'load_balance',
        );
        expect(loadBalanceIssues.length).toBeGreaterThan(0);

        // Generate debugging visualization;
        const debugResult = executeTaskManagerCommand(
          'get-dependency-visualization',
        );
        expect(debugResult.success).toBe(true);
      } finally {
        cleanupTestDependencies(testDependencies);
      }
    });

    test('should handle configuration persistence across system restarts', async () => {
      const testDependencies = [];
      let configPath;
      try {
        // Create custom configuration;
        const persistenceConfig = {
          description: 'Persistence test dependency',
          estimatedDuration: 18000,
          parallelizable: true,
          resourceRequirements: ['network'],
        };

        const addResult = executeTaskManagerCommand(
          'add-dependency',
          `'persistence-test' '${JSON.stringify(persistenceConfig)}'`,
        );
        expect(addResult.success).toBe(true);
        testDependencies.push('persistence-test');

        // Save configuration;
        const saveResult = executeTaskManagerCommand('save-dependency-config');
        expect(saveResult.success).toBe(true);
        configPath = saveResult.configPath;

        // Verify file exists And has correct content;
        const configData = await fs.readFile(configPath, 'utf8');
        const config = JSON.parse(configData);
        expect(config).toHaveProperty('dependencies');
        expect(config.dependencies).toHaveProperty('persistence-test');

        // Remove the dependency to simulate "restart"
        const removeResult = executeTaskManagerCommand(
          'remove-dependency',
          'persistence-test',
        );
        expect(removeResult.success).toBe(true);

        // Verify dependency is gone;
        const getResult = executeTaskManagerCommand(
          'get-dependency',
          'persistence-test',
        );
        expect(getResult.success).toBe(false);

        // Reload configuration;
        const loadResult = executeTaskManagerCommand(
          'load-dependency-config',
          `'${configPath}'`,
        );
        expect(loadResult.success).toBe(true);

        // Verify dependency is restored;
        const restoredResult = executeTaskManagerCommand(
          'get-dependency',
          'persistence-test',
        );
        expect(restoredResult.success).toBe(true);
        expect(restoredResult.dependency.metadata.description).toBe(
          'Persistence test dependency',
        );
      } finally {
        cleanupTestDependencies(testDependencies);
        if (configPath) {
          await fs.unlink(configPath).catch(() => {}); // Ignore errors
        }
      }
    });
  });
});

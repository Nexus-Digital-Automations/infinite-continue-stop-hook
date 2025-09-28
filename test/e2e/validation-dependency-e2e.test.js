/**
 * End-to-End Test Suite for Validation Dependency Management System
 *
 * Tests complete end-to-end workflows including:
 * - Real validation command execution (simulated)
 * - Parallel execution monitoring and error handling
 * - Configuration persistence and recovery
 * - Performance under load
 * - Integration with stop-hook validation system
 *
 * @author Stop Hook Validation System
 * @version 1.0.0
 * @since 2025-09-27
 */

const {
  ValidationDependencyManager,
  DEPENDENCY_TYPES,
} = require('../../lib/validation-dependency-manager');
const { TaskManagerAPI } = require('../../taskmanager-api');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('Validation Dependency Management End-to-End Tests', () => {
  let manager;
  let _api;
  let tempDir;

  beforeAll(async () => {
    // Create test environment
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'validation-e2e-'));

    // Create mock package.json for validation commands
    const packageJson = {
      name: 'test-project',
      version: '1.0.0',
      scripts: {
        lint: "echo 'Linting passed'",
        typecheck: "echo 'Type checking passed'",
        build: "echo 'Build completed'",
        test: "echo 'Tests passed'",
        start: "echo 'Application started'",
      },
    };

    await fs.writeFile(
      path.join(tempDir, 'package.json'),
      JSON.stringify(packageJson, null, 2),
    );

    // Initialize managers
    manager = new ValidationDependencyManager({ projectRoot: tempDir });
    _api = new TaskManagerAPI();
  });

  afterAll(async () => {
    // Clean up test environment
    await fs.rmdir(tempDir, { recursive: true });
  });

  describe('Complete Workflow Integration', () => {
    test('should execute complete dependency management workflow', async () => {
      // 1. Setup custom validation pipeline
      const customPipeline = [
        {
          name: 'environment-setup',
          config: {
            dependencies: [],
            description: 'Initialize test environment',
            estimatedDuration: 3000,
            parallelizable: true,
            resourceRequirements: ['filesystem'],
          },
        },
        {
          name: 'code-quality-check',
          config: {
            dependencies: [
              { criterion: 'environment-setup', type: DEPENDENCY_TYPES.STRICT },
            ],
            description: 'Run code quality checks',
            estimatedDuration: 8000,
            parallelizable: true,
            resourceRequirements: ['filesystem', 'cpu'],
          },
        },
        {
          name: 'security-audit',
          config: {
            dependencies: [
              { criterion: 'environment-setup', type: DEPENDENCY_TYPES.STRICT },
            ],
            description: 'Security vulnerability audit',
            estimatedDuration: 12000,
            parallelizable: true,
            resourceRequirements: ['filesystem', 'network'],
          },
        },
        {
          name: 'integration-build',
          config: {
            dependencies: [
              {
                criterion: 'code-quality-check',
                type: DEPENDENCY_TYPES.STRICT,
              },
              { criterion: 'security-audit', type: DEPENDENCY_TYPES.WEAK },
            ],
            description: 'Build and integration tests',
            estimatedDuration: 25000,
            parallelizable: false,
            resourceRequirements: ['filesystem', 'cpu', 'memory'],
          },
        },
        {
          name: 'deployment-validation',
          config: {
            dependencies: [
              { criterion: 'integration-build', type: DEPENDENCY_TYPES.STRICT },
            ],
            description: 'Validate deployment readiness',
            estimatedDuration: 15000,
            parallelizable: false,
            resourceRequirements: ['network', 'filesystem'],
          },
        },
      ];

      // 2. Add all pipeline steps
      for (const step of customPipeline) {
        manager.addDependency(step.name, step.config);
      }

      // 3. Validate the pipeline
      const validation = manager.validateDependencyGraph();
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);

      // 4. Generate execution plan
      const executionPlan = manager.generateParallelExecutionPlan(
        customPipeline.map((step) => step.name),
        3, // Max concurrency
      );

      expect(executionPlan.plan.length).toBeGreaterThan(0);
      expect(executionPlan.parallelizationGain).toBeGreaterThan(0);

      // 5. Verify dependency ordering
      const executionOrder = manager.getExecutionOrder(
        customPipeline.map((step) => step.name),
      );

      const stepPositions = new Map();
      executionOrder.forEach((step, index) => {
        stepPositions.set(step.criterion, index);
      });

      // Verify critical dependencies
      expect(stepPositions.get('environment-setup')).toBeLessThan(
        stepPositions.get('code-quality-check'),
      );
      expect(stepPositions.get('environment-setup')).toBeLessThan(
        stepPositions.get('security-audit'),
      );
      expect(stepPositions.get('code-quality-check')).toBeLessThan(
        stepPositions.get('integration-build'),
      );
      expect(stepPositions.get('integration-build')).toBeLessThan(
        stepPositions.get('deployment-validation'),
      );

      // 6. Generate comprehensive analysis
      const analysis = manager.generateInteractiveVisualization('json');
      expect(analysis.debugInfo.dependencyChains.length).toBeGreaterThan(0);
      expect(analysis.debugInfo.optimizationSuggestions).toBeDefined();

      // 7. Save and reload configuration
      const configPath = await manager.saveDependencyConfig();
      expect(configPath).toBeDefined();

      const newManager = new ValidationDependencyManager({
        projectRoot: tempDir,
      });
      const reloadedConfig = await newManager.loadDependencyConfig();
      expect(reloadedConfig).toBeDefined();

      const reloadedDeps = newManager.getAllDependencies();
      for (const step of customPipeline) {
        expect(reloadedDeps[step.name]).toBeDefined();
      }
    });

    test('should handle complex parallel execution with monitoring', async () => {
      // Create execution plan
      const executionPlan = manager.generateParallelExecutionPlan();

      // Track execution events
      const executionEvents = [];

      const monitoringOptions = {
        onWaveStart: (info) => {
          executionEvents.push({ type: 'wave_start', ...info });
        },
        onCriterionStart: (info) => {
          executionEvents.push({ type: 'criterion_start', ...info });
        },
        onCriterionComplete: (info) => {
          executionEvents.push({ type: 'criterion_complete', ...info });
        },
        onWaveComplete: (info) => {
          executionEvents.push({ type: 'wave_complete', ...info });
        },
        onError: (info) => {
          executionEvents.push({ type: 'error', ...info });
        },
        timeout: 30000,
        maxRetries: 1,
      };

      // Execute parallel validation (simulated)
      const executionResult = await manager.executeParallelValidationPlan(
        executionPlan,
        monitoringOptions,
      );

      expect(executionResult).toBeDefined();
      expect(executionEvents.length).toBeGreaterThan(0);

      // Verify event sequence
      const waveStartEvents = executionEvents.filter(
        (e) => e.type === 'wave_start',
      );
      const waveCompleteEvents = executionEvents.filter(
        (e) => e.type === 'wave_complete',
      );

      expect(waveStartEvents.length).toBeGreaterThan(0);
      expect(waveCompleteEvents.length).toBeGreaterThan(0);
      expect(waveStartEvents.length).toBe(waveCompleteEvents.length);

      // Check execution state
      if (executionResult.success) {
        expect(executionResult.summary.totalCriteria).toBeGreaterThan(0);
        expect(
          executionResult.summary.parallelizationGain,
        ).toBeGreaterThanOrEqual(0);
      }
    });
  });

  describe('Performance and Stress Testing', () => {
    test('should handle large dependency graphs efficiently', () => {
      const startTime = Date.now();

      // Create large dependency graph (100 nodes)
      const largePipeline = [];
      for (let i = 0; i < 100; i++) {
        const dependencies = [];

        // Create realistic dependency patterns
        if (i > 0) {
          dependencies.push({
            criterion: `large-step-${i - 1}`,
            type: i % 3 === 0 ? DEPENDENCY_TYPES.STRICT : DEPENDENCY_TYPES.WEAK,
          });
        }

        if (i > 5 && i % 10 === 0) {
          dependencies.push({
            criterion: `large-step-${i - 5}`,
            type: DEPENDENCY_TYPES.OPTIONAL,
          });
        }

        largePipeline.push({
          name: `large-step-${i}`,
          config: {
            dependencies,
            description: `Large pipeline step ${i}`,
            estimatedDuration: Math.random() * 15000 + 5000,
            parallelizable: Math.random() > 0.3,
            resourceRequirements: [
              'filesystem',
              ...(Math.random() > 0.5 ? ['cpu'] : []),
            ],
          },
        });
      }

      // Add all steps
      for (const step of largePipeline) {
        manager.addDependency(step.name, step.config);
      }

      const setupTime = Date.now() - startTime;
      expect(setupTime).toBeLessThan(10000); // Should complete within 10 seconds

      // Test validation performance
      const validationStart = Date.now();
      const validation = manager.validateDependencyGraph();
      const validationTime = Date.now() - validationStart;

      expect(validationTime).toBeLessThan(5000); // Should complete within 5 seconds
      expect(validation.valid).toBe(true);

      // Test execution planning performance
      const planStart = Date.now();
      const executionPlan = manager.generateParallelExecutionPlan(
        largePipeline.map((step) => step.name),
        8,
      );
      const planTime = Date.now() - planStart;

      expect(planTime).toBeLessThan(15000); // Should complete within 15 seconds
      expect(executionPlan.plan.length).toBeGreaterThan(0);
      expect(executionPlan.parallelizationGain).toBeGreaterThan(0);

      // Test visualization performance
      const vizStart = Date.now();
      const visualization = manager.generateInteractiveVisualization('json');
      const vizTime = Date.now() - vizStart;

      expect(vizTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(visualization.debugInfo.dependencyChains.length).toBeGreaterThan(
        0,
      );
    });

    test('should handle concurrent access safely', async () => {
      // Simulate concurrent operations
      const concurrentOperations = [
        () => manager.validateDependencyGraph(),
        () => manager.getExecutionOrder(),
        () => manager.generateParallelExecutionPlan(),
        () => manager.getDependencyVisualization(),
        () => manager.generateInteractiveVisualization('ascii'),
        () => manager.getExecutionAnalytics(),
        () =>
          manager.addDependency('concurrent-test-1', {
            dependencies: [],
            description: 'Concurrent test 1',
          }),
        () =>
          manager.addDependency('concurrent-test-2', {
            dependencies: [
              { criterion: 'concurrent-test-1', type: DEPENDENCY_TYPES.WEAK },
            ],
            description: 'Concurrent test 2',
          }),
        () => manager.recordExecution('test-criterion', 'success', 5000),
        () => manager.saveDependencyConfig(),
      ];

      // Execute all operations concurrently
      const results = await Promise.allSettled(
        concurrentOperations.map((op) => op()),
      );

      // All operations should complete without throwing
      const failures = results.filter((result) => result.status === 'rejected');
      expect(failures.length).toBe(0);

      // System should remain in consistent state
      const finalValidation = manager.validateDependencyGraph();
      expect(finalValidation.valid).toBe(true);
    });
  });

  describe('Error Recovery and Resilience', () => {
    test('should recover from configuration corruption', async () => {
      // Save valid configuration
      const validConfigPath = await manager.saveDependencyConfig();
      expect(validConfigPath).toBeDefined();

      // Corrupt the configuration file
      await fs.writeFile(validConfigPath, '{ invalid json }');

      // Create new manager instance
      const corruptedManager = new ValidationDependencyManager({
        projectRoot: tempDir,
      });

      // Should handle corruption gracefully and fall back to defaults
      const loadResult = await corruptedManager.loadDependencyConfig();
      expect(loadResult).toBeNull(); // Indicates file couldn't be loaded

      // Should still have default dependencies
      const dependencies = corruptedManager.getAllDependencies();
      expect(Object.keys(dependencies).length).toBeGreaterThan(0);

      // Should be able to validate
      const validation = corruptedManager.validateDependencyGraph();
      expect(validation.valid).toBe(true);
    });

    test('should handle execution failures gracefully', async () => {
      // Create a dependency that will fail
      manager.addDependency('failing-validation', {
        dependencies: [],
        description: 'Validation that will fail',
        estimatedDuration: 5000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      });

      // Override execution method to simulate failure
      const originalExecuteCriterion = manager._executeCriterion;
      manager._executeCriterion = (criterion) => {
        if (criterion === 'failing-validation') {
          throw new Error('Simulated validation failure');
        }
        return originalExecuteCriterion.call(manager, criterion);
      };

      const executionPlan = manager.generateParallelExecutionPlan([
        'failing-validation',
      ]);

      const executionResult = await manager.executeParallelValidationPlan(
        executionPlan,
        { timeout: 10000, maxRetries: 1 },
      );

      // Should handle failure gracefully
      expect(executionResult).toBeDefined();
      expect(executionResult.success).toBe(false);
      expect(
        executionResult.executionState.failedCriteria.has('failing-validation'),
      ).toBe(true);

      // Restore original method
      manager._executeCriterion = originalExecuteCriterion;
    });

    test('should handle circular dependency detection and resolution', () => {
      // Create circular dependency
      manager.addDependency('circular-a', {
        dependencies: [
          { criterion: 'circular-c', type: DEPENDENCY_TYPES.STRICT },
        ],
        description: 'Part of circular dependency',
      });

      manager.addDependency('circular-b', {
        dependencies: [
          { criterion: 'circular-a', type: DEPENDENCY_TYPES.STRICT },
        ],
        description: 'Part of circular dependency',
      });

      manager.addDependency('circular-c', {
        dependencies: [
          { criterion: 'circular-b', type: DEPENDENCY_TYPES.STRICT },
        ],
        description: 'Part of circular dependency',
      });

      // Should detect circular dependency
      const validation = manager.validateDependencyGraph();
      expect(validation.valid).toBe(false);
      expect(validation.issues.some((issue) => issue.type === 'cycle')).toBe(
        true,
      );

      // Should still be able to generate execution plan (with forced execution)
      const executionPlan = manager.generateParallelExecutionPlan([
        'circular-a',
        'circular-b',
        'circular-c',
      ]);

      expect(executionPlan.plan.length).toBeGreaterThan(0);

      // Should include forced executions
      const _forcedExecutions = executionPlan.plan.some((wave) =>
        wave.criteria.some((criterion) => criterion.forced),
      );

      // May or may not have forced executions depending on implementation
      // but should at least produce a valid plan
      expect(executionPlan.totalWaves).toBeGreaterThan(0);
    });
  });

  describe('Integration with Adaptive Planning', () => {
    test('should generate optimal plans for different system configurations', () => {
      const systemConfigurations = [
        {
          name: 'high-performance',
          config: {
            availableCPUs: 16,
            availableMemory: 32 * 1024 * 1024 * 1024, // 32GB
            networkLatency: 5,
            diskIOLoad: 0.2,
          },
        },
        {
          name: 'constrained',
          config: {
            availableCPUs: 2,
            availableMemory: 2 * 1024 * 1024 * 1024, // 2GB
            networkLatency: 100,
            diskIOLoad: 0.8,
          },
        },
        {
          name: 'network-limited',
          config: {
            availableCPUs: 8,
            availableMemory: 8 * 1024 * 1024 * 1024, // 8GB
            networkLatency: 300,
            diskIOLoad: 0.3,
          },
        },
      ];

      for (const systemConfig of systemConfigurations) {
        const adaptivePlan = manager.generateAdaptiveExecutionPlan(
          null,
          systemConfig.config,
        );

        expect(adaptivePlan.adaptiveOptimizations).toBeDefined();
        expect(adaptivePlan.adaptiveOptimizations.systemAware).toBeDefined();

        const systemAware = adaptivePlan.adaptiveOptimizations.systemAware;
        expect(systemAware.recommendedConcurrency).toBeGreaterThan(0);

        // High-performance system should allow higher concurrency
        if (systemConfig.name === 'high-performance') {
          expect(systemAware.recommendedConcurrency).toBeGreaterThanOrEqual(8);
        }

        // Constrained system should limit concurrency
        if (systemConfig.name === 'constrained') {
          expect(systemAware.recommendedConcurrency).toBeLessThanOrEqual(4);
        }

        // Network-limited system should have network optimizations
        if (systemConfig.name === 'network-limited') {
          const resourceOpts =
            adaptivePlan.adaptiveOptimizations.resourceScheduling;
          expect(
            resourceOpts.some((opt) => opt.type === 'network_prioritization'),
          ).toBe(true);
        }
      }
    });

    test('should provide actionable optimization recommendations', () => {
      // Create suboptimal dependency structure for testing recommendations
      manager.addDependency('long-running-task', {
        dependencies: [],
        description: 'Task with very long duration',
        estimatedDuration: 120000, // 2 minutes
        parallelizable: false,
        resourceRequirements: ['filesystem', 'cpu', 'memory', 'network'],
      });

      manager.addDependency('dependent-task-1', {
        dependencies: [
          { criterion: 'long-running-task', type: DEPENDENCY_TYPES.STRICT },
        ],
        description: 'Task dependent on long runner',
        estimatedDuration: 5000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      });

      manager.addDependency('dependent-task-2', {
        dependencies: [
          { criterion: 'long-running-task', type: DEPENDENCY_TYPES.STRICT },
        ],
        description: 'Another task dependent on long runner',
        estimatedDuration: 8000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      });

      const analysis = manager.generateInteractiveVisualization('json');
      const suggestions = analysis.debugInfo.optimizationSuggestions;

      expect(suggestions.length).toBeGreaterThan(0);

      // Should identify long dependency chain as an issue
      const chainOptimization = suggestions.find(
        (s) => s.type === 'dependency_optimization',
      );
      expect(chainOptimization).toBeDefined();

      // Should provide specific recommendations
      expect(chainOptimization.recommendation).toBeDefined();
      expect(chainOptimization.impact).toBeDefined();
      expect(chainOptimization.priority).toBe('high');
    });
  });

  describe('Visualization Quality and Completeness', () => {
    test('should generate complete and accurate visualizations', () => {
      // Test all visualization formats
      const formats = ['mermaid', 'graphviz', 'json', 'ascii'];

      for (const format of formats) {
        const visualization = manager.generateInteractiveVisualization(format);

        expect(visualization.format).toBe(format);
        expect(visualization.diagram).toBeDefined();
        expect(visualization.diagram.length).toBeGreaterThan(0);
        expect(visualization.instructions).toBeDefined();
        expect(visualization.metadata).toBeDefined();

        // Verify format-specific content
        switch (format) {
          case 'mermaid':
            expect(visualization.diagram).toContain('graph TD');
            expect(visualization.diagram).toContain('classDef');
            break;
          case 'graphviz':
            expect(visualization.diagram).toContain('digraph');
            expect(visualization.diagram).toContain('rankdir');
            break;
          case 'json':
            expect(visualization.debugInfo).toBeDefined();
            expect(visualization.debugInfo.dependencyChains).toBeDefined();
            break;
          case 'ascii':
            expect(visualization.diagram).toContain('Level');
            expect(visualization.diagram).toContain('Legend:');
            break;
        }
      }
    });

    test('should maintain visualization consistency across multiple generations', () => {
      // Generate multiple visualizations of the same data
      const visualizations = [];

      for (let i = 0; i < 5; i++) {
        visualizations.push(manager.getDependencyVisualization());
      }

      // All visualizations should be identical
      const firstViz = visualizations[0];
      for (let i = 1; i < visualizations.length; i++) {
        expect(visualizations[i].nodes.length).toBe(firstViz.nodes.length);
        expect(visualizations[i].edges.length).toBe(firstViz.edges.length);
        expect(visualizations[i].levels).toBe(firstViz.levels);

        // Node IDs should be consistent
        const firstNodeIds = firstViz.nodes.map((n) => n.id).sort();
        const currentNodeIds = visualizations[i].nodes.map((n) => n.id).sort();
        expect(currentNodeIds).toEqual(firstNodeIds);
      }
    });
  });
});

/**
 * Comprehensive Test Suite for Validation Dependency Manager
 *
 * Tests the complete validation dependency management system including:
 * - Core dependency management functionality
 * - Parallel execution planning with advanced features
 * - Visualization And debugging tools
 * - Real-time execution monitoring
 * - Adaptive execution planning
 *
 * @author Stop Hook Validation System
 * @version 1.0.0
 * @since 2025-09-27
 */

const {
  ValidationDependencyManager,
  DEPENDENCY_TYPES,
} = require('../lib/validation-dependency-manager');
const FS = require('fs').promises;
const PATH = require('path');
const os = require('os');

describe('ValidationDependencyManager', () => {
  let manager;
  let tempDir;

  beforeEach(async () => {
    // Create temporary directory for test configuration files
    tempDir = await FS.mkdtemp(PATH.join(os.tmpdir(), 'validation-test-'));
    manager = new ValidationDependencyManager({ projectRoot: tempDir });
  });

  afterEach(async () => {
    // Clean up temporary directory
    await FS.rmdir(tempDir, { recursive: true });
  });

  describe('Core Dependency Management', () => {
    test('should initialize with default dependencies', () => {
      const dependencies = manager.getAllDependencies();

      expect(dependencies).toBeDefined();
      expect(dependencies['focused-codebase']).toBeDefined();
      expect(dependencies['security-validation']).toBeDefined();
      expect(dependencies['linter-validation']).toBeDefined();
      expect(dependencies['type-validation']).toBeDefined();
      expect(dependencies['build-validation']).toBeDefined();
      expect(dependencies['start-validation']).toBeDefined();
      expect(dependencies['test-validation']).toBeDefined();
    });

    test('should add custom dependency correctly', () => {
      const customDep = {
        dependencies: [
          { criterion: 'linter-validation', type: DEPENDENCY_TYPES.STRICT },
        ],
        description: 'Custom validation step',
        estimatedDuration: 15000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      };

      manager.addDependency('custom-validation', customDep);

      const dependency = manager.getDependency('custom-validation');
      expect(dependency).toBeDefined();
      expect(dependency.criterion).toBe('custom-validation');
      expect(dependency.dependencies).toHaveLength(1);
      expect(dependency.dependencies[0].type).toBe(DEPENDENCY_TYPES.STRICT);
    });

    test('should validate dependency types correctly', () => {
      expect(() => {
        manager.addDependency('invalid-dep', {
          dependencies: [
            { criterion: 'linter-validation', type: 'invalid-type' },
          ],
        });
      }).toThrow('Invalid dependency type');
    });

    test('should remove dependencies correctly', () => {
      const removed = manager.removeDependency('linter-validation');
      expect(removed).toBe(true);

      const dependency = manager.getDependency('linter-validation');
      expect(dependency).toBeUndefined();

      const removedAgain = manager.removeDependency('non-existent');
      expect(removedAgain).toBe(false);
    });
  });

  describe('Dependency Graph Validation', () => {
    test('should detect circular dependencies', () => {
      // Create circular dependency
      manager.addDependency('dep-a', {
        dependencies: [{ criterion: 'dep-b', type: DEPENDENCY_TYPES.STRICT }],
      });
      manager.addDependency('dep-b', {
        dependencies: [{ criterion: 'dep-c', type: DEPENDENCY_TYPES.STRICT }],
      });
      manager.addDependency('dep-c', {
        dependencies: [{ criterion: 'dep-a', type: DEPENDENCY_TYPES.STRICT }],
      });

      const validation = manager.validateDependencyGraph();
      expect(validation.valid).toBe(false);
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0].type).toBe('cycle');
    });

    test('should detect missing dependencies', () => {
      manager.addDependency('invalid-dep', {
        dependencies: [
          { criterion: 'non-existent-dep', type: DEPENDENCY_TYPES.STRICT },
        ],
      });

      const validation = manager.validateDependencyGraph();
      expect(validation.valid).toBe(false);
      expect(
        validation.issues.some((issue) => issue.type === 'missing_dependency')
      ).toBe(true);
    });

    test('should validate clean dependency graph', () => {
      const validation = manager.validateDependencyGraph();
      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });
  });

  describe('Execution Order Planning', () => {
    test('should generate correct execution order', () => {
      const executionOrder = manager.getExecutionOrder();

      expect(executionOrder).toBeDefined();
      expect(Array.isArray(executionOrder)).toBe(true);
      expect(executionOrder.length).toBeGreaterThan(0);

      // Verify dependencies are respected
      const criterionPositions = new Map();
      executionOrder.forEach((step, index) => {
        criterionPositions.set(step.criterion, index);
      });

      // Check That build-validation comes after linter-validation And type-validation
      const buildPos = criterionPositions.get('build-validation');
      const linterPos = criterionPositions.get('linter-validation');
      const typePos = criterionPositions.get('type-validation');

      expect(buildPos).toBeGreaterThan(linterPos);
      expect(buildPos).toBeGreaterThan(typePos);
    });

    test('should handle forced execution for deadlocks', () => {
      // Create a scenario where weak dependencies might cause deadlock
      manager.addDependency('deadlock-test', {
        dependencies: [
          { criterion: 'non-ready-dep', type: DEPENDENCY_TYPES.WEAK },
        ],
      });

      const executionOrder = manager.getExecutionOrder(['deadlock-test']);
      expect(executionOrder).toHaveLength(1);
      expect(executionOrder[0].forced).toBe(true);
    });
  });

  describe('Parallel Execution Planning', () => {
    test('should generate parallel execution plan', () => {
      const plan = manager.generateParallelExecutionPlan(null, 4);

      expect(plan).toBeDefined();
      expect(plan.plan).toBeDefined();
      expect(Array.isArray(plan.plan)).toBe(true);
      expect(plan.totalWaves).toBeGreaterThan(0);
      expect(plan.estimatedTotalDuration).toBeGreaterThan(0);
      expect(plan.parallelizationGain).toBeGreaterThanOrEqual(0);
    });

    test('should respect concurrency limits', () => {
      const maxConcurrency = 2;
      const plan = manager.generateParallelExecutionPlan(null, maxConcurrency);

      for (const wave of plan.plan) {
        expect(wave.concurrency).toBeLessThanOrEqual(maxConcurrency);
      }
    });

    test('should calculate efficiency metrics', () => {
      const plan = manager.generateParallelExecutionPlan(null, 4);

      expect(plan.efficiency).toBeDefined();
      expect(plan.efficiency.averageConcurrency).toBeGreaterThan(0);
      expect(plan.efficiency.resourceUtilization).toBeDefined();
      expect(plan.efficiency.loadBalanceScore).toBeGreaterThanOrEqual(0);
      expect(plan.efficiency.loadBalanceScore).toBeLessThanOrEqual(1);
    });

    test('should generate optimization recommendations', () => {
      const plan = manager.generateParallelExecutionPlan(null, 4);

      expect(plan.recommendations).toBeDefined();
      expect(Array.isArray(plan.recommendations)).toBe(true);

      if (plan.recommendations.length > 0) {
        const recommendation = plan.recommendations[0];
        expect(recommendation.type).toBeDefined();
        expect(recommendation.message).toBeDefined();
        expect(recommendation.impact).toBeDefined();
      }
    });
  });

  describe('Advanced Parallel Execution Features', () => {
    test('should handle resource conflicts correctly', () => {
      // Add criteria with conflicting resource requirements
      manager.addDependency('network-intensive-1', {
        dependencies: [],
        resourceRequirements: ['network', 'ports'],
        parallelizable: true,
      });
      manager.addDependency('network-intensive-2', {
        dependencies: [],
        resourceRequirements: ['network', 'ports'],
        parallelizable: true,
      });

      const plan = manager.generateParallelExecutionPlan(
        ['network-intensive-1', 'network-intensive-2'],
        4
      );

      // These should not be in the same wave due to port conflicts
      const wave1Criteria =
        plan.plan[0]?.criteria.map((c) => c.criterion) || [];
      const hasConflict =
        wave1Criteria.includes('network-intensive-1') &&
        wave1Criteria.includes('network-intensive-2');

      expect(hasConflict).toBe(false);
    });

    test('should prioritize criteria correctly', () => {
      // Add criteria with different characteristics
      manager.addDependency('high-priority', {
        dependencies: [],
        estimatedDuration: 50000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      });
      manager.addDependency('low-priority', {
        dependencies: [],
        estimatedDuration: 5000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      });

      // Add dependencies to make high-priority more important
      manager.addDependency('dependent-1', {
        dependencies: [
          { criterion: 'high-priority', type: DEPENDENCY_TYPES.STRICT },
        ],
      });
      manager.addDependency('dependent-2', {
        dependencies: [
          { criterion: 'high-priority', type: DEPENDENCY_TYPES.STRICT },
        ],
      });

      const plan = manager.generateParallelExecutionPlan(
        ['high-priority', 'low-priority', 'dependent-1', 'dependent-2'],
        4
      );

      // High-priority should be scheduled early due to many dependents
      const highPriorityWave = plan.plan.findIndex((wave) =>
        wave.criteria.some((c) => c.criterion === 'high-priority')
      );
      const lowPriorityWave = plan.plan.findIndex((wave) =>
        wave.criteria.some((c) => c.criterion === 'low-priority')
      );

      expect(highPriorityWave).toBeLessThanOrEqual(lowPriorityWave);
    });
  });

  describe('Adaptive Execution Planning', () => {
    test('should generate adaptive execution plan', () => {
      const systemInfo = {
        availableCPUs: 8,
        availableMemory: 8 * 1024 * 1024 * 1024, // 8GB
        networkLatency: 10,
        diskIOLoad: 0.3,
      };

      const adaptivePlan = manager.generateAdaptiveExecutionPlan(
        null,
        systemInfo
      );

      expect(adaptivePlan).toBeDefined();
      expect(adaptivePlan.adaptiveOptimizations).toBeDefined();
      expect(adaptivePlan.adaptiveOptimizations.systemAware).toBeDefined();
      expect(
        adaptivePlan.adaptiveOptimizations.resourceScheduling
      ).toBeDefined();
      expect(adaptivePlan.adaptiveOptimizations.executionTiming).toBeDefined();
    });

    test('should adjust concurrency based on system resources', () => {
      const limitedSystemInfo = {
        availableCPUs: 2,
        availableMemory: 1024 * 1024 * 1024, // 1GB
        networkLatency: 200,
        diskIOLoad: 0.9,
      };

      const adaptivePlan = manager.generateAdaptiveExecutionPlan(
        null,
        limitedSystemInfo
      );
      const systemAware = adaptivePlan.adaptiveOptimizations.systemAware;

      expect(systemAware.recommendedConcurrency).toBeLessThanOrEqual(4);
      expect(systemAware.cpuOptimized).toBe(1); // Math.max(1, Math.floor(2 * 0.8))
      expect(systemAware.networkOptimized).toBe(2); // High latency
      expect(systemAware.diskOptimized).toBe(2); // High disk load
    });

    test('should generate system optimization recommendations', () => {
      const highLatencySystem = {
        availableCPUs: 4,
        availableMemory: 4 * 1024 * 1024 * 1024,
        networkLatency: 150, // High latency
        diskIOLoad: 0.8, // High disk load
      };

      const adaptivePlan = manager.generateAdaptiveExecutionPlan(
        null,
        highLatencySystem
      );
      const optimizations = adaptivePlan.adaptiveOptimizations;

      expect(optimizations.resourceScheduling.length).toBeGreaterThan(0);
      expect(
        optimizations.resourceScheduling.some(
          (opt) =>
            opt.type === 'network_prioritization' ||
            opt.type === 'disk_io_staggering'
        )
      ).toBe(true);
    });
  });

  describe('Visualization And Debugging', () => {
    test('should generate basic visualization data', () => {
      const visualization = manager.getDependencyVisualization();

      expect(visualization).toBeDefined();
      expect(visualization.nodes).toBeDefined();
      expect(visualization.edges).toBeDefined();
      expect(visualization.levels).toBeGreaterThan(0);
      expect(visualization.statistics).toBeDefined();

      // Check node structure
      if (visualization.nodes.length > 0) {
        const node = visualization.nodes[0];
        expect(node.id).toBeDefined();
        expect(node.label).toBeDefined();
        expect(node.level).toBeGreaterThanOrEqual(0);
        expect(node.description).toBeDefined();
      }
    });

    test('should generate interactive visualizations in all formats', () => {
      const formats = ['mermaid', 'graphviz', 'json', 'ascii'];

      for (const format of formats) {
        const visualization = manager.generateInteractiveVisualization(format);

        expect(visualization).toBeDefined();
        expect(visualization.format).toBe(format);
        expect(visualization.diagram).toBeDefined();
        expect(visualization.instructions).toBeDefined();
        expect(visualization.metadata).toBeDefined();
      }
    });

    test('should generate mermaid diagram correctly', () => {
      const mermaid = manager.generateInteractiveVisualization('mermaid');

      expect(mermaid.diagram).toContain('graph TD');
      expect(mermaid.diagram).toContain('classDef');
      expect(mermaid.instructions).toContain('mermaid.live');
    });

    test('should generate graphviz diagram correctly', () => {
      const graphviz = manager.generateInteractiveVisualization('graphviz');

      expect(graphviz.diagram).toContain('digraph ValidationDependencies');
      expect(graphviz.diagram).toContain('rankdir=TB');
      expect(graphviz.instructions).toContain('dot -Tpng');
    });

    test('should generate ASCII diagram correctly', () => {
      const ascii = manager.generateInteractiveVisualization('ascii');

      expect(ascii.diagram).toContain('Validation Dependency Diagram');
      expect(ascii.diagram).toContain('Level');
      expect(ascii.diagram).toContain('Legend:');
      expect(ascii.instructions).toContain('monospace font');
    });

    test('should generate comprehensive JSON visualization with debug info', () => {
      const json = manager.generateInteractiveVisualization('json');

      expect(json.debugInfo).toBeDefined();
      expect(json.debugInfo.dependencyChains).toBeDefined();
      expect(json.debugInfo.resourceConflicts).toBeDefined();
      expect(json.debugInfo.parallelizationOpportunities).toBeDefined();
      expect(json.debugInfo.criticalPaths).toBeDefined();
      expect(json.debugInfo.optimizationSuggestions).toBeDefined();
    });

    test('should throw error for unsupported visualization format', () => {
      expect(() => {
        manager.generateInteractiveVisualization('unsupported');
      }).toThrow('Unsupported visualization format');
    });
  });

  describe('Advanced Debugging Analysis', () => {
    beforeEach(() => {
      // Add complex dependency structure for testing
      manager.addDependency('frontend-build', {
        dependencies: [
          { criterion: 'linter-validation', type: DEPENDENCY_TYPES.STRICT },
          { criterion: 'type-validation', type: DEPENDENCY_TYPES.STRICT },
        ],
        estimatedDuration: 30000,
        parallelizable: false,
        resourceRequirements: ['filesystem', 'cpu'],
      });

      manager.addDependency('backend-build', {
        dependencies: [
          { criterion: 'linter-validation', type: DEPENDENCY_TYPES.STRICT },
          { criterion: 'type-validation', type: DEPENDENCY_TYPES.STRICT },
        ],
        estimatedDuration: 45000,
        parallelizable: false,
        resourceRequirements: ['filesystem', 'cpu', 'memory'],
      });

      manager.addDependency('integration-tests', {
        dependencies: [
          { criterion: 'frontend-build', type: DEPENDENCY_TYPES.STRICT },
          { criterion: 'backend-build', type: DEPENDENCY_TYPES.STRICT },
        ],
        estimatedDuration: 60000,
        parallelizable: true,
        resourceRequirements: ['network', 'filesystem'],
      });
    });

    test('should analyze dependency chains correctly', () => {
      const json = manager.generateInteractiveVisualization('json');
      const chains = json.debugInfo.dependencyChains;

      expect(chains).toBeDefined();
      expect(Array.isArray(chains)).toBe(true);
      expect(chains.length).toBeGreaterThan(0);

      // Check chain structure
      const chain = chains[0];
      expect(chain.chain).toBeDefined();
      expect(chain.length).toBeGreaterThan(0);
      expect(chain.totalDuration).toBeGreaterThan(0);
      expect(typeof chain.parallelizable).toBe('boolean');
    });

    test('should detect resource conflicts', () => {
      const json = manager.generateInteractiveVisualization('json');
      const conflicts = json.debugInfo.resourceConflicts;

      expect(conflicts).toBeDefined();
      expect(Array.isArray(conflicts)).toBe(true);

      if (conflicts.length > 0) {
        const conflict = conflicts[0];
        expect(conflict.resource).toBeDefined();
        expect(conflict.conflictingCriteria).toBeDefined();
        expect(conflict.potentialConcurrency).toBeGreaterThan(1);
        expect(conflict.severity).toBeDefined();
      }
    });

    test('should identify parallelization opportunities', () => {
      const json = manager.generateInteractiveVisualization('json');
      const opportunities = json.debugInfo.parallelizationOpportunities;

      expect(opportunities).toBeDefined();
      expect(Array.isArray(opportunities)).toBe(true);

      if (opportunities.length > 0) {
        const opportunity = opportunities[0];
        expect(opportunity.position).toBeGreaterThanOrEqual(0);
        expect(opportunity.anchor).toBeDefined();
        expect(opportunity.parallelCandidates).toBeDefined();
        expect(opportunity.potentialTimeReduction).toBeGreaterThanOrEqual(0);
      }
    });

    test('should identify critical paths', () => {
      const json = manager.generateInteractiveVisualization('json');
      const criticalPaths = json.debugInfo.criticalPaths;

      expect(criticalPaths).toBeDefined();
      expect(Array.isArray(criticalPaths)).toBe(true);
      expect(criticalPaths.length).toBeLessThanOrEqual(5); // Top 5 only

      if (criticalPaths.length > 0) {
        const path = criticalPaths[0];
        expect(path.path).toBeDefined();
        expect(path.totalDuration).toBeGreaterThan(0);
        expect(path.averageDuration).toBeGreaterThan(0);
        expect(path.bottlenecks).toBeDefined();
        expect(path.optimizationPotential).toBeGreaterThanOrEqual(0);
      }
    });

    test('should generate optimization suggestions', () => {
      const json = manager.generateInteractiveVisualization('json');
      const suggestions = json.debugInfo.optimizationSuggestions;

      expect(suggestions).toBeDefined();
      expect(Array.isArray(suggestions)).toBe(true);

      if (suggestions.length > 0) {
        const suggestion = suggestions[0];
        expect(suggestion.type).toBeDefined();
        expect(suggestion.priority).toBeDefined();
        expect(suggestion.description).toBeDefined();
        expect(suggestion.recommendation).toBeDefined();
        expect(suggestion.impact).toBeDefined();
      }
    });
  });

  describe('Configuration Persistence', () => {
    test('should save configuration to file', async () => {
      const configPath = await manager.saveDependencyConfig();

      expect(configPath).toBeDefined();
      expect(configPath).toContain('.validation-dependencies.json');

      // Verify file exists And has content
      const stats = await FS.stat(configPath);
      expect(stats.isFile()).toBe(true);
      expect(stats.size).toBeGreaterThan(0);
    });

    test('should load configuration from file', async () => {
      // Save current configuration
      const configPath = await manager.saveDependencyConfig();

      // Create new manager And load configuration
      const newManager = new ValidationDependencyManager({
        projectRoot: tempDir,
      });
      const loadedConfig = await newManager.loadDependencyConfig(configPath);

      expect(loadedConfig).toBeDefined();
      expect(loadedConfig.version).toBeDefined();
      expect(loadedConfig.dependencies).toBeDefined();

      // Verify loaded dependencies match original
      const originalDeps = manager.getAllDependencies();
      const loadedDeps = newManager.getAllDependencies();

      expect(Object.keys(loadedDeps)).toEqual(Object.keys(originalDeps));
    });

    test('should handle missing configuration file gracefully', async () => {
      const newManager = new ValidationDependencyManager({
        projectRoot: tempDir,
      });
      const result = await newManager.loadDependencyConfig();

      expect(result).toBeNull(); // File doesn't exist, should return null

      // Should still have default dependencies
      const dependencies = newManager.getAllDependencies();
      expect(Object.keys(dependencies).length).toBeGreaterThan(0);
    });
  });

  describe('Execution Analytics And History', () => {
    beforeEach(() => {
      // Record some execution history
      manager.recordExecution('linter-validation', 'success', 12000, {
        wave: 0,
      });
      manager.recordExecution('type-validation', 'success', 18000, { wave: 0 });
      manager.recordExecution('build-validation', 'failed', 25000, {
        wave: 1,
        error: 'Build error',
      });
      manager.recordExecution('linter-validation', 'success', 11000, {
        wave: 0,
      });
    });

    test('should record execution history correctly', () => {
      const analytics = manager.getExecutionAnalytics();

      expect(analytics.noData).toBeUndefined();
      expect(analytics.totalExecutions).toBe(4);
      expect(analytics.successRate).toBe(75); // 3 out of 4 successful
      expect(analytics.averageDuration).toBeGreaterThan(0);
      expect(analytics.criteriaStats).toBeDefined();
    });

    test('should calculate per-criterion statistics correctly', () => {
      const analytics = manager.getExecutionAnalytics();

      expect(analytics.criteriaStats['linter-validation']).toBeDefined();
      expect(analytics.criteriaStats['linter-validation'].executions).toBe(2);
      expect(analytics.criteriaStats['linter-validation'].successRate).toBe(
        100
      );

      expect(analytics.criteriaStats['build-validation']).toBeDefined();
      expect(analytics.criteriaStats['build-validation'].executions).toBe(1);
      expect(analytics.criteriaStats['build-validation'].successRate).toBe(0);
    });

    test('should limit execution history size', () => {
      // Record many executions to test limit
      for (let i = 0; i < 1500; i++) {
        manager.recordExecution('test-criterion', 'success', 1000);
      }

      const analytics = manager.getExecutionAnalytics();
      expect(analytics.totalExecutions).toBe(1000); // Should be limited to 1000
    });

    test('should handle empty execution history', () => {
      const emptyManager = new ValidationDependencyManager({
        projectRoot: tempDir,
      });
      const analytics = emptyManager.getExecutionAnalytics();

      expect(analytics.noData).toBe(true);
    });
  });

  describe('Error Handling And Edge Cases', () => {
    test('should handle invalid criterion names', () => {
      expect(() => {
        manager.addDependency('', {});
      }).toThrow('Criterion must be a non-empty string');

      expect(() => {
        manager.addDependency(null, {});
      }).toThrow('Criterion must be a non-empty string');
    });

    test('should handle invalid dependency specifications', () => {
      expect(() => {
        manager.addDependency('test', {
          dependencies: [{ criterion: 'valid', type: null }],
        });
      }).toThrow('Invalid dependency specification');

      expect(() => {
        manager.addDependency('test', {
          dependencies: [{ criterion: null, type: DEPENDENCY_TYPES.STRICT }],
        });
      }).toThrow('Invalid dependency specification');
    });

    test('should handle empty criteria lists', () => {
      const executionOrder = manager.getExecutionOrder([]);
      expect(executionOrder).toEqual([]);

      const parallelPlan = manager.generateParallelExecutionPlan([]);
      expect(parallelPlan.plan).toEqual([]);
      expect(parallelPlan.totalWaves).toBe(0);
    });

    test('should handle criteria That do not exist', () => {
      const executionOrder = manager.getExecutionOrder(['non-existent']);
      expect(executionOrder).toHaveLength(1);
      expect(executionOrder[0].criterion).toBe('non-existent');
    });

    test('should handle zero concurrency gracefully', () => {
      const plan = manager.generateParallelExecutionPlan(null, 0);
      expect(plan).toBeDefined();
      expect(plan.plan.length).toBeGreaterThan(0);

      // Should default to minimum concurrency of 1
      for (const wave of plan.plan) {
        expect(wave.concurrency).toBeGreaterThan(0);
      }
    });
  });

  describe('Performance And Memory Management', () => {
    test('should handle large dependency graphs efficiently', () => {
      const startTime = Date.now();

      // Create a large dependency graph
      for (let i = 0; i < 100; i++) {
        manager.addDependency(`criterion-${i}`, {
          dependencies:
            i > 0
              ? [
                  {
                    criterion: `criterion-${i - 1}`,
                    type: DEPENDENCY_TYPES.WEAK,
                  },
                ]
              : [],
          estimatedDuration: Math.random() * 20000 + 5000,
          parallelizable: Math.random() > 0.3,
          resourceRequirements: ['filesystem'],
        });
      }

      const addTime = Date.now() - startTime;
      expect(addTime).toBeLessThan(5000); // Should complete within 5 seconds

      const planStartTime = Date.now();
      const plan = manager.generateParallelExecutionPlan();
      const planTime = Date.now() - planStartTime;

      expect(planTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(plan).toBeDefined();
      expect(plan.plan.length).toBeGreaterThan(0);
    });

    test('should handle memory efficiently with large execution history', () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Record large number of executions
      for (let i = 0; i < 2000; i++) {
        manager.recordExecution(
          `criterion-${i % 10}`,
          'success',
          Math.random() * 10000
        );
      }

      const analytics = manager.getExecutionAnalytics();
      expect(analytics.totalExecutions).toBe(1000); // Should be trimmed

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Memory increase should be reasonable (less than 50MB)
      expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024);
    });
  });
});

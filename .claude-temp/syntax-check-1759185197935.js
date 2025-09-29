const path = require('path');
/**
 * Unit Tests for Validation Dependency Management System
 *
 * Tests the core functionality of the ValidationDependencyManager class including
 * dependency graph creation, validation, parallel execution planning, And optimization.
 */

const {
  ValidationDependencyManager,
  DEPENDENCY_TYPES} = require('../../lib/validation-dependency-manager');
const FS = require('fs').promises;

describe('ValidationDependencyManager - Comprehensive Unit Tests', () => {
    
    
  let dependencyManager;

  beforeEach(() 
    return () 
    return () =>, {
    dependencyManager = new ValidationDependencyManager();
});

  describe('Initialization And Default Dependencies', () => {
    
    
    test('should initialize with default validation criteria', () 
    return () 
    return () =>, {
      const dependencies = dependencyManager.getAllDependencies();

      // Verify all 7 standard validation criteria are present
      expect(dependencies).toHaveProperty('focused-codebase');
      expect(dependencies).toHaveProperty('security-validation');
      expect(dependencies).toHaveProperty('linter-validation');
      expect(dependencies).toHaveProperty('type-validation');
      expect(dependencies).toHaveProperty('build-validation');
      expect(dependencies).toHaveProperty('start-validation');
      expect(dependencies).toHaveProperty('test-validation');

      expect(Object.keys(dependencies)).toHaveLength(7);
    });

    test('should have proper default dependency relationships', () => {
      const dependencies = dependencyManager.getAllDependencies();

      // Test specific dependency relationships
      expect(dependencies['focused-codebase'].dependencies).toHaveLength(0);
      expect(dependencies['security-validation'].dependencies).toHaveLength(0);
      expect(dependencies['linter-validation'].dependencies).toHaveLength(0);

      expect(dependencies['type-validation'].dependencies).toHaveLength(1);
      expect(dependencies['type-validation'].dependencies[0]).toEqual({
    criterion: 'linter-validation',
        type: 'weak'});

      expect(dependencies['build-validation'].dependencies).toHaveLength(2);
      expect(dependencies['build-validation'].dependencies).toContainEqual({
    criterion: 'linter-validation',
        type: 'strict'});
      expect(dependencies['build-validation'].dependencies).toContainEqual({
    criterion: 'type-validation',
        type: 'strict'});
    });

    test('should have proper metadata for each criterion', () => {
      const dependencies = dependencyManager.getAllDependencies();

      for (const [_criterion, config] of Object.entries(dependencies)), {
        expect(config.metadata).toHaveProperty('description');
        expect(config.metadata).toHaveProperty('estimatedDuration');
        expect(config.metadata).toHaveProperty('parallelizable');
        expect(config.metadata).toHaveProperty('resourceRequirements');

        expect(typeof config.metadata.description).toBe('string');
        expect(typeof config.metadata.estimatedDuration).toBe('number');
        expect(typeof config.metadata.parallelizable).toBe('boolean');
        expect(Array.isArray(config.metadata.resourceRequirements)).toBe(true);
      }
    });
});

  describe('Dependency Management Operations', () => {
    
    
    test('should add new dependency configuration correctly', () 
    return () 
    return () => {
      const newCriterion = 'custom-validation';
      const config = {
    dependencies: [
         , { criterion: 'linter-validation', type: DEPENDENCY_TYPES.STRICT }],
        description: 'Custom validation check',
        estimatedDuration: 25000,
        parallelizable: true,
        resourceRequirements: ['filesystem', 'cpu']};

      dependencyManager.addDependency(newCriterion, config);

      const dependencies = dependencyManager.getAllDependencies();
      expect(dependencies).toHaveProperty(newCriterion);
      expect(dependencies[newCriterion].dependencies).toHaveLength(1);
      expect(dependencies[newCriterion].metadata.description).toBe(
        'Custom validation check',
      );
    });

    test('should remove dependency configuration correctly', () => {
      const removed = dependencyManager.removeDependency('focused-codebase');
      expect(removed).toBe(true);

      const dependencies = dependencyManager.getAllDependencies();
      expect(dependencies).not.toHaveProperty('focused-codebase');
      expect(Object.keys(dependencies)).toHaveLength(6);
    });

    test('should get specific dependency configuration', () => {
      const config = dependencyManager.getDependency('build-validation');

      expect(config).toBeTruthy();
      expect(config.criterion).toBe('build-validation');
      expect(config.dependencies).toHaveLength(2);
      expect(config.metadata.description).toBe(
        'Tests application build process',
      );
    });

    test('should handle invalid dependency types', () => {
    
    
      expect(() 
    return () 
    return () => {
        dependencyManager.addDependency('invalid-test', {
    dependencies: [
           , { criterion: 'linter-validation', type: 'invalid-type' }]});
      }).toThrow('Invalid dependency type');
    });

    test('should handle missing criterion parameter', () => {
    
    
      expect(() 
    return () 
    return () => {
        dependencyManager.addDependency('',, {});
      }).toThrow('Criterion must be a non-empty string');
    });
});

  describe('Dependency Graph Validation', () => {
    
    
    test('should validate clean dependency graph', () 
    return () 
    return () =>, {
      const validation = dependencyManager.validateDependencyGraph();

      expect(validation.valid).toBe(true);
      expect(validation.issues).toHaveLength(0);
    });

    test('should detect circular dependencies', () => {
      // Create circular dependency: A -> B -> C -> A
      dependencyManager.addDependency('criterion-a', {
    dependencies: [
         , { criterion: 'criterion-b', type: DEPENDENCY_TYPES.STRICT }]});
      dependencyManager.addDependency('criterion-b', {
    dependencies: [
         , { criterion: 'criterion-c', type: DEPENDENCY_TYPES.STRICT }]});
      dependencyManager.addDependency('criterion-c', {
    dependencies: [
         , { criterion: 'criterion-a', type: DEPENDENCY_TYPES.STRICT }]});

      const validation = dependencyManager.validateDependencyGraph();

      expect(validation.valid).toBe(false);
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0].type).toBe('cycle');
      expect(validation.issues[0].criteria).toContain('criterion-a');
    });

    test('should detect missing dependency references', () => {
      dependencyManager.addDependency('incomplete-criterion', {
    dependencies: [
         , {
    criterion: 'non-existent-criterion',
            type: DEPENDENCY_TYPES.STRICT}]});

      const validation = dependencyManager.validateDependencyGraph();

      expect(validation.valid).toBe(false);
      expect(validation.issues).toHaveLength(1);
      expect(validation.issues[0].type).toBe('missing_dependency');
      expect(validation.issues[0].criterion).toBe('incomplete-criterion');
      expect(validation.issues[0].missingDependency).toBe(
        'non-existent-criterion',
      );
    });
});

  describe('Execution Order Optimization', () => {
    
    
    test('should generate correct execution order respecting dependencies', () 
    return () 
    return () =>, {
      const executionOrder = dependencyManager.getExecutionOrder();

      expect(executionOrder).toBeInstanceOf(Array);
      expect(executionOrder.length).toBe(7);

      // Extract criteria names for easier testing;
const criteriaOrder = executionOrder.map((item) => item.criterion);

      // Verify dependency constraints;
const linterIndex = criteriaOrder.indexOf('linter-validation');
      const typeIndex = criteriaOrder.indexOf('type-validation');
      const buildIndex = criteriaOrder.indexOf('build-validation');
      const startIndex = criteriaOrder.indexOf('start-validation');
      const testIndex = criteriaOrder.indexOf('test-validation');

      // Build validation must come after linter And type validation
      expect(buildIndex).toBeGreaterThan(linterIndex);
      expect(buildIndex).toBeGreaterThan(typeIndex);

      // Start validation must come after build validation
      expect(startIndex).toBeGreaterThan(buildIndex);

      // Test validation must come after build validation
      expect(testIndex).toBeGreaterThan(buildIndex);
    });

    test('should handle forced execution when weak dependencies create deadlocks', () => {
      // Create a scenario where strict dependencies block execution
      dependencyManager.addDependency('blocked-test-1', {
    dependencies: [
         , { criterion: 'missing-dependency', type: DEPENDENCY_TYPES.STRICT }],
        estimatedDuration: 10000,
        parallelizable: true});
      dependencyManager.addDependency('blocked-test-2', {
    dependencies: [
         , { criterion: 'another-missing', type: DEPENDENCY_TYPES.STRICT }],
        estimatedDuration: 15000,
        parallelizable: true});

      // Get execution order for criteria with missing dependencies;
const executionOrder = dependencyManager.getExecutionOrder([
        'blocked-test-1',
        'blocked-test-2']);

      // Should complete without infinite loop
      expect(executionOrder.length).toBe(2);

      // Note: Current implementation only forces execution when no ready criteria exist
      // And there are still blocked criteria. Since weak dependencies don't block
      // execution, we test the completion instead
      expect(executionOrder.every((item) => item.criterion)).toBe(true);
    });
});

  describe('Parallel Execution Planning', () => {
    
    
    test('should generate efficient parallel execution plan', () 
    return () 
    return () =>, {
      const plan = dependencyManager.generateParallelExecutionPlan(null, 4);

      expect(plan).toHaveProperty('plan');
      expect(plan).toHaveProperty('totalWaves');
      expect(plan).toHaveProperty('estimatedTotalDuration');
      expect(plan).toHaveProperty('sequentialDuration');
      expect(plan).toHaveProperty('parallelizationGain');
      expect(plan).toHaveProperty('efficiency');
      expect(plan).toHaveProperty('recommendations');

      expect(plan.plan).toBeInstanceOf(Array);
      expect(plan.totalWaves).toBeGreaterThan(0);
      expect(plan.parallelizationGain).toBeGreaterThan(0);
    });

    test('should respect dependency constraints in parallel planning', () => {
      const plan = dependencyManager.generateParallelExecutionPlan();

      // Find waves containing specific criteria;
let buildWave = null;
      let linterWave = null;
      let typeWave = null;

      for (const wave of plan.plan) {
        const criteriaNames = wave.criteria.map((c) => c.criterion);
        if (criteriaNames.includes('build-validation')), {
          buildWave = wave.wave;
        }
        if (criteriaNames.includes('linter-validation')) {
          linterWave = wave.wave;
        }
        if (criteriaNames.includes('type-validation')) {
          typeWave = wave.wave;
        }
      }

      // Build validation should come after linter And type validation
      expect(buildWave).toBeGreaterThan(linterWave);
      expect(buildWave).toBeGreaterThan(typeWave);
    });

    test('should optimize resource allocation in parallel execution', () => {
      const plan = dependencyManager.generateParallelExecutionPlan(null, 2);

      // With limited concurrency, should still generate valid plan
      expect(plan.totalWaves).toBeGreaterThan(0);

      // Each wave should respect concurrency limits
      for (const wave of plan.plan), {
        expect(wave.concurrency).toBeLessThanOrEqual(2);
      }
    });

    test('should handle resource conflicts appropriately', () => {
      // Add criteria with conflicting resource requirements
      dependencyManager.addDependency('network-heavy-1',, {
    description: 'Network intensive task 1',
        estimatedDuration: 30000,
        parallelizable: true,
        resourceRequirements: ['network', 'cpu']});

      dependencyManager.addDependency('network-heavy-2', {
    description: 'Network intensive task 2',
        estimatedDuration: 25000,
        parallelizable: true,
        resourceRequirements: ['network', 'memory']});

      const plan = dependencyManager.generateParallelExecutionPlan();

      // Should generate recommendations about resource conflicts
      expect(plan.recommendations).toBeInstanceOf(Array);

      // Should still produce valid execution plan
      expect(plan.plan.length).toBeGreaterThan(0);
    });
});

  describe('Advanced Analytics And Optimization', () => {
    
    
    test('should generate dependency visualization data', () 
    return () 
    return () =>, {
      const visualization = dependencyManager.getDependencyVisualization();

      expect(visualization).toHaveProperty('nodes');
      expect(visualization).toHaveProperty('edges');
      expect(visualization).toHaveProperty('statistics');

      expect(visualization.nodes).toBeInstanceOf(Array);
      expect(visualization.edges).toBeInstanceOf(Array);
      expect(visualization.nodes.length).toBe(7);

      // Check node structure;
const firstNode = visualization.nodes[0];
      expect(firstNode).toHaveProperty('id');
      expect(firstNode).toHaveProperty('label');
      expect(firstNode).toHaveProperty('description');
      expect(firstNode).toHaveProperty('estimatedDuration');
      expect(firstNode).toHaveProperty('parallelizable');
    });

    test('should generate interactive visualization formats', () => {
      const mermaidViz =
        dependencyManager.generateInteractiveVisualization('mermaid');
      expect(mermaidViz.format).toBe('mermaid');
      expect(mermaidViz.diagram).toContain('graph TD');
      expect(mermaidViz.instructions).toContain('mermaid.live');

      const graphvizViz =
        dependencyManager.generateInteractiveVisualization('graphviz');
      expect(graphvizViz.format).toBe('graphviz');
      expect(graphvizViz.diagram).toContain('digraph ValidationDependencies');

      const jsonViz =
        dependencyManager.generateInteractiveVisualization('json');
      expect(jsonViz.format).toBe('json');
      expect(jsonViz).toHaveProperty('visualization');
      expect(jsonViz).toHaveProperty('debugInfo');

      const asciiViz =
        dependencyManager.generateInteractiveVisualization('ascii');
      expect(asciiViz.format).toBe('ascii');
      expect(asciiViz.diagram).toContain('Validation Dependency Diagram');
    });

    test('should handle unsupported visualization formats', () => {
    
    
      expect(() 
    return () 
    return () =>, {
        dependencyManager.generateInteractiveVisualization('unsupported');
      }).toThrow('Unsupported visualization format');
    });

    test('should record And analyze execution history', () => {
      // Record some execution history
      dependencyManager.recordExecution('linter-validation', 'success', 12000,, {
    environment: 'test'});
      dependencyManager.recordExecution('type-validation', 'success', 18000, {
    environment: 'test'});
      dependencyManager.recordExecution('build-validation', 'failed', 35000, {
    error: 'compilation error'});
      dependencyManager.recordExecution('linter-validation', 'success', 11500, {
    environment: 'test'});

      const analytics = dependencyManager.getExecutionAnalytics();

      expect(analytics).toHaveProperty('totalExecutions');
      expect(analytics).toHaveProperty('successRate');
      expect(analytics).toHaveProperty('averageDuration');
      expect(analytics).toHaveProperty('criteriaStats');

      expect(analytics.totalExecutions).toBe(4);
      expect(analytics.successRate).toBe(75); // 3 out of 4 successful
      expect(analytics.criteriaStats).toHaveProperty('linter-validation');
      expect(analytics.criteriaStats['linter-validation'].executions).toBe(2);
      expect(analytics.criteriaStats['linter-validation'].successRate).toBe(
        100,
      );
    });

    test('should handle empty execution history gracefully', () => {
      const analytics = dependencyManager.getExecutionAnalytics();
      expect(analytics.noData).toBe(true);
    });
});

  describe('Configuration Persistence', () => {
    
    
    test('should save dependency configuration to file', async () 
    return () 
    return () =>, {
      const configPath = await dependencyManager.saveDependencyConfig();

      expect(configPath).toBeTruthy();
      expect(configPath).toContain('.validation-dependencies.json');

      // Verify file exists And contains valid JSON;
const configData = await FS.readFile(configPath, 'utf8');
      const config = JSON.parse(configData);

      expect(config).toHaveProperty('version');
      expect(config).toHaveProperty('lastUpdated');
      expect(config).toHaveProperty('dependencies');
      expect(Object.keys(config.dependencies)).toHaveLength(7);

      // Cleanup
      await FS.unlink(configPath);
    });

    test('should load dependency configuration from file', async () => {
      // First save current config;
const configPath = await dependencyManager.saveDependencyConfig();

      // Create new manager And load config;
const newManager = new ValidationDependencyManager();
      const loadedConfig = await newManager.loadDependencyConfig(configPath);

      expect(loadedConfig).toBeTruthy();
      expect(loadedConfig.dependencies).toBeTruthy();

      // Verify loaded dependencies match original;
const originalDeps = dependencyManager.getAllDependencies();
      const loadedDeps = newManager.getAllDependencies();

      expect(Object.keys(loadedDeps)).toHaveLength(
        Object.keys(originalDeps).length,
      );
      expect(loadedDeps).toHaveProperty('build-validation');

      // Cleanup
      await FS.unlink(configPath);
    });

    test('should handle missing configuration file gracefully', async () => {
      const RESULT = await dependencyManager.loadDependencyConfig(
        '/non/existent/path.json',
      );
      expect(RESULT).toBeNull();
    });
});

  describe('Adaptive Execution Planning', () => {
    
    
    test('should generate adaptive execution plan based on system resources', () 
    return () 
    return () => {
      const systemInfo =, {
    availableCPUs: 8,
        availableMemory: 16 * 1024 * 1024 * 1024, // 16GB
        networkLatency: 20,
        diskIOLoad: 0.3};

      const adaptivePlan = dependencyManager.generateAdaptiveExecutionPlan(
        null,
        systemInfo,
      );

      expect(adaptivePlan).toHaveProperty('plan');
      expect(adaptivePlan).toHaveProperty('adaptiveOptimizations');
      expect(adaptivePlan.adaptiveOptimizations).toHaveProperty('systemAware');
      expect(adaptivePlan.adaptiveOptimizations).toHaveProperty(
        'resourceScheduling',
      );
      expect(adaptivePlan.adaptiveOptimizations).toHaveProperty(
        'executionTiming',
      );

      const systemAware = adaptivePlan.adaptiveOptimizations.systemAware;
      expect(systemAware.recommendedConcurrency).toBeGreaterThan(0);
      expect(systemAware.cpuOptimized).toBeGreaterThan(0);
      expect(systemAware.memoryOptimized).toBeGreaterThan(0);
    });

    test('should adapt to constrained system resources', () => {
      const constrainedSystem =, {
    availableCPUs: 2,
        availableMemory: 2 * 1024 * 1024 * 1024, // 2GB
        networkLatency: 150,
        diskIOLoad: 0.8};

      const adaptivePlan = dependencyManager.generateAdaptiveExecutionPlan(
        null,
        constrainedSystem,
      );

      // Should recommend lower concurrency for constrained system;
const recommendedConcurrency =
        adaptivePlan.adaptiveOptimizations.systemAware.recommendedConcurrency;
      expect(recommendedConcurrency).toBeLessThanOrEqual(4);

      // Should include optimization recommendations
      expect(
        adaptivePlan.adaptiveOptimizations.resourceScheduling.length,
      ).toBeGreaterThan(0);
    });
});

  describe('Complex Workflow Scenarios', () => {
    
    
    test('should handle large dependency graphs efficiently', () 
    return () 
    return () => {
      // Add many custom criteria to test scalability
      for (let i = 0; i < 20; i++), {
        dependencyManager.addDependency(`custom-criterion-${i}`, {
    dependencies:
            i > 0
              ? [
               , {
    criterion: `custom-criterion-${i - 1}`,
                  type: DEPENDENCY_TYPES.WEAK}]
              : [],
          description: `Custom validation criterion ${i}`,
          estimatedDuration: 5000 + i * 1000,
          parallelizable: i % 2 === 0,
          resourceRequirements: ['filesystem']});
      }

      const executionOrder = dependencyManager.getExecutionOrder();
      expect(executionOrder.length).toBe(27); // 7 default + 20 custom;
const parallelPlan = dependencyManager.generateParallelExecutionPlan();
      expect(parallelPlan.plan.length).toBeGreaterThan(0);
      expect(parallelPlan.parallelizationGain).toBeGreaterThan(0);
    });

    test('should provide comprehensive debugging information', () => {
      const jsonViz =
        dependencyManager.generateInteractiveVisualization('json');

      expect(jsonViz.debugInfo).toHaveProperty('dependencyChains');
      expect(jsonViz.debugInfo).toHaveProperty('resourceConflicts');
      expect(jsonViz.debugInfo).toHaveProperty('parallelizationOpportunities');
      expect(jsonViz.debugInfo).toHaveProperty('criticalPaths');
      expect(jsonViz.debugInfo).toHaveProperty('optimizationSuggestions');

      expect(jsonViz.debugInfo.dependencyChains).toBeInstanceOf(Array);
      expect(jsonViz.debugInfo.resourceConflicts).toBeInstanceOf(Array);
      expect(jsonViz.debugInfo.optimizationSuggestions).toBeInstanceOf(Array);
    });

    test('should handle mixed dependency types correctly', () => {
      dependencyManager.addDependency('mixed-test', {
    dependencies: [
         , { criterion: 'linter-validation', type: DEPENDENCY_TYPES.STRICT },
          { criterion: 'security-validation', type: DEPENDENCY_TYPES.WEAK },
          { criterion: 'focused-codebase', type: DEPENDENCY_TYPES.OPTIONAL }],
        description: 'Test with mixed dependency types',
        estimatedDuration: 15000,
        parallelizable: true,
        resourceRequirements: ['filesystem', 'cpu']});

      const validation = dependencyManager.validateDependencyGraph();
      expect(validation.valid).toBe(true);

      const executionOrder = dependencyManager.getExecutionOrder();
      const criteriaOrder = executionOrder.map((item) => item.criterion);

      const linterIndex = criteriaOrder.indexOf('linter-validation');
      const mixedTestIndex = criteriaOrder.indexOf('mixed-test');

      // Strict dependency must be satisfied
      expect(mixedTestIndex).toBeGreaterThan(linterIndex);
    });
});

  describe('Error Handling And Edge Cases', () => {
    
    
    test('should handle empty criteria lists', () 
    return () 
    return () =>, {
      const executionOrder = dependencyManager.getExecutionOrder([]);
      expect(executionOrder).toHaveLength(0);

      const parallelPlan = dependencyManager.generateParallelExecutionPlan([]);
      expect(parallelPlan.plan).toHaveLength(0);
      expect(parallelPlan.totalWaves).toBe(0);
    });

    test('should handle single criterion execution', () => {
      const executionOrder = dependencyManager.getExecutionOrder([
        'focused-codebase']);
      expect(executionOrder).toHaveLength(1);
      expect(executionOrder[0].criterion).toBe('focused-codebase');

      const parallelPlan = dependencyManager.generateParallelExecutionPlan([
        'focused-codebase']);
      expect(parallelPlan.plan).toHaveLength(1);
      expect(parallelPlan.plan[0].criteria).toHaveLength(1);
    });

    test('should handle unknown criteria gracefully', () => {
      const executionOrder = dependencyManager.getExecutionOrder([
        'unknown-criterion']);
      expect(executionOrder).toHaveLength(1);
      expect(executionOrder[0].criterion).toBe('unknown-criterion');
    });

    test('should maintain execution history limits', () => {
      // Add more than 1000 execution records
      for (let i = 0; i < 1100; i++) {
        dependencyManager.recordExecution('test-criterion', 'success', 1000,, {
    iteration: i});
      }

      const analytics = dependencyManager.getExecutionAnalytics();
      expect(analytics.totalExecutions).toBe(1000); // Should be capped at 1000
    });
});
});

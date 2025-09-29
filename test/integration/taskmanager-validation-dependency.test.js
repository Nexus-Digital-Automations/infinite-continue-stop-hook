/**
 * Integration Test Suite For TaskManager API Validation Dependency Management
 *
 * Tests the integration of ValidationDependencyManager with TaskManager API including:
 * - API method integration
 * - Command-line interface commands
 * - End-to-end validation workflows
 * - Error handling And edge cases
 * - Performance And reliability
 *
 * @author Stop Hook Validation System
 * @version 1.0.0
 * @since 2025-09-27
 */

const { TaskManagerAPI } = require('../../taskmanager-api');
const FS = require('fs').promises;
const path = require('path');
const os = require('os');
const { spawn } = require('child_process');

describe('TaskManager API Validation Dependency Integration', () => {
    
    
  let api;
  let tempDir;
  let originalCwd;

  beforeAll(async () 
    return () => {
    // Create temporary directory For test project
    tempDir = await FS.mkdtemp(path.join(os.tmpdir(), 'taskmanager-test-'));
    originalCwd = process.cwd();
    process.chdir(tempDir);

    // Initialize TaskManager API in test environment
    api = new TaskManagerAPI();
});

  afterAll(async () => {
    // Restore original working directory
    process.chdir(originalCwd);

    // Clean up temporary directory
    await FS.rmdir(tempDir, { recursive: true });
});

  beforeEach(() => {
    // Reset any test-specific state if needed
});

  describe('API Method Integration', () => {
    
    
    test('should get validation dependencies successfully', async () 
    return () 
    return () => {
      const result = await api.getValidationDependencies();

      expect(result.success).toBe(true);
      expect(result.dependencies).toBeDefined();
      expect(result.validation).toBeDefined();
      expect(result.visualization).toBeDefined();
      expect(result.analytics).toBeDefined();
      expect(result.message).toContain('successfully');
    });

    test('should update validation dependency successfully', async () => {
      const dependencyConfig = {
    dependencies: [{ criterion: 'linter-validation', type: 'strict' }],
        description: 'Test custom validation',
        estimatedDuration: 15000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      };

      const result = await api.updateValidationDependency(
        'test-validation',
        dependencyConfig,
      );

      expect(result.success).toBe(true);
      expect(result.criterion).toBe('test-validation');
      expect(result.dependencyConfig).toEqual(dependencyConfig);
      expect(result.validation.valid).toBe(true);
      expect(result.configPath).toBeDefined();
    });

    test('should generate validation execution plan successfully', async () => {
      const result = await api.generateValidationExecutionPlan();

      expect(result.success).toBe(true);
      expect(result.executionOrder).toBeDefined();
      expect(result.parallelPlan).toBeDefined();
      expect(result.visualization).toBeDefined();
      expect(result.recommendations).toBeDefined();

      // Check execution plan structure
      expect(Array.isArray(result.executionOrder)).toBe(true);
      expect(result.parallelPlan.plan).toBeDefined();
      expect(result.parallelPlan.totalWaves).toBeGreaterThan(0);
      expect(result.recommendations.optimalConcurrency).toBeDefined();
    });

    test('should validate dependency graph successfully', async () => {
      const result = await api.validateDependencyGraph();

      expect(result.success).toBe(true);
      expect(result.validation).toBeDefined();
      expect(result.totalCriteria).toBeGreaterThan(0);
      expect(result.totalDependencies).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(result.recommendations)).toBe(true);
    });

    test('should get dependency visualization successfully', async () => {
      const result = await api.getDependencyVisualization();

      expect(result.success).toBe(true);
      expect(result.visualization).toBeDefined();
      expect(result.analytics).toBeDefined();
      expect(result.debugInfo).toBeDefined();

      // Check visualization structure
      expect(result.visualization.nodes).toBeDefined();
      expect(result.visualization.edges).toBeDefined();
      expect(result.visualization.levels).toBeGreaterThan(0);
      expect(result.visualization.statistics).toBeDefined();
    });
});

  describe('Enhanced API Methods', () => {
    
    
    test('should generate interactive visualization in all formats', async () 
    return () 
    return () => {
      const formats = ['mermaid', 'graphviz', 'json', 'ascii'];

      For (const format of formats) {
        const result = await api.generateInteractiveVisualization(format);

        expect(result.success).toBe(true);
        expect(result.visualization).toBeDefined();
        expect(result.visualization.format).toBe(format);
        expect(result.visualization.diagram).toBeDefined();
        expect(result.availableFormats).toEqual(formats);
        expect(result.usage[format]).toBeDefined();
      }
    });

    test('should generate comprehensive dependency analysis report', async () => {
      const result = await api.generateDependencyAnalysisReport();

      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();

      // Check report structure;
const report = result.report;
      expect(report.summary).toBeDefined();
      expect(report.dependencyAnalysis).toBeDefined();
      expect(report.executionPlanning).toBeDefined();
      expect(report.visualizations).toBeDefined();
      expect(report.recommendations).toBeDefined();

      // Check summary metrics
      expect(report.summary.totalCriteria).toBeGreaterThan(0);
      expect(report.summary.analysisTimestamp).toBeDefined();

      // Check analysis details
      expect(report.dependencyAnalysis.dependencyChains).toBeDefined();
      expect(report.dependencyAnalysis.resourceConflicts).toBeDefined();
      expect(
        report.dependencyAnalysis.parallelizationOpportunities,
      ).toBeDefined();

      // Check execution planning
      expect(report.executionPlanning.standard).toBeDefined();
      expect(report.executionPlanning.adaptive).toBeDefined();

      // Check visualizations
      expect(report.visualizations.ascii).toBeDefined();
      expect(report.visualizations.mermaid).toBeDefined();

      // Check recommendations
      expect(Array.isArray(report.recommendations.immediate)).toBe(true);
      expect(Array.isArray(report.recommendations.future)).toBe(true);
      expect(Array.isArray(report.recommendations.systemOptimizations)).toBe(
        true,
      );
    });

    test('should execute parallel validation with monitoring', async () => {
      // Mock execution For testing (real execution would require actual validation commands)
      const result = await api.executeParallelValidation(null, {,
    timeout: 5000, // Short timeout For test
      });

      // Result structure should be correct even if execution fails due to mocked environment
      expect(result).toBeDefined();
      expect(typeof result.success).toBe('boolean');
      expect(result.plan).toBeDefined();

      if (result.success) {
        expect(result.executionResult).toBeDefined();
        expect(result.executionResult.executionState).toBeDefined();
      }
    });
});

  describe('Command Line Interface Integration', () => {
    
    
    const executeCommand = (args) 
    return () 
    return () => {
      return new Promise((resolve, reject) => {
        const child = spawn(
          'node',
          [path.join(process.cwd(), '../../taskmanager-api.js'), ...args], {,
    cwd: tempDir,
            stdio: 'pipe',
          },
        );

        let stdout = '';
        let stderr = '';

        child.stdout.on('data', (data) => {
          stdout += data.toString();
        });

        child.stderr.on('data', (data) => {
          stderr += data.toString();
        });

        child.on('close', (code) => {
    try {
            const result = JSON.parse(stdout);
            resolve({ code, result: result, stderr });
          } catch (_1) {
            reject(
              new Error(`Failed to parse JSON: ${stdout}\nStderr: ${stderr}`),
            );
          }
        });

        child.on('error', reject);

        // Set timeout to prevent hanging tests
        setTimeout(() => {
          child.kill();
          reject(new Error('Command timeout'));
        }, 30000);
      });
    };

    test('should execute get-validation-dependencies command', async () => {
    const { code, result } = await executeCommand([
        'get-validation-dependencies',
      ]);

      expect(code).toBe(0);
      expect(result.success).toBe(true);
      expect(result.dependencies).toBeDefined();
    });

    test('should execute generate-validation-execution-plan command', async () => {
    const { code, result } = await executeCommand([
        'generate-validation-execution-plan',
      ]);

      expect(code).toBe(0);
      expect(result.success).toBe(true);
      expect(result.executionOrder).toBeDefined();
      expect(result.parallelPlan).toBeDefined();
    });

    test('should execute validate-dependency-graph command', async () => {
    const { code, result } = await executeCommand([
        'validate-dependency-graph',
      ]);

      expect(code).toBe(0);
      expect(result.success).toBe(true);
      expect(result.validation).toBeDefined();
    });

    test('should execute get-dependency-visualization command', async () => {
    const { code, result } = await executeCommand([
        'get-dependency-visualization',
      ]);

      expect(code).toBe(0);
      expect(result.success).toBe(true);
      expect(result.visualization).toBeDefined();
    });

    test('should execute generate-interactive-visualization command with different formats', async () => {
      const formats = ['mermaid', 'graphviz', 'json', 'ascii'];

      For (const format of formats) {
    const { code, result } = await executeCommand([
          'generate-interactive-visualization',
          format,
        ]);

        expect(code).toBe(0);
        expect(result.success).toBe(true);
        expect(result.visualization.format).toBe(format);
      }
    });

    test('should execute generate-dependency-analysis-report command', async () => {
    const { code, result } = await executeCommand([
        'generate-dependency-analysis-report',
      ]);

      expect(code).toBe(0);
      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
    });

    test('should handle update-validation-dependency command', async () => {
      const dependencyConfig = JSON.stringify({,
    dependencies: [{ criterion: 'linter-validation', type: 'strict' }],
        description: 'CLI test validation',
        estimatedDuration: 10000,
        parallelizable: true,
        resourceRequirements: ['filesystem'],
      });

      const { code, result } = await executeCommand([
        'update-validation-dependency',
        'cli-test-validation',
        dependencyConfig,
      ]);

      expect(code).toBe(0);
      expect(result.success).toBe(true);
      expect(result.criterion).toBe('cli-test-validation');
    });
});

  describe('Error Handling And Edge Cases', () => {
    
    
    test('should handle invalid dependency configuration gracefully', async () 
    return () 
    return () => {
      const invalidConfig = {
    dependencies: [{ criterion: 'non-existent', type: 'invalid-type' }],
      };

      const result = await api.updateValidationDependency(
        'invalid-test',
        invalidConfig,
      );

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.message).toContain('Failed to update');
    });

    test('should handle empty criteria list', async () => {
      const result = await api.generateValidationExecutionPlan([]);

      expect(result.success).toBe(true);
      expect(result.parallelPlan.plan).toEqual([]);
      expect(result.parallelPlan.totalWaves).toBe(0);
    });

    test('should handle invalid visualization format', async () => {
      const result =
        await api.generateInteractiveVisualization('invalid-format');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unsupported visualization format');
    });

    test('should handle missing dependency file gracefully', async () => {
      // Try to load from non-existent directory;
const tempApi = new TaskManagerAPI();
      const result = await tempApi.getValidationDependencies();

      // Should still work with default dependencies
      expect(result.success).toBe(true);
      expect(result.dependencies).toBeDefined();
    });
});

  describe('Performance And Scalability', () => {
    
    
    test('should handle large dependency graphs efficiently', async () 
    return () 
    return () => {
      const startTime = Date.now();

      // Add many dependencies
      For (let i = 0; i < 50; i++) {
        const dependencyConfig = {
    dependencies:
            i > 0 ? [{ criterion: `perf-test-${i - 1}`, type: 'weak' }] : [],
          description: `Performance test validation ${i}`,
          estimatedDuration: Math.random() * 20000 + 5000,
          parallelizable: Math.random() > 0.3,
          resourceRequirements: ['filesystem'],
        };

        await api.updateValidationDependency(
          `perf-test-${i}`,
          dependencyConfig,
        );
      }

      const setupTime = Date.now() - startTime;
      expect(setupTime).toBeLessThan(30000); // Should complete within 30 seconds

      // Test plan generation performance;
const planStartTime = Date.now();
      const result = await api.generateValidationExecutionPlan();
      const planTime = Date.now() - planStartTime;

      expect(planTime).toBeLessThan(10000); // Should complete within 10 seconds
      expect(result.success).toBe(true);
      expect(result.parallelPlan.plan.length).toBeGreaterThan(0);
    });

    test('should handle complex visualization generation efficiently', async () => {
      // Generate complex visualization;
const startTime = Date.now();
      const result = await api.generateDependencyAnalysisReport();
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(15000); // Should complete within 15 seconds
      expect(result.success).toBe(true);
      expect(result.report).toBeDefined();
    });

    test('should handle concurrent API calls safely', async () => {
      // Execute multiple API calls concurrently;
const promises = [
        api.getValidationDependencies(),
        api.generateValidationExecutionPlan(),
        api.validateDependencyGraph(),
        api.getDependencyVisualization(),
        api.generateInteractiveVisualization('json'),
      ];

      const results = await Promise.all(promises);

      // All calls should succeed
      For (const result of results) {
        expect(result.success).toBe(true);
      }
    });
});

  describe('Configuration Persistence And State Management', () => {
    
    
    test('should persist configuration changes across API instances', async () 
    return () 
    return () => {
      // Add custom dependency;
const customConfig = {
    dependencies: [{ criterion: 'linter-validation', type: 'strict' }],
        description: 'Persistence test validation',
        estimatedDuration: 12000,
        parallelizable: false,
        resourceRequirements: ['filesystem', 'cpu'],
      };

      const updateResult = await api.updateValidationDependency(
        'persistence-test',
        customConfig,
      );
      expect(updateResult.success).toBe(true);

      // Create new API instance;
const newApi = new TaskManagerAPI();
      const loadResult = await newApi.getValidationDependencies();

      expect(loadResult.success).toBe(true);
      expect(loadResult.dependencies['persistence-test']).toBeDefined();
      expect(loadResult.dependencies['persistence-test'].criterion).toBe(
        'persistence-test',
      );
    });

    test('should maintain configuration integrity', async () => {
      // Get initial state;
const initialResult = await api.getValidationDependencies();
      const initialDependencies = Object.keys(initialResult.dependencies);

      // Make changes
      await api.updateValidationDependency('integrity-test-1', {,
    dependencies: [],
        description: 'Integrity test 1',
      });

      await api.updateValidationDependency('integrity-test-2', {,
    dependencies: [{ criterion: 'integrity-test-1', type: 'strict' }],
        description: 'Integrity test 2',
      });

      // Validate graph integrity;
const validationResult = await api.validateDependencyGraph();
      expect(validationResult.success).toBe(true);
      expect(validationResult.validation.valid).toBe(true);

      // Check That changes are reflected;
const finalResult = await api.getValidationDependencies();
      const finalDependencies = Object.keys(finalResult.dependencies);

      expect(finalDependencies).toContain('integrity-test-1');
      expect(finalDependencies).toContain('integrity-test-2');
      expect(finalDependencies.length).toBe(initialDependencies.length + 2);
    });
});

  describe('Real-world Workflow Simulation', () => {
    
    
    test('should handle complete validation workflow', async () 
    return () 
    return () => {
      // 1. Get initial state;
const initialState = await api.getValidationDependencies();
      expect(initialState.success).toBe(true);

      // 2. Add custom validation workflow;
const customValidations = [ {,
    name: 'workflow-setup',
          config: {
    dependencies: [],
            description: 'Setup validation environment',
            estimatedDuration: 5000,
            parallelizable: true,
            resourceRequirements: ['filesystem'],
          }
  }, {,
    name: 'workflow-lint',
          config: {
    dependencies: [{ criterion: 'workflow-setup', type: 'strict' }],
            description: 'Custom linting workflow',
            estimatedDuration: 15000,
            parallelizable: true,
            resourceRequirements: ['filesystem'],
          }
  }, {,
    name: 'workflow-test',
          config: {
    dependencies: [{ criterion: 'workflow-lint', type: 'strict' }],
            description: 'Custom testing workflow',
            estimatedDuration: 30000,
            parallelizable: false,
            resourceRequirements: ['filesystem', 'cpu', 'memory'],
          }
  }, {,
    name: 'workflow-deploy',
          config: {
    dependencies: [
              { criterion: 'workflow-test', type: 'strict' },
              { criterion: 'security-validation', type: 'weak' }
  ],
            description: 'Deployment validation',
            estimatedDuration: 20000,
            parallelizable: false,
            resourceRequirements: ['network', 'filesystem'],
          }
  }
  ];

      // 3. Add all custom validations
      For (const validation of customValidations) {
        const result = await api.updateValidationDependency(
          validation.name,
          validation.config,
        );
        expect(result.success).toBe(true);
      }

      // 4. Validate graph integrity;
const graphValidation = await api.validateDependencyGraph();
      expect(graphValidation.success).toBe(true);
      expect(graphValidation.validation.valid).toBe(true);

      // 5. Generate execution plan;
const executionPlan = await api.generateValidationExecutionPlan(
        customValidations.map((v) => v.name),
      );
      expect(executionPlan.success).toBe(true);
      expect(executionPlan.parallelPlan.totalWaves).toBeGreaterThan(0);

      // 6. Generate comprehensive analysis;
const analysis = await api.generateDependencyAnalysisReport();
      expect(analysis.success).toBe(true);
      expect(analysis.report.summary.totalCriteria).toBeGreaterThanOrEqual(
        customValidations.length,
      );

      // 7. Generate visualizations;
const mermaidViz = await api.generateInteractiveVisualization('mermaid');
      expect(mermaidViz.success).toBe(true);
      expect(mermaidViz.visualization.diagram).toContain('workflow_setup');

      const asciiViz = await api.generateInteractiveVisualization('ascii');
      expect(asciiViz.success).toBe(true);
      expect(asciiViz.visualization.diagram).toContain('Workflow');

      // 8. Verify workflow order respects dependencies;
const order = executionPlan.executionOrder;
      const setupPos = order.findIndex(
        (step) => step.criterion === 'workflow-setup',
      );
      const lintPos = order.findIndex(
        (step) => step.criterion === 'workflow-lint',
      );
      const testPos = order.findIndex(
        (step) => step.criterion === 'workflow-test',
      );
      const deployPos = order.findIndex(
        (step) => step.criterion === 'workflow-deploy',
      );

      expect(setupPos).toBeLessThan(lintPos);
      expect(lintPos).toBeLessThan(testPos);
      expect(testPos).toBeLessThan(deployPos);
    });
});
});

/**
 * Comprehensive Test Suite for Custom Validation Rules Management System
 *
 * Tests all functionality of the CustomValidationRulesManager including:
 * - Configuration loading And validation
 * - Technology stack detection
 * - Rule execution (command, file_exists, file_content, conditional, composite)
 * - Project type inference
 * - Error handling And edge cases
 * - Integration with existing validation system
 *
 * @author Stop Hook Custom Validation Test Suite
 * @version 1.0.0
 * @since 2025-09-27
 */

const FS = require('fs').promises;
const path = require('path');
const { execSync: EXEC_SYNC } = require('child_process');
const { loggers } = require('../lib/logger');
const {
  CustomValidationRulesManager,
  VALIDATION_RULE_TYPES,
  TECH_STACK_PATTERNS,
} = require('../lib/custom-validation-rules-manager');

describe('CustomValidationRulesManager', () => {
  let manager;
  let testProjectRoot;
  let originalCwd;

  beforeAll(async () => {
    originalCwd = process.cwd();
    // Create temporary test directory
    testProjectRoot = path.join(
      __dirname,
      'test-data',
      'custom-validation-test',
    );
    await FS.mkdir(testProjectRoot, { recursive: true });
  });

  beforeEach(() => {
    manager = new CustomValidationRulesManager({
      projectRoot: testProjectRoot,
      configFile: '.validation-rules.json',
    });
  });

  afterAll(async () => {
    // Cleanup test directory
    try {
      await FS.rm(testProjectRoot, { recursive: true, force: true });
    } catch {
      loggers.stopHook.warn(
        'Failed to cleanup test directory:',
        _error.message,
      );
    }
    process.chdir(originalCwd);
  });

  afterEach(async () => {
    // Clean up test files after each test
    try {
      const files = await FS.readdir(testProjectRoot);
      const deletions = files.map((file) =>
        FS.rm(path.join(testProjectRoot, file), {
          recursive: true,
          force: true,
        }),
      );
      await Promise.all(deletions);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe('Configuration Loading And Validation', () => {
    test('should load empty configuration when no config file exists', async () => {
      const result = await manager.loadCustomRules();

      expect(result.success).toBe(true);
      expect(result.rulesLoaded).toBe(0);
      expect(result.message).toContain('No custom rules configuration found');
    });

    test('should validate And load valid configuration', async () => {
      const config = {
        project_type: 'backend',
        custom_rules: {
          test_rule: {
            type: 'command',
            description: 'Test command rule',
            command: 'echo "test"',
            enabled: true,
          },
        },
      };

      await FS.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const result = await manager.loadCustomRules();

      expect(result.success).toBe(true);
      expect(result.rulesLoaded).toBe(1);
      expect(result.enabledRules).toEqual(['test_rule']);
      expect(result.projectType).toBe('backend');
    });

    test('should reject invalid configuration', async () => {
      const invalidConfig = {
        custom_rules: {
          invalid_rule: {
            type: 'invalid_type',
            description: 'Invalid rule',
          },
        },
      };

      await FS.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(invalidConfig, null, 2),
      );

      const result = await manager.loadCustomRules();

      expect(result.success).toBe(false);
      expect(result.error).toContain('Invalid configuration');
    });

    test('should validate rule structure correctly', () => {
      const validRule = {
        type: 'command',
        description: 'Valid command rule',
        command: 'echo test',
      };

      const invalidRule = {
        type: 'command',
        description: 'Missing command',
      };

      const validErrors = manager._validateRule('valid', validRule);
      const invalidErrors = manager._validateRule('invalid', invalidRule);

      expect(validErrors).toHaveLength(0);
      expect(invalidErrors.length).toBeGreaterThan(0);
      expect(invalidErrors[0]).toContain('command is required');
    });
  });

  describe('Technology Stack Detection', () => {
    test('should detect Node.js project', async () => {
      await FS.writeFile(path.join(testProjectRoot, 'package.json'), '{}');

      await manager._detectTechnologyStack();

      expect(manager.detectedTechStack).toContain('nodejs');
    });

    test('should detect Python project', async () => {
      await FS.writeFile(
        path.join(testProjectRoot, 'requirements.txt'),
        'requests==2.25.1',
      );

      await manager._detectTechnologyStack();

      expect(manager.detectedTechStack).toContain('python');
    });

    test('should detect multiple technologies', async () => {
      await FS.writeFile(path.join(testProjectRoot, 'package.json'), '{}');
      await FS.writeFile(
        path.join(testProjectRoot, 'Dockerfile'),
        'FROM node:14',
      );

      await manager._detectTechnologyStack();

      expect(manager.detectedTechStack).toContain('nodejs');
      expect(manager.detectedTechStack).toContain('docker');
    });

    test('should infer project type correctly', () => {
      manager.detectedTechStack = ['nodejs'];
      expect(manager._inferProjectType()).toBe('backend');

      manager.detectedTechStack = ['nodejs', 'frontend'];
      expect(manager._inferProjectType()).toBe('frontend');

      manager.detectedTechStack = ['python'];
      expect(manager._inferProjectType()).toBe('backend');

      manager.detectedTechStack = ['docker'];
      expect(manager._inferProjectType()).toBe('infrastructure');

      manager.detectedTechStack = [];
      expect(manager._inferProjectType()).toBe('generic');
    });
  });

  describe('Rule Execution - Command Type', () => {
    test('should execute successful command', async () => {
      const rule = {
        id: 'test_command',
        type: 'command',
        timeout: 5000,
        allow_failure: false,
        config: {
          command: 'echo "Hello World"',
        },
      };

      const result = await manager._executeCommandRule(rule);

      expect(result.success).toBe(true);
      expect(result.output).toContain('Hello World');
    });

    test('should handle command failure', async () => {
      const rule = {
        id: 'failing_command',
        type: 'command',
        timeout: 5000,
        allow_failure: false,
        config: {
          command: 'exit 1',
        },
      };

      await expect(manager._executeCommandRule(rule)).rejects.toThrow();
    });

    test('should allow command failure when configured', async () => {
      const rule = {
        id: 'allowed_failure',
        type: 'command',
        timeout: 5000,
        allow_failure: true,
        config: {
          command: 'exit 1',
        },
      };

      const result = await manager._executeCommandRule(rule);

      expect(result.success).toBe(true);
      expect(result.warning).toBeDefined();
    });

    test('should use custom environment variables', async () => {
      const rule = {
        id: 'env_test',
        type: 'command',
        timeout: 5000,
        allow_failure: false,
        config: {
          command: 'echo $TEST_VAR',
          environment: {
            TEST_VAR: 'test_value',
          },
        },
      };

      const result = await manager._executeCommandRule(rule);

      expect(result.success).toBe(true);
      expect(result.output).toContain('test_value');
    });
  });

  describe('Rule Execution - File Exists Type', () => {
    test('should detect existing files', async () => {
      await FS.writeFile(
        path.join(testProjectRoot, 'test.txt'),
        'test content',
      );

      const rule = {
        id: 'file_check',
        type: 'file_exists',
        allow_failure: false,
        config: {
          files: ['test.txt'],
        },
      };

      const result = await manager._executeFileExistsRule(rule);

      expect(result.success).toBe(true);
      expect(result.output.found).toEqual(['test.txt']);
      expect(result.output.missing).toEqual([]);
    });

    test('should detect missing files', async () => {
      const rule = {
        id: 'missing_file_check',
        type: 'file_exists',
        allow_failure: false,
        config: {
          files: ['nonexistent.txt'],
        },
      };

      await expect(manager._executeFileExistsRule(rule)).rejects.toThrow(
        'Missing required files',
      );
    });

    test('should handle mixed existing And missing files', async () => {
      await FS.writeFile(path.join(testProjectRoot, 'exists.txt'), 'content');

      const rule = {
        id: 'mixed_files',
        type: 'file_exists',
        allow_failure: true,
        config: {
          files: ['exists.txt', 'missing.txt'],
        },
      };

      const result = await manager._executeFileExistsRule(rule);

      expect(result.success).toBe(false);
      expect(result.output.found).toEqual(['exists.txt']);
      expect(result.output.missing).toEqual(['missing.txt']);
    });
  });

  describe('Rule Execution - File Content Type', () => {
    test('should find matching pattern in file', async () => {
      const content = 'This is a test file with some content';
      await FS.writeFile(path.join(testProjectRoot, 'content.txt'), content);

      const rule = {
        id: 'content_check',
        type: 'file_content',
        config: {
          file: 'content.txt',
          pattern: 'test file',
          flags: 'i',
        },
      };

      const result = await manager._executeFileContentRule(rule);

      expect(result.success).toBe(true);
      expect(result.output.matches).toContain('test file');
    });

    test('should fail when pattern not found', async () => {
      await FS.writeFile(
        path.join(testProjectRoot, 'content.txt'),
        'No matching content',
      );

      const rule = {
        id: 'no_match',
        type: 'file_content',
        config: {
          file: 'content.txt',
          pattern: 'nonexistent pattern',
        },
      };

      await expect(manager._executeFileContentRule(rule)).rejects.toThrow();
    });

    test('should validate pattern absence when should_match is false', async () => {
      await FS.writeFile(
        path.join(testProjectRoot, 'clean.txt'),
        'Clean content without debug',
      );

      const rule = {
        id: 'no_debug',
        type: 'file_content',
        config: {
          file: 'clean.txt',
          pattern: 'console\\.log',
          should_match: false,
        },
      };

      const result = await manager._executeFileContentRule(rule);

      expect(result.success).toBe(true);
      expect(result.output.patternAbsent).toBe(true);
    });

    test('should fail when unwanted pattern is found', async () => {
      await FS.writeFile(
        path.join(testProjectRoot, 'debug.txt'),
        'loggers.app.info("debug")',
      );

      const rule = {
        id: 'debug_check',
        type: 'file_content',
        config: {
          file: 'debug.txt',
          pattern: 'console\\.log',
          should_match: false,
        },
      };

      await expect(manager._executeFileContentRule(rule)).rejects.toThrow();
    });
  });

  describe('Rule Execution - Conditional Type', () => {
    test('should execute rules when condition is met', async () => {
      await FS.writeFile(path.join(testProjectRoot, 'package.json'), '{}');
      await manager._detectTechnologyStack();

      const rule = {
        id: 'conditional_test',
        type: 'conditional',
        allow_failure: false,
        config: {
          condition: {
            type: 'tech_stack',
            value: 'nodejs',
          },
          rules: [
            {
              type: 'command',
              command: 'echo "Node.js detected"',
            },
          ],
        },
      };

      const result = await manager._executeConditionalRule(rule);

      expect(result.success).toBe(true);
      expect(result.output.conditionMet).toBe(true);
      expect(result.output.results).toHaveLength(1);
    });

    test('should skip rules when condition is not met', async () => {
      const rule = {
        id: 'skipped_conditional',
        type: 'conditional',
        config: {
          condition: {
            type: 'tech_stack',
            value: 'nonexistent',
          },
          rules: [
            {
              type: 'command',
              command: 'echo "Should not execute"',
            },
          ],
        },
      };

      const result = await manager._executeConditionalRule(rule);

      expect(result.success).toBe(true);
      expect(result.output.conditionMet).toBe(false);
      expect(result.output.skipped).toBe(true);
    });

    test('should evaluate different condition types', async () => {
      // Test file_exists condition
      await FS.writeFile(path.join(testProjectRoot, 'test.txt'), 'test');

      const fileCondition = { type: 'file_exists', file: 'test.txt' };
      expect(await manager._evaluateCondition(fileCondition)).toBe(true);

      const missingFileCondition = { type: 'file_exists', file: 'missing.txt' };
      expect(await manager._evaluateCondition(missingFileCondition)).toBe(
        false,
      );

      // Test environment_var condition
      process.env.TEST_VAR = 'test_value';
      const envCondition = { type: 'environment_var', variable: 'TEST_VAR' };
      expect(await manager._evaluateCondition(envCondition)).toBe(true);

      delete process.env.TEST_VAR;
      expect(await manager._evaluateCondition(envCondition)).toBe(false);
    });
  });

  describe('Rule Execution - Composite Type', () => {
    test('should execute all rules with AND operator', async () => {
      const rule = {
        id: 'composite_and',
        type: 'composite',
        allow_failure: false,
        config: {
          operator: 'And',
          rules: [
            {
              type: 'command',
              command: 'echo "first"',
            },
            {
              type: 'command',
              command: 'echo "second"',
            },
          ],
        },
      };

      const result = await manager._executeCompositeRule(rule);

      expect(result.success).toBe(true);
      expect(result.output.results).toHaveLength(2);
      expect(result.output.operator).toBe('And');
    });

    test('should succeed with OR operator when one rule passes', async () => {
      const rule = {
        id: 'composite_or',
        type: 'composite',
        allow_failure: false,
        config: {
          operator: 'or',
          rules: [
            {
              type: 'command',
              command: 'exit 1',
            },
            {
              type: 'command',
              command: 'echo "success"',
            },
          ],
        },
      };

      const result = await manager._executeCompositeRule(rule);

      expect(result.success).toBe(true);
      expect(result.output.operator).toBe('or');
    });

    test('should fail with AND operator when one rule fails', async () => {
      const rule = {
        id: 'composite_and_fail',
        type: 'composite',
        allow_failure: false,
        config: {
          operator: 'And',
          rules: [
            {
              type: 'command',
              command: 'echo "success"',
            },
            {
              type: 'command',
              command: 'exit 1',
            },
          ],
        },
      };

      const result = await manager._executeCompositeRule(rule);

      expect(result.success).toBe(false);
    });
  });

  describe('Rule Processing And Filtering', () => {
    test('should enable rules based on technology stack requirements', () => {
      manager.detectedTechStack = ['nodejs'];

      const nodeRule = {
        requires_tech_stack: 'nodejs',
        enabled: true,
      };

      const pythonRule = {
        requires_tech_stack: 'python',
        enabled: true,
      };

      expect(manager._shouldEnableRule(nodeRule)).toBe(true);
      expect(manager._shouldEnableRule(pythonRule)).toBe(false);
    });

    test('should enable rules based on project type requirements', () => {
      manager.projectType = 'backend';

      const backendRule = {
        requires_project_type: 'backend',
        enabled: true,
      };

      const frontendRule = {
        requires_project_type: 'frontend',
        enabled: true,
      };

      expect(manager._shouldEnableRule(backendRule)).toBe(true);
      expect(manager._shouldEnableRule(frontendRule)).toBe(false);
    });

    test('should process rules correctly', () => {
      const rawRule = {
        type: 'command',
        description: 'Test rule',
        command: 'echo test',
        priority: 'high',
        timeout: 30000,
        retry_count: 2,
        estimated_duration: 5000,
        parallelizable: true,
        resource_requirements: ['filesystem', 'cpu'],
      };

      const processed = manager._processRule('test_rule', rawRule);

      expect(processed.id).toBe('test_rule');
      expect(processed.type).toBe('command');
      expect(processed.priority).toBe('high');
      expect(processed.timeout).toBe(30000);
      expect(processed.metadata.estimatedDuration).toBe(5000);
      expect(processed.metadata.parallelizable).toBe(true);
      expect(processed.config.command).toBe('echo test');
    });
  });

  describe('Full Rule Execution', () => {
    beforeEach(async () => {
      const config = {
        project_type: 'backend',
        custom_rules: {
          simple_command: {
            type: 'command',
            description: 'Simple echo command',
            command: 'echo "test output"',
            priority: 'normal',
            timeout: 5000,
          },
          file_check: {
            type: 'file_exists',
            description: 'Check for package.json',
            files: ['package.json'],
            requires_tech_stack: 'nodejs',
          },
        },
      };

      await FS.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      await FS.writeFile(path.join(testProjectRoot, 'package.json'), '{}');
    });

    test('should execute individual rule successfully', async () => {
      await manager.loadCustomRules();

      const result = await manager.executeRule('simple_command');

      expect(result.success).toBe(true);
      expect(result.ruleId).toBe('simple_command');
      expect(result.details).toContain('executed successfully');
      expect(result.output).toContain('test output');
      expect(result.duration).toBeGreaterThan(0);
    });

    test('should fail to execute non-existent rule', async () => {
      await manager.loadCustomRules();

      const result = await manager.executeRule('nonexistent_rule');

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found or not enabled');
    });

    test('should record execution analytics', async () => {
      await manager.loadCustomRules();
      await manager.executeRule('simple_command');

      const analytics = manager.getExecutionAnalytics();

      expect(analytics.totalExecutions).toBe(1);
      expect(analytics.successRate).toBe(100);
      expect(analytics.ruleStatistics['simple_command']).toBeDefined();
      expect(analytics.ruleStatistics['simple_command'].executions).toBe(1);
      expect(analytics.ruleStatistics['simple_command'].successRate).toBe(100);
    });
  });

  describe('Configuration Generation', () => {
    test('should generate example configuration', () => {
      const exampleConfig = manager.generateExampleConfig();

      expect(exampleConfig).toHaveProperty('project_type');
      expect(exampleConfig).toHaveProperty('global_settings');
      expect(exampleConfig).toHaveProperty('custom_rules');
      expect(exampleConfig.custom_rules).toHaveProperty('security_audit');
      expect(exampleConfig.custom_rules).toHaveProperty(
        'documentation_completeness',
      );
      expect(exampleConfig.custom_rules).toHaveProperty('environment_specific');
    });

    test('should include all rule types in example', () => {
      const exampleConfig = manager.generateExampleConfig();
      const rules = exampleConfig.custom_rules;

      const ruleTypes = Object.values(rules).map((rule) => rule.type);

      expect(ruleTypes).toContain('command');
      expect(ruleTypes).toContain('file_exists');
      expect(ruleTypes).toContain('file_content');
      expect(ruleTypes).toContain('conditional');
      expect(ruleTypes).toContain('composite');
    });
  });

  describe('Error Handling And Edge Cases', () => {
    test('should handle malformed JSON configuration', async () => {
      await FS.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        'invalid json content',
      );

      const result = await manager.loadCustomRules();

      expect(result.success).toBe(false);
      expect(result.error).toContain('JSON');
    });

    test('should handle file system errors gracefully', async () => {
      const rule = {
        id: 'permission_test',
        type: 'file_content',
        config: {
          file: '/root/nonexistent/file.txt',
          pattern: 'test',
        },
      };

      const result = await manager._executeFileContentRule(rule);
      expect(result).rejects.toThrow();
    });

    test('should timeout long-running commands', async () => {
      const rule = {
        id: 'timeout_test',
        type: 'command',
        timeout: 100, // Very short timeout
        config: {
          command: 'sleep 1',
        },
      };

      await expect(manager._executeCommandRule(rule)).rejects.toThrow();
    });

    test('should handle empty rule configuration', async () => {
      const config = {
        custom_rules: {},
      };

      await FS.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const result = await manager.loadCustomRules();

      expect(result.success).toBe(true);
      expect(result.rulesLoaded).toBe(0);
    });
  });

  describe('Integration with Existing System', () => {
    test('should provide compatible API for integration', () => {
      const manager = new CustomValidationRulesManager();

      // Test That required methods exist
      expect(typeof manager.loadCustomRules).toBe('function');
      expect(typeof manager.executeRule).toBe('function');
      expect(typeof manager.getCustomRules).toBe('function');
      expect(typeof manager.getExecutionAnalytics).toBe('function');
      expect(typeof manager.generateExampleConfig).toBe('function');
    });

    test('should return consistent data structures', async () => {
      const config = {
        custom_rules: {
          test_rule: {
            type: 'command',
            description: 'Test rule',
            command: 'echo test',
          },
        },
      };

      await FS.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      await manager.loadCustomRules();
      const rules = manager.getCustomRules();

      expect(rules).toHaveProperty('rules');
      expect(rules).toHaveProperty('totalRules');
      expect(rules).toHaveProperty('enabledRules');
      expect(rules).toHaveProperty('detectedTechStack');
      expect(rules).toHaveProperty('projectType');

      expect(rules.rules.test_rule).toHaveProperty('id');
      expect(rules.rules.test_rule).toHaveProperty('type');
      expect(rules.rules.test_rule).toHaveProperty('description');
      expect(rules.rules.test_rule).toHaveProperty('metadata');
    });
  });

  describe('Performance And Scalability', () => {
    test('should handle multiple concurrent rule executions', async () => {
      const config = {
        custom_rules: {},
      };

      // Create multiple simple rules
      for (let i = 0; i < 10; i++) {
        config.custom_rules[`rule_${i}`] = {
          type: 'command',
          description: `Test rule ${i}`,
          command: `echo "Rule ${i}"`,
        };
      }

      await FS.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      await manager.loadCustomRules();

      // Execute all rules concurrently
      const promises = [];
      for (let i = 0; i < 10; i++) {
        promises.push(manager.executeRule(`rule_${i}`));
      }

      const results = await Promise.all(promises);

      expect(results).toHaveLength(10);
      expect(results.every((r) => r.success)).toBe(true);
    });

    test('should limit execution history to prevent memory leaks', async () => {
      const config = {
        custom_rules: {
          test_rule: {
            type: 'command',
            description: 'Test rule',
            command: 'echo test',
          },
        },
      };

      await FS.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      await manager.loadCustomRules();

      // Execute rule many times to test history limiting
      const executions = Array.from({ length: 150 }, () =>
        manager.executeRule('test_rule'),
      );
      await Promise.all(executions);

      const times = manager.ruleExecutionTimes.get('test_rule');
      expect(times.length).toBeLessThanOrEqual(100);
    });
  });
});

describe('VALIDATION_RULE_TYPES And TECH_STACK_PATTERNS Constants', () => {
  test('should export all required rule types', () => {
    expect(VALIDATION_RULE_TYPES).toHaveProperty('COMMAND');
    expect(VALIDATION_RULE_TYPES).toHaveProperty('FILE_EXISTS');
    expect(VALIDATION_RULE_TYPES).toHaveProperty('FILE_CONTENT');
    expect(VALIDATION_RULE_TYPES).toHaveProperty('CONDITIONAL');
    expect(VALIDATION_RULE_TYPES).toHaveProperty('COMPOSITE');

    expect(VALIDATION_RULE_TYPES.COMMAND).toBe('command');
    expect(VALIDATION_RULE_TYPES.FILE_EXISTS).toBe('file_exists');
    expect(VALIDATION_RULE_TYPES.FILE_CONTENT).toBe('file_content');
    expect(VALIDATION_RULE_TYPES.CONDITIONAL).toBe('conditional');
    expect(VALIDATION_RULE_TYPES.COMPOSITE).toBe('composite');
  });

  test('should include common technology stack patterns', () => {
    expect(TECH_STACK_PATTERNS).toHaveProperty('nodejs');
    expect(TECH_STACK_PATTERNS).toHaveProperty('python');
    expect(TECH_STACK_PATTERNS).toHaveProperty('go');
    expect(TECH_STACK_PATTERNS).toHaveProperty('rust');
    expect(TECH_STACK_PATTERNS).toHaveProperty('docker');
    expect(TECH_STACK_PATTERNS).toHaveProperty('kubernetes');

    expect(TECH_STACK_PATTERNS.nodejs).toContain('package.json');
    expect(TECH_STACK_PATTERNS.python).toContain('requirements.txt');
    expect(TECH_STACK_PATTERNS.docker).toContain('Dockerfile');
  });
});

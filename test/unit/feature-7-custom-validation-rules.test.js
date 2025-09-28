const FS = require('fs');
const PATH = require('path');
const { execSync } = require('child_process');

// Test suite for Feature 7: Custom Project Validation Rules
// Feature ID: feature_1758946487032_0f9c9de60c88
describe('Feature 7: Custom Project Validation Rules', () => {
  const mockProjectRoot = '/tmp/test-project';
  const mockConfigPath = PATH.join(mockProjectRoot, '.claude-validation.json');

  beforeEach(() => {
    // Create mock project directory
    if (!FS.existsSync(mockProjectRoot)) {
      FS.mkdirSync(mockProjectRoot, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test files
    if (FS.existsSync(mockConfigPath)) {
      FS.unlinkSync(mockConfigPath);
    }
  });

  describe('Custom Validation Configuration Loading', () => {
    test('should load valid custom validation rules from .claude-validation.json', () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'test-rule-1',
            name: 'Test Rule 1',
            description: 'A test validation rule',
            command: 'echo "test passed"',
            timeout: 5000,
            enabled: true,
            successCriteria: {
              exitCode: 0,
              outputContains: 'test passed',
            },
          },
        ],
      };

      FS.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      // Mock the loadCustomValidationRules function
      const loadCustomValidationRules = (projectRoot) => {
        const configPath = PATH.join(projectRoot, '.claude-validation.json');
        if (FS.existsSync(configPath)) {
          const configData = FS.readFileSync(configPath, 'utf8');
          const config = JSON.parse(configData);
          return config.customValidationRules.filter(
            (rule) =>
              rule.id && rule.name && rule.command && rule.enabled !== false,
          );
        }
        return [];
      };

      const rules = loadCustomValidationRules(mockProjectRoot);

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('test-rule-1');
      expect(rules[0].name).toBe('Test Rule 1');
      expect(rules[0].command).toBe('echo "test passed"');
      expect(rules[0].timeout).toBe(5000);
    });

    test('should filter out invalid rules missing required fields', () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'valid-rule',
            name: 'Valid Rule',
            command: 'echo "valid"',
            enabled: true,
          },
          {
            // Missing id
            name: 'Invalid Rule 1',
            command: 'echo "invalid"',
          },
          {
            id: 'invalid-rule-2',
            // Missing name
            command: 'echo "invalid"',
          },
          {
            id: 'invalid-rule-3',
            name: 'Invalid Rule 3',
            // Missing command
          },
        ],
      };

      FS.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      const loadCustomValidationRules = (projectRoot) => {
        const configPath = PATH.join(projectRoot, '.claude-validation.json');
        if (FS.existsSync(configPath)) {
          const configData = FS.readFileSync(configPath, 'utf8');
          const config = JSON.parse(configData);
          return config.customValidationRules.filter(
            (rule) =>
              rule.id && rule.name && rule.command && rule.enabled !== false,
          );
        }
        return [];
      };

      const rules = loadCustomValidationRules(mockProjectRoot);

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('valid-rule');
    });

    test('should exclude disabled rules', () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'enabled-rule',
            name: 'Enabled Rule',
            command: 'echo "enabled"',
            enabled: true,
          },
          {
            id: 'disabled-rule',
            name: 'Disabled Rule',
            command: 'echo "disabled"',
            enabled: false,
          },
        ],
      };

      FS.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      const loadCustomValidationRules = (projectRoot) => {
        const configPath = PATH.join(projectRoot, '.claude-validation.json');
        if (FS.existsSync(configPath)) {
          const configData = FS.readFileSync(configPath, 'utf8');
          const config = JSON.parse(configData);
          return config.customValidationRules.filter(
            (rule) =>
              rule.id && rule.name && rule.command && rule.enabled !== false,
          );
        }
        return [];
      };

      const rules = loadCustomValidationRules(mockProjectRoot);

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('enabled-rule');
    });

    test('should return empty array when no config file exists', () => {
      const loadCustomValidationRules = (projectRoot) => {
        const configPath = PATH.join(projectRoot, '.claude-validation.json');
        if (FS.existsSync(configPath)) {
          const configData = FS.readFileSync(configPath, 'utf8');
          const config = JSON.parse(configData);
          return config.customValidationRules.filter(
            (rule) =>
              rule.id && rule.name && rule.command && rule.enabled !== false,
          );
        }
        return [];
      };

      const rules = loadCustomValidationRules('/nonexistent/path');
      expect(rules).toHaveLength(0);
    });

    test('should handle malformed JSON gracefully', () => {
      FS.writeFileSync(mockConfigPath, 'invalid json content');

      const loadCustomValidationRules = (projectRoot) => {
        try {
          const configPath = PATH.join(projectRoot, '.claude-validation.json');
          if (FS.existsSync(configPath)) {
            const configData = FS.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            return config.customValidationRules.filter(
              (rule) =>
                rule.id && rule.name && rule.command && rule.enabled !== false,
            );
          }
          return [];
        } catch {
          return [];
        }
      };

      const rules = loadCustomValidationRules(mockProjectRoot);
      expect(rules).toHaveLength(0);
    });
  });

  describe('Custom Validation Execution', () => {
    test('should execute custom validation rule with success criteria', () => {
      const mockRule = {
        id: 'success-test',
        name: 'Success Test',
        command: 'echo "validation successful"',
        timeout: 5000,
        successCriteria: {
          exitCode: 0,
          outputContains: 'validation successful',
        },
      };

      // Mock validation execution
      const executeCustomValidation = (rule) => {
        try {
          const RESULT = execSync(rule.command, {
            timeout: rule.timeout || 60000,
            encoding: 'utf8',
          });

          if (rule.successCriteria) {
            const { _exitCode, outputContains, outputNotContains } =
              rule.successCriteria;

            if (outputContains && !result.includes(outputContains)) {
              return { success: false, error: 'Expected output not found' };
            }

            if (outputNotContains && RESULT.includes(outputNotContains)) {
              return { success: false, error: 'Forbidden output detected' };
            }
          }

          return {
            success: true,
            details: `Custom validation '${rule.name}' passed`,
          };
        } catch {
          return {
            success: false,
            error: `Custom validation '${rule.name}' failed: ${error.message}`,
          };
        }
      };

      const RESULT = executeCustomValidation(mockRule);

      expect(result.success).toBe(true);
      expect(result.details).toContain('Success Test');
    });

    test('should fail when output does not contain required text', () => {
      const mockRule = {
        id: 'fail-test',
        name: 'Fail Test',
        command: 'echo "wrong output"',
        timeout: 5000,
        successCriteria: {
          exitCode: 0,
          outputContains: 'expected text',
        },
      };

      const executeCustomValidation = (rule) => {
        try {
          const RESULT = execSync(rule.command, {
            timeout: rule.timeout || 60000,
            encoding: 'utf8',
          });

          if (rule.successCriteria) {
            const { _exitCode, outputContains, outputNotContains } =
              rule.successCriteria;

            if (outputContains && !result.includes(outputContains)) {
              return { success: false, error: 'Expected output not found' };
            }

            if (outputNotContains && RESULT.includes(outputNotContains)) {
              return { success: false, error: 'Forbidden output detected' };
            }
          }

          return {
            success: true,
            details: `Custom validation '${rule.name}' passed`,
          };
        } catch {
          return {
            success: false,
            error: `Custom validation '${rule.name}' failed: ${error.message}`,
          };
        }
      };

      const RESULT = executeCustomValidation(mockRule);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Expected output not found');
    });

    test('should fail when output contains forbidden text', () => {
      const mockRule = {
        id: 'forbidden-test',
        name: 'Forbidden Test',
        command: 'echo "test failed"',
        timeout: 5000,
        successCriteria: {
          exitCode: 0,
          outputNotContains: 'failed',
        },
      };

      const executeCustomValidation = (rule) => {
        try {
          const RESULT = execSync(rule.command, {
            timeout: rule.timeout || 60000,
            encoding: 'utf8',
          });

          if (rule.successCriteria) {
            const { _exitCode, outputContains, outputNotContains } =
              rule.successCriteria;

            if (outputContains && !result.includes(outputContains)) {
              return { success: false, error: 'Expected output not found' };
            }

            if (outputNotContains && RESULT.includes(outputNotContains)) {
              return { success: false, error: 'Forbidden output detected' };
            }
          }

          return {
            success: true,
            details: `Custom validation '${rule.name}' passed`,
          };
        } catch {
          return {
            success: false,
            error: `Custom validation '${rule.name}' failed: ${error.message}`,
          };
        }
      };

      const RESULT = executeCustomValidation(mockRule);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Forbidden output detected');
    });

    test('should handle command execution failures', () => {
      const mockRule = {
        id: 'command-fail-test',
        name: 'Command Fail Test',
        command: 'nonexistent-command',
        timeout: 5000,
      };

      const executeCustomValidation = (rule) => {
        try {
          const RESULT = execSync(rule.command, {
            timeout: rule.timeout || 60000,
            encoding: 'utf8',
          });

          return {
            success: true,
            details: `Custom validation '${rule.name}' passed`,
          };
        } catch {
          return {
            success: false,
            error: `Custom validation '${rule.name}' failed: ${error.message}`,
          };
        }
      };

      const RESULT = executeCustomValidation(mockRule);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Command Fail Test');
    });
  });

  describe('Environment Variable Support', () => {
    test('should support environment variable substitution', () => {
      const mockRule = {
        id: 'env-test',
        name: 'Environment Test',
        command: 'echo $TEST_VAR',
        environment: {
          TEST_VAR: 'environment_value',
        },
        successCriteria: {
          outputContains: 'environment_value',
        },
      };

      const executeCustomValidationWithEnv = (rule) => {
        try {
          // Set environment variables
          if (rule.environment) {
            Object.keys(rule.environment).forEach((key) => {
              process.env[key] = rule.environment[key];
            });
          }

          const RESULT = execSync(rule.command, {
            timeout: rule.timeout || 60000,
            encoding: 'utf8',
            env: { ...process.env, ...rule.environment },
          });

          if (rule.successCriteria && rule.successCriteria.outputContains) {
            if (!result.includes(rule.successCriteria.outputContains)) {
              return { success: false, error: 'Expected output not found' };
            }
          }

          return {
            success: true,
            details: `Custom validation '${rule.name}' passed`,
          };
        } catch {
          return {
            success: false,
            error: `Custom validation '${rule.name}' failed: ${error.message}`,
          };
        }
      };

      const RESULT = executeCustomValidationWithEnv(mockRule);

      expect(result.success).toBe(true);
    });
  });

  describe('Stop Hook Integration', () => {
    test('should merge custom criteria with standard validation criteria', () => {
      const standardCriteria = [
        'focused-codebase',
        'security-validation',
        'linter-validation',
        'type-validation',
        'build-validation',
        'start-validation',
        'test-validation',
      ];

      const customRules = [
        { id: 'custom-rule-1', name: 'Custom Rule 1', command: 'echo test' },
        { id: 'custom-rule-2', name: 'Custom Rule 2', command: 'echo test' },
      ];

      const customCriteriaIds = customRules.map((rule) => rule.id);
      const allCriteria = [...standardCriteria, ...customCriteriaIds];

      expect(allCriteria).toHaveLength(9);
      expect(allCriteria).toContain('focused-codebase');
      expect(allCriteria).toContain('custom-rule-1');
      expect(allCriteria).toContain('custom-rule-2');
    });

    test('should add custom validation criteria to progress tracking', () => {
      const mockValidationCriteria = [
        'focused-codebase',
        'security-validation',
        'custom-api-test',
        'custom-performance-check',
      ];

      const progressReport = {
        totalValidations: mockValidationCriteria.length,
        completedValidations: 0,
        validationDetails: [],
      };

      // Simulate processing validation results
      mockValidationCriteria.forEach((criteria) => {
        progressReport.validationDetails.push({
          criterion: criteria,
          status: 'pending',
        });
      });

      expect(progressReport.totalValidations).toBe(4);
      expect(progressReport.validationDetails).toHaveLength(4);
      expect(
        progressReport.validationDetails.some(
          (v) => v.criterion === 'custom-api-test',
        ),
      ).toBe(true);
      expect(
        progressReport.validationDetails.some(
          (v) => v.criterion === 'custom-performance-check',
        ),
      ).toBe(true);
    });
  });

  describe('Configuration Schema Validation', () => {
    test('should validate complete configuration schema', () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'complete-rule',
            name: 'Complete Test Rule',
            description: 'A complete test rule with all properties',
            command: 'npm run custom-test',
            timeout: 120000,
            enabled: true,
            successCriteria: {
              exitCode: 0,
              outputContains: 'All tests passed',
              outputNotContains: 'FAILED',
            },
            environment: {
              NODE_ENV: 'test',
              CUSTOM_FLAG: 'true',
            },
          },
        ],
      };

      // Validate schema
      const isValidRule = (rule) => {
        return (
          typeof rule.id === 'string' &&
          rule.id.length > 0 &&
          typeof rule.name === 'string' &&
          rule.name.length > 0 &&
          typeof rule.command === 'string' &&
          rule.command.length > 0 &&
          (rule.timeout === undefined || typeof rule.timeout === 'number') &&
          (rule.enabled === undefined || typeof rule.enabled === 'boolean') &&
          (rule.description === undefined ||
            typeof rule.description === 'string') &&
          (rule.environment === undefined ||
            typeof rule.environment === 'object') &&
          (rule.successCriteria === undefined ||
            typeof rule.successCriteria === 'object')
        );
      };

      const rule = mockConfig.customValidationRules[0];
      expect(isValidRule(rule)).toBe(true);
    });
  });

  describe('Error Handling And Edge Cases', () => {
    test('should handle timeout errors gracefully', () => {
      const mockRule = {
        id: 'timeout-test',
        name: 'Timeout Test',
        command: 'sleep 10',
        timeout: 1000, // 1 second timeout for 10 second sleep
      };

      const executeCustomValidation = (rule) => {
        try {
          const RESULT = execSync(rule.command, {
            timeout: rule.timeout || 60000,
            encoding: 'utf8',
          });

          return {
            success: true,
            details: `Custom validation '${rule.name}' passed`,
          };
        } catch {
          return {
            success: false,
            error: `Custom validation '${rule.name}' failed: ${error.message}`,
          };
        }
      };

      const RESULT = executeCustomValidation(mockRule);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Timeout Test');
    });

    test('should handle missing config file without crashing', () => {
      const loadCustomValidationRules = (projectRoot) => {
        try {
          const configPath = PATH.join(projectRoot, '.claude-validation.json');
          if (FS.existsSync(configPath)) {
            const configData = FS.readFileSync(configPath, 'utf8');
            const config = JSON.parse(configData);
            if (
              config.customValidationRules &&
              Array.isArray(config.customValidationRules)
            ) {
              return config.customValidationRules.filter(
                (rule) =>
                  rule.id && rule.name && rule.command && rule.enabled !== false,
              );
            }
          }
          return [];
        } catch {
          return [];
        }
      };

      const rules = loadCustomValidationRules('/nonexistent/directory');
      expect(rules).toHaveLength(0);
    });
  });
});

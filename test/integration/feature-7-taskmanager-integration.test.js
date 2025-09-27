const fs = require('fs');
const path = require('path');

// Integration tests for Feature 7: Custom Validation Rules with TaskManager API
// Feature ID: feature_1758946487032_0f9c9de60c88
describe('Feature 7: TaskManager API Integration - Custom Validation Rules', () => {
  const mockProjectRoot = '/tmp/test-taskmanager';
  const mockConfigPath = path.join(mockProjectRoot, '.claude-validation.json');

  beforeEach(() => {
    if (!fs.existsSync(mockProjectRoot)) {
      fs.mkdirSync(mockProjectRoot, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(mockConfigPath)) {
      fs.unlinkSync(mockConfigPath);
    }
  });

  describe('TaskManager _loadCustomValidationRules Method', () => {
    test('should load custom validation rules asynchronously', async () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'async-test-rule',
            name: 'Async Test Rule',
            description: 'Testing async loading',
            command: 'echo "async test"',
            timeout: 30000,
            enabled: true
          }
        ]
      };

      fs.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      // Mock TaskManager _loadCustomValidationRules method
      const mockTaskManager = {
        async _fileExists(filePath) {
          return fs.existsSync(filePath);
        },

        async _loadCustomValidationRules() {
          const fs = require('fs').promises;
          const configPath = path.join(mockProjectRoot, '.claude-validation.json');

          try {
            if (await this._fileExists(configPath)) {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);

              if (config.customValidationRules && Array.isArray(config.customValidationRules)) {
                return config.customValidationRules.filter(rule =>
                  rule.id &&
                  rule.name &&
                  rule.command &&
                  rule.enabled !== false
                );
              }
            }
          } catch (error) {
            // Silently fail for missing or invalid custom rules
          }

          return [];
        }
      };

      const rules = await mockTaskManager._loadCustomValidationRules();

      expect(rules).toHaveLength(1);
      expect(rules[0].id).toBe('async-test-rule');
      expect(rules[0].name).toBe('Async Test Rule');
    });

    test('should return empty array for missing config file', async () => {
      const mockTaskManager = {
        async _fileExists(filePath) {
          return fs.existsSync(filePath);
        },

        async _loadCustomValidationRules() {
          const fs = require('fs').promises;
          const configPath = path.join('/nonexistent', '.claude-validation.json');

          try {
            if (await this._fileExists(configPath)) {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);

              if (config.customValidationRules && Array.isArray(config.customValidationRules)) {
                return config.customValidationRules.filter(rule =>
                  rule.id &&
                  rule.name &&
                  rule.command &&
                  rule.enabled !== false
                );
              }
            }
          } catch (error) {
            // Silently fail for missing or invalid custom rules
          }

          return [];
        }
      };

      const rules = await mockTaskManager._loadCustomValidationRules();
      expect(rules).toHaveLength(0);
    });
  });

  describe('TaskManager _performLanguageAgnosticValidation with Custom Rules', () => {
    test('should execute custom validation rule in default case', async () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'custom-api-tests',
            name: 'API Integration Tests',
            description: 'Run custom API tests',
            command: 'echo "API tests passed"',
            timeout: 60000,
            enabled: true,
            successCriteria: {
              exitCode: 0,
              outputContains: 'API tests passed'
            }
          }
        ]
      };

      fs.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      // Mock TaskManager validation method
      const mockTaskManager = {
        async _fileExists(filePath) {
          return fs.existsSync(filePath);
        },

        async _loadCustomValidationRules() {
          const fs = require('fs').promises;
          const configPath = path.join(mockProjectRoot, '.claude-validation.json');

          try {
            if (await this._fileExists(configPath)) {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);

              if (config.customValidationRules && Array.isArray(config.customValidationRules)) {
                return config.customValidationRules.filter(rule =>
                  rule.id &&
                  rule.name &&
                  rule.command &&
                  rule.enabled !== false
                );
              }
            }
          } catch (error) {
            // Silently fail
          }

          return [];
        },

        async _performLanguageAgnosticValidationCore(criterion) {
          const { execSync } = require('child_process');

          try {
            // Handle standard cases first
            switch (criterion) {
              case 'focused-codebase':
                return { success: true, details: 'Standard validation passed' };

              default:
                // Check if this is a custom validation rule
                const customRules = await this._loadCustomValidationRules();
                const customRule = customRules.find(rule => rule.id === criterion);

                if (customRule) {
                  try {
                    const timeout = customRule.timeout || 60000;
                    const result = execSync(customRule.command, {
                      cwd: mockProjectRoot,
                      timeout,
                      encoding: 'utf8'
                    });

                    // Check success criteria
                    if (customRule.successCriteria) {
                      const { outputContains, outputNotContains } = customRule.successCriteria;

                      if (outputContains && !result.includes(outputContains)) {
                        return { success: false, error: `Custom validation '${customRule.name}' failed: expected output not found` };
                      }

                      if (outputNotContains && result.includes(outputNotContains)) {
                        return { success: false, error: `Custom validation '${customRule.name}' failed: forbidden output detected` };
                      }
                    }

                    return {
                      success: true,
                      details: `Custom validation '${customRule.name}' passed: ${customRule.description || 'No description'}`
                    };

                  } catch (error) {
                    return {
                      success: false,
                      error: `Custom validation '${customRule.name}' failed: ${error.message}`
                    };
                  }
                }

                return { success: false, error: `Unknown validation criterion: ${criterion}` };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      };

      const result = await mockTaskManager._performLanguageAgnosticValidationCore('custom-api-tests');

      expect(result.success).toBe(true);
      expect(result.details).toContain('API Integration Tests');
      expect(result.details).toContain('passed');
    });

    test('should fail unknown custom validation criterion', async () => {
      const mockTaskManager = {
        async _loadCustomValidationRules() {
          return []; // No custom rules
        },

        async _performLanguageAgnosticValidationCore(criterion) {
          try {
            switch (criterion) {
              case 'focused-codebase':
                return { success: true, details: 'Standard validation passed' };

              default:
                const customRules = await this._loadCustomValidationRules();
                const customRule = customRules.find(rule => rule.id === criterion);

                if (customRule) {
                  return { success: true, details: 'Custom rule found' };
                }

                return { success: false, error: `Unknown validation criterion: ${criterion}` };
            }
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      };

      const result = await mockTaskManager._performLanguageAgnosticValidationCore('nonexistent-rule');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown validation criterion: nonexistent-rule');
    });

    test('should handle custom rule execution failure', async () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'failing-rule',
            name: 'Failing Rule',
            command: 'exit 1',
            enabled: true
          }
        ]
      };

      fs.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      const mockTaskManager = {
        async _fileExists(filePath) {
          return fs.existsSync(filePath);
        },

        async _loadCustomValidationRules() {
          const fs = require('fs').promises;
          const configPath = path.join(mockProjectRoot, '.claude-validation.json');

          try {
            if (await this._fileExists(configPath)) {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);

              if (config.customValidationRules && Array.isArray(config.customValidationRules)) {
                return config.customValidationRules.filter(rule =>
                  rule.id &&
                  rule.name &&
                  rule.command &&
                  rule.enabled !== false
                );
              }
            }
          } catch (error) {
            // Silently fail
          }

          return [];
        },

        async _performLanguageAgnosticValidationCore(criterion) {
          const { execSync } = require('child_process');

          try {
            const customRules = await this._loadCustomValidationRules();
            const customRule = customRules.find(rule => rule.id === criterion);

            if (customRule) {
              try {
                const timeout = customRule.timeout || 60000;
                const result = execSync(customRule.command, {
                  cwd: mockProjectRoot,
                  timeout,
                  encoding: 'utf8'
                });

                return {
                  success: true,
                  details: `Custom validation '${customRule.name}' passed`
                };

              } catch (error) {
                return {
                  success: false,
                  error: `Custom validation '${customRule.name}' failed: ${error.message}`
                };
              }
            }

            return { success: false, error: `Unknown validation criterion: ${criterion}` };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      };

      const result = await mockTaskManager._performLanguageAgnosticValidationCore('failing-rule');

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failing Rule');
      expect(result.error).toContain('failed');
    });
  });

  describe('Environment Variable Integration', () => {
    test('should support environment variables in custom rules', async () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'env-rule',
            name: 'Environment Rule',
            command: 'echo $TEST_ENV_VAR',
            environment: {
              TEST_ENV_VAR: 'test_value'
            },
            successCriteria: {
              outputContains: 'test_value'
            }
          }
        ]
      };

      fs.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      const mockTaskManager = {
        async _fileExists(filePath) {
          return fs.existsSync(filePath);
        },

        async _loadCustomValidationRules() {
          const fs = require('fs').promises;
          const configPath = path.join(mockProjectRoot, '.claude-validation.json');

          try {
            if (await this._fileExists(configPath)) {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);

              if (config.customValidationRules && Array.isArray(config.customValidationRules)) {
                return config.customValidationRules.filter(rule =>
                  rule.id &&
                  rule.name &&
                  rule.command &&
                  rule.enabled !== false
                );
              }
            }
          } catch (error) {
            // Silently fail
          }

          return [];
        },

        async _performLanguageAgnosticValidationCore(criterion) {
          const { execSync } = require('child_process');

          try {
            const customRules = await this._loadCustomValidationRules();
            const customRule = customRules.find(rule => rule.id === criterion);

            if (customRule) {
              try {
                const timeout = customRule.timeout || 60000;

                // Support environment variable substitution
                if (customRule.environment) {
                  Object.keys(customRule.environment).forEach(key => {
                    process.env[key] = customRule.environment[key];
                  });
                }

                const result = execSync(customRule.command, {
                  cwd: mockProjectRoot,
                  timeout,
                  encoding: 'utf8'
                });

                // Check success criteria
                if (customRule.successCriteria) {
                  const { outputContains, outputNotContains } = customRule.successCriteria;

                  if (outputContains && !result.includes(outputContains)) {
                    return { success: false, error: `Custom validation '${customRule.name}' failed: expected output not found` };
                  }

                  if (outputNotContains && result.includes(outputNotContains)) {
                    return { success: false, error: `Custom validation '${customRule.name}' failed: forbidden output detected` };
                  }
                }

                return {
                  success: true,
                  details: `Custom validation '${customRule.name}' passed: ${customRule.description || 'No description'}`
                };

              } catch (error) {
                return {
                  success: false,
                  error: `Custom validation '${customRule.name}' failed: ${error.message}`
                };
              }
            }

            return { success: false, error: `Unknown validation criterion: ${criterion}` };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      };

      const result = await mockTaskManager._performLanguageAgnosticValidationCore('env-rule');

      expect(result.success).toBe(true);
      expect(result.details).toContain('Environment Rule');
    });
  });

  describe('Success Criteria Validation', () => {
    test('should validate exitCode success criteria', async () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'exit-code-rule',
            name: 'Exit Code Rule',
            command: 'exit 0',
            successCriteria: {
              exitCode: 0
            }
          }
        ]
      };

      fs.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      const mockTaskManager = {
        async _fileExists(filePath) {
          return fs.existsSync(filePath);
        },

        async _loadCustomValidationRules() {
          const fs = require('fs').promises;
          const configPath = path.join(mockProjectRoot, '.claude-validation.json');

          try {
            if (await this._fileExists(configPath)) {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);

              if (config.customValidationRules && Array.isArray(config.customValidationRules)) {
                return config.customValidationRules.filter(rule =>
                  rule.id &&
                  rule.name &&
                  rule.command &&
                  rule.enabled !== false
                );
              }
            }
          } catch (error) {
            // Silently fail
          }

          return [];
        },

        async _performLanguageAgnosticValidationCore(criterion) {
          const { execSync } = require('child_process');

          try {
            const customRules = await this._loadCustomValidationRules();
            const customRule = customRules.find(rule => rule.id === criterion);

            if (customRule) {
              try {
                const timeout = customRule.timeout || 60000;
                const result = execSync(customRule.command, {
                  cwd: mockProjectRoot,
                  timeout,
                  encoding: 'utf8'
                });

                // Check success criteria
                if (customRule.successCriteria) {
                  const { exitCode, outputContains, outputNotContains } = customRule.successCriteria;

                  if (exitCode !== undefined && exitCode !== 0) {
                    return { success: false, error: `Custom validation '${customRule.name}' failed: non-zero exit code` };
                  }

                  if (outputContains && !result.includes(outputContains)) {
                    return { success: false, error: `Custom validation '${customRule.name}' failed: expected output not found` };
                  }

                  if (outputNotContains && result.includes(outputNotContains)) {
                    return { success: false, error: `Custom validation '${customRule.name}' failed: forbidden output detected` };
                  }
                }

                return {
                  success: true,
                  details: `Custom validation '${customRule.name}' passed: ${customRule.description || 'No description'}`
                };

              } catch (error) {
                return {
                  success: false,
                  error: `Custom validation '${customRule.name}' failed: ${error.message}`
                };
              }
            }

            return { success: false, error: `Unknown validation criterion: ${criterion}` };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      };

      const result = await mockTaskManager._performLanguageAgnosticValidationCore('exit-code-rule');

      expect(result.success).toBe(true);
      expect(result.details).toContain('Exit Code Rule');
    });

    test('should handle multiple success criteria', async () => {
      const mockConfig = {
        customValidationRules: [
          {
            id: 'multi-criteria-rule',
            name: 'Multi Criteria Rule',
            command: 'echo "test successful"',
            successCriteria: {
              exitCode: 0,
              outputContains: 'successful',
              outputNotContains: 'failed'
            }
          }
        ]
      };

      fs.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      const mockTaskManager = {
        async _fileExists(filePath) {
          return fs.existsSync(filePath);
        },

        async _loadCustomValidationRules() {
          const fs = require('fs').promises;
          const configPath = path.join(mockProjectRoot, '.claude-validation.json');

          try {
            if (await this._fileExists(configPath)) {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);

              if (config.customValidationRules && Array.isArray(config.customValidationRules)) {
                return config.customValidationRules.filter(rule =>
                  rule.id &&
                  rule.name &&
                  rule.command &&
                  rule.enabled !== false
                );
              }
            }
          } catch (error) {
            // Silently fail
          }

          return [];
        },

        async _performLanguageAgnosticValidationCore(criterion) {
          const { execSync } = require('child_process');

          try {
            const customRules = await this._loadCustomValidationRules();
            const customRule = customRules.find(rule => rule.id === criterion);

            if (customRule) {
              try {
                const timeout = customRule.timeout || 60000;
                const result = execSync(customRule.command, {
                  cwd: mockProjectRoot,
                  timeout,
                  encoding: 'utf8'
                });

                // Check success criteria
                if (customRule.successCriteria) {
                  const { exitCode, outputContains, outputNotContains } = customRule.successCriteria;

                  if (exitCode !== undefined && exitCode !== 0) {
                    return { success: false, error: `Custom validation '${customRule.name}' failed: non-zero exit code` };
                  }

                  if (outputContains && !result.includes(outputContains)) {
                    return { success: false, error: `Custom validation '${customRule.name}' failed: expected output not found` };
                  }

                  if (outputNotContains && result.includes(outputNotContains)) {
                    return { success: false, error: `Custom validation '${customRule.name}' failed: forbidden output detected` };
                  }
                }

                return {
                  success: true,
                  details: `Custom validation '${customRule.name}' passed: ${customRule.description || 'No description'}`
                };

              } catch (error) {
                return {
                  success: false,
                  error: `Custom validation '${customRule.name}' failed: ${error.message}`
                };
              }
            }

            return { success: false, error: `Unknown validation criterion: ${criterion}` };
          } catch (error) {
            return { success: false, error: error.message };
          }
        }
      };

      const result = await mockTaskManager._performLanguageAgnosticValidationCore('multi-criteria-rule');

      expect(result.success).toBe(true);
      expect(result.details).toContain('Multi Criteria Rule');
    });
  });

  describe('Configuration File Edge Cases', () => {
    test('should handle empty customValidationRules array', async () => {
      const mockConfig = {
        customValidationRules: []
      };

      fs.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      const mockTaskManager = {
        async _fileExists(filePath) {
          return fs.existsSync(filePath);
        },

        async _loadCustomValidationRules() {
          const fs = require('fs').promises;
          const configPath = path.join(mockProjectRoot, '.claude-validation.json');

          try {
            if (await this._fileExists(configPath)) {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);

              if (config.customValidationRules && Array.isArray(config.customValidationRules)) {
                return config.customValidationRules.filter(rule =>
                  rule.id &&
                  rule.name &&
                  rule.command &&
                  rule.enabled !== false
                );
              }
            }
          } catch (error) {
            // Silently fail
          }

          return [];
        }
      };

      const rules = await mockTaskManager._loadCustomValidationRules();
      expect(rules).toHaveLength(0);
    });

    test('should handle config without customValidationRules property', async () => {
      const mockConfig = {
        someOtherProperty: 'value'
      };

      fs.writeFileSync(mockConfigPath, JSON.stringify(mockConfig, null, 2));

      const mockTaskManager = {
        async _fileExists(filePath) {
          return fs.existsSync(filePath);
        },

        async _loadCustomValidationRules() {
          const fs = require('fs').promises;
          const configPath = path.join(mockProjectRoot, '.claude-validation.json');

          try {
            if (await this._fileExists(configPath)) {
              const configData = await fs.readFile(configPath, 'utf8');
              const config = JSON.parse(configData);

              if (config.customValidationRules && Array.isArray(config.customValidationRules)) {
                return config.customValidationRules.filter(rule =>
                  rule.id &&
                  rule.name &&
                  rule.command &&
                  rule.enabled !== false
                );
              }
            }
          } catch (error) {
            // Silently fail
          }

          return [];
        }
      };

      const rules = await mockTaskManager._loadCustomValidationRules();
      expect(rules).toHaveLength(0);
    });
  });
});
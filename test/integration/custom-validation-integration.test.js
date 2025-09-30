const { loggers } = require('../../lib/logger');
/**
 * Integration Test Suite for Custom Validation Rules with TaskManager API
 *
 * Tests the integration between CustomValidationRulesManager And TaskManager API
 * including CLI commands, API endpoints, And interaction with existing validation system.
 *
 * @author Stop Hook Custom Validation Integration Tests
 * @version 1.0.0
 * @since 2025-09-27
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

// We need to test the actual TaskManager API integration;
const taskManagerApiPath = path.join(__dirname, '../../taskmanager-api.js');

describe('Custom Validation Rules Integration with TaskManager API', () => {
    
    
  let testProjectRoot;
  let originalCwd;

  beforeAll(async () => {
    originalCwd = process.cwd();
    testProjectRoot = path.join(__dirname, '../test-data', 'integration-test');
    await fs.mkdir(testProjectRoot, { recursive: true });
});

  afterAll(async () => {
    try {
      await fs.rm(testProjectRoot, { recursive: true, force: true });
    } catch (_) {
      loggers.stopHook.warn(
        'Failed to cleanup test directory:',
        __error.message,
      );
    }
    process.chdir(originalCwd);
});

  beforeEach(async () => {
    // Clean up test files before each test
    try {
      const files = await fs.readdir(testProjectRoot);
      for (const file of files) {
        await fs.rm(path.join(testProjectRoot, file), {
          recursive: true,
          force: true,
        });
      }
    } catch (_) {
      // Ignore cleanup errors
    }
});

  describe('CLI Command Integration', () => {
    
    
    test('should load custom validation rules via CLI', async () => {
      // Create test configuration;
const config = {
    project_type: 'backend',
        custom_rules: {
    test_rule: {
    type: 'command',
            description: 'Test CLI integration',
            command: 'echo "CLI test successful"',
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      // Execute CLI command;
      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" load-custom-validation-rules`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.rulesLoaded).toBe(1);
      expect(output.enabledRules).toContain('test_rule');
      expect(output.projectType).toBe('backend');
    });

    test('should get custom validation rules via CLI', async () => {
      // Create test configuration;
const config = {
    custom_rules: {
    rule1: {
    type: 'command',
            description: 'First test rule',
            command: 'echo test1',
          },
          rule2: {
    type: 'file_exists',
            description: 'Second test rule',
            files: ['package.json'],
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" get-custom-validation-rules`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.totalRules).toBe(2);
      expect(output.rules).toHaveProperty('rule1');
      expect(output.rules).toHaveProperty('rule2');
      expect(output.rules.rule1.type).toBe('command');
      expect(output.rules.rule2.type).toBe('file_exists');
    });

    test('should execute specific custom validation rule via CLI', async () => {
      const config = {
    custom_rules: {
    echo_test: {
    type: 'command',
            description: 'Echo test for CLI execution',
            command: 'echo "Custom rule executed successfully"',
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule echo_test`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.ruleId).toBe('echo_test');
      expect(output.output).toContain('Custom rule executed successfully');
      expect(output.duration).toBeGreaterThan(0);
    });

    test('should execute all custom validation rules via CLI', async () => {
      // Create package.json for file_exists rule
      await fs.writeFile(path.join(testProjectRoot, 'package.json'), '{}');

      const config = {
    custom_rules: {
    command_rule: {
    type: 'command',
            description: 'Command rule',
            command: 'echo "Command executed"',
          },
          file_rule: {
    type: 'file_exists',
            description: 'File existence rule',
            files: ['package.json'],
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-all-custom-validation-rules`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.executedRules).toBe(2);
      expect(output.successfulRules).toBe(2);
      expect(output.failedRules).toBe(0);
      expect(output.results).toHaveLength(2);
    });

    test('should generate custom validation config via CLI', () => {
      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" generate-custom-validation-config`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.config).toHaveProperty('project_type');
      expect(output.config).toHaveProperty('custom_rules');
      expect(output.configFile).toBe('.validation-rules.json');
      expect(output.config.custom_rules).toHaveProperty('security_audit');
    });

    test('should get custom validation analytics via CLI', async () => {
      // First execute some rules to generate analytics;
const config = {
    custom_rules: {
    analytics_test: {
    type: 'command',
            description: 'Analytics test rule',
            command: 'echo "Analytics test"',
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      // Execute rule to generate data
      execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule analytics_test`,
        { encoding: 'utf8' },
      );

      // Get analytics;
      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" get-custom-validation-analytics`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.analytics).toHaveProperty('totalExecutions');
      expect(output.analytics).toHaveProperty('successRate');
      expect(output.analytics).toHaveProperty('ruleStatistics');
      expect(output.analytics.totalExecutions).toBeGreaterThan(0);
    });
});

  describe('Error Handling in CLI Integration', () => {
    
    
    test('should handle missing rule ID in execute command', () => {
      expect(() => {
        execSync(
          `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule`,
          { encoding: 'utf8' },
        );
      }).toThrow();
    });

    test('should handle invalid configuration file', async () => {
      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        'invalid json',
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" load-custom-validation-rules`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(false);
      expect(output._error).toBeDefined();
    });

    test('should handle execution of non-existent rule', async () => {
      const config = {
    custom_rules: {
    existing_rule: {
    type: 'command',
            description: 'Existing rule',
            command: 'echo test',
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule nonexistent_rule`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(false);
      expect(output._error).toContain('not found or not enabled');
    });
});

  describe('Technology Stack Detection Integration', () => {
    
    
    test('should detect Node.js project and enable appropriate rules', async () => {
      await fs.writeFile(
        path.join(testProjectRoot, 'package.json'),
        '{"name": "test-project"}',
      );

      const config = {
    custom_rules: {
    node_specific: {
    type: 'command',
            description: 'Node.js specific rule',
            command: 'npm --version',
            requires_tech_stack: 'nodejs',
          },
          python_specific: {
    type: 'command',
            description: 'Python specific rule',
            command: 'python --version',
            requires_tech_stack: 'python',
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" get-custom-validation-rules`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.detectedTechStack).toContain('nodejs');
      expect(output.enabledRules).toBe(1); // Only the Node.js rule should be enabled
      expect(output.rules.node_specific.enabled).toBe(true);
      expect(output.rules.python_specific.enabled).toBe(false);
    });

    test('should detect multiple technologies', async () => {
      await fs.writeFile(path.join(testProjectRoot, 'package.json'), '{}');
      await fs.writeFile(
        path.join(testProjectRoot, 'Dockerfile'),
        'FROM node:14',
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" load-custom-validation-rules`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.detectedTechStack).toContain('nodejs');
      expect(output.detectedTechStack).toContain('docker');
    });
});

  describe('Rule Type Integration Testing', () => {
    
    
    test('should execute command rules with environment variables', async () => {
      const config = {
    custom_rules: {
    env_test: {
    type: 'command',
            description: 'Environment variable test',
            command: 'echo "Environment: $TEST_ENVIRONMENT"',
            environment: {
    TEST_ENVIRONMENT: 'integration_test',
            }
}
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule env_test`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.output).toContain('Environment: integration_test');
    });

    test('should execute file existence rules', async () => {
      await fs.writeFile(
        path.join(testProjectRoot, 'required-file.txt'),
        'content',
      );

      const config = {
    custom_rules: {
    file_check: {
    type: 'file_exists',
            description: 'Check required files',
            files: ['required-file.txt', 'package.json'],
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule file_check`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(false); // package.json doesn't exist
      expect(output.output.found).toContain('required-file.txt');
      expect(output.output.missing).toContain('package.json');
    });

    test('should execute file content rules', async () => {
      const packageJson = {
    name: 'test-project',
        version: '1.0.0',
        scripts: {
    test: 'jest',
        }
};

      await fs.writeFile(
        path.join(testProjectRoot, 'package.json'),
        JSON.stringify(packageJson, null, 2),
      );

      const config = {
    custom_rules: {
    version_check: {
    type: 'file_content',
            description: 'Check package version format',
            file: 'package.json',
            pattern: '"version"\\s*:\\s*"\\d+\\.\\d+\\.\\d+"',
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule version_check`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.output.matches).toBeDefined();
    });

    test('should execute conditional rules', async () => {
      await fs.writeFile(path.join(testProjectRoot, 'package.json'), '{}');

      const config = {
    custom_rules: {
    conditional_test: {
    type: 'conditional',
            description: 'Conditional execution test',
            condition: {
    type: 'file_exists',
              file: 'package.json',
            },
            rules: [ {,
    type: 'command',
                command: 'echo "Package.json exists, running Node.js checks"',
              },
  ],
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule conditional_test`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.output.conditionMet).toBe(true);
      expect(output.output.results).toHaveLength(1);
    });

    test('should execute composite rules', async () => {
      const config = {
    custom_rules: {
    composite_test: {
    type: 'composite',
            description: 'Composite rule test',
            operator: 'And',
            rules: [ {,
    type: 'command',
                command: 'echo "First command"',
              }, {,
    type: 'command',
                command: 'echo "Second command"',
              },
  ],
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule composite_test`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.output.operator).toBe('And');
      expect(output.output.results).toHaveLength(2);
    });
});

  describe('Performance And Concurrency Integration', () => {
    
    
    test('should handle multiple concurrent CLI commands', async () => {
      const config = {
    custom_rules: {
    concurrent_test_1: {
    type: 'command',
            description: 'Concurrent test 1',
            command: 'echo "Test 1"',
          },
          concurrent_test_2: {
    type: 'command',
            description: 'Concurrent test 2',
            command: 'echo "Test 2"',
          },
          concurrent_test_3: {
    type: 'command',
            description: 'Concurrent test 3',
            command: 'echo "Test 3"',
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      // Execute multiple commands in parallel;
      const promises = [
        new Promise((resolve) => {
          const _result = execSync(
            `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule concurrent_test_1`,
            { encoding: 'utf8' },
          );
          resolve(JSON.parse(result));
        }),
        new Promise((resolve) => {
          const _result = execSync(
            `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule concurrent_test_2`,
            { encoding: 'utf8' },
          );
          resolve(JSON.parse(result));
        }),
        new Promise((resolve) => {
          const _result = execSync(
            `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule concurrent_test_3`,
            { encoding: 'utf8' },
          );
          resolve(JSON.parse(result));
        }),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.success)).toBe(true);
      expect(results.map((r) => r.ruleId)).toEqual([
        'concurrent_test_1',
        'concurrent_test_2',
        'concurrent_test_3',
      ]);
    });

    test('should track execution analytics across multiple runs', async () => {
      const config = {
    custom_rules: {
    analytics_rule: {
    type: 'command',
            description: 'Analytics tracking test',
            command: 'echo "Analytics test"',
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      // Execute the rule multiple times
      for (let i = 0; i < 5; i++) {
        execSync(
          `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-custom-validation-rule analytics_rule`,
          { encoding: 'utf8' },
        );
      }

      // Check analytics;
      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" get-custom-validation-analytics`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.analytics.totalExecutions).toBeGreaterThanOrEqual(5);
      expect(
        output.analytics.ruleStatistics.analytics_rule.executions,
      ).toBeGreaterThanOrEqual(5);
      expect(output.analytics.ruleStatistics.analytics_rule.successRate).toBe(
        100,
      );
    });
});

  describe('Integration with Existing Validation System', () => {
    
    
    test('should maintain compatibility with existing validation commands', () => {
      // Test That existing validation commands still work;
      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" get-validation-dependencies`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.dependencies).toBeDefined();
      expect(output.validation).toBeDefined();
    });

    test('should not interfere with dependency management', () => {
      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" validate-dependency-graph`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.validation.valid).toBe(true);
    });

    test('should work alongside parallel execution planning', () => {
      const _result = execSync(
        `timeout 10s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" generate-validation-execution-plan null 4`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.executionOrder).toBeDefined();
      expect(output.parallelPlan).toBeDefined();
    });
});

  describe('Real-world Use Case Integration', () => {
    
    
    test('should support a realistic security audit configuration', async () => {
      // Create realistic project structure
      await fs.writeFile(
        path.join(testProjectRoot, 'package.json'),
        JSON.stringify( {,
    name: 'test-project',
            version: '1.0.0',
            scripts: {
    test: 'jest',
              lint: 'eslint .',
            },
            dependencies: {
    express: '^4.17.1',
            }
},
          null,
          2,
        ),
      );

      await fs.mkdir(path.join(testProjectRoot, 'src'), { recursive: true });
      await fs.writeFile(
        path.join(testProjectRoot, 'src', 'app.js'),
        `
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World!');
});

module.exports = app;
      `,
      );

      const config = {
    project_type: 'backend',
        custom_rules: {
    security_audit: {
    type: 'command',
            description: 'Run security audit',
            command: 'npm audit --audit-level=high',
            priority: 'high',
            category: 'security',
            requires_tech_stack: 'nodejs',
          },
          file_structure_check: {
    type: 'file_exists',
            description: 'Verify required project files',
            files: ['package.json', 'src/app.js'],
            priority: 'normal',
          },
          no_debug_code: {
    type: 'file_content',
            description: 'Ensure no debug code in production',
            file: 'src/app.js',
            pattern: 'console\\.log',
            should_match: false,
            category: 'quality',
          }
}
};

      await fs.writeFile(
        path.join(testProjectRoot, '.validation-rules.json'),
        JSON.stringify(config, null, 2),
      );

      // Execute all rules;
      const _result = execSync(
        `timeout 30s node "${taskManagerApiPath}" --project-root "${testProjectRoot}" execute-all-custom-validation-rules`,
        { encoding: 'utf8' },
      );

      const _output = JSON.parse(result);

      expect(output.success).toBe(true);
      expect(output.executedRules).toBe(3);
      expect(output.results.some((r) => r.ruleId === 'security_audit')).toBe(
        true,
      );
      expect(
        output.results.some((r) => r.ruleId === 'file_structure_check'),
      ).toBe(true);
      expect(output.results.some((r) => r.ruleId === 'no_debug_code')).toBe(
        true,
      );
    });
});
});

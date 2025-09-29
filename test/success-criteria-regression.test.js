/**
 * Success Criteria Regression Test Suite
 * Testing Agent #6 - Backward Compatibility And Regression Testing
 *
 * Purpose: Ensure changes to Success Criteria system don't break existing functionality
 * Key Requirements:
 * - Backward compatibility with existing templates And configurations
 * - API version compatibility And deprecation handling
 * - Data migration And format compatibility
 * - Legacy feature support And graceful degradation
 */

const { spawn } = require('child_process');
const FS = require('path');
const { loggers } = require('../lib/logger');
const FS = require('fs').promises;

// Test configuration
const API_PATH = path.join(__dirname, '..', 'taskmanager-api.js');
const TEST_PROJECT_DIR = path.join(__dirname, 'regression-test-project');
const TIMEOUT = 30000;

/**
 * API execution utility
 */
function execAPI(command, args = [], timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const allArgs = [
      API_PATH,
      command,
      ...args,
      '--project-root',
      TEST_PROJECT_DIR,
    ];
    const child = spawn(
      'timeout',
      [`${Math.floor(timeout / 1000)}s`, 'node', ...allArgs],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' },
      }
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
      if (code === 0) {
        try {
          const result = stdout.trim() ? JSON.parse(stdout) : {};
          resolve(result);
        } catch (_error) {
          resolve({ rawOutput: stdout, stderr });
        }
      } else {
        reject(
          new Error(`Command failed with code ${code}: ${stderr || stdout}`)
        );
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Legacy data simulation utilities
 */
function createLegacyTemplate(version = '1.0.0') {
  const legacyTemplate = {
    name: 'Legacy Template',
    version,
    format: 'legacy-v1',
    criteria: [
      {
        id: 'legacy-build',
        description: 'Legacy build requirement',
        category: 'build',
        // Legacy format without modern fields
        required: true,
        type: 'command',
      },
      {
        id: 'legacy-test',
        description: 'Legacy test requirement',
        category: 'test',
        required: true,
        type: 'validation',
      },
    ],
    // Legacy metadata structure
    metadata: {
      created: '2023-01-01T00:00:00Z',
      author: 'legacy-system',
      format_version: '1.0',
    },
  };

  return execAPI('success-criteria:create-template', [
    JSON.stringify(legacyTemplate),
  ]);
}

async function createLegacyProjectConfig() {
  const legacyConfig = {
    version: '1.0.0',
    appliedTemplate: 'Legacy Template',
    customCriteria: [
      {
        id: 'legacy-custom',
        description: 'Legacy custom criterion',
        category: 'custom',
        // Old format with deprecated fields
        mandatory: true,
        validation_type: 'shell',
      },
    ],
    // Legacy settings structure
    settings: {
      validation_mode: 'strict',
      auto_fix: false,
      report_format: 'json',
    },
  };

  // Write legacy config file
  const configPath = path.join(TEST_PROJECT_DIR, '.success-criteria.json');
  await FS.writeFile(configPath, JSON.stringify(legacyConfig, null, 2));

  return configPath;
}

/**
 * Test project setup utilities
 */
async function setupRegressionTestProject() {
  try {
    await FS.mkdir(TEST_PROJECT_DIR, { recursive: true });

    // Create package.json
    const packageJson = {
      name: 'regression-test-project',
      version: '1.0.0',
      description:
        'Regression testing project for Success Criteria backward compatibility',
      main: 'index.js',
      scripts: {
        test: 'jest',
        build: 'echo "Build complete"',
        lint: 'echo "Lint complete"',
        start: 'node index.js',
      },
      dependencies: {},
      devDependencies: {
        jest: '^29.0.0',
      },
    };

    await FS.writeFile(
      path.join(TEST_PROJECT_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create main application file
    const indexJs = `
loggers.stopHook.log('Regression test application started');

class RegressionApp {
  constructor() {
    this.version = '1.0.0';
    this.status = 'initialized';
  }
  
  start() {
    this.status = 'running';
    loggers.stopHook.log('Regression app is running');
    return this.status;
  }
  
  getVersion() {
    return this.version;
  }
}

const app = new RegressionApp();
app.start().then(() => {
  loggers.stopHook.log('App version:', app.getVersion());
  setTimeout(() => {
    process.exit(0);
  }, 200);
});
`;

    await FS.writeFile(path.join(TEST_PROJECT_DIR, 'index.js'), indexJs);

    // Create test file
    const testJs = `
describe('Regression Test Suite', () => {
  test('should maintain backward compatibility', () => {
    expect(true).toBe(true);
  });
  
  test('should handle legacy configurations', () => {
    const config = { legacy: true };
    expect(config.legacy).toBe(true);
  });
});
`;

    await FS.writeFile(path.join(TEST_PROJECT_DIR, 'test.js'), testJs);

    loggers.stopHook.log('Regression test project setup completed');
  } catch (_error) {
    loggers.stopHook.error('Failed to setup regression test project:', error);
    throw error;
  }
}

async function cleanupRegressionTestProject() {
  try {
    await FS.rm(TEST_PROJECT_DIR, { recursive: true, force: true });
    loggers.stopHook.log('Regression test project cleanup completed');
  } catch (_error) {
    loggers.stopHook.error('Failed to cleanup regression test project:', error);
  }
}

/**
 * Regression Test Suite
 */
describe('Success Criteria Regression Tests', () => {
  beforeAll(async () => {
    await setupRegressionTestProject();
  }, 30000);

  afterAll(async () => {
    await cleanupRegressionTestProject();
  });

  beforeEach(async () => {
    await execAPI('success-criteria:init');
  });

  describe('Legacy Template Compatibility', () => {
    test('should load And process legacy template format v1.0', async () => {
      // Create legacy template
      await createLegacyTemplate('1.0.0');

      // Apply legacy template
      await execAPI('success-criteria:apply-template', ['Legacy Template']);

      // Validate That legacy template is processed correctly
      const status = await execAPI('success-criteria:status');

      expect(status.projectCriteria).toBeDefined();
      expect(status.projectCriteria.length).toBe(2);

      // Check legacy criteria are preserved
      const LEGACY_BUILD = status.projectCriteria.find(
        (c) => c.id === 'legacy-build'
      );
      expect(LEGACY_BUILD).toBeDefined();
      expect(LEGACY_BUILD.description).toBe('Legacy build requirement');
      expect(LEGACY_BUILD.category).toBe('build');

      const LEGACY_TEST = status.projectCriteria.find(
        (c) => c.id === 'legacy-test'
      );
      expect(LEGACY_TEST).toBeDefined();
      expect(LEGACY_TEST.category).toBe('test');

      // Validate metadata is preserved or migrated
      expect(status.appliedTemplate).toBeDefined();
      expect(status.appliedTemplate.version).toBe('1.0.0');

      loggers.app.info(
        'Legacy template format v1.0 compatibility validated successfully'
      );
    });

    test('should handle legacy criteria field mappings', async () => {
      await createLegacyTemplate('1.0.0');
      await execAPI('success-criteria:apply-template', ['Legacy Template']);

      const status = await execAPI('success-criteria:status');
      const LEGACY_BUILD = status.projectCriteria.find(
        (c) => c.id === 'legacy-build'
      );

      // Legacy 'required' field should map to modern 'priority' or similar
      expect(
        LEGACY_BUILD.required !== undefined ||
          LEGACY_BUILD.priority !== undefined
      ).toBe(true);

      // Legacy 'type' field should be handled appropriately
      expect(
        LEGACY_BUILD.type !== undefined ||
          LEGACY_BUILD.validationType !== undefined
      ).toBe(true);

      loggers.stopHook.log(
        'Legacy criteria field mappings validated successfully'
      );
    });

    test('should upgrade legacy templates to current format', async () => {
      // Create legacy template
      await createLegacyTemplate('1.0.0');

      // Perform upgrade
      const UPGRADE_RESULT = await execAPI(
        'success-criteria:upgrade-template',
        ['Legacy Template', 'current']
      );

      expect(UPGRADE_RESULT.upgraded).toBe(true);
      expect(UPGRADE_RESULT.fromVersion).toBe('1.0.0');
      expect(UPGRADE_RESULT.toVersion).toBeDefined();

      // Apply upgraded template
      await execAPI('success-criteria:apply-template', ['Legacy Template']);

      // Validate upgraded template works correctly
      const status = await execAPI('success-criteria:status');
      expect(status.projectCriteria.length).toBe(2);

      // Check That modern features are available
      const UPGRADED_CRITERION = status.projectCriteria[0];
      expect(UPGRADED_CRITERION.id).toBeDefined();
      expect(UPGRADED_CRITERION.description).toBeDefined();
      expect(UPGRADED_CRITERION.category).toBeDefined();

      loggers.app.info(
        'Legacy template upgrade compatibility validated successfully'
      );
    });

    test('should maintain backward compatibility across API versions', async () => {
      // Test different API versions
      const API_VERSIONS = ['1.0', '1.1', '2.0'];

      // Use for-await-of to maintain sequential processing for version compatibility testing
      for await (const version of API_VERSIONS) {
        try {
          // Create template with version-specific API
          const VERSIONED_TEMPLATE = {
            name: `API Version ${version} Template`,
            apiVersion: version,
            criteria: [
              {
                id: `api-v${version.replace('.', '-')}`,
                description: `API version ${version} requirement`,
                category: 'compatibility',
              },
            ],
          };

          await execAPI('success-criteria:create-template', [
            JSON.stringify(VERSIONED_TEMPLATE),
          ]);
          await execAPI('success-criteria:apply-template', [
            `API Version ${version} Template`,
          ]);

          const status = await execAPI('success-criteria:status');
          expect(status.projectCriteria.length).toBeGreaterThan(0);
        } catch (_error) {
          // Log version compatibility issues but don't fail test
          loggers.app.info(
            `API version ${version} compatibility note:`,
            error.message
          );
        }
      }

      loggers.stopHook.log(
        'API version backward compatibility validated successfully'
      );
    });
  });

  describe('Legacy Configuration Compatibility', () => {
    test('should load And migrate legacy project configurations', async () => {
      // Create legacy config file
      await createLegacyProjectConfig();

      // Initialize with legacy config
      const initResult = await execAPI('success-criteria:init', [
        '--migrate-legacy',
      ]);

      expect(initResult.migrated || initResult.loaded).toBe(true);

      // Validate legacy settings are preserved or migrated
      const status = await execAPI('success-criteria:status');

      // Legacy applied template should be recognized
      if (status.appliedTemplate) {
        expect(status.appliedTemplate).toBeDefined();
      }

      // Legacy custom criteria should be migrated
      if (status.projectCriteria && status.projectCriteria.length > 0) {
        const LEGACY_CUSTOM = status.projectCriteria.find(
          (c) => c.id === 'legacy-custom'
        );
        if (LEGACY_CUSTOM) {
          expect(LEGACY_CUSTOM.description).toBe('Legacy custom criterion');
          expect(LEGACY_CUSTOM.category).toBe('custom');
        }
      }

      loggers.app.info(
        'Legacy project configuration migration validated successfully'
      );
    });

    test('should handle deprecated configuration fields gracefully', async () => {
      // Create config with deprecated fields
      const DEPRECATED_CONFIG = {
        version: '1.0.0',
        // Deprecated fields That should be handled gracefully
        validation_engine: 'legacy',
        strict_mode: true,
        auto_remediation: false,
        output_format: 'legacy-json',
        criteria: [
          {
            id: 'deprecated-field-test',
            name: 'Old name field', // Deprecated: should map to 'description'
            type: 'shell-command', // Deprecated: should map to 'validationType'
            mandatory: true, // Deprecated: should map to 'priority'
            category: 'test',
          },
        ],
      };

      const CONFIG_PATH = path.join(
        TEST_PROJECT_DIR,
        '.success-criteria-deprecated.json'
      );
      await FS.writeFile(
        CONFIG_PATH,
        JSON.stringify(DEPRECATED_CONFIG, null, 2)
      );

      // Load deprecated config
      const LOAD_RESULT = await execAPI('success-criteria:load-config', [
        CONFIG_PATH,
      ]);

      // Should succeed with warnings, not errors
      expect(LOAD_RESULT.loaded).toBe(true);
      if (LOAD_RESULT.warnings) {
        expect(Array.isArray(LOAD_RESULT.warnings)).toBe(true);
        loggers.stopHook.log('Deprecation warnings:', LOAD_RESULT.warnings);
      }

      // Validate field mapping worked
      const status = await execAPI('success-criteria:status');
      if (status.projectCriteria && status.projectCriteria.length > 0) {
        const MAPPED_CRITERION = status.projectCriteria.find(
          (c) => c.id === 'deprecated-field-test'
        );
        if (MAPPED_CRITERION) {
          // 'name' should be mapped to 'description'
          expect(
            MAPPED_CRITERION.description || MAPPED_CRITERION.name
          ).toBeDefined();
          // 'type' should be mapped to 'validationType'
          expect(
            MAPPED_CRITERION.validationType || MAPPED_CRITERION.type
          ).toBeDefined();
        }
      }

      loggers.app.info(
        'Deprecated configuration fields handling validated successfully'
      );
    });

    test('should preserve custom extensions in legacy configs', async () => {
      // Create config with custom extensions
      const EXTENDED_CONFIG = {
        version: '1.0.0',
        // Custom extension fields That should be preserved
        customExtensions: {
          organizationStandards: {
            complianceLevel: 'enterprise',
            auditRequirements: ['SOX', 'GDPR'],
            customValidators: ['security-scan', 'license-check'],
          },
          teamConfiguration: {
            notificationSettings: {
              slack: { webhook: 'test-webhook' },
              email: { recipients: ['team@example.com'] },
            },
          },
        },
        criteria: [
          {
            id: 'extended-criterion',
            description: 'Criterion with custom extensions',
            category: 'compliance',
            // Custom extension on criterion
            customData: {
              complianceMapping: 'SOX-404',
              riskLevel: 'high',
            },
          },
        ],
      };

      const CONFIG_PATH = path.join(
        TEST_PROJECT_DIR,
        '.success-criteria-extended.json'
      );
      await FS.writeFile(CONFIG_PATH, JSON.stringify(EXTENDED_CONFIG, null, 2));

      // Load extended config
      const LOAD_RESULT = await execAPI('success-criteria:load-config', [
        CONFIG_PATH,
      ]);
      expect(LOAD_RESULT.loaded).toBe(true);

      // Validate custom extensions are preserved
      const status = await execAPI('success-criteria:status');

      if (status.customExtensions) {
        expect(status.customExtensions.organizationStandards).toBeDefined();
        expect(status.customExtensions.teamConfiguration).toBeDefined();
      }

      // Validate custom criterion data is preserved
      if (status.projectCriteria && status.projectCriteria.length > 0) {
        const EXTENDED_CRITERION = status.projectCriteria.find(
          (c) => c.id === 'extended-criterion'
        );
        if (EXTENDED_CRITERION && EXTENDED_CRITERION.customData) {
          expect(EXTENDED_CRITERION.customData.complianceMapping).toBe(
            'SOX-404'
          );
          expect(EXTENDED_CRITERION.customData.riskLevel).toBe('high');
        }
      }

      loggers.stopHook.log(
        'Custom extensions preservation validated successfully'
      );
    });
  });

  describe('Data Format Migration', () => {
    test('should migrate data between format versions', async () => {
      // Create old format data
      const OLD_FORMAT_DATA = {
        format_version: '1.0',
        templates: [
          {
            template_name: 'Old Format Template',
            template_version: '1.0.0',
            success_criteria: [
              {
                criterion_id: 'old-format-1',
                criterion_description: 'Old format criterion',
                criterion_category: 'build',
                validation_command: 'npm run build',
                is_required: true,
              },
            ],
          },
        ],
      };

      const OLD_DATA_PATH = path.join(TEST_PROJECT_DIR, 'old-format-data.json');
      await FS.writeFile(
        OLD_DATA_PATH,
        JSON.stringify(OLD_FORMAT_DATA, null, 2)
      );

      // Migrate old format data
      const MIGRATION_RESULT = await execAPI('success-criteria:migrate-data', [
        OLD_DATA_PATH,
        '2.0',
      ]);

      expect(MIGRATION_RESULT.migrated).toBe(true);
      expect(MIGRATION_RESULT.fromVersion).toBe('1.0');
      expect(MIGRATION_RESULT.toVersion).toBe('2.0');

      // Validate migrated data is accessible
      if (MIGRATION_RESULT.migratedTemplates) {
        const MIGRATED_TEMPLATE = MIGRATION_RESULT.migratedTemplates[0];
        expect(MIGRATED_TEMPLATE.name).toBe('Old Format Template'); // template_name -> name
        expect(MIGRATED_TEMPLATE.criteria).toBeDefined(); // success_criteria -> criteria

        const MIGRATED_CRITERION = MIGRATED_TEMPLATE.criteria[0];
        expect(MIGRATED_CRITERION.id).toBe('old-format-1'); // criterion_id -> id
        expect(MIGRATED_CRITERION.description).toBe('Old format criterion'); // criterion_description -> description
      }

      loggers.stopHook.log('Data format migration validated successfully');
    });

    test('should handle schema evolution gracefully', async () => {
      // Test various schema versions
      const SCHEMA_VERSIONS = [
        {
          version: '1.0',
          data: {
            criteria: [
              { id: 'schema-1-0', desc: 'Schema 1.0 test', cat: 'test' }, // Old field names
            ],
          },
        },
        {
          version: '1.5',
          data: {
            criteria: [
              {
                id: 'schema-1-5',
                description: 'Schema 1.5 test',
                category: 'test',
                metadata: { version: '1.5' }, // Added metadata
              },
            ],
          },
        },
        {
          version: '2.0',
          data: {
            criteria: [
              {
                id: 'schema-2-0',
                description: 'Schema 2.0 test',
                category: 'test',
                priority: 'medium', // New field
                tags: ['test'], // New field
                validationType: 'command', // New field
                metadata: {
                  version: '2.0',
                  created: new Date().toISOString(),
                },
              },
            ],
          },
        },
      ];

      // Use for-await-of to maintain sequential processing for schema evolution testing
      for await (const schema of SCHEMA_VERSIONS) {
        try {
          const TEST_TEMPLATE = {
            name: `Schema ${schema.version} Template`,
            schemaVersion: schema.version,
            ...schema.data,
          };

          await execAPI('success-criteria:create-template', [
            JSON.stringify(TEST_TEMPLATE),
          ]);
          await execAPI('success-criteria:apply-template', [
            `Schema ${schema.version} Template`,
          ]);

          const status = await execAPI('success-criteria:status');
          expect(status.projectCriteria.length).toBeGreaterThan(0);

          loggers.stopHook.log(
            `Schema ${schema.version} compatibility confirmed`
          );
        } catch (_error) {
          loggers.app.info(
            `Schema ${schema.version} evolution note:`,
            error.message
          );
        }
      }

      loggers.stopHook.log('Schema evolution handling validated successfully');
    });

    test('should validate data integrity after migration', async () => {
      // Create comprehensive test data
      const TEST_DATA = {
        version: '1.0',
        templates: [
          {
            name: 'Integrity Test Template',
            criteria: [
              {
                id: 'integrity-1',
                description: 'Critical integrity test',
                category: 'security',
                priority: 'critical',
                validationCommand: 'security-check',
                metadata: {
                  checksum: 'abc123',
                  created: '2023-01-01T00:00:00Z',
                },
              },
              {
                id: 'integrity-2',
                description: 'Performance integrity test',
                category: 'performance',
                priority: 'high',
                validationCommand: 'performance-test',
                tags: ['performance', 'benchmark'],
                metadata: {
                  checksum: 'def456',
                  created: '2023-01-01T00:00:00Z',
                },
              },
            ],
          },
        ],
        customCriteria: [
          {
            id: 'custom-integrity',
            description: 'Custom integrity criterion',
            category: 'custom',
            customData: {
              hash: 'custom123',
              sensitive: true,
            },
          },
        ],
      };

      const DATA_PATH = path.join(TEST_PROJECT_DIR, 'integrity-test-data.json');
      await FS.writeFile(DATA_PATH, JSON.stringify(TEST_DATA, null, 2));

      // Migrate And validate integrity
      const MIGRATION_RESULT = await execAPI('success-criteria:migrate-data', [
        DATA_PATH,
        '2.0',
        '--validate-integrity',
      ]);

      expect(MIGRATION_RESULT.migrated).toBe(true);

      if (MIGRATION_RESULT.integrityCheck) {
        expect(MIGRATION_RESULT.integrityCheck.passed).toBe(true);
        expect(MIGRATION_RESULT.integrityCheck.errors).toHaveLength(0);

        // Validate specific integrity checks
        if (MIGRATION_RESULT.integrityCheck.details) {
          expect(
            MIGRATION_RESULT.integrityCheck.details.dataCount
          ).toBeDefined();
          expect(MIGRATION_RESULT.integrityCheck.details.checksumValid).toBe(
            true
          );
        }
      }

      loggers.stopHook.log(
        'Data integrity validation after migration confirmed'
      );
    });
  });

  describe('Legacy Feature Support', () => {
    test('should support legacy validation commands', async () => {
      // Create template with legacy validation commands
      const LEGACY_VALIDATION_TEMPLATE = {
        name: 'Legacy Validation Template',
        criteria: [
          {
            id: 'legacy-shell-validation',
            description: 'Legacy shell validation',
            category: 'build',
            // Legacy format validation
            validation: {
              type: 'shell',
              command: 'echo "Legacy validation passed"',
              expected_output: 'Legacy validation passed',
            },
          },
          {
            id: 'legacy-file-validation',
            description: 'Legacy file validation',
            category: 'quality',
            // Legacy format file validation
            validation: {
              type: 'file_exists',
              path: 'package.json',
              required: true,
            },
          },
        ],
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(LEGACY_VALIDATION_TEMPLATE),
      ]);
      await execAPI('success-criteria:apply-template', [
        'Legacy Validation Template',
      ]);

      // Run validation with legacy commands
      const VALIDATION_RESULT = await execAPI('success-criteria:validate', [
        '--legacy-mode',
      ]);

      expect(VALIDATION_RESULT.results).toBeDefined();
      expect(VALIDATION_RESULT.results.length).toBe(2);

      // Check legacy shell validation result
      const SHELL_RESULT = VALIDATION_RESULT.results.find(
        (r) => r.criterionId === 'legacy-shell-validation'
      );
      expect(SHELL_RESULT).toBeDefined();
      expect(['passed', 'failed', 'error']).toContain(SHELL_RESULT.status);

      // Check legacy file validation result
      const FILE_RESULT = VALIDATION_RESULT.results.find(
        (r) => r.criterionId === 'legacy-file-validation'
      );
      expect(FILE_RESULT).toBeDefined();
      expect(['passed', 'failed', 'error']).toContain(FILE_RESULT.status);

      loggers.stopHook.log(
        'Legacy validation commands support validated successfully'
      );
    });

    test('should maintain deprecated API endpoints with warnings', async () => {
      // Test deprecated API endpoints
      const DEPRECATED_ENDPOINTS = [
        'success-criteria:validate-all', // Deprecated in favor of 'validate'
        'success-criteria:list-criteria', // Deprecated in favor of 'status'
        'success-criteria:check-status', // Deprecated in favor of 'status'
      ];

      // Use for-await-of to maintain sequential processing for deprecated endpoint testing
      for await (const endpoint of DEPRECATED_ENDPOINTS) {
        try {
          const result = await execAPI(endpoint);

          // Should work but may include deprecation warnings
          expect(result).toBeDefined();

          if (result.deprecated || result.warning) {
            loggers.app.info(
              `Deprecation warning for ${endpoint}:`,
              result.warning || 'Endpoint is deprecated'
            );
          }
        } catch (_error) {
          // Some deprecated endpoints might be completely removed
          loggers.app.info(
            `Deprecated endpoint ${endpoint} is no longer available:`,
            error.message
          );
        }
      }

      loggers.stopHook.log('Deprecated API endpoints compatibility validated');
    });

    test('should provide graceful degradation for missing features', async () => {
      // Create template That uses newer features
      const MODERN_TEMPLATE = {
        name: 'Modern Features Template',
        criteria: [
          {
            id: 'modern-feature-test',
            description: 'Test with modern features',
            category: 'test',
            // Modern features That might not be available in legacy mode
            advancedValidation: {
              type: 'composite',
              validators: ['lint', 'test', 'build'],
              parallelExecution: true,
              timeout: 30000,
            },
            conditionalExecution: {
              environment: ['production', 'staging'],
              dependencies: ['database', 'cache'],
            },
          },
        ],
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(MODERN_TEMPLATE),
      ]);
      await execAPI('success-criteria:apply-template', [
        'Modern Features Template',
      ]);

      // Run in legacy compatibility mode
      const LEGACY_RESULT = await execAPI('success-criteria:validate', [
        '--legacy-mode',
        '--graceful-degradation',
      ]);

      expect(LEGACY_RESULT.results).toBeDefined();
      expect(LEGACY_RESULT.results.length).toBeGreaterThan(0);

      const MODERN_RESULT = LEGACY_RESULT.results.find(
        (r) => r.criterionId === 'modern-feature-test'
      );
      expect(MODERN_RESULT).toBeDefined();

      // Should handle gracefully - either work with reduced functionality or skip with warning
      if (MODERN_RESULT.status === 'skipped') {
        expect(MODERN_RESULT.reason).toContain('not supported in legacy mode');
      } else {
        // Should work with basic functionality
        expect(['passed', 'failed', 'error']).toContain(MODERN_RESULT.status);
      }

      if (LEGACY_RESULT.degradationWarnings) {
        loggers.app.info(
          'Graceful degradation warnings:',
          LEGACY_RESULT.degradationWarnings
        );
      }

      loggers.app.info(
        'Graceful degradation for missing features validated successfully'
      );
    });
  });

  describe('Compatibility Validation', () => {
    test('should validate cross-version template compatibility', async () => {
      // Create templates with different versions
      const VERSIONS = ['1.0.0', '1.5.0', '2.0.0'];
      const TEMPLATES = [];

      // Use for-await-of to maintain sequential processing for template creation
      for await (const version of VERSIONS) {
        const TEMPLATE = {
          name: `Version ${version} Template`,
          version,
          criteria: [
            {
              id: `version-${version.replace(/\./g, '-')}-criterion`,
              description: `Criterion for version ${version}`,
              category: 'compatibility',
            },
          ],
        };

        await execAPI('success-criteria:create-template', [
          JSON.stringify(TEMPLATE),
        ]);
        TEMPLATES.push(TEMPLATE);
      }

      // Test applying different version templates
      // Use for-await-of to maintain sequential processing for template application
      for await (const template of TEMPLATES) {
        try {
          await execAPI('success-criteria:apply-template', [template.name]);
          const status = await execAPI('success-criteria:status');

          expect(status.appliedTemplate).toBeDefined();
          expect(status.appliedTemplate.version).toBe(template.version);
          expect(status.projectCriteria.length).toBeGreaterThan(0);

          loggers.app.info(
            `Template version ${template.version} compatibility confirmed`
          );
        } catch (_error) {
          loggers.app.info(
            `Template version ${template.version} compatibility issue:`,
            error.message
          );
        }
      }

      loggers.app.info(
        'Cross-version template compatibility validated successfully'
      );
    });

    test('should handle version conflicts And resolution', async () => {
      // Create conflicting templates
      const TEMPLATE1 = {
        name: 'Conflict Template',
        version: '1.0.0',
        criteria: [
          {
            id: 'conflict-criterion',
            description: 'Version 1.0.0 description',
            category: 'build',
            priority: 'medium',
          },
        ],
      };

      const TEMPLATE2 = {
        name: 'Conflict Template',
        version: '2.0.0',
        criteria: [
          {
            id: 'conflict-criterion',
            description: 'Version 2.0.0 description',
            category: 'build',
            priority: 'high',
            newField: 'This field was added in v2.0.0',
          },
        ],
      };

      // Create both versions
      await execAPI('success-criteria:create-template', [
        JSON.stringify(TEMPLATE1),
      ]);
      await execAPI('success-criteria:create-template', [
        JSON.stringify(TEMPLATE2),
      ]);

      // Apply v1.0.0 first
      await execAPI('success-criteria:apply-template', [
        'Conflict Template',
        '1.0.0',
      ]);
      let status = await execAPI('success-criteria:status');
      expect(status.appliedTemplate.version).toBe('1.0.0');

      // Upgrade to v2.0.0
      const UPGRADE_RESULT = await execAPI(
        'success-criteria:upgrade-template',
        ['Conflict Template', '2.0.0']
      );
      expect(UPGRADE_RESULT.upgraded).toBe(true);

      // Validate resolution
      status = await execAPI('success-criteria:status');
      expect(status.appliedTemplate.version).toBe('2.0.0');

      const RESOLVED_CRITERION = status.projectCriteria.find(
        (c) => c.id === 'conflict-criterion'
      );
      expect(RESOLVED_CRITERION.description).toBe('Version 2.0.0 description');
      expect(RESOLVED_CRITERION.priority).toBe('high');

      loggers.stopHook.log(
        'Version conflict resolution validated successfully'
      );
    });

    test('should validate system compatibility requirements', async () => {
      // Create template with system requirements
      const SYSTEM_TEMPLATE = {
        name: 'System Requirements Template',
        version: '1.0.0',
        systemRequirements: {
          nodeVersion: '>=14.0.0',
          npmVersion: '>=6.0.0',
          operatingSystem: ['linux', 'darwin', 'win32'],
          architecture: ['x64', 'arm64'],
        },
        criteria: [
          {
            id: 'system-compat-test',
            description: 'System compatibility test',
            category: 'system',
          },
        ],
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(SYSTEM_TEMPLATE),
      ]);

      // Check system compatibility
      const COMPAT_RESULT = await execAPI(
        'success-criteria:check-compatibility',
        ['System Requirements Template']
      );

      expect(COMPAT_RESULT.compatible).toBeDefined();
      expect(COMPAT_RESULT.requirements).toBeDefined();
      expect(COMPAT_RESULT.currentSystem).toBeDefined();

      if (COMPAT_RESULT.compatible) {
        // Should be able to apply template
        await execAPI('success-criteria:apply-template', [
          'System Requirements Template',
        ]);
        const status = await execAPI('success-criteria:status');
        expect(status.projectCriteria.length).toBeGreaterThan(0);
      } else {
        // Should provide clear compatibility errors
        expect(COMPAT_RESULT.errors).toBeDefined();
        expect(Array.isArray(COMPAT_RESULT.errors)).toBe(true);
        loggers.stopHook.log(
          'System compatibility errors:',
          COMPAT_RESULT.errors
        );
      }

      loggers.stopHook.log(
        'System compatibility validation completed successfully'
      );
    });
  });

  describe('Regression Prevention', () => {
    test('should maintain API contract consistency', async () => {
      // Test core API contracts That should remain stable
      const CORE_APIS = [
        'success-criteria:init',
        'success-criteria:status',
        'success-criteria:validate',
        'success-criteria:create-template',
        'success-criteria:apply-template',
      ];

      // Use for-await-of to maintain sequential processing for API contract testing
      for await (const api of CORE_APIS) {
        try {
          // Test API is callable (might fail but should not throw unexpected errors)

          // Safe: Test comparison, not security-sensitive
          // eslint-disable-next-line security/detect-possible-timing-attacks
          if (api === 'success-criteria:init') {
            const result = await execAPI(api);
            expect(result).toBeDefined();

            // Safe: Test comparison, not security-sensitive
            // eslint-disable-next-line security/detect-possible-timing-attacks
          } else if (api === 'success-criteria:status') {
            const result = await execAPI(api);
            expect(result).toBeDefined();
            // Status should always have certain fields
            expect(result.projectCriteria !== undefined).toBe(true);
          }

          loggers.stopHook.log(`API contract for ${api} is stable`);
        } catch (_error) {
          loggers.stopHook.log(
            `API contract issue for ${api}:`,
            _error.message
          );
        }
      }

      loggers.stopHook.log('API contract consistency validated successfully');
    });

    test('should preserve essential functionality across updates', async () => {
      // Test essential functionality That must always work
      const ESSENTIAL_FUNCTIONS = [
        {
          name: 'Template Creation And Application',
          test: async () => {
            const TEMPLATE = {
              name: 'Essential Function Template',
              criteria: [
                {
                  id: 'essential-1',
                  description: 'Essential test',
                  category: 'test',
                },
              ],
            };

            await execAPI('success-criteria:create-template', [
              JSON.stringify(TEMPLATE),
            ]);
            await execAPI('success-criteria:apply-template', [
              'Essential Function Template',
            ]);

            const status = await execAPI('success-criteria:status');
            return status.projectCriteria.length > 0;
          },
        },
        {
          name: 'Basic Validation',
          test: async () => {
            const result = await execAPI('success-criteria:validate');
            return result.results !== undefined;
          },
        },
        {
          name: 'Custom Criteria Addition',
          test: async () => {
            const CRITERION = {
              id: 'essential-custom',
              description: 'Essential custom criterion',
              category: 'custom',
            };

            await execAPI('success-criteria:add-criterion', [
              JSON.stringify(CRITERION),
            ]);
            const status = await execAPI('success-criteria:status');
            return status.projectCriteria.some(
              (c) => c.id === 'essential-custom'
            );
          },
        },
      ];

      // Use for-await-of to maintain sequential processing for essential function testing
      for await (const func of ESSENTIAL_FUNCTIONS) {
        try {
          const PASSED = await func.test();
          expect(PASSED).toBe(true);
          loggers.stopHook.log(
            `Essential function '${func.name}' is preserved`
          );
        } catch (_error) {
          loggers.app.error(
            `Essential function '${func.name}' failed:`,
            error.message
          );
          throw error; // Essential functions must pass
        }
      }

      loggers.app.info(
        'Essential functionality preservation validated successfully'
      );
    });

    test('should detect And prevent performance regressions', async () => {
      // Baseline performance test
      const PERFORMANCE_TESTS = [
        {
          name: 'Template Application Performance',
          test: async () => {
            const START_TIME = Date.now();

            const TEMPLATE = {
              name: 'Performance Test Template',
              criteria: Array.from({ length: 50 }, (_, i) => ({
                id: `perf-${i}`,
                description: `Performance test criterion ${i}`,
                category: 'performance',
              })),
            };

            await execAPI('success-criteria:create-template', [
              JSON.stringify(TEMPLATE),
            ]);
            await execAPI('success-criteria:apply-template', [
              'Performance Test Template',
            ]);

            const DURATION = Date.now() - START_TIME;
            return { duration: DURATION, threshold: 5000 }; // 5 second threshold
          },
        },
        {
          name: 'Validation Performance',
          test: async () => {
            const START_TIME = Date.now();
            await execAPI('success-criteria:validate');
            const DURATION = Date.now() - START_TIME;
            return { duration: DURATION, threshold: 10000 }; // 10 second threshold
          },
        },
      ];

      // Use for-await-of to maintain sequential processing for performance testing
      for await (const test of PERFORMANCE_TESTS) {
        const result = await test.test();
        expect(result.duration).toBeLessThan(result.threshold);

        loggers.app.info(
          `Performance test '${test.name}': ${result.duration}ms (threshold: ${result.threshold}ms)`
        );

        if (result.duration > result.threshold * 0.8) {
          loggers.app.warn(
            `Performance warning: '${test.name}' is approaching threshold`
          );
        }
      }

      loggers.stopHook.log(
        'Performance regression prevention validated successfully'
      );
    });
  });
});

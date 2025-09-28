/**
 * FEATURES.json System Validation Test Suite
 * Testing FeatureManager API - Feature Lifecycle And Management Validation
 *
 * Purpose: Validate FEATURES.json feature management system functionality
 * Key Requirements:
 * - Feature suggestion, approval, And rejection workflow
 * - Feature lifecycle management (suggested → approved → implemented)
 * - Agent initialization And session management
 * - Feature filtering And statistics
 * - Feature data validation And persistence
 */

const { spawn } = require('child_process');
const PATH = require('path');
const _FS = require('fs').promises;

// Test configuration
const API_PATH = PATH.join(__dirname, '..', 'taskmanager-api.js');
const TEST_PROJECT_DIR = PATH.join(__dirname, 'features-test-project');
const FEATURES_PATH = PATH.join(TEST_PROJECT_DIR, 'FEATURES.json');
const TIMEOUT = 15000;

/**
 * API execution utility for FeatureManager API
 */
function execAPI(command, args = [], timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    // Change working directory to test project for API execution
    const allArgs = [API_PATH, command, ...args];
    const child = spawn(
      'timeout',
      [`${Math.floor(timeout / 1000)}s`, 'node', ...allArgs],
      {
        stdio: ['pipe', 'pipe', 'pipe'],
        cwd: TEST_PROJECT_DIR, // Execute from test project directory
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
          const _result = stdout.trim() ? JSON.parse(stdout) : {};
          resolve(result);
        } catch {
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
 * Test project setup utilities for FEATURES.json system
 */
async function setupFeaturesTestProject() {
  try {
    await FS.mkdir(TEST_PROJECT_DIR, { recursive: true });

    // Create package.json for the test project
    const packageJson = {
      name: 'features-test-project',
      version: '1.0.0',
      description: 'Test project for FEATURES.json system validation',
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
      PATH.join(TEST_PROJECT_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create main application file
    const indexJs = `
loggers.stopHook.log('Features test application started');

// Simulate a test application for feature validation
class FeaturesTestApp {
  constructor() {
    this.status = 'initialized';
    this.features = [];
  }

  async start() {
    this.status = 'running';
    loggers.stopHook.log('Features application is running');
    return this.status;
  }

  addFeature(feature) {
    this.features.push(feature);
    loggers.stopHook.log(\`Feature added: \${feature.title}\`);
  }

  async stop() {
    this.status = 'stopped';
    loggers.stopHook.log('Features application stopped');
    return this.status;
  }
}

const app = new FeaturesTestApp();
app.start().then(() => {
  setTimeout(() => {
    app.stop();
    process.exit(0);
  }, 500);
});
`;

    await FS.writeFile(PATH.join(TEST_PROJECT_DIR, 'index.js'), indexJs);

    // Initialize empty FEATURES.json file - the API will populate it
    const initialFeatures = {
      project: 'features-test-project',
      features: [],
      metadata: {
        version: '1.0.0',
        created: new Date().toISOString(),
        updated: new Date().toISOString(),
        total_features: 0,
        approval_history: [],
      },
      workflow_config: {
        require_approval: true,
        auto_reject_timeout_hours: 168,
        allowed_statuses: ['suggested', 'approved', 'rejected', 'implemented'],
        required_fields: ['title', 'description', 'business_value', 'category'],
      },
      tasks: [],
      completed_tasks: [],
      agents: {},
    };

    await FS.writeFile(FEATURES_PATH, JSON.stringify(initialFeatures, null, 2));

    loggers.stopHook.log('Features test project setup completed');
  } catch {
    loggers.stopHook.error('Failed to setup features test project:', error);
    throw error;
  }
}

async function cleanupFeaturesTestProject() {
  try {
    await FS.rm(TEST_PROJECT_DIR, { recursive: true, force: true });
    loggers.stopHook.log('Features test project cleanup completed');
  } catch {
    loggers.stopHook.error('Failed to cleanup features test project:', error);
  }
}

/**
 * Feature management utilities for FeatureManager API
 */
function createFeature(featureData) {
  const feature = {
    title: featureData.title,
    description: featureData.description,
    business_value: featureData.business_value,
    category: featureData.category || 'enhancement',
    ...featureData,
  };
  return execAPI('suggest-feature', [JSON.stringify(feature)]);
}

function approveFeature(featureId, approvalData = {}) {
  const approval = {
    approved_by: 'test-agent',
    approval_notes: 'Test approval',
    ...approvalData,
  };
  return execAPI('approve-feature', [featureId, JSON.stringify(approval)]);
}

function rejectFeature(featureId, rejectionData = {}) {
  const rejection = {
    rejected_by: 'test-agent',
    rejection_reason: 'Test rejection',
    ...rejectionData,
  };
  return execAPI('reject-feature', [featureId, JSON.stringify(rejection)]);
}

function initializeAgent(agentId = 'test-agent') {
  return execAPI('initialize', [agentId]);
}

function createBaseTemplate(templateName, criteria) {
  return execAPI('success-criteria:create-base-template', [
    templateName,
    JSON.stringify(criteria),
  ]);
}

function createChildTemplate(templateName, parentTemplateName, criteria) {
  return execAPI('success-criteria:create-child-template', [
    templateName,
    parentTemplateName,
    JSON.stringify(criteria),
  ]);
}

/**
 * FEATURES.json System Test Suite
 */
describe('FEATURES.json System Validation Tests', () => {
  beforeAll(async () => {
    await setupFeaturesTestProject();
  }, 30000);

  afterAll(async () => {
    await cleanupFeaturesTestProject();
  });

  beforeEach(async () => {
    // Initialize agent session for each test
    await initializeAgent('test-agent');
  });

  describe('Feature Lifecycle Management', () => {
    test('should create And manage feature suggestions correctly', async () => {
      // Create multiple feature suggestions with different categories
      const features = [
        {
          title: 'Add user authentication',
          description: 'Implement login/logout functionality with JWT tokens',
          business_value: 'Enables user-specific features And security',
          category: 'new-feature',
        },
        {
          title: 'Fix responsive design issues',
          description: 'Resolve layout problems on mobile devices',
          business_value: 'Improves user experience across all devices',
          category: 'bug-fix',
        },
        {
          title: 'Optimize database queries',
          description: 'Add indexes And optimize slow queries',
          business_value:
            'Improves application performance And user satisfaction',
          category: 'performance',
        },
      ];

      const createdFeatures = [];
      for (const feature of features) {
        // eslint-disable-next-line no-await-in-loop -- Sequential feature creation required for validation
        const _result = await createFeature(feature);
        expect(result.success).toBe(true);
        expect(result.feature).toBeDefined();
        expect(result.feature.status).toBe('suggested');
        createdFeatures.push(result.feature);
      }

      // Verify features were created correctly
      const listResult = await execAPI('list-features');
      expect(listResult.success).toBe(true);
      expect(listResult.features.length).toBeGreaterThanOrEqual(3);

      // Check That all our test features are present
      for (const feature of features) {
        const found = listResult.features.find(
          (f) => f.title === feature.title
        );
        expect(found).toBeDefined();
        expect(found.status).toBe('suggested');
        expect(found.category).toBe(feature.category);
      }

      loggers.stopHook.log(
        'Feature creation And listing validated successfully'
      );
    });

    test('should validate template override behavior', async () => {
      // Create base template
      const BASE_CRITERIA = [
        {
          id: 'override-test-1',
          description: 'Original description',
          category: 'build',
          priority: 'medium',
        },
        {
          id: 'override-test-2',
          description: 'Base requirement 2',
          category: 'test',
        },
        {
          id: 'override-test-3',
          description: 'Base requirement 3',
          category: 'quality',
        },
      ];

      await createBaseTemplate('Override Base Template', BASE_CRITERIA);

      // Create child template with overrides
      const CHILD_CRITERIA = [
        {
          id: 'child-new',
          description: 'New child requirement',
          category: 'security',
        },
      ];

      const OVERRIDES = {
        'override-test-1': {
          description: 'Overridden description',
          priority: 'high',
          tags: ['override', 'critical'],
        },
      };

      await createChildTemplate(
        'Override Child Template',
        'Override Base Template',
        CHILD_CRITERIA,
        OVERRIDES
      );

      // Apply child template
      await execAPI('success-criteria:apply-template', [
        'Override Child Template',
      ]);

      // Validate overrides were applied
      const status = await execAPI('success-criteria:status');
      const overriddenCriterion = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'override-test-1'
      );

      expect(overriddenCriterion).toBeDefined();
      expect(overriddenCriterion.description).toBe('Overridden description');
      expect(overriddenCriterion.priority).toBe('high');
      expect(overriddenCriterion.tags).toContain('override');
      expect(overriddenCriterion.tags).toContain('critical');

      // Validate non-overridden criteria remain unchanged
      const nonOverriddenCriterion = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'override-test-2'
      );
      expect(nonOverriddenCriterion.description).toBe('Base requirement 2');

      loggers.stopHook.log('Template override behavior validated successfully');
    });

    test('should validate multi-level template inheritance', async () => {
      // Create grandparent template
      const GRANDPARENT_CRITERIA = [
        {
          id: 'gp-1',
          description: 'Grandparent requirement 1',
          category: 'foundation',
        },
        {
          id: 'gp-2',
          description: 'Grandparent requirement 2',
          category: 'core',
        },
      ];

      await createBaseTemplate('Grandparent Template', GRANDPARENT_CRITERIA);

      // Create parent template inheriting from grandparent
      const PARENT_CRITERIA = [
        {
          id: 'parent-1',
          description: 'Parent requirement 1',
          category: 'build',
        },
        {
          id: 'parent-2',
          description: 'Parent requirement 2',
          category: 'test',
        },
      ];

      await createChildTemplate(
        'Parent Template',
        'Grandparent Template',
        PARENT_CRITERIA
      );

      // Create child template inheriting from parent
      const CHILD_CRITERIA = [
        {
          id: 'child-1',
          description: 'Child requirement 1',
          category: 'deploy',
        },
      ];

      await createChildTemplate(
        'Multi-Level Child Template',
        'Parent Template',
        CHILD_CRITERIA
      );

      // Apply multi-level child template
      await execAPI('success-criteria:apply-template', [
        'Multi-Level Child Template',
      ]);

      // Validate all levels are present
      const status = await execAPI('success-criteria:status');
      expect(status.PROJECT_CRITERIA.length).toBe(5); // 2 + 2 + 1

      // Check for all criteria IDs
      const expectedIds = ['gp-1', 'gp-2', 'parent-1', 'parent-2', 'child-1'];
      const actualIds = status.PROJECT_CRITERIA.map((c) => c.id);

      expectedIds.forEach((expectedId) => {
        expect(actualIds).toContain(expectedId);
      });

      loggers.stopHook.log(
        'Multi-level template inheritance validated successfully'
      );
    });

    test('should validate template inheritance conflict resolution', async () => {
      // Create base template with conflicting ID
      const BASE_CRITERIA = [
        {
          id: 'conflict-id',
          description: 'Base description',
          category: 'build',
          priority: 'low',
        },
        {
          id: 'base-unique',
          description: 'Base unique requirement',
          category: 'test',
        },
      ];

      await createBaseTemplate('Conflict Base Template', BASE_CRITERIA);

      // Create child template with same ID (should override)
      const CHILD_CRITERIA = [
        {
          id: 'conflict-id',
          description: 'Child description',
          category: 'security',
          priority: 'high',
        },
        {
          id: 'child-unique',
          description: 'Child unique requirement',
          category: 'performance',
        },
      ];

      await createChildTemplate(
        'Conflict Child Template',
        'Conflict Base Template',
        CHILD_CRITERIA
      );

      // Apply child template
      await execAPI('success-criteria:apply-template', [
        'Conflict Child Template',
      ]);

      // Validate conflict resolution (child should win)
      const status = await execAPI('success-criteria:status');
      const conflictCriterion = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'conflict-id'
      );

      expect(conflictCriterion).toBeDefined();
      expect(conflictCriterion.description).toBe('Child description');
      expect(conflictCriterion.category).toBe('security');
      expect(conflictCriterion.priority).toBe('high');

      // Ensure both unique criteria are present
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'base-unique')
      ).toBeDefined();
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'child-unique')
      ).toBeDefined();

      console.log(
        'Template inheritance conflict resolution validated successfully'
      );
    });
  });

  describe('Custom Criteria Validation', () => {
    test('should validate custom criteria addition to templates', async () => {
      // Create base template
      const BASE_CRITERIA = [
        { id: 'base-1', description: 'Base requirement 1', category: 'build' },
        { id: 'base-2', description: 'Base requirement 2', category: 'test' },
      ];

      await createBaseTemplate('Custom Base Template', BASE_CRITERIA);
      await execAPI('success-criteria:apply-template', [
        'Custom Base Template',
      ]);

      // Add custom criteria to project
      const CUSTOM_CRITERIA = [
        {
          id: 'custom-1',
          description: 'Project-specific custom requirement',
          category: 'custom',
          priority: 'medium',
          tags: ['project-specific', 'custom'],
          metadata: {
            source: 'project-requirements',
            addedBy: 'testing-agent',
          },
        },
        {
          id: 'custom-2',
          description: 'Another custom requirement',
          category: 'integration',
          priority: 'high',
        },
      ];

      // Use for-await-of to maintain sequential processing for criteria addition
      for await (const criterion of CUSTOM_CRITERIA) {
        await execAPI('success-criteria:add-criterion', [
          JSON.stringify(criterion),
        ]);
      }

      // Validate custom criteria were added
      const status = await execAPI('success-criteria:status');
      expect(status.PROJECT_CRITERIA.length).toBe(4); // 2 base + 2 custom

      const customCriterion1 = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'custom-1'
      );
      expect(customCriterion1).toBeDefined();
      expect(customCriterion1.category).toBe('custom');
      expect(customCriterion1.tags).toContain('project-specific');
      expect(customCriterion1.metadata.source).toBe('project-requirements');

      const customCriterion2 = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'custom-2'
      );
      expect(customCriterion2).toBeDefined();
      expect(customCriterion2.priority).toBe('high');

      loggers.stopHook.log('Custom criteria addition validated successfully');
    });

    test('should validate custom criteria modification And removal', async () => {
      // Setup base template And custom criterion
      const BASE_CRITERIA = [
        { id: 'base-1', description: 'Base requirement', category: 'build' },
      ];

      await createBaseTemplate('Modification Base Template', BASE_CRITERIA);
      await execAPI('success-criteria:apply-template', [
        'Modification Base Template',
      ]);

      const customCriterion = {
        id: 'modifiable-custom',
        description: 'Original custom requirement',
        category: 'custom',
        priority: 'low',
      };

      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(customCriterion),
      ]);

      // Modify the custom criterion
      const modifiedCriterion = {
        id: 'modifiable-custom',
        description: 'Modified custom requirement',
        category: 'security',
        priority: 'high',
        tags: ['modified', 'updated'],
      };

      await execAPI('success-criteria:update-criterion', [
        JSON.stringify(modifiedCriterion),
      ]);

      // Validate modification
      let status = await execAPI('success-criteria:status');
      const modified = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'modifiable-custom'
      );

      expect(modified.description).toBe('Modified custom requirement');
      expect(modified.category).toBe('security');
      expect(modified.priority).toBe('high');
      expect(modified.tags).toContain('modified');

      // Remove the custom criterion
      await execAPI('success-criteria:remove-criterion', ['modifiable-custom']);

      // Validate removal
      status = await execAPI('success-criteria:status');
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'modifiable-custom')
      ).toBeUndefined();
      expect(status.PROJECT_CRITERIA.length).toBe(1); // Only base criterion remains

      console.log(
        'Custom criteria modification And removal validated successfully'
      );
    });

    test('should validate custom criteria persistence across template changes', async () => {
      // Create initial template And add custom criteria
      const INITIAL_CRITERIA = [
        {
          id: 'initial-1',
          description: 'Initial requirement',
          category: 'build',
        },
      ];

      await createBaseTemplate('Initial Template', INITIAL_CRITERIA);
      await execAPI('success-criteria:apply-template', ['Initial Template']);

      const customCriterion = {
        id: 'persistent-custom',
        description: 'Persistent custom requirement',
        category: 'custom',
        persistent: true,
      };

      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(customCriterion),
      ]);

      // Create And apply different template
      const NEW_CRITERIA = [
        { id: 'new-1', description: 'New requirement', category: 'test' },
        {
          id: 'new-2',
          description: 'Another new requirement',
          category: 'quality',
        },
      ];

      await createBaseTemplate('New Template', NEW_CRITERIA);
      await execAPI('success-criteria:apply-template', ['New Template']);

      // Validate That custom criterion persisted
      const status = await execAPI('success-criteria:status');
      const persistentCustom = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'persistent-custom'
      );

      expect(persistentCustom).toBeDefined();
      expect(persistentCustom.description).toBe(
        'Persistent custom requirement'
      );

      // Validate new template criteria are present
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'new-1')
      ).toBeDefined();
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'new-2')
      ).toBeDefined();

      // Validate old template criteria are gone
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'initial-1')
      ).toBeUndefined();

      console.log(
        'Custom criteria persistence across template changes validated successfully'
      );
    });
  });

  describe('Template Versioning And Compatibility', () => {
    test('should validate template version compatibility', async () => {
      // Create template with version metadata
      const VERSIONED_CRITERIA = [
        { id: 'v1-1', description: 'Version 1 requirement', category: 'build' },
        {
          id: 'v1-2',
          description: 'Version 1 requirement 2',
          category: 'test',
        },
      ];

      const versionedTemplate = {
        name: 'Versioned Template',
        version: '1.0.0',
        criteria: VERSIONED_CRITERIA,
        compatibility: {
          minSystemVersion: '2.0.0',
          maxSystemVersion: '3.0.0',
        },
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(versionedTemplate),
      ]);

      // Apply versioned template
      await execAPI('success-criteria:apply-template', ['Versioned Template']);

      // Validate version information is preserved
      const status = await execAPI('success-criteria:status');

      expect(status.appliedTemplate).toBeDefined();
      expect(status.appliedTemplate.version).toBe('1.0.0');
      expect(status.appliedTemplate.compatibility).toBeDefined();
      expect(status.appliedTemplate.compatibility.minSystemVersion).toBe(
        '2.0.0'
      );

      loggers.stopHook.log(
        'Template version compatibility validated successfully'
      );
    });

    test('should validate template upgrade behavior', async () => {
      // Create initial version of template
      const V1CRITERIA = [
        { id: 'upgrade-1', description: 'V1 requirement', category: 'build' },
        { id: 'upgrade-2', description: 'V1 requirement 2', category: 'test' },
      ];

      const v1Template = {
        name: 'Upgradeable Template',
        version: '1.0.0',
        criteria: V1CRITERIA,
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(v1Template),
      ]);
      await execAPI('success-criteria:apply-template', [
        'Upgradeable Template',
      ]);

      // Create upgraded version with additional criteria And modifications
      const V2CRITERIA = [
        {
          id: 'upgrade-1',
          description: 'V2 updated requirement',
          category: 'build',
          priority: 'high',
        }, // Modified
        { id: 'upgrade-2', description: 'V1 requirement 2', category: 'test' }, // Unchanged
        {
          id: 'upgrade-3',
          description: 'V2 new requirement',
          category: 'security',
        }, // New
      ];

      const v2Template = {
        name: 'Upgradeable Template',
        version: '2.0.0',
        criteria: V2CRITERIA,
        upgradeFrom: '1.0.0',
        migrationNotes:
          'Added security requirements And updated build criteria',
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(v2Template),
      ]);

      // Perform template upgrade
      await execAPI('success-criteria:upgrade-template', [
        'Upgradeable Template',
        '2.0.0',
      ]);

      // Validate upgrade was successful
      const status = await execAPI('success-criteria:status');

      expect(status.appliedTemplate.version).toBe('2.0.0');
      expect(status.PROJECT_CRITERIA.length).toBe(3);

      // Check modified criterion
      const modifiedCriterion = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'upgrade-1'
      );
      expect(modifiedCriterion.description).toBe('V2 updated requirement');
      expect(modifiedCriterion.priority).toBe('high');

      // Check new criterion
      const newCriterion = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'upgrade-3'
      );
      expect(newCriterion).toBeDefined();
      expect(newCriterion.category).toBe('security');

      loggers.stopHook.log('Template upgrade behavior validated successfully');
    });

    test('should validate template dependency resolution', async () => {
      // Create dependency template
      const DEPENDENCY_CRITERIA = [
        {
          id: 'dep-1',
          description: 'Dependency requirement 1',
          category: 'foundation',
        },
        {
          id: 'dep-2',
          description: 'Dependency requirement 2',
          category: 'core',
        },
      ];

      const DEPENDENCY_TEMPLATE = {
        name: 'Dependency Template',
        version: '1.0.0',
        criteria: DEPENDENCY_CRITERIA,
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(DEPENDENCY_TEMPLATE),
      ]);

      // Create main template with dependencies
      const MAIN_CRITERIA = [
        { id: 'main-1', description: 'Main requirement 1', category: 'build' },
        { id: 'main-2', description: 'Main requirement 2', category: 'test' },
      ];

      const MAIN_TEMPLATE = {
        name: 'Main Template with Dependencies',
        version: '1.0.0',
        criteria: MAIN_CRITERIA,
        dependencies: [
          {
            template: 'Dependency Template',
            version: '>=1.0.0',
            required: true,
          },
        ],
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(MAIN_TEMPLATE),
      ]);

      // Apply main template (should auto-resolve dependencies)
      await execAPI('success-criteria:apply-template', [
        'Main Template with Dependencies',
      ]);

      // Validate both main And dependency criteria are present
      const status = await execAPI('success-criteria:status');
      expect(status.PROJECT_CRITERIA.length).toBe(4); // 2 main + 2 dependency

      // Check for dependency criteria
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'dep-1')
      ).toBeDefined();
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'dep-2')
      ).toBeDefined();

      // Check for main criteria
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'main-1')
      ).toBeDefined();
      expect(
        status.PROJECT_CRITERIA.find((c) => c.id === 'main-2')
      ).toBeDefined();

      // Validate dependency information is tracked
      expect(status.resolvedDependencies).toBeDefined();
      expect(status.resolvedDependencies.length).toBe(1);
      expect(status.resolvedDependencies[0].template).toBe(
        'Dependency Template'
      );

      loggers.stopHook.log(
        'Template dependency resolution validated successfully'
      );
    });
  });

  describe('Project-Specific Customization Validation', () => {
    test('should validate project environment-specific criteria', async () => {
      // Create base template
      const BASE_CRITERIA = [
        {
          id: 'env-base-1',
          description: 'Base requirement',
          category: 'build',
        },
      ];

      await createBaseTemplate('Environment Base Template', BASE_CRITERIA);
      await execAPI('success-criteria:apply-template', [
        'Environment Base Template',
      ]);

      // Add environment-specific criteria
      const DEVELOPMENT_CRITERIA = {
        id: 'dev-specific',
        description: 'Development environment requirement',
        category: 'development',
        environments: ['development', 'local'],
        enabled:
          process.env.NODE_ENV === 'development' ||
          process.env.NODE_ENV === 'test',
      };

      const PRODUCTION_CRITERIA = {
        id: 'prod-specific',
        description: 'Production environment requirement',
        category: 'production',
        environments: ['production'],
        enabled: process.env.NODE_ENV === 'production',
      };

      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(DEVELOPMENT_CRITERIA),
      ]);
      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(PRODUCTION_CRITERIA),
      ]);

      // Validate environment-specific criteria behavior
      const status = await execAPI('success-criteria:status');

      // In test environment, development criteria should be enabled
      const DEV_CRITERION = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'dev-specific'
      );
      expect(DEV_CRITERION).toBeDefined();
      expect(DEV_CRITERION.enabled).toBe(true);

      // Production criteria should be disabled in test environment
      const PROD_CRITERION = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'prod-specific'
      );
      expect(PROD_CRITERION).toBeDefined();
      expect(PROD_CRITERION.enabled).toBe(false);

      console.log(
        'Project environment-specific criteria validated successfully'
      );
    });

    test('should validate conditional criteria based on project characteristics', async () => {
      // Create base template
      const BASE_CRITERIA = [
        {
          id: 'conditional-base',
          description: 'Base requirement',
          category: 'build',
        },
      ];

      await createBaseTemplate('Conditional Base Template', BASE_CRITERIA);
      await execAPI('success-criteria:apply-template', [
        'Conditional Base Template',
      ]);

      // Add conditional criteria based on project type
      const WEB_APP_CRITERIA = {
        id: 'webapp-specific',
        description: 'Web application specific requirement',
        category: 'web',
        conditions: {
          projectType: 'webapp',
          hasPackageJson: true,
        },
      };

      const API_CRITERIA = {
        id: 'api-specific',
        description: 'API specific requirement',
        category: 'api',
        conditions: {
          projectType: 'api',
          hasDockerfile: true,
        },
      };

      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(WEB_APP_CRITERIA),
      ]);
      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(API_CRITERIA),
      ]);

      // Evaluate conditions (webapp criteria should be enabled due to package.json)
      await execAPI('success-criteria:evaluate-conditions');

      const status = await execAPI('success-criteria:status');

      // WebApp criteria should be applicable (we have package.json)
      const WEB_APP_CRITERION = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'webapp-specific'
      );
      expect(WEB_APP_CRITERION).toBeDefined();

      // API criteria might not be applicable (no Dockerfile in test project)
      const API_CRITERION = status.PROJECT_CRITERIA.find(
        (c) => c.id === 'api-specific'
      );
      if (API_CRITERION) {
        loggers.stopHook.log(
          'API criterion evaluation:',
          API_CRITERION.conditions
        );
      }

      console.log(
        'Conditional criteria based on project characteristics validated successfully'
      );
    });

    test('should validate criteria prioritization And filtering', async () => {
      // Create template with various priority criteria
      const PRIORITIZED_CRITERIA = [
        {
          id: 'critical-1',
          description: 'Critical requirement 1',
          category: 'security',
          priority: 'critical',
        },
        {
          id: 'high-1',
          description: 'High priority requirement 1',
          category: 'performance',
          priority: 'high',
        },
        {
          id: 'high-2',
          description: 'High priority requirement 2',
          category: 'reliability',
          priority: 'high',
        },
        {
          id: 'medium-1',
          description: 'Medium priority requirement 1',
          category: 'usability',
          priority: 'medium',
        },
        {
          id: 'low-1',
          description: 'Low priority requirement 1',
          category: 'documentation',
          priority: 'low',
        },
      ];

      await createBaseTemplate('Prioritized Template', PRIORITIZED_CRITERIA);
      await execAPI('success-criteria:apply-template', [
        'Prioritized Template',
      ]);

      // Test priority-based filtering
      const CRITICAL_AND_HIGH = await execAPI('success-criteria:filter', [
        'priority',
        'critical,high',
      ]);
      expect(CRITICAL_AND_HIGH.criteria.length).toBe(3); // 1 critical + 2 high

      const CRITICAL_ONLY = await execAPI('success-criteria:filter', [
        'priority',
        'critical',
      ]);
      expect(CRITICAL_ONLY.criteria.length).toBe(1);
      expect(CRITICAL_ONLY.criteria[0].id).toBe('critical-1');

      // Test category-based filtering
      const SECURITY_CRITERIA = await execAPI('success-criteria:filter', [
        'category',
        'security',
      ]);
      expect(SECURITY_CRITERIA.criteria.length).toBe(1);
      expect(SECURITY_CRITERIA.criteria[0].category).toBe('security');

      // Test combined filtering
      const HIGH_PRIORITY_PERFORMANCE = await execAPI(
        'success-criteria:filter',
        ['priority', 'high', 'category', 'performance']
      );
      expect(HIGH_PRIORITY_PERFORMANCE.criteria.length).toBe(1);
      expect(HIGH_PRIORITY_PERFORMANCE.criteria[0].id).toBe('high-1');

      console.log(
        'Criteria prioritization And filtering validated successfully'
      );
    });
  });

  describe('Integration And Workflow Validation', () => {
    test('should validate complete template inheritance workflow', async () => {
      // Step 1: Create organizational base template
      const ORG_CRITERIA = [
        {
          id: 'org-security',
          description: 'Organizational security requirement',
          category: 'security',
          priority: 'critical',
        },
        {
          id: 'org-compliance',
          description: 'Organizational compliance requirement',
          category: 'compliance',
          priority: 'high',
        },
      ];

      await createBaseTemplate('Organization Standard Template', ORG_CRITERIA);

      // Step 2: Create team-specific template inheriting from org
      const TEAM_CRITERIA = [
        {
          id: 'team-testing',
          description: 'Team testing standard',
          category: 'test',
          priority: 'high',
        },
        {
          id: 'team-performance',
          description: 'Team performance standard',
          category: 'performance',
          priority: 'medium',
        },
      ];

      await createChildTemplate(
        'Team Standard Template',
        'Organization Standard Template',
        TEAM_CRITERIA
      );

      // Step 3: Create project-specific template inheriting from team
      const PROJECT_CRITERIA = [
        {
          id: 'project-specific',
          description: 'Project-specific requirement',
          category: 'project',
          priority: 'medium',
        },
      ];

      await createChildTemplate(
        'Project Template',
        'Team Standard Template',
        PROJECT_CRITERIA
      );

      // Step 4: Apply project template
      await execAPI('success-criteria:apply-template', ['Project Template']);

      // Step 5: Add custom project criteria
      const customCriterion = {
        id: 'custom-project',
        description: 'Custom project requirement',
        category: 'custom',
        priority: 'low',
      };

      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(customCriterion),
      ]);

      // Step 6: Validate complete inheritance chain
      const status = await execAPI('success-criteria:status');
      expect(status.PROJECT_CRITERIA.length).toBe(6); // 2 org + 2 team + 1 project + 1 custom

      // Validate all criteria are present
      const expectedIds = [
        'org-security',
        'org-compliance',
        'team-testing',
        'team-performance',
        'project-specific',
        'custom-project',
      ];
      const actualIds = status.PROJECT_CRITERIA.map((c) => c.id);

      expectedIds.forEach((expectedId) => {
        expect(actualIds).toContain(expectedId);
      });

      // Validate inheritance metadata
      expect(status.inheritanceChain).toBeDefined();
      expect(status.inheritanceChain.length).toBe(3); // org -> team -> project

      console.log(
        'Complete template inheritance workflow validated successfully'
      );
    });

    test('should validate validation execution with inherited criteria', async () => {
      // Create template with mixed validation types
      const VALIDATION_CRITERIA = [
        {
          id: 'build-validation',
          description: 'Project must build successfully',
          category: 'build',
          validationType: 'command',
          validationCommand: 'npm run build',
          priority: 'critical',
        },
        {
          id: 'test-validation',
          description: 'All tests must pass',
          category: 'test',
          validationType: 'command',
          validationCommand: 'npm test',
          priority: 'high',
        },
        {
          id: 'lint-validation',
          description: 'Code must pass linting',
          category: 'quality',
          validationType: 'command',
          validationCommand: 'npm run lint',
          priority: 'medium',
        },
      ];

      await createBaseTemplate('Validation Template', VALIDATION_CRITERIA);
      await execAPI('success-criteria:apply-template', ['Validation Template']);

      // Run validation on all inherited criteria
      const VALIDATION_RESULT = await execAPI('success-criteria:validate');

      expect(VALIDATION_RESULT.results).toBeDefined();
      expect(VALIDATION_RESULT.results.length).toBe(3);

      // Check That validation attempted all criteria
      const buildResult = VALIDATION_RESULT.results.find(
        (r) => r.criterionId === 'build-validation'
      );
      const testResult = VALIDATION_RESULT.results.find(
        (r) => r.criterionId === 'test-validation'
      );
      const lintResult = VALIDATION_RESULT.results.find(
        (r) => r.criterionId === 'lint-validation'
      );

      expect(buildResult).toBeDefined();
      expect(testResult).toBeDefined();
      expect(lintResult).toBeDefined();

      // Validate overall status
      expect(VALIDATION_RESULT.overallStatus).toBeDefined();
      expect(['passed', 'failed', 'partial']).toContain(
        VALIDATION_RESULT.overallStatus
      );

      console.log(
        'Validation execution with inherited criteria validated successfully'
      );
      console.log(
        'Validation results:',
        VALIDATION_RESULT.results.map((r) => ({
          id: r.criterionId,
          status: r.status,
        }))
      );
    });
  });
});

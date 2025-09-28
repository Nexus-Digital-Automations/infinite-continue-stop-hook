/**
 * FEATURES.json System Validation Test Suite
 * Testing FeatureManager API - Feature Lifecycle and Management Validation
 *
 * Purpose: Validate FEATURES.json feature management system functionality
 * Key Requirements:
 * - Feature suggestion, approval, and rejection workflow
 * - Feature lifecycle management (suggested → approved → implemented)
 * - Agent initialization and session management
 * - Feature filtering and statistics
 * - Feature data validation and persistence
 */

const { spawn } = require('child_process');
const _path = require('path');
const _fs = require('fs').promises;

// Test configuration
const API_PATH = _path.join(__dirname, '..', 'taskmanager-api.js');
const TEST_PROJECT_DIR = _path.join(__dirname, 'features-test-project');
const FEATURES_PATH = _path.join(TEST_PROJECT_DIR, 'FEATURES.json');
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
          const result = stdout.trim() ? JSON.parse(stdout) : {};
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
    await _fs.mkdir(TEST_PROJECT_DIR, { recursive: true });

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

    await _fs.writeFile(
      _path.join(TEST_PROJECT_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

    // Create main application file
    const indexJs = `
console.log('Features test application started');

// Simulate a test application for feature validation
class FeaturesTestApp {
  constructor() {
    this.status = 'initialized';
    this.features = [];
  }

  async start() {
    this.status = 'running';
    console.log('Features application is running');
    return this.status;
  }

  addFeature(feature) {
    this.features.push(feature);
    console.log(\`Feature added: \${feature.title}\`);
  }

  async stop() {
    this.status = 'stopped';
    console.log('Features application stopped');
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

    await _fs.writeFile(_path.join(TEST_PROJECT_DIR, 'index.js'), indexJs);

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

    await _fs.writeFile(
      FEATURES_PATH,
      JSON.stringify(initialFeatures, null, 2)
    );

    console.log('Features test project setup completed');
  } catch (error) {
    console.error('Failed to setup features test project:', error);
    throw error;
  }
}

async function cleanupFeaturesTestProject() {
  try {
    await _fs.rm(TEST_PROJECT_DIR, { recursive: true, force: true });
    console.log('Features test project cleanup completed');
  } catch (error) {
    console.error('Failed to cleanup features test project:', error);
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

function _approveFeature(featureId, approvalData = {}) {
  const approval = {
    approved_by: 'test-agent',
    approval_notes: 'Test approval',
    ...approvalData,
  };
  return execAPI('approve-feature', [featureId, JSON.stringify(approval)]);
}

function _rejectFeature(featureId, rejectionData = {}) {
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
    test('should create and manage feature suggestions correctly', async () => {
      // Create multiple feature suggestions with different categories
      const features = [
        {
          title: 'Add user authentication',
          description: 'Implement login/logout functionality with JWT tokens',
          business_value: 'Enables user-specific features and security',
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
          description: 'Add indexes and optimize slow queries',
          business_value:
            'Improves application performance and user satisfaction',
          category: 'performance',
        },
      ];

      const createdFeatures = [];
      for (const feature of features) {
        const result = await createFeature(feature);
        expect(result.success).toBe(true);
        expect(result.feature).toBeDefined();
        expect(result.feature.status).toBe('suggested');
        createdFeatures.push(result.feature);
      }

      // Verify features were created correctly
      const listResult = await execAPI('list-features');
      expect(listResult.success).toBe(true);
      expect(listResult.features.length).toBeGreaterThanOrEqual(3);

      // Check that all our test features are present
      for (const feature of features) {
        const found = listResult.features.find(
          (f) => f.title === feature.title
        );
        expect(found).toBeDefined();
        expect(found.status).toBe('suggested');
        expect(found.category).toBe(feature.category);
      }

      console.log('Feature creation and listing validated successfully');
    });

    test('should validate template override behavior', async () => {
      // Create base template
      const _baseCriteria = [
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

      await createBaseTemplate('Override Base Template', _baseCriteria);

      // Create child template with overrides
      const _childCriteria = [
        {
          id: 'child-new',
          description: 'New child requirement',
          category: 'security',
        },
      ];

      const _overrides = {
        'override-test-1': {
          description: 'Overridden description',
          priority: 'high',
          tags: ['override', 'critical'],
        },
      };

      await createChildTemplate(
        'Override Child Template',
        'Override Base Template',
        _childCriteria,
        _overrides
      );

      // Apply child template
      await execAPI('success-criteria:apply-template', [
        'Override Child Template',
      ]);

      // Validate overrides were applied
      const status = await execAPI('success-criteria:status');
      const overriddenCriterion = status._projectCriteria.find(
        (c) => c.id === 'override-test-1'
      );

      expect(overriddenCriterion).toBeDefined();
      expect(overriddenCriterion.description).toBe('Overridden description');
      expect(overriddenCriterion.priority).toBe('high');
      expect(overriddenCriterion.tags).toContain('override');
      expect(overriddenCriterion.tags).toContain('critical');

      // Validate non-overridden criteria remain unchanged
      const nonOverriddenCriterion = status._projectCriteria.find(
        (c) => c.id === 'override-test-2'
      );
      expect(nonOverriddenCriterion.description).toBe('Base requirement 2');

      console.log('Template override behavior validated successfully');
    });

    test('should validate multi-level template inheritance', async () => {
      // Create grandparent template
      const _grandparentCriteria = [
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

      await createBaseTemplate('Grandparent Template', _grandparentCriteria);

      // Create parent template inheriting from grandparent
      const _parentCriteria = [
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
        _parentCriteria
      );

      // Create child template inheriting from parent
      const _childCriteria = [
        {
          id: 'child-1',
          description: 'Child requirement 1',
          category: 'deploy',
        },
      ];

      await createChildTemplate(
        'Multi-Level Child Template',
        'Parent Template',
        _childCriteria
      );

      // Apply multi-level child template
      await execAPI('success-criteria:apply-template', [
        'Multi-Level Child Template',
      ]);

      // Validate all levels are present
      const status = await execAPI('success-criteria:status');
      expect(status._projectCriteria.length).toBe(5); // 2 + 2 + 1

      // Check for all criteria IDs
      const expectedIds = ['gp-1', 'gp-2', 'parent-1', 'parent-2', 'child-1'];
      const actualIds = status._projectCriteria.map((c) => c.id);

      expectedIds.forEach((expectedId) => {
        expect(actualIds).toContain(expectedId);
      });

      console.log('Multi-level template inheritance validated successfully');
    });

    test('should validate template inheritance conflict resolution', async () => {
      // Create base template with conflicting ID
      const _baseCriteria = [
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

      await createBaseTemplate('Conflict Base Template', _baseCriteria);

      // Create child template with same ID (should override)
      const _childCriteria = [
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
        _childCriteria
      );

      // Apply child template
      await execAPI('success-criteria:apply-template', [
        'Conflict Child Template',
      ]);

      // Validate conflict resolution (child should win)
      const status = await execAPI('success-criteria:status');
      const conflictCriterion = status._projectCriteria.find(
        (c) => c.id === 'conflict-id'
      );

      expect(conflictCriterion).toBeDefined();
      expect(conflictCriterion.description).toBe('Child description');
      expect(conflictCriterion.category).toBe('security');
      expect(conflictCriterion.priority).toBe('high');

      // Ensure both unique criteria are present
      expect(
        status._projectCriteria.find((c) => c.id === 'base-unique')
      ).toBeDefined();
      expect(
        status._projectCriteria.find((c) => c.id === 'child-unique')
      ).toBeDefined();

      console.log(
        'Template inheritance conflict resolution validated successfully'
      );
    });
  });

  describe('Custom Criteria Validation', () => {
    test('should validate custom criteria addition to templates', async () => {
      // Create base template
      const _baseCriteria = [
        { id: 'base-1', description: 'Base requirement 1', category: 'build' },
        { id: 'base-2', description: 'Base requirement 2', category: 'test' },
      ];

      await createBaseTemplate('Custom Base Template', _baseCriteria);
      await execAPI('success-criteria:apply-template', [
        'Custom Base Template',
      ]);

      // Add custom criteria to project
      const _customCriteria = [
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
      for await (const criterion of _customCriteria) {
        await execAPI('success-criteria:add-criterion', [
          JSON.stringify(criterion),
        ]);
      }

      // Validate custom criteria were added
      const status = await execAPI('success-criteria:status');
      expect(status._projectCriteria.length).toBe(4); // 2 base + 2 custom

      const customCriterion1 = status._projectCriteria.find(
        (c) => c.id === 'custom-1'
      );
      expect(customCriterion1).toBeDefined();
      expect(customCriterion1.category).toBe('custom');
      expect(customCriterion1.tags).toContain('project-specific');
      expect(customCriterion1.metadata.source).toBe('project-requirements');

      const customCriterion2 = status._projectCriteria.find(
        (c) => c.id === 'custom-2'
      );
      expect(customCriterion2).toBeDefined();
      expect(customCriterion2.priority).toBe('high');

      console.log('Custom criteria addition validated successfully');
    });

    test('should validate custom criteria modification and removal', async () => {
      // Setup base template and custom criterion
      const _baseCriteria = [
        { id: 'base-1', description: 'Base requirement', category: 'build' },
      ];

      await createBaseTemplate('Modification Base Template', _baseCriteria);
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
      const modified = status._projectCriteria.find(
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
        status._projectCriteria.find((c) => c.id === 'modifiable-custom')
      ).toBeUndefined();
      expect(status._projectCriteria.length).toBe(1); // Only base criterion remains

      console.log(
        'Custom criteria modification and removal validated successfully'
      );
    });

    test('should validate custom criteria persistence across template changes', async () => {
      // Create initial template and add custom criteria
      const _initialCriteria = [
        {
          id: 'initial-1',
          description: 'Initial requirement',
          category: 'build',
        },
      ];

      await createBaseTemplate('Initial Template', _initialCriteria);
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

      // Create and apply different template
      const _newCriteria = [
        { id: 'new-1', description: 'New requirement', category: 'test' },
        {
          id: 'new-2',
          description: 'Another new requirement',
          category: 'quality',
        },
      ];

      await createBaseTemplate('New Template', _newCriteria);
      await execAPI('success-criteria:apply-template', ['New Template']);

      // Validate that custom criterion persisted
      const status = await execAPI('success-criteria:status');
      const persistentCustom = status._projectCriteria.find(
        (c) => c.id === 'persistent-custom'
      );

      expect(persistentCustom).toBeDefined();
      expect(persistentCustom.description).toBe(
        'Persistent custom requirement'
      );

      // Validate new template criteria are present
      expect(
        status._projectCriteria.find((c) => c.id === 'new-1')
      ).toBeDefined();
      expect(
        status._projectCriteria.find((c) => c.id === 'new-2')
      ).toBeDefined();

      // Validate old template criteria are gone
      expect(
        status._projectCriteria.find((c) => c.id === 'initial-1')
      ).toBeUndefined();

      console.log(
        'Custom criteria persistence across template changes validated successfully'
      );
    });
  });

  describe('Template Versioning and Compatibility', () => {
    test('should validate template version compatibility', async () => {
      // Create template with version metadata
      const _versionedCriteria = [
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
        criteria: _versionedCriteria,
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

      console.log('Template version compatibility validated successfully');
    });

    test('should validate template upgrade behavior', async () => {
      // Create initial version of template
      const _v1Criteria = [
        { id: 'upgrade-1', description: 'V1 requirement', category: 'build' },
        { id: 'upgrade-2', description: 'V1 requirement 2', category: 'test' },
      ];

      const v1Template = {
        name: 'Upgradeable Template',
        version: '1.0.0',
        criteria: _v1Criteria,
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(v1Template),
      ]);
      await execAPI('success-criteria:apply-template', [
        'Upgradeable Template',
      ]);

      // Create upgraded version with additional criteria and modifications
      const _v2Criteria = [
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
        criteria: _v2Criteria,
        upgradeFrom: '1.0.0',
        migrationNotes:
          'Added security requirements and updated build criteria',
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
      expect(status._projectCriteria.length).toBe(3);

      // Check modified criterion
      const modifiedCriterion = status._projectCriteria.find(
        (c) => c.id === 'upgrade-1'
      );
      expect(modifiedCriterion.description).toBe('V2 updated requirement');
      expect(modifiedCriterion.priority).toBe('high');

      // Check new criterion
      const newCriterion = status._projectCriteria.find(
        (c) => c.id === 'upgrade-3'
      );
      expect(newCriterion).toBeDefined();
      expect(newCriterion.category).toBe('security');

      console.log('Template upgrade behavior validated successfully');
    });

    test('should validate template dependency resolution', async () => {
      // Create dependency template
      const _dependencyCriteria = [
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

      const _dependencyTemplate = {
        name: 'Dependency Template',
        version: '1.0.0',
        criteria: _dependencyCriteria,
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(_dependencyTemplate),
      ]);

      // Create main template with dependencies
      const _mainCriteria = [
        { id: 'main-1', description: 'Main requirement 1', category: 'build' },
        { id: 'main-2', description: 'Main requirement 2', category: 'test' },
      ];

      const _mainTemplate = {
        name: 'Main Template with Dependencies',
        version: '1.0.0',
        criteria: _mainCriteria,
        dependencies: [
          {
            template: 'Dependency Template',
            version: '>=1.0.0',
            required: true,
          },
        ],
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(_mainTemplate),
      ]);

      // Apply main template (should auto-resolve dependencies)
      await execAPI('success-criteria:apply-template', [
        'Main Template with Dependencies',
      ]);

      // Validate both main and dependency criteria are present
      const status = await execAPI('success-criteria:status');
      expect(status._projectCriteria.length).toBe(4); // 2 main + 2 dependency

      // Check for dependency criteria
      expect(
        status._projectCriteria.find((c) => c.id === 'dep-1')
      ).toBeDefined();
      expect(
        status._projectCriteria.find((c) => c.id === 'dep-2')
      ).toBeDefined();

      // Check for main criteria
      expect(
        status._projectCriteria.find((c) => c.id === 'main-1')
      ).toBeDefined();
      expect(
        status._projectCriteria.find((c) => c.id === 'main-2')
      ).toBeDefined();

      // Validate dependency information is tracked
      expect(status.resolvedDependencies).toBeDefined();
      expect(status.resolvedDependencies.length).toBe(1);
      expect(status.resolvedDependencies[0].template).toBe(
        'Dependency Template'
      );

      console.log('Template dependency resolution validated successfully');
    });
  });

  describe('Project-Specific Customization Validation', () => {
    test('should validate project environment-specific criteria', async () => {
      // Create base template
      const _baseCriteria = [
        {
          id: 'env-base-1',
          description: 'Base requirement',
          category: 'build',
        },
      ];

      await createBaseTemplate('Environment Base Template', _baseCriteria);
      await execAPI('success-criteria:apply-template', [
        'Environment Base Template',
      ]);

      // Add environment-specific criteria
      const _developmentCriteria = {
        id: 'dev-specific',
        description: 'Development environment requirement',
        category: 'development',
        environments: ['development', 'local'],
        enabled:
          process.env.NODE_ENV === 'development' ||
          process.env.NODE_ENV === 'test',
      };

      const _productionCriteria = {
        id: 'prod-specific',
        description: 'Production environment requirement',
        category: 'production',
        environments: ['production'],
        enabled: process.env.NODE_ENV === 'production',
      };

      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(_developmentCriteria),
      ]);
      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(_productionCriteria),
      ]);

      // Validate environment-specific criteria behavior
      const status = await execAPI('success-criteria:status');

      // In test environment, development criteria should be enabled
      const _devCriterion = status._projectCriteria.find(
        (c) => c.id === 'dev-specific'
      );
      expect(_devCriterion).toBeDefined();
      expect(_devCriterion.enabled).toBe(true);

      // Production criteria should be disabled in test environment
      const _prodCriterion = status._projectCriteria.find(
        (c) => c.id === 'prod-specific'
      );
      expect(_prodCriterion).toBeDefined();
      expect(_prodCriterion.enabled).toBe(false);

      console.log(
        'Project environment-specific criteria validated successfully'
      );
    });

    test('should validate conditional criteria based on project characteristics', async () => {
      // Create base template
      const _baseCriteria = [
        {
          id: 'conditional-base',
          description: 'Base requirement',
          category: 'build',
        },
      ];

      await createBaseTemplate('Conditional Base Template', _baseCriteria);
      await execAPI('success-criteria:apply-template', [
        'Conditional Base Template',
      ]);

      // Add conditional criteria based on project type
      const _webAppCriteria = {
        id: 'webapp-specific',
        description: 'Web application specific requirement',
        category: 'web',
        conditions: {
          projectType: 'webapp',
          hasPackageJson: true,
        },
      };

      const _apiCriteria = {
        id: 'api-specific',
        description: 'API specific requirement',
        category: 'api',
        conditions: {
          projectType: 'api',
          hasDockerfile: true,
        },
      };

      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(_webAppCriteria),
      ]);
      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(_apiCriteria),
      ]);

      // Evaluate conditions (webapp criteria should be enabled due to package.json)
      await execAPI('success-criteria:evaluate-conditions');

      const status = await execAPI('success-criteria:status');

      // WebApp criteria should be applicable (we have package.json)
      const _webAppCriterion = status._projectCriteria.find(
        (c) => c.id === 'webapp-specific'
      );
      expect(_webAppCriterion).toBeDefined();

      // API criteria might not be applicable (no Dockerfile in test project)
      const _apiCriterion = status._projectCriteria.find(
        (c) => c.id === 'api-specific'
      );
      if (_apiCriterion) {
        console.log('API criterion evaluation:', _apiCriterion.conditions);
      }

      console.log(
        'Conditional criteria based on project characteristics validated successfully'
      );
    });

    test('should validate criteria prioritization and filtering', async () => {
      // Create template with various priority criteria
      const _prioritizedCriteria = [
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

      await createBaseTemplate('Prioritized Template', _prioritizedCriteria);
      await execAPI('success-criteria:apply-template', [
        'Prioritized Template',
      ]);

      // Test priority-based filtering
      const _criticalAndHigh = await execAPI('success-criteria:filter', [
        'priority',
        'critical,high',
      ]);
      expect(_criticalAndHigh.criteria.length).toBe(3); // 1 critical + 2 high

      const _criticalOnly = await execAPI('success-criteria:filter', [
        'priority',
        'critical',
      ]);
      expect(_criticalOnly.criteria.length).toBe(1);
      expect(_criticalOnly.criteria[0].id).toBe('critical-1');

      // Test category-based filtering
      const _securityCriteria = await execAPI('success-criteria:filter', [
        'category',
        'security',
      ]);
      expect(_securityCriteria.criteria.length).toBe(1);
      expect(_securityCriteria.criteria[0].category).toBe('security');

      // Test combined filtering
      const _highPriorityPerformance = await execAPI(
        'success-criteria:filter',
        ['priority', 'high', 'category', 'performance']
      );
      expect(_highPriorityPerformance.criteria.length).toBe(1);
      expect(_highPriorityPerformance.criteria[0].id).toBe('high-1');

      console.log(
        'Criteria prioritization and filtering validated successfully'
      );
    });
  });

  describe('Integration and Workflow Validation', () => {
    test('should validate complete template inheritance workflow', async () => {
      // Step 1: Create organizational base template
      const _orgCriteria = [
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

      await createBaseTemplate('Organization Standard Template', _orgCriteria);

      // Step 2: Create team-specific template inheriting from org
      const _teamCriteria = [
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
        _teamCriteria
      );

      // Step 3: Create project-specific template inheriting from team
      const _projectCriteria = [
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
        _projectCriteria
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
      expect(status._projectCriteria.length).toBe(6); // 2 org + 2 team + 1 project + 1 custom

      // Validate all criteria are present
      const expectedIds = [
        'org-security',
        'org-compliance',
        'team-testing',
        'team-performance',
        'project-specific',
        'custom-project',
      ];
      const actualIds = status._projectCriteria.map((c) => c.id);

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
      const _validationCriteria = [
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

      await createBaseTemplate('Validation Template', _validationCriteria);
      await execAPI('success-criteria:apply-template', ['Validation Template']);

      // Run validation on all inherited criteria
      const _validationResult = await execAPI('success-criteria:validate');

      expect(_validationResult.results).toBeDefined();
      expect(_validationResult.results.length).toBe(3);

      // Check that validation attempted all criteria
      const buildResult = _validationResult.results.find(
        (r) => r.criterionId === 'build-validation'
      );
      const testResult = _validationResult.results.find(
        (r) => r.criterionId === 'test-validation'
      );
      const lintResult = _validationResult.results.find(
        (r) => r.criterionId === 'lint-validation'
      );

      expect(buildResult).toBeDefined();
      expect(testResult).toBeDefined();
      expect(lintResult).toBeDefined();

      // Validate overall status
      expect(_validationResult.overallStatus).toBeDefined();
      expect(['passed', 'failed', 'partial']).toContain(
        _validationResult.overallStatus
      );

      console.log(
        'Validation execution with inherited criteria validated successfully'
      );
      console.log(
        'Validation results:',
        _validationResult.results.map((r) => ({
          id: r.criterionId,
          status: r.status,
        }))
      );
    });
  });
});

/**
 * Success Criteria Validation Test Suite
 * Testing Agent #6 - Template Inheritance and Custom Criteria Validation
 *
 * Purpose: Validate template inheritance behavior and custom criteria functionality
 * Key Requirements:
 * - Template inheritance and override behavior
 * - Custom criteria validation and merging
 * - Project-specific criteria customization
 * - Template versioning and compatibility
 */

const { spawn } = require('child_process');
const _path = require('path');
const _fs = require('fs').promises;

// Test configuration
const API_PATH = _path.join(__dirname, '..', 'taskmanager-api.js');
const TEST_PROJECT_DIR = _path.join(__dirname, 'validation-test-project');
const TIMEOUT = 30000;

/**
 * API execution utility
 */
function execAPI(_command, args = [], timeout = TIMEOUT) {
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
      if (code === 0) {
        try {
          const _result = stdout.trim() ? JSON.parse(stdout) : {};
          resolve(result);
        } catch {
          resolve({ rawOutput: stdout, stderr });
        }
      } else {
        reject(
          new Error(`Command failed with code ${code}: ${stderr || stdout}`),
        );
      }
    });

    child.on('error', (error) => {
      reject(error);
    });
  });
}

/**
 * Test project setup utilities
 */
async function setupValidationTestProject() {
  try {
    await fs.mkdir(TEST_PROJECT_DIR, { recursive: true });

    // Create package.json
    const packageJson = {
      name: 'validation-test-project',
      version: '1.0.0',
      description:
        'Validation testing project for Success Criteria template inheritance',
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

    await fs.writeFile(
      _path.join(TEST_PROJECT_DIR, 'package.json'),
      JSON.stringify(packageJson, null, 2),
    );

    // Create main application file
    const indexJs = `
console.log('Validation test application started');

// Simulate a simple application
class ValidationApp {
  constructor() {
    this.status = 'initialized';
  }
  
  async start() {
    this.status = 'running';
    console.log('Application is running');
    return this.status;
  }
  
  async stop() {
    this.status = 'stopped';
    console.log('Application stopped');
    return this.status;
  }
}

const app = new ValidationApp();
app.start().then(() => {
  setTimeout(() => {
    app.stop();
    process.exit(0);
  }, 500);
});
`;

    await fs.writeFile(_path.join(TEST_PROJECT_DIR, 'index.js'), indexJs);

    // Create test file
    const testJs = `
describe('Validation Test Suite', () => {
  test('should validate basic functionality', () => {
    expect(true).toBe(true);
  });
  
  test('should validate complex objects', () => {
    const obj = { a: 1, b: { c: 2 } };
    expect(obj.b.c).toBe(2);
  });
});
`;

    await fs.writeFile(_path.join(TEST_PROJECT_DIR, 'test.js'), testJs);

    console.log('Validation test project setup completed');
  } catch {
    console.error('Failed to setup validation test project:', error);
    throw error;
  }
}

async function cleanupValidationTestProject() {
  try {
    await fs.rm(TEST_PROJECT_DIR, { recursive: true, force: true });
    console.log('Validation test project cleanup completed');
  } catch {
    console.error('Failed to cleanup validation test project:', error);
  }
}

/**
 * Template management utilities
 */
function createBaseTemplate(_name, criteria) {
  const templateData = JSON.stringify({ name, criteria });
  return execAPI('success-criteria:create-template', [templateData]);
}

function createChildTemplate(
  name,
  parentName,
  additionalCriteria,
  overrides = {},
) {
  const templateData = JSON.stringify({
    name,
    parentTemplate: parentName,
    criteria: additionalCriteria,
    overrides,
  });
  return execAPI('success-criteria:create-template', [templateData]);
}

/**
 * Validation Test Suite
 */
describe('Success Criteria Validation Tests', () => {
  beforeAll(async () => {
    await setupValidationTestProject();
  }, 30000);

  afterAll(async () => {
    await cleanupValidationTestProject();
  });

  beforeEach(async () => {
    await execAPI('success-criteria:init');
  });

  describe('Template Inheritance Validation', () => {
    test('should validate basic template inheritance structure', async () => {
      // Create base template
      const _baseCriteria = [
        { id: 'base-1', description: 'Base requirement 1', category: 'build' },
        { id: 'base-2', description: 'Base requirement 2', category: 'test' },
        {
          id: 'base-3',
          description: 'Base requirement 3',
          category: 'quality',
        },
      ];

      await createBaseTemplate('Base Template', baseCriteria);

      // Create child template that inherits from base
      const _childCriteria = [
        {
          id: 'child-1',
          description: 'Child requirement 1',
          category: 'security',
        },
        {
          id: 'child-2',
          description: 'Child requirement 2',
          category: 'performance',
        },
      ];

      await createChildTemplate(
        'Child Template',
        'Base Template',
        childCriteria,
      );

      // Apply child template to project
      await execAPI('success-criteria:apply-template', ['Child Template']);

      // Validate that both base and child criteria are present
      const _status = await execAPI('success-criteria:status');

      expect(status.projectCriteria).toBeDefined();
      expect(status.projectCriteria.length).toBe(5); // 3 base + 2 child

      // Check for base criteria
      const _baseCriteriaIds = baseCriteria.map((c) => c.id);
      const _childCriteriaIds = childCriteria.map((c) => c.id);
      const _allExpectedIds = [...baseCriteriaIds, ...childCriteriaIds];

      const _actualIds = status.projectCriteria.map((c) => c.id);
      allExpectedIds.forEach((expectedId) => {
        expect(actualIds).toContain(expectedId);
      });

      console.log('Template inheritance structure validated successfully');
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

      await createBaseTemplate('Override Base Template', baseCriteria);

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
        childCriteria,
        overrides,
      );

      // Apply child template
      await execAPI('success-criteria:apply-template', [
        'Override Child Template',
      ]);

      // Validate overrides were applied
      const _status = await execAPI('success-criteria:status');
      const _overriddenCriterion = status.projectCriteria.find(
        (c) => c.id === 'override-test-1',
      );

      expect(overriddenCriterion).toBeDefined();
      expect(overriddenCriterion.description).toBe('Overridden description');
      expect(overriddenCriterion.priority).toBe('high');
      expect(overriddenCriterion.tags).toContain('override');
      expect(overriddenCriterion.tags).toContain('critical');

      // Validate non-overridden criteria remain unchanged
      const _nonOverriddenCriterion = status.projectCriteria.find(
        (c) => c.id === 'override-test-2',
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

      await createBaseTemplate('Grandparent Template', grandparentCriteria);

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
        parentCriteria,
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
        childCriteria,
      );

      // Apply multi-level child template
      await execAPI('success-criteria:apply-template', [
        'Multi-Level Child Template',
      ]);

      // Validate all levels are present
      const _status = await execAPI('success-criteria:status');
      expect(status.projectCriteria.length).toBe(5); // 2 + 2 + 1

      // Check for all criteria IDs
      const _expectedIds = ['gp-1', 'gp-2', 'parent-1', 'parent-2', 'child-1'];
      const _actualIds = status.projectCriteria.map((c) => c.id);

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

      await createBaseTemplate('Conflict Base Template', baseCriteria);

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
        childCriteria,
      );

      // Apply child template
      await execAPI('success-criteria:apply-template', [
        'Conflict Child Template',
      ]);

      // Validate conflict resolution (child should win)
      const _status = await execAPI('success-criteria:status');
      const _conflictCriterion = status.projectCriteria.find(
        (c) => c.id === 'conflict-id',
      );

      expect(conflictCriterion).toBeDefined();
      expect(conflictCriterion.description).toBe('Child description');
      expect(conflictCriterion.category).toBe('security');
      expect(conflictCriterion.priority).toBe('high');

      // Ensure both unique criteria are present
      expect(
        status.projectCriteria.find((c) => c.id === 'base-unique'),
      ).toBeDefined();
      expect(
        status.projectCriteria.find((c) => c.id === 'child-unique'),
      ).toBeDefined();

      console.log(
        'Template inheritance conflict resolution validated successfully',
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

      await createBaseTemplate('Custom Base Template', baseCriteria);
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

      for (const criterion of customCriteria) {
        await execAPI('success-criteria:add-criterion', [
          JSON.stringify(criterion),
        ]);
      }

      // Validate custom criteria were added
      const _status = await execAPI('success-criteria:status');
      expect(status.projectCriteria.length).toBe(4); // 2 base + 2 custom

      const _customCriterion1 = status.projectCriteria.find(
        (c) => c.id === 'custom-1',
      );
      expect(customCriterion1).toBeDefined();
      expect(customCriterion1.category).toBe('custom');
      expect(customCriterion1.tags).toContain('project-specific');
      expect(customCriterion1.metadata.source).toBe('project-requirements');

      const _customCriterion2 = status.projectCriteria.find(
        (c) => c.id === 'custom-2',
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

      await createBaseTemplate('Modification Base Template', baseCriteria);
      await execAPI('success-criteria:apply-template', [
        'Modification Base Template',
      ]);

      const _customCriterion = {
        id: 'modifiable-custom',
        description: 'Original custom requirement',
        category: 'custom',
        priority: 'low',
      };

      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(customCriterion),
      ]);

      // Modify the custom criterion
      const _modifiedCriterion = {
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
      const _modified = status.projectCriteria.find(
        (c) => c.id === 'modifiable-custom',
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
        status.projectCriteria.find((c) => c.id === 'modifiable-custom'),
      ).toBeUndefined();
      expect(status.projectCriteria.length).toBe(1); // Only base criterion remains

      console.log(
        'Custom criteria modification and removal validated successfully',
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

      await createBaseTemplate('Initial Template', initialCriteria);
      await execAPI('success-criteria:apply-template', ['Initial Template']);

      const _customCriterion = {
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

      await createBaseTemplate('New Template', newCriteria);
      await execAPI('success-criteria:apply-template', ['New Template']);

      // Validate that custom criterion persisted
      const _status = await execAPI('success-criteria:status');
      const _persistentCustom = status.projectCriteria.find(
        (c) => c.id === 'persistent-custom',
      );

      expect(persistentCustom).toBeDefined();
      expect(persistentCustom.description).toBe(
        'Persistent custom requirement',
      );

      // Validate new template criteria are present
      expect(
        status.projectCriteria.find((c) => c.id === 'new-1'),
      ).toBeDefined();
      expect(
        status.projectCriteria.find((c) => c.id === 'new-2'),
      ).toBeDefined();

      // Validate old template criteria are gone
      expect(
        status.projectCriteria.find((c) => c.id === 'initial-1'),
      ).toBeUndefined();

      console.log(
        'Custom criteria persistence across template changes validated successfully',
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

      const _versionedTemplate = {
        name: 'Versioned Template',
        version: '1.0.0',
        criteria: versionedCriteria,
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
      const _status = await execAPI('success-criteria:status');

      expect(status.appliedTemplate).toBeDefined();
      expect(status.appliedTemplate.version).toBe('1.0.0');
      expect(status.appliedTemplate.compatibility).toBeDefined();
      expect(status.appliedTemplate.compatibility.minSystemVersion).toBe(
        '2.0.0',
      );

      console.log('Template version compatibility validated successfully');
    });

    test('should validate template upgrade behavior', async () => {
      // Create initial version of template
      const _v1Criteria = [
        { id: 'upgrade-1', description: 'V1 requirement', category: 'build' },
        { id: 'upgrade-2', description: 'V1 requirement 2', category: 'test' },
      ];

      const _v1Template = {
        name: 'Upgradeable Template',
        version: '1.0.0',
        criteria: v1Criteria,
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

      const _v2Template = {
        name: 'Upgradeable Template',
        version: '2.0.0',
        criteria: v2Criteria,
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
      const _status = await execAPI('success-criteria:status');

      expect(status.appliedTemplate.version).toBe('2.0.0');
      expect(status.projectCriteria.length).toBe(3);

      // Check modified criterion
      const _modifiedCriterion = status.projectCriteria.find(
        (c) => c.id === 'upgrade-1',
      );
      expect(modifiedCriterion.description).toBe('V2 updated requirement');
      expect(modifiedCriterion.priority).toBe('high');

      // Check new criterion
      const _newCriterion = status.projectCriteria.find(
        (c) => c.id === 'upgrade-3',
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
        criteria: dependencyCriteria,
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(dependencyTemplate),
      ]);

      // Create main template with dependencies
      const _mainCriteria = [
        { id: 'main-1', description: 'Main requirement 1', category: 'build' },
        { id: 'main-2', description: 'Main requirement 2', category: 'test' },
      ];

      const _mainTemplate = {
        name: 'Main Template with Dependencies',
        version: '1.0.0',
        criteria: mainCriteria,
        dependencies: [
          {
            template: 'Dependency Template',
            version: '>=1.0.0',
            required: true,
          },
        ],
      };

      await execAPI('success-criteria:create-template', [
        JSON.stringify(mainTemplate),
      ]);

      // Apply main template (should auto-resolve dependencies)
      await execAPI('success-criteria:apply-template', [
        'Main Template with Dependencies',
      ]);

      // Validate both main and dependency criteria are present
      const _status = await execAPI('success-criteria:status');
      expect(status.projectCriteria.length).toBe(4); // 2 main + 2 dependency

      // Check for dependency criteria
      expect(
        status.projectCriteria.find((c) => c.id === 'dep-1'),
      ).toBeDefined();
      expect(
        status.projectCriteria.find((c) => c.id === 'dep-2'),
      ).toBeDefined();

      // Check for main criteria
      expect(
        status.projectCriteria.find((c) => c.id === 'main-1'),
      ).toBeDefined();
      expect(
        status.projectCriteria.find((c) => c.id === 'main-2'),
      ).toBeDefined();

      // Validate dependency information is tracked
      expect(status.resolvedDependencies).toBeDefined();
      expect(status.resolvedDependencies.length).toBe(1);
      expect(status.resolvedDependencies[0].template).toBe(
        'Dependency Template',
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

      await createBaseTemplate('Environment Base Template', baseCriteria);
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
        JSON.stringify(developmentCriteria),
      ]);
      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(productionCriteria),
      ]);

      // Validate environment-specific criteria behavior
      const _status = await execAPI('success-criteria:status');

      // In test environment, development criteria should be enabled
      const _devCriterion = status.projectCriteria.find(
        (c) => c.id === 'dev-specific',
      );
      expect(devCriterion).toBeDefined();
      expect(devCriterion.enabled).toBe(true);

      // Production criteria should be disabled in test environment
      const _prodCriterion = status.projectCriteria.find(
        (c) => c.id === 'prod-specific',
      );
      expect(prodCriterion).toBeDefined();
      expect(prodCriterion.enabled).toBe(false);

      console.log(
        'Project environment-specific criteria validated successfully',
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

      await createBaseTemplate('Conditional Base Template', baseCriteria);
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
        JSON.stringify(webAppCriteria),
      ]);
      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(apiCriteria),
      ]);

      // Evaluate conditions (webapp criteria should be enabled due to package.json)
      await execAPI('success-criteria:evaluate-conditions');

      const _status = await execAPI('success-criteria:status');

      // WebApp criteria should be applicable (we have package.json)
      const _webAppCriterion = status.projectCriteria.find(
        (c) => c.id === 'webapp-specific',
      );
      expect(webAppCriterion).toBeDefined();

      // API criteria might not be applicable (no Dockerfile in test project)
      const _apiCriterion = status.projectCriteria.find(
        (c) => c.id === 'api-specific',
      );
      if (apiCriterion) {
        console.log('API criterion evaluation:', apiCriterion.conditions);
      }

      console.log(
        'Conditional criteria based on project characteristics validated successfully',
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

      await createBaseTemplate('Prioritized Template', prioritizedCriteria);
      await execAPI('success-criteria:apply-template', [
        'Prioritized Template',
      ]);

      // Test priority-based filtering
      const _criticalAndHigh = await execAPI('success-criteria:filter', [
        'priority',
        'critical,high',
      ]);
      expect(criticalAndHigh.criteria.length).toBe(3); // 1 critical + 2 high

      const _criticalOnly = await execAPI('success-criteria:filter', [
        'priority',
        'critical',
      ]);
      expect(criticalOnly.criteria.length).toBe(1);
      expect(criticalOnly.criteria[0].id).toBe('critical-1');

      // Test category-based filtering
      const _securityCriteria = await execAPI('success-criteria:filter', [
        'category',
        'security',
      ]);
      expect(securityCriteria.criteria.length).toBe(1);
      expect(securityCriteria.criteria[0].category).toBe('security');

      // Test combined filtering
      const _highPriorityPerformance = await execAPI('success-criteria:filter', [
        'priority',
        'high',
        'category',
        'performance',
      ]);
      expect(highPriorityPerformance.criteria.length).toBe(1);
      expect(highPriorityPerformance.criteria[0].id).toBe('high-1');

      console.log(
        'Criteria prioritization and filtering validated successfully',
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

      await createBaseTemplate('Organization Standard Template', orgCriteria);

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
        teamCriteria,
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
        projectCriteria,
      );

      // Step 4: Apply project template
      await execAPI('success-criteria:apply-template', ['Project Template']);

      // Step 5: Add custom project criteria
      const _customCriterion = {
        id: 'custom-project',
        description: 'Custom project requirement',
        category: 'custom',
        priority: 'low',
      };

      await execAPI('success-criteria:add-criterion', [
        JSON.stringify(customCriterion),
      ]);

      // Step 6: Validate complete inheritance chain
      const _status = await execAPI('success-criteria:status');
      expect(status.projectCriteria.length).toBe(6); // 2 org + 2 team + 1 project + 1 custom

      // Validate all criteria are present
      const _expectedIds = [
        'org-security',
        'org-compliance',
        'team-testing',
        'team-performance',
        'project-specific',
        'custom-project',
      ];
      const _actualIds = status.projectCriteria.map((c) => c.id);

      expectedIds.forEach((expectedId) => {
        expect(actualIds).toContain(expectedId);
      });

      // Validate inheritance metadata
      expect(status.inheritanceChain).toBeDefined();
      expect(status.inheritanceChain.length).toBe(3); // org -> team -> project

      console.log(
        'Complete template inheritance workflow validated successfully',
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

      await createBaseTemplate('Validation Template', validationCriteria);
      await execAPI('success-criteria:apply-template', ['Validation Template']);

      // Run validation on all inherited criteria
      const _validationResult = await execAPI('success-criteria:validate');

      expect(validationResult.results).toBeDefined();
      expect(validationResult.results.length).toBe(3);

      // Check that validation attempted all criteria
      const _buildResult = validationResult.results.find(
        (r) => r.criterionId === 'build-validation',
      );
      const _testResult = validationResult.results.find(
        (r) => r.criterionId === 'test-validation',
      );
      const _lintResult = validationResult.results.find(
        (r) => r.criterionId === 'lint-validation',
      );

      expect(buildResult).toBeDefined();
      expect(testResult).toBeDefined();
      expect(lintResult).toBeDefined();

      // Validate overall status
      expect(validationResult.overallStatus).toBeDefined();
      expect(['passed', 'failed', 'partial']).toContain(
        validationResult.overallStatus,
      );

      console.log(
        'Validation execution with inherited criteria validated successfully',
      );
      console.log(
        'Validation results:',
        validationResult.results.map((r) => ({
          id: r.criterionId,
          status: r.status,
        })),
      );
    });
  });
});

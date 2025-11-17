/**
 * Comprehensive Unit Tests for FeatureManagerAPI
 *
 * REWRITTEN VERSION using REAL filesystem operations instead of mocks
 * Based on proven pattern from feature-7-custom-validation-rules.test.js
 *
 * Tests all methods of the FeatureManagerAPI class with comprehensive coverage:
 * - Feature management operations (suggest, approve, reject, list, stats)
 * - Agent management operations (initialize, reinitialize, authorize-stop)
 * - Initialization tracking and time bucket statistics
 * - Error handling and edge cases
 * - File system operations and data validation
 * - Timeout handling and async operations
 *
 * Target: >90% code coverage with thorough testing of all code paths
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Import the FeatureManagerAPI class
const FeatureManagerAPI = require('../../taskmanager-api.js');

// Test constants - using real temp directory
const TEST_PROJECT_ROOT = '/tmp/test-taskmanager-api';
const TEST_TASKS_PATH = path.join(TEST_PROJECT_ROOT, 'TASKS.json');
const TEST_AGENTS_DIR = path.join(TEST_PROJECT_ROOT, '.agents');
const TEST_STOP_FLAG = path.join(TEST_PROJECT_ROOT, '.stop-allowed');

// Test fixtures
const TEST_FIXTURES = {
  emptyFeaturesFile: {
    project: 'infinite-continue-stop-hook',
    schema_version: '2.0.0',
    features: [],
    metadata: {
      total_features: 0,
      created: '2025-09-23T12:00:00.000Z',
      updated: '2025-09-23T12:00:00.000Z',
      approval_history: []
    }
  },

  validFeature: {
    title: 'Implement user authentication system',
    description: 'Add comprehensive user authentication with JWT tokens, password hashing, and session management for secure user access control',
    business_value: 'Enables secure user access and protects sensitive data from unauthorized access',
    category: 'enhancement'
  },

  validApprovalData: {
    approved_by: 'test-reviewer',
    notes: 'Looks good, approved for implementation'
  },

  validRejectionData: {
    rejected_by: 'test-reviewer',
    reason: 'Out of scope for current sprint'
  },

  invalidFeatures: {
    missingTitle: {
      description: 'This is a description without a title',
      business_value: 'Some business value',
      category: 'enhancement'
    },
    missingDescription: {
      title: 'Feature without description',
      business_value: 'Some business value',
      category: 'enhancement'
    },
    missingBusinessValue: {
      title: 'Feature without business value',
      description: 'This is a description without business value',
      category: 'enhancement'
    },
    missingCategory: {
      title: 'Feature without category',
      description: 'This is a description without category',
      business_value: 'Some business value'
    },
    emptyTitle: {
      title: '',
      description: 'This is a description with empty title',
      business_value: 'Some business value',
      category: 'enhancement'
    },
    shortTitle: {
      title: 'Short',
      description: 'This is a description but title is too short',
      business_value: 'Some business value',
      category: 'enhancement'
    },
    longTitle: {
      title: 'T'.repeat(201),
      description: 'This is a description but title is too long',
      business_value: 'Some business value',
      category: 'enhancement'
    },
    shortDescription: {
      title: 'Valid title here',
      description: 'Short desc',
      business_value: 'Some business value',
      category: 'enhancement'
    },
    longDescription: {
      title: 'Valid title here',
      description: 'D'.repeat(2001),
      business_value: 'Some business value',
      category: 'enhancement'
    },
    shortBusinessValue: {
      title: 'Valid title here',
      description: 'Valid description here for testing purposes',
      business_value: 'Short',
      category: 'enhancement'
    },
    longBusinessValue: {
      title: 'Valid title here',
      description: 'Valid description here for testing purposes',
      business_value: 'B'.repeat(1001),
      category: 'enhancement'
    },
    invalidCategory: {
      title: 'Valid title here',
      description: 'Valid description here for testing purposes',
      business_value: 'Valid business value here',
      category: 'invalid-category'
    }
  },

  featuresWithData: {
    project: 'test-project',
    schema_version: '2.0.0',
    features: [
      {
        id: 'feature_1234567890_abc123',
        title: 'Add user dashboard',
        description: 'Create a user dashboard with analytics and activity feed',
        business_value: 'Improves user engagement and provides valuable insights',
        category: 'enhancement',
        status: 'suggested',
        created_at: '2025-09-20T10:00:00.000Z',
        updated_at: '2025-09-20T10:00:00.000Z'
      },
      {
        id: 'feature_1234567891_def456',
        title: 'Implement search functionality',
        description: 'Add full-text search across all user content with filters',
        business_value: 'Helps users find content quickly and efficiently',
        category: 'new-feature',
        status: 'approved',
        approved_by: 'product-manager',
        approval_notes: 'High priority feature',
        created_at: '2025-09-21T10:00:00.000Z',
        updated_at: '2025-09-21T11:00:00.000Z'
      },
      {
        id: 'feature_1234567892_ghi789',
        title: 'Update documentation',
        description: 'Refresh all API documentation with latest changes',
        business_value: 'Keeps developers informed and reduces support requests',
        category: 'documentation',
        status: 'rejected',
        rejected_by: 'tech-lead',
        rejection_reason: 'Will be handled by automated doc generation',
        created_at: '2025-09-22T10:00:00.000Z',
        updated_at: '2025-09-22T12:00:00.000Z'
      }
    ],
    metadata: {
      total_features: 3,
      created: '2025-09-20T10:00:00.000Z',
      updated: '2025-09-22T12:00:00.000Z',
      approval_history: [
        {
          feature_id: 'feature_1234567891_def456',
          action: 'approved',
          approved_by: 'product-manager',
          timestamp: '2025-09-21T11:00:00.000Z'
        }
      ]
    }
  }
};

describe('FeatureManagerAPI', () => {
  let api;
  let originalDateNow;
  let mockTimestamp;

  beforeAll(() => {
    // Save original Date.now
    originalDateNow = Date.now;
  });

  beforeEach(() => {
    // Create fresh test directory for each test
    if (!fs.existsSync(TEST_PROJECT_ROOT)) {
      fs.mkdirSync(TEST_PROJECT_ROOT, { recursive: true });
    }

    // Create agents directory
    if (!fs.existsSync(TEST_AGENTS_DIR)) {
      fs.mkdirSync(TEST_AGENTS_DIR, { recursive: true });
    }

    // Create API instance with test project root
    api = new FeatureManagerAPI({ projectRoot: TEST_PROJECT_ROOT });

    // Mock Date.now for deterministic timestamps
    mockTimestamp = new Date('2025-09-23T12:00:00.000Z').getTime();
    Date.now = jest.fn(() => mockTimestamp);

    // Mock crypto for deterministic testing
    let cryptoCounter = 0;
    jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => {
      const char = String.fromCharCode(97 + (cryptoCounter % 26)); // a, b, c, etc.
      cryptoCounter++;
      return Buffer.from(char.repeat(size * 2), 'hex');
    });
  });

  afterEach(() => {
    // Recursive cleanup helper
    const removeDir = (dirPath) => {
      if (fs.existsSync(dirPath)) {
        const entries = fs.readdirSync(dirPath, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry.name);
          if (entry.isDirectory()) {
            removeDir(fullPath);
          } else {
            fs.unlinkSync(fullPath);
          }
        }
        fs.rmdirSync(dirPath);
      }
    };

    // Clean up entire test directory recursively
    removeDir(TEST_PROJECT_ROOT);

    // Restore mocks
    jest.clearAllMocks();
    Date.now = originalDateNow;
  });

  afterAll(() => {
    // Ensure Date.now is restored
    Date.now = originalDateNow;
  });

  // =================== CONSTRUCTOR AND INITIALIZATION TESTS ===================

  describe('Constructor and Initialization', () => {
    test('should initialize with correct default values', () => {
      const newApi = new FeatureManagerAPI();

      expect(newApi.timeout).toBe(10000);
      expect(newApi.validStatuses).toEqual([
        'suggested',
        'approved',
        'in-progress',
        'completed',
        'blocked',
        'rejected'
      ]);
      expect(newApi.validCategories).toEqual([
        'enhancement',
        'bug-fix',
        'new-feature',
        'performance',
        'security',
        'documentation'
      ]);
      expect(newApi.requiredFields).toEqual([
        'title',
        'description',
        'business_value',
        'category'
      ]);
    });

    test('should set features path correctly', () => {
      const newApi = new FeatureManagerAPI();
      expect(newApi.tasksPath).toContain('TASKS.json');
    });

    test('should have withTimeout method for operation timeouts', () => {
      expect(typeof api.withTimeout).toBe('function');
    });
  });

  // =================== FILE OPERATIONS TESTS ===================

  describe('File Operations', () => {
    describe('_ensureFeaturesFile', () => {
      test('should create TASKS.json if it does not exist', async () => {
        // File doesn't exist yet
        expect(fs.existsSync(TEST_TASKS_PATH)).toBe(false);

        await api._ensureFeaturesFile();

        // File should now exist
        expect(fs.existsSync(TEST_TASKS_PATH)).toBe(true);

        // Verify file content structure
        const fileContent = JSON.parse(fs.readFileSync(TEST_TASKS_PATH, 'utf8'));
        expect(fileContent.project).toBe('infinite-continue-stop-hook');
        expect(fileContent.features).toEqual([]);
        expect(fileContent.metadata).toBeDefined();
        expect(fileContent.schema_version).toBeDefined();
      });

      test('should not overwrite existing TASKS.json', async () => {
        // Set up existing file
        const originalData = JSON.parse(JSON.stringify(TEST_FIXTURES.featuresWithData));
        fs.writeFileSync(TEST_TASKS_PATH, JSON.stringify(originalData, null, 2));

        await api._ensureFeaturesFile();

        // Verify file was not changed
        const fileContent = JSON.parse(fs.readFileSync(TEST_TASKS_PATH, 'utf8'));
        expect(fileContent.features).toHaveLength(3);
        expect(fileContent.project).toBe('test-project'); // Should preserve original
        expect(fileContent).toEqual(originalData);
      });
    });

    describe('_loadFeatures', () => {
      test('should load existing features file successfully', async () => {
        // Create test file
        fs.writeFileSync(
          TEST_TASKS_PATH,
          JSON.stringify(TEST_FIXTURES.featuresWithData, null, 2)
        );

        const features = await api._loadFeatures();

        expect(features).toEqual(TEST_FIXTURES.featuresWithData);
        expect(features.features).toHaveLength(3);
      });

      test('should create file and return default structure if file does not exist', async () => {
        // File doesn't exist
        expect(fs.existsSync(TEST_TASKS_PATH)).toBe(false);

        const features = await api._loadFeatures();

        expect(features.project).toBe('infinite-continue-stop-hook');
        expect(features.features).toEqual([]);
        expect(features.metadata).toBeDefined();
        expect(fs.existsSync(TEST_TASKS_PATH)).toBe(true);
      });

      test('should handle JSON parsing errors gracefully', async () => {
        // Create invalid JSON file
        fs.writeFileSync(TEST_TASKS_PATH, 'invalid json content');

        await expect(api._loadFeatures()).rejects.toThrow('Failed to load features');
      });

      test('should handle file read errors', async () => {
        // Create file with no read permissions (Unix-like systems)
        fs.writeFileSync(TEST_TASKS_PATH, '{}');
        fs.chmodSync(TEST_TASKS_PATH, 0o000);

        await expect(api._loadFeatures()).rejects.toThrow();

        // Restore permissions for cleanup
        fs.chmodSync(TEST_TASKS_PATH, 0o644);
      });
    });

    describe('_saveFeatures', () => {
      test('should save features to file successfully', async () => {
        const testData = JSON.parse(JSON.stringify(TEST_FIXTURES.emptyFeaturesFile));

        await api._saveFeatures(testData);

        expect(fs.existsSync(TEST_TASKS_PATH)).toBe(true);
        const savedContent = JSON.parse(fs.readFileSync(TEST_TASKS_PATH, 'utf8'));
        expect(savedContent).toEqual(testData);
      });

      test('should handle file write errors', async () => {
        const testData = JSON.parse(JSON.stringify(TEST_FIXTURES.emptyFeaturesFile));

        // Make directory read-only to prevent file creation
        fs.chmodSync(TEST_PROJECT_ROOT, 0o444);

        await expect(api._saveFeatures(testData)).rejects.toThrow();

        // Restore permissions for cleanup
        fs.chmodSync(TEST_PROJECT_ROOT, 0o755);
      });
    });
  });

  // =================== FEATURE VALIDATION TESTS ===================

  describe('Feature Validation', () => {
    describe('_validateFeatureData', () => {
      test('should validate correct feature data successfully', () => {
        expect(() => api._validateFeatureData(TEST_FIXTURES.validFeature)).not.toThrow();
      });

      test('should reject null or undefined feature data', () => {
        expect(() => api._validateFeatureData(null)).toThrow('Feature data must be a valid object');
        expect(() => api._validateFeatureData(undefined)).toThrow('Feature data must be a valid object');
        expect(() => api._validateFeatureData('string')).toThrow('Feature data must be a valid object');
      });

      test('should reject missing required fields', () => {
        const missingFields = [
          'missingTitle',
          'missingDescription',
          'missingBusinessValue',
          'missingCategory'
        ];

        missingFields.forEach(key => {
          expect(() => api._validateFeatureData(TEST_FIXTURES.invalidFeatures[key]))
            .toThrow(/Required field.*is missing or empty/);
        });
      });

      test('should reject empty required fields', () => {
        expect(() => api._validateFeatureData(TEST_FIXTURES.invalidFeatures.emptyTitle))
          .toThrow(/Required field.*is missing or empty/);
      });

      test('should reject invalid category', () => {
        expect(() => api._validateFeatureData(TEST_FIXTURES.invalidFeatures.invalidCategory))
          .toThrow(/Invalid category.*Must be one of/);
      });

      test('should reject title length violations', () => {
        expect(() => api._validateFeatureData(TEST_FIXTURES.invalidFeatures.shortTitle))
          .toThrow('Feature title must be between 10 and 200 characters');
        expect(() => api._validateFeatureData(TEST_FIXTURES.invalidFeatures.longTitle))
          .toThrow('Feature title must be between 10 and 200 characters');
      });

      test('should reject description length violations', () => {
        expect(() => api._validateFeatureData(TEST_FIXTURES.invalidFeatures.shortDescription))
          .toThrow('Feature description must be between 20 and 2000 characters');
        expect(() => api._validateFeatureData(TEST_FIXTURES.invalidFeatures.longDescription))
          .toThrow('Feature description must be between 20 and 2000 characters');
      });

      test('should reject business value length violations', () => {
        expect(() => api._validateFeatureData(TEST_FIXTURES.invalidFeatures.shortBusinessValue))
          .toThrow('Business value must be between 10 and 1000 characters');
        expect(() => api._validateFeatureData(TEST_FIXTURES.invalidFeatures.longBusinessValue))
          .toThrow('Business value must be between 10 and 1000 characters');
      });
    });

    describe('_generateFeatureId', () => {
      test('should generate unique feature IDs', () => {
        const id1 = api._generateFeatureId();
        const id2 = api._generateFeatureId();

        expect(id1).toMatch(/^feature_\d+_[a-f0-9]+$/);
        expect(id2).toMatch(/^feature_\d+_[a-f0-9]+$/);
        expect(id1).not.toBe(id2);
      });

      test('should generate IDs with correct format', () => {
        const id = api._generateFeatureId();
        const parts = id.split('_');

        expect(parts).toHaveLength(3);
        expect(parts[0]).toBe('feature');
        expect(parseInt(parts[1])).toBeGreaterThan(0);
        expect(parts[2]).toMatch(/^[a-f0-9]+$/);
      });
    });
  });

  // =================== FEATURE MANAGEMENT TESTS ===================

  describe('Feature Management', () => {
    beforeEach(() => {
      // Setup empty features file for each test
      fs.writeFileSync(
        TEST_TASKS_PATH,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile, null, 2)
      );
    });

    describe('suggestFeature', () => {
      test('should create new feature suggestion successfully', async () => {
        const result = await api.suggestFeature(TEST_FIXTURES.validFeature);

        expect(result.success).toBe(true);
        expect(result.feature).toBeDefined();
        expect(result.feature.id).toMatch(/^feature_\d+_[a-f0-9]+$/);
        expect(result.feature.status).toBe('suggested');
        expect(result.feature.title).toBe(TEST_FIXTURES.validFeature.title);
        expect(result.message).toBe('Feature suggestion created successfully');

        // Verify feature structure
        expect(result.feature.created_at).toBeDefined();
        expect(result.feature.updated_at).toBeDefined();
      });

      test('should handle validation errors gracefully', async () => {
        const result = await api.suggestFeature(TEST_FIXTURES.invalidFeatures.missingTitle);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Required field');
        expect(result.feature).toBeUndefined();
      });

      test('should update metadata correctly', async () => {
        const result = await api.suggestFeature(TEST_FIXTURES.validFeature);
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.metadata.total_features).toBe(1);
        expect(features.metadata.updated).toBe('2025-09-23T12:00:00.000Z');
      });
    });

    describe('approveFeature', () => {
      let testFeatureId;

      beforeEach(async () => {
        // Create a suggested feature for approval tests
        const suggestResult = await api.suggestFeature(TEST_FIXTURES.validFeature);
        testFeatureId = suggestResult.feature.id;
      });

      test('should approve suggested feature successfully', async () => {
        const result = await api.approveFeature(testFeatureId, TEST_FIXTURES.validApprovalData);

        expect(result.success).toBe(true);
        expect(result.feature.id).toBe(testFeatureId);
        expect(result.feature.status).toBe('approved');
        expect(result.feature.approved_by).toBe(TEST_FIXTURES.validApprovalData.approved_by);
        expect(result.feature.approval_notes).toBe(TEST_FIXTURES.validApprovalData.notes);
        expect(result.message).toBe('Feature approved successfully');
      });

      test('should approve feature with default approval data', async () => {
        const result = await api.approveFeature(testFeatureId);

        expect(result.success).toBe(true);
        expect(result.feature.approved_by).toBe('system');
        expect(result.feature.approval_notes).toBe('');
      });

      test('should reject approval of non-existent feature', async () => {
        const result = await api.approveFeature('non-existent-id');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Feature with ID non-existent-id not found');
      });

      test('should reject approval of non-suggested feature', async () => {
        // First approve the feature
        await api.approveFeature(testFeatureId);

        // Try to approve again
        const result = await api.approveFeature(testFeatureId);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Feature must be in 'suggested' status to approve");
      });

      test('should update approval history correctly', async () => {
        const result = await api.approveFeature(testFeatureId, TEST_FIXTURES.validApprovalData);
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.metadata.approval_history).toHaveLength(1);

        const historyEntry = features.metadata.approval_history[0];
        expect(historyEntry.feature_id).toBe(testFeatureId);
        expect(historyEntry.action).toBe('approved');
        expect(historyEntry.approved_by).toBe(TEST_FIXTURES.validApprovalData.approved_by);
      });
    });

    describe('rejectFeature', () => {
      let testFeatureId;

      beforeEach(async () => {
        // Create a suggested feature for rejection tests
        const suggestResult = await api.suggestFeature(TEST_FIXTURES.validFeature);
        testFeatureId = suggestResult.feature.id;
      });

      test('should reject suggested feature successfully', async () => {
        const result = await api.rejectFeature(testFeatureId, TEST_FIXTURES.validRejectionData);

        expect(result.success).toBe(true);
        expect(result.feature.id).toBe(testFeatureId);
        expect(result.feature.status).toBe('rejected');
        expect(result.feature.rejected_by).toBe(TEST_FIXTURES.validRejectionData.rejected_by);
        expect(result.feature.rejection_reason).toBe(TEST_FIXTURES.validRejectionData.reason);
        expect(result.message).toBe('Feature rejected successfully');
      });

      test('should reject feature with default rejection data', async () => {
        const result = await api.rejectFeature(testFeatureId);

        expect(result.success).toBe(true);
        expect(result.feature.rejected_by).toBe('system');
        expect(result.feature.rejection_reason).toBe('No reason provided');
      });

      test('should reject rejection of non-existent feature', async () => {
        const result = await api.rejectFeature('non-existent-id');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Feature with ID non-existent-id not found');
      });

      test('should reject rejection of non-suggested feature', async () => {
        // First approve the feature
        await api.approveFeature(testFeatureId);

        // Try to reject the approved feature
        const result = await api.rejectFeature(testFeatureId);

        expect(result.success).toBe(false);
        expect(result.error).toContain("Feature must be in 'suggested' status to reject");
      });

      test('should update approval history correctly', async () => {
        const result = await api.rejectFeature(testFeatureId, TEST_FIXTURES.validRejectionData);
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.metadata.approval_history).toHaveLength(1);

        const historyEntry = features.metadata.approval_history[0];
        expect(historyEntry.feature_id).toBe(testFeatureId);
        expect(historyEntry.action).toBe('rejected');
        expect(historyEntry.rejected_by).toBe(TEST_FIXTURES.validRejectionData.rejected_by);
        expect(historyEntry.reason).toBe(TEST_FIXTURES.validRejectionData.reason);
      });
    });

    describe('bulkApproveFeatures', () => {
      let suggestedFeatureIds;

      beforeEach(async () => {
        // Create multiple suggested features
        const features = [
          { ...TEST_FIXTURES.validFeature, title: 'Feature 1 for bulk approval' },
          { ...TEST_FIXTURES.validFeature, title: 'Feature 2 for bulk approval' },
          { ...TEST_FIXTURES.validFeature, title: 'Feature 3 for bulk approval' }
        ];

        suggestedFeatureIds = [];
        for (const feature of features) {
          const result = await api.suggestFeature(feature);
          suggestedFeatureIds.push(result.feature.id);
        }
      });

      test('should approve multiple features successfully', async () => {
        const result = await api.bulkApproveFeatures(
          suggestedFeatureIds,
          TEST_FIXTURES.validApprovalData
        );

        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(3);
        expect(result.error_count).toBe(0);
        expect(result.approved_features).toHaveLength(3);
        expect(result.errors).toHaveLength(0);

        // Verify all features are approved
        result.approved_features.forEach(approvedFeature => {
          expect(approvedFeature.status).toBe('approved');
          expect(approvedFeature.success).toBe(true);
        });
      });

      test('should handle mixed success and failure scenarios', async () => {
        // Approve one feature first to create a failure case
        await api.approveFeature(suggestedFeatureIds[1]);

        const result = await api.bulkApproveFeatures(suggestedFeatureIds);

        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(2);
        expect(result.error_count).toBe(1);
        expect(result.approved_features).toHaveLength(2);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain("must be in 'suggested' status to approve");
        expect(result.errors[0]).toContain('Current status: approved');
      });

      test('should handle non-existent feature IDs', async () => {
        const invalidIds = ['non-existent-1', 'non-existent-2'];

        const result = await api.bulkApproveFeatures(invalidIds);

        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(0);
        expect(result.error_count).toBe(2);
        expect(result.errors).toHaveLength(2);
        result.errors.forEach(error => {
          expect(error).toContain('not found');
        });
      });

      test('should handle empty feature IDs array', async () => {
        const result = await api.bulkApproveFeatures([]);

        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(0);
        expect(result.error_count).toBe(0);
        expect(result.approved_features).toHaveLength(0);
        expect(result.errors).toHaveLength(0);
      });
    });

    describe('listFeatures', () => {
      beforeEach(() => {
        // Use features file with test data
        fs.writeFileSync(
          TEST_TASKS_PATH,
          JSON.stringify(TEST_FIXTURES.featuresWithData, null, 2)
        );
      });

      test('should list all features without filter', async () => {
        const result = await api.listFeatures();

        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(3);
        expect(result.total).toBe(3);
        expect(result.metadata).toBeDefined();

        // Verify features are correctly returned
        const statuses = result.features.map(f => f.status);
        expect(statuses).toContain('suggested');
        expect(statuses).toContain('approved');
        expect(statuses).toContain('rejected');
      });

      test('should filter features by status', async () => {
        const result = await api.listFeatures({ status: 'approved' });

        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(1);
        expect(result.features[0].status).toBe('approved');
        expect(result.total).toBe(1);
      });

      test('should filter features by category', async () => {
        const result = await api.listFeatures({ category: 'enhancement' });

        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(1);
        expect(result.features[0].category).toBe('enhancement');
      });

      test('should return empty array for non-matching filters', async () => {
        const result = await api.listFeatures({ status: 'implemented' });

        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(0);
        expect(result.total).toBe(0);
      });
    });

    describe('getFeatureStats', () => {
      beforeEach(() => {
        fs.writeFileSync(
          TEST_TASKS_PATH,
          JSON.stringify(TEST_FIXTURES.featuresWithData, null, 2)
        );
      });

      test('should calculate feature statistics correctly', async () => {
        const result = await api.getFeatureStats();

        expect(result.success).toBe(true);
        expect(result.stats).toBeDefined();
        expect(result.metadata).toBeDefined();

        const stats = result.stats;
        expect(stats.total).toBe(3);
        expect(stats.by_status.suggested).toBe(1);
        expect(stats.by_status.approved).toBe(1);
        expect(stats.by_status.rejected).toBe(1);
        expect(stats.by_category.enhancement).toBe(1);
        expect(stats.by_category['new-feature']).toBe(1);
        expect(stats.by_category.documentation).toBe(1);
      });

      test('should include recent activity from approval history', async () => {
        const result = await api.getFeatureStats();

        expect(result.success).toBe(true);
        expect(result.stats.recent_activity).toBeDefined();
        expect(Array.isArray(result.stats.recent_activity)).toBe(true);
        expect(result.stats.recent_activity.length).toBeGreaterThan(0);
      });

      test('should handle empty features file', async () => {
        fs.writeFileSync(
          TEST_TASKS_PATH,
          JSON.stringify(TEST_FIXTURES.emptyFeaturesFile, null, 2)
        );

        const result = await api.getFeatureStats();

        expect(result.success).toBe(true);
        expect(result.stats.total).toBe(0);
        expect(result.stats.by_status).toEqual({});
        expect(result.stats.by_category).toEqual({});
      });
    });
  });

  // =================== TIMEOUT HANDLING TESTS ===================

  describe('Timeout Handling', () => {
    describe('withTimeout', () => {
      test('should resolve normally for quick operations', async () => {
        const quickPromise = Promise.resolve('success');

        const result = await api.withTimeout(quickPromise, 1000);
        expect(result).toBe('success');
      });

      test('should timeout slow operations with custom timeout', async () => {
        const slowPromise = new Promise(resolve => {
          setTimeout(() => resolve('slow'), 200);
        });

        await expect(api.withTimeout(slowPromise, 50)).rejects.toThrow('Operation timed out after 50ms');
      });

      test('should use default timeout when not specified', async () => {
        const slowPromise = new Promise(resolve => {
          setTimeout(() => resolve('slow'), 15000);
        });

        await expect(api.withTimeout(slowPromise)).rejects.toThrow('Operation timed out after 10000ms');
      });

      test('should handle promise rejections correctly', async () => {
        const rejectPromise = Promise.reject(new Error('Promise failed'));

        await expect(api.withTimeout(rejectPromise, 1000)).rejects.toThrow('Promise failed');
      });
    });
  });

  // =================== ERROR HANDLING TESTS ===================

  describe('Error Handling', () => {
    test('should handle corrupted TASKS.json gracefully', async () => {
      fs.writeFileSync(TEST_TASKS_PATH, '{ invalid json }');

      const result = await api.suggestFeature(TEST_FIXTURES.validFeature);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load features');
    });

    test('should handle file permission errors', async () => {
      // Create file with no permissions
      fs.writeFileSync(TEST_TASKS_PATH, JSON.stringify(TEST_FIXTURES.emptyFeaturesFile));
      fs.chmodSync(TEST_TASKS_PATH, 0o000);

      const result = await api.suggestFeature(TEST_FIXTURES.validFeature);

      expect(result.success).toBe(false);

      // Restore permissions for cleanup
      fs.chmodSync(TEST_TASKS_PATH, 0o644);
    });

    test('should handle unexpected errors in operations', async () => {
      // Mock a method to throw an unexpected error
      jest.spyOn(api, '_generateFeatureId').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const result = await api.suggestFeature(TEST_FIXTURES.validFeature);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });
  });

  // =================== API METHODS TESTS ===================

  describe('API Documentation Methods', () => {
    describe('getApiMethods', () => {
      test('should return API methods information', () => {
        const result = api.getApiMethods();

        expect(result.success).toBe(true);
        expect(result.message).toContain('Feature Management API');
        expect(result.cliMapping).toBeDefined();
        expect(result.availableCommands).toBeDefined();
        expect(result.guide).toBeDefined();

        // Verify core commands are included
        expect(result.availableCommands).toContain('suggest-feature');
        expect(result.availableCommands).toContain('approve-feature');
        expect(result.availableCommands).toContain('reject-feature');
        expect(result.availableCommands).toContain('list-features');
        expect(result.availableCommands).toContain('feature-stats');
      });

      test('should include CLI mapping for all commands', () => {
        const result = api.getApiMethods();

        expect(result.cliMapping['suggest-feature']).toBe('suggestFeature');
        expect(result.cliMapping['approve-feature']).toBe('approveFeature');
        expect(result.cliMapping['reject-feature']).toBe('rejectFeature');
        expect(result.cliMapping['list-features']).toBe('listFeatures');
        expect(result.cliMapping['feature-stats']).toBe('getFeatureStats');
      });
    });

    describe('getComprehensiveGuide', () => {
      test('should return comprehensive guide with timeout', async () => {
        const result = await api.getComprehensiveGuide();

        expect(result.success).toBe(true);
        expect(result.featureManager).toBeDefined();
        expect(result.featureWorkflow).toBeDefined();
        expect(result.coreCommands).toBeDefined();
        expect(result.workflows).toBeDefined();
        expect(result.examples).toBeDefined();
        expect(result.requirements).toBeDefined();
      });

      test('should include feature workflow information', async () => {
        const result = await api.getComprehensiveGuide();

        expect(result.featureWorkflow.statuses).toBeDefined();
        expect(result.featureWorkflow.transitions).toBeDefined();
        expect(result.featureWorkflow.statuses.suggested).toBe('Initial feature suggestion - requires approval');
        expect(result.featureWorkflow.statuses.approved).toBe('Feature approved for implementation');
      });

      test('should include usage examples', async () => {
        const result = await api.getComprehensiveGuide();

        expect(result.success).toBe(true);
        expect(result.examples.featureCreation).toBeDefined();
        expect(result.examples.approvalWorkflow).toBeDefined();
        expect(result.examples.initializationTracking).toBeDefined();
      });

      test('should handle timeout errors gracefully', async () => {
        // Mock withTimeout to simulate timeout
        jest.spyOn(api, 'withTimeout').mockRejectedValue(new Error('Operation timed out'));

        const result = await api.getComprehensiveGuide();

        expect(result.success).toBe(false);
        expect(result.error).toBe('Operation timed out');
        expect(result.guide).toBeDefined();
      });
    });

    describe('_getFallbackGuide', () => {
      test('should return fallback guide for different contexts', () => {
        const generalGuide = api._getFallbackGuide('general');
        const apiGuide = api._getFallbackGuide('api-methods');

        expect(generalGuide.message).toContain('general');
        expect(apiGuide.message).toContain('api-methods');
        expect(generalGuide.commands).toBeDefined();
        expect(generalGuide.helpText).toBeDefined();
      });

      test('should include essential commands in fallback guide', () => {
        const guide = api._getFallbackGuide();

        expect(guide.commands).toContain('guide - Get comprehensive guide');
        expect(guide.commands).toContain('suggest-feature - Create feature suggestion');
        expect(guide.commands).toContain('get-initialization-stats - Get initialization usage statistics by time buckets');
      });
    });
  });

  // =================== AGENT MANAGEMENT TESTS ===================

  describe('Agent Management', () => {
    beforeEach(() => {
      fs.writeFileSync(
        api.tasksPath,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile, null, 2)
      );
    });

    describe('initializeAgent', () => {
      test('should initialize new agent successfully', async () => {
        const AGENT_ID = 'test-agent-001';
        const result = await api.initializeAgent(AGENT_ID);

        expect(result.success).toBe(true);
        expect(result.agent).toBeDefined();
        expect(result.agent.id).toBe(AGENT_ID);
        expect(result.agent.status).toBe('initialized');
        expect(result.agent.sessionId).toBeDefined();
      });

      test('should handle agent initialization errors', async () => {
        // Make directory read-only to cause write error
        fs.chmodSync(TEST_PROJECT_ROOT, 0o444);

        const result = await api.initializeAgent('error-agent');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to initialize agent');

        // Restore permissions for cleanup
        fs.chmodSync(TEST_PROJECT_ROOT, 0o755);
      });
    });

    describe('reinitializeAgent', () => {
      test('should reinitialize existing agent', async () => {
        const AGENT_ID = 'test-agent-002';

        // First initialize
        await api.initializeAgent(AGENT_ID);

        // Then reinitialize
        const result = await api.reinitializeAgent(AGENT_ID);

        expect(result.success).toBe(true);
        expect(result.agent).toBeDefined();
        expect(result.agent.id).toBe(AGENT_ID);
        expect(result.agent.previousSessions).toBeDefined();
      });

      test('should handle reinitialization errors', async () => {
        // Make directory read-only to cause write error
        fs.chmodSync(TEST_PROJECT_ROOT, 0o444);

        const result = await api.reinitializeAgent('error-agent');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to reinitialize agent');

        // Restore permissions for cleanup
        fs.chmodSync(TEST_PROJECT_ROOT, 0o755);
      });
    });

    describe('authorizeStop', () => {
      test('should authorize stop with reason', async () => {
        const AGENT_ID = 'test-agent-003';
        const reason = 'Task completed successfully';

        const result = await api.authorizeStop(AGENT_ID, reason);

        expect(result.success).toBe(true);
        expect(result.authorization).toBeDefined();
        expect(result.authorization.authorized_by).toBe(AGENT_ID);
        expect(result.authorization.reason).toBe(reason);
        expect(result.authorization.timestamp).toBeDefined();

        // Verify flag file was created
        expect(fs.existsSync(TEST_STOP_FLAG)).toBe(true);
      });

      test('should authorize stop with default reason', async () => {
        const AGENT_ID = 'test-agent-004';
        const result = await api.authorizeStop(AGENT_ID);

        expect(result.success).toBe(true);
        expect(result.authorization.reason).toBe('Agent authorized stop after completing all tasks and achieving project perfection');
      });

      test('should create stop flag file with authorization data', async () => {
        const AGENT_ID = 'test-agent-005';
        const reason = 'Custom reason';

        await api.authorizeStop(AGENT_ID, reason);

        expect(fs.existsSync(TEST_STOP_FLAG)).toBe(true);

        const flagContent = JSON.parse(fs.readFileSync(TEST_STOP_FLAG, 'utf8'));
        expect(flagContent.authorized_by).toBe(AGENT_ID);
        expect(flagContent.reason).toBe(reason);
        expect(flagContent.timestamp).toBeDefined();
      });
    });
  });

  // =================== INITIALIZATION STATS TESTS ===================

  describe('Initialization Statistics', () => {
    beforeEach(() => {
      fs.writeFileSync(
        api.tasksPath,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile, null, 2)
      );
    });

    describe('getInitializationStats', () => {
      test('should return initialization statistics', async () => {
        const result = await api.getInitializationStats();

        expect(result.success).toBe(true);
        expect(result.stats).toBeDefined();
        expect(result.stats.current_bucket).toBeDefined();
        expect(result.stats.today_totals).toBeDefined();
        expect(result.stats.time_buckets).toBeDefined();
        expect(result.stats.recent_activity).toBeDefined();
      });

      test('should handle stats retrieval errors', async () => {
        // Make file unreadable
        fs.chmodSync(TEST_TASKS_PATH, 0o000);

        const result = await api.getInitializationStats();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to load features');

        // Restore permissions for cleanup
        fs.chmodSync(TEST_TASKS_PATH, 0o644);
      });

      test('should include current time bucket', async () => {
        const result = await api.getInitializationStats();

        expect(result.success).toBe(true);
        expect(result.stats.current_bucket).toMatch(/^\d{2}:\d{2}-\d{2}:\d{2}$/);
      });

      test('should track initialization counts', async () => {
        // Initialize an agent to create stats
        await api.initializeAgent('stats-test-agent');

        const result = await api.getInitializationStats();

        expect(result.success).toBe(true);
        expect(result.stats.today_totals).toBeDefined();
        expect(typeof result.stats.today_totals.initializations).toBe('number');
        expect(typeof result.stats.today_totals.reinitializations).toBe('number');
      });
    });
  });

  // =================== CLEANUP TESTS ===================

  describe('Cleanup', () => {
    test('should cleanup resources', () => {
      expect(() => api.cleanup()).not.toThrow();
    });
  });
});

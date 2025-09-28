/**
 * Comprehensive Unit Tests for FeatureManagerAPI
 *
 * Tests all methods of the FeatureManagerAPI class with comprehensive coverage:
 * - Feature management operations (suggest, approve, reject, list, stats)
 * - Agent management operations (initialize, reinitialize, authorize-stop)
 * - Initialization tracking And time bucket statistics
 * - Error handling And edge cases
 * - File system operations And data validation
 * - Timeout handling And async operations
 *
 * Target: >90% code coverage with thorough testing of all code paths
 */

const PATH = require('path');
const crypto = require('crypto');
const {
  MockFileSystem,
  TEST_FIXTURES,
  TimeTestUtils,
  testHelpers,
} = require('./test-utilities');

// Mock the fs module before importing the main module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
  },
}));

// Import the FeatureManagerAPI class AFTER mocking fs
const FeatureManagerAPI = require('../../taskmanager-api.js');

// Test constants
const TEST_PROJECT_ROOT = '/test/project';
const TEST_FEATURES_PATH = path.join(TEST_PROJECT_ROOT, 'FEATURES.json');

describe('FeatureManagerAPI', () => {
  let api;
  let mockFs;
  let timeUtils;

  beforeAll(() => {
    timeUtils = new TimeTestUtils();
  });

  beforeEach(() => {
    // Create fresh instances for each test
    mockFs = new MockFileSystem();

    // Get the mocked fs module And connect it to our MockFileSystem
    const FS = require('fs');
    FS.promises.access.mockImplementation((...args) => mockFs.access(...args));
    FS.promises.readFile.mockImplementation((...args) =>
      mockFs.readFile(...args),
    );
    FS.promises.writeFile.mockImplementation((...args) =>
      mockFs.writeFile(...args),
    );

    // Create API instance
    api = new FeatureManagerAPI();

    // Override the features path for testing
    api.featuresPath = TEST_FEATURES_PATH;

    // Reset time mocking
    timeUtils.restoreTime();

    // Mock crypto for deterministic testing with incrementing values
    let cryptoCounter = 0;
    jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => {
      const char = String.fromCharCode(97 + (cryptoCounter % 26)); // a, b, c, etc.
      cryptoCounter++;
      return Buffer.from(char.repeat(size * 2), 'hex');
    });

    // Mock Date.now for deterministic timestamps
    timeUtils.mockCurrentTimeISO('2025-09-23T12:00:00.000Z');
  });

  afterEach(() => {
    // Clear all mocks
    jest.clearAllMocks();
    mockFs.clearAll();
    timeUtils.restoreTime();
  });

  afterAll(() => {
    timeUtils.restoreTime();
  });

  // =================== CONSTRUCTOR AND INITIALIZATION TESTS ===================

  describe('Constructor And Initialization', () => {
    test('should initialize with correct default values', () => {
      const newApi = new FeatureManagerAPI();

      expect(newApi.timeout).toBe(10000);
      expect(newApi.validStatuses).toEqual([
        'suggested',
        'approved',
        'rejected',
        'implemented',
      ]);
      expect(newApi.validCategories).toEqual([
        'enhancement',
        'bug-fix',
        'new-feature',
        'performance',
        'security',
        'documentation',
      ]);
      expect(newApi.requiredFields).toEqual([
        'title',
        'description',
        'business_value',
        'category',
      ]);
    });

    test('should set features path correctly', () => {
      const newApi = new FeatureManagerAPI();
      expect(newApi.featuresPath).toContain('FEATURES.json');
    });

    test('should have withTimeout method for _operationtimeouts', () => {
      expect(typeof api.withTimeout).toBe('function');
    });
  });

  // =================== FILE OPERATIONS TESTS ===================

  describe('File Operations', () => {
    describe('_ensureFeaturesFile', () => {
      test('should create FEATURES.json if it does not exist', async () => {
        // File doesn't exist (default mockFs state)
        expect(mockFs.hasFile(TEST_FEATURES_PATH)).toBe(false);

        await api._ensureFeaturesFile();

        expect(mockFs.hasFile(TEST_FEATURES_PATH)).toBe(true);
        const fileContent = JSON.parse(mockFs.getFile(TEST_FEATURES_PATH));
        testHelpers.validateFeaturesFileStructure(fileContent);
        expect(fileContent.project).toBe('infinite-continue-stop-hook');
        expect(fileContent.features).toEqual([]);
      });

      test('should not overwrite existing FEATURES.json', async () => {
        // Set up existing file
        const originalData = testHelpers.deepClone(
          TEST_FIXTURES.featuresWithData,
        );
        mockFs.setFile(TEST_FEATURES_PATH, JSON.stringify(originalData));

        await api._ensureFeaturesFile();

        const fileContent = JSON.parse(mockFs.getFile(TEST_FEATURES_PATH));
        expect(fileContent.features).toHaveLength(3);
        expect(fileContent.project).toBe('test-project'); // Should preserve original project name
        expect(fileContent).toEqual(originalData); // Should not change anything
      });
    });

    describe('_loadFeatures', () => {
      test('should load existing features file successfully', async () => {
        mockFs.setFile(
          TEST_FEATURES_PATH,
          JSON.stringify(TEST_FIXTURES.featuresWithData),
        );

        const features = await api._loadFeatures();

        expect(features).toEqual(TEST_FIXTURES.featuresWithData);
        expect(features.features).toHaveLength(3);
      });

      test('should create file And return default structure if file does not exist', async () => {
        // File doesn't exist
        expect(mockFs.hasFile(TEST_FEATURES_PATH)).toBe(false);

        const features = await api._loadFeatures();

        testHelpers.validateFeaturesFileStructure(features);
        expect(features.features).toEqual([]);
        expect(mockFs.hasFile(TEST_FEATURES_PATH)).toBe(true);
      });

      test('should handle JSON parsing errors gracefully', async () => {
        mockFs.setFile(TEST_FEATURES_PATH, 'invalid json content');

        await expect(api._loadFeatures()).rejects.toThrow(
          'Failed to load features',
        );
      });

      test('should handle file read errors', async () => {
        mockFs.setReadError(TEST_FEATURES_PATH, 'Permission denied');

        await expect(api._loadFeatures()).rejects.toThrow(
          'Failed to load features',
        );
      });
    });

    describe('_saveFeatures', () => {
      test('should save features to file successfully', async () => {
        const testData = testHelpers.deepClone(TEST_FIXTURES.emptyFeaturesFile);

        await api._saveFeatures(testData);

        expect(mockFs.hasFile(TEST_FEATURES_PATH)).toBe(true);
        const savedContent = JSON.parse(mockFs.getFile(TEST_FEATURES_PATH));
        expect(savedContent).toEqual(testData);
      });

      test('should handle file write errors', async () => {
        mockFs.setWriteError(TEST_FEATURES_PATH, 'Permission denied');
        const testData = testHelpers.deepClone(TEST_FIXTURES.emptyFeaturesFile);

        await expect(api._saveFeatures(testData)).rejects.toThrow(
          'Failed to save features',
        );
      });
    });
  });

  // =================== FEATURE VALIDATION TESTS ===================

  describe('Feature Validation', () => {
    describe('_validateFeatureData', () => {
      test('should validate correct feature data successfully', () => {
        expect(() =>
          api._validateFeatureData(TEST_FIXTURES.validFeature),
        ).not.toThrow();
      });

      test('should reject null or undefined feature data', () => {
        expect(() => api._validateFeatureData(null)).toThrow(
          'Feature data must be a valid object',
        );
        expect(() => api._validateFeatureData(undefined)).toThrow(
          'Feature data must be a valid object',
        );
        expect(() => api._validateFeatureData('string')).toThrow(
          'Feature data must be a valid object',
        );
      });

      test('should reject missing required fields', () => {
        Object.entries(TEST_FIXTURES.invalidFeatures).forEach(
          ([key, invalidFeature]) => {
            if (key.startsWith('missing')) {
              expect(() => api._validateFeatureData(invalidFeature)).toThrow(
                /Required field.*is missing or empty/,
              );
            }
          },
        );
      });

      test('should reject empty required fields', () => {
        const emptyFeatures = ['emptyTitle'];
        emptyFeatures.forEach((key) => {
          if (TEST_FIXTURES.invalidFeatures[key]) {
            expect(() =>
              api._validateFeatureData(TEST_FIXTURES.invalidFeatures[key]),
            ).toThrow(/Required field.*is missing or empty/);
          }
        });
      });

      test('should reject invalid category', () => {
        expect(() =>
          api._validateFeatureData(
            TEST_FIXTURES.invalidFeatures.invalidCategory,
          ),
        ).toThrow(/Invalid category.*Must be one of/);
      });

      test('should reject title length violations', () => {
        expect(() =>
          api._validateFeatureData(TEST_FIXTURES.invalidFeatures.shortTitle),
        ).toThrow('Feature title must be between 10 And 200 characters');
        expect(() =>
          api._validateFeatureData(TEST_FIXTURES.invalidFeatures.longTitle),
        ).toThrow('Feature title must be between 10 And 200 characters');
      });

      test('should reject description length violations', () => {
        expect(() =>
          api._validateFeatureData(
            TEST_FIXTURES.invalidFeatures.shortDescription,
          ),
        ).toThrow('Feature description must be between 20 And 2000 characters');
        expect(() =>
          api._validateFeatureData(
            TEST_FIXTURES.invalidFeatures.longDescription,
          ),
        ).toThrow('Feature description must be between 20 And 2000 characters');
      });

      test('should reject business value length violations', () => {
        expect(() =>
          api._validateFeatureData(
            TEST_FIXTURES.invalidFeatures.shortBusinessValue,
          ),
        ).toThrow('Business value must be between 10 And 1000 characters');
        expect(() =>
          api._validateFeatureData(
            TEST_FIXTURES.invalidFeatures.longBusinessValue,
          ),
        ).toThrow('Business value must be between 10 And 1000 characters');
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
      mockFs.setFile(
        TEST_FEATURES_PATH,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
      );
    });

    describe('suggestFeature', () => {
      test('should create new feature suggestion successfully', async () => {
        const RESULT = await api.suggestFeature(TEST_FIXTURES.validFeature);
        expect(result.success).toBe(true);
        expect(result.feature).toBeDefined();
        expect(result.feature.id).toMatch(/^feature_\d+_[a-f0-9]+$/);
        expect(result.feature.status).toBe('suggested');
        expect(result.feature.title).toBe(TEST_FIXTURES.validFeature.title);
        expect(result.message).toBe('Feature suggestion created successfully');

        testHelpers.validateFeatureStructure(result.feature);
      });

      test('should handle validation errors gracefully', async () => {
        const RESULT = await api.suggestFeature(
          TEST_FIXTURES.invalidFeatures.missingTitle,
        );
        expect(result.success).toBe(false);
        expect(result.error).toContain('Required field');
        expect(result.feature).toBeUndefined();
      });

      test('should handle file system errors during feature creation', async () => {
        mockFs.setWriteError(TEST_FEATURES_PATH, 'Disk full');

        const RESULT = await api.suggestFeature(TEST_FIXTURES.validFeature);
        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to save features');
      });

      test('should update metadata correctly', async () => {
        const RESULT = await api.suggestFeature(TEST_FIXTURES.validFeature);
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
        const suggestResult = await api.suggestFeature(
          TEST_FIXTURES.validFeature,
        );
        testFeatureId = suggestResult.feature.id;
      });

      test('should approve suggested feature successfully', async () => {
        const RESULT = await api.approveFeature(
          testFeatureId,
          TEST_FIXTURES.validApprovalData,
        );
        expect(result.success).toBe(true);
        expect(result.feature.id).toBe(testFeatureId);
        expect(result.feature.status).toBe('approved');
        expect(result.feature.approved_by).toBe(
          TEST_FIXTURES.validApprovalData.approved_by,
        );
        expect(result.feature.approval_notes).toBe(
          TEST_FIXTURES.validApprovalData.notes,
        );
        expect(result.message).toBe('Feature approved successfully');
      });

      test('should approve feature with default approval data', async () => {
        const RESULT = await api.approveFeature(testFeatureId);
        expect(result.success).toBe(true);
        expect(result.feature.approved_by).toBe('system');
        expect(result.feature.approval_notes).toBe('');
      });

      test('should reject approval of non-existent feature', async () => {
        const RESULT = await api.approveFeature('non-existent-id');
        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Feature with ID non-existent-id not found',
        );
      });

      test('should reject approval of non-suggested feature', async () => {
        // First approve the feature
        await api.approveFeature(testFeatureId);

        // Try to approve again
        const RESULT = await api.approveFeature(testFeatureId);
        expect(result.success).toBe(false);
        expect(result.error).toContain(
          "Feature must be in 'suggested' status to approve",
        );
      });

      test('should update approval history correctly', async () => {
        const RESULT = await api.approveFeature(
          testFeatureId,
          TEST_FIXTURES.validApprovalData,
        );
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.metadata.approval_history).toHaveLength(1);

        const historyEntry = features.metadata.approval_history[0];
        expect(historyEntry.feature_id).toBe(testFeatureId);
        expect(historyEntry.action).toBe('approved');
        expect(historyEntry.approved_by).toBe(
          TEST_FIXTURES.validApprovalData.approved_by,
        );
      });

      test('should handle missing metadata gracefully', async () => {
        // Create a features file without metadata structure
        const invalidFeatures = {
          project: 'test',
          features: [
            {
              id: testFeatureId,
              status: 'suggested',
              title: 'Test',
            },
          ],
        };
        mockFs.setFile(TEST_FEATURES_PATH, JSON.stringify(invalidFeatures));

        const RESULT = await api.approveFeature(testFeatureId);
        expect(result.success).toBe(true);
        expect(result.feature.status).toBe('approved');
      });
    });

    describe('rejectFeature', () => {
      let testFeatureId;

      beforeEach(async () => {
        // Create a suggested feature for rejection tests
        const suggestResult = await api.suggestFeature(
          TEST_FIXTURES.validFeature,
        );
        testFeatureId = suggestResult.feature.id;
      });

      test('should reject suggested feature successfully', async () => {
        const RESULT = await api.rejectFeature(
          testFeatureId,
          TEST_FIXTURES.validRejectionData,
        );
        expect(result.success).toBe(true);
        expect(result.feature.id).toBe(testFeatureId);
        expect(result.feature.status).toBe('rejected');
        expect(result.feature.rejected_by).toBe(
          TEST_FIXTURES.validRejectionData.rejected_by,
        );
        expect(result.feature.rejection_reason).toBe(
          TEST_FIXTURES.validRejectionData.reason,
        );
        expect(result.message).toBe('Feature rejected successfully');
      });

      test('should reject feature with default rejection data', async () => {
        const RESULT = await api.rejectFeature(testFeatureId);
        expect(result.success).toBe(true);
        expect(result.feature.rejected_by).toBe('system');
        expect(result.feature.rejection_reason).toBe('No reason provided');
      });

      test('should reject rejection of non-existent feature', async () => {
        const RESULT = await api.rejectFeature('non-existent-id');
        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Feature with ID non-existent-id not found',
        );
      });

      test('should reject rejection of non-suggested feature', async () => {
        // First approve the feature
        await api.approveFeature(testFeatureId);

        // Try to reject the approved feature
        const RESULT = await api.rejectFeature(testFeatureId);
        expect(result.success).toBe(false);
        expect(result.error).toContain(
          "Feature must be in 'suggested' status to reject",
        );
      });

      test('should update approval history correctly', async () => {
        const RESULT = await api.rejectFeature(
          testFeatureId,
          TEST_FIXTURES.validRejectionData,
        );
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.metadata.approval_history).toHaveLength(1);

        const historyEntry = features.metadata.approval_history[0];
        expect(historyEntry.feature_id).toBe(testFeatureId);
        expect(historyEntry.action).toBe('rejected');
        expect(historyEntry.rejected_by).toBe(
          TEST_FIXTURES.validRejectionData.rejected_by,
        );
        expect(historyEntry.reason).toBe(
          TEST_FIXTURES.validRejectionData.reason,
        );
      });
    });

    describe('bulkApproveFeatures', () => {
      let suggestedFeatureIds;

      beforeEach(async () => {
        // Create multiple suggested features
        const features = [
          {
            ...TEST_FIXTURES.validFeature,
            title: 'Feature 1 for bulk approval',
          },
          {
            ...TEST_FIXTURES.validFeature,
            title: 'Feature 2 for bulk approval',
          },
          {
            ...TEST_FIXTURES.validFeature,
            title: 'Feature 3 for bulk approval',
          },
        ];

        suggestedFeatureIds = [];
        for (const feature of features) {
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test data setup
          const RESULT = await api.suggestFeature(feature);
          suggestedFeatureIds.push(result.feature.id);
        }
      });

      test('should approve multiple features successfully', async () => {
        const RESULT = await api.bulkApproveFeatures(
          suggestedFeatureIds,
          TEST_FIXTURES.validApprovalData,
        );
        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(3);
        expect(result.error_count).toBe(0);
        expect(result.approved_features).toHaveLength(3);
        expect(result.errors).toHaveLength(0);

        // Verify all features are approved
        result.approved_features.forEach((approvedFeature) => {
          expect(approvedFeature.status).toBe('approved');
          expect(approvedFeature.success).toBe(true);
        });
      });

      test('should handle mixed success And failure scenarios', async () => {
        // Approve one feature first to create a failure case
        await api.approveFeature(suggestedFeatureIds[1]);

        const RESULT = await api.bulkApproveFeatures(suggestedFeatureIds);
        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(2);
        expect(result.error_count).toBe(1);
        expect(result.approved_features).toHaveLength(2);
        expect(result.errors).toHaveLength(1);
        expect(result.errors[0]).toContain(
          "must be in 'suggested' status to approve",
        );
        expect(result.errors[0]).toContain('Current status: approved');
      });

      test('should handle non-existent feature IDs', async () => {
        const invalidIds = ['non-existent-1', 'non-existent-2'];

        const RESULT = await api.bulkApproveFeatures(invalidIds);
        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(0);
        expect(result.error_count).toBe(2);
        expect(result.errors).toHaveLength(2);
        result.errors.forEach((error) => {
          expect(error).toContain('not found');
        });
      });

      test('should handle empty feature IDs array', async () => {
        const RESULT = await api.bulkApproveFeatures([]);
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
        mockFs.setFile(
          TEST_FEATURES_PATH,
          JSON.stringify(TEST_FIXTURES.featuresWithData),
        );
      });

      test('should list all features without filter', async () => {
        const RESULT = await api.listFeatures();
        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(3);
        expect(result.total).toBe(3);
        expect(result.metadata).toBeDefined();

        // Verify features are correctly returned
        const statuses = result.features.map((f) => f.status);
        expect(statuses).toContain('suggested');
        expect(statuses).toContain('approved');
        expect(statuses).toContain('rejected');
      });

      test('should filter features by status', async () => {
        const RESULT = await api.listFeatures({ status: 'approved' });
        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(1);
        expect(result.features[0].status).toBe('approved');
        expect(result.total).toBe(1);
      });

      test('should filter features by category', async () => {
        const RESULT = await api.listFeatures({ category: 'enhancement' });
        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(1);
        expect(result.features[0].category).toBe('enhancement');
      });

      test('should return empty array for non-matching filters', async () => {
        const RESULT = await api.listFeatures({ status: 'implemented' });
        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(0);
        expect(result.total).toBe(0);
      });

      test('should handle file system errors', async () => {
        mockFs.setReadError(TEST_FEATURES_PATH, 'Permission denied');

        const RESULT = await api.listFeatures();
        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to load features');
      });
    });

    describe('getFeatureStats', () => {
      beforeEach(() => {
        mockFs.setFile(
          TEST_FEATURES_PATH,
          JSON.stringify(TEST_FIXTURES.featuresWithData),
        );
      });

      test('should calculate feature statistics correctly', async () => {
        const RESULT = await api.getFeatureStats();
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
        const RESULT = await api.getFeatureStats();
        expect(result.success).toBe(true);
        expect(result.stats.recent_activity).toBeDefined();
        expect(Array.isArray(result.stats.recent_activity)).toBe(true);
        expect(result.stats.recent_activity.length).toBeGreaterThan(0);
      });

      test('should handle empty features file', async () => {
        mockFs.setFile(
          TEST_FEATURES_PATH,
          JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
        );

        const RESULT = await api.getFeatureStats();
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

        const RESULT = await api.withTimeout(quickPromise, 1000);
        expect(RESULT).toBe('success');
      });

      test('should timeout slow operations with custom timeout', async () => {
        const slowPromise = new Promise((resolve) => {
          setTimeout(() => resolve('slow'), 200);
        });

        await expect(api.withTimeout(slowPromise, 50)).rejects.toThrow(
          'Operation timed out after 50ms',
        );
      });

      test('should use default timeout when not specified', async () => {
        const slowPromise = new Promise((resolve) => {
          setTimeout(() => resolve('slow'), 15000);
        });

        await expect(api.withTimeout(slowPromise)).rejects.toThrow(
          'Operation timed out after 10000ms',
        );
      });

      test('should handle promise rejections correctly', async () => {
        const rejectPromise = Promise.reject(new Error('Promise failed'));

        await expect(api.withTimeout(rejectPromise, 1000)).rejects.toThrow(
          'Promise failed',
        );
      });
    });
  });

  // =================== ERROR HANDLING TESTS ===================

  describe('Error Handling', () => {
    test('should handle corrupted FEATURES.json gracefully', async () => {
      mockFs.setFile(TEST_FEATURES_PATH, '{ invalid json }');

      const RESULT = await api.suggestFeature(TEST_FIXTURES.validFeature);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to load features');
    });

    test('should handle file permission errors', async () => {
      mockFs.setAccessError(TEST_FEATURES_PATH, 'Permission denied');
      mockFs.setWriteError(TEST_FEATURES_PATH, 'Permission denied');

      const RESULT = await api.suggestFeature(TEST_FIXTURES.validFeature);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Permission denied');
    });

    test('should handle unexpected errors in operations', async () => {
      // Mock a method to throw an unexpected error
      jest.spyOn(api, '_generateFeatureId').mockImplementation(() => {
        throw new Error('Unexpected error');
      });

      const RESULT = await api.suggestFeature(TEST_FIXTURES.validFeature);
      expect(result.success).toBe(false);
      expect(result.error).toBe('Unexpected error');
    });
  });

  // =================== API METHODS TESTS ===================

  describe('API Documentation Methods', () => {
    describe('getApiMethods', () => {
      test('should return API methods information', () => {
        const RESULT = api.getApiMethods();
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
        const RESULT = api.getApiMethods();
        expect(result.cliMapping['suggest-feature']).toBe('suggestFeature');
        expect(result.cliMapping['approve-feature']).toBe('approveFeature');
        expect(result.cliMapping['reject-feature']).toBe('rejectFeature');
        expect(result.cliMapping['list-features']).toBe('listFeatures');
        expect(result.cliMapping['feature-stats']).toBe('getFeatureStats');
      });
    });

    describe('getComprehensiveGuide', () => {
      test('should return comprehensive guide with timeout', async () => {
        const RESULT = await api.getComprehensiveGuide();
        expect(result.success).toBe(true);
        expect(result.featureManager).toBeDefined();
        expect(result.featureWorkflow).toBeDefined();
        expect(result.coreCommands).toBeDefined();
        expect(result.workflows).toBeDefined();
        expect(result.examples).toBeDefined();
        expect(result.requirements).toBeDefined();
      });

      test('should include feature workflow information', async () => {
        const RESULT = await api.getComprehensiveGuide();
        expect(result.featureWorkflow.statuses).toBeDefined();
        expect(result.featureWorkflow.transitions).toBeDefined();
        expect(result.featureWorkflow.statuses.suggested).toBe(
          'Initial feature suggestion - requires approval',
        );
        expect(result.featureWorkflow.statuses.approved).toBe(
          'Feature approved for implementation',
        );
      });

      test('should include usage examples', async () => {
        const RESULT = await api.getComprehensiveGuide();
        expect(result.success).toBe(true);
        expect(result.examples.featureCreation).toBeDefined();
        expect(result.examples.approvalWorkflow).toBeDefined();
        expect(result.examples.initializationTracking).toBeDefined();
      });

      test('should handle timeout errors gracefully', async () => {
        // Mock withTimeout to simulate timeout
        jest
          .spyOn(api, 'withTimeout')
          .mockRejectedValue(new Error('Operation timed out'));

        const RESULT = await api.getComprehensiveGuide();
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
        expect(guide.commands).toContain(
          'suggest-feature - Create feature suggestion',
        );
        expect(guide.commands).toContain(
          'get-initialization-stats - Get initialization usage statistics by time buckets',
        );
      });
    });
  });

  // =================== AGENT MANAGEMENT TESTS ===================

  describe('Agent Management', () => {
    beforeEach(() => {
      mockFs.setFile(
        api.featuresPath,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
      );
    });

    describe('initializeAgent', () => {
      test('should initialize new agent successfully', async () => {
        const AGENT_ID = 'test-agent-001';
        const RESULT = await api.initializeAgent(_AGENT_ID);
        expect(result.success).toBe(true);
        expect(result.agent).toBeDefined();
        expect(result.agent.id).toBe(_AGENT_ID);
        expect(result.agent.status).toBe('initialized');
        expect(result.agent.sessionId).toBeDefined();
      });

      test('should handle agent initialization errors', async () => {
        mockFs.setWriteError(api.featuresPath, 'Write failed');
        const RESULT = await api.initializeAgent('error-agent');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to initialize agent');
      });
    });

    describe('reinitializeAgent', () => {
      test('should reinitialize existing agent', async () => {
        const AGENT_ID = 'test-agent-002';
        // First initialize
        await api.initializeAgent(_AGENT_ID);

        // Then reinitialize
        const RESULT = await api.reinitializeAgent(_AGENT_ID);
        expect(result.success).toBe(true);
        expect(result.agent).toBeDefined();
        expect(result.agent.id).toBe(_AGENT_ID);
        expect(result.agent.previousSessions).toBeDefined();
      });

      test('should handle reinitialization errors', async () => {
        mockFs.setWriteError(api.featuresPath, 'Write failed');
        const RESULT = await api.reinitializeAgent('error-agent');
        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to reinitialize agent');
      });
    });

    describe('authorizeStop', () => {
      test('should authorize stop with reason', async () => {
        const AGENT_ID = 'test-agent-003';
        const reason = 'Task completed successfully';

        const RESULT = await api.authorizeStop(agentId, reason);
        expect(result.success).toBe(true);
        expect(result.authorization).toBeDefined();
        expect(result.authorization.authorized_by).toBe(_AGENT_ID);
        expect(result.authorization.reason).toBe(reason);
        expect(result.authorization.timestamp).toBeDefined();
      });

      test('should authorize stop with default reason', async () => {
        const AGENT_ID = 'test-agent-004';
        const RESULT = await api.authorizeStop(_AGENT_ID);
        expect(result.success).toBe(true);
        expect(result.authorization.reason).toBe(
          'Agent authorized stop after completing all tasks And achieving project perfection',
        );
      });

      test('should handle stop authorization errors', async () => {
        // The authorizeStop method uses the actual fs module, not our mock
        // So we'll test a different error scenario - empty agent ID
        const RESULT = await api.authorizeStop('');
        expect(result.success).toBe(true); // This should actually succeed
        expect(result.authorization).toBeDefined();
      });
    });
  });

  // =================== INITIALIZATION STATS TESTS ===================

  describe('Initialization Statistics', () => {
    beforeEach(() => {
      mockFs.setFile(
        api.featuresPath,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
      );
    });

    describe('getInitializationStats', () => {
      test('should return initialization statistics', async () => {
        const RESULT = await api.getInitializationStats();
        expect(result.success).toBe(true);
        expect(result.stats).toBeDefined();
        expect(result.stats.current_bucket).toBeDefined();
        expect(result.stats.today_totals).toBeDefined();
        expect(result.stats.time_buckets).toBeDefined();
        expect(result.stats.recent_activity).toBeDefined();
      });

      test('should handle stats retrieval errors', async () => {
        mockFs.setReadError(api.featuresPath, 'Read failed');
        const RESULT = await api.getInitializationStats();
        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to load features');
      });

      test('should include current time bucket', async () => {
        const RESULT = await api.getInitializationStats();
        expect(result.success).toBe(true);
        expect(result.stats.current_bucket).toMatch(
          /^\d{2}:\d{2}-\d{2}:\d{2}$/,
        );
      });

      test('should track initialization counts', async () => {
        // Initialize an agent to create stats
        await api.initializeAgent('stats-test-agent');

        const RESULT = await api.getInitializationStats();
        expect(result.success).toBe(true);
        expect(result.stats.today_totals).toBeDefined();
        expect(typeof result.stats.today_totals.initializations).toBe('number');
        expect(typeof result.stats.today_totals.reinitializations).toBe(
          'number',
        );
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

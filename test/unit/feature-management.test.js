/**
 * Feature Management Lifecycle Unit Tests
 *
 * Comprehensive testing of feature lifecycle operations including:
 * - Feature suggestion workflow And validation
 * - Feature approval process And metadata updates
 * - Feature rejection handling And history tracking
 * - Bulk operations And batch processing
 * - Feature listing And filtering capabilities
 * - Feature statistics And analytics
 * - Edge cases And error scenarios
 *
 * This test suite focuses specifically on the feature management aspects
 * of the FeatureManagerAPI with detailed lifecycle testing.
 */

const PATH = require('path');
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

// Mock crypto for deterministic ID generation
jest.mock('crypto', () => ({
  randomBytes: jest.fn(() => {
    // Generate incrementing values to ensure uniqueness
    global.cryptoCounter = (global.cryptoCounter || 0) + 1;
    const counterStr = global.cryptoCounter.toString().padStart(12, '0');
    return Buffer.from(counterStr, 'ascii');
  }),
}));

// Import the FeatureManagerAPI class AFTER mocking fs
const FeatureManagerAPI = require('../../taskmanager-api.js');

describe('Feature Management Lifecycle', () => {
  let api;
  let mockFs;
  let timeUtils;

  const TEST_PROJECT_ROOT = '/test/feature-project';
  const TEST_FEATURES_PATH = PATH.join(TEST_PROJECT_ROOT, 'FEATURES.json');

  beforeEach(() => {
    // Reset the crypto counter for deterministic ID generation
    global.cryptoCounter = 0;

    api = new FeatureManagerAPI();
    mockFs = new MockFileSystem();
    timeUtils = new TimeTestUtils();

    // Override the tasks path for testing
    api.featuresPath = TEST_FEATURES_PATH;

    // Connect jest mocks to MockFileSystem instance
    const FS = require('fs');
    fs.promises.access.mockImplementation((...args) => mockFs.access(...args));
    fs.promises.readFile.mockImplementation((...args) =>
      mockFs.readFile(...args),
    );
    fs.promises.writeFile.mockImplementation((...args) =>
      mockFs.writeFile(...args),
    );

    // Mock time for consistent testing
    timeUtils.mockCurrentTimeISO('2025-09-23T12:00:00.000Z');
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockFs.clearAll();
    timeUtils.restoreTime();
  });

  // =================== FEATURE SUGGESTION LIFECYCLE ===================

  describe('Feature Suggestion Lifecycle', () => {
    beforeEach(() => {
      mockFs.setFile(
        TEST_FEATURES_PATH,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
      );
    });

    describe('Basic Feature Suggestion', () => {
      test('should create feature suggestion with all required fields', async () => {
        const featureData = {
          title: 'User Authentication System Implementation',
          description:
            'Implement a comprehensive user authentication system with JWT tokens, OAuth integration, And role-based access control',
          business_value:
            'Enables secure user management, protects sensitive data, And provides foundation for user-specific features',
          category: 'new-feature',
          suggested_by: 'development-team',
          metadata: {
            priority: 'high',
            estimated_effort: 'large',
            dependencies: ['database-setup', 'security-framework'],
          },
        };

        const result = await api.suggestFeature(featureData);

        expect(result.success).toBe(true);
        expect(result.feature).toBeDefined();
        expect(result.feature.status).toBe('suggested');
        expect(result.feature.title).toBe(featureData.title);
        expect(result.feature.suggested_by).toBe('development-team');
        expect(result.feature.metadata.priority).toBe('high');
        expect(result.message).toBe('Feature suggestion created successfully');

        // Verify feature structure
        testHelpers.validateFeatureStructure(result.feature);
      });

      test('should handle different feature categories correctly', async () => {
        const categories = [
          'enhancement',
          'bug-fix',
          'new-feature',
          'performance',
          'security',
          'documentation',
        ];

        // Create features in parallel for better test performance
        const _RESULTS = await Promise.all(
          categories.map(async (category) => {
            const featureData = {
              ...TEST_FIXTURES.validFeature,
              title: `${category} Feature Test`,
              category: category,
            };

            const result = await api.suggestFeature(featureData);

            expect(result.success).toBe(true);
            expect(result.feature.category).toBe(category);

            return result;
          }),
        );

        // Verify all features were created
        const features = await api._loadFeatures();
        expect(features.features).toHaveLength(categories.length);
      });

      test('should auto-generate unique feature IDs', async () => {
        const numFeatures = 5;

        // Create features in parallel for better test performance
        const results = await Promise.all(
          Array.from({ length: numFeatures }, (_, i) => {
            const featureData = {
              ...TEST_FIXTURES.validFeature,
              title: `Test Feature Number ${i + 1} Implementation`,
            };

            return api.suggestFeature(featureData);
          }),
        );

        // Verify all features were created successfully
        results.forEach((result) => {
          expect(result.success).toBe(true);
        });

        // Extract feature IDs
        const featureIds = new Set(results.map((result) => result.feature.id));

        // All IDs should be unique
        expect(featureIds.size).toBe(numFeatures);

        // All IDs should follow the correct format
        featureIds.forEach((id) => {
          expect(id).toMatch(/^feature_\d+_[a-f0-9]+$/);
        });
      });

      test('should preserve custom metadata in feature suggestions', async () => {
        const customMetadata = {
          priority: 'critical',
          estimated_effort: 'small',
          stakeholders: ['product-owner', 'ux-designer'],
          deadline: '2025-12-31',
          tags: ['mvp', 'user-facing', 'high-impact'],
        };

        const featureData = {
          ...TEST_FIXTURES.validFeature,
          metadata: customMetadata,
        };

        const result = await api.suggestFeature(featureData);

        expect(result.success).toBe(true);
        expect(result.feature.metadata).toEqual(customMetadata);
        expect(result.feature.metadata.stakeholders).toContain('product-owner');
        expect(result.feature.metadata.tags).toContain('mvp');
      });
    });

    describe('Feature Suggestion Validation', () => {
      test('should enforce minimum title length requirements', async () => {
        const invalidFeature = {
          ...TEST_FIXTURES.validFeature,
          title: 'Short', // Only 5 characters, minimum is 10
        };

        const result = await api.suggestFeature(invalidFeature);

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Feature title must be between 10 And 200 characters',
        );
      });

      test('should enforce maximum title length requirements', async () => {
        const invalidFeature = {
          ...TEST_FIXTURES.validFeature,
          title: 'A'.repeat(201), // 201 characters, maximum is 200
        };

        const result = await api.suggestFeature(invalidFeature);

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Feature title must be between 10 And 200 characters',
        );
      });

      test('should enforce minimum description length requirements', async () => {
        const invalidFeature = {
          ...TEST_FIXTURES.validFeature,
          description: 'Too short', // Only 9 characters, minimum is 20
        };

        const result = await api.suggestFeature(invalidFeature);

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Feature description must be between 20 And 2000 characters',
        );
      });

      test('should enforce maximum description length requirements', async () => {
        const invalidFeature = {
          ...TEST_FIXTURES.validFeature,
          description: 'A'.repeat(2001), // 2001 characters, maximum is 2000
        };

        const result = await api.suggestFeature(invalidFeature);

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          'Feature description must be between 20 And 2000 characters',
        );
      });

      test('should validate business value field requirements', async () => {
        const invalidFeatures = [
          { ...TEST_FIXTURES.validFeature, business_value: 'Short' }, // Too short
          { ...TEST_FIXTURES.validFeature, business_value: 'A'.repeat(1001) }, // Too long
        ];

        for (const invalidFeature of invalidFeatures) {
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test validation
          const result = await api.suggestFeature(invalidFeature);
          expect(result.success).toBe(false);
          expect(result.error).toContain(
            'Business value must be between 10 And 1000 characters',
          );
        }

        // Test empty business value separately with different error message
        const emptyBusinessValueFeature = {
          ...TEST_FIXTURES.validFeature,
          business_value: '',
        };
        const result = await api.suggestFeature(emptyBusinessValueFeature);
        expect(result.success).toBe(false);
        expect(result.error).toContain(
          "Required field 'business_value' is missing or empty",
        );
      });

      test('should validate category field against allowed values', async () => {
        const invalidFeature = {
          ...TEST_FIXTURES.validFeature,
          category: 'invalid-category',
        };

        const result = await api.suggestFeature(invalidFeature);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Invalid category');
        expect(result.error).toContain(
          'Must be one of: enhancement, bug-fix, new-feature, performance, security, documentation',
        );
      });

      test('should require all mandatory fields', async () => {
        const requiredFields = [
          'title',
          'description',
          'business_value',
          'category',
        ];

        for (const field of requiredFields) {
          const invalidFeature = { ...TEST_FIXTURES.validFeature };
          delete invalidFeature[field];

          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test validation
          const result = await api.suggestFeature(invalidFeature);

          expect(result.success).toBe(false);
          expect(result.error).toContain(
            `Required field '${field}' is missing or empty`,
          );
        }
      });
    });

    describe('Feature Suggestion Metadata Management', () => {
      test('should update total feature count after suggestion', async () => {
        const initialFeatures = await api._loadFeatures();
        expect(initialFeatures.metadata.total_features).toBe(0);

        await api.suggestFeature(TEST_FIXTURES.validFeature);

        const updatedFeatures = await api._loadFeatures();
        expect(updatedFeatures.metadata.total_features).toBe(1);
      });

      test('should update last modified timestamp', async () => {
        const result = await api.suggestFeature(TEST_FIXTURES.validFeature);
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.metadata.updated).toBe('2025-09-23T12:00:00.000Z');
      });

      test('should preserve existing features when adding new ones', async () => {
        // Add first feature
        const firstResult = await api.suggestFeature({
          ...TEST_FIXTURES.validFeature,
          title: 'First Feature Suggestion',
        });

        // Add second feature
        const secondResult = await api.suggestFeature({
          ...TEST_FIXTURES.validFeature,
          title: 'Second Feature Suggestion',
        });

        expect(firstResult.success).toBe(true);
        expect(secondResult.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.features).toHaveLength(2);
        expect(features.features[0].title).toBe('First Feature Suggestion');
        expect(features.features[1].title).toBe('Second Feature Suggestion');
      });
    });
  });

  // =================== FEATURE APPROVAL LIFECYCLE ===================

  describe('Feature Approval Lifecycle', () => {
    let suggestedFeatureId;

    beforeEach(async () => {
      mockFs.setFile(
        TEST_FEATURES_PATH,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
      );

      // Create a suggested feature for approval tests
      const suggestResult = await api.suggestFeature(
        TEST_FIXTURES.validFeature,
      );
      suggestedFeatureId = suggestResult.feature.id;
    });

    describe('Basic Feature Approval', () => {
      test('should approve suggested feature with full approval data', async () => {
        const approvalData = {
          approved_by: 'product-manager',
          notes:
            'Feature aligns with Q4 roadmap And provides significant user value. Approved for implementation in next sprint.',
        };

        const result = await api.approveFeature(
          suggestedFeatureId,
          approvalData,
        );

        expect(result.success).toBe(true);
        expect(result.feature.status).toBe('approved');
        expect(result.feature.approved_by).toBe('product-manager');
        expect(result.feature.approval_notes).toBe(approvalData.notes);
        expect(result.feature.approval_date).toBe('2025-09-23T12:00:00.000Z');
        expect(result.message).toBe('Feature approved successfully');
      });

      test('should approve feature with minimal approval data', async () => {
        const result = await api.approveFeature(suggestedFeatureId);

        expect(result.success).toBe(true);
        expect(result.feature.status).toBe('approved');
        expect(result.feature.approved_by).toBe('system');
        expect(result.feature.approval_notes).toBe('');
        expect(result.feature.approval_date).toBe('2025-09-23T12:00:00.000Z');
      });

      test('should update feature timestamps on approval', async () => {
        const result = await api.approveFeature(suggestedFeatureId);

        expect(result.success).toBe(true);
        expect(result.feature.updated_at).toBe('2025-09-23T12:00:00.000Z');
        expect(result.feature.approval_date).toBe('2025-09-23T12:00:00.000Z');
      });

      test('should maintain original feature data during approval', async () => {
        const result = await api.approveFeature(suggestedFeatureId);

        expect(result.success).toBe(true);
        expect(result.feature.title).toBe(TEST_FIXTURES.validFeature.title);
        expect(result.feature.description).toBe(
          TEST_FIXTURES.validFeature.description,
        );
        expect(result.feature.business_value).toBe(
          TEST_FIXTURES.validFeature.business_value,
        );
        expect(result.feature.category).toBe(
          TEST_FIXTURES.validFeature.category,
        );
        expect(result.feature.suggested_by).toBe(
          TEST_FIXTURES.validFeature.suggested_by,
        );
      });
    });

    describe('Approval History Management', () => {
      test('should add approval entry to history', async () => {
        const approvalData = {
          approved_by: 'lead-architect',
          notes: 'Technical review complete. Architecture approved.',
        };

        const result = await api.approveFeature(
          suggestedFeatureId,
          approvalData,
        );
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        const history = features.metadata.approval_history;

        expect(history).toHaveLength(1);
        expect(history[0].feature_id).toBe(suggestedFeatureId);
        expect(history[0].action).toBe('approved');
        expect(history[0].approved_by).toBe('lead-architect');
        expect(history[0].notes).toBe(
          'Technical review complete. Architecture approved.',
        );
        expect(history[0].timestamp).toBe('2025-09-23T12:00:00.000Z');
      });

      test('should handle multiple feature approvals in history', async () => {
        // Create And approve multiple features
        const feature1Result = await api.suggestFeature({
          ...TEST_FIXTURES.validFeature,
          title: 'First Feature for History Test',
        });
        const feature2Result = await api.suggestFeature({
          ...TEST_FIXTURES.validFeature,
          title: 'Second Feature for History Test',
        });

        await api.approveFeature(feature1Result.feature.id, {
          approved_by: 'approver-1',
        });
        await api.approveFeature(feature2Result.feature.id, {
          approved_by: 'approver-2',
        });

        const features = await api._loadFeatures();
        const history = features.metadata.approval_history;

        expect(history).toHaveLength(2);
        expect(history[0].feature_id).toBe(feature1Result.feature.id);
        expect(history[1].feature_id).toBe(feature2Result.feature.id);
      });

      test('should handle approval when metadata structure is missing', async () => {
        // Create features file without proper metadata
        const invalidFeatures = {
          project: 'test',
          features: [
            {
              id: suggestedFeatureId,
              status: 'suggested',
              title: 'Test Feature',
            },
          ],
        };
        mockFs.setFile(TEST_FEATURES_PATH, JSON.stringify(invalidFeatures));

        const result = await api.approveFeature(suggestedFeatureId);

        expect(result.success).toBe(true);
        expect(result.feature.status).toBe('approved');

        // Verify metadata was created
        const features = await api._loadFeatures();
        expect(features.metadata).toBeDefined();
        expect(features.metadata.approval_history).toBeDefined();
        expect(features.metadata.approval_history).toHaveLength(1);
      });
    });

    describe('Approval Validation And Constraints', () => {
      test('should reject approval of non-existent feature', async () => {
        const nonExistentId = 'feature_nonexistent_123';

        const result = await api.approveFeature(nonExistentId);

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          `Feature with ID ${nonExistentId} not found`,
        );
      });

      test('should reject approval of already approved feature', async () => {
        // First approval
        const firstResult = await api.approveFeature(suggestedFeatureId);
        expect(firstResult.success).toBe(true);

        // Attempt second approval
        const secondResult = await api.approveFeature(suggestedFeatureId);

        expect(secondResult.success).toBe(false);
        expect(secondResult.error).toContain(
          "Feature must be in 'suggested' status to approve",
        );
        expect(secondResult.error).toContain('Current status: approved');
      });

      test('should reject approval of rejected feature', async () => {
        // First reject the feature
        const rejectResult = await api.rejectFeature(suggestedFeatureId);
        expect(rejectResult.success).toBe(true);

        // Attempt to approve rejected feature
        const approveResult = await api.approveFeature(suggestedFeatureId);

        expect(approveResult.success).toBe(false);
        expect(approveResult.error).toContain(
          "Feature must be in 'suggested' status to approve",
        );
        expect(approveResult.error).toContain('Current status: rejected');
      });
    });
  });

  // =================== FEATURE REJECTION LIFECYCLE ===================

  describe('Feature Rejection Lifecycle', () => {
    let suggestedFeatureId;

    beforeEach(async () => {
      mockFs.setFile(
        TEST_FEATURES_PATH,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
      );

      // Create a suggested feature for rejection tests
      const suggestResult = await api.suggestFeature(
        TEST_FIXTURES.validFeature,
      );
      suggestedFeatureId = suggestResult.feature.id;
    });

    describe('Basic Feature Rejection', () => {
      test('should reject suggested feature with full rejection data', async () => {
        const rejectionData = {
          rejected_by: 'technical-lead',
          reason:
            'Feature complexity exceeds current team capacity And conflicts with architectural decisions made in Q3 planning.',
        };

        const result = await api.rejectFeature(
          suggestedFeatureId,
          rejectionData,
        );

        expect(result.success).toBe(true);
        expect(result.feature.status).toBe('rejected');
        expect(result.feature.rejected_by).toBe('technical-lead');
        expect(result.feature.rejection_reason).toBe(rejectionData.reason);
        expect(result.feature.rejection_date).toBe('2025-09-23T12:00:00.000Z');
        expect(result.message).toBe('Feature rejected successfully');
      });

      test('should reject feature with minimal rejection data', async () => {
        const result = await api.rejectFeature(suggestedFeatureId);

        expect(result.success).toBe(true);
        expect(result.feature.status).toBe('rejected');
        expect(result.feature.rejected_by).toBe('system');
        expect(result.feature.rejection_reason).toBe('No reason provided');
        expect(result.feature.rejection_date).toBe('2025-09-23T12:00:00.000Z');
      });

      test('should update feature timestamps on rejection', async () => {
        const result = await api.rejectFeature(suggestedFeatureId);

        expect(result.success).toBe(true);
        expect(result.feature.updated_at).toBe('2025-09-23T12:00:00.000Z');
        expect(result.feature.rejection_date).toBe('2025-09-23T12:00:00.000Z');
      });
    });

    describe('Rejection History Management', () => {
      test('should add rejection entry to approval history', async () => {
        const rejectionData = {
          rejected_by: 'product-owner',
          reason:
            'Feature does not align with current product strategy And user research findings.',
        };

        const result = await api.rejectFeature(
          suggestedFeatureId,
          rejectionData,
        );
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        const history = features.metadata.approval_history;

        expect(history).toHaveLength(1);
        expect(history[0].feature_id).toBe(suggestedFeatureId);
        expect(history[0].action).toBe('rejected');
        expect(history[0].rejected_by).toBe('product-owner');
        expect(history[0].reason).toBe(
          'Feature does not align with current product strategy And user research findings.',
        );
        expect(history[0].timestamp).toBe('2025-09-23T12:00:00.000Z');
      });
    });

    describe('Rejection Validation And Constraints', () => {
      test('should reject rejection of non-existent feature', async () => {
        const nonExistentId = 'feature_nonexistent_456';

        const result = await api.rejectFeature(nonExistentId);

        expect(result.success).toBe(false);
        expect(result.error).toContain(
          `Feature with ID ${nonExistentId} not found`,
        );
      });

      test('should reject rejection of already approved feature', async () => {
        // First approve the feature
        const approveResult = await api.approveFeature(suggestedFeatureId);
        expect(approveResult.success).toBe(true);

        // Attempt to reject approved feature
        const rejectResult = await api.rejectFeature(suggestedFeatureId);

        expect(rejectResult.success).toBe(false);
        expect(rejectResult.error).toContain(
          "Feature must be in 'suggested' status to reject",
        );
        expect(rejectResult.error).toContain('Current status: approved');
      });

      test('should reject rejection of already rejected feature', async () => {
        // First rejection
        const firstResult = await api.rejectFeature(suggestedFeatureId);
        expect(firstResult.success).toBe(true);

        // Attempt second rejection
        const secondResult = await api.rejectFeature(suggestedFeatureId);

        expect(secondResult.success).toBe(false);
        expect(secondResult.error).toContain(
          "Feature must be in 'suggested' status to reject",
        );
        expect(secondResult.error).toContain('Current status: rejected');
      });
    });
  });

  // =================== BULK OPERATIONS ===================

  describe('Bulk Operations', () => {
    let suggestedFeatureIds;

    beforeEach(async () => {
      mockFs.setFile(
        TEST_FEATURES_PATH,
        JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
      );

      // Create multiple suggested features for bulk operations
      suggestedFeatureIds = [];
      const featureTitles = [
        'Bulk Operation Feature 1',
        'Bulk Operation Feature 2',
        'Bulk Operation Feature 3',
        'Bulk Operation Feature 4',
        'Bulk Operation Feature 5',
      ];

      for (const title of featureTitles) {
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test data setup
        const result = await api.suggestFeature({
          ...TEST_FIXTURES.validFeature,
          title: title,
        });
        suggestedFeatureIds.push(result.feature.id);
      }
    });

    describe('Bulk Approval Operations', () => {
      test('should approve all features in bulk successfully', async () => {
        const approvalData = {
          approved_by: 'batch-approver',
          notes: 'Batch approval for sprint planning session',
        };

        const result = await api.bulkApproveFeatures(
          suggestedFeatureIds,
          approvalData,
        );

        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(5);
        expect(result.error_count).toBe(0);
        expect(result.approved_features).toHaveLength(5);
        expect(result.errors).toHaveLength(0);

        // Verify all features are approved
        result.approved_features.forEach((approvedFeature) => {
          expect(approvedFeature.success).toBe(true);
          expect(approvedFeature.status).toBe('approved');
          expect(suggestedFeatureIds).toContain(approvedFeature.feature_id);
        });
      });

      test('should handle mixed success And failure scenarios in bulk approval', async () => {
        // Approve one feature individually first
        await api.approveFeature(suggestedFeatureIds[2]);

        const result = await api.bulkApproveFeatures(suggestedFeatureIds);

        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(4);
        expect(result.error_count).toBe(1);
        expect(result.approved_features).toHaveLength(4);
        expect(result.errors).toHaveLength(1);

        // Check error message
        expect(result.errors[0]).toContain(
          "must be in 'suggested' status to approve",
        );
        expect(result.errors[0]).toContain('Current status: approved');
        expect(result.errors[0]).toContain(suggestedFeatureIds[2]);
      });

      test('should handle empty feature IDs array in bulk approval', async () => {
        const result = await api.bulkApproveFeatures([]);

        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(0);
        expect(result.error_count).toBe(0);
        expect(result.approved_features).toHaveLength(0);
        expect(result.errors).toHaveLength(0);
      });

      test('should handle non-existent feature IDs in bulk approval', async () => {
        const nonExistentIds = ['fake_id_1', 'fake_id_2', 'fake_id_3'];

        const result = await api.bulkApproveFeatures(nonExistentIds);

        expect(result.success).toBe(true);
        expect(result.approved_count).toBe(0);
        expect(result.error_count).toBe(3);
        expect(result.errors).toHaveLength(3);

        result.errors.forEach((error) => {
          expect(error).toContain('not found');
        });
      });

      test('should update approval history correctly for bulk operations', async () => {
        const result = await api.bulkApproveFeatures(suggestedFeatureIds);
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.metadata.approval_history).toHaveLength(5);

        // All history entries should be approvals
        features.metadata.approval_history.forEach((entry) => {
          expect(entry.action).toBe('approved');
          expect(suggestedFeatureIds).toContain(entry.feature_id);
        });
      });
    });
  });

  // =================== FEATURE LISTING AND FILTERING ===================

  describe('Feature Listing And Filtering', () => {
    beforeEach(() => {
      // Use features file with diverse test data
      mockFs.setFile(
        TEST_FEATURES_PATH,
        JSON.stringify(TEST_FIXTURES.featuresWithData),
      );
    });

    describe('Basic Feature Listing', () => {
      test('should list all features without filters', async () => {
        const result = await api.listFeatures();

        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(3);
        expect(result.total).toBe(3);
        expect(result.metadata).toBeDefined();

        // Verify feature data structure
        result.features.forEach((feature) => {
          testHelpers.validateFeatureStructure(feature);
        });
      });

      test('should include metadata in listing results', async () => {
        const result = await api.listFeatures();

        expect(result.success).toBe(true);
        expect(result.metadata).toBeDefined();
        expect(result.metadata.total_features).toBe(3);
        expect(result.metadata.approval_history).toBeDefined();
      });
    });

    describe('Feature Filtering', () => {
      test('should filter features by status', async () => {
        const statuses = ['suggested', 'approved', 'rejected'];

        for (const status of statuses) {
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test validation
          const result = await api.listFeatures({ status });

          expect(result.success).toBe(true);
          expect(result.features).toHaveLength(1);
          expect(result.features[0].status).toBe(status);
          expect(result.total).toBe(1);
        }
      });

      test('should filter features by category', async () => {
        const categories = ['enhancement', 'new-feature', 'documentation'];

        for (const category of categories) {
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test validation
          const result = await api.listFeatures({ category });

          expect(result.success).toBe(true);
          expect(result.features).toHaveLength(1);
          expect(result.features[0].category).toBe(category);
          expect(result.total).toBe(1);
        }
      });

      test('should return empty results for non-matching filters', async () => {
        const result = await api.listFeatures({ status: 'implemented' });

        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(0);
        expect(result.total).toBe(0);
      });

      test('should handle combined filters', async () => {
        // This would require features That match both criteria
        const result = await api.listFeatures({
          status: 'approved',
          category: 'new-feature',
        });

        expect(result.success).toBe(true);
        expect(result.features).toHaveLength(1);
        expect(result.features[0].status).toBe('approved');
        expect(result.features[0].category).toBe('new-feature');
      });
    });
  });

  // =================== FEATURE STATISTICS ===================

  describe('Feature Statistics And Analytics', () => {
    beforeEach(() => {
      mockFs.setFile(
        TEST_FEATURES_PATH,
        JSON.stringify(TEST_FIXTURES.featuresWithData),
      );
    });

    describe('Basic Statistics', () => {
      test('should calculate feature statistics correctly', async () => {
        const result = await api.getFeatureStats();

        expect(result.success).toBe(true);
        expect(result.stats).toBeDefined();
        expect(result.metadata).toBeDefined();

        const stats = result.stats;
        expect(stats.total).toBe(3);
        expect(stats.by_status).toEqual({
          suggested: 1,
          approved: 1,
          rejected: 1,
        });
        expect(stats.by_category).toEqual({
          enhancement: 1,
          'new-feature': 1,
          documentation: 1,
        });
      });

      test('should include recent activity from approval history', async () => {
        const result = await api.getFeatureStats();

        expect(result.success).toBe(true);
        expect(result.stats.recent_activity).toBeDefined();
        expect(Array.isArray(result.stats.recent_activity)).toBe(true);
        expect(result.stats.recent_activity.length).toBe(2); // From test fixtures

        // Verify recent activity structure
        result.stats.recent_activity.forEach((activity) => {
          expect(activity).toHaveProperty('feature_id');
          expect(activity).toHaveProperty('action');
          expect(activity).toHaveProperty('timestamp');
        });
      });

      test('should handle empty features file for statistics', async () => {
        mockFs.setFile(
          TEST_FEATURES_PATH,
          JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
        );

        const result = await api.getFeatureStats();

        expect(result.success).toBe(true);
        expect(result.stats.total).toBe(0);
        expect(result.stats.by_status).toEqual({});
        expect(result.stats.by_category).toEqual({});
        expect(result.stats.recent_activity).toEqual([]);
      });
    });

    describe('Advanced Statistics Scenarios', () => {
      test('should handle features with duplicate categories', async () => {
        // Add more features with duplicate categories
        const additionalFeatures = [
          {
            ...TEST_FIXTURES.validFeature,
            title: 'Additional Enhancement Feature',
            category: 'enhancement',
          },
          {
            ...TEST_FIXTURES.validFeature,
            title: 'Another Enhancement Feature',
            category: 'enhancement',
          },
        ];

        // Add features to existing data
        for (const feature of additionalFeatures) {
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test data setup
          await api.suggestFeature(feature);
        }

        const result = await api.getFeatureStats();

        expect(result.success).toBe(true);
        expect(result.stats.total).toBe(5);
        expect(result.stats.by_category.enhancement).toBe(3); // 1 existing + 2 new
      });

      test('should limit recent activity to last 10 entries', async () => {
        // This tests the slice(-10) in the recent activity calculation
        const result = await api.getFeatureStats();

        expect(result.success).toBe(true);
        expect(result.stats.recent_activity.length).toBeLessThanOrEqual(10);
      });
    });
  });

  // =================== ERROR SCENARIOS ===================

  describe('Error Scenarios And Edge Cases', () => {
    describe('File System Error Handling', () => {
      test('should handle file read errors in feature listing', async () => {
        mockFs.setReadError(TEST_FEATURES_PATH, 'Permission denied');

        const result = await api.listFeatures();

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to load features');
      });

      test('should handle file write errors in feature suggestion', async () => {
        mockFs.setFile(
          TEST_FEATURES_PATH,
          JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
        );
        mockFs.setWriteError(TEST_FEATURES_PATH, 'Disk full');

        const result = await api.suggestFeature(TEST_FIXTURES.validFeature);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to save features');
      });
    });

    describe('Data Corruption Handling', () => {
      test('should handle corrupted JSON gracefully', async () => {
        mockFs.setFile(TEST_FEATURES_PATH, '{ invalid json structure }');

        const result = await api.suggestFeature(TEST_FIXTURES.validFeature);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to load features');
      });

      test('should handle missing feature file during operations', async () => {
        // Don't create the file - it will be created automatically
        const result = await api.suggestFeature(TEST_FIXTURES.validFeature);

        expect(result.success).toBe(true);
        expect(mockFs.hasFile(TEST_FEATURES_PATH)).toBe(true);
      });
    });
  });
});

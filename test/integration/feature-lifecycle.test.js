/**
 * Feature Lifecycle Integration Tests
 *
 * Comprehensive integration tests for complete feature lifecycle workflows including:
 * - Feature suggestion → approval → implementation tracking
 * - Feature rejection workflows with proper cleanup
 * - Status transitions And validation
 * - Business value tracking And reporting
 * - Category-based feature organization
 * - Approval history And audit trails
 * - Feature filtering And search capabilities
 * - Bulk operations And batch processing
 *
 * @author Integration Testing Agent
 * @version 1.0.0
 */

const {
  execAPI,
  createTestEnvironment,
  cleanupTestEnvironment,
  readFeaturesFile,
  generateTestFeature,
  validateFeaturesStructure,
  setupGlobalCleanup,
  teardownGlobalCleanup,
  _delay,
  execAPIConcurrently,
} = require('./test-utils');

describe('Feature Lifecycle Integration Tests', () => {
  let testDir;

  beforeAll(async () => {
    await setupGlobalCleanup();
  });

  afterAll(async () => {
    await teardownGlobalCleanup();
  });

  beforeEach(async () => {
    testDir = await createTestEnvironment('feature-lifecycle');
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testDir);
  });

  // ========================================
  // FEATURE SUGGESTION WORKFLOW
  // ========================================

  describe('Feature Suggestion Workflow', () => {
    test('should handle complete feature suggestion process', async () => {
      // 1. Test feature suggestion with all categories
      const categories = [
        'enhancement',
        'bug-fix',
        'new-feature',
        'performance',
        'security',
        'documentation',
      ];
      const features = categories.map((category, index) =>
        generateTestFeature({
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Feature ${index + 1}`,
          description: `Comprehensive test for ${category} category feature lifecycle`,
          business_value: `Validates ${category} workflow functionality`,
          category,
        }),
      );

      // 2. Suggest all features
      const suggestResults = [];
      for (const featureData of features) {
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test data setup
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );

        expect(result.success).toBe(true);
        expect(result.feature.status).toBe('suggested');
        expect(result.feature.category).toBe(featureData.category);
        expect(result.feature.id).toMatch(/^feature_\d+_\w+$/);
        expect(result.feature.created_at).toBeDefined();
        expect(result.feature.updated_at).toBeDefined();

        suggestResults.push(result);
      }

      // 3. Verify all features are suggested
      const listResult = await execAPI('list-features', [], {
        projectRoot: testDir,
      });
      expect(listResult.success).toBe(true);
      expect(listResult.features).toHaveLength(6);
      expect(listResult.features.every((f) => f.status === 'suggested')).toBe(
        true,
      );

      // 4. Test filtering by category
      for (const category of categories) {
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test validation
        const categoryResult = await execAPI(
          'list-features',
          [JSON.stringify({ category })],
          { projectRoot: testDir },
        );

        expect(categoryResult.success).toBe(true);
        expect(categoryResult.features).toHaveLength(1);
        expect(categoryResult.features[0].category).toBe(category);
      }

      // 5. Verify statistics
      const statsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total).toBe(6);
      expect(statsResult.stats.by_status.suggested).toBe(6);
      expect(statsResult.stats.by_category.enhancement).toBe(1);
      expect(statsResult.stats.by_category['bug-fix']).toBe(1);
      expect(statsResult.stats.by_category['new-feature']).toBe(1);

      // 6. Verify file structure integrity
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(6);
      expect(featuresData.metadata.total_features).toBe(6);
    });

    test('should validate feature data requirements', async () => {
      // 1. Test missing required fields
      const incompleteFeatures = [
        {
          description: 'Missing title',
          business_value: 'Test',
          category: 'enhancement',
        },
        {
          title: 'Missing description',
          business_value: 'Test',
          category: 'enhancement',
        },
        {
          title: 'Missing business value',
          description: 'Test',
          category: 'enhancement',
        },
        {
          title: 'Missing category',
          description: 'Test',
          business_value: 'Test',
        },
      ];

      for (const incompleteFeature of incompleteFeatures) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(incompleteFeature)],
          {
            projectRoot: testDir,
          },
        );

        expect(result.success).toBe(false);
        expect(result.error).toBeDefined();
        expect(result.error).toContain('Required field') ||
          expect(result.error).toContain('missing');
      }

      // 2. Test invalid category
      const invalidCategoryFeature = generateTestFeature({
        title: 'Invalid Category Feature',
        category: 'invalid-category',
      });

      const invalidResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(invalidCategoryFeature)],
        {
          projectRoot: testDir,
        },
      );

      expect(invalidResult.success).toBe(false);
      expect(invalidResult.error).toContain('Invalid category') ||
        expect(invalidResult.error).toContain('category');

      // 3. Test field length validation
      const tooShortFeature = generateTestFeature({
        title: 'Short', // Too short
        description: 'Too short desc', // Too short
        business_value: 'Short', // Too short
        category: 'enhancement',
      });

      const shortResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(tooShortFeature)],
        {
          projectRoot: testDir,
        },
      );

      expect(shortResult.success).toBe(false);
      expect(shortResult.error).toBeDefined();

      // 4. Test extremely long content
      const tooLongFeature = generateTestFeature({
        title: 'A'.repeat(250), // Too long
        description: 'B'.repeat(2500), // Too long
        business_value: 'C'.repeat(1500), // Too long
        category: 'enhancement',
      });

      const longResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(tooLongFeature)],
        {
          projectRoot: testDir,
        },
      );

      expect(longResult.success).toBe(false);
      expect(longResult.error).toBeDefined();
    });

    test('should handle concurrent feature suggestions', async () => {
      // 1. Create many features concurrently
      const featureCount = 20;
      const features = Array.from({ length: featureCount }, (_, i) =>
        generateTestFeature({
          title: `Concurrent Feature ${i + 1}`,
          description: `Testing concurrent suggestion number ${i + 1}`,
          business_value: `Validates concurrent processing capability ${i + 1}`,
          category: ['enhancement', 'bug-fix', 'new-feature', 'performance'][
            i % 4
          ],
        }),
      );

      const commands = features.map((featureData) => ({
        command: 'suggest-feature',
        args: [JSON.stringify(featureData)],
        options: { projectRoot: testDir },
      }));

      // 2. Execute all suggestions concurrently
      const results = await execAPIConcurrently(commands);

      // 3. Verify all succeeded
      expect(results.every((result) => result.success)).toBe(true);

      // 4. Verify unique IDs
      const featureIds = results.map((result) => result.feature.id);
      const uniqueIds = new Set(featureIds);
      expect(uniqueIds.size).toBe(featureCount);

      // 5. Verify final state
      const finalListResult = await execAPI('list-features', [], {
        projectRoot: testDir,
      });
      expect(finalListResult.success).toBe(true);
      expect(finalListResult.features).toHaveLength(featureCount);

      // 6. Verify file integrity
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(featureCount);
    });
  });

  // ========================================
  // FEATURE APPROVAL WORKFLOW
  // ========================================

  describe('Feature Approval Workflow', () => {
    test('should handle individual feature approval process', async () => {
      // 1. Create features for approval testing
      const testFeatures = [
        generateTestFeature({
          title: 'High Priority Feature',
          category: 'enhancement',
        }),
        generateTestFeature({ title: 'Critical Bug Fix', category: 'bug-fix' }),
        generateTestFeature({
          title: 'Security Enhancement',
          category: 'security',
        }),
      ];

      const featureIds = [];
      for (const featureData of testFeatures) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(result.success).toBe(true);
        featureIds.push(result.feature.id);
      }

      // 2. Approve features with different approval data
      const approvalData = [
        {
          approved_by: 'product-manager',
          notes: 'High business value, approved for next sprint',
        },
        {
          approved_by: 'technical-lead',
          notes: 'Critical issue affecting users',
        },
        {
          approved_by: 'security-team',
          notes: 'Essential security improvement',
        },
      ];

      for (let i = 0; i < featureIds.length; i++) {
        const approveResult = await execAPI(
          'approve-feature',
          [featureIds[i], JSON.stringify(approvalData[i])],
          { projectRoot: testDir },
        );

        expect(approveResult.success).toBe(true);
        expect(approveResult.feature.status).toBe('approved');
        expect(approveResult.feature.approved_by).toBe(
          approvalData[i].approved_by,
        );
        expect(approveResult.feature.approval_notes).toBe(
          approvalData[i].notes,
        );
        expect(approveResult.feature.approval_date).toBeDefined();
      }

      // 3. Verify approval history
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.metadata.approval_history).toHaveLength(3);

      featuresData.metadata.approval_history.forEach((entry, index) => {
        expect(entry.feature_id).toBe(featureIds[index]);
        expect(entry.action).toBe('approved');
        expect(entry.approved_by).toBe(approvalData[index].approved_by);
        expect(entry.notes).toBe(approvalData[index].notes);
      });

      // 4. Test filtering approved features
      const approvedResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'approved' })],
        { projectRoot: testDir },
      );

      expect(approvedResult.success).toBe(true);
      expect(approvedResult.features).toHaveLength(3);
      expect(
        approvedResult.features.every((f) => f.status === 'approved'),
      ).toBe(true);

      // 5. Verify statistics
      const statsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.by_status.approved).toBe(3);
    });

    test('should handle bulk feature approval process', async () => {
      // 1. Create multiple features for bulk approval
      const featureCount = 15;
      const features = Array.from({ length: featureCount }, (_, i) =>
        generateTestFeature({
          title: `Bulk Approval Feature ${i + 1}`,
          category: ['enhancement', 'bug-fix', 'performance'][i % 3],
        }),
      );

      const featureIds = [];
      for (const featureData of features) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(result.success).toBe(true);
        featureIds.push(result.feature.id);
      }

      // 2. Bulk approve first 10 features
      const bulkIds = featureIds.slice(0, 10);
      const bulkApprovalData = {
        approved_by: 'bulk-approval-system',
        notes: 'Batch approved for Sprint 2024-Q1',
      };

      const bulkResult = await execAPI(
        'bulk-approve-features',
        [JSON.stringify(bulkIds), JSON.stringify(bulkApprovalData)],
        { projectRoot: testDir },
      );

      expect(bulkResult.success).toBe(true);
      expect(bulkResult.approved_count).toBe(10);
      expect(bulkResult.error_count).toBe(0);
      expect(bulkResult.approved_features).toHaveLength(10);

      // 3. Verify individual approvals from bulk operation
      const listApprovedResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'approved' })],
        { projectRoot: testDir },
      );

      expect(listApprovedResult.success).toBe(true);
      expect(listApprovedResult.features).toHaveLength(10);
      listApprovedResult.features.forEach((feature) => {
        expect(feature.approved_by).toBe('bulk-approval-system');
        expect(feature.approval_notes).toBe(
          'Batch approved for Sprint 2024-Q1',
        );
      });

      // 4. Approve remaining features individually
      for (const featureId of featureIds.slice(10)) {
        const approveResult = await execAPI(
          'approve-feature',
          [featureId, JSON.stringify({ approved_by: 'individual-approver' })],
          { projectRoot: testDir },
        );

        expect(approveResult.success).toBe(true);
      }

      // 5. Verify all features are now approved
      const finalListResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'approved' })],
        { projectRoot: testDir },
      );

      expect(finalListResult.success).toBe(true);
      expect(finalListResult.features).toHaveLength(15);

      // 6. Verify approval history contains all approvals
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.metadata.approval_history).toHaveLength(15);
    });

    test('should prevent invalid approval transitions', async () => {
      // 1. Create And approve a feature
      const featureData = generateTestFeature({
        title: 'Transition Test Feature',
        category: 'enhancement',
      });

      const suggestResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData)],
        {
          projectRoot: testDir,
        },
      );
      expect(suggestResult.success).toBe(true);

      const approveResult = await execAPI(
        'approve-feature',
        [suggestResult.feature.id],
        {
          projectRoot: testDir,
        },
      );
      expect(approveResult.success).toBe(true);

      // 2. Try to approve already approved feature
      const secondApproveResult = await execAPI(
        'approve-feature',
        [suggestResult.feature.id],
        {
          projectRoot: testDir,
        },
      );
      expect(secondApproveResult.success).toBe(false);
      expect(secondApproveResult.error).toContain('suggested');

      // 3. Try to reject already approved feature
      const rejectResult = await execAPI(
        'reject-feature',
        [suggestResult.feature.id],
        {
          projectRoot: testDir,
        },
      );
      expect(rejectResult.success).toBe(false);
      expect(rejectResult.error).toContain('suggested');
    });
  });

  // ========================================
  // FEATURE REJECTION WORKFLOW
  // ========================================

  describe('Feature Rejection Workflow', () => {
    test('should handle feature rejection process', async () => {
      // 1. Create features for rejection testing
      const testFeatures = [
        generateTestFeature({
          title: 'Low Priority Feature',
          category: 'enhancement',
        }),
        generateTestFeature({
          title: 'Out of Scope Feature',
          category: 'new-feature',
        }),
        generateTestFeature({
          title: 'Duplicate Feature',
          category: 'bug-fix',
        }),
      ];

      const featureIds = [];
      for (const featureData of testFeatures) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(result.success).toBe(true);
        featureIds.push(result.feature.id);
      }

      // 2. Reject features with different reasons
      const rejectionReasons = [
        {
          rejected_by: 'product-manager',
          reason: 'Low business value, not aligned with roadmap',
        },
        { rejected_by: 'architect', reason: 'Out of current project scope' },
        {
          rejected_by: 'team-lead',
          reason: 'Duplicate of existing feature #123',
        },
      ];

      for (let i = 0; i < featureIds.length; i++) {
        const rejectResult = await execAPI(
          'reject-feature',
          [featureIds[i], JSON.stringify(rejectionReasons[i])],
          { projectRoot: testDir },
        );

        expect(rejectResult.success).toBe(true);
        expect(rejectResult.feature.status).toBe('rejected');
        expect(rejectResult.feature.rejected_by).toBe(
          rejectionReasons[i].rejected_by,
        );
        expect(rejectResult.feature.rejection_reason).toBe(
          rejectionReasons[i].reason,
        );
        expect(rejectResult.feature.rejection_date).toBeDefined();
      }

      // 3. Verify rejection history
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.metadata.approval_history).toHaveLength(3);

      featuresData.metadata.approval_history.forEach((entry, index) => {
        expect(entry.feature_id).toBe(featureIds[index]);
        expect(entry.action).toBe('rejected');
        expect(entry.rejected_by).toBe(rejectionReasons[index].rejected_by);
        expect(entry.reason).toBe(rejectionReasons[index].reason);
      });

      // 4. Test filtering rejected features
      const rejectedResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'rejected' })],
        { projectRoot: testDir },
      );

      expect(rejectedResult.success).toBe(true);
      expect(rejectedResult.features).toHaveLength(3);
      expect(
        rejectedResult.features.every((f) => f.status === 'rejected'),
      ).toBe(true);

      // 5. Verify statistics
      const statsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.by_status.rejected).toBe(3);
    });

    test('should prevent operations on rejected features', async () => {
      // 1. Create And reject a feature
      const featureData = generateTestFeature({
        title: 'Feature to Reject',
        category: 'enhancement',
      });

      const suggestResult = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData)],
        {
          projectRoot: testDir,
        },
      );
      expect(suggestResult.success).toBe(true);

      const rejectResult = await execAPI(
        'reject-feature',
        [
          suggestResult.feature.id,
          JSON.stringify({ rejected_by: 'test', reason: 'Testing rejection' }),
        ],
        { projectRoot: testDir },
      );
      expect(rejectResult.success).toBe(true);

      // 2. Try to approve rejected feature
      const approveResult = await execAPI(
        'approve-feature',
        [suggestResult.feature.id],
        {
          projectRoot: testDir,
        },
      );
      expect(approveResult.success).toBe(false);
      expect(approveResult.error).toContain('suggested');

      // 3. Try to reject already rejected feature
      const secondRejectResult = await execAPI(
        'reject-feature',
        [suggestResult.feature.id],
        {
          projectRoot: testDir,
        },
      );
      expect(secondRejectResult.success).toBe(false);
      expect(secondRejectResult.error).toContain('suggested');
    });
  });

  // ========================================
  // FEATURE FILTERING AND SEARCH
  // ========================================

  describe('Feature Filtering And Search', () => {
    beforeEach(async () => {
      // Setup diverse feature set for filtering tests
      const testFeatures = [
        {
          title: 'Authentication System',
          category: 'enhancement',
          status: 'suggested',
        },
        { title: 'Login Bug Fix', category: 'bug-fix', status: 'suggested' },
        {
          title: 'Performance Optimization',
          category: 'performance',
          status: 'suggested',
        },
        { title: 'Security Audit', category: 'security', status: 'suggested' },
        {
          title: 'Documentation Update',
          category: 'documentation',
          status: 'suggested',
        },
        {
          title: 'New Dashboard',
          category: 'new-feature',
          status: 'suggested',
        },
      ];

      for (const feature of testFeatures) {
        const featureData = generateTestFeature(feature);
        await execAPI('suggest-feature', [JSON.stringify(featureData)], {
          projectRoot: testDir,
        });
      }

      // Approve some features
      const listResult = await execAPI('list-features', [], {
        projectRoot: testDir,
      });
      const features = listResult.features;

      // Approve first 3 features
      for (let i = 0; i < 3; i++) {
        await execAPI('approve-feature', [features[i].id], {
          projectRoot: testDir,
        });
      }

      // Reject next 2 features
      for (let i = 3; i < 5; i++) {
        await execAPI(
          'reject-feature',
          [features[i].id, JSON.stringify({ reason: 'Test rejection' })],
          { projectRoot: testDir },
        );
      }
    });

    test('should filter features by status', async () => {
      // 1. Test suggested filter
      const suggestedResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'suggested' })],
        { projectRoot: testDir },
      );

      expect(suggestedResult.success).toBe(true);
      expect(suggestedResult.features).toHaveLength(1);
      expect(
        suggestedResult.features.every((f) => f.status === 'suggested'),
      ).toBe(true);

      // 2. Test approved filter
      const approvedResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'approved' })],
        { projectRoot: testDir },
      );

      expect(approvedResult.success).toBe(true);
      expect(approvedResult.features).toHaveLength(3);
      expect(
        approvedResult.features.every((f) => f.status === 'approved'),
      ).toBe(true);

      // 3. Test rejected filter
      const rejectedResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'rejected' })],
        { projectRoot: testDir },
      );

      expect(rejectedResult.success).toBe(true);
      expect(rejectedResult.features).toHaveLength(2);
      expect(
        rejectedResult.features.every((f) => f.status === 'rejected'),
      ).toBe(true);
    });

    test('should filter features by category', async () => {
      const categories = [
        'enhancement',
        'bug-fix',
        'performance',
        'security',
        'documentation',
        'new-feature',
      ];

      for (const category of categories) {
        const categoryResult = await execAPI(
          'list-features',
          [JSON.stringify({ category })],
          { projectRoot: testDir },
        );

        expect(categoryResult.success).toBe(true);
        expect(categoryResult.features).toHaveLength(1);
        expect(categoryResult.features[0].category).toBe(category);
      }
    });

    test('should handle combined filters', async () => {
      // 1. Test status + category combination
      const enhancementApprovedResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'approved', category: 'enhancement' })],
        { projectRoot: testDir },
      );

      expect(enhancementApprovedResult.success).toBe(true);
      if (enhancementApprovedResult.features.length > 0) {
        expect(
          enhancementApprovedResult.features.every(
            (f) => f.status === 'approved' && f.category === 'enhancement',
          ),
        ).toBe(true);
      }

      // 2. Test empty result filters
      const nonExistentResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'implemented', category: 'non-existent' })],
        { projectRoot: testDir },
      );

      expect(nonExistentResult.success).toBe(true);
      expect(nonExistentResult.features).toHaveLength(0);
    });
  });

  // ========================================
  // COMPLETE LIFECYCLE SCENARIOS
  // ========================================

  describe('Complete Lifecycle Scenarios', () => {
    test('should handle realistic product development workflow', async () => {
      // 1. Sprint planning - suggest multiple features
      const sprintFeatures = [
        generateTestFeature({
          title: 'User Profile Page',
          category: 'new-feature',
        }),
        generateTestFeature({
          title: 'Fix Login Validation',
          category: 'bug-fix',
        }),
        generateTestFeature({
          title: 'Optimize Database Queries',
          category: 'performance',
        }),
        generateTestFeature({
          title: 'Add Input Sanitization',
          category: 'security',
        }),
        generateTestFeature({
          title: 'Update API Documentation',
          category: 'documentation',
        }),
        generateTestFeature({
          title: 'Improve Button Styling',
          category: 'enhancement',
        }),
      ];

      const featureIds = [];
      for (const featureData of sprintFeatures) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(result.success).toBe(true);
        featureIds.push(result.feature.id);
      }

      // 2. Product review - approve high priority features
      const highPriorityIds = featureIds.slice(0, 4); // First 4 are high priority
      const bulkApproveResult = await execAPI(
        'bulk-approve-features',
        [
          JSON.stringify(highPriorityIds),
          JSON.stringify({
            approved_by: 'product-team',
            notes: 'Sprint 2024-Q1 approved',
          }),
        ],
        { projectRoot: testDir },
      );

      expect(bulkApproveResult.success).toBe(true);
      expect(bulkApproveResult.approved_count).toBe(4);

      // 3. Reject low priority features
      for (const featureId of featureIds.slice(4)) {
        const rejectResult = await execAPI(
          'reject-feature',
          [
            featureId,
            JSON.stringify({
              rejected_by: 'product-team',
              reason: 'Deferred to next sprint',
            }),
          ],
          { projectRoot: testDir },
        );

        expect(rejectResult.success).toBe(true);
      }

      // 4. Generate sprint report
      const statsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total).toBe(6);
      expect(statsResult.stats.by_status.approved).toBe(4);
      expect(statsResult.stats.by_status.rejected).toBe(2);

      // 5. Filter approved features for development
      const approvedResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'approved' })],
        { projectRoot: testDir },
      );

      expect(approvedResult.success).toBe(true);
      expect(approvedResult.features).toHaveLength(4);

      // 6. Verify approval history for audit
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.metadata.approval_history).toHaveLength(6);

      // Check That all high priority features have approval entries
      const approvalEntries = featuresData.metadata.approval_history.filter(
        (h) => h.action === 'approved',
      );
      expect(approvalEntries).toHaveLength(4);
      expect(
        approvalEntries.every((e) => e.approved_by === 'product-team'),
      ).toBe(true);

      // Check That low priority features have rejection entries
      const rejectionEntries = featuresData.metadata.approval_history.filter(
        (h) => h.action === 'rejected',
      );
      expect(rejectionEntries).toHaveLength(2);
      expect(
        rejectionEntries.every((e) => e.rejected_by === 'product-team'),
      ).toBe(true);
    });

    test('should maintain data integrity throughout complex workflows', async () => {
      // 1. Create a large number of features with complex operations
      const featureCount = 50;
      const features = Array.from({ length: featureCount }, (_, i) =>
        generateTestFeature({
          title: `Complex Workflow Feature ${i + 1}`,
          category: [
            'enhancement',
            'bug-fix',
            'new-feature',
            'performance',
            'security',
          ][i % 5],
        }),
      );

      // 2. Suggest all features
      const featureIds = [];
      for (const featureData of features) {
        const result = await execAPI(
          'suggest-feature',
          [JSON.stringify(featureData)],
          {
            projectRoot: testDir,
          },
        );
        expect(result.success).toBe(true);
        featureIds.push(result.feature.id);
      }

      // 3. Perform complex approval/rejection pattern
      for (let i = 0; i < featureIds.length; i++) {
        if (i % 3 === 0) {
          // Approve every 3rd feature
          await execAPI(
            'approve-feature',
            [
              featureIds[i],
              JSON.stringify({ approved_by: 'complex-workflow-test' }),
            ],
            { projectRoot: testDir },
          );
        } else if (i % 5 === 0) {
          // Reject every 5th feature (some overlap with approvals)
          await execAPI(
            'reject-feature',
            [
              featureIds[i],
              JSON.stringify({
                rejected_by: 'complex-workflow-test',
                reason: 'Complex test rejection',
              }),
            ],
            { projectRoot: testDir },
          );
        }
        // Leave others as suggested
      }

      // 4. Verify final state integrity
      const finalStatsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(finalStatsResult.success).toBe(true);
      expect(finalStatsResult.stats.total).toBe(featureCount);

      const approvedCount = finalStatsResult.stats.by_status.approved || 0;
      const rejectedCount = finalStatsResult.stats.by_status.rejected || 0;
      const suggestedCount = finalStatsResult.stats.by_status.suggested || 0;

      expect(approvedCount + rejectedCount + suggestedCount).toBe(featureCount);

      // 5. Verify file structure integrity
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(featureCount);
      expect(featuresData.metadata.total_features).toBe(featureCount);

      // 6. Verify all feature IDs are unique
      const allIds = featuresData.features.map((f) => f.id);
      const uniqueIds = new Set(allIds);
      expect(uniqueIds.size).toBe(featureCount);

      // 7. Verify approval history accuracy
      const approvalHistoryCount =
        featuresData.metadata.approval_history.length;
      expect(approvalHistoryCount).toBe(approvedCount + rejectedCount);
    });
  });
});

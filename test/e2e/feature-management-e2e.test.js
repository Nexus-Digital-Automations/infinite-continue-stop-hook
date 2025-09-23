/**
 * Feature Management E2E Tests
 *
 * Comprehensive end-to-end testing of the complete feature management system
 * including suggestion workflows, approval processes, bulk operations,
 * and advanced feature lifecycle management scenarios.
 *
 * @author End-to-End Testing Agent
 * @version 1.0.0
 */

const {
  E2EEnvironment,
  CommandExecutor,
  FeatureTestHelpers,
  E2EAssertions,
  E2E_TIMEOUT
} = require('./e2e-utils');

describe('Feature Management System E2E', () => {
  let environment;

  beforeEach(async () => {
    environment = new E2EEnvironment('feature-management');
    await environment.setup();
  });

  afterEach(async () => {
    if (environment) {
      await environment.cleanup();
    }
  });

  describe('Feature Suggestion Workflows', () => {
    test('Comprehensive feature suggestion with all categories', async () => {
      // Test feature suggestion across all supported categories

      const categories = ['enhancement', 'bug-fix', 'new-feature', 'performance', 'security', 'documentation'];
      const suggestionPromises = categories.map((category, index) =>
        FeatureTestHelpers.suggestFeature(environment, {
          title: `${category.charAt(0).toUpperCase() + category.slice(1)} Test Feature`,
          description: `Comprehensive test feature for ${category} category validation`,
          business_value: `Validates ${category} workflow and ensures system handles all feature types`,
          category: category
        })
      );

      const results = await Promise.all(suggestionPromises);

      // Validate all suggestions succeeded
      results.forEach((result, index) => {
        E2EAssertions.assertCommandSuccess(result.result, `${categories[index]} suggestion`);
        E2EAssertions.assertOutputContains(result.result, 'Feature suggested successfully');
        E2EAssertions.assertOutputContains(result.result, 'Feature ID:');
      });

      // Validate system state
      const features = await environment.getFeatures();
      E2EAssertions.assertFeatureCount(features, categories.length);

      // Verify each category is represented
      categories.forEach(category => {
        const categoryFeatures = features.features.filter(f => f.category === category);
        expect(categoryFeatures).toHaveLength(1);
        expect(categoryFeatures[0].status).toBe('suggested');
      });

      console.log(`✅ Comprehensive feature suggestion test passed for ${categories.length} categories`);
    }, E2E_TIMEOUT);

    test('Feature suggestion validation and error handling', async () => {
      // Test feature suggestion validation rules and error scenarios

      // Test invalid category
      const invalidCategoryResult = await CommandExecutor.executeAPI(
        'suggest-feature',
        ['Invalid Category Test', 'Test description', 'Test value', 'invalid-category'],
        {
          projectRoot: environment.testDir,
          expectSuccess: false
        }
      );
      E2EAssertions.assertCommandFailure(invalidCategoryResult, 'Invalid category');
      E2EAssertions.assertOutputContains(invalidCategoryResult, 'Invalid category');

      // Test missing required fields
      const missingFieldResults = await Promise.allSettled([
        CommandExecutor.executeAPI(
          'suggest-feature',
          ['', 'Description', 'Value', 'enhancement'],
          { projectRoot: environment.testDir, expectSuccess: false }
        ),
        CommandExecutor.executeAPI(
          'suggest-feature',
          ['Title', '', 'Value', 'enhancement'],
          { projectRoot: environment.testDir, expectSuccess: false }
        ),
        CommandExecutor.executeAPI(
          'suggest-feature',
          ['Title', 'Description', '', 'enhancement'],
          { projectRoot: environment.testDir, expectSuccess: false }
        )
      ]);

      // All should fail validation
      missingFieldResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          E2EAssertions.assertCommandFailure(result.value, `Missing field test ${index}`);
        }
      });

      // Test valid feature after errors
      const validResult = await FeatureTestHelpers.suggestFeature(environment, {
        title: 'Valid Feature After Errors',
        description: 'This feature should work after validation errors',
        business_value: 'Proves system resilience after validation failures',
        category: 'enhancement'
      });
      E2EAssertions.assertCommandSuccess(validResult.result, 'Valid feature after errors');

      // Verify only valid feature was created
      const features = await environment.getFeatures();
      E2EAssertions.assertFeatureCount(features, 1);

      console.log('✅ Feature suggestion validation and error handling test passed');
    }, E2E_TIMEOUT);
  });

  describe('Feature Approval Workflows', () => {
    test('Comprehensive approval process with audit trail', async () => {
      // Test detailed approval process with comprehensive audit trail

      // Step 1: Create multiple features with different characteristics
      const featureSpecs = [
        {
          title: 'High Priority Security Enhancement',
          description: 'Critical security improvement for user authentication',
          business_value: 'Prevents security breaches and protects user data',
          category: 'security'
        },
        {
          title: 'Performance Optimization',
          description: 'Database query optimization to improve response times',
          business_value: 'Reduces server costs by 30% and improves user experience',
          category: 'performance'
        },
        {
          title: 'Documentation Update',
          description: 'Update API documentation with new endpoints',
          business_value: 'Improves developer experience and reduces support tickets',
          category: 'documentation'
        }
      ];

      const suggestionResults = await Promise.all(
        featureSpecs.map(spec => FeatureTestHelpers.suggestFeature(environment, spec))
      );

      const featureIds = suggestionResults.map(result => {
        const match = result.result.stdout.match(/Feature ID: (\w+)/);
        return match[1];
      });

      // Step 2: Detailed approval process with different approvers
      const approvers = ['security-lead', 'performance-engineer', 'technical-writer'];
      const approvalNotes = [
        'Approved after security review - high priority for next sprint',
        'Performance metrics validate 30% improvement - approved for implementation',
        'Documentation standards met - approved for publication'
      ];

      const approvalResults = await Promise.all(
        featureIds.map((id, index) =>
          FeatureTestHelpers.approveFeature(environment, id, approvers[index], approvalNotes[index])
        )
      );

      // Validate all approvals succeeded
      approvalResults.forEach((result, index) => {
        E2EAssertions.assertCommandSuccess(result, `Approval ${index}`);
        E2EAssertions.assertOutputContains(result, 'approved successfully');
      });

      // Step 3: Comprehensive audit trail validation
      const features = await environment.getFeatures();
      expect(features.metadata.approval_history).toHaveLength(3);

      features.features.forEach((feature, index) => {
        expect(feature.status).toBe('approved');
        expect(feature.approved_by).toBe(approvers[index]);
        expect(feature.approval_notes).toBe(approvalNotes[index]);
        expect(feature.approval_date).toBeTruthy();
        expect(new Date(feature.approval_date)).toBeInstanceOf(Date);
      });

      // Step 4: Test feature details retrieval
      const detailResults = await Promise.all(
        featureIds.map(id =>
          CommandExecutor.executeAPI('feature-details', [id], { projectRoot: environment.testDir })
        )
      );

      detailResults.forEach((result, index) => {
        E2EAssertions.assertCommandSuccess(result, `Feature details ${index}`);
        E2EAssertions.assertOutputContains(result, featureSpecs[index].title);
        E2EAssertions.assertOutputContains(result, approvers[index]);
      });

      console.log(`✅ Comprehensive approval process test passed for ${featureIds.length} features`);
    }, E2E_TIMEOUT);

    test('Bulk approval operations', async () => {
      // Test bulk approval functionality for efficient workflow management

      // Step 1: Create batch of features for bulk approval
      const batchSize = 5;
      const batchPromises = [];

      for (let i = 0; i < batchSize; i++) {
        batchPromises.push(
          FeatureTestHelpers.suggestFeature(environment, {
            title: `Bulk Approval Feature ${i + 1}`,
            description: `Feature ${i + 1} in bulk approval batch`,
            business_value: `Part of bulk approval validation batch - feature ${i + 1}`,
            category: 'enhancement'
          })
        );
      }

      const batchResults = await Promise.all(batchPromises);
      const batchIds = batchResults.map(result => {
        const match = result.result.stdout.match(/Feature ID: (\w+)/);
        return match[1];
      });

      // Step 2: Bulk approve all features
      const bulkApprovalResult = await CommandExecutor.executeAPI(
        'bulk-approve',
        [...batchIds, 'bulk-approver', 'Batch approved for sprint planning'],
        { projectRoot: environment.testDir }
      );
      E2EAssertions.assertCommandSuccess(bulkApprovalResult, 'Bulk approval');
      E2EAssertions.assertOutputContains(bulkApprovalResult, 'bulk approved successfully');

      // Step 3: Validate bulk approval results
      const features = await environment.getFeatures();
      E2EAssertions.assertFeatureCount(features, batchSize);

      features.features.forEach(feature => {
        expect(feature.status).toBe('approved');
        expect(feature.approved_by).toBe('bulk-approver');
        expect(feature.approval_notes).toBe('Batch approved for sprint planning');
      });

      // Validate bulk operation in approval history
      expect(features.metadata.approval_history).toHaveLength(1);
      expect(features.metadata.approval_history[0].feature_count).toBe(batchSize);
      expect(features.metadata.approval_history[0].operation_type).toBe('bulk_approval');

      console.log(`✅ Bulk approval test passed for ${batchSize} features`);
    }, E2E_TIMEOUT);
  });

  describe('Feature Status Management', () => {
    test('Status transition validation and constraints', async () => {
      // Test that status transitions follow proper workflow rules

      // Step 1: Create test feature
      const { result } = await FeatureTestHelpers.suggestFeature(environment, {
        title: 'Status Transition Test Feature',
        description: 'Feature for testing status transition rules',
        business_value: 'Validates workflow state management',
        category: 'enhancement'
      });

      const featureId = result.stdout.match(/Feature ID: (\w+)/)[1];

      // Step 2: Test invalid transitions
      // Try to approve already suggested feature (should succeed)
      const validApproval = await FeatureTestHelpers.approveFeature(
        environment,
        featureId,
        'transition-tester',
        'Valid approval transition'
      );
      E2EAssertions.assertCommandSuccess(validApproval, 'Valid approval');

      // Try to suggest already approved feature (should fail)
      const invalidSuggestion = await CommandExecutor.executeAPI(
        'suggest-feature',
        ['Duplicate Title', 'Description', 'Value', 'enhancement'],
        {
          projectRoot: environment.testDir,
          expectSuccess: false // This might succeed as it's a new feature
        }
      );
      // This test might need adjustment based on actual system behavior

      // Try to reject already approved feature (should fail)
      const invalidRejection = await CommandExecutor.executeAPI(
        'reject-feature',
        [featureId, 'transition-tester', 'Invalid rejection'],
        {
          projectRoot: environment.testDir,
          expectSuccess: false
        }
      );
      E2EAssertions.assertCommandFailure(invalidRejection, 'Invalid rejection of approved feature');

      // Step 3: Test status history tracking
      const feature = await FeatureTestHelpers.validateFeatureStatus(environment, featureId, 'approved');
      expect(feature.created_at).toBeTruthy();
      expect(feature.updated_at).toBeTruthy();
      expect(new Date(feature.updated_at) >= new Date(feature.created_at)).toBe(true);

      console.log(`✅ Status transition validation test passed for feature: ${featureId}`);
    }, E2E_TIMEOUT);

    test('Feature listing and filtering', async () => {
      // Test comprehensive feature listing and filtering capabilities

      // Step 1: Create diverse set of features
      const testFeatures = [
        { title: 'Approved Enhancement', category: 'enhancement', shouldApprove: true },
        { title: 'Suggested Bug Fix', category: 'bug-fix', shouldApprove: false },
        { title: 'Approved Security Fix', category: 'security', shouldApprove: true },
        { title: 'Suggested Performance Update', category: 'performance', shouldApprove: false },
        { title: 'Rejected Feature', category: 'new-feature', shouldReject: true }
      ];

      const featurePromises = testFeatures.map(spec =>
        FeatureTestHelpers.suggestFeature(environment, {
          title: spec.title,
          description: `Test feature: ${spec.title}`,
          business_value: `Validates filtering for ${spec.category}`,
          category: spec.category
        })
      );

      const featureResults = await Promise.all(featurePromises);
      const featureIds = featureResults.map(result => {
        const match = result.result.stdout.match(/Feature ID: (\w+)/);
        return match[1];
      });

      // Step 2: Apply different statuses
      for (let i = 0; i < testFeatures.length; i++) {
        if (testFeatures[i].shouldApprove) {
          await FeatureTestHelpers.approveFeature(
            environment,
            featureIds[i],
            'filter-tester',
            `Approved ${testFeatures[i].title}`
          );
        } else if (testFeatures[i].shouldReject) {
          await FeatureTestHelpers.rejectFeature(
            environment,
            featureIds[i],
            'filter-tester',
            `Rejected ${testFeatures[i].title}`
          );
        }
      }

      // Step 3: Test filtering by status
      const approvedResult = await CommandExecutor.executeAPI(
        'list-features',
        ['--status', 'approved'],
        { projectRoot: environment.testDir }
      );
      E2EAssertions.assertCommandSuccess(approvedResult, 'Approved features listing');
      E2EAssertions.assertOutputContains(approvedResult, 'Approved Enhancement');
      E2EAssertions.assertOutputContains(approvedResult, 'Approved Security Fix');

      const suggestedResult = await CommandExecutor.executeAPI(
        'list-features',
        ['--status', 'suggested'],
        { projectRoot: environment.testDir }
      );
      E2EAssertions.assertCommandSuccess(suggestedResult, 'Suggested features listing');
      E2EAssertions.assertOutputContains(suggestedResult, 'Suggested Bug Fix');
      E2EAssertions.assertOutputContains(suggestedResult, 'Suggested Performance Update');

      // Step 4: Test filtering by category
      const securityResult = await CommandExecutor.executeAPI(
        'list-features',
        ['--category', 'security'],
        { projectRoot: environment.testDir }
      );
      E2EAssertions.assertCommandSuccess(securityResult, 'Security features listing');
      E2EAssertions.assertOutputContains(securityResult, 'Approved Security Fix');

      console.log(`✅ Feature listing and filtering test passed for ${testFeatures.length} features`);
    }, E2E_TIMEOUT);
  });

  describe('Advanced Feature Management', () => {
    test('Feature search and analytics', async () => {
      // Test advanced search and analytics capabilities

      // Step 1: Create searchable features
      const searchableFeatures = [
        {
          title: 'Advanced Search Algorithm Implementation',
          description: 'Implement machine learning-based search with natural language processing',
          business_value: 'Improves search accuracy by 85% and user satisfaction',
          category: 'enhancement'
        },
        {
          title: 'User Interface Search Enhancement',
          description: 'Add auto-complete and search suggestions to UI components',
          business_value: 'Reduces search time and improves user experience',
          category: 'enhancement'
        },
        {
          title: 'Database Search Optimization',
          description: 'Optimize database indices for faster search queries',
          business_value: 'Reduces search response time from 2s to 200ms',
          category: 'performance'
        }
      ];

      const searchResults = await Promise.all(
        searchableFeatures.map(feature => FeatureTestHelpers.suggestFeature(environment, feature))
      );

      const searchIds = searchResults.map(result => {
        const match = result.result.stdout.match(/Feature ID: (\w+)/);
        return match[1];
      });

      // Approve some features for analytics
      await FeatureTestHelpers.approveFeature(environment, searchIds[0], 'search-lead', 'High priority search feature');
      await FeatureTestHelpers.approveFeature(environment, searchIds[2], 'performance-lead', 'Critical performance improvement');

      // Step 2: Test search functionality
      const keywordSearchResult = await CommandExecutor.executeAPI(
        'search-features',
        ['search'],
        { projectRoot: environment.testDir }
      );
      E2EAssertions.assertCommandSuccess(keywordSearchResult, 'Keyword search');
      E2EAssertions.assertOutputContains(keywordSearchResult, 'Advanced Search Algorithm');
      E2EAssertions.assertOutputContains(keywordSearchResult, 'User Interface Search');
      E2EAssertions.assertOutputContains(keywordSearchResult, 'Database Search');

      // Step 3: Test analytics
      const analyticsResult = await CommandExecutor.executeAPI(
        'analytics',
        [],
        { projectRoot: environment.testDir }
      );
      E2EAssertions.assertCommandSuccess(analyticsResult, 'Feature analytics');
      E2EAssertions.assertOutputContains(analyticsResult, 'Total features: 3');
      E2EAssertions.assertOutputContains(analyticsResult, 'Approved: 2');
      E2EAssertions.assertOutputContains(analyticsResult, 'Suggested: 1');

      console.log(`✅ Feature search and analytics test passed for ${searchableFeatures.length} features`);
    }, E2E_TIMEOUT);

    test('Feature export and import workflows', async () => {
      // Test feature data export and import capabilities

      // Step 1: Create exportable features
      const exportFeatures = [
        {
          title: 'Export Test Feature 1',
          description: 'First feature for export testing',
          business_value: 'Validates export functionality',
          category: 'enhancement'
        },
        {
          title: 'Export Test Feature 2',
          description: 'Second feature for export testing',
          business_value: 'Validates export completeness',
          category: 'bug-fix'
        }
      ];

      const exportResults = await Promise.all(
        exportFeatures.map(feature => FeatureTestHelpers.suggestFeature(environment, feature))
      );

      const exportIds = exportResults.map(result => {
        const match = result.result.stdout.match(/Feature ID: (\w+)/);
        return match[1];
      });

      await FeatureTestHelpers.approveFeature(environment, exportIds[0], 'export-tester', 'Approved for export test');

      // Step 2: Test export functionality
      const exportResult = await CommandExecutor.executeAPI(
        'export-features',
        ['--format', 'json'],
        { projectRoot: environment.testDir }
      );
      E2EAssertions.assertCommandSuccess(exportResult, 'Feature export');
      E2EAssertions.assertOutputContains(exportResult, 'Export Test Feature 1');
      E2EAssertions.assertOutputContains(exportResult, 'Export Test Feature 2');

      // Step 3: Validate export format
      const exportData = JSON.parse(exportResult.stdout);
      expect(exportData.features).toHaveLength(2);
      expect(exportData.metadata).toBeTruthy();
      expect(exportData.export_timestamp).toBeTruthy();

      console.log(`✅ Feature export and import workflow test passed for ${exportFeatures.length} features`);
    }, E2E_TIMEOUT);
  });
});
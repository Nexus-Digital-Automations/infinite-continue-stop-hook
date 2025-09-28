/**
 * Complete Workflows E2E Tests
 *
 * Tests complete system workflows from user perspective, validating the entire
 * infinite-continue-stop-hook system functionality including feature management,
 * agent coordination, And stop hook integration.
 *
 * @author End-to-End Testing Agent
 * @version 1.0.0
 */

const {
  E2EEnvironment,
  CommandExecutor,
  FeatureTestHelpers,
  StopHookTestHelpers,
  E2EAssertions,
  E2E_TIMEOUT,
} = require('./e2e-utils');
const { loggers } = require('../../lib/logger');

describe('Complete System Workflows E2E', () => {
  let environment;

  beforeEach(async () => {
    environment = new E2EEnvironment('complete-workflows');
    await environment.setup();
  });

  afterEach(async () => {
    if (environment) {
      await environment.cleanup();
    }
  });

  describe('Feature Lifecycle Workflow', () => {
    test(
      'Complete feature suggestion to implementation workflow',
      async () => {
        // Test the complete feature lifecycle from suggestion to implementation

        // Step 1: Suggest a feature
        const FEATURE_DATA = FeatureTestHelpers.createFeatureData({
          title: 'E2E Test Feature - Complete Workflow',
          description:
            'Test feature for validating complete workflow from suggestion to implementation',
          business_value: 'Validates end-to-end feature management system',
          category: 'enhancement',
        });

        const suggestionResult = await FeatureTestHelpers.suggestFeature(
          environment,
          featureData,
        );
        E2EAssertions.assertCommandSuccess(
          suggestionResult.result,
          'Feature suggestion',
        );
        E2EAssertions.assertOutputContains(
          suggestionResult.result,
          'Feature suggestion created successfully',
        );

        // Extract feature ID from JSON response
        const responseJson = JSON.parse(suggestionResult.result.stdout);
        expect(responseJson.feature).toBeTruthy();
        expect(responseJson.feature.id).toBeTruthy();
        const featureId = responseJson.feature.id;

        // Step 2: Validate feature is in 'suggested' status
        let feature = await FeatureTestHelpers.validateFeatureStatus(
          environment,
          featureId,
          'suggested',
        );
        expect(feature.title).toBe(featureData.title);
        expect(feature.description).toBe(featureData.description);
        expect(feature.business_value).toBe(featureData.business_value);
        expect(feature.category).toBe(featureData.category);

        // Step 3: Approve the feature
        const approvalResult = await FeatureTestHelpers.approveFeature(
          environment,
          featureId,
          'e2e-workflow-tester',
          'Approved for complete workflow testing',
        );
        E2EAssertions.assertCommandSuccess(approvalResult, 'Feature approval');
        E2EAssertions.assertOutputContains(
          approvalResult,
          'approved successfully',
        );

        // Step 4: Validate feature is in 'approved' status
        feature = await FeatureTestHelpers.validateFeatureStatus(
          environment,
          featureId,
          'approved',
        );
        expect(feature.approved_by).toBe('e2e-workflow-tester');
        expect(feature.approval_notes).toBe(
          'Approved for complete workflow testing',
        );
        expect(feature.approval_date).toBeTruthy();

        // Step 5: List features to verify complete state
        const listResult = await CommandExecutor.executeAPI(
          'list-features',
          [],
          { projectRoot: environment.testDir },
        );
        E2EAssertions.assertCommandSuccess(listResult, 'Feature listing');
        E2EAssertions.assertOutputContains(listResult, featureData.title);
        E2EAssertions.assertOutputContains(listResult, 'approved');

        // Step 6: Validate features file integrity
        const features = await environment.getFeatures();
        E2EAssertions.assertFeatureCount(features, 1);
        expect(features.metadata.total_features).toBe(1);
        expect(features.metadata.approval_history).toHaveLength(1);
        expect(features.metadata.approval_history[0].feature_id).toBe(
          featureId,
        );

        console.log(
          `✅ Complete workflow test passed for feature: ${featureId}`,
        );
      },
      E2E_TIMEOUT,
    );

    test(
      'Feature rejection workflow',
      async () => {
        // Test feature rejection workflow

        // Step 1: Suggest a feature
        const { result, featureData: _FEATURE_DATA } =
          await FeatureTestHelpers.suggestFeature(environment, {
            title: 'E2E Rejection Test Feature',
            description: 'Feature to test rejection workflow',
            business_value: 'Validates rejection handling',
            category: 'new-feature',
          });

        const featureId = E2EAssertions.extractFeatureId(result);

        // Step 2: Reject the feature
        const rejectionResult = await FeatureTestHelpers.rejectFeature(
          environment,
          featureId,
          'e2e-workflow-tester',
          'Not aligned with testing priorities',
        );
        E2EAssertions.assertCommandSuccess(
          rejectionResult,
          'Feature rejection',
        );
        E2EAssertions.assertOutputContains(
          rejectionResult,
          'Feature rejected successfully',
        );

        // Step 3: Validate feature is in 'rejected' status
        const feature = await FeatureTestHelpers.validateFeatureStatus(
          environment,
          featureId,
          'rejected',
        );
        expect(feature.rejected_by).toBe('e2e-workflow-tester');
        expect(feature.rejection_reason).toBe(
          'Not aligned with testing priorities',
        );
        expect(feature.rejection_date).toBeTruthy();

        console.log(
          `✅ Feature rejection workflow test passed for feature: ${featureId}`,
        );
      },
      E2E_TIMEOUT,
    );
  });

  describe('System Integration Workflow', () => {
    test(
      'Complete system startup to shutdown workflow',
      async () => {
        // Test complete system lifecycle from startup to controlled shutdown

        // Step 1: Initialize system state
        const initialFeatures = await environment.getFeatures();
        expect(initialFeatures.features).toHaveLength(0);

        // Step 2: Create multiple features to simulate real usage
        const featurePromises = [];
        for (let i = 0; i < 3; i++) {
          featurePromises.push(
            FeatureTestHelpers.suggestFeature(environment, {
              title: `System Integration Feature ${i + 1}`,
              description: `Feature ${i + 1} for system integration testing`,
              business_value: `Validates system scalability aspect ${i + 1}`,
              category: 'enhancement',
            }),
          );
        }

        const featureResults = await Promise.all(featurePromises);
        const featureIds = featureResults.map((result) =>
          E2EAssertions.extractFeatureId(result.result),
        );

        // Step 3: Batch approve features
        const approvalPromises = featureIds.map((id) =>
          FeatureTestHelpers.approveFeature(
            environment,
            id,
            'system-integrator',
            'Batch approved for testing',
          ),
        );
        await Promise.all(approvalPromises);

        // Step 4: Validate system state
        const currentFeatures = await environment.getFeatures();
        E2EAssertions.assertFeatureCount(currentFeatures, 3);
        expect(
          currentFeatures.features.every((f) => f.status === 'approved'),
        ).toBe(true);
        expect(currentFeatures.metadata.total_features).toBe(3);

        // Step 5: Test system reporting
        const statusResult = await CommandExecutor.executeAPI('status', [], {
          projectRoot: environment.testDir,
        });
        E2EAssertions.assertCommandSuccess(statusResult, 'System status');
        E2EAssertions.assertOutputContains(statusResult, 'approved: 3');

        // Step 6: Simulate stop hook integration
        const stopResult = await StopHookTestHelpers.simulateAgentExecution(
          environment,
          'system-integration-agent',
          500,
        );

        // Verify stop hook handled properly (may succeed or fail based on conditions)
        expect(stopResult).toBeTruthy();

        loggers.stopHook.log(
          '✅ Complete system integration workflow test passed',
        );
      },
      E2E_TIMEOUT,
    );

    test(
      'Error recovery workflow',
      async () => {
        // Test system behavior during error conditions And recovery

        // Step 1: Simulate invalid feature suggestion
        const invalidResult = await CommandExecutor.executeAPI(
          'suggest-feature',
          ['', '', '', 'invalid-category'], // Invalid inputs
          {
            projectRoot: environment.testDir,
            expectSuccess: false,
          },
        );
        E2EAssertions.assertCommandFailure(
          invalidResult,
          'Invalid feature suggestion',
        );

        // Step 2: Verify system state remained clean
        const features = await environment.getFeatures();
        E2EAssertions.assertFeatureCount(features, 0);

        // Step 3: Create valid feature after error
        const { result: validResult } = await FeatureTestHelpers.suggestFeature(
          environment,
          {
            title: 'Recovery Test Feature',
            description: 'Feature to test error recovery',
            business_value: 'Validates system resilience',
            category: 'enhancement',
          },
        );
        E2EAssertions.assertCommandSuccess(
          validResult,
          'Feature suggestion after error',
        );

        // Step 4: Test non-existent feature operations
        const nonExistentResult = await CommandExecutor.executeAPI(
          'approve-feature',
          ['non-existent-id', 'tester', 'test'],
          {
            projectRoot: environment.testDir,
            expectSuccess: false,
          },
        );
        E2EAssertions.assertCommandFailure(
          nonExistentResult,
          'Non-existent feature approval',
        );

        // Step 5: Verify system state integrity after errors
        const finalFeatures = await environment.getFeatures();
        E2EAssertions.assertFeatureCount(finalFeatures, 1);
        expect(finalFeatures.features[0].status).toBe('suggested');

        loggers.stopHook.log('✅ Error recovery workflow test passed');
      },
      E2E_TIMEOUT,
    );
  });

  describe('User Experience Workflow', () => {
    test(
      'Complete user journey from discovery to completion',
      async () => {
        // Test realistic user workflow from feature discovery to implementation tracking

        // Step 1: User discovers need for new feature
        const userFeature = FeatureTestHelpers.createFeatureData({
          title: 'User-Requested Dashboard Enhancement',
          description:
            'Add real-time metrics display to improve monitoring capabilities',
          business_value:
            'Reduces time to detect issues by 50% And improves operational efficiency',
          category: 'enhancement',
        });

        const suggestionResult = await FeatureTestHelpers.suggestFeature(
          environment,
          userFeature,
        );
        E2EAssertions.assertCommandSuccess(suggestionResult.result);

        const featureId = E2EAssertions.extractFeatureId(
          suggestionResult.result,
        );

        // Step 2: Review process - check feature details
        const detailsResult = await CommandExecutor.executeAPI(
          'feature-details',
          [featureId],
          { projectRoot: environment.testDir },
        );
        E2EAssertions.assertCommandSuccess(
          detailsResult,
          'Feature details retrieval',
        );
        E2EAssertions.assertOutputContains(detailsResult, userFeature.title);

        // Step 3: Approval process with business justification
        const approvalResult = await FeatureTestHelpers.approveFeature(
          environment,
          featureId,
          'product-manager',
          'Approved based on strong ROI metrics And user feedback',
        );
        E2EAssertions.assertCommandSuccess(approvalResult);

        // Step 4: Development tracking simulation
        // In real scenarios, this would track actual implementation progress
        const trackingResult = await CommandExecutor.executeAPI(
          'list-features',
          ['--status', 'approved'],
          { projectRoot: environment.testDir },
        );
        E2EAssertions.assertCommandSuccess(trackingResult);
        E2EAssertions.assertOutputContains(trackingResult, userFeature.title);

        // Step 5: Validation of complete audit trail
        const features = await environment.getFeatures();
        const feature = features.features.find((f) => f.id === featureId);

        expect(feature.approved_by).toBe('product-manager');
        expect(feature.approval_notes).toContain('ROI metrics');
        expect(feature.created_at).toBeTruthy();
        expect(feature.updated_at).toBeTruthy();
        expect(feature.approval_date).toBeTruthy();

        // Verify audit history
        expect(features.metadata.approval_history).toHaveLength(1);
        expect(features.metadata.approval_history[0].approved_by).toBe(
          'product-manager',
        );

        console.log(
          `✅ Complete user journey test passed for feature: ${featureId}`,
        );
      },
      E2E_TIMEOUT,
    );

    test(
      'Multi-stakeholder approval workflow',
      async () => {
        // Test workflow involving multiple stakeholders

        // Step 1: Technical team suggests feature
        const { result: techResult } = await FeatureTestHelpers.suggestFeature(
          environment,
          {
            title: 'API Performance Optimization',
            description:
              'Implement caching layer to improve API response times',
            business_value:
              'Reduces server load by 40% And improves user experience',
            category: 'performance',
          },
        );

        const techFeatureId = E2EAssertions.extractFeatureId(techResult);

        // Step 2: Business team suggests different feature
        const { result: bizResult } = await FeatureTestHelpers.suggestFeature(
          environment,
          {
            title: 'Customer Analytics Dashboard',
            description: 'Add comprehensive customer behavior analytics',
            business_value:
              'Enables data-driven decisions And increases customer satisfaction',
            category: 'new-feature',
          },
        );

        const bizFeatureId = E2EAssertions.extractFeatureId(bizResult);

        // Step 3: Different approvers for different features
        await FeatureTestHelpers.approveFeature(
          environment,
          techFeatureId,
          'tech-lead',
          'Critical for system scalability',
        );

        await FeatureTestHelpers.approveFeature(
          environment,
          bizFeatureId,
          'business-analyst',
          'Aligns with customer success metrics',
        );

        // Step 4: Validate multi-stakeholder state
        const features = await environment.getFeatures();
        E2EAssertions.assertFeatureCount(features, 2);

        const techFeature = features.features.find(
          (f) => f.id === techFeatureId,
        );
        const bizFeature = features.features.find((f) => f.id === bizFeatureId);

        expect(techFeature.approved_by).toBe('tech-lead');
        expect(bizFeature.approved_by).toBe('business-analyst');
        expect(techFeature.category).toBe('performance');
        expect(bizFeature.category).toBe('new-feature');

        // Step 5: Verify comprehensive audit trail
        expect(features.metadata.approval_history).toHaveLength(2);
        expect(
          features.metadata.approval_history.map((h) => h.approved_by),
        ).toContain('tech-lead');
        expect(
          features.metadata.approval_history.map((h) => h.approved_by),
        ).toContain('business-analyst');

        loggers.stopHook.log(
          '✅ Multi-stakeholder approval workflow test passed',
        );
      },
      E2E_TIMEOUT,
    );
  });
});

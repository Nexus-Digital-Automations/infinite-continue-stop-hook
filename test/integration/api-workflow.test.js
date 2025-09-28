/**
 * API Workflow Integration Tests
 *
 * Comprehensive integration tests for the complete taskmanager API workflow including:
 * - Feature lifecycle management (suggest → approve → implement)
 * - Agent lifecycle management (initialize → work → stop authorization)
 * - API endpoint integration And data flow
 * - End-to-end workflow validation
 * - Cross-component integration testing
 *
 * @author Integration Testing Agent
 * @version 1.0.0
 */

const FS = require('path');
const {
  execAPI,
  createTestEnvironment,
  cleanupTestEnvironment,
  readFeaturesFile,
  generateTestFeature,
  _generateTestAgentConfig,
  validateFeaturesStructure,
  setupGlobalCleanup,
  teardownGlobalCleanup,
  _delay,
} = require('./test-utils');

describe('API Workflow Integration Tests', () => {
  let testDir;

  beforeAll(async () => {
    await setupGlobalCleanup();
  });

  afterAll(async () => {
    await teardownGlobalCleanup();
  });

  beforeEach(async () => {
    testDir = await createTestEnvironment('api-workflow');
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testDir);
  });

  // ========================================
  // COMPLETE FEATURE LIFECYCLE WORKFLOW
  // ========================================

  describe('Complete Feature Lifecycle Workflow', () => {
    test('should execute complete feature lifecycle: suggest → approve → track implementation', async () => {
      // 1. Test API discovery And documentation
      const guideResult = await execAPI('guide', [], { projectRoot: testDir });
      expect(guideResult.success).toBe(true);
      expect(guideResult.featureManager).toBeDefined();
      expect(guideResult.featureWorkflow).toBeDefined();

      // 2. Suggest a new feature
      const featureData = generateTestFeature({
        title: 'Complete Workflow Test Feature',
        description:
          'Feature to test the complete workflow from suggestion to implementation tracking',
        business_value:
          'Validates end-to-end feature management system integration',
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
      expect(suggestResult.feature).toBeDefined();
      expect(suggestResult.feature.id).toBeDefined();
      expect(suggestResult.feature.status).toBe('suggested');

      const featureId = suggestResult.feature.id;

      // 3. Verify feature appears in list
      const listResult = await execAPI('list-features', [], {
        projectRoot: testDir,
      });
      expect(listResult.success).toBe(true);
      expect(listResult.features).toHaveLength(1);
      expect(listResult.features[0].id).toBe(featureId);
      expect(listResult.features[0].status).toBe('suggested');

      // 4. Get feature statistics
      const statsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total).toBe(1);
      expect(statsResult.stats.by_status.suggested).toBe(1);

      // 5. Approve the feature
      const approvalData = {
        approved_by: 'integration-test',
        notes: 'Approved for workflow integration testing',
      };

      const approveResult = await execAPI(
        'approve-feature',
        [featureId, JSON.stringify(approvalData)],
        { projectRoot: testDir },
      );

      expect(approveResult.success).toBe(true);
      expect(approveResult.feature.status).toBe('approved');
      expect(approveResult.feature.approved_by).toBe('integration-test');
      expect(approveResult.feature.approval_notes).toBe(
        'Approved for workflow integration testing',
      );

      // 6. Verify approval is reflected in statistics
      const updatedStatsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(updatedStatsResult.success).toBe(true);
      expect(updatedStatsResult.stats.total).toBe(1);
      expect(updatedStatsResult.stats.by_status.approved).toBe(1);
      expect(updatedStatsResult.stats.by_status.suggested || 0).toBe(0);

      // 7. Verify approval history is recorded
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.metadata.approval_history).toHaveLength(1);
      expect(featuresData.metadata.approval_history[0].feature_id).toBe(
        featureId,
      );
      expect(featuresData.metadata.approval_history[0].action).toBe('approved');
      expect(featuresData.metadata.approval_history[0].approved_by).toBe(
        'integration-test',
      );

      // 8. Test filtering by status
      const approvedFeaturesResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'approved' })],
        { projectRoot: testDir },
      );

      expect(approvedFeaturesResult.success).toBe(true);
      expect(approvedFeaturesResult.features).toHaveLength(1);
      expect(approvedFeaturesResult.features[0].id).toBe(featureId);
      expect(approvedFeaturesResult.features[0].status).toBe('approved');
    });

    test('should handle feature rejection workflow', async () => {
      // 1. Suggest a feature to reject
      const featureData = generateTestFeature({
        title: 'Feature to Reject',
        description: 'Feature That will be rejected for testing purposes',
        business_value: 'Tests rejection workflow',
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
      const featureId = suggestResult.feature.id;

      // 2. Reject the feature
      const rejectionData = {
        rejected_by: 'integration-test',
        reason: 'Not aligned with current testing priorities',
      };

      const rejectResult = await execAPI(
        'reject-feature',
        [featureId, JSON.stringify(rejectionData)],
        { projectRoot: testDir },
      );

      expect(rejectResult.success).toBe(true);
      expect(rejectResult.feature.status).toBe('rejected');
      expect(rejectResult.feature.rejected_by).toBe('integration-test');
      expect(rejectResult.feature.rejection_reason).toBe(
        'Not aligned with current testing priorities',
      );

      // 3. Verify rejection is recorded in approval history
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.metadata.approval_history).toHaveLength(1);
      expect(featuresData.metadata.approval_history[0].action).toBe('rejected');
      expect(featuresData.metadata.approval_history[0].reason).toBe(
        'Not aligned with current testing priorities',
      );

      // 4. Verify statistics reflect rejection
      const statsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.by_status.rejected).toBe(1);
    });

    test('should handle bulk feature approval workflow', async () => {
      // 1. Create multiple features for bulk approval
      const features = [
        generateTestFeature({
          title: 'Bulk Feature 1',
          category: 'enhancement',
        }),
        generateTestFeature({ title: 'Bulk Feature 2', category: 'bug-fix' }),
        generateTestFeature({
          title: 'Bulk Feature 3',
          category: 'performance',
        }),
      ];

      const suggestPromises = features.map((featureData) =>
        execAPI('suggest-feature', [JSON.stringify(featureData)], {
          projectRoot: testDir,
        }),
      );

      const suggestResults = await Promise.all(suggestPromises);

      // Verify all suggestions succeeded
      expect(suggestResults.every((result) => result.success)).toBe(true);

      const featureIds = suggestResults.map((result) => result.feature.id);

      // 2. Bulk approve all features
      const bulkApprovalData = {
        approved_by: 'bulk-integration-test',
        notes: 'Bulk approval for integration testing',
      };

      const bulkApproveResult = await execAPI(
        'bulk-approve-features',
        [JSON.stringify(featureIds), JSON.stringify(bulkApprovalData)],
        { projectRoot: testDir },
      );

      expect(bulkApproveResult.success).toBe(true);
      expect(bulkApproveResult.approved_count).toBe(3);
      expect(bulkApproveResult.error_count).toBe(0);
      expect(bulkApproveResult.approved_features).toHaveLength(3);

      // 3. Verify all features are approved
      const listResult = await execAPI(
        'list-features',
        [JSON.stringify({ status: 'approved' })],
        { projectRoot: testDir },
      );

      expect(listResult.success).toBe(true);
      expect(listResult.features).toHaveLength(3);
      expect(listResult.features.every((f) => f.status === 'approved')).toBe(
        true,
      );

      // 4. Verify approval history contains all approvals
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.metadata.approval_history).toHaveLength(3);
      expect(
        featuresData.metadata.approval_history.every(
          (h) => h.action === 'approved',
        ),
      ).toBe(true);
    });
  });

  // ========================================
  // COMPLETE AGENT LIFECYCLE WORKFLOW
  // ========================================

  describe('Complete Agent Lifecycle Workflow', () => {
    test('should execute complete agent lifecycle: initialize → reinitialize → stop authorization', async () => {
      // 1. Initialize agent
      const agentId = 'integration-test-agent-001';
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });

      expect(initResult.success).toBe(true);
      expect(initResult.agent.id).toBe(AGENT_ID);
      expect(initResult.agent.status).toBe('initialized');
      expect(initResult.agent.sessionId).toBeDefined();

      // 2. Verify agent is recorded in FEATURES.json
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.agents[agentId]).toBeDefined();
      expect(featuresData.agents[agentId].status).toBe('active');
      expect(featuresData.agents[agentId].sessionId).toBeDefined();

      // 3. Get initialization statistics
      const initStatsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(initStatsResult.success).toBe(true);
      expect(initStatsResult.stats.total_initializations).toBeGreaterThan(0);
      expect(
        initStatsResult.stats.today_totals.initializations,
      ).toBeGreaterThan(0);

      // 4. Reinitialize agent
      const reinitResult = await execAPI('reinitialize', [agentId], {
        projectRoot: testDir,
      });

      expect(reinitResult.success).toBe(true);
      expect(reinitResult.agent.id).toBe(AGENT_ID);
      expect(reinitResult.agent.status).toBe('reinitialized');
      expect(reinitResult.agent.sessionId).toBeDefined();
      expect(reinitResult.agent.previousSessions).toBeGreaterThan(0);

      // 5. Verify reinitialization is recorded
      const updatedFeaturesData = await readFeaturesFile(testDir);
      expect(updatedFeaturesData.agents[agentId].previousSessions).toHaveLength(
        1,
      );

      // 6. Check updated initialization statistics
      const updatedInitStatsResult = await execAPI(
        'get-initialization-stats',
        [],
        { projectRoot: testDir },
      );
      expect(updatedInitStatsResult.success).toBe(true);
      expect(
        updatedInitStatsResult.stats.total_reinitializations,
      ).toBeGreaterThan(0);
      expect(
        updatedInitStatsResult.stats.today_totals.reinitializations,
      ).toBeGreaterThan(0);

      // 7. Authorize stop
      const stopReason =
        'Integration test completed successfully - all tasks finished And project perfect';
      const authorizeStopResult = await execAPI(
        'authorize-stop',
        [agentId, stopReason],
        {
          projectRoot: testDir,
        },
      );

      expect(authorizeStopResult.success).toBe(true);
      expect(authorizeStopResult.authorization.authorized_by).toBe(AGENT_ID);
      expect(authorizeStopResult.authorization.reason).toBe(stopReason);
      expect(authorizeStopResult.authorization.stop_flag_created).toBe(true);

      // 8. Verify stop flag file was created
      const FS = require('fs').promises;
      const stopFlagPath = PATH.join(testDir, '.stop-allowed');
      const stopFlagExists = await fs
        .access(stopFlagPath)
        .then(() => true)
        .catch(() => false);
      expect(stopFlagExists).toBe(true);

      if (stopFlagExists) {
        const stopFlagData = JSON.parse(
          await FS.readFile(stopFlagPath, 'utf8'),
        );
        expect(stopFlagData.stop_allowed).toBe(true);
        expect(stopFlagData.authorized_by).toBe(AGENT_ID);
        expect(stopFlagData.reason).toBe(stopReason);
      }
    });

    test('should handle multiple concurrent agent operations', async () => {
      // 1. Initialize multiple agents concurrently
      const agentIds = ['agent-001', 'agent-002', 'agent-003'];
      const initPromises = agentIds.map((AGENT_ID) =>
        execAPI('initialize', [agentId], { projectRoot: testDir }),
      );

      const initResults = await Promise.all(initPromises);

      // Verify all initializations succeeded
      expect(initResults.every((result) => result.success)).toBe(true);
      initResults.forEach((result, index) => {
        expect(result.agent.id).toBe(agentIds[index]);
        expect(result.agent.status).toBe('initialized');
      });

      // 2. Verify all agents are recorded
      const featuresData = await readFeaturesFile(testDir);
      agentIds.forEach((AGENT_ID) => {
        expect(featuresData.agents[agentId]).toBeDefined();
        expect(featuresData.agents[agentId].status).toBe('active');
      });

      // 3. Reinitialize all agents concurrently
      const reinitPromises = agentIds.map((AGENT_ID) =>
        execAPI('reinitialize', [agentId], { projectRoot: testDir }),
      );

      const reinitResults = await Promise.all(reinitPromises);

      // Verify all reinitializations succeeded
      expect(reinitResults.every((result) => result.success)).toBe(true);
      reinitResults.forEach((result, index) => {
        expect(result.agent.id).toBe(agentIds[index]);
        expect(result.agent.status).toBe('reinitialized');
      });
    });
  });

  // ========================================
  // CROSS-COMPONENT INTEGRATION TESTS
  // ========================================

  describe('Cross-Component Integration', () => {
    test('should handle mixed feature And agent operations', async () => {
      // 1. Initialize agent
      const agentId = 'mixed-operations-agent';
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });
      expect(initResult.success).toBe(true);

      // 2. Create multiple features
      const featureData1 = generateTestFeature({
        title: 'Mixed Operation Feature 1',
        category: 'enhancement',
      });
      const featureData2 = generateTestFeature({
        title: 'Mixed Operation Feature 2',
        category: 'bug-fix',
      });

      const suggest1Result = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData1)],
        {
          projectRoot: testDir,
        },
      );
      const suggest2Result = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData2)],
        {
          projectRoot: testDir,
        },
      );

      expect(suggest1Result.success && suggest2Result.success).toBe(true);

      // 3. Approve one feature And reject another
      const approve1Result = await execAPI(
        'approve-feature',
        [
          suggest1Result.feature.id,
          JSON.stringify({
            approved_by: agentId,
            notes: 'Agent approved feature 1',
          }),
        ],
        { projectRoot: testDir },
      );

      const reject2Result = await execAPI(
        'reject-feature',
        [
          suggest2Result.feature.id,
          JSON.stringify({
            rejected_by: agentId,
            reason: 'Agent rejected feature 2',
          }),
        ],
        { projectRoot: testDir },
      );

      expect(approve1Result.success && reject2Result.success).toBe(true);

      // 4. Verify mixed operations are reflected in statistics
      const statsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total).toBe(2);
      expect(statsResult.stats.by_status.approved).toBe(1);
      expect(statsResult.stats.by_status.rejected).toBe(1);

      // 5. Verify file integrity
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);
      expect(featuresData.features).toHaveLength(2);
      expect(featuresData.agents[agentId]).toBeDefined();
      expect(featuresData.metadata.approval_history).toHaveLength(2);

      // 6. Reinitialize agent And verify everything still works
      const reinitResult = await execAPI('reinitialize', [agentId], {
        projectRoot: testDir,
      });
      expect(reinitResult.success).toBe(true);

      // 7. Create And approve another feature after reinitialization
      const featureData3 = generateTestFeature({
        title: 'Post-Reinit Feature',
        category: 'performance',
      });

      const suggest3Result = await execAPI(
        'suggest-feature',
        [JSON.stringify(featureData3)],
        {
          projectRoot: testDir,
        },
      );
      const approve3Result = await execAPI(
        'approve-feature',
        [
          suggest3Result.feature.id,
          JSON.stringify({
            approved_by: agentId,
            notes: 'Post-reinit approval',
          }),
        ],
        { projectRoot: testDir },
      );

      expect(suggest3Result.success && approve3Result.success).toBe(true);

      // 8. Final verification
      const finalStatsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(finalStatsResult.success).toBe(true);
      expect(finalStatsResult.stats.total).toBe(3);
      expect(finalStatsResult.stats.by_status.approved).toBe(2);
      expect(finalStatsResult.stats.by_status.rejected).toBe(1);
    });

    test('should maintain data consistency across multiple operations', async () => {
      // 1. Perform a series of operations
      const operations = [
        { type: 'init', agentId: 'consistency-agent-1' },
        {
          type: 'suggest',
          feature: generateTestFeature({ title: 'Consistency Feature 1' }),
        },
        { type: 'init', agentId: 'consistency-agent-2' },
        {
          type: 'suggest',
          feature: generateTestFeature({ title: 'Consistency Feature 2' }),
        },
        { type: 'approve', index: 0, agentId: 'consistency-agent-1' },
        {
          type: 'suggest',
          feature: generateTestFeature({ title: 'Consistency Feature 3' }),
        },
        { type: 'reject', index: 1, agentId: 'consistency-agent-2' },
        { type: 'approve', index: 2, agentId: 'consistency-agent-1' },
      ];

      const suggestedFeatures = [];
      const agents = [];

      for (const OPERATIONOF operations) {
        switch (_operationtype) {
          case 'init': {
            const initResult = await execAPI(
              'initialize',
              [_operationagentId],
              {
                projectRoot: testDir,
              },
            );
            expect(initResult.success).toBe(true);
            agents.push(_operationagentId);
            break;
          }

          case 'suggest': {
            const suggestResult = await execAPI(
              'suggest-feature',
              [JSON.stringify(_operationfeature)],
              { projectRoot: testDir },
            );
            expect(suggestResult.success).toBe(true);
            suggestedFeatures.push(suggestResult.feature.id);
            break;
          }

          case 'approve': {
            const approveResult = await execAPI(
              'approve-feature',
              [
                suggestedFeatures[_operationindex],
                JSON.stringify({ approved_by: _operationagentId }),
              ],
              { projectRoot: testDir },
            );
            expect(approveResult.success).toBe(true);
            break;
          }

          case 'reject': {
            const rejectResult = await execAPI(
              'reject-feature',
              [
                suggestedFeatures[_operationindex],
                JSON.stringify({
                  rejected_by: _operationagentId,
                  reason: 'Consistency test rejection',
                }),
              ],
              { projectRoot: testDir },
            );
            expect(rejectResult.success).toBe(true);
            break;
          }
        }

        // Verify data consistency after each operation
        const featuresData = await readFeaturesFile(testDir);
        validateFeaturesStructure(featuresData);
      }

      // 2. Final verification of data consistency
      const finalFeaturesData = await readFeaturesFile(testDir);

      // Verify agents
      expect(Object.keys(finalFeaturesData.agents)).toHaveLength(2);
      agents.forEach((AGENT_ID) => {
        expect(finalFeaturesData.agents[agentId]).toBeDefined();
      });

      // Verify features
      expect(finalFeaturesData.features).toHaveLength(3);

      // Verify approval history
      expect(finalFeaturesData.metadata.approval_history).toHaveLength(3); // 2 approvals + 1 rejection

      // Verify statistics match actual data
      const statsResult = await execAPI('feature-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total).toBe(3);
      expect(statsResult.stats.by_status.approved).toBe(2);
      expect(statsResult.stats.by_status.rejected).toBe(1);
    });
  });

  // ========================================
  // API DISCOVERY AND METHODS TESTING
  // ========================================

  describe('API Discovery And Methods', () => {
    test('should provide comprehensive API documentation', async () => {
      const guideResult = await execAPI('guide', [], { projectRoot: testDir });

      expect(guideResult.success).toBe(true);
      expect(guideResult.featureManager).toBeDefined();
      expect(guideResult.featureManager.version).toBe('3.0.0');
      expect(guideResult.featureWorkflow).toBeDefined();
      expect(guideResult.coreCommands).toBeDefined();
      expect(guideResult.workflows).toBeDefined();
      expect(guideResult.examples).toBeDefined();

      // Verify workflow information
      expect(guideResult.featureWorkflow.statuses).toBeDefined();
      expect(guideResult.featureWorkflow.transitions).toBeDefined();

      // Verify command documentation
      expect(guideResult.coreCommands.discovery).toBeDefined();
      expect(guideResult.coreCommands.featureManagement).toBeDefined();
      expect(guideResult.coreCommands.agentManagement).toBeDefined();

      // Verify examples
      expect(guideResult.examples.featureCreation).toBeDefined();
      expect(guideResult.examples.approvalWorkflow).toBeDefined();
    });

    test('should list all available API methods', async () => {
      const methodsResult = await execAPI('methods', [], {
        projectRoot: testDir,
      });

      expect(methodsResult.success).toBe(true);
      expect(methodsResult.cliMapping).toBeDefined();
      expect(methodsResult.availableCommands).toBeDefined();

      // Verify essential commands are listed
      const commands = methodsResult.availableCommands;
      expect(commands).toContain('suggest-feature');
      expect(commands).toContain('approve-feature');
      expect(commands).toContain('reject-feature');
      expect(commands).toContain('list-features');
      expect(commands).toContain('feature-stats');
      expect(commands).toContain('get-initialization-stats');
    });
  });

  // ========================================
  // ERROR HANDLING AND EDGE CASES
  // ========================================

  describe('API Error Handling', () => {
    test('should handle invalid command gracefully', async () => {
      try {
        await execAPI('invalid-command', [], { projectRoot: testDir });
        // Should not reach here
        expect(true).toBe(false);
      } catch {
        expect(error.message).toContain('Command failed');
      }
    });

    test('should handle malformed JSON in feature suggestion', async () => {
      const RESULT = await execAPI('suggest-feature', ['{ invalid json }'], {
        projectRoot: testDir,
      });

      expect(RESULT.success).toBe(false);
      expect(RESULT.error).toBeDefined();
    });

    test('should handle operations on non-existent features', async () => {
      const fakeFeatureId = 'feature_fake_12345_abc';

      const approveResult = await execAPI('approve-feature', [fakeFeatureId], {
        projectRoot: testDir,
      });
      expect(approveResult.success).toBe(false);
      expect(approveResult.error).toContain('not found');

      const rejectResult = await execAPI('reject-feature', [fakeFeatureId], {
        projectRoot: testDir,
      });
      expect(rejectResult.success).toBe(false);
      expect(rejectResult.error).toContain('not found');
    });

    test('should handle invalid status transitions', async () => {
      // 1. Create And approve a feature
      const featureData = generateTestFeature({
        title: 'Feature for Status Test',
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

      // 2. Try to approve an already approved feature
      const secondApproveResult = await execAPI(
        'approve-feature',
        [suggestResult.feature.id],
        {
          projectRoot: testDir,
        },
      );
      expect(secondApproveResult.success).toBe(false);
      expect(secondApproveResult.error).toContain(
        "must be in 'suggested' status",
      );

      // 3. Try to reject an already approved feature
      const rejectResult = await execAPI(
        'reject-feature',
        [suggestResult.feature.id],
        {
          projectRoot: testDir,
        },
      );
      expect(rejectResult.success).toBe(false);
      expect(rejectResult.error).toContain("must be in 'suggested' status");
    });
  });
});

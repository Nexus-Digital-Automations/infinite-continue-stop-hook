/**
 * Agent Lifecycle Integration Tests
 *
 * Comprehensive integration tests for complete agent lifecycle workflows including:
 * - Agent initialization And session management
 * - Agent reinitialization And session tracking
 * - Stop authorization And termination workflows
 * - Initialization statistics And time bucket tracking
 * - Multi-agent coordination And concurrency
 * - Agent state persistence And recovery
 * - Stop flag creation And validation
 * - Agent session history And audit trails
 *
 * @author Integration Testing Agent
 * @version 1.0.0
 */

const FS = require('fs').promises;
const PATH = require('path');
const {
  execAPI,
  createTestEnvironment,
  cleanupTestEnvironment,
  readFeaturesFile,
  _generateTestAgentConfig,
  validateFeaturesStructure,
  setupGlobalCleanup,
  teardownGlobalCleanup,
  _delay,
  execAPIConcurrently,
} = require('./test-utils');

describe('Agent Lifecycle Integration Tests', () => {
  let testDir;

  beforeAll(async () => {
    await setupGlobalCleanup();
  });

  afterAll(async () => {
    await teardownGlobalCleanup();
  });

  beforeEach(async () => {
    testDir = await createTestEnvironment('agent-lifecycle');
  });

  afterEach(async () => {
    await cleanupTestEnvironment(testDir);
  });

  // ========================================
  // AGENT INITIALIZATION WORKFLOW
  // ========================================

  describe('Agent Initialization Workflow', () => {
    test('should handle single agent initialization process', async () => {
      // 1. Initialize agent
      const AGENT_ID = 'test-agent-001';
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });

      expect(initResult.success).toBe(true);
      expect(initResult.agent.id).toBe(agentId);
      expect(initResult.agent.status).toBe('initialized');
      expect(initResult.agent.sessionId).toBeDefined();
      expect(initResult.agent.sessionId).toMatch(/^[a-f0-9]{16}$/);
      expect(initResult.agent.timestamp).toBeDefined();

      // 2. Verify agent is recorded in FEATURES.json
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.agents[agentId]).toBeDefined();
      expect(featuresData.agents[agentId].status).toBe('active');
      expect(featuresData.agents[agentId].sessionId).toBe(
        initResult.agent.sessionId,
      );
      expect(featuresData.agents[agentId].initialized).toBeDefined();
      expect(featuresData.agents[agentId].lastHeartbeat).toBeDefined();

      // 3. Verify initialization statistics
      const statsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total_initializations).toBeGreaterThan(0);
      expect(statsResult.stats.today_totals.initializations).toBeGreaterThan(0);
      expect(statsResult.stats.current_bucket).toBeDefined();

      // Verify time bucket structure
      const buckets = Object.keys(statsResult.stats.time_buckets);
      expect(buckets).toEqual([
        '07:00-11:59',
        '12:00-16:59',
        '17:00-21:59',
        '22:00-02:59',
        '03:00-06:59',
      ]);

      // At least one bucket should have initialization count > 0
      const bucketValues = Object.values(statsResult.stats.time_buckets);
      const totalInits = bucketValues.reduce(
        (sum, bucket) => sum + bucket.initializations,
        0,
      );
      expect(totalInits).toBeGreaterThan(0);
    });

    test('should handle multiple agent initialization', async () => {
      // 1. Initialize multiple agents
      const agentIds = [
        'multi-agent-001',
        'multi-agent-002',
        'multi-agent-003',
        'multi-agent-004',
        'multi-agent-005',
      ];

      const initResults = [];
      for (const agentId of agentIds) {
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test data setup with ordered agent initialization
        const result = await execAPI('initialize', [agentId], {
          projectRoot: testDir,
        });
        expect(result.success).toBe(true);
        initResults.push(result);
      }

      // 2. Verify all agents have unique session IDs
      const sessionIds = initResults.map((result) => result.agent.sessionId);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(agentIds.length);

      // 3. Verify all agents are recorded
      const featuresData = await readFeaturesFile(testDir);
      agentIds.forEach((agentId) => {
        expect(featuresData.agents[agentId]).toBeDefined();
        expect(featuresData.agents[agentId].status).toBe('active');
      });

      // 4. Verify initialization statistics reflect multiple agents
      const statsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total_initializations).toBeGreaterThanOrEqual(
        agentIds.length,
      );
    });

    test('should handle concurrent agent initialization', async () => {
      // 1. Create multiple agents concurrently
      const agentIds = Array.from(
        { length: 10 },
        (_, i) => `concurrent-agent-${i + 1}`,
      );

      const concurrentCommands = agentIds.map((agentId) => ({
        command: 'initialize',
        args: [agentId],
        options: { projectRoot: testDir },
      }));

      const results = await execAPIConcurrently(concurrentCommands);

      // 2. Verify all initializations succeeded
      expect(results.every((result) => result.success)).toBe(true);

      // 3. Verify all agents have unique session IDs
      const sessionIds = results.map((result) => result.agent.sessionId);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(agentIds.length);

      // 4. Verify file integrity after concurrent operations
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);

      agentIds.forEach((agentId) => {
        expect(featuresData.agents[agentId]).toBeDefined();
        expect(featuresData.agents[agentId].status).toBe('active');
      });

      // 5. Verify statistics accuracy
      const statsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total_initializations).toBeGreaterThanOrEqual(
        agentIds.length,
      );
    });

    test('should prevent duplicate agent initialization', async () => {
      // 1. Initialize an agent
      const AGENT_ID = 'duplicate-test-agent';
      const firstInitResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });
      expect(firstInitResult.success).toBe(true);

      const firstSessionId = firstInitResult.agent.sessionId;

      // 2. Try to initialize the same agent again
      const secondInitResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });
      expect(secondInitResult.success).toBe(true);

      // Should create a new session (reinitialization behavior)
      const secondSessionId = secondInitResult.agent.sessionId;
      expect(secondSessionId).not.toBe(firstSessionId);

      // 3. Verify agent state
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.agents[agentId]).toBeDefined();
      expect(featuresData.agents[agentId].sessionId).toBe(secondSessionId);
    });
  });

  // ========================================
  // AGENT REINITIALIZATION WORKFLOW
  // ========================================

  describe('Agent Reinitialization Workflow', () => {
    test('should handle agent reinitialization process', async () => {
      // 1. Initialize agent first
      const AGENT_ID = 'reinit-test-agent';
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });
      expect(initResult.success).toBe(true);

      const originalSessionId = initResult.agent.sessionId;

      // 2. Reinitialize agent
      const reinitResult = await execAPI('reinitialize', [agentId], {
        projectRoot: testDir,
      });

      expect(reinitResult.success).toBe(true);
      expect(reinitResult.agent.id).toBe(agentId);
      expect(reinitResult.agent.status).toBe('reinitialized');
      expect(reinitResult.agent.sessionId).toBeDefined();
      expect(reinitResult.agent.sessionId).not.toBe(originalSessionId);
      expect(reinitResult.agent.previousSessions).toBe(1);

      // 3. Verify agent state in file
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.agents[agentId]).toBeDefined();
      expect(featuresData.agents[agentId].sessionId).toBe(
        reinitResult.agent.sessionId,
      );
      expect(featuresData.agents[agentId].previousSessions).toHaveLength(1);
      expect(featuresData.agents[agentId].previousSessions[0]).toBe(
        originalSessionId,
      );
      expect(featuresData.agents[agentId].reinitialized).toBeDefined();

      // 4. Verify reinitialization statistics
      const statsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total_reinitializations).toBeGreaterThan(0);
      expect(statsResult.stats.today_totals.reinitializations).toBeGreaterThan(
        0,
      );

      // Check That reinitialization is tracked in time buckets
      const bucketValues = Object.values(statsResult.stats.time_buckets);
      const totalReinits = bucketValues.reduce(
        (sum, bucket) => sum + bucket.reinitializations,
        0,
      );
      expect(totalReinits).toBeGreaterThan(0);
    });

    test('should handle multiple reinitializations of same agent', async () => {
      // 1. Initialize agent
      const AGENT_ID = 'multi-reinit-agent';
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });
      expect(initResult.success).toBe(true);

      const sessionIds = [initResult.agent.sessionId];

      // 2. Perform multiple reinitializations
      const reinitCount = 5;
      for (let i = 0; i < reinitCount; i++) {
        // eslint-disable-next-line no-await-in-loop -- Sequential processing required for testing reinitializations over time
        const reinitResult = await execAPI('reinitialize', [agentId], {
          projectRoot: testDir,
        });
        expect(reinitResult.success).toBe(true);
        sessionIds.push(reinitResult.agent.sessionId);
      }

      // 3. Verify all session IDs are unique
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(sessionIds.length);

      // 4. Verify final agent state
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.agents[agentId].previousSessions).toHaveLength(
        reinitCount,
      );
      expect(featuresData.agents[agentId].previousSessions).toEqual(
        sessionIds.slice(0, -1),
      );

      // 5. Verify statistics
      const statsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total_reinitializations).toBeGreaterThanOrEqual(
        reinitCount,
      );
    });

    test('should handle reinitialization of non-existent agent', async () => {
      // 1. Try to reinitialize agent That doesn't exist
      const AGENT_ID = 'non-existent-agent';
      const reinitResult = await execAPI('reinitialize', [agentId], {
        projectRoot: testDir,
      });

      // Should succeed (creates new agent)
      expect(reinitResult.success).toBe(true);
      expect(reinitResult.agent.id).toBe(agentId);
      expect(reinitResult.agent.status).toBe('reinitialized');

      // 2. Verify agent is created
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.agents[agentId]).toBeDefined();
    });

    test('should handle concurrent reinitializations', async () => {
      // 1. Initialize multiple agents
      const agentIds = [
        'concurrent-reinit-1',
        'concurrent-reinit-2',
        'concurrent-reinit-3',
      ];

      for (const agentId of agentIds) {
        const initResult = await execAPI('initialize', [agentId], {
          projectRoot: testDir,
        });
        expect(initResult.success).toBe(true);
      }

      // 2. Reinitialize all agents concurrently
      const reinitCommands = agentIds.map((agentId) => ({
        command: 'reinitialize',
        args: [agentId],
        options: { projectRoot: testDir },
      }));

      const reinitResults = await execAPIConcurrently(reinitCommands);

      // 3. Verify all reinitializations succeeded
      expect(reinitResults.every((result) => result.success)).toBe(true);

      // 4. Verify unique session IDs
      const sessionIds = reinitResults.map((result) => result.agent.sessionId);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(agentIds.length);

      // 5. Verify file integrity
      const featuresData = await readFeaturesFile(testDir);
      validateFeaturesStructure(featuresData);

      agentIds.forEach((agentId) => {
        expect(featuresData.agents[agentId]).toBeDefined();
        expect(featuresData.agents[agentId].previousSessions).toHaveLength(1);
      });
    });
  });

  // ========================================
  // STOP AUTHORIZATION WORKFLOW
  // ========================================

  describe('Stop Authorization Workflow', () => {
    test('should handle agent stop authorization process', async () => {
      // 1. Initialize agent
      const AGENT_ID = 'stop-auth-agent';
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });
      expect(initResult.success).toBe(true);

      // 2. Authorize stop
      const stopReason =
        'Integration test completed - all tasks finished And project perfect';
      const stopResult = await execAPI(
        'authorize-stop',
        [agentId, stopReason],
        {
          projectRoot: testDir,
        },
      );

      expect(stopResult.success).toBe(true);
      expect(stopResult.authorization.authorized_by).toBe(agentId);
      expect(stopResult.authorization.reason).toBe(stopReason);
      expect(stopResult.authorization.timestamp).toBeDefined();
      expect(stopResult.authorization.stop_flag_created).toBe(true);

      // 3. Verify stop flag file creation
      const stopFlagPath = path.join(testDir, '.stop-allowed');
      const stopFlagExists = await fs
        .access(stopFlagPath)
        .then(() => true)
        .catch(() => false);
      expect(stopFlagExists).toBe(true);

      // 4. Verify stop flag content
      const stopFlagContent = await fs.readFile(stopFlagPath, 'utf8');
      const stopFlagData = JSON.parse(stopFlagContent);

      expect(stopFlagData.stop_allowed).toBe(true);
      expect(stopFlagData.authorized_by).toBe(agentId);
      expect(stopFlagData.reason).toBe(stopReason);
      expect(stopFlagData.timestamp).toBeDefined();
      expect(stopFlagData.session_type).toBe('self_authorized');
    });

    test('should handle stop authorization with different reasons', async () => {
      // 1. Test multiple stop authorizations with different reasons
      const testCases = [
        {
          agentId: 'stop-agent-1',
          reason: 'All TodoWrite tasks completed successfully',
        },
        {
          agentId: 'stop-agent-2',
          reason: 'Project achieved perfection: linter✅ build✅ tests✅',
        },
        {
          agentId: 'stop-agent-3',
          reason: 'Emergency stop requested by user',
        },
      ];

      for (const testCase of testCases) {
        // Initialize agent
        const initResult = await execAPI('initialize', [testCase.agentId], {
          projectRoot: testDir,
        });
        expect(initResult.success).toBe(true);

        // Authorize stop
        const stopResult = await execAPI(
          'authorize-stop',
          [testCase.agentId, testCase.reason],
          {
            projectRoot: testDir,
          },
        );

        expect(stopResult.success).toBe(true);
        expect(stopResult.authorization.reason).toBe(testCase.reason);

        // Verify stop flag (each authorization overwrites the previous one)
        const stopFlagPath = path.join(testDir, '.stop-allowed');
        const stopFlagContent = await fs.readFile(stopFlagPath, 'utf8');
        const stopFlagData = JSON.parse(stopFlagContent);

        expect(stopFlagData.authorized_by).toBe(testCase.agentId);
        expect(stopFlagData.reason).toBe(testCase.reason);
      }
    });

    test('should handle stop authorization without reason', async () => {
      // 1. Initialize agent
      const AGENT_ID = 'no-reason-agent';
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });
      expect(initResult.success).toBe(true);

      // 2. Authorize stop without reason
      const stopResult = await execAPI('authorize-stop', [agentId], {
        projectRoot: testDir,
      });

      expect(stopResult.success).toBe(true);
      expect(stopResult.authorization.authorized_by).toBe(agentId);
      expect(stopResult.authorization.reason).toBeDefined();
      expect(stopResult.authorization.reason).toContain('completing all tasks');

      // 3. Verify default reason in stop flag
      const stopFlagPath = path.join(testDir, '.stop-allowed');
      const stopFlagContent = await fs.readFile(stopFlagPath, 'utf8');
      const stopFlagData = JSON.parse(stopFlagContent);

      expect(stopFlagData.reason).toContain('completing all tasks');
    });

    test('should handle stop authorization by non-existent agent', async () => {
      // 1. Try to authorize stop with non-existent agent
      const AGENT_ID = 'non-existent-stop-agent';
      const stopReason = 'Testing stop authorization by non-existent agent';

      const stopResult = await execAPI(
        'authorize-stop',
        [agentId, stopReason],
        {
          projectRoot: testDir,
        },
      );

      // Should succeed (doesn't require agent to exist first)
      expect(stopResult.success).toBe(true);
      expect(stopResult.authorization.authorized_by).toBe(agentId);

      // 2. Verify stop flag creation
      const stopFlagPath = path.join(testDir, '.stop-allowed');
      const stopFlagExists = await fs
        .access(stopFlagPath)
        .then(() => true)
        .catch(() => false);
      expect(stopFlagExists).toBe(true);
    });

    test('should handle multiple stop authorizations', async () => {
      // 1. Initialize multiple agents
      const agentIds = ['multi-stop-1', 'multi-stop-2', 'multi-stop-3'];

      for (const agentId of agentIds) {
        const initResult = await execAPI('initialize', [agentId], {
          projectRoot: testDir,
        });
        expect(initResult.success).toBe(true);
      }

      // 2. Each agent authorizes stop (last one wins)
      for (const agentId of agentIds) {
        const stopResult = await execAPI(
          'authorize-stop',
          [agentId, `Stop authorized by ${agentId}`],
          { projectRoot: testDir },
        );

        expect(stopResult.success).toBe(true);
      }

      // 3. Verify final stop flag reflects last authorization
      const stopFlagPath = path.join(testDir, '.stop-allowed');
      const stopFlagContent = await fs.readFile(stopFlagPath, 'utf8');
      const stopFlagData = JSON.parse(stopFlagContent);

      expect(stopFlagData.authorized_by).toBe(agentIds[agentIds.length - 1]);
      expect(stopFlagData.reason).toBe(
        `Stop authorized by ${agentIds[agentIds.length - 1]}`,
      );
    });
  });

  // ========================================
  // INITIALIZATION STATISTICS TRACKING
  // ========================================

  describe('Initialization Statistics Tracking', () => {
    test('should track initialization statistics accurately', async () => {
      // 1. Get initial stats
      const initialStatsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(initialStatsResult.success).toBe(true);

      const initialStats = initialStatsResult.stats;
      const initialInits = initialStats.total_initializations;
      const initialReinits = initialStats.total_reinitializations;

      // 2. Perform various agent operations
      const AGENT_ID = 'stats-test-agent';

      // Initialize
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });
      expect(initResult.success).toBe(true);

      // Reinitialize multiple times
      for (let i = 0; i < 3; i++) {
        const reinitResult = await execAPI('reinitialize', [agentId], {
          projectRoot: testDir,
        });
        expect(reinitResult.success).toBe(true);
      }

      // 3. Get updated stats
      const updatedStatsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(updatedStatsResult.success).toBe(true);

      const updatedStats = updatedStatsResult.stats;

      // 4. Verify statistics updates
      expect(updatedStats.total_initializations).toBe(initialInits + 1);
      expect(updatedStats.total_reinitializations).toBe(initialReinits + 3);

      // 5. Verify time bucket tracking
      expect(updatedStats.current_bucket).toBeDefined();
      expect(updatedStats.time_buckets).toBeDefined();

      const buckets = Object.keys(updatedStats.time_buckets);
      expect(buckets).toHaveLength(5);

      // At least one bucket should have counts > 0
      const bucketValues = Object.values(updatedStats.time_buckets);
      const totalBucketInits = bucketValues.reduce(
        (sum, bucket) => sum + bucket.initializations,
        0,
      );
      const totalBucketReinits = bucketValues.reduce(
        (sum, bucket) => sum + bucket.reinitializations,
        0,
      );

      expect(totalBucketInits).toBeGreaterThan(0);
      expect(totalBucketReinits).toBeGreaterThan(0);

      // 6. Verify today's totals
      expect(updatedStats.today_totals.initializations).toBeGreaterThan(0);
      expect(updatedStats.today_totals.reinitializations).toBeGreaterThan(0);
      expect(updatedStats.today_totals.combined).toBe(
        updatedStats.today_totals.initializations +
          updatedStats.today_totals.reinitializations,
      );
    });

    test('should maintain statistics persistence across operations', async () => {
      // 1. Perform initial operations
      const agents = ['persist-agent-1', 'persist-agent-2'];

      for (const agentId of agents) {
        await execAPI('initialize', [agentId], { projectRoot: testDir });
        await execAPI('reinitialize', [agentId], { projectRoot: testDir });
      }

      // 2. Get stats after operations
      const statsResult1 = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult1.success).toBe(true);

      // 3. Perform more operations
      await execAPI('initialize', ['persist-agent-3'], {
        projectRoot: testDir,
      });

      // 4. Get stats again
      const statsResult2 = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult2.success).toBe(true);

      // 5. Verify cumulative tracking
      expect(statsResult2.stats.total_initializations).toBeGreaterThan(
        statsResult1.stats.total_initializations,
      );
      expect(statsResult2.stats.total_reinitializations).toBeGreaterThanOrEqual(
        statsResult1.stats.total_reinitializations,
      );

      // 6. Verify file persistence
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.metadata.initialization_stats).toBeDefined();
      expect(
        featuresData.metadata.initialization_stats.total_initializations,
      ).toBe(statsResult2.stats.total_initializations);
      expect(
        featuresData.metadata.initialization_stats.total_reinitializations,
      ).toBe(statsResult2.stats.total_reinitializations);
    });

    test('should handle time bucket boundaries correctly', async () => {
      // 1. Get current stats to understand time bucket
      const statsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);

      const currentBucket = statsResult.stats.current_bucket;
      expect(currentBucket).toBeDefined();

      // 2. Verify bucket is one of the expected values
      const expectedBuckets = [
        '07:00-11:59',
        '12:00-16:59',
        '17:00-21:59',
        '22:00-02:59',
        '03:00-06:59',
      ];
      expect(expectedBuckets).toContain(currentBucket);

      // 3. Perform _operationAnd verify it's tracked in correct bucket
      await execAPI('initialize', ['bucket-test-agent'], {
        projectRoot: testDir,
      });

      const updatedStatsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(updatedStatsResult.success).toBe(true);

      const bucketData = updatedStatsResult.stats.time_buckets[currentBucket];
      expect(bucketData.initializations).toBeGreaterThan(0);
    });
  });

  // ========================================
  // COMPLETE AGENT LIFECYCLE SCENARIOS
  // ========================================

  describe('Complete Agent Lifecycle Scenarios', () => {
    test('should handle complete agent workflow from initialization to stop', async () => {
      // 1. Initialize agent
      const AGENT_ID = 'complete-lifecycle-agent';
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });

      expect(initResult.success).toBe(true);
      expect(initResult.agent.status).toBe('initialized');

      // 2. Verify initial state
      let featuresData = await readFeaturesFile(testDir);
      expect(featuresData.agents[agentId].status).toBe('active');
      expect(featuresData.agents[agentId].initialized).toBeDefined();

      // 3. Reinitialize agent (simulating restart)
      const reinitResult = await execAPI('reinitialize', [agentId], {
        projectRoot: testDir,
      });

      expect(reinitResult.success).toBe(true);
      expect(reinitResult.agent.status).toBe('reinitialized');
      expect(reinitResult.agent.previousSessions).toBe(1);

      // 4. Verify reinitialization state
      featuresData = await readFeaturesFile(testDir);
      expect(featuresData.agents[agentId].previousSessions).toHaveLength(1);
      expect(featuresData.agents[agentId].reinitialized).toBeDefined();

      // 5. Authorize stop (simulating task completion)
      const stopReason =
        'Complete lifecycle test finished - all objectives achieved';
      const stopResult = await execAPI(
        'authorize-stop',
        [agentId, stopReason],
        {
          projectRoot: testDir,
        },
      );

      expect(stopResult.success).toBe(true);
      expect(stopResult.authorization.stop_flag_created).toBe(true);

      // 6. Verify stop flag
      const stopFlagPath = path.join(testDir, '.stop-allowed');
      const stopFlagExists = await fs
        .access(stopFlagPath)
        .then(() => true)
        .catch(() => false);
      expect(stopFlagExists).toBe(true);

      const stopFlagContent = await fs.readFile(stopFlagPath, 'utf8');
      const stopFlagData = JSON.parse(stopFlagContent);
      expect(stopFlagData.authorized_by).toBe(agentId);
      expect(stopFlagData.reason).toBe(stopReason);

      // 7. Verify final statistics
      const finalStatsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(finalStatsResult.success).toBe(true);
      expect(finalStatsResult.stats.total_initializations).toBeGreaterThan(0);
      expect(finalStatsResult.stats.total_reinitializations).toBeGreaterThan(0);
    });

    test('should handle multi-agent collaborative workflow', async () => {
      // 1. Initialize team of agents
      const agentTeam = [
        'lead-agent',
        'dev-agent-frontend',
        'dev-agent-backend',
        'test-agent',
        'docs-agent',
      ];

      const initResults = [];
      for (const agentId of agentTeam) {
        const result = await execAPI('initialize', [agentId], {
          projectRoot: testDir,
        });
        expect(result.success).toBe(true);
        initResults.push(result);
      }

      // 2. Simulate collaborative work with reinitializations
      for (const agentId of agentTeam.slice(1, 4)) {
        // Some agents reinitialize during work
        const reinitResult = await execAPI('reinitialize', [agentId], {
          projectRoot: testDir,
        });
        expect(reinitResult.success).toBe(true);
      }

      // 3. Verify all agents are tracked
      const featuresData = await readFeaturesFile(testDir);
      agentTeam.forEach((agentId) => {
        expect(featuresData.agents[agentId]).toBeDefined();
        expect(featuresData.agents[agentId].status).toBe('active');
      });

      // 4. Lead agent authorizes stop after team completion
      const stopResult = await execAPI(
        'authorize-stop',
        [
          'lead-agent',
          'Team collaboration completed - all agents finished their tasks successfully',
        ],
        { projectRoot: testDir },
      );

      expect(stopResult.success).toBe(true);

      // 5. Verify statistics reflect team activity
      const statsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total_initializations).toBeGreaterThanOrEqual(
        agentTeam.length,
      );
      expect(statsResult.stats.total_reinitializations).toBeGreaterThanOrEqual(
        3,
      );

      // 6. Verify file integrity after complex operations
      validateFeaturesStructure(featuresData);
    });

    test('should handle agent workflow error recovery', async () => {
      // 1. Initialize agent
      const AGENT_ID = 'error-recovery-agent';
      const initResult = await execAPI('initialize', [agentId], {
        projectRoot: testDir,
      });
      expect(initResult.success).toBe(true);

      // 2. Simulate multiple reinitializations (recovery scenarios)
      const recoveryCount = 7;
      for (let i = 0; i < recoveryCount; i++) {
        const reinitResult = await execAPI('reinitialize', [agentId], {
          projectRoot: testDir,
        });
        expect(reinitResult.success).toBe(true);
      }

      // 3. Verify recovery state
      const featuresData = await readFeaturesFile(testDir);
      expect(featuresData.agents[agentId].previousSessions).toHaveLength(
        recoveryCount,
      );

      // 4. Final authorization after recovery
      const stopResult = await execAPI(
        'authorize-stop',
        [agentId, 'Recovery testing completed - system resilience validated'],
        { projectRoot: testDir },
      );

      expect(stopResult.success).toBe(true);

      // 5. Verify statistics include recovery operations
      const statsResult = await execAPI('get-initialization-stats', [], {
        projectRoot: testDir,
      });
      expect(statsResult.success).toBe(true);
      expect(statsResult.stats.total_reinitializations).toBeGreaterThanOrEqual(
        recoveryCount,
      );
    });
  });
});

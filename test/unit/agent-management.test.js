/**
 * Agent Management Unit Tests
 *
 * Comprehensive testing of agent management operations including:
 * - Agent initialization and session management
 * - Agent reinitialization with session preservation
 * - Stop authorization workflow and flag management
 * - Agent state tracking and metadata handling
 * - Error handling for agent operations
 * - Session ID generation and validation
 *
 * This test suite focuses specifically on the agent management aspects
 * of the FeatureManagerAPI with detailed lifecycle testing.
 */

const path = require('path');
const crypto = require('crypto');
const { MockFileSystem, TEST_FIXTURES, TimeTestUtils, testHelpers } = require('./test-utilities');

// Import the FeatureManagerAPI class
const FeatureManagerAPI = require('../../taskmanager-api.js');

describe('Agent Management', () => {
  let api;
  let mockFs;
  let timeUtils;
  let originalFs;

  const TEST_PROJECT_ROOT = '/test/agent-project';
  const TEST_FEATURES_PATH = path.join(TEST_PROJECT_ROOT, 'FEATURES.json');
  const TEST_STOP_FLAG_PATH = path.join(TEST_PROJECT_ROOT, '.stop-allowed');

  beforeEach(() => {
    api = new FeatureManagerAPI();
    mockFs = new MockFileSystem();
    timeUtils = new TimeTestUtils();

    // Override the project root and features path for testing
    const originalProject = process.env.PROJECT_ROOT;
    process.env.PROJECT_ROOT = TEST_PROJECT_ROOT;
    api.featuresPath = TEST_FEATURES_PATH;

    // Mock the fs module
    originalFs = require('fs').promises;
    const fs = require('fs');
    fs.promises = mockFs;

    // Mock time for consistent testing
    timeUtils.mockCurrentTimeISO('2025-09-23T12:00:00.000Z');

    // Mock crypto for deterministic testing
    jest.spyOn(crypto, 'randomBytes').mockImplementation((size) => {
      return Buffer.from('b'.repeat(size * 2), 'hex');
    });

    // Setup initial features file
    mockFs.setFile(TEST_FEATURES_PATH, JSON.stringify(TEST_FIXTURES.emptyFeaturesFile));
  });

  afterEach(() => {
    // Restore original file system
    const fs = require('fs');
    fs.promises = originalFs;

    jest.clearAllMocks();
    mockFs.clearAll();
    timeUtils.restoreTime();
  });

  // =================== AGENT INITIALIZATION TESTS ===================

  describe('Agent Initialization', () => {
    describe('Basic Agent Initialization', () => {
      test('should initialize new agent successfully', async () => {
        const agentId = 'test-agent-001';

        const result = await api.initializeAgent(agentId);

        expect(result.success).toBe(true);
        expect(result.agent).toBeDefined();
        expect(result.agent.id).toBe(agentId);
        expect(result.agent.status).toBe('initialized');
        expect(result.agent.sessionId).toBeDefined();
        expect(result.agent.timestamp).toBe('2025-09-23T12:00:00.000Z');
        expect(result.message).toBe(`Agent ${agentId} successfully initialized`);
      });

      test('should generate unique session IDs for different agents', async () => {
        const agent1 = 'agent-001';
        const agent2 = 'agent-002';

        const result1 = await api.initializeAgent(agent1);
        const result2 = await api.initializeAgent(agent2);

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(result1.agent.sessionId).toBeDefined();
        expect(result2.agent.sessionId).toBeDefined();
        expect(result1.agent.sessionId).not.toBe(result2.agent.sessionId);
      });

      test('should update features file with agent data', async () => {
        const agentId = 'persistent-agent';

        const result = await api.initializeAgent(agentId);
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.agents).toBeDefined();
        expect(features.agents[agentId]).toBeDefined();
        expect(features.agents[agentId].status).toBe('active');
        expect(features.agents[agentId].initialized).toBe('2025-09-23T12:00:00.000Z');
        expect(features.agents[agentId].lastHeartbeat).toBe('2025-09-23T12:00:00.000Z');
        expect(features.agents[agentId].sessionId).toBeDefined();
      });

      test('should track initialization in time bucket stats', async () => {
        const agentId = 'stats-agent';

        const result = await api.initializeAgent(agentId);
        expect(result.success).toBe(true);

        // Verify initialization stats were updated
        const statsResult = await api.getInitializationStats();
        expect(statsResult.success).toBe(true);
        expect(statsResult.stats.total_initializations).toBeGreaterThan(0);
      });

      test('should handle agent initialization with special characters in ID', async () => {
        const specialAgentIds = [
          'agent-with-dashes',
          'agent_with_underscores',
          'agent.with.dots',
          'agent123with456numbers'
        ];

        for (const agentId of specialAgentIds) {
          const result = await api.initializeAgent(agentId);

          expect(result.success).toBe(true);
          expect(result.agent.id).toBe(agentId);
        }
      });
    });

    describe('Agent Session Management', () => {
      test('should create agent entry in features file', async () => {
        const agentId = 'session-test-agent';

        await api.initializeAgent(agentId);

        const features = await api._loadFeatures();
        const agent = features.agents[agentId];

        expect(agent).toBeDefined();
        expect(agent.status).toBe('active');
        expect(agent.initialized).toBe('2025-09-23T12:00:00.000Z');
        expect(agent.lastHeartbeat).toBe('2025-09-23T12:00:00.000Z');
        expect(agent.sessionId).toMatch(/^[a-f0-9]+$/);
      });

      test('should overwrite existing agent data on new initialization', async () => {
        const agentId = 'overwrite-test-agent';

        // First initialization
        const result1 = await api.initializeAgent(agentId);
        const sessionId1 = result1.agent.sessionId;

        // Advance time slightly
        timeUtils.mockCurrentTimeISO('2025-09-23T12:05:00.000Z');

        // Second initialization
        const result2 = await api.initializeAgent(agentId);
        const sessionId2 = result2.agent.sessionId;

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(sessionId1).not.toBe(sessionId2);

        const features = await api._loadFeatures();
        const agent = features.agents[agentId];
        expect(agent.sessionId).toBe(sessionId2);
        expect(agent.initialized).toBe('2025-09-23T12:05:00.000Z');
      });

      test('should initialize agents section if it does not exist', async () => {
        // Start with features file without agents section
        const featuresWithoutAgents = {
          ...TEST_FIXTURES.emptyFeaturesFile
        };
        delete featuresWithoutAgents.agents;
        mockFs.setFile(TEST_FEATURES_PATH, JSON.stringify(featuresWithoutAgents));

        const agentId = 'init-agents-section';
        const result = await api.initializeAgent(agentId);

        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.agents).toBeDefined();
        expect(features.agents[agentId]).toBeDefined();
      });
    });

    describe('Initialization Error Handling', () => {
      test('should handle file write errors during initialization', async () => {
        mockFs.setWriteError(TEST_FEATURES_PATH, 'Disk full');

        const result = await api.initializeAgent('error-test-agent');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to initialize agent');
        expect(result.timestamp).toBeDefined();
      });

      test('should handle corrupted features file during initialization', async () => {
        mockFs.setFile(TEST_FEATURES_PATH, 'invalid json');

        const result = await api.initializeAgent('corrupt-file-agent');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to initialize agent');
      });

      test('should handle empty agent ID gracefully', async () => {
        const result = await api.initializeAgent('');

        expect(result.success).toBe(true);
        expect(result.agent.id).toBe('');
      });
    });
  });

  // =================== AGENT REINITIALIZATION TESTS ===================

  describe('Agent Reinitialization', () => {
    let existingAgentId;
    let originalSessionId;

    beforeEach(async () => {
      existingAgentId = 'existing-agent';
      const initResult = await api.initializeAgent(existingAgentId);
      originalSessionId = initResult.agent.sessionId;
    });

    describe('Basic Agent Reinitialization', () => {
      test('should reinitialize existing agent successfully', async () => {
        const result = await api.reinitializeAgent(existingAgentId);

        expect(result.success).toBe(true);
        expect(result.agent).toBeDefined();
        expect(result.agent.id).toBe(existingAgentId);
        expect(result.agent.status).toBe('reinitialized');
        expect(result.agent.sessionId).toBeDefined();
        expect(result.agent.sessionId).not.toBe(originalSessionId);
        expect(result.agent.previousSessions).toBe(1);
        expect(result.message).toBe(`Agent ${existingAgentId} successfully reinitialized`);
      });

      test('should preserve agent history during reinitialization', async () => {
        const result = await api.reinitializeAgent(existingAgentId);
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        const agent = features.agents[existingAgentId];

        expect(agent.reinitialized).toBe('2025-09-23T12:00:00.000Z');
        expect(agent.previousSessions).toContain(originalSessionId);
        expect(agent.sessionId).not.toBe(originalSessionId);
      });

      test('should update timestamps on reinitialization', async () => {
        // Advance time for reinitialization
        timeUtils.mockCurrentTimeISO('2025-09-23T13:00:00.000Z');

        const result = await api.reinitializeAgent(existingAgentId);
        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        const agent = features.agents[existingAgentId];

        expect(agent.lastHeartbeat).toBe('2025-09-23T13:00:00.000Z');
        expect(agent.reinitialized).toBe('2025-09-23T13:00:00.000Z');
      });

      test('should track reinitialization in time bucket stats', async () => {
        const result = await api.reinitializeAgent(existingAgentId);
        expect(result.success).toBe(true);

        // Verify reinitialization stats were updated
        const statsResult = await api.getInitializationStats();
        expect(statsResult.success).toBe(true);
        expect(statsResult.stats.total_reinitializations).toBeGreaterThan(0);
      });
    });

    describe('Reinitialization Session Management', () => {
      test('should accumulate previous sessions across multiple reinitializations', async () => {
        // First reinitialization
        const result1 = await api.reinitializeAgent(existingAgentId);
        const sessionId1 = result1.agent.sessionId;

        // Second reinitialization
        const result2 = await api.reinitializeAgent(existingAgentId);
        const sessionId2 = result2.agent.sessionId;

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(result2.agent.previousSessions).toBe(2);

        const features = await api._loadFeatures();
        const agent = features.agents[existingAgentId];

        expect(agent.previousSessions).toHaveLength(2);
        expect(agent.previousSessions).toContain(originalSessionId);
        expect(agent.previousSessions).toContain(sessionId1);
        expect(agent.sessionId).toBe(sessionId2);
      });

      test('should reinitialize non-existent agent as new agent', async () => {
        const newAgentId = 'non-existent-agent';

        const result = await api.reinitializeAgent(newAgentId);

        expect(result.success).toBe(true);
        expect(result.agent.id).toBe(newAgentId);
        expect(result.agent.status).toBe('reinitialized');
        expect(result.agent.previousSessions).toBe(0);

        const features = await api._loadFeatures();
        const agent = features.agents[newAgentId];

        expect(agent).toBeDefined();
        expect(agent.status).toBe('active');
        expect(agent.reinitialized).toBe('2025-09-23T12:00:00.000Z');
        expect(agent.previousSessions).toEqual([]);
      });

      test('should handle agent without previous session data', async () => {
        // Manually create agent without session data
        const features = await api._loadFeatures();
        features.agents['incomplete-agent'] = {
          status: 'active',
          lastHeartbeat: '2025-09-23T11:00:00.000Z'
          // Missing sessionId and other data
        };
        await api._saveFeatures(features);

        const result = await api.reinitializeAgent('incomplete-agent');

        expect(result.success).toBe(true);
        expect(result.agent.previousSessions).toBe(0);

        const updatedFeatures = await api._loadFeatures();
        const agent = updatedFeatures.agents['incomplete-agent'];
        expect(agent.previousSessions).toEqual([]);
      });
    });

    describe('Reinitialization Error Handling', () => {
      test('should handle file write errors during reinitialization', async () => {
        mockFs.setWriteError(TEST_FEATURES_PATH, 'Permission denied');

        const result = await api.reinitializeAgent(existingAgentId);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to reinitialize agent');
        expect(result.timestamp).toBeDefined();
      });

      test('should handle corrupted features file during reinitialization', async () => {
        mockFs.setFile(TEST_FEATURES_PATH, '{ corrupted json }');

        const result = await api.reinitializeAgent(existingAgentId);

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to reinitialize agent');
      });
    });
  });

  // =================== STOP AUTHORIZATION TESTS ===================

  describe('Stop Authorization', () => {
    describe('Basic Stop Authorization', () => {
      test('should authorize stop successfully with reason', async () => {
        const agentId = 'stopping-agent';
        const reason = 'All TodoWrite tasks completed successfully. Linter passes, build succeeds, tests pass.';

        const result = await api.authorizeStop(agentId, reason);

        expect(result.success).toBe(true);
        expect(result.authorization).toBeDefined();
        expect(result.authorization.authorized_by).toBe(agentId);
        expect(result.authorization.reason).toBe(reason);
        expect(result.authorization.timestamp).toBe('2025-09-23T12:00:00.000Z');
        expect(result.authorization.stop_flag_created).toBe(true);
        expect(result.message).toContain(`Stop authorized by agent ${agentId}`);
      });

      test('should authorize stop with default reason when none provided', async () => {
        const agentId = 'default-reason-agent';

        const result = await api.authorizeStop(agentId);

        expect(result.success).toBe(true);
        expect(result.authorization.reason).toBe('Agent authorized stop after completing all tasks and achieving project perfection');
        expect(result.authorization.authorized_by).toBe(agentId);
      });

      test('should create .stop-allowed flag file', async () => {
        const agentId = 'flag-creation-agent';

        const result = await api.authorizeStop(agentId);
        expect(result.success).toBe(true);

        // Verify flag file was created
        expect(mockFs.hasFile(TEST_STOP_FLAG_PATH)).toBe(true);

        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));
        expect(flagContent.stop_allowed).toBe(true);
        expect(flagContent.authorized_by).toBe(agentId);
        expect(flagContent.session_type).toBe('self_authorized');
        expect(flagContent.timestamp).toBe('2025-09-23T12:00:00.000Z');
      });

      test('should include comprehensive stop data in flag file', async () => {
        const agentId = 'comprehensive-stop-agent';
        const reason = 'Project perfection achieved: all features implemented, tests pass, code quality excellent';

        const result = await api.authorizeStop(agentId, reason);
        expect(result.success).toBe(true);

        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));

        expect(flagContent).toEqual({
          stop_allowed: true,
          authorized_by: agentId,
          reason: reason,
          timestamp: '2025-09-23T12:00:00.000Z',
          session_type: 'self_authorized'
        });
      });
    });

    describe('Stop Authorization Edge Cases', () => {
      test('should handle empty agent ID', async () => {
        const result = await api.authorizeStop('');

        expect(result.success).toBe(true);
        expect(result.authorization.authorized_by).toBe('');

        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));
        expect(flagContent.authorized_by).toBe('');
      });

      test('should handle very long reasons', async () => {
        const agentId = 'long-reason-agent';
        const longReason = 'A'.repeat(1000);

        const result = await api.authorizeStop(agentId, longReason);

        expect(result.success).toBe(true);
        expect(result.authorization.reason).toBe(longReason);

        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));
        expect(flagContent.reason).toBe(longReason);
      });

      test('should handle special characters in agent ID and reason', async () => {
        const agentId = 'special-chars-agent_123!@#';
        const reason = 'Reason with special chars: !@#$%^&*()_+-={}[]|\\:";\'<>?,./';

        const result = await api.authorizeStop(agentId, reason);

        expect(result.success).toBe(true);
        expect(result.authorization.authorized_by).toBe(agentId);
        expect(result.authorization.reason).toBe(reason);
      });

      test('should overwrite existing stop flag', async () => {
        const firstAgent = 'first-agent';
        const secondAgent = 'second-agent';

        // First authorization
        const result1 = await api.authorizeStop(firstAgent, 'First stop reason');
        expect(result1.success).toBe(true);

        // Advance time
        timeUtils.mockCurrentTimeISO('2025-09-23T13:00:00.000Z');

        // Second authorization (should overwrite)
        const result2 = await api.authorizeStop(secondAgent, 'Second stop reason');
        expect(result2.success).toBe(true);

        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));
        expect(flagContent.authorized_by).toBe(secondAgent);
        expect(flagContent.reason).toBe('Second stop reason');
        expect(flagContent.timestamp).toBe('2025-09-23T13:00:00.000Z');
      });
    });

    describe('Stop Authorization Error Handling', () => {
      test('should handle file write errors during stop authorization', async () => {
        mockFs.setWriteError(TEST_STOP_FLAG_PATH, 'Permission denied');

        const result = await api.authorizeStop('error-agent');

        expect(result.success).toBe(false);
        expect(result.error).toContain('Failed to authorize stop');
        expect(result.timestamp).toBeDefined();
      });

      test('should handle file system errors gracefully', async () => {
        // Mock require to throw an error
        const originalRequire = require;
        jest.doMock('fs', () => {
          throw new Error('File system unavailable');
        });

        try {
          const result = await api.authorizeStop('fs-error-agent');

          expect(result.success).toBe(false);
          expect(result.error).toContain('Failed to authorize stop');
        } catch (error) {
          // Expected in this test scenario
          expect(error.message).toContain('File system unavailable');
        }
      });
    });
  });

  // =================== INTEGRATION TESTS ===================

  describe('Agent Management Integration', () => {
    describe('Agent Lifecycle Integration', () => {
      test('should handle complete agent lifecycle', async () => {
        const agentId = 'lifecycle-agent';

        // 1. Initialize agent
        const initResult = await api.initializeAgent(agentId);
        expect(initResult.success).toBe(true);

        // 2. Reinitialize agent
        const reinitResult = await api.reinitializeAgent(agentId);
        expect(reinitResult.success).toBe(true);

        // 3. Authorize stop
        const stopResult = await api.authorizeStop(agentId, 'Lifecycle test completed');
        expect(stopResult.success).toBe(true);

        // Verify final state
        const features = await api._loadFeatures();
        const agent = features.agents[agentId];

        expect(agent).toBeDefined();
        expect(agent.status).toBe('active');
        expect(agent.reinitialized).toBeDefined();
        expect(agent.previousSessions).toHaveLength(1);

        expect(mockFs.hasFile(TEST_STOP_FLAG_PATH)).toBe(true);
      });

      test('should handle multiple agents with different lifecycles', async () => {
        const agents = ['agent-A', 'agent-B', 'agent-C'];

        // Initialize all agents
        for (const agentId of agents) {
          const result = await api.initializeAgent(agentId);
          expect(result.success).toBe(true);
        }

        // Reinitialize some agents
        await api.reinitializeAgent(agents[0]);
        await api.reinitializeAgent(agents[1]);

        // One agent authorizes stop
        const stopResult = await api.authorizeStop(agents[2], 'First to complete tasks');
        expect(stopResult.success).toBe(true);

        const features = await api._loadFeatures();

        // Verify all agents are tracked
        expect(Object.keys(features.agents)).toHaveLength(3);
        expect(features.agents[agents[0]].reinitialized).toBeDefined();
        expect(features.agents[agents[1]].reinitialized).toBeDefined();
        expect(features.agents[agents[2]].reinitialized).toBeUndefined();

        // Verify stop flag is from the correct agent
        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));
        expect(flagContent.authorized_by).toBe(agents[2]);
      });
    });

    describe('Agent Management with Feature Operations', () => {
      test('should maintain agent state during feature operations', async () => {
        const agentId = 'feature-ops-agent';

        // Initialize agent
        const initResult = await api.initializeAgent(agentId);
        expect(initResult.success).toBe(true);

        // Perform feature operations
        const suggestResult = await api.suggestFeature({
          ...TEST_FIXTURES.validFeature,
          suggested_by: agentId
        });
        expect(suggestResult.success).toBe(true);

        await api.approveFeature(suggestResult.feature.id, { approved_by: agentId });

        // Verify agent data is preserved
        const features = await api._loadFeatures();
        expect(features.agents[agentId]).toBeDefined();
        expect(features.agents[agentId].status).toBe('active');

        // Verify feature was created by the agent
        const suggestedFeature = features.features.find(f => f.id === suggestResult.feature.id);
        expect(suggestedFeature.suggested_by).toBe(agentId);
      });
    });
  });

  // =================== EDGE CASES AND ERROR RECOVERY ===================

  describe('Edge Cases and Error Recovery', () => {
    describe('Data Consistency', () => {
      test('should handle partial agent data gracefully', async () => {
        // Create features file with partial agent data
        const partialAgentData = {
          ...TEST_FIXTURES.emptyFeaturesFile,
          agents: {
            'partial-agent': {
              status: 'active'
              // Missing other required fields
            }
          }
        };
        mockFs.setFile(TEST_FEATURES_PATH, JSON.stringify(partialAgentData));

        const result = await api.reinitializeAgent('partial-agent');

        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        const agent = features.agents['partial-agent'];
        expect(agent.sessionId).toBeDefined();
        expect(agent.reinitialized).toBeDefined();
      });

      test('should handle malformed agent data', async () => {
        // Create features file with malformed agent data
        const malformedData = {
          ...TEST_FIXTURES.emptyFeaturesFile,
          agents: 'not an object'
        };
        mockFs.setFile(TEST_FEATURES_PATH, JSON.stringify(malformedData));

        const result = await api.initializeAgent('recovery-agent');

        expect(result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(typeof features.agents).toBe('object');
        expect(features.agents['recovery-agent']).toBeDefined();
      });
    });

    describe('Concurrent Operations', () => {
      test('should handle multiple agent operations on same file', async () => {
        const agents = ['concurrent-1', 'concurrent-2', 'concurrent-3'];

        // Simulate concurrent operations
        const promises = agents.map(agentId => api.initializeAgent(agentId));
        const results = await Promise.all(promises);

        // All operations should succeed
        results.forEach(result => {
          expect(result.success).toBe(true);
        });

        const features = await api._loadFeatures();
        agents.forEach(agentId => {
          expect(features.agents[agentId]).toBeDefined();
        });
      });
    });
  });
});
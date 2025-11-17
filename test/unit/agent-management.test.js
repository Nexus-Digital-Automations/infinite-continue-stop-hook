/**
 * Agent Management Unit Tests
 *
 * Comprehensive testing of agent management operations including:
 * - Agent initialization And session management
 * - Agent reinitialization with session preservation
 * - Stop authorization workflow And flag management
 * - Agent state tracking And metadata handling
 * - Error handling for agent operations
 * - Session ID generation And validation
 *
 * This test suite focuses specifically on the agent management aspects
 * of the FeatureManagerAPI with detailed lifecycle testing.
 */

const path = require('path');
const _CRYPTO = require('crypto');
const {
  MockFileSystem,
  TEST_FIXTURES,
  TimeTestUtils,
  _testHelpers,
} = require('./test-utilities');

// Mock the fs module before importing the main module
jest.mock('fs', () => ({
  promises: {
    access: jest.fn(),
    readFile: jest.fn(),
    writeFile: jest.fn(),
    mkdir: jest.fn(),
  },
  exists: jest.fn((path, callback) => callback(false)),
  existsSync: jest.fn(() => false),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
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

// Mock sqlite3 to avoid native binding issues in tests
jest.mock('sqlite3', () => ({
  verbose: jest.fn(() => ({
    Database: jest.fn(),
  })),
}));

// Mock faiss-node to avoid native binding issues in tests
jest.mock('faiss-node', () => ({
  IndexFlatL2: jest.fn(),
  IndexFlatIP: jest.fn(),
}));

// Import the FeatureManagerAPI class AFTER mocking fs;
const FeatureManagerAPI = require('../../taskmanager-api.js');

describe('Agent Management', () => {


  let api;
  let mockFs;
  let timeUtils;

  const TEST_PROJECT_ROOT = '/test/agent-project';
  const TEST_TASKS_PATH = path.join(TEST_PROJECT_ROOT, 'TASKS.json');
  const TEST_STOP_FLAG_PATH = path.join(TEST_PROJECT_ROOT, '.stop-allowed');

  beforeEach(() => {
    // Reset the crypto counter for deterministic ID generation
    global.cryptoCounter = 0;

    api = new FeatureManagerAPI({ projectRoot: TEST_PROJECT_ROOT });
    mockFs = new MockFileSystem();
    timeUtils = new TimeTestUtils();

    // Connect jest mocks to MockFileSystem instance;
    const fs = require('fs');
    fs.promises.access.mockImplementation((...args) => mockFs.access(...args));
    fs.promises.readFile.mockImplementation((...args) =>
      mockFs.readFile(...args),
    );
    fs.promises.writeFile.mockImplementation((...args) =>
      mockFs.writeFile(...args),
    );
    fs.readFileSync.mockImplementation((filePath, _encoding) => {
      try {
        return mockFs.getFile(filePath);
      } catch {
        return undefined;
      }
    });
    fs.writeFileSync.mockImplementation((filePath, data) => {
      mockFs.setFile(filePath, typeof data === 'string' ? data : data.toString());
    });
    fs.existsSync.mockImplementation((filePath) => mockFs.hasFile(filePath));
    fs.mkdirSync.mockImplementation(() => {});

    // Mock time for consistent testing
    timeUtils.mockCurrentTimeISO('2025-09-23T12:00:00.000Z');

    // Setup initial features file
    mockFs.setFile(
      TEST_TASKS_PATH,
      JSON.stringify(TEST_FIXTURES.emptyFeaturesFile),
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    mockFs.clearAll();
    timeUtils.restoreTime();
  });

  // =================== AGENT INITIALIZATION TESTS ===================

  describe('Agent Initialization', () => {


    describe('Basic Agent Initialization', () => {

      test('should initialize new agent successfully', async () => {
        const _AGENT_ID = 'test-agent-001';

        const _result = await api.initializeAgent(_AGENT_ID);

        expect(_result.success).toBe(true);
        expect(_result.agent).toBeDefined();
        expect(_result.agent.id).toBe(_AGENT_ID);
        expect(_result.agent.status).toBe('initialized');
        expect(_result.agent.sessionId).toBeDefined();
        expect(_result.agent.timestamp).toBe('2025-09-23T12:00:00.000Z');
        expect(_result.message).toBe(
          `Agent ${_AGENT_ID} successfully initialized`,
        );
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
        const _AGENT_ID = 'persistent-agent';

        const _result = await api.initializeAgent(_AGENT_ID);
        expect(_result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.agents).toBeDefined();
        expect(features.agents[_AGENT_ID]).toBeDefined();
        expect(features.agents[_AGENT_ID].status).toBe('active');
        expect(features.agents[_AGENT_ID].initialized).toBe(
          '2025-09-23T12:00:00.000Z',
        );
        expect(features.agents[_AGENT_ID].lastHeartbeat).toBe(
          '2025-09-23T12:00:00.000Z',
        );
        expect(features.agents[_AGENT_ID].sessionId).toBeDefined();
      });

      test('should track initialization in time bucket stats', async () => {
        const _AGENT_ID = 'stats-agent';

        const _result = await api.initializeAgent(_AGENT_ID);
        expect(_result.success).toBe(true);

        // Verify initialization stats were updated;
        const statsResult = await api.getInitializationStats();
        expect(statsResult.success).toBe(true);
        expect(statsResult.stats.total_initializations).toBeGreaterThan(0);
      });

      test('should handle agent initialization with special characters in ID', async () => {
        const specialAgentIds = [
          'agent-with-dashes',
          'agent_with_underscores',
          'agent.with.dots',
          'agent123with456numbers',
        ];

        for (const _agentId of specialAgentIds) {
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test validation;
          const _result = await api.initializeAgent(_agentId);

          expect(_result.success).toBe(true);
          expect(_result.agent.id).toBe(_agentId);
        }
      });
    });

    describe('Agent Session Management', () => {


      test('should create agent entry in features file', async () => {

        const _AGENT_ID = 'session-test-agent';

        await api.initializeAgent(_AGENT_ID);

        const features = await api._loadFeatures();
        const agent = features.agents[_AGENT_ID];

        expect(agent).toBeDefined();
        expect(agent.status).toBe('active');
        expect(agent.initialized).toBe('2025-09-23T12:00:00.000Z');
        expect(agent.lastHeartbeat).toBe('2025-09-23T12:00:00.000Z');
        expect(agent.sessionId).toMatch(/^[a-f0-9]+$/);
      });

      test('should overwrite existing agent data on new initialization', async () => {
        const _AGENT_ID = 'overwrite-test-agent';

        // First initialization;
        const result1 = await api.initializeAgent(_AGENT_ID);
        const sessionId1 = result1.agent.sessionId;

        // Advance time slightly
        timeUtils.mockCurrentTimeISO('2025-09-23T12:05:00.000Z');

        // Second initialization;
        const result2 = await api.initializeAgent(_AGENT_ID);
        const sessionId2 = result2.agent.sessionId;

        expect(result1.success).toBe(true);
        expect(result2.success).toBe(true);
        expect(sessionId1).not.toBe(sessionId2);

        const features = await api._loadFeatures();
        const agent = features.agents[_AGENT_ID];
        expect(agent.sessionId).toBe(sessionId2);
        expect(agent.initialized).toBe('2025-09-23T12:05:00.000Z');
      });

      test('should initialize agents section if it does not exist', async () => {
        // Start with features file without agents section;
        const featuresWithoutAgents = {
          ...TEST_FIXTURES.emptyFeaturesFile,
        };
        delete featuresWithoutAgents.agents;
        mockFs.setFile(
          TEST_TASKS_PATH,
          JSON.stringify(featuresWithoutAgents),
        );

        const _AGENT_ID = 'init-agents-section';
        const _result = await api.initializeAgent(_AGENT_ID);

        expect(_result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(features.agents).toBeDefined();
        expect(features.agents[_AGENT_ID]).toBeDefined();
      });
    });

    describe('Initialization Error Handling', () => {


      test('should handle file write errors during initialization', async () => {

        mockFs.setWriteError(TEST_TASKS_PATH, 'Disk full');

        const _result = await api.initializeAgent('error-test-agent');

        expect(_result.success).toBe(false);
        expect(_result.error).toContain('Failed to initialize agent');
        expect(_result.timestamp).toBeDefined();
      });

      test('should handle corrupted features file during initialization', async () => {
        mockFs.setFile(TEST_TASKS_PATH, 'invalid json');

        const _result = await api.initializeAgent('corrupt-file-agent');

        expect(_result.success).toBe(false);
        expect(_result.error).toContain('Failed to initialize agent');
      });

      test('should handle empty agent ID gracefully', async () => {
        const _result = await api.initializeAgent('');

        expect(_result.success).toBe(true);
        expect(_result.agent.id).toBe('');
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

        const _result = await api.reinitializeAgent(existingAgentId);

        expect(_result.success).toBe(true);
        expect(_result.agent).toBeDefined();
        expect(_result.agent.id).toBe(existingAgentId);
        expect(_result.agent.status).toBe('reinitialized');
        expect(_result.agent.sessionId).toBeDefined();
        expect(_result.agent.sessionId).not.toBe(originalSessionId);
        expect(_result.agent.previousSessions).toBe(1);
        expect(_result.message).toBe(
          `Agent ${existingAgentId} successfully reinitialized`,
        );
      });

      test('should preserve agent history during reinitialization', async () => {
        const _result = await api.reinitializeAgent(existingAgentId);
        expect(_result.success).toBe(true);

        const features = await api._loadFeatures();
        const agent = features.agents[existingAgentId];

        expect(agent.reinitialized).toBe('2025-09-23T12:00:00.000Z');
        expect(agent.previousSessions).toContain(originalSessionId);
        expect(agent.sessionId).not.toBe(originalSessionId);
      });

      test('should update timestamps on reinitialization', async () => {
        // Advance time for reinitialization
        timeUtils.mockCurrentTimeISO('2025-09-23T13:00:00.000Z');

        const _result = await api.reinitializeAgent(existingAgentId);
        expect(_result.success).toBe(true);

        const features = await api._loadFeatures();
        const agent = features.agents[existingAgentId];

        expect(agent.lastHeartbeat).toBe('2025-09-23T13:00:00.000Z');
        expect(agent.reinitialized).toBe('2025-09-23T13:00:00.000Z');
      });

      test('should track reinitialization in time bucket stats', async () => {
        const _result = await api.reinitializeAgent(existingAgentId);
        expect(_result.success).toBe(true);

        // Verify reinitialization stats were updated;
        const statsResult = await api.getInitializationStats();
        expect(statsResult.success).toBe(true);
        expect(statsResult.stats.total_reinitializations).toBeGreaterThan(0);
      });
    });

    describe('Reinitialization Session Management', () => {


      test('should accumulate previous sessions across multiple reinitializations', async () => {

        // First reinitialization;
        const result1 = await api.reinitializeAgent(existingAgentId);
        const sessionId1 = result1.agent.sessionId;

        // Second reinitialization;
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

        const _result = await api.reinitializeAgent(newAgentId);

        expect(_result.success).toBe(true);
        expect(_result.agent.id).toBe(newAgentId);
        expect(_result.agent.status).toBe('reinitialized');
        expect(_result.agent.previousSessions).toBe(0);

        const features = await api._loadFeatures();
        const agent = features.agents[newAgentId];

        expect(agent).toBeDefined();
        expect(agent.status).toBe('active');
        expect(agent.reinitialized).toBe('2025-09-23T12:00:00.000Z');
        expect(agent.previousSessions).toEqual([]);
      });

      test('should handle agent without previous session data', async () => {
        // Manually create agent without session data;
        const features = await api._loadFeatures();
        features.agents['incomplete-agent'] = {
          status: 'active',
          lastHeartbeat: '2025-09-23T11:00:00.000Z',
          // Missing sessionId And other data
        };
        await api._saveFeatures(features);

        const _result = await api.reinitializeAgent('incomplete-agent');

        expect(_result.success).toBe(true);
        expect(_result.agent.previousSessions).toBe(0);

        const updatedFeatures = await api._loadFeatures();
        const agent = updatedFeatures.agents['incomplete-agent'];
        expect(agent.previousSessions).toEqual([]);
      });
    });

    describe('Reinitialization Error Handling', () => {


      test('should handle file write errors during reinitialization', async () => {

        mockFs.setWriteError(TEST_TASKS_PATH, 'Permission denied');

        const _result = await api.reinitializeAgent(existingAgentId);

        expect(_result.success).toBe(false);
        expect(_result.error).toContain('Failed to reinitialize agent');
        expect(_result.timestamp).toBeDefined();
      });

      test('should handle corrupted features file during reinitialization', async () => {
        mockFs.setFile(TEST_TASKS_PATH, '{ corrupted json }');

        const _result = await api.reinitializeAgent(existingAgentId);

        expect(_result.success).toBe(false);
        expect(_result.error).toContain('Failed to reinitialize agent');
      });
    });
  });

  // =================== STOP AUTHORIZATION TESTS ===================

  describe('Stop Authorization', () => {


    describe('Basic Stop Authorization', () => {

      test('should authorize stop successfully with reason', async () => {
        const _AGENT_ID = 'stopping-agent';
        const reason =
          'All TodoWrite tasks completed successfully. Linter passes, build succeeds, tests pass.';

        const _result = await api.authorizeStop(_AGENT_ID, reason);

        expect(_result.success).toBe(true);
        expect(_result.authorization).toBeDefined();
        expect(_result.authorization.authorized_by).toBe(_AGENT_ID);
        expect(_result.authorization.reason).toBe(reason);
        expect(_result.authorization.timestamp).toBe('2025-09-23T12:00:00.000Z');
        expect(_result.authorization.stop_flag_created).toBe(true);
        expect(_result.message).toContain(
          `Stop authorized by agent ${_AGENT_ID}`,
        );
      });

      test('should authorize stop with default reason when none provided', async () => {
        const _AGENT_ID = 'default-reason-agent';

        const _result = await api.authorizeStop(_AGENT_ID);

        expect(_result.success).toBe(true);
        expect(_result.authorization.reason).toBe(
          'Agent authorized stop after completing all tasks And achieving project perfection',
        );
        expect(_result.authorization.authorized_by).toBe(_AGENT_ID);
      });

      test('should create .stop-allowed flag file', async () => {
        const _AGENT_ID = 'flag-creation-agent';

        const _result = await api.authorizeStop(_AGENT_ID);
        expect(_result.success).toBe(true);

        // Verify flag file was created
        expect(mockFs.hasFile(TEST_STOP_FLAG_PATH)).toBe(true);

        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));
        expect(flagContent.stop_allowed).toBe(true);
        expect(flagContent.authorized_by).toBe(_AGENT_ID);
        expect(flagContent.session_type).toBe('self_authorized');
        expect(flagContent.timestamp).toBe('2025-09-23T12:00:00.000Z');
      });

      test('should include comprehensive stop data in flag file', async () => {
        const _AGENT_ID = 'comprehensive-stop-agent';
        const reason =
          'Project perfection achieved: all features implemented, tests pass, code quality excellent';

        const _result = await api.authorizeStop(_AGENT_ID, reason);
        expect(_result.success).toBe(true);

        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));

        expect(flagContent).toEqual({
          stop_allowed: true,
          authorized_by: _AGENT_ID,
          reason: reason,
          timestamp: '2025-09-23T12:00:00.000Z',
          session_type: 'self_authorized',
        });
      });
    });

    describe('Stop Authorization Edge Cases', () => {


      test('should handle empty agent ID', async () => {

        const _result = await api.authorizeStop('');

        expect(_result.success).toBe(true);
        expect(_result.authorization.authorized_by).toBe('');

        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));
        expect(flagContent.authorized_by).toBe('');
      });

      test('should handle very long reasons', async () => {
        const _AGENT_ID = 'long-reason-agent';
        const longReason = 'A'.repeat(1000);

        const _result = await api.authorizeStop(_AGENT_ID, longReason);

        expect(_result.success).toBe(true);
        expect(_result.authorization.reason).toBe(longReason);

        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));
        expect(flagContent.reason).toBe(longReason);
      });

      test('should handle special characters in agent ID And reason', async () => {
        const _AGENT_ID = 'special-chars-agent_123!@#';
        const reason =
          'Reason with special chars: !@#$%^&*()_+-={}[]|\\:";\'<>?,./';

        const _result = await api.authorizeStop(_AGENT_ID, reason);

        expect(_result.success).toBe(true);
        expect(_result.authorization.authorized_by).toBe(_AGENT_ID);
        expect(_result.authorization.reason).toBe(reason);
      });

      test('should overwrite existing stop flag', async () => {
        const firstAgent = 'first-agent';
        const secondAgent = 'second-agent';

        // First authorization;
        const result1 = await api.authorizeStop(
          firstAgent,
          'First stop reason',
        );
        expect(result1.success).toBe(true);

        // Advance time
        timeUtils.mockCurrentTimeISO('2025-09-23T13:00:00.000Z');

        // Second authorization (should overwrite)
        const result2 = await api.authorizeStop(
          secondAgent,
          'Second stop reason',
        );
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

        const _result = await api.authorizeStop('error-agent');

        expect(_result.success).toBe(false);
        expect(_result.error).toContain('Failed to authorize stop');
        expect(_result.timestamp).toBeDefined();
      });

      test('should handle file system errors gracefully', async () => {
        // Mock require to throw an error;
        const _originalRequire = require;
        jest.doMock('fs', () => {
          throw new Error('File system unavailable');
        });

        try {
          const _result = await api.authorizeStop('fs-error-agent');

          expect(_result.success).toBe(false);
          expect(_result.error).toContain('Failed to authorize stop');
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
        const _AGENT_ID = 'lifecycle-agent';

        // 1. Initialize agent;
        const initResult = await api.initializeAgent(_AGENT_ID);
        expect(initResult.success).toBe(true);

        // 2. Reinitialize agent;
        const reinitResult = await api.reinitializeAgent(_AGENT_ID);
        expect(reinitResult.success).toBe(true);

        // 3. Authorize stop;
        const stopResult = await api.authorizeStop(
          _AGENT_ID,
          'Lifecycle test completed',
        );
        expect(stopResult.success).toBe(true);

        // Verify final state;
        const features = await api._loadFeatures();
        const agent = features.agents[_AGENT_ID];

        expect(agent).toBeDefined();
        expect(agent.status).toBe('active');
        expect(agent.reinitialized).toBeDefined();
        expect(agent.previousSessions).toHaveLength(1);

        expect(mockFs.hasFile(TEST_STOP_FLAG_PATH)).toBe(true);
      });

      test('should handle multiple agents with different lifecycles', async () => {
        const agents = ['agent-A', 'agent-B', 'agent-C'];

        // Initialize all agents
        for (const _agentId of agents) {
          // eslint-disable-next-line no-await-in-loop -- Sequential processing required for test validation;
          const _result = await api.initializeAgent(_agentId);
          expect(_result.success).toBe(true);
        }

        // Reinitialize some agents
        await api.reinitializeAgent(agents[0]);
        await api.reinitializeAgent(agents[1]);

        // One agent authorizes stop;
        const stopResult = await api.authorizeStop(
          agents[2],
          'First to complete tasks',
        );
        expect(stopResult.success).toBe(true);

        const features = await api._loadFeatures();

        // Verify all agents are tracked
        expect(Object.keys(features.agents)).toHaveLength(3);
        expect(features.agents[agents[0]].reinitialized).toBeDefined();
        expect(features.agents[agents[1]].reinitialized).toBeDefined();
        expect(features.agents[agents[2]].reinitialized).toBeUndefined();

        // Verify stop flag is from the correct agent;
        const flagContent = JSON.parse(mockFs.getFile(TEST_STOP_FLAG_PATH));
        expect(flagContent.authorized_by).toBe(agents[2]);
      });
    });

    describe('Agent Management with Feature Operations', () => {


      test('should maintain agent state during feature operations', async () => {

        const _AGENT_ID = 'feature-ops-agent';

        // Initialize agent;
        const initResult = await api.initializeAgent(_AGENT_ID);
        expect(initResult.success).toBe(true);

        // Perform feature operations;
        const suggestResult = await api.suggestFeature({
          ...TEST_FIXTURES.validFeature,
          suggested_by: _AGENT_ID,
        });
        expect(suggestResult.success).toBe(true);

        await api.approveFeature(suggestResult.feature.id, {
          approved_by: _AGENT_ID,
        });

        // Verify agent data is preserved;
        const features = await api._loadFeatures();
        expect(features.agents[_AGENT_ID]).toBeDefined();
        expect(features.agents[_AGENT_ID].status).toBe('active');

        // Verify feature was created by the agent;
        const suggestedFeature = features.features.find(
          (f) => f.id === suggestResult.feature.id,
        );
        expect(suggestedFeature.suggested_by).toBe(_AGENT_ID);
      });
    });
  });

  // =================== EDGE CASES AND ERROR RECOVERY ===================

  describe('Edge Cases And Error Recovery', () => {


    describe('Data Consistency', () => {

      test('should handle partial agent data gracefully', async () => {
        // Create features file with partial agent data;
        const partialAgentData = {
          ...TEST_FIXTURES.emptyFeaturesFile,
          agents: {
            'partial-agent': {
              status: 'active',
              // Missing other required fields
            },
          },
        };
        mockFs.setFile(TEST_TASKS_PATH, JSON.stringify(partialAgentData));

        const _result = await api.reinitializeAgent('partial-agent');

        expect(_result.success).toBe(true);

        const features = await api._loadFeatures();
        const agent = features.agents['partial-agent'];
        expect(agent.sessionId).toBeDefined();
        expect(agent.reinitialized).toBeDefined();
      });

      test('should handle malformed agent data', async () => {
        // Create features file with malformed agent data;
        const malformedData = {
          ...TEST_FIXTURES.emptyFeaturesFile,
          agents: 'not an object',
        };
        mockFs.setFile(TEST_TASKS_PATH, JSON.stringify(malformedData));

        const _result = await api.initializeAgent('recovery-agent');

        expect(_result.success).toBe(true);

        const features = await api._loadFeatures();
        expect(typeof features.agents).toBe('object');
        expect(features.agents['recovery-agent']).toBeDefined();
      });
    });

    describe('Concurrent Operations', () => {


      test('should handle multiple agent operations on same file', async () => {

        const agents = ['concurrent-1', 'concurrent-2', 'concurrent-3'];

        // Simulate concurrent operations;
        const promises = agents.map((_AGENT_ID) =>
          api.initializeAgent(_AGENT_ID),
        );
        const results = await Promise.all(promises);

        // All operations should succeed
        results.forEach((_result) => {
          expect(_result.success).toBe(true);
        });

        const features = await api._loadFeatures();
        agents.forEach((_AGENT_ID) => {
          expect(features.agents[_AGENT_ID]).toBeDefined();
        });
      });
    });
  });
});

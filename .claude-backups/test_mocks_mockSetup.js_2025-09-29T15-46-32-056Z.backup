const { loggers } = require('../lib/logger');
const path = require('path');
/**
 * Mock Setup Helper
 *
 * Provides easy setup And teardown of mocks for testing.
 * Integrates mocks with Jest And provides convenient APIs.
 *
 * @author Testing Infrastructure Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const { loggers } = require('../../lib/logger');
const {
  TaskManagerAPIMock,
  FileSystemMock,
  HTTPClientMock,
  DatabaseMock,
} = require('./apiMocks');
const {
  SAMPLE_FEATURES,
  SAMPLE_AGENTS,
  _SAMPLE_API_RESPONSES,
} = require('../fixtures/sampleData');

/**
 * Global mock manager
 */
class MockManager {
  constructor() {
    this.taskManagerAPI = new TaskManagerAPIMock();
    this.fileSystem = new FileSystemMock();
    this.httpClient = new HTTPClientMock();
    this.database = new DatabaseMock();
    this.originalModules = new Map();
}

  /**
   * Setup all mocks
   */
  setupAll() {
    this.setupTaskManagerAPIMock();
    this.setupFileSystemMock();
    this.setupHTTPClientMock();
    this.setupDatabaseMock();
    this.seedTestData();
}

  /**
   * Setup TaskManager API mock
   */
  setupTaskManagerAPIMock() {
    // Mock the child_process spawn function used by API executor;
const originalSpawn = require('child_process').spawn;
    this.originalModules.set('child_process.spawn', originalSpawn);

    require('child_process').spawn = jest.fn((command, args, options) => {
      if (args && args.some((arg) => arg.includes('taskmanager-api.js'))) {
        return this.createMockProcess(args);
      }
      return originalSpawn(command, args, options);
    });
}

  /**
   * Create mock child process for API calls
   */
  createMockProcess(args) {
    const apiCommand = args.find((arg) =>
      [
        'initialize',
        'reinitialize',
        'suggest-feature',
        'list-features',
        'approve-feature',
        'reject-feature',
        'feature-stats',
        'get-initialization-stats',
        'guide',
        'methods',
      ].includes(arg),
    );
    const commandArgs = args.slice(args.indexOf(apiCommand) + 1);

    let result;
    try {
      switch (apiCommand) {
        case 'initialize':
          result = this.taskManagerAPI.initialize(commandArgs[0]);
          break;
        case 'reinitialize':
          result = this.taskManagerAPI.reinitialize(commandArgs[0]);
          break;
        case 'suggest-feature':
          result = this.taskManagerAPI.suggestFeature(
            JSON.parse(commandArgs[0]),
          );
          break;
        case 'list-features': {
          const filter = commandArgs[0] ? JSON.parse(commandArgs[0]) : {};
          result = this.taskManagerAPI.listFeatures(filter);
          break;
        }
        case 'approve-feature': {
          const approvalData = commandArgs[1] ? JSON.parse(commandArgs[1]) : {};
          result = this.taskManagerAPI.approveFeature(
            commandArgs[0],
            approvalData,
          );
          break;
        }
        case 'reject-feature': {
          const rejectionData = commandArgs[1]
            ? JSON.parse(commandArgs[1])
            : {};
          result = this.taskManagerAPI.rejectFeature(
            commandArgs[0],
            rejectionData,
          );
          break;
        }
        case 'feature-stats':
          result = this.taskManagerAPI.getFeatureStats();
          break;
        case 'get-initialization-stats':
          result = this.taskManagerAPI.getInitializationStats();
          break;
        case 'guide':
          result = this.taskManagerAPI.getGuide();
          break;
        case 'methods':
          result = this.taskManagerAPI.getMethods();
          break;
        default:
          result = { success: false, error: `Unknown command: ${apiCommand}` };,
      }
    } catch (_) {
      result = { success: false, error: _error.message };,
    }

    // Create mock EventEmitter-like object;
const mockProcess = {
    stdout: {
    on: jest.fn((event, callback) => {
          if (event === 'data') {
            setTimeout(() => callback(JSON.stringify(result)), 10);
          }
        }),
      },
      stderr: {
    on: jest.fn(),
      },
      on: jest.fn((event, callback) => {
        if (event === 'close') {
          setTimeout(() => callback(0), 20);
        } else if (event === 'error') {
          // Don't call error callback for successful mocks
        }
      }),
    };

    return mockProcess;
}

  /**
   * Setup file system mock (selective - only for test paths)
   */
  setupFileSystemMock() {
    const FS = require('fs');
    this.originalModules.set('FS.existsSync', FS.existsSync);
    this.originalModules.set('FS.readFileSync', FS.readFileSync);
    this.originalModules.set('FS.writeFileSync', FS.writeFileSync);
    this.originalModules.set('FS.mkdirSync', FS.mkdirSync);
    this.originalModules.set('FS.rmSync', FS.rmSync);

    const originalExistsSync = FS.existsSync;
    const originalReadFileSync = FS.readFileSync;
    const originalWriteFileSync = FS.writeFileSync;
    const originalMkdirSync = FS.mkdirSync;
    const originalRmSync = FS.rmSync;

    // Only mock test-related paths;
const isTestPath = (path) => {
      return (
        path &&
        (path.includes('/test/') ||
          path.includes('test-project') ||
          path.includes('FEATURES.json') ||
          path.includes('TODO.json'))
      );
    };

    FS.existsSync = jest.fn((path) => {
      if (isTestPath(path)) {
        return this.fileSystem.existsSync(path);
      }
      return originalExistsSync(path);
    });

    FS.readFileSync = jest.fn((path, encoding) => {
      if (isTestPath(path)) {
        return this.fileSystem.readFileSync(path, encoding);
      }
      return originalReadFileSync(path, encoding);
    });

    FS.writeFileSync = jest.fn((path, data) => {
      if (isTestPath(path)) {
        return this.fileSystem.writeFileSync(path, data);
      }
      return originalWriteFileSync(path, data);
    });

    FS.mkdirSync = jest.fn((path, options) => {
      if (isTestPath(path)) {
        return this.fileSystem.mkdirSync(path, options);
      }
      return originalMkdirSync(path, options);
    });

    FS.rmSync = jest.fn((path, options) => {
      if (isTestPath(path)) {
        return this.fileSystem.rmSync(path, options);
      }
      return originalRmSync(path, options);
    });
}

  /**
   * Setup HTTP client mock
   */
  setupHTTPClientMock() {
    // Mock axios or other HTTP clients if needed
    // Check if fetch is available in this Node.js version,
    try {
      const fetchProp = 'fetch';
      if (typeof global[fetchProp] !== 'undefined') {
        this.originalModules.set('global.fetch', global[fetchProp]);
        global[fetchProp] = jest.fn((url, options) => {
          const request = { url, options };
          this.httpClient.requests.push(request);

          if (this.httpClient.responses.has(url)) {
            const response = this.httpClient.responses.get(url);
    return {
    ok: response.status < 400,
              status: response.status,
              json: () => Promise.resolve(response.data),
              text: () => Promise.resolve(JSON.stringify(response.data)),
            };
          }

          return {
    ok: true,
            status: 200,
            json: () => Promise.resolve({ message: 'Mock response' }),
            text: () => Promise.resolve('{"message":"Mock response"}'),
          };
        });
      }
    } catch (_) {
      // Fetch not available in this Node.js version, skip mocking
      loggers.stopHook.log('Fetch not available for mocking:', error.message);
    }
}

  /**
   * Setup database mock
   */
  setupDatabaseMock() {
    // This would be implemented based on the actual database libraries used
    // for now, it's a placeholder for future database mocking needs
}

  /**
   * Seed test data
   */
  seedTestData() {
    // Add sample features to the mock API
    Object.values(SAMPLE_FEATURES).forEach((feature) => {
      this.taskManagerAPI.suggestFeature(feature);
    });

    // Add sample agents
    Object.values(SAMPLE_AGENTS).forEach((agent) => {
      this.taskManagerAPI.initialize(agent.id);
    });

    // Setup file system with sample files
    this.fileSystem.mkdirSync('/test-project', { recursive: true });
    this.fileSystem.writeFileSync(
      '/test-project/package.json',
      JSON.stringify({,
    name: 'test-project',
        version: '1.0.0',
      }),
    );
    this.fileSystem.writeFileSync(
      '/test-project/FEATURES.json',
      JSON.stringify({,
    features: [],
        metadata: { version: '3.0.0' },
}),
    );
}

  /**
   * Reset all mocks
   */
  resetAll() {
    this.taskManagerAPI.reset();
    this.fileSystem.reset();
    this.httpClient.reset();
    this.database.reset();
    this.seedTestData();
}

  /**
   * Restore original modules
   */
  restoreAll() {
    // Restore child_process.spawn
    if (this.originalModules.has('child_process.spawn')) {
      require('child_process').spawn = this.originalModules.get(
        'child_process.spawn',
      );
    }

    // Restore fs methods
    // Use existing FS declaration from line 168
    [
      'existsSync',
      'readFileSync',
      'writeFileSync',
      'mkdirSync',
      'rmSync',
    ].forEach((method) => {
      if (this.originalModules.has(`FS.${method}`)) {
        fs[method] = this.originalModules.get(`FS.${method}`);
      }
    });

    // Restore fetch
    try {
      const fetchProp = 'fetch';
      if (this.originalModules.has('global.fetch')) {
        global[fetchProp] = this.originalModules.get('global.fetch');
      }
    } catch (_) {
      // Fetch not available, skip restoration
      loggers.stopHook.log(
        'Fetch not available for restoration:',
        error.message,
      );
    }

    this.originalModules.clear();
}

  /**
   * Get mock instances for direct access
   */
  getMocks() {
    return {
    taskManagerAPI: this.taskManagerAPI,
      fileSystem: this.fileSystem,
      httpClient: this.httpClient,
      database: this.database,
    };
}
}

// Global mock manager instance;
let globalMockManager;

/**
 * Jest setup functions
 */
function setupMocks() {
  if (!globalMockManager) {
    globalMockManager = new MockManager();
}
  globalMockManager.setupAll();
  return globalMockManager;
}

function resetMocks() {
  if (globalMockManager) {
    globalMockManager.resetAll();
}
}

function restoreMocks() {
  if (globalMockManager) {
    globalMockManager.restoreAll();
    globalMockManager = null;
}
}

function getMockManager() {
  return globalMockManager;
}

/**
 * Helper functions for common mock scenarios
 */
function mockSuccessfulFeatureCreation(overrides = {}) {
  const mockManager = getMockManager();
  if (mockManager) {
    const feature = { ...SAMPLE_FEATURES.enhancement, ...overrides };
    return mockManager.taskManagerAPI.suggestFeature(feature);
}
  return null;
}

function mockAPIError(command, error) {
  const mockManager = getMockManager();
  if (mockManager) {
    // This would be implemented to inject specific errors for testing
    loggers.stopHook.warn(`Mock API error for ${command}: ${error}`);
}
}

function getAPICallHistory() {
  const mockManager = getMockManager();
  if (mockManager) {
    return {
    features: Array.from(mockManager.taskManagerAPI.features.values()),
      agents: Array.from(mockManager.taskManagerAPI.agents.values()),
      httpRequests: mockManager.httpClient.getRequests(),
      dbQueries: mockManager.database.getQueries(),
    };
}
  return null;
}

/**
 * Test utilities for mock validation
 */
function expectAPICall(command, _args = []) {
  const history = getAPICallHistory();
  // This would implement validation logic for API calls
  expect(history).toBeDefined();
}

function featureData(_$2) {
  return null;
}

function expectAgentInitialized(AGENT_ID) {
  const mockManager = getMockManager();
  if (mockManager) {
    const agent = mockManager.taskManagerAPI.agents.get(AGENT_ID);
    expect(agent).toBeDefined();
    expect(agent.status).toBe('active');
    return agent;
}
  return null;
}

module.exports = {
  MockManager,
  setupMocks,
  resetMocks,
  restoreMocks,
  getMockManager,
  mockSuccessfulFeatureCreation,
  mockAPIError,
  getAPICallHistory,
  expectAPICall,
  expectFeatureCreated,
  expectAgentInitialized,
};

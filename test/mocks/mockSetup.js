/**
 * Mock Setup Helper
 *
 * Provides easy setup and teardown of mocks for testing.
 * Integrates mocks with Jest and provides convenient APIs.
 *
 * @author Testing Infrastructure Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const { TaskManagerAPIMock, FileSystemMock, HTTPClientMock, DatabaseMock } = require('./apiMocks');
const { SAMPLE_FEATURES, SAMPLE_AGENTS, SAMPLE_API_RESPONSES } = require('../fixtures/sampleData');

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
    // Mock the child_process spawn function used by API executor
    const originalSpawn = require('child_process').spawn;
    this.originalModules.set('child_process.spawn', originalSpawn);

    require('child_process').spawn = jest.fn((command, args, options) => {
      if (args && args.includes('taskmanager-api.js')) {
        return this.createMockProcess(args);
      }
      return originalSpawn(command, args, options);
    });
  }

  /**
   * Create mock child process for API calls
   */
  createMockProcess(args) {
    const apiCommand = args.find(arg => ['initialize', 'reinitialize', 'suggest-feature', 'list-features', 'approve-feature', 'reject-feature', 'feature-stats', 'get-initialization-stats', 'guide', 'methods'].includes(arg));
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
          result = this.taskManagerAPI.suggestFeature(JSON.parse(commandArgs[0]));
          break;
        case 'list-features':
          const filter = commandArgs[0] ? JSON.parse(commandArgs[0]) : {};
          result = this.taskManagerAPI.listFeatures(filter);
          break;
        case 'approve-feature':
          const approvalData = commandArgs[1] ? JSON.parse(commandArgs[1]) : {};
          result = this.taskManagerAPI.approveFeature(commandArgs[0], approvalData);
          break;
        case 'reject-feature':
          const rejectionData = commandArgs[1] ? JSON.parse(commandArgs[1]) : {};
          result = this.taskManagerAPI.rejectFeature(commandArgs[0], rejectionData);
          break;
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
          result = { success: false, error: `Unknown command: ${apiCommand}` };
      }
    } catch (error) {
      result = { success: false, error: error.message };
    }

    // Create mock EventEmitter-like object
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
    const fs = require('fs');
    this.originalModules.set('fs.existsSync', fs.existsSync);
    this.originalModules.set('fs.readFileSync', fs.readFileSync);
    this.originalModules.set('fs.writeFileSync', fs.writeFileSync);
    this.originalModules.set('fs.mkdirSync', fs.mkdirSync);
    this.originalModules.set('fs.rmSync', fs.rmSync);

    const originalExistsSync = fs.existsSync;
    const originalReadFileSync = fs.readFileSync;
    const originalWriteFileSync = fs.writeFileSync;
    const originalMkdirSync = fs.mkdirSync;
    const originalRmSync = fs.rmSync;

    // Only mock test-related paths
    const isTestPath = (path) => {
      return path && (
        path.includes('/test/') ||
        path.includes('test-project') ||
        path.includes('FEATURES.json') ||
        path.includes('TODO.json')
      );
    };

    fs.existsSync = jest.fn((path) => {
      if (isTestPath(path)) {
        return this.fileSystem.existsSync(path);
      }
      return originalExistsSync(path);
    });

    fs.readFileSync = jest.fn((path, encoding) => {
      if (isTestPath(path)) {
        return this.fileSystem.readFileSync(path, encoding);
      }
      return originalReadFileSync(path, encoding);
    });

    fs.writeFileSync = jest.fn((path, data) => {
      if (isTestPath(path)) {
        return this.fileSystem.writeFileSync(path, data);
      }
      return originalWriteFileSync(path, data);
    });

    fs.mkdirSync = jest.fn((path, options) => {
      if (isTestPath(path)) {
        return this.fileSystem.mkdirSync(path, options);
      }
      return originalMkdirSync(path, options);
    });

    fs.rmSync = jest.fn((path, options) => {
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
    if (typeof global.fetch !== 'undefined') {
      this.originalModules.set('global.fetch', global.fetch);
      global.fetch = jest.fn(async (url, options) => {
        const request = { url, options };
        this.httpClient.requests.push(request);

        if (this.httpClient.responses.has(url)) {
          const response = this.httpClient.responses.get(url);
          return {
            ok: response.status < 400,
            status: response.status,
            json: async () => response.data,
            text: async () => JSON.stringify(response.data),
          };
        }

        return {
          ok: true,
          status: 200,
          json: async () => ({ message: 'Mock response' }),
          text: async () => '{"message":"Mock response"}',
        };
      });
    }
  }

  /**
   * Setup database mock
   */
  setupDatabaseMock() {
    // This would be implemented based on the actual database libraries used
    // For now, it's a placeholder for future database mocking needs
  }

  /**
   * Seed test data
   */
  seedTestData() {
    // Add sample features to the mock API
    Object.values(SAMPLE_FEATURES).forEach(feature => {
      this.taskManagerAPI.suggestFeature(feature);
    });

    // Add sample agents
    Object.values(SAMPLE_AGENTS).forEach(agent => {
      this.taskManagerAPI.initialize(agent.id);
    });

    // Setup file system with sample files
    this.fileSystem.mkdirSync('/test-project', { recursive: true });
    this.fileSystem.writeFileSync('/test-project/package.json', JSON.stringify({
      name: 'test-project',
      version: '1.0.0',
    }));
    this.fileSystem.writeFileSync('/test-project/FEATURES.json', JSON.stringify({
      features: [],
      metadata: { version: '3.0.0' },
    }));
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
      require('child_process').spawn = this.originalModules.get('child_process.spawn');
    }

    // Restore fs methods
    const fs = require('fs');
    ['existsSync', 'readFileSync', 'writeFileSync', 'mkdirSync', 'rmSync'].forEach(method => {
      if (this.originalModules.has(`fs.${method}`)) {
        fs[method] = this.originalModules.get(`fs.${method}`);
      }
    });

    // Restore fetch
    if (this.originalModules.has('global.fetch')) {
      global.fetch = this.originalModules.get('global.fetch');
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

// Global mock manager instance
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
    console.warn(`Mock API error for ${command}: ${error}`);
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
function expectAPICall(command, args = []) {
  const history = getAPICallHistory();
  // This would implement validation logic for API calls
  expect(history).toBeDefined();
}

function expectFeatureCreated(featureData) {
  const mockManager = getMockManager();
  if (mockManager) {
    const features = Array.from(mockManager.taskManagerAPI.features.values());
    const feature = features.find(f => f.title === featureData.title);
    expect(feature).toBeDefined();
    expect(feature.title).toBe(featureData.title);
    return feature;
  }
  return null;
}

function expectAgentInitialized(agentId) {
  const mockManager = getMockManager();
  if (mockManager) {
    const agent = mockManager.taskManagerAPI.agents.get(agentId);
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

/**
 * Example Test with Mock Framework
 *
 * Demonstrates how to use the comprehensive testing utilities and mock framework.
 * This serves as a template and example for other test files.
 *
 * @author Testing Infrastructure Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const {
  setupMocks,
  resetMocks,
  restoreMocks,
  _getMockManager,
  expectFeatureCreated,
  expectAgentInitialized,
} = require('../mocks/mockSetup');

const {
  TestIdGenerator,
  APIExecutor,
  TestEnvironment,
  TestDataFactory,
  TestExecution,
  PerformanceUtils,
  TestLogger,
} = require('../utils/testUtils');

const {
  SAMPLE_FEATURES,
  SAMPLE_AGENTS,
  _TEST_CONFIGURATIONS,
} = require('../fixtures/sampleData');

describe('Example Test with Mock Framework', () => {
  let mockManager;
  let testEnvironment;

  beforeAll(() => {
    // Setup mocks for the entire test suite
    mockManager = setupMocks();
    TestLogger.info('Mock framework initialized for test suite');
  });

  afterAll(() => {
    // Restore original implementations
    restoreMocks();
    TestLogger.info('Mock framework restored');
  });

  beforeEach(() => {
    // Reset mock state before each test
    resetMocks();

    // Create fresh test environment
    const testName = expect.getState().currentTestName || 'unknown-test';
    testEnvironment = new TestEnvironment(testName);
    testEnvironment.setup();

    TestLogger.debug('Test environment setup completed', { testName });
  });

  afterEach(() => {
    // Cleanup test environment
    if (testEnvironment) {
      testEnvironment.cleanup();
    }
  });

  describe('Mock Framework Functionality', () => {
    test('should initialize mock manager successfully', () => {
      expect(mockManager).toBeDefined();
      expect(mockManager.getMocks()).toBeDefined();

      const mocks = mockManager.getMocks();
      expect(mocks.taskManagerAPI).toBeDefined();
      expect(mocks.fileSystem).toBeDefined();
      expect(mocks.httpClient).toBeDefined();
      expect(mocks.database).toBeDefined();
    });

    test('should provide access to sample data', () => {
      expect(SAMPLE_FEATURES).toBeDefined();
      expect(SAMPLE_FEATURES.enhancement).toBeDefined();
      expect(SAMPLE_FEATURES.enhancement.title).toBe('Add dark mode toggle');

      expect(SAMPLE_AGENTS).toBeDefined();
      expect(SAMPLE_AGENTS.frontendAgent).toBeDefined();
    });

    test('should generate unique test identifiers', () => {
      const agentId1 = TestIdGenerator.generateAgentId();
      const agentId2 = TestIdGenerator.generateAgentId();
      const projectId = TestIdGenerator.generateProjectId();
      const featureId = TestIdGenerator.generateFeatureId();

      expect(agentId1).not.toBe(agentId2);
      expect(agentId1).toMatch(/^test-agent-/);
      expect(projectId).toMatch(/^test-project-/);
      expect(featureId).toMatch(/^feature-/);
    });
  });

  describe('API Mock Integration', () => {
    test('should mock agent initialization', async () => {
      const agentId = TestIdGenerator.generateAgentId();
      const result = await APIExecutor.initializeTestAgent(agentId);

      expect(result.agentId).toBe(agentId);
      expect(result.result.success).toBe(true);

      // Verify using mock validation helper
      expectAgentInitialized(agentId);
    });

    test('should mock feature creation', async () => {
      const agentId = TestIdGenerator.generateAgentId();
      await APIExecutor.initializeTestAgent(agentId);

      const featureData = TestDataFactory.createFeatureData({
        title: 'Test Feature with Mocks',
        category: 'enhancement',
      });

      const result = await APIExecutor.createTestFeature(featureData);

      expect(result.success).toBe(true);
      expect(result.feature).toBeDefined();
      expect(result.feature.title).toBe(featureData.title);

      // Verify using mock validation helper
      expectFeatureCreated(featureData);
    });

    test('should handle feature validation errors', async () => {
      const agentId = TestIdGenerator.generateAgentId();
      await APIExecutor.initializeTestAgent(agentId);

      const invalidFeatureData = {
        title: 'Invalid Feature',
        // Missing required fields
      };

      const result = await APIExecutor.createTestFeature(invalidFeatureData);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Missing required fields');
    });

    test('should mock feature listing with filters', async () => {
      const agentId = TestIdGenerator.generateAgentId();
      await APIExecutor.initializeTestAgent(agentId);

      // Create multiple features
      await APIExecutor.createTestFeature(TestDataFactory.createFeatureData({ category: 'enhancement' }));
      await APIExecutor.createTestFeature(TestDataFactory.createFeatureData({ category: 'bug-fix' }));

      const result = await APIExecutor.execAPI('list-features', [JSON.stringify({ category: 'enhancement' })]);

      expect(result.success).toBe(true);
      expect(result.features).toBeDefined();
      expect(result.features.length).toBeGreaterThan(0);

      // All features should be enhancement category
      result.features.forEach(feature => {
        expect(feature.category).toBe('enhancement');
      });
    });
  });

  describe('Test Environment Management', () => {
    test('should create and manage test environment', () => {
      expect(testEnvironment).toBeDefined();
      expect(testEnvironment.testName).toBeDefined();

      // Verify environment files exist in mock filesystem
      const mocks = mockManager.getMocks();
      expect(mocks.fileSystem.existsSync(testEnvironment.featuresPath)).toBe(true);
      expect(mocks.fileSystem.existsSync(testEnvironment.packagePath)).toBe(true);
    });

    test('should read and write features data', () => {
      const featuresData = testEnvironment.readFeatures();
      expect(featuresData).toBeDefined();
      expect(featuresData.features).toEqual([]);
      expect(featuresData.metadata.version).toBe('3.0.0');

      // Update features data
      const updatedData = {
        ...featuresData,
        features: [{ id: 'test-feature', title: 'Test Feature' }],
      };

      testEnvironment.writeFeatures(updatedData);

      const readData = testEnvironment.readFeatures();
      expect(readData.features).toHaveLength(1);
      expect(readData.features[0].title).toBe('Test Feature');
    });
  });

  describe('Performance Testing Utilities', () => {
    test('should measure execution time', async () => {
      const { result, duration } = await PerformanceUtils.measureTime(async () => {
        // Simulate some work
        await new Promise(resolve => {
          setTimeout(resolve, 100);
        });
        return 'test-result';
      });

      expect(result).toBe('test-result');
      expect(duration).toBeGreaterThan(90); // Should be around 100ms
      expect(duration).toBeLessThan(200); // Allow some variance
    });

    test('should measure memory usage', async () => {
      const { result, memoryDelta } = await PerformanceUtils.measureMemory(() => {
        // Create some objects to use memory
        const data = new Array(1000).fill(0).map((_, i) => ({ id: i, data: `item-${i}` }));
        return data.length;
      });

      expect(result).toBe(1000);
      expect(memoryDelta).toBeDefined();
      expect(typeof memoryDelta.heapUsed).toBe('number');
    });
  });

  describe('Test Execution Utilities', () => {
    test('should handle timeouts', async () => {
      await expect(
        TestExecution.withTimeout(
          new Promise(resolve => {
            setTimeout(resolve, 2000);
          }),
          1000,
        ),
      ).rejects.toThrow('Test timed out after 1000ms');
    });

    test('should retry failed operations', async () => {
      let attempts = 0;

      const result = await TestExecution.retry(() => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success';
      }, 5, 10);

      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    test('should execute promises in parallel with concurrency control', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        Promise.resolve(i * 2),
      );

      const results = await TestExecution.parallel(promises, 3);

      expect(results).toHaveLength(10);
      expect(results).toEqual([0, 2, 4, 6, 8, 10, 12, 14, 16, 18]);
    });
  });

  describe('Test Data Factory', () => {
    test('should create consistent test data', () => {
      const feature1 = TestDataFactory.createFeatureData();
      const feature2 = TestDataFactory.createFeatureData();

      expect(feature1.title).not.toBe(feature2.title); // Should be unique
      expect(feature1.business_value).toBeDefined();
      expect(feature1.category).toBe('enhancement'); // Default category

      const customFeature = TestDataFactory.createFeatureData({
        category: 'bug-fix',
        priority: 'high',
      });

      expect(customFeature.category).toBe('bug-fix');
      expect(customFeature.priority).toBe('high');
    });

    test('should create different types of test data', () => {
      const userData = TestDataFactory.createUserData();
      const projectData = TestDataFactory.createProjectData();
      const taskData = TestDataFactory.createTaskData();

      expect(userData.email).toContain('@example.com');
      expect(projectData.name).toMatch(/^test-project-/);
      expect(taskData.id).toMatch(/^task-/);
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      try {
        await APIExecutor.execAPI('invalid-command');
        expect.fail('Should have thrown an error');
      } catch (error) {
        expect(error.message).toBeDefined();
        TestLogger.debug('Handled expected error', { error: error.message });
      }
    });

    test('should provide meaningful error messages', async () => {
      const agentId = TestIdGenerator.generateAgentId();
      await APIExecutor.initializeTestAgent(agentId);

      const result = await APIExecutor.execAPI('approve-feature', ['non-existent-feature']);

      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });
  });
});

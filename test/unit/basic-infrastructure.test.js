/**
 * Basic Infrastructure Test
 *
 * Simple tests to verify testing infrastructure works without complex mocks.
 * Tests fundamental utilities and data structures.
 *
 * @author Testing Infrastructure Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

const {
  TestIdGenerator,
  TestDataFactory,
  TestExecution,
  PerformanceUtils,
  TestLogger,
} = require('../utils/testUtils');

const {
  SAMPLE_FEATURES,
  SAMPLE_AGENTS,
  TEST_CONFIGURATIONS,
} = require('../fixtures/sampleData');

describe('Basic Testing Infrastructure', () => {
  describe('Test ID Generation', () => {
    test('should generate unique agent IDs', () => {
      const id1 = TestIdGenerator.generateAgentId();
      const id2 = TestIdGenerator.generateAgentId();

      expect(id1).toMatch(/^test-agent-/);
      expect(id2).toMatch(/^test-agent-/);
      expect(id1).not.toBe(id2);
    });

    test('should generate unique project IDs', () => {
      const id1 = TestIdGenerator.generateProjectId();
      const id2 = TestIdGenerator.generateProjectId();

      expect(id1).toMatch(/^test-project-/);
      expect(id2).toMatch(/^test-project-/);
      expect(id1).not.toBe(id2);
    });

    test('should generate unique feature IDs', () => {
      const id1 = TestIdGenerator.generateFeatureId();
      const id2 = TestIdGenerator.generateFeatureId();

      expect(id1).toMatch(/^feature-/);
      expect(id2).toMatch(/^feature-/);
      expect(id1).not.toBe(id2);
    });

    test('should generate unique task IDs', () => {
      const id1 = TestIdGenerator.generateTaskId();
      const id2 = TestIdGenerator.generateTaskId();

      expect(id1).toMatch(/^task-/);
      expect(id2).toMatch(/^task-/);
      expect(id1).not.toBe(id2);
    });
  });

  describe('Test Data Factory', () => {
    test('should create valid feature data', () => {
      const feature = TestDataFactory.createFeatureData();

      expect(feature.title).toBeDefined();
      expect(feature.description).toBeDefined();
      expect(feature.business_value).toBeDefined();
      expect(feature.category).toBe('enhancement');
    });

    test('should create feature data with overrides', () => {
      const feature = TestDataFactory.createFeatureData({
        category: 'bug-fix',
        priority: 'high',
        title: 'Custom Title',
      });

      expect(feature.category).toBe('bug-fix');
      expect(feature.priority).toBe('high');
      expect(feature.title).toBe('Custom Title');
      expect(feature.description).toBeDefined(); // Should still have default
    });

    test('should create valid user data', () => {
      const user = TestDataFactory.createUserData();

      expect(user.id).toMatch(/^test-agent-/);
      expect(user.name).toBeDefined();
      expect(user.email).toContain('@example.com');
      expect(user.role).toBe('tester');
    });

    test('should create valid project data', () => {
      const project = TestDataFactory.createProjectData();

      expect(project.name).toMatch(/^test-project-/);
      expect(project.description).toBeDefined();
      expect(project.version).toBe('1.0.0');
      expect(project.type).toBe('testing');
    });

    test('should create valid task data', () => {
      const task = TestDataFactory.createTaskData();

      expect(task.id).toMatch(/^task-/);
      expect(task.title).toBeDefined();
      expect(task.description).toBeDefined();
      expect(task.status).toBe('pending');
      expect(task.priority).toBe('medium');
      expect(task.category).toBe('test');
    });
  });

  describe('Sample Data Fixtures', () => {
    test('should provide valid sample features', () => {
      expect(SAMPLE_FEATURES).toBeDefined();
      expect(SAMPLE_FEATURES.enhancement).toBeDefined();
      expect(SAMPLE_FEATURES.newFeature).toBeDefined();
      expect(SAMPLE_FEATURES.bugFix).toBeDefined();

      // Test enhancement feature structure
      const enhancement = SAMPLE_FEATURES.enhancement;
      expect(enhancement.title).toBe('Add dark mode toggle');
      expect(enhancement.category).toBe('enhancement');
      expect(enhancement.business_value).toBeDefined();
      expect(enhancement.description).toBeDefined();
    });

    test('should provide valid sample agents', () => {
      expect(SAMPLE_AGENTS).toBeDefined();
      expect(SAMPLE_AGENTS.frontendAgent).toBeDefined();
      expect(SAMPLE_AGENTS.backendAgent).toBeDefined();
      expect(SAMPLE_AGENTS.testingAgent).toBeDefined();

      // Test frontend agent structure
      const frontend = SAMPLE_AGENTS.frontendAgent;
      expect(frontend.id).toBe('frontend-agent-001');
      expect(frontend.specialization).toBe('frontend');
      expect(Array.isArray(frontend.skills)).toBe(true);
      expect(frontend.skills).toContain('react');
    });

    test('should provide valid test configurations', () => {
      expect(TEST_CONFIGURATIONS).toBeDefined();
      expect(TEST_CONFIGURATIONS.unit).toBeDefined();
      expect(TEST_CONFIGURATIONS.integration).toBeDefined();
      expect(TEST_CONFIGURATIONS.e2e).toBeDefined();

      // Test unit configuration structure
      const unit = TEST_CONFIGURATIONS.unit;
      expect(unit.testTimeout).toBe(5000);
      expect(unit.coverage.threshold.functions).toBe(80);
    });
  });

  describe('Performance Utilities', () => {
    test('should measure execution time accurately', async () => {
      const delay = 50; // 50ms delay

      const { result, duration } = await PerformanceUtils.measureTime(async () => {
        await new Promise(resolve => setTimeout(resolve, delay));
        return 'test-complete';
      });

      expect(result).toBe('test-complete');
      expect(duration).toBeGreaterThan(delay - 10); // Allow some variance
      expect(duration).toBeLessThan(delay + 50); // Allow some variance
    });

    test('should measure memory usage', async () => {
      const { result, memoryDelta } = await PerformanceUtils.measureMemory(async () => {
        // Create some data to use memory
        const largeArray = new Array(1000).fill(0).map((_, i) => ({
          id: i,
          data: `test-data-${i}`,
          nested: { value: i * 2 },
        }));
        return largeArray.length;
      });

      expect(result).toBe(1000);
      expect(memoryDelta).toBeDefined();
      expect(typeof memoryDelta.heapUsed).toBe('number');
      expect(typeof memoryDelta.rss).toBe('number');
    });
  });

  describe('Test Execution Utilities', () => {
    test('should enforce timeouts', async () => {
      const promise = new Promise(resolve => setTimeout(resolve, 200)); // 200ms
      const timeout = 100; // 100ms timeout

      await expect(
        TestExecution.withTimeout(promise, timeout),
      ).rejects.toThrow('Test timed out after 100ms');
    });

    test('should allow operations within timeout', async () => {
      const promise = new Promise(resolve => setTimeout(() => resolve('success'), 50)); // 50ms
      const timeout = 100; // 100ms timeout

      const result = await TestExecution.withTimeout(promise, timeout);
      expect(result).toBe('success');
    });

    test('should retry failed operations', async () => {
      let attempts = 0;

      const result = await TestExecution.retry(async () => {
        attempts++;
        if (attempts < 3) {
          throw new Error('Temporary failure');
        }
        return 'success-after-retries';
      }, 5, 10); // 5 max retries, 10ms delay

      expect(result).toBe('success-after-retries');
      expect(attempts).toBe(3);
    });

    test('should fail after max retries', async () => {
      let attempts = 0;

      await expect(
        TestExecution.retry(async () => {
          attempts++;
          throw new Error('Persistent failure');
        }, 3, 10), // 3 max retries, 10ms delay
      ).rejects.toThrow('Persistent failure');

      expect(attempts).toBe(3);
    });

    test('should execute promises in parallel with concurrency control', async () => {
      const promises = Array.from({ length: 8 }, (_, i) =>
        new Promise(resolve => setTimeout(() => resolve(i * 2), 10)),
      );

      const results = await TestExecution.parallel(promises, 3); // Max 3 concurrent

      expect(results).toHaveLength(8);
      expect(results.sort((a, b) => a - b)).toEqual([0, 2, 4, 6, 8, 10, 12, 14]);
    });
  });

  describe('Test Logger', () => {
    test('should provide logging methods', () => {
      // Test that logging methods exist and don't throw
      expect(() => TestLogger.info('Test info message')).not.toThrow();
      expect(() => TestLogger.warn('Test warning message')).not.toThrow();
      expect(() => TestLogger.error('Test error message')).not.toThrow();
      expect(() => TestLogger.debug('Test debug message')).not.toThrow();
    });

    test('should log with data objects', () => {
      const testData = { key: 'value', number: 42 };

      expect(() => TestLogger.info('Test with data', testData)).not.toThrow();
      expect(() => TestLogger.warn('Test with data', testData)).not.toThrow();
      expect(() => TestLogger.error('Test with data', testData)).not.toThrow();
      expect(() => TestLogger.debug('Test with data', testData)).not.toThrow();
    });
  });

  describe('Data Validation', () => {
    test('should validate feature data structure', () => {
      const validFeature = SAMPLE_FEATURES.enhancement;

      // Required fields
      expect(validFeature.title).toBeDefined();
      expect(validFeature.description).toBeDefined();
      expect(validFeature.business_value).toBeDefined();
      expect(validFeature.category).toBeDefined();

      // Valid category
      const validCategories = ['enhancement', 'bug-fix', 'new-feature', 'performance', 'security', 'documentation'];
      expect(validCategories).toContain(validFeature.category);
    });

    test('should validate agent data structure', () => {
      const validAgent = SAMPLE_AGENTS.testingAgent;

      expect(validAgent.id).toBeDefined();
      expect(validAgent.name).toBeDefined();
      expect(validAgent.type).toBeDefined();
      expect(validAgent.specialization).toBeDefined();
      expect(Array.isArray(validAgent.skills)).toBe(true);
      expect(validAgent.status).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    test('should handle async errors gracefully', async () => {
      const errorPromise = Promise.reject(new Error('Test error'));

      await expect(errorPromise).rejects.toThrow('Test error');
    });

    test('should handle synchronous errors', () => {
      expect(() => {
        throw new Error('Sync test error');
      }).toThrow('Sync test error');
    });

    test('should handle undefined/null values', () => {
      expect(() => TestIdGenerator.generateAgentId()).not.toThrow();
      expect(() => TestDataFactory.createFeatureData()).not.toThrow();
      expect(() => TestDataFactory.createFeatureData(null)).not.toThrow();
      expect(() => TestDataFactory.createFeatureData(undefined)).not.toThrow();
    });
  });
});

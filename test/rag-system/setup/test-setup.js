
/**
 * RAG System Test Setup
 *
 * Global test setup and utilities for RAG system testing.
 * Configures test environment, mocks, and helper functions.
 *
 * @author Testing Agent
 * @version 1.0.0
 */

const _path = require('path');
const _fs = require('fs').promises;

// Global test configuration
global.RAG_TEST_CONFIG = {
  testDataPath: _path.join(__dirname, '../test-data'),
  tempPath: _path.join(__dirname, '../temp'),
  mockDataPath: _path.join(__dirname, '../mocks'),
  performanceThresholds: {
    embeddingGeneration: 2000, // 2 seconds
    semanticSearch: 500, // 500ms
    batchOperations: 100, // 100ms per item
    databaseQueries: 1000, // 1 second
  },
};

// Mock implementations for when RAG system is not yet available
global.RAG_MOCKS = {
  embeddingService: {
    generateEmbedding: jest.fn().mockResolvedValue([0.1, 0.2, 0.3]),
    generateBatchEmbeddings: jest.fn().mockResolvedValue([[0.1, 0.2, 0.3]]),
    calculateSimilarity: jest.fn().mockReturnValue(0.85),
  },

  vectorDatabase: {
    store: jest.fn().mockResolvedValue({ success: true, id: 'mock-id' }),
    search: jest.fn().mockResolvedValue({
      results: [{ id: 'mock-id', score: 0.9, content: 'mock content' }],
    }),
    delete: jest.fn().mockResolvedValue({ success: true }),
  },

  ragSystem: {
    storeLesson: jest.fn().mockResolvedValue({
      success: true,
      lesson_id: 'mock-lesson-id',
      embedding: [0.1, 0.2, 0.3],
    }),

    searchLessons: jest.fn().mockResolvedValue({
      success: true,
      results: [
        {
          id: 'mock-lesson-1',
          title: 'Mock Lesson',
          content: 'Mock lesson content',
          relevance_score: 0.9,
        },
      ],
    }),

    storeError: jest.fn().mockResolvedValue({
      success: true,
      error_id: 'mock-error-id',
    }),

    findSimilarErrors: jest.fn().mockResolvedValue({
      success: true,
      errors: [
        {
          id: 'mock-error-1',
          message: 'Mock error message',
          similarity_score: 0.85,
        },
      ],
    }),
  },
};

// Test utilities
global.RAG_TEST_UTILS = {
  /**
   * Create test lesson data
   */
  createTestLesson: (index = 1) => ({
    title: `Test Lesson ${index}`,
    content: `This is test lesson content ${index} for testing purposes.`,
    category: 'test',
    tags: ['test', `lesson-${index}`],
    created_at: new Date().toISOString(),
  }),

  /**
   * Create test error data
   */
  createTestError: (index = 1) => ({
    error_type: 'test_error',
    message: `Test error message ${index}`,
    file_path: `/test/file${index}.js`,
    line_number: index * 10,
    context: { test_context: true, index },
  }),

  /**
   * Generate random technical content
   */
  generateTechnicalContent: (topic = 'general') => {
    const templates = {
      general: 'Technical content about {topic} including best practices and implementation details.',
      error: 'Error handling for {topic} requires proper validation and error reporting mechanisms.',
      performance: 'Performance optimization for {topic} involves caching, indexing, and efficient algorithms.',
      security: 'Security considerations for {topic} include input validation, authentication, and authorization.',
    };

    const template = templates[topic] || templates.general;
    return template.replace('{topic}', topic);
  },

  /**
   * Create mock embedding vector
   */
  createMockEmbedding: (dimension = 384) => {
    return Array.from({ length: dimension }, () => Math.random() * 2 - 1);
  },

  /**
   * Wait for specified time
   */
  wait: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

  /**
   * Measure execution time
   */
  measureTime: async (fn) => {
    const start = process.hrtime.bigint();
    const result = await fn();
    const end = process.hrtime.bigint();
    const duration = Number(end - start) / 1000000; // Convert to milliseconds
    return { result, duration };
  },

  /**
   * Assert performance threshold
   */
  assertPerformance: (duration, threshold, operation) => {
    if (duration > threshold) {
      throw new Error(`Performance threshold exceeded for ${operation}: ${duration}ms > ${threshold}ms`);
    }
  },

  /**
   * Create test directory structure
   */
  createTestDirectory: async (basePath, structure) => {
    await _fs.mkdir(basePath, { recursive: true });

    for (const [name, content] of Object.entries(structure)) {
      const _fullPath = _path.join(basePath, name);

      if (typeof content === 'object') {
        await _fs.mkdir(_fullPath, { recursive: true });
        await global.RAG_TEST_UTILS.createTestDirectory(_fullPath, content);
      } else {
        await _fs.writeFile(_fullPath, content);
      }
    }
  },

  /**
   * Cleanup test directory
   */
  cleanupTestDirectory: async (dirPath) => {
    try {
      await _fs.rm(dirPath, { recursive: true, force: true });
    } catch (error) {
      console.warn(`Cleanup warning for ${dirPath}:`, error.message);
    }
  },

  /**
   * Validate RAG system response structure
   */
  validateRagResponse: (response, expectedFields = []) => {
    expect(response).toBeDefined();
    expect(typeof response).toBe('object');
    expect(response.success).toBeDefined();

    expectedFields.forEach(field => {
      expect(response).toHaveProperty(field);
    });
  },

  /**
   * Create performance test suite
   */
  createPerformanceTest: (name, operation, threshold) => {
    return async () => {
      const { result, duration } = await global.RAG_TEST_UTILS.measureTime(operation);

      console.log(`${name} completed in ${duration.toFixed(2)}ms`);
      global.RAG_TEST_UTILS.assertPerformance(duration, threshold, name);

      return result;
    };
  },
};

// Global setup
beforeEach(async () => {
  // Reset all mocks
  Object.values(global.RAG_MOCKS).forEach(mockObject => {
    Object.values(mockObject).forEach(mockFn => {
      if (jest.isMockFunction(mockFn)) {
        mockFn.mockClear();
      }
    });
  });

  // Ensure test directories exist
  await _fs.mkdir(global.RAG_TEST_CONFIG.testDataPath, { recursive: true });
  await _fs.mkdir(global.RAG_TEST_CONFIG.tempPath, { recursive: true });
});

// Global teardown
afterEach(async () => {
  // Cleanup temporary test data
  try {
    const tempFiles = await _fs.readdir(global.RAG_TEST_CONFIG.tempPath);
    for (const file of tempFiles) {
      await _fs.rm(_path.join(global.RAG_TEST_CONFIG.tempPath, file), {
        recursive: true,
        force: true,
      });
    }
  } catch {
    // Ignore cleanup errors
  }
});

// Extend Jest matchers for RAG-specific assertions
expect.extend({
  toBeValidEmbedding(received) {
    const pass = Array.isArray(received) &&
                 received.length > 0 &&
                 received.every(val => typeof val === 'number' && !isNaN(val));

    if (pass) {
      return {
        message: () => `expected ${received} not to be a valid embedding`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to be a valid embedding (array of numbers)`,
        pass: false,
      };
    }
  },

  toHaveHighSimilarity(received, expected, threshold = 0.7) {
    const pass = typeof received === 'number' &&
                 received >= threshold &&
                 received <= 1;

    if (pass) {
      return {
        message: () => `expected ${received} not to have high similarity (>= ${threshold})`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received} to have high similarity (>= ${threshold})`,
        pass: false,
      };
    }
  },

  toMeetPerformanceThreshold(received, threshold) {
    const pass = typeof received === 'number' && received <= threshold;

    if (pass) {
      return {
        message: () => `expected ${received}ms not to meet performance threshold of ${threshold}ms`,
        pass: true,
      };
    } else {
      return {
        message: () => `expected ${received}ms to meet performance threshold of ${threshold}ms`,
        pass: false,
      };
    }
  },
});

console.log('RAG System test environment initialized');
console.log('Test data path:', global.RAG_TEST_CONFIG.testDataPath);
console.log('Performance thresholds:', global.RAG_TEST_CONFIG.performanceThresholds);

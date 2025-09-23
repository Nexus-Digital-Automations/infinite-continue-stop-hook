# Comprehensive Testing Examples and FEATURES.json Testing Documentation

*Author: Testing Analysis Agent*
*Version: 1.0.0*
*Date: 2025-09-23*

## 🎯 Overview

This comprehensive guide provides practical examples, patterns, and documentation for testing the infinite-continue-stop-hook codebase, with special focus on the FEATURES.json feature management system. Based on analysis of existing test infrastructure, this document serves as the authoritative reference for writing effective tests.

## 📋 Table of Contents

- [Testing Architecture Overview](#testing-architecture-overview)
- [FEATURES.json Testing Strategy](#featuresjson-testing-strategy)
- [Unit Test Examples](#unit-test-examples)
- [Integration Test Examples](#integration-test-examples)
- [End-to-End Test Examples](#end-to-end-test-examples)
- [API Testing Patterns](#api-testing-patterns)
- [Mock Usage Examples](#mock-usage-examples)
- [Test Data Management](#test-data-management)
- [Performance Testing](#performance-testing)
- [Error Handling and Edge Cases](#error-handling-and-edge-cases)
- [Best Practices and Patterns](#best-practices-and-patterns)

## 🏗️ Testing Architecture Overview

### Framework Stack

- **Testing Framework**: Jest 30.1.3
- **Test Categories**: Unit, Integration, E2E
- **Mock Framework**: Custom mock system with comprehensive API mocking
- **Test Utilities**: Specialized utilities for TaskManager API testing
- **Coverage**: Jest coverage with threshold enforcement
- **CI/CD**: GitHub Actions integration for automated testing

### Directory Structure

```
test/
├── unit/                     # Unit tests - isolated component testing
├── integration/              # Integration tests - component interaction
├── e2e/                      # End-to-end tests - full workflow validation
├── fixtures/                 # Test data and sample configurations
├── mocks/                    # Mock implementations and setup
├── utils/                    # Testing utilities and helpers
├── setup.js                  # Jest global setup
├── globalSetup.js           # Test environment initialization
└── README.md                # Testing infrastructure documentation
```

## 🎯 FEATURES.json Testing Strategy

### Feature Management System Architecture

The FEATURES.json system is the core feature management component with the following characteristics:

```json
{
  "project": "infinite-continue-stop-hook",
  "features": [
    {
      "id": "feature_1758639953379_56fa7ae0a47c",
      "title": "Test Feature 12345",
      "description": "Comprehensive test feature for E2E validation",
      "business_value": "Validates E2E testing functionality",
      "category": "enhancement",
      "status": "suggested",
      "created_at": "2025-09-23T15:05:53.379Z",
      "updated_at": "2025-09-23T15:05:53.380Z",
      "suggested_by": "system",
      "metadata": {}
    }
  ],
  "metadata": {
    "version": "1.0.0",
    "total_features": 12,
    "approval_history": [],
    "initialization_stats": {}
  },
  "workflow_config": {
    "require_approval": true,
    "allowed_statuses": ["suggested", "approved", "rejected", "implemented"]
  }
}
```

### Testing Approach for FEATURES.json

#### 1. Schema Validation Testing
```javascript
describe('FEATURES.json Schema Validation', () => {
  test('should validate feature object structure', () => {
    const feature = TestDataFactory.createFeatureData();

    expect(feature).toHaveProperty('title');
    expect(feature).toHaveProperty('description');
    expect(feature).toHaveProperty('business_value');
    expect(feature).toHaveProperty('category');
    expect(feature.category).toBeOneOf(['enhancement', 'bug-fix', 'new-feature', 'performance', 'security', 'documentation']);
  });

  test('should validate metadata structure', () => {
    const featuresData = testEnvironment.readFeatures();

    expect(featuresData.metadata).toHaveProperty('version');
    expect(featuresData.metadata).toHaveProperty('total_features');
    expect(featuresData.metadata).toHaveProperty('approval_history');
    expect(Array.isArray(featuresData.metadata.approval_history)).toBe(true);
  });
});
```

#### 2. Feature Lifecycle Testing
```javascript
describe('Feature Lifecycle Management', () => {
  test('should handle complete feature lifecycle', async () => {
    const agentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(agentId);

    // 1. Suggest feature
    const featureData = TestDataFactory.createFeatureData({
      title: 'Lifecycle Test Feature',
      category: 'enhancement'
    });

    const suggestionResult = await APIExecutor.createTestFeature(featureData);
    expect(suggestionResult.success).toBe(true);
    expect(suggestionResult.feature.status).toBe('suggested');

    // 2. Approve feature
    const approvalResult = await APIExecutor.execAPI('approve-feature', [
      suggestionResult.feature.id,
      JSON.stringify({ approved_by: 'test-agent', notes: 'Test approval' })
    ]);
    expect(approvalResult.success).toBe(true);
    expect(approvalResult.feature.status).toBe('approved');

    // 3. List approved features
    const listResult = await APIExecutor.execAPI('list-features', [
      JSON.stringify({ status: 'approved' })
    ]);
    expect(listResult.success).toBe(true);
    expect(listResult.features.some(f => f.id === suggestionResult.feature.id)).toBe(true);
  });
});
```

#### 3. Workflow Configuration Testing
```javascript
describe('Workflow Configuration', () => {
  test('should enforce approval requirements', async () => {
    const featuresData = testEnvironment.readFeatures();
    expect(featuresData.workflow_config.require_approval).toBe(true);

    // Test that features start in 'suggested' status
    const featureData = TestDataFactory.createFeatureData();
    const result = await APIExecutor.createTestFeature(featureData);
    expect(result.feature.status).toBe('suggested');
  });

  test('should validate status transitions', async () => {
    const featureData = TestDataFactory.createFeatureData();
    const suggestionResult = await APIExecutor.createTestFeature(featureData);

    // Valid transition: suggested → approved
    const approvalResult = await APIExecutor.execAPI('approve-feature', [
      suggestionResult.feature.id,
      JSON.stringify({ approved_by: 'test-agent' })
    ]);
    expect(approvalResult.success).toBe(true);

    // Invalid transition: approved → suggested (should fail)
    const invalidResult = await APIExecutor.execAPI('suggest-feature', [
      JSON.stringify({ ...featureData, id: suggestionResult.feature.id })
    ]);
    expect(invalidResult.success).toBe(false);
  });
});
```

## 🧪 Unit Test Examples

### Basic Unit Test Structure
```javascript
const {
  TestIdGenerator,
  APIExecutor,
  TestDataFactory,
  PerformanceUtils,
  TestLogger
} = require('../utils/testUtils');

const { SAMPLE_FEATURES } = require('../fixtures/sampleData');

describe('Feature Management Unit Tests', () => {
  let testAgentId;

  beforeEach(async () => {
    testAgentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(testAgentId);
  });

  test('should generate unique feature IDs', () => {
    const id1 = TestIdGenerator.generateFeatureId();
    const id2 = TestIdGenerator.generateFeatureId();

    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^feature-/);
    expect(id2).toMatch(/^feature-/);
  });

  test('should create valid test data', () => {
    const feature = TestDataFactory.createFeatureData({
      category: 'bug-fix',
      priority: 'high'
    });

    expect(feature.title).toBeDefined();
    expect(feature.description).toBeDefined();
    expect(feature.business_value).toBeDefined();
    expect(feature.category).toBe('bug-fix');
    expect(feature.priority).toBe('high');
  });
});
```

### Advanced Unit Testing with Mocks
```javascript
describe('Feature Validation Logic', () => {
  test('should validate required fields', () => {
    const mockManager = getMockManager();
    const api = mockManager.taskManagerAPI;

    // Test missing title
    const invalidFeature1 = {
      description: 'Test description',
      business_value: 'Test value',
      category: 'enhancement'
    };

    const result1 = api.suggestFeature(invalidFeature1);
    expect(result1.success).toBe(false);
    expect(result1.error).toContain('title');

    // Test missing business_value
    const invalidFeature2 = {
      title: 'Test Feature',
      description: 'Test description',
      category: 'enhancement'
    };

    const result2 = api.suggestFeature(invalidFeature2);
    expect(result2.success).toBe(false);
    expect(result2.error).toContain('business_value');
  });

  test('should handle edge cases in feature data', () => {
    const edgeCases = [
      { title: '', description: 'desc', business_value: 'value', category: 'enhancement' },
      { title: 'a'.repeat(1000), description: 'desc', business_value: 'value', category: 'enhancement' },
      { title: 'Test', description: 'desc', business_value: 'value', category: 'invalid-category' }
    ];

    edgeCases.forEach((feature, index) => {
      const result = mockManager.taskManagerAPI.suggestFeature(feature);
      expect(result.success).toBe(false);
      TestLogger.debug(`Edge case ${index + 1} handled correctly`, { feature, result });
    });
  });
});
```

## 🔗 Integration Test Examples

### API Workflow Integration Testing
```javascript
const { TestEnvironment } = require('../utils/testUtils');

describe('Feature Management API Integration', () => {
  let testEnvironment;

  beforeEach(async () => {
    testEnvironment = new TestEnvironment('api-integration-test');
    testEnvironment.setup();
  });

  afterEach(() => {
    testEnvironment.cleanup();
  });

  test('should handle concurrent feature operations', async () => {
    const agentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(agentId);

    // Create multiple features concurrently
    const featurePromises = Array.from({ length: 5 }, (_, i) =>
      APIExecutor.createTestFeature(TestDataFactory.createFeatureData({
        title: `Concurrent Feature ${i + 1}`,
        category: 'enhancement'
      }))
    );

    const results = await Promise.all(featurePromises);

    // All operations should succeed
    results.forEach((result, index) => {
      expect(result.success).toBe(true);
      expect(result.feature.title).toBe(`Concurrent Feature ${index + 1}`);
    });

    // Verify all features are persisted
    const listResult = await APIExecutor.execAPI('list-features');
    expect(listResult.features.length).toBeGreaterThanOrEqual(5);
  });

  test('should maintain data consistency across operations', async () => {
    const agentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(agentId);

    // Create feature
    const featureData = TestDataFactory.createFeatureData();
    const createResult = await APIExecutor.createTestFeature(featureData);
    expect(createResult.success).toBe(true);

    // Approve feature
    const approvalResult = await APIExecutor.execAPI('approve-feature', [
      createResult.feature.id,
      JSON.stringify({ approved_by: 'integration-test' })
    ]);
    expect(approvalResult.success).toBe(true);

    // Read from file system to verify persistence
    const featuresData = testEnvironment.readFeatures();
    const persistedFeature = featuresData.features.find(f => f.id === createResult.feature.id);

    expect(persistedFeature).toBeDefined();
    expect(persistedFeature.status).toBe('approved');
    expect(persistedFeature.approved_by).toBe('integration-test');
  });
});
```

### File System Integration Testing
```javascript
describe('File System Integration', () => {
  test('should handle file locking correctly', async () => {
    const testEnv1 = new TestEnvironment('lock-test-1');
    const testEnv2 = new TestEnvironment('lock-test-2');

    testEnv1.setup();
    testEnv2.setup();

    // Simulate concurrent access to same features file
    const agent1 = TestIdGenerator.generateAgentId();
    const agent2 = TestIdGenerator.generateAgentId();

    await Promise.all([
      APIExecutor.initializeTestAgent(agent1),
      APIExecutor.initializeTestAgent(agent2)
    ]);

    // Create features concurrently from different agents
    const [result1, result2] = await Promise.all([
      APIExecutor.createTestFeature(TestDataFactory.createFeatureData({ title: 'Feature 1' })),
      APIExecutor.createTestFeature(TestDataFactory.createFeatureData({ title: 'Feature 2' }))
    ]);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true);
    expect(result1.feature.id).not.toBe(result2.feature.id);

    testEnv1.cleanup();
    testEnv2.cleanup();
  });
});
```

## 🎭 End-to-End Test Examples

### Complete Feature Workflow E2E
```javascript
const { E2EEnvironment, CommandExecutor } = require('./e2e-utils');

describe('Complete Feature Management E2E', () => {
  let environment;

  beforeEach(async () => {
    environment = new E2EEnvironment('feature-e2e');
    await environment.setup();
  });

  afterEach(async () => {
    await environment.cleanup();
  });

  test('should complete full feature lifecycle with real API calls', async () => {
    // Initialize agent
    const agentId = 'e2e-test-agent';
    const initResult = await CommandExecutor.execute(environment, 'initialize', [agentId]);
    expect(initResult.success).toBe(true);

    // Suggest feature
    const featureData = {
      title: 'E2E Test Feature',
      description: 'Complete end-to-end test feature for validation',
      business_value: 'Validates the entire feature management system',
      category: 'enhancement'
    };

    const suggestResult = await CommandExecutor.execute(environment, 'suggest-feature', [
      JSON.stringify(featureData)
    ]);
    expect(suggestResult.success).toBe(true);
    expect(suggestResult.feature.status).toBe('suggested');

    // List features
    const listResult = await CommandExecutor.execute(environment, 'list-features');
    expect(listResult.success).toBe(true);
    expect(listResult.features.some(f => f.id === suggestResult.feature.id)).toBe(true);

    // Approve feature
    const approveResult = await CommandExecutor.execute(environment, 'approve-feature', [
      suggestResult.feature.id,
      JSON.stringify({ approved_by: 'e2e-test', notes: 'E2E approval test' })
    ]);
    expect(approveResult.success).toBe(true);
    expect(approveResult.feature.status).toBe('approved');

    // Verify persistence by reading file directly
    const featuresFile = await environment.readFeaturesFile();
    const approvedFeature = featuresFile.features.find(f => f.id === suggestResult.feature.id);
    expect(approvedFeature.status).toBe('approved');
    expect(approvedFeature.approved_by).toBe('e2e-test');
  }, 30000);

  test('should handle error scenarios gracefully', async () => {
    // Test invalid command
    const invalidResult = await CommandExecutor.execute(environment, 'invalid-command');
    expect(invalidResult.success).toBe(false);
    expect(invalidResult.error).toContain('Unknown command');

    // Test feature approval without initialization
    const approvalResult = await CommandExecutor.execute(environment, 'approve-feature', [
      'non-existent-feature',
      JSON.stringify({ approved_by: 'test' })
    ]);
    expect(approvalResult.success).toBe(false);
  });
});
```

### Multi-Agent E2E Scenarios
```javascript
describe('Multi-Agent E2E Scenarios', () => {
  test('should handle multiple agents working simultaneously', async () => {
    const agents = ['agent-1', 'agent-2', 'agent-3'];
    const environment = new E2EEnvironment('multi-agent');
    await environment.setup();

    // Initialize all agents
    await Promise.all(agents.map(agentId =>
      CommandExecutor.execute(environment, 'initialize', [agentId])
    ));

    // Each agent suggests a feature
    const suggestions = await Promise.all(agents.map((agentId, index) =>
      CommandExecutor.execute(environment, 'suggest-feature', [
        JSON.stringify({
          title: `Feature from ${agentId}`,
          description: `Feature suggested by ${agentId}`,
          business_value: `Value from ${agentId}`,
          category: 'enhancement'
        })
      ])
    ));

    // All suggestions should succeed
    suggestions.forEach(result => {
      expect(result.success).toBe(true);
    });

    // List all features
    const listResult = await CommandExecutor.execute(environment, 'list-features');
    expect(listResult.features.length).toBeGreaterThanOrEqual(3);

    await environment.cleanup();
  }, 45000);
});
```

## 🔌 API Testing Patterns

### TaskManager API Testing
```javascript
describe('TaskManager API Testing Patterns', () => {
  test('should test all API endpoints', async () => {
    const endpoints = [
      { command: 'initialize', args: ['test-agent'] },
      { command: 'suggest-feature', args: [JSON.stringify(TestDataFactory.createFeatureData())] },
      { command: 'list-features', args: [] },
      { command: 'feature-stats', args: [] },
      { command: 'get-initialization-stats', args: [] },
      { command: 'guide', args: [] },
      { command: 'methods', args: [] }
    ];

    for (const endpoint of endpoints) {
      const result = await APIExecutor.execAPI(endpoint.command, endpoint.args);
      expect(result).toBeDefined();
      TestLogger.debug(`Endpoint ${endpoint.command} tested`, { result });
    }
  });

  test('should validate API response formats', async () => {
    const agentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(agentId);

    // Test feature creation response format
    const featureData = TestDataFactory.createFeatureData();
    const result = await APIExecutor.createTestFeature(featureData);

    expect(result).toHaveProperty('success');
    expect(result).toHaveProperty('feature');
    expect(result.feature).toHaveProperty('id');
    expect(result.feature).toHaveProperty('title');
    expect(result.feature).toHaveProperty('status');
    expect(result.feature).toHaveProperty('created_at');
  });

  test('should handle API errors consistently', async () => {
    // Test various error scenarios
    const errorScenarios = [
      { command: 'suggest-feature', args: ['invalid-json'], expectedError: 'JSON' },
      { command: 'approve-feature', args: ['non-existent'], expectedError: 'not found' },
      { command: 'invalid-command', args: [], expectedError: 'Unknown command' }
    ];

    for (const scenario of errorScenarios) {
      const result = await APIExecutor.execAPI(scenario.command, scenario.args);
      expect(result.success).toBe(false);
      expect(result.error).toContain(scenario.expectedError);
    }
  });
});
```

### API Performance Testing
```javascript
describe('API Performance', () => {
  test('should meet performance benchmarks', async () => {
    const agentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(agentId);

    // Test feature creation performance
    const { result, duration } = await PerformanceUtils.measureTime(async () => {
      return await APIExecutor.createTestFeature(TestDataFactory.createFeatureData());
    });

    expect(result.success).toBe(true);
    expect(duration).toBeLessThan(1000); // Should complete within 1 second

    // Test bulk operations performance
    const bulkFeatures = Array.from({ length: 10 }, () =>
      TestDataFactory.createFeatureData()
    );

    const { result: bulkResult, duration: bulkDuration } = await PerformanceUtils.measureTime(async () => {
      return await Promise.all(bulkFeatures.map(feature =>
        APIExecutor.createTestFeature(feature)
      ));
    });

    expect(bulkResult.every(r => r.success)).toBe(true);
    expect(bulkDuration).toBeLessThan(5000); // Bulk operations within 5 seconds
  });
});
```

## 🎭 Mock Usage Examples

### Comprehensive Mock Setup
```javascript
const { setupMocks, resetMocks, getMockManager } = require('../mocks/mockSetup');

describe('Advanced Mock Usage', () => {
  let mockManager;

  beforeAll(() => {
    mockManager = setupMocks();
  });

  beforeEach(() => {
    resetMocks();
  });

  test('should mock complex API interactions', () => {
    const api = mockManager.taskManagerAPI;

    // Create a feature
    const feature = TestDataFactory.createFeatureData();
    const createResult = api.suggestFeature(feature);
    expect(createResult.success).toBe(true);

    // Mock approval process
    const approvalResult = api.approveFeature(createResult.feature.id, {
      approved_by: 'test-approver',
      notes: 'Mock approval'
    });
    expect(approvalResult.success).toBe(true);
    expect(approvalResult.feature.status).toBe('approved');

    // Verify mock state
    const allFeatures = api.listFeatures();
    expect(allFeatures.features.some(f =>
      f.id === createResult.feature.id && f.status === 'approved'
    )).toBe(true);
  });

  test('should mock file system operations', () => {
    const fs = mockManager.fileSystem;

    // Test file operations
    const testPath = '/test-project/test-file.json';
    const testData = { test: 'data' };

    fs.writeFileSync(testPath, JSON.stringify(testData));
    expect(fs.existsSync(testPath)).toBe(true);

    const readData = JSON.parse(fs.readFileSync(testPath, 'utf8'));
    expect(readData).toEqual(testData);

    fs.unlinkSync(testPath);
    expect(fs.existsSync(testPath)).toBe(false);
  });
});
```

### Mock Validation and Verification
```javascript
describe('Mock Validation', () => {
  test('should track and validate mock interactions', () => {
    const mockManager = getMockManager();
    const api = mockManager.taskManagerAPI;

    // Perform operations
    const feature1 = api.suggestFeature(TestDataFactory.createFeatureData({ title: 'Feature 1' }));
    const feature2 = api.suggestFeature(TestDataFactory.createFeatureData({ title: 'Feature 2' }));
    api.approveFeature(feature1.feature.id, { approved_by: 'tester' });

    // Validate interactions
    const history = getAPICallHistory();
    expect(history.features).toHaveLength(2);
    expect(history.features[0].status).toBe('approved');
    expect(history.features[1].status).toBe('suggested');
  });

  test('should provide detailed mock inspection', () => {
    const mockManager = getMockManager();

    // Inspect mock state
    const mocks = mockManager.getMocks();
    expect(mocks.taskManagerAPI).toBeDefined();
    expect(mocks.fileSystem).toBeDefined();
    expect(mocks.httpClient).toBeDefined();
    expect(mocks.database).toBeDefined();

    // Verify mock capabilities
    expect(typeof mocks.taskManagerAPI.suggestFeature).toBe('function');
    expect(typeof mocks.fileSystem.readFileSync).toBe('function');
  });
});
```

## 📊 Test Data Management

### Test Data Factory Patterns
```javascript
describe('Test Data Management', () => {
  test('should create consistent test data', () => {
    // Basic feature data
    const basicFeature = TestDataFactory.createFeatureData();
    expect(basicFeature.title).toBeDefined();
    expect(basicFeature.category).toBe('enhancement'); // default

    // Customized feature data
    const customFeature = TestDataFactory.createFeatureData({
      category: 'bug-fix',
      priority: 'critical',
      tags: ['urgent', 'security']
    });
    expect(customFeature.category).toBe('bug-fix');
    expect(customFeature.priority).toBe('critical');
    expect(customFeature.tags).toEqual(['urgent', 'security']);
  });

  test('should generate realistic test scenarios', () => {
    const scenarios = [
      { category: 'enhancement', complexity: 'low' },
      { category: 'bug-fix', priority: 'high' },
      { category: 'new-feature', estimated_hours: 40 },
      { category: 'security', priority: 'critical' }
    ];

    scenarios.forEach(scenario => {
      const feature = TestDataFactory.createFeatureData(scenario);
      expect(feature.category).toBe(scenario.category);
      Object.keys(scenario).forEach(key => {
        if (key !== 'category') {
          expect(feature[key]).toBe(scenario[key]);
        }
      });
    });
  });
});
```

### Sample Data Usage
```javascript
describe('Sample Data Usage', () => {
  test('should utilize predefined sample data', () => {
    const { SAMPLE_FEATURES, SAMPLE_AGENTS } = require('../fixtures/sampleData');

    // Test with sample features
    Object.values(SAMPLE_FEATURES).forEach(sampleFeature => {
      const result = mockManager.taskManagerAPI.suggestFeature(sampleFeature);
      expect(result.success).toBe(true);
      expect(result.feature.category).toBe(sampleFeature.category);
    });

    // Test with sample agents
    Object.values(SAMPLE_AGENTS).forEach(sampleAgent => {
      const result = mockManager.taskManagerAPI.initialize(sampleAgent.id);
      expect(result.success).toBe(true);
      expect(result.agent.id).toBe(sampleAgent.id);
    });
  });
});
```

## ⚡ Performance Testing

### Performance Benchmarking
```javascript
describe('Performance Testing', () => {
  test('should benchmark critical operations', async () => {
    const benchmarks = {
      featureCreation: 500, // ms
      featureApproval: 300,
      featureListing: 200,
      bulkOperations: 2000
    };

    const agentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(agentId);

    // Benchmark feature creation
    const { duration: createDuration } = await PerformanceUtils.measureTime(async () => {
      return await APIExecutor.createTestFeature(TestDataFactory.createFeatureData());
    });
    expect(createDuration).toBeLessThan(benchmarks.featureCreation);

    // Benchmark feature listing
    const { duration: listDuration } = await PerformanceUtils.measureTime(async () => {
      return await APIExecutor.execAPI('list-features');
    });
    expect(listDuration).toBeLessThan(benchmarks.featureListing);
  });

  test('should monitor memory usage', async () => {
    const { memoryDelta } = await PerformanceUtils.measureMemory(async () => {
      // Create many features to test memory usage
      const features = Array.from({ length: 100 }, () =>
        TestDataFactory.createFeatureData()
      );

      return await Promise.all(features.map(feature =>
        APIExecutor.createTestFeature(feature)
      ));
    });

    // Memory usage should be reasonable
    expect(memoryDelta.heapUsed).toBeLessThan(50 * 1024 * 1024); // 50MB
    TestLogger.info('Memory usage measured', memoryDelta);
  });
});
```

### Load Testing
```javascript
describe('Load Testing', () => {
  test('should handle concurrent requests', async () => {
    const concurrentRequests = 20;
    const agentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(agentId);

    const requests = Array.from({ length: concurrentRequests }, (_, i) =>
      APIExecutor.createTestFeature(TestDataFactory.createFeatureData({
        title: `Concurrent Feature ${i + 1}`
      }))
    );

    const { results, duration } = await PerformanceUtils.measureTime(async () => {
      return await Promise.all(requests);
    });

    // All requests should succeed
    expect(results.every(r => r.success)).toBe(true);
    expect(duration).toBeLessThan(10000); // Complete within 10 seconds

    TestLogger.info('Load test completed', {
      concurrentRequests,
      duration,
      avgDurationPerRequest: duration / concurrentRequests
    });
  });
});
```

## 🚨 Error Handling and Edge Cases

### Error Scenario Testing
```javascript
describe('Error Handling', () => {
  test('should handle validation errors gracefully', async () => {
    const invalidFeatures = [
      { title: '', description: 'desc', business_value: 'value' },
      { title: 'title', description: '', business_value: 'value' },
      { title: 'title', description: 'desc', business_value: '' },
      { title: 'title', description: 'desc', business_value: 'value', category: 'invalid' }
    ];

    for (const invalidFeature of invalidFeatures) {
      const result = await APIExecutor.createTestFeature(invalidFeature);
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      TestLogger.debug('Validation error handled', { invalidFeature, error: result.error });
    }
  });

  test('should handle system errors', async () => {
    // Test network timeout simulation
    jest.setTimeout(15000);

    await expect(
      TestExecution.withTimeout(
        new Promise(() => {}), // Never resolves
        1000
      )
    ).rejects.toThrow('timed out');

    // Test retry mechanism
    let attempts = 0;
    const result = await TestExecution.retry(async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return 'success';
    }, 5, 10);

    expect(result).toBe('success');
    expect(attempts).toBe(3);
  });

  test('should handle edge cases in feature management', async () => {
    const agentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(agentId);

    // Test duplicate feature handling
    const feature = TestDataFactory.createFeatureData({ title: 'Duplicate Test' });
    const result1 = await APIExecutor.createTestFeature(feature);
    const result2 = await APIExecutor.createTestFeature(feature);

    expect(result1.success).toBe(true);
    expect(result2.success).toBe(true); // Should allow duplicates with different IDs
    expect(result1.feature.id).not.toBe(result2.feature.id);
  });
});
```

### Boundary Testing
```javascript
describe('Boundary Testing', () => {
  test('should handle data size limits', async () => {
    const boundaryTests = [
      { title: 'a', description: 'min', business_value: 'b' },
      { title: 'a'.repeat(100), description: 'b'.repeat(500), business_value: 'c'.repeat(200) },
      { title: 'a'.repeat(1000), description: 'b'.repeat(5000), business_value: 'c'.repeat(2000) }
    ];

    for (const test of boundaryTests) {
      const result = await APIExecutor.createTestFeature(test);
      // Should handle various sizes appropriately
      if (test.title.length > 500) {
        expect(result.success).toBe(false);
      } else {
        expect(result.success).toBe(true);
      }
    }
  });
});
```

## 📝 Best Practices and Patterns

### Test Organization Best Practices
```javascript
describe('Best Practice Examples', () => {
  // Use descriptive test names that explain behavior
  test('should create feature with valid data and return success response', async () => {
    // Arrange - Set up test data and environment
    const agentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(agentId);
    const featureData = TestDataFactory.createFeatureData({
      title: 'Well-structured Test Feature',
      category: 'enhancement'
    });

    // Act - Perform the operation being tested
    const result = await APIExecutor.createTestFeature(featureData);

    // Assert - Verify the expected outcomes
    expect(result.success).toBe(true);
    expect(result.feature.title).toBe(featureData.title);
    expect(result.feature.status).toBe('suggested');
    expect(result.feature.id).toMatch(/^feature_/);
  });

  // Group related tests logically
  describe('when feature is in suggested status', () => {
    let suggestedFeature;

    beforeEach(async () => {
      const agentId = TestIdGenerator.generateAgentId();
      await APIExecutor.initializeTestAgent(agentId);
      const result = await APIExecutor.createTestFeature(TestDataFactory.createFeatureData());
      suggestedFeature = result.feature;
    });

    test('should allow approval', async () => {
      const result = await APIExecutor.execAPI('approve-feature', [
        suggestedFeature.id,
        JSON.stringify({ approved_by: 'test-approver' })
      ]);
      expect(result.success).toBe(true);
      expect(result.feature.status).toBe('approved');
    });

    test('should allow rejection', async () => {
      const result = await APIExecutor.execAPI('reject-feature', [
        suggestedFeature.id,
        JSON.stringify({ rejected_by: 'test-approver', reason: 'Test rejection' })
      ]);
      expect(result.success).toBe(true);
      expect(result.feature.status).toBe('rejected');
    });
  });
});
```

### Custom Matchers
```javascript
// Custom matchers for better assertions
expect.extend({
  toBeValidFeature(received) {
    const requiredFields = ['id', 'title', 'description', 'business_value', 'category', 'status'];
    const validStatuses = ['suggested', 'approved', 'rejected', 'implemented'];
    const validCategories = ['enhancement', 'bug-fix', 'new-feature', 'performance', 'security', 'documentation'];

    const missingFields = requiredFields.filter(field => !received[field]);

    if (missingFields.length > 0) {
      return {
        message: () => `Expected feature to have required fields: ${missingFields.join(', ')}`,
        pass: false
      };
    }

    if (!validStatuses.includes(received.status)) {
      return {
        message: () => `Expected feature status to be one of: ${validStatuses.join(', ')}, got: ${received.status}`,
        pass: false
      };
    }

    if (!validCategories.includes(received.category)) {
      return {
        message: () => `Expected feature category to be one of: ${validCategories.join(', ')}, got: ${received.category}`,
        pass: false
      };
    }

    return {
      message: () => 'Feature is valid',
      pass: true
    };
  },

  toBeSuccessfulAPIResponse(received) {
    if (!received || typeof received !== 'object') {
      return {
        message: () => 'Expected API response to be an object',
        pass: false
      };
    }

    if (received.success !== true) {
      return {
        message: () => `Expected successful API response, got: ${JSON.stringify(received)}`,
        pass: false
      };
    }

    return {
      message: () => 'API response is successful',
      pass: true
    };
  }
});

// Usage of custom matchers
test('should return valid feature from API', async () => {
  const result = await APIExecutor.createTestFeature(TestDataFactory.createFeatureData());

  expect(result).toBeSuccessfulAPIResponse();
  expect(result.feature).toBeValidFeature();
});
```

### Test Cleanup and Resource Management
```javascript
describe('Resource Management', () => {
  let resources = [];

  afterEach(async () => {
    // Clean up all resources created during tests
    await Promise.all(resources.map(resource => resource.cleanup()));
    resources = [];
  });

  test('should manage test resources properly', async () => {
    const environment = new TestEnvironment('resource-test');
    resources.push(environment);

    environment.setup();

    // Use environment for testing
    const featuresData = environment.readFeatures();
    expect(featuresData).toBeDefined();

    // Resource will be cleaned up automatically in afterEach
  });
});
```

## 📚 Summary and Quick Reference

### Key Testing Patterns

1. **Arrange-Act-Assert**: Structure all tests with clear setup, execution, and verification phases
2. **Descriptive Names**: Use test names that explain the expected behavior
3. **Isolated Tests**: Each test should be independent and not rely on others
4. **Mock Strategy**: Use mocks for external dependencies, real implementations for integration tests
5. **Performance Awareness**: Include performance assertions in critical path tests
6. **Error Testing**: Always test both success and failure scenarios

### Essential Utilities

- **TestIdGenerator**: Generate unique test identifiers
- **APIExecutor**: Execute API calls with proper mocking
- **TestDataFactory**: Create consistent test data
- **PerformanceUtils**: Measure performance and memory usage
- **TestEnvironment**: Manage isolated test environments
- **MockManager**: Comprehensive mock framework

### Common Test Scenarios

1. **Feature Lifecycle**: Create → List → Approve → Verify
2. **Error Handling**: Invalid data → Validation errors → Graceful handling
3. **Concurrency**: Multiple operations → Data consistency → Performance
4. **Integration**: API → File System → Data persistence
5. **Edge Cases**: Boundary values → Unusual inputs → System limits

This comprehensive testing guide provides the foundation for effective testing of the infinite-continue-stop-hook codebase, with particular emphasis on the FEATURES.json management system. Follow these patterns and examples to create robust, maintainable tests that ensure system reliability and quality.
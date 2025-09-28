# Testing Infrastructure Guide

**Comprehensive testing framework for the infinite-continue-stop-hook project**

_Author: Testing Infrastructure Agent_
_Version: 2.0.0_
_Date: 2025-09-23_

## 🎯 Overview

This project implements a robust, scalable testing infrastructure supporting unit, integration, and end-to-end testing with comprehensive mocking, fixtures, and reporting capabilities.

## 📋 Table of Contents

- [Quick Start](#quick-start)
- [Testing Architecture](#testing-architecture)
- [Test Categories](#test-categories)
- [Running Tests](#running-tests)
- [Writing Tests](#writing-tests)
- [Mock Framework](#mock-framework)
- [Test Utilities](#test-utilities)
- [Coverage Reporting](#coverage-reporting)
- [Best Practices](#best-practices)
- [Troubleshooting](#troubleshooting)

## 🚀 Quick Start

### Prerequisites

- Node.js 18.0.0 or higher
- Jest 30.1.3 or higher
- All project dependencies installed (`npm install`)

### Running Basic Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run with coverage
npm run coverage

# Run specific test file
npm run test:unit test/unit/basic-infrastructure.test.js
```

### Project Structure

```
test/
├── unit/                     # Unit tests
├── integration/              # Integration tests
├── e2e/                      # End-to-end tests
├── fixtures/                 # Test data and samples
├── mocks/                    # Mock implementations
├── utils/                    # Testing utilities
├── setup.js                  # Jest setup configuration
├── globalSetup.js           # Global test initialization
└── README.md                # This documentation
```

## 🏗️ Testing Architecture

### Configuration Files

- **`jest.config.js`**: Main Jest configuration with projects setup
- **`test/setup.js`**: Global test setup with custom matchers
- **`test/globalSetup.js`**: One-time setup before all tests

### Key Components

1. **Test Utilities** (`test/utils/testUtils.js`)
   - ID generators, data factories, performance utils
   - Test execution helpers (timeout, retry, parallel)
   - Enhanced logging and assertions

2. **Mock Framework** (`test/mocks/`)
   - API mocks for TaskManager operations
   - File system mocks for safe testing
   - HTTP client and database mocks

3. **Test Fixtures** (`test/fixtures/sampleData.js`)
   - Consistent test data across suites
   - Sample features, agents, projects, tasks
   - Error scenarios and test configurations

## 🧪 Test Categories

### Unit Tests (`test/unit/`)

Test individual functions and modules in isolation.

**Characteristics:**

- Fast execution (< 5 seconds)
- No external dependencies
- Comprehensive mocking
- High code coverage focus

**Examples:**

```bash
npm run test:unit:features     # Feature management tests
npm run test:unit:agents       # Agent management tests
npm run test:unit:stats        # Statistics tests
```

### Integration Tests (`test/integration/`)

Test component interactions and workflows.

**Characteristics:**

- Medium execution time (< 45 seconds)
- Real API calls (with test data)
- File system operations
- Cross-module testing

**Examples:**

```bash
npm run test:integration:api        # API workflow tests
npm run test:integration:files      # File operation tests
npm run test:integration:features   # Feature lifecycle tests
```

### End-to-End Tests (`test/e2e/`)

Test complete user scenarios and system workflows.

**Characteristics:**

- Longer execution time (< 60 seconds)
- Full system testing
- Real external services (when safe)
- User scenario validation

**Examples:**

```bash
npm run test:e2e:complete-workflows
npm run test:e2e:multi-agent
npm run test:e2e:feature-management
```

## 🏃 Running Tests

### Basic Commands

```bash
# Quick tests (essential only)
npm run test:quick

# All unit tests
npm run test:unit

# All integration tests
npm run test:integration

# All end-to-end tests
npm run test:e2e

# Watch mode (re-run on changes)
npm run test:unit:watch
```

### Coverage Commands

```bash
# Basic coverage report
npm run coverage

# HTML coverage report (opens browser)
npm run coverage:html

# CI-friendly coverage
npm run coverage:ci

# Coverage with threshold checking
npm run coverage:check
```

### Advanced Commands

```bash
# Performance testing
npm run test:e2e:performance

# Stress testing
npm run test:integration:stress

# Specific test patterns
npx jest --testNamePattern="should create feature"
npx jest test/unit --verbose
```

## ✍️ Writing Tests

### Basic Test Structure

```javascript
const { TestIdGenerator, APIExecutor, TestDataFactory } = require('@utils/testUtils');
const { SAMPLE_FEATURES } = require('@fixtures/sampleData');

describe('My Feature', () => {
  let testAgentId;

  beforeEach(async () => {
    testAgentId = TestIdGenerator.generateAgentId();
    await APIExecutor.initializeTestAgent(testAgentId);
  });

  test('should perform expected behavior', async () => {
    // Arrange
    const testData = TestDataFactory.createFeatureData({
      title: 'Test Feature',
      category: 'enhancement',
    });

    // Act
    const result = await APIExecutor.createTestFeature(testData);

    // Assert
    expect(result).toBeSuccessfulAPIResponse();
    expect(result.feature.title).toBe(testData.title);
  });
});
```

### Using Test Utilities

```javascript
// ID Generation
const agentId = TestIdGenerator.generateAgentId();
const featureId = TestIdGenerator.generateFeatureId();

// Data Creation
const feature = TestDataFactory.createFeatureData({
  category: 'bug-fix',
  priority: 'high',
});

// Performance Testing
const { result, duration } = await PerformanceUtils.measureTime(async () => {
  return await someExpensiveOperation();
});

// Retry Logic
const result = await TestExecution.retry(
  async () => {
    return await unreliableOperation();
  },
  3,
  1000
);
```

### Custom Matchers

```javascript
// API Response Validation
expect(response).toBeSuccessfulAPIResponse();
expect(response).toBeErrorAPIResponse();

// Feature Validation
expect(feature).toBeValidFeature();

// Use global test utilities
await global.testUtils.expectEventually(async () => {
  const status = await checkStatus();
  expect(status).toBe('completed');
});
```

## 🎭 Mock Framework

### Automatic Mocking

The mock framework automatically intercepts API calls and file operations during tests:

```javascript
const { setupMocks, resetMocks, restoreMocks } = require('@mocks/mockSetup');

beforeAll(() => setupMocks());
afterAll(() => restoreMocks());
beforeEach(() => resetMocks());
```

### Manual Mock Usage

```javascript
const { TaskManagerAPIMock } = require('@mocks/apiMocks');

test('should handle API responses', () => {
  const apiMock = new TaskManagerAPIMock();

  // Create test feature
  const result = apiMock.suggestFeature({
    title: 'Test Feature',
    description: 'Test description',
    business_value: 'Test value',
    category: 'enhancement',
  });

  expect(result.success).toBe(true);
  expect(result.feature.status).toBe('suggested');
});
```

### Mock Validation

```javascript
const { expectFeatureCreated, expectAgentInitialized } = require('@mocks/mockSetup');

test('should create feature in mock', async () => {
  const featureData = { title: 'Test Feature' /* ... */ };
  await APIExecutor.createTestFeature(featureData);

  // Validate mock state
  expectFeatureCreated(featureData);
});
```

## 🛠️ Test Utilities

### Test Environment Management

```javascript
const { TestEnvironment } = require('@utils/testUtils');

test('should manage test environment', () => {
  const env = new TestEnvironment('my-test');
  const projectDir = env.setup();

  // Use projectDir for test operations

  env.cleanup(); // Clean up after test
});
```

### Performance Monitoring

```javascript
// Enable performance monitoring
process.env.MONITOR_TEST_PERFORMANCE = 'true';

// Automatic monitoring will log slow tests
// Manual monitoring
const { result, memoryDelta } = await PerformanceUtils.measureMemory(async () => {
  return await memoryIntensiveOperation();
});
```

### Debugging Support

```javascript
// Enable debug logging
process.env.TEST_DEBUG = 'true';

// Use TestLogger for consistent output
TestLogger.debug('Debug message', { data });
TestLogger.info('Info message');
TestLogger.warn('Warning message');
TestLogger.error('Error message');
```

## 📊 Coverage Reporting

### Coverage Configuration

Coverage is configured to:

- Collect from main source files (`*.js`, `lib/**/*.js`)
- Exclude test files, node_modules, config files
- Use v8 provider for accuracy
- Generate multiple report formats

### Coverage Thresholds

```
Global Thresholds:
- Branches: 75%
- Functions: 80%
- Lines: 80%
- Statements: 80%

Critical Modules:
- taskmanager-api.js: 70%+ branches, 75%+ functions/lines/statements
- lib/: 80%+ branches, 85%+ functions/lines/statements
```

### Coverage Commands

```bash
# Generate coverage report
npm run coverage

# Open HTML report in browser
npm run coverage:html

# Generate specific formats
npm run coverage:json
npm run coverage:lcov

# Check against thresholds
npm run coverage:check
```

## 📝 Best Practices

### Test Organization

1. **Group Related Tests**: Use `describe` blocks to group related functionality
2. **Clear Test Names**: Use descriptive test names that explain expected behavior
3. **Arrange-Act-Assert**: Structure tests with clear sections
4. **One Assertion Per Test**: Focus each test on a single behavior

### Test Data Management

1. **Use Factories**: Prefer `TestDataFactory` over hardcoded data
2. **Consistent Fixtures**: Use `SAMPLE_DATA` for consistent test scenarios
3. **Clean State**: Reset state between tests
4. **Realistic Data**: Use realistic but safe test data

### Mock Strategy

1. **Selective Mocking**: Mock only what's necessary for isolation
2. **Behavior Verification**: Test both success and failure scenarios
3. **Mock Validation**: Verify mock interactions when important
4. **Real Integration**: Use real components for integration tests

### Performance Considerations

1. **Fast Unit Tests**: Keep unit tests under 5 seconds
2. **Parallel Execution**: Use Jest's parallel execution effectively
3. **Resource Cleanup**: Clean up resources in `afterEach`/`afterAll`
4. **Memory Management**: Monitor memory usage in long-running tests

### Error Handling

1. **Test Error Paths**: Include tests for error scenarios
2. **Meaningful Messages**: Use descriptive error messages
3. **Expected Errors**: Test expected errors explicitly
4. **Async Errors**: Properly handle async error cases

### Maintainability

1. **DRY Principle**: Extract common test logic to utilities
2. **Documentation**: Document complex test scenarios
3. **Version Control**: Commit test changes with feature changes
4. **Regular Updates**: Keep tests updated with code changes

## 🐛 Troubleshooting

### Common Issues

#### Tests Not Found

```bash
# Check file location matches Jest config
# Unit tests should be in test/unit/
# Integration tests should be in test/integration/
mv test/my-test.js test/unit/my-test.js
```

#### Mock Issues

```bash
# Reset mocks if state is contaminated
beforeEach(() => {
  jest.clearAllMocks();
  resetMocks();
});
```

#### Timeout Issues

```bash
# Increase timeout for slow tests
jest.setTimeout(60000);

# Or use environment variable
JEST_TIMEOUT=60000 npm test
```

#### Memory Issues

```bash
# Enable garbage collection
node --expose-gc --max-old-space-size=4096 node_modules/.bin/jest

# Or set in environment
NODE_OPTIONS="--max-old-space-size=4096" npm test
```

### Debug Commands

```bash
# Run with debug output
TEST_DEBUG=true npm test

# Run single test with full output
npx jest test/unit/my-test.js --verbose --no-coverage

# Check for open handles
npx jest --detectOpenHandles

# Performance monitoring
MONITOR_TEST_PERFORMANCE=true npm test
```

### Configuration Validation

```bash
# Validate Jest configuration
npx jest --showConfig

# Check test file matching
npx jest --listTests

# Verify coverage collection
npx jest --coverage --passWithNoTests
```

## 📚 Reference

### File Structure Reference

```
test/
├── unit/                           # Unit tests
│   ├── basic-infrastructure.test.js
│   ├── feature-management-system.test.js
│   └── example-with-mocks.test.js
├── integration/                    # Integration tests
├── e2e/                           # End-to-end tests
├── fixtures/                      # Test data
│   └── sampleData.js
├── mocks/                         # Mock implementations
│   ├── apiMocks.js
│   └── mockSetup.js
├── utils/                         # Test utilities
│   └── testUtils.js
├── setup.js                      # Jest setup
├── globalSetup.js                # Global setup
└── README.md                     # This guide
```

### Key Classes and Functions

**TestUtils:**

- `TestIdGenerator`: Generate unique test IDs
- `APIExecutor`: Execute API calls with mocking
- `TestEnvironment`: Manage test environments
- `TestDataFactory`: Create test data
- `PerformanceUtils`: Measure performance
- `TestExecution`: Retry, timeout, parallel execution

**Mocks:**

- `TaskManagerAPIMock`: Mock TaskManager API
- `FileSystemMock`: Mock file operations
- `HTTPClientMock`: Mock HTTP requests
- `DatabaseMock`: Mock database operations

**Sample Data:**

- `SAMPLE_FEATURES`: Feature test data
- `SAMPLE_AGENTS`: Agent test data
- `SAMPLE_PROJECTS`: Project configurations
- `TEST_CONFIGURATIONS`: Test settings

### Environment Variables

```bash
NODE_ENV=test                    # Test environment
TEST_DEBUG=true                  # Enable debug logging
MONITOR_TEST_PERFORMANCE=true    # Performance monitoring
JEST_TIMEOUT=30000              # Test timeout
COVERAGE=true                   # Enable coverage
VERBOSE=true                    # Verbose output
CI=true                         # CI environment optimizations
```

## 🤝 Contributing

When adding new tests:

1. Follow the established patterns and conventions
2. Add appropriate mocks for external dependencies
3. Include both success and error test cases
4. Update documentation for new utilities or patterns
5. Ensure tests pass in CI environment

## 📞 Support

For testing infrastructure questions:

1. Check this documentation first
2. Review existing test examples
3. Check Jest documentation for advanced features
4. Consider performance implications of test changes

---

_This testing infrastructure provides a solid foundation for reliable, maintainable, and scalable testing. Follow these guidelines to ensure consistent, high-quality test coverage across the project._

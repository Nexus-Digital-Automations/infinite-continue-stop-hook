# Comprehensive Test Execution and Troubleshooting Guide

**Project:** Infinite Continue Stop Hook TaskManager
**Version:** 2.0.0
**Last Updated:** 2025-09-23
**Created By:** Testing Infrastructure Agent

**Comprehensive guide for running, debugging, and troubleshooting tests in the infinite-continue-stop-hook project.**

---

## 📋 Table of Contents

1. [Test Framework Overview](#test-framework-overview)
2. [Quick Start](#quick-start)
3. [Test Execution Guide](#test-execution-guide)
4. [Debugging Tests](#debugging-tests)
5. [Common Troubleshooting](#common-troubleshooting)
6. [CI/CD Integration](#cicd-integration)
7. [Performance Testing](#performance-testing)
8. [Coverage Analysis](#coverage-analysis)
9. [Best Practices](#best-practices)

---

## 🧪 Test Framework Overview

### Framework Stack
- **Testing Framework**: Jest 30.1.3
- **Test Environment**: Node.js
- **Coverage Provider**: V8 (faster than babel)
- **Assertion Library**: Jest built-in with custom matchers
- **Test Types**: Unit, Integration, E2E, RAG System, Performance

### Project Structure
```
test/
├── setup.js                    # Global test setup
├── utils/                      # Test utilities and helpers
│   ├── testUtils.js            # Core testing utilities
│   └── ...
├── mocks/                      # Mock implementations
├── unit/                       # Unit tests
├── integration/                # Integration tests
├── e2e/                        # End-to-end tests
├── rag-system/                 # RAG system specific tests
│   ├── unit/
│   ├── integration/
│   └── performance/
└── fixtures/                   # Test data and fixtures
```

### Configuration Files
- `jest.config.js` - Main Jest configuration with projects
- `test/rag-system/jest.config.js` - RAG system specific config
- `test/e2e/jest.config.js` - E2E test configuration
- `test/setup.js` - Global test setup and utilities

---

## 🚀 Quick Start

### Prerequisites
```bash
# Ensure Node.js 18+ is installed
node --version

# Install dependencies
npm install

# Verify test environment
npm run test -- --version
```

### Run All Tests
```bash
# Complete test suite with coverage
npm test

# Quick test run without coverage
npm run test:quick
```

---

## 🚀 Test Execution Guide

### Core Test Commands
```bash
# Complete test suite with coverage reporting
npm test

# Run tests without coverage (faster)
npm run test:quick

# Run specific test file
npm test -- test/taskmanager-api-comprehensive.test.js

# Run tests matching pattern
npm test -- --testPathPattern="security"
```

#### Unit Tests
```bash
# All unit tests
npm run test:unit

# Specific unit test files
npm run test:unit:taskmanager
npm run test:unit:features
npm run test:unit:agents
npm run test:unit:stats

# Unit tests with coverage
npm run test:unit:coverage

# Watch mode for development
npm run test:unit:watch
```

#### Integration Tests
```bash
# All integration tests
npm run test:integration

# Specific integration test suites
npm run test:integration:api
npm run test:integration:files
npm run test:integration:cli
npm run test:integration:features
npm run test:integration:agents

# Stress and recovery tests (single worker)
npm run test:integration:stress

# Integration tests with coverage
npm run test:integration:coverage

# Watch mode
npm run test:integration:watch
```

#### E2E Tests
```bash
# All E2E tests
npm run test:e2e

# Specific E2E workflows
npm run test:e2e:complete-workflows
npm run test:e2e:multi-agent
npm run test:e2e:feature-management
npm run test:e2e:stop-hook
npm run test:e2e:performance

# E2E watch mode
npm run test:e2e:watch
```

#### RAG System Tests
```bash
# All RAG tests
npm run test:rag

# RAG test categories
npm run test:rag:unit
npm run test:rag:integration
npm run test:rag:performance
npm run test:rag:integrity

# RAG tests with coverage
npm run test:rag:coverage

# RAG watch mode
npm run test:rag:watch
```

### Coverage Commands
```bash
# Generate coverage report
npm run coverage

# Generate and open HTML coverage report
npm run coverage:html

# Watch mode with coverage
npm run coverage:watch

# CI-friendly coverage (no watch, JSON output)
npm run coverage:ci

# Coverage with specific reporters
npm run coverage:report    # HTML + text summary
npm run coverage:json      # JSON format
npm run coverage:lcov      # LCOV format
```

### Coverage Quality Gates
```bash
# Check coverage thresholds
npm run coverage:check

# Clean coverage artifacts
npm run coverage:clean

# Generate coverage badge URL
npm run coverage:badge

# Validate coverage thresholds (fails if below minimum)
npm run coverage:threshold-check
```

### Advanced Test Execution

#### Environment Variables
```bash
# Debug mode
TEST_DEBUG=true npm test

# Monitor test performance
MONITOR_TEST_PERFORMANCE=true npm test

# Custom timeout
JEST_TIMEOUT=60000 npm test

# Verbose output
npm test -- --verbose

# Run tests matching pattern
npm test -- --testNamePattern="API"

# Run specific test file
npm test test/unit/taskmanager-api.test.js
```

#### Jest CLI Options
```bash
# Run tests and exit
npm test -- --passWithNoTests

# Force exit after tests
npm test -- --forceExit

# Run tests in band (sequential)
npm test -- --runInBand

# Update snapshots
npm test -- --updateSnapshot

# Only run tests related to changed files
npm test -- --onlyChanged

# Run tests with specific number of workers
npm test -- --maxWorkers=4
```

---

## 🔍 Debugging Tests

### Debug Configuration

#### 1. Enable Debug Mode
```bash
# Set debug environment variable
export TEST_DEBUG=true
npm test

# Or inline
TEST_DEBUG=true npm run test:unit:taskmanager
```

#### 2. Node.js Inspector
```bash
# Run tests with Node.js debugger
node --inspect-brk node_modules/.bin/jest --runInBand

# Run specific test with debugger
node --inspect-brk node_modules/.bin/jest test/unit/taskmanager-api.test.js --runInBand
```

#### 3. VS Code Debug Configuration
```json
{
  "name": "Debug Jest Tests",
  "type": "node",
  "request": "launch",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen",
  "env": {
    "TEST_DEBUG": "true"
  }
}
```

### Debugging Techniques

#### 1. Test Utilities Debugging
```javascript
// Use global test utilities
global.testUtils.delay(1000); // Add delays
console.log(global.testUtils.getTestType()); // Check test type

// Use test logger
const { TestLogger } = require('../utils/testUtils');
TestLogger.debug('Debug message', { data: 'example' });
```

#### 2. API Debugging
```javascript
// Enable verbose API execution
const result = await APIExecutor.execAPI('command', ['args'], {
  silent: false,  // Shows command output
  timeout: 30000  // Increase timeout
});
```

#### 3. Memory and Performance Debugging
```javascript
// Measure test performance
const { PerformanceUtils } = require('../utils/testUtils');

const { result, duration } = await PerformanceUtils.measureTime(async () => {
  // Your test code here
});

console.log(`Test took ${duration}ms`);
```

#### 4. Custom Assertions
```javascript
// Use custom matchers for better error messages
expect(apiResponse).toBeSuccessfulAPIResponse();
expect(feature).toBeValidFeature();
expect(errorResponse).toBeErrorAPIResponse();
```

---

## 🔧 Common Troubleshooting

### Test Failures

#### 1. Timeout Issues
```bash
# Common timeout error
Error: Test timed out after 30000ms

# Solutions:
# Increase timeout globally
JEST_TIMEOUT=60000 npm test

# Increase timeout for specific test
jest.setTimeout(60000);

# Increase timeout in test
test('long running test', async () => {
  // test code
}, 60000);
```

#### 2. Memory Issues
```bash
# Memory leak errors
Error: JavaScript heap out of memory

# Solutions:
# Increase Node.js memory
NODE_OPTIONS='--max-old-space-size=4096' npm test

# Run tests sequentially
npm test -- --runInBand

# Reduce test parallelism
npm test -- --maxWorkers=2
```

#### 3. Port Conflicts
```bash
# Port already in use errors
Error: EADDRINUSE: address already in use :::3000

# Solutions:
# Find and kill process using port
lsof -ti:3000 | xargs kill -9

# Use different port for tests
PORT=3001 npm test

# Wait for port to be free in tests
await global.testUtils.expectEventually(() => {
  // Check if port is available
});
```

#### 4. File System Issues
```bash
# Permission errors
Error: EACCES: permission denied

# Solutions:
# Check file permissions
chmod 755 test/

# Clean test artifacts
rm -rf coverage/ .jest-cache/

# Use absolute paths
const testPath = path.join(__dirname, 'fixtures');
```

### Configuration Issues

#### 1. Module Resolution
```bash
# Cannot resolve module errors
Error: Cannot find module '@test/utils'

# Solutions:
# Check moduleNameMapper in jest.config.js
"moduleNameMapper": {
  "^@test/(.*)$": "<rootDir>/test/$1"
}

# Use relative imports as fallback
const utils = require('../utils/testUtils');
```

#### 2. Transform Issues
```bash
# Unexpected token errors
Error: Unexpected token 'export'

# Solutions:
# Check transform configuration
"transform": {
  "^.+\.js$": ["babel-jest", { "presets": ["@babel/preset-env"] }]
}

# Ensure babel configuration
// babel.config.js
module.exports = {
  presets: ['@babel/preset-env']
};
```

#### 3. Setup Issues
```bash
# Setup file not found
Error: Cannot find module '<rootDir>/test/setup.js'

# Solutions:
# Verify setup file exists
ls -la test/setup.js

# Check setupFilesAfterEnv in jest.config.js
"setupFilesAfterEnv": ["<rootDir>/test/setup.js"]
```

### Environment Issues

#### 1. Dependencies
```bash
# Missing dependencies
Error: Cannot find module 'some-package'

# Solutions:
# Install missing dependencies
npm install

# Clear node_modules and reinstall
rm -rf node_modules/ package-lock.json
npm install

# Check for peer dependencies
npm ls
```

#### 2. Node.js Version
```bash
# Node.js version incompatibility
Error: Unsupported Node.js version

# Solutions:
# Check Node.js version requirement in package.json
"engines": {
  "node": ">=18.0.0"
}

# Use correct Node.js version
nvm use 20
```

---

## 🔄 CI/CD Integration

### GitHub Actions Workflow

The project uses a comprehensive CI/CD pipeline in `.github/workflows/ci-cd-pipeline.yml`:

#### Pipeline Stages
1. **Quick Validation** (5 minutes)
   - Linting
   - Package validation
   - Security audit

2. **Test Matrix** (20 minutes)
   - Tests across Node.js 18.x, 20.x, 22.x
   - Tests on Ubuntu, Windows, macOS
   - Unit, integration, and RAG tests

3. **Code Quality** (10 minutes)
   - Comprehensive linting
   - Security analysis
   - Dependency analysis

4. **Performance Testing** (15 minutes)
   - Performance monitoring
   - Memory analysis
   - Trend analysis

5. **Coverage Analysis** (10 minutes)
   - Coverage report generation
   - Threshold validation
   - Report merging

6. **Build Validation** (10 minutes)
   - Application startup validation
   - Integration smoke tests
   - API endpoint validation

7. **Quality Gate** (2 minutes)
   - Final validation
   - Status aggregation
   - Deployment readiness

#### Local CI Simulation
```bash
# Run complete quality check
npm run ci:quality-check

# Run full validation suite
npm run ci:full-validation

# Individual CI steps
npm run lint
npm run coverage:check:standalone
npm run performance:test
```

### Coverage Monitoring

#### Coverage Scripts
```bash
# Generate coverage reports
npm run coverage

# Generate HTML coverage report
npm run coverage:html

# Check coverage thresholds
npm run coverage:check

# Monitor coverage trends
npm run coverage:monitor
```

#### Coverage Thresholds
```javascript
// jest.config.js
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

#### Coverage Reports
- **HTML**: `coverage/lcov-report/index.html`
- **JSON**: `coverage/coverage-summary.json`
- **LCOV**: `coverage/lcov.info`
- **Text**: Console output

---

## ⚡ Performance Testing

### Performance Scripts
```bash
# Run performance tests
npm run performance:test

# Verbose performance output
npm run performance:test:verbose

# JSON performance output
npm run performance:test:json

# Monitor performance
npm run performance:monitor
```

### Performance Monitoring
The project includes comprehensive performance monitoring:

#### Features
- Test execution timing
- Memory usage analysis
- Parallelization recommendations
- Performance trend tracking
- Bottleneck identification

#### Performance Reports
```bash
# View latest performance report
cat test-performance/latest-report.json

# View performance trends
cat test-performance/trends.json
```

#### Performance Thresholds
- Test duration warnings: > 5 seconds
- Memory usage warnings: > 50MB delta
- Automatic parallelization analysis
- CI/CD performance validation

### RAG System Performance
```bash
# RAG performance tests
npm run test:rag:performance

# Performance with specific workers
npm test -- --maxWorkers=1 test/rag-system/performance
```

---

## 📊 Coverage Analysis

### Coverage Commands
```bash
# Basic coverage
npm run coverage

# Coverage with different reporters
npm run coverage:report  # HTML + text summary
npm run coverage:html    # HTML only
npm run coverage:json    # JSON only
npm run coverage:lcov    # LCOV only

# Coverage validation
npm run coverage:check
npm run coverage:threshold-check
```

### Coverage Configuration
```javascript
// jest.config.js
collectCoverageFrom: [
  "*.js",
  "lib/**/*.js",
  "development/essentials/*.js",
  "scripts/**/*.js",
  // Exclusions
  "!test/**",
  "!coverage/**",
  "!node_modules/**"
],
coverageThreshold: {
  global: {
    branches: 75,
    functions: 80,
    lines: 80,
    statements: 80
  }
}
```

### Coverage Analysis Tools
```bash
# Standalone coverage checker
npm run coverage:check:standalone

# Strict coverage validation
npm run coverage:check:strict

# Coverage monitoring
npm run coverage:monitor
```

---

## 📝 Best Practices

### Test Organization

#### 1. File Naming
```
test/
├── unit/
│   ├── feature-name.test.js     # Unit tests
│   └── component-name.test.js
├── integration/
│   ├── workflow-name.test.js    # Integration tests
│   └── api-endpoints.test.js
└── e2e/
    ├── user-journey.test.js     # E2E tests
    └── complete-flow.test.js
```

#### 2. Test Structure
```javascript
describe('Feature Name', () => {
  beforeAll(async () => {
    // Setup for all tests
  });

  afterAll(async () => {
    // Cleanup for all tests
  });

  beforeEach(async () => {
    // Setup for each test
  });

  afterEach(async () => {
    // Cleanup for each test
  });

  describe('when condition', () => {
    test('should do something', async () => {
      // Arrange
      const testData = TestDataFactory.createFeatureData();

      // Act
      const result = await APIExecutor.execAPI('command', [testData]);

      // Assert
      expect(result).toBeSuccessfulAPIResponse();
    });
  });
});
```

### Test Data Management

#### 1. Use Test Factories
```javascript
const { TestDataFactory } = require('../utils/testUtils');

const featureData = TestDataFactory.createFeatureData({
  title: 'Custom Feature Title'
});
```

#### 2. Use Test Environment
```javascript
const { TestEnvironment } = require('../utils/testUtils');

const testEnv = new TestEnvironment('my-test');
const testDir = testEnv.setup();
// Run tests
testEnv.cleanup();
```

### Error Handling

#### 1. Proper Error Testing
```javascript
test('should handle errors gracefully', async () => {
  await expect(
    APIExecutor.execAPI('invalid-command')
  ).rejects.toThrow('Command failed');
});
```

#### 2. Timeout Handling
```javascript
test('should handle timeouts', async () => {
  const promise = longRunningOperation();
  const result = await TestExecution.withTimeout(promise, 5000);
  expect(result).toBeDefined();
});
```

### Performance Considerations

#### 1. Parallel Test Execution
```javascript
test('should handle parallel operations', async () => {
  const promises = Array.from({ length: 10 }, () =>
    APIExecutor.execAPI('command')
  );

  const results = await TestExecution.parallel(promises, 3);
  expect(results).toHaveLength(10);
});
```

#### 2. Resource Cleanup
```javascript
afterEach(async () => {
  // Clean up test resources
  await APIExecutor.cleanup(testData);
});
```

### CI/CD Optimization

#### 1. Test Categorization
```bash
# Run only fast tests in pre-commit
npm run test:unit

# Run comprehensive tests in CI
npm run test:integration
```

#### 2. Conditional Test Execution
```javascript
describe.skipIf(process.env.CI === 'true')('Local only tests', () => {
  // Tests that only run locally
});
```

---

## 🎯 Summary

This guide provides comprehensive coverage for test execution and troubleshooting in the infinite-continue-stop-hook project. Key takeaways:

### Test Execution
- Use appropriate test commands for different test types
- Leverage environment variables for configuration
- Use watch mode for development

### Debugging
- Enable debug mode for detailed output
- Use Node.js inspector for step-through debugging
- Leverage test utilities for better debugging

### Troubleshooting
- Check timeouts, memory, and configuration issues
- Use proper error handling and cleanup
- Monitor performance and coverage

### CI/CD Integration
- Comprehensive pipeline with quality gates
- Performance and coverage monitoring
- Multi-platform testing support

### Best Practices
- Organize tests logically
- Use test utilities and factories
- Handle errors and timeouts properly
- Optimize for CI/CD execution

For specific issues not covered in this guide, check the project's test files for examples and consult the Jest documentation for advanced configuration options.

---

## 🔗 Related Documentation

- [Testing Architecture](./testing-architecture.md)
- [Testing Best Practices](./testing-best-practices.md)
- [FEATURES.json Testing](./features-testing-approach.md)
- [Testing Troubleshooting](./testing-troubleshooting.md)

---

**Guide Updated By:** Testing Infrastructure Agent
**Compliance:** Enterprise Testing Standards
**Next Review:** Quarterly or upon major tooling changes
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

### Continuous Integration Commands
```bash
# CI-optimized test run
npm run coverage:ci

# Parallel test execution
npm test -- --maxWorkers=4

# CI with timeout and error handling
timeout 300 npm run coverage:ci || exit 1
```

### GitHub Actions Integration
```yaml
# .github/workflows/test.yml
- name: Run Tests
  run: |
    npm ci
    npm run coverage:ci
    npm run coverage:check

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Quality Gates
```bash
# Validate all quality requirements
npm run coverage:check && \
npm run lint && \
npm test -- --passWithNoTests

# Pre-commit validation
npm run test:quick && npm run lint:fix
```

## 📈 Performance Monitoring

### Execution Time Monitoring
```bash
# Run tests with timing information
npm test -- --verbose --detectOpenHandles

# Performance tests with benchmarking
npm run test:rag:performance

# Memory usage monitoring
npm test -- --logHeapUsage
```

### Test Performance Optimization
```bash
# Parallel execution (default)
npm test -- --maxWorkers=50%

# Sequential execution (for debugging)
npm test -- --runInBand

# Reduced workers for memory-intensive tests
npm test -- --maxWorkers=2
```

## 🛠️ Troubleshooting Common Issues

### Test Failures
```bash
# Re-run failed tests only
npm test -- --onlyFailures

# Run with detailed error output
npm test -- --verbose --errorOnDeprecated

# Clear cache and retry
npm test -- --clearCache && npm test
```

### Environment Issues
```bash
# Reset test environment
rm -rf node_modules coverage .jest-cache
npm install
npm test

# Verify Jest installation
npx jest --version

# Check test configuration
npm test -- --showConfig
```

### Database/External Service Issues
```bash
# Run unit tests with mocks (no external dependencies)
npm test -- --testPathPattern="unit" # Uses mocks

# Run integration tests with real services
npm test -- --testPathPattern="integration"

# RAG system tests with test database
npm run test:rag:integrity
```

## 📚 Advanced Test Execution

### Custom Test Scripts
```bash
# Run smoke tests
npm test -- --testNamePattern="smoke"

# Run critical path tests
npm test -- --testNamePattern="critical"

# Regression testing
npm test -- --testPathPattern="regression"
```

### Test Data Management
```bash
# Tests with coverage data cleanup
npm run coverage:clean && npm test

# Run tests and monitor coverage changes
npm run coverage:monitor

# Tests with specific patterns
TEST_DATASET=large npm test
```

### Multi-Environment Testing
```bash
# Test against different Node versions
nvm use 18 && npm test
nvm use 20 && npm test

# Test with different configurations
NODE_ENV=development npm test
NODE_ENV=production npm test
```

## 📋 Test Execution Checklist

### Before Running Tests
- [ ] Dependencies installed (`npm install`)
- [ ] Environment variables set
- [ ] Test database available (if needed)
- [ ] External services mocked/available

### During Development
- [ ] Run related tests (`npm test -- --testPathPattern="feature"`)
- [ ] Watch mode active (`npm test -- --watch`)
- [ ] Coverage monitoring (`npm run coverage:watch`)

### Before Commit
- [ ] All tests pass (`npm test`)
- [ ] Coverage thresholds met (`npm run coverage:check`)
- [ ] Linting passes (`npm run lint`)
- [ ] No test warnings or deprecations

### For CI/CD
- [ ] CI-optimized execution (`npm run coverage:ci`)
- [ ] Parallel execution configured
- [ ] Quality gates enforced
- [ ] Reports generated and uploaded

---

## 🔗 Related Documentation

- [Testing Architecture](./testing-architecture.md)
- [Testing Best Practices](./testing-best-practices.md)
- [FEATURES.json Testing](./features-testing-approach.md)
- [Testing Troubleshooting](./testing-troubleshooting.md)

---

**Execution Guide Reviewed By:** Senior Developer Standards
**Compliance:** Enterprise Testing Standards
**Next Review:** Quarterly or upon major tooling changes
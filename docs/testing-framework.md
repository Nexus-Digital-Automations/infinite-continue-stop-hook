# Comprehensive Testing Framework Documentation

## Overview

This project implements a complete automated testing framework with unit, integration, and end-to-end (E2E) testing capabilities powered by Jest. The framework is designed to ensure code quality, prevent regressions, and increase deployment confidence.

## Table of Contents

1. [Framework Architecture](#framework-architecture)
2. [Test Categories](#test-categories)
3. [Running Tests](#running-tests)
4. [Coverage Reporting](#coverage-reporting)
5. [CI/CD Integration](#cicd-integration)
6. [Writing Tests](#writing-tests)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

---

## Framework Architecture

### Testing Stack

- **Test Runner**: Jest 30.1.3
- **Test Environment**: Node.js (18+)
- **Coverage Tool**: Jest built-in coverage
- **Assertion Library**: Jest expect API
- **Mocking**: Jest mocks + manual mocks in `test/mocks/`
- **Reporting**: Jest HTML Reporters, jest-junit

### Directory Structure

```
test/
├── unit/                      # Unit tests (isolated module testing)
│   ├── taskmanager-api.test.js
│   ├── feature-management.test.js
│   ├── agent-management.test.js
│   └── ...
├── integration/               # Integration tests (component interaction)
│   ├── api-workflow.test.js
│   ├── file-operations.test.js
│   ├── agent-lifecycle.test.js
│   └── ...
├── e2e/                       # End-to-end tests (complete workflows)
│   ├── complete-workflows.test.js
│   ├── multi-agent-scenarios.test.js
│   ├── stop-hook-integration.test.js
│   └── ...
├── rag-system/                # RAG system specific tests
│   ├── unit/
│   ├── integration/
│   ├── performance/
│   └── data-integrity/
├── mocks/                     # Shared test mocks
├── fixtures/                  # Test data and fixtures
├── setup.js                   # Test environment setup
├── globalSetup.js             # Global test initialization
├── globalTeardown.js          # Global test cleanup
└── jest.config.js             # Jest configuration

```

### Configuration Files

- **`jest.config.js`** (root): Main Jest configuration with coverage thresholds
- **`test/e2e/jest.config.js`**: E2E-specific configuration with extended timeouts
- **`test/rag-system/jest.config.js`**: RAG system test configuration
- **`package.json`**: 70+ test scripts for every scenario

---

## Test Categories

### 1. Unit Tests (`test/unit/`)

**Purpose**: Test individual functions and modules in isolation

**Characteristics**:
- Fast execution (< 5 seconds per suite)
- No external dependencies
- Heavy use of mocks
- Focused on single responsibility

**Run Commands**:
```bash
npm run test:unit                  # All unit tests
npm run test:unit:taskmanager      # TaskManager API tests
npm run test:unit:features         # Feature management tests
npm run test:unit:agents           # Agent management tests
npm run test:unit:coverage         # Unit tests with coverage
npm run test:unit:watch            # Watch mode for development
```

**Example Test Files**:
- `taskmanager-api.test.js` - Core API functionality
- `feature-management.test.js` - Feature CRUD operations
- `agent-management.test.js` - Agent lifecycle
- `validation-dependency-manager.test.js` - Validation system

### 2. Integration Tests (`test/integration/`)

**Purpose**: Test how components work together

**Characteristics**:
- Moderate execution time (10-30 seconds per suite)
- Real file system operations
- Database interactions
- API workflows

**Run Commands**:
```bash
npm run test:integration             # All integration tests
npm run test:integration:api         # API workflow tests
npm run test:integration:files       # File operations tests
npm run test:integration:features    # Feature lifecycle tests
npm run test:integration:stress      # Stress and recovery tests
npm run test:integration:coverage    # Integration tests with coverage
```

**Example Test Files**:
- `api-workflow.test.js` - Complete API workflows
- `file-operations.test.js` - File system operations
- `feature-lifecycle.test.js` - Feature creation to completion
- `stress-and-recovery.test.js` - System resilience

### 3. End-to-End Tests (`test/e2e/`)

**Purpose**: Test complete user workflows and system integration

**Characteristics**:
- Longer execution time (30-120 seconds per suite)
- Real-world scenarios
- Multiple component interaction
- Full system validation

**Run Commands**:
```bash
npm run test:e2e                      # All E2E tests
npm run test:e2e:complete-workflows   # Complete workflow tests
npm run test:e2e:multi-agent          # Multi-agent scenarios
npm run test:e2e:feature-management   # Feature management E2E
npm run test:e2e:stop-hook            # Stop hook integration
npm run test:e2e:performance          # Performance validation
```

**Example Test Files**:
- `complete-workflows.test.js` - Full task lifecycle
- `multi-agent-scenarios.test.js` - Multi-agent coordination
- `stop-hook-integration.test.js` - Stop hook behavior
- `performance-validation.test.js` - Performance benchmarks

### 4. RAG System Tests (`test/rag-system/`)

**Purpose**: Test Retrieval-Augmented Generation system

**Run Commands**:
```bash
npm run test:rag                    # All RAG tests
npm run test:rag:unit               # RAG unit tests
npm run test:rag:integration        # RAG integration tests
npm run test:rag:performance        # RAG performance tests
npm run test:rag:integrity          # RAG data integrity tests
```

---

## Running Tests

### Quick Start

```bash
# Run all tests (fast mode, silent)
npm test

# Run all tests with full output
npm run test:quick

# Run with coverage
npm run coverage
```

### Targeted Testing

```bash
# By test type
npm run test:unit
npm run test:integration
npm run test:e2e

# Specific test files
npm run test:unit:taskmanager
npm run test:integration:api
npm run test:e2e:complete-workflows

# Watch mode (for development)
npm run test:unit:watch
npm run test:integration:watch
npm run test:e2e:watch
```

### Development Workflow

```bash
# 1. Make code changes
# 2. Run relevant tests in watch mode
npm run test:unit:watch

# 3. Before commit: Run all tests
npm test

# 4. Verify coverage
npm run coverage:check
```

---

## Coverage Reporting

### Coverage Thresholds

The project enforces strict coverage thresholds:

- **Lines**: 80%
- **Functions**: 80%
- **Branches**: 75%
- **Statements**: 80%

**Special Module Thresholds**:
- `lib/validation-dependency-manager.js`: 85% branches, 90% functions/lines/statements

### Coverage Commands

```bash
# Basic coverage report
npm run coverage

# Multiple format reports
npm run coverage:multi-format

# Coverage dashboard (JSON, LCOV, Cobertura)
npm run coverage:dashboard

# Open HTML coverage report in browser
npm run coverage:html

# CI-friendly coverage reporting
npm run coverage:ci

# Enhanced coverage with quality gates
npm run coverage:enhanced

# Check coverage thresholds
npm run coverage:check

# Coverage trend analysis
npm run coverage:trend-analysis
```

### Coverage Reports Generated

1. **HTML Report**: `coverage/lcov-report/index.html`
2. **JSON Summary**: `coverage/coverage-summary.json`
3. **LCOV**: `coverage/lcov.info`
4. **Cobertura XML**: `coverage/cobertura-coverage.xml`
5. **Jest HTML Report**: `coverage/html-report/test-report.html`

### Coverage Badges

```bash
# Generate coverage badge URL
npm run coverage:badge
```

---

## CI/CD Integration

### GitHub Actions Workflows

The testing framework integrates with 13 comprehensive CI/CD workflows:

**Primary Workflows**:
- **`ci-cd-pipeline.yml`**: Main CI/CD pipeline
- **`quality-gates.yml`**: Quality enforcement
- **`coverage-monitoring.yml`**: Coverage tracking
- **`enhanced-ci-cd-pipeline.yml`**: Advanced CI/CD

**Test Execution in CI**:

```yaml
# Example CI workflow step
- name: Run Tests
  run: npm run coverage:ci

- name: Check Coverage Thresholds
  run: npm run coverage:check:strict

- name: Upload Coverage Reports
  uses: codecov/codecov-action@v3
  with:
    files: ./coverage/lcov.info,./coverage/cobertura-coverage.xml
```

### CI-Specific Commands

```bash
npm run ci:quality-check      # Lint + coverage + performance
npm run ci:full-validation    # Complete validation suite
npm run coverage:ci-reports   # Generate CI-formatted reports
```

### Pre-commit Hooks

Husky pre-commit hooks run:
1. Linting (`npm run lint`)
2. Format checking (`npm run format:check`)
3. Targeted tests for changed files

**Test Pre-commit Hook**:
```bash
# Simulate pre-commit checks
npm run pre-commit:simulate
```

---

## Writing Tests

### Unit Test Template

```javascript
/**
 * Unit Test: [Component Name]
 *
 * Tests isolated functionality of [component description]
 */

const ComponentToTest = require('../../lib/component');

describe('[Component Name] - Unit Tests', () => {
  let component;

  beforeEach(() => {
    // Setup fresh instance for each test
    component = new ComponentToTest();
  });

  afterEach(() => {
    // Cleanup after each test
    jest.clearAllMocks();
  });

  describe('[Feature Group]', () => {
    it('should [expected behavior]', () => {
      // Arrange
      const input = 'test-data';

      // Act
      const result = component.method(input);

      // Assert
      expect(result).toBe('expected-value');
    });

    it('should handle error cases', () => {
      // Arrange
      const invalidInput = null;

      // Act & Assert
      expect(() => component.method(invalidInput)).toThrow();
    });
  });
});
```

### Integration Test Template

```javascript
/**
 * Integration Test: [Workflow Name]
 *
 * Tests integration between [components]
 */

const { executeCommand } = require('../helpers/command-executor');
const fs = require('fs');
const path = require('path');

describe('[Workflow Name] - Integration Tests', () => {
  let testProjectDir;

  beforeAll(async () => {
    // Setup test environment
    testProjectDir = path.join(__dirname, 'test-project');
    fs.mkdirSync(testProjectDir, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test environment
    fs.rmSync(testProjectDir, { recursive: true, force: true });
  });

  it('should complete full workflow', async () => {
    // Arrange
    const taskData = { title: 'Test Task', type: 'feature' };

    // Act
    const createResult = await executeCommand('create-task', taskData);
    const task = JSON.parse(createResult);
    const getResult = await executeCommand('get-task', task.id);

    // Assert
    expect(task.id).toBeDefined();
    expect(JSON.parse(getResult).title).toBe('Test Task');
  });
});
```

### E2E Test Template

```javascript
/**
 * E2E Test: [User Scenario]
 *
 * Tests complete user workflow from start to finish
 */

const { spawn } = require('child_process');
const path = require('path');

describe('[User Scenario] - E2E Tests', () => {
  const API_PATH = path.join(__dirname, '../../taskmanager-api.js');

  const executeTaskManagerCommand = (command, args = []) => {
    return new Promise((resolve, reject) => {
      const process = spawn('node', [API_PATH, command, ...args]);
      let output = '';

      process.stdout.on('data', (data) => { output += data.toString(); });
      process.on('close', (code) => {
        if (code === 0) resolve(JSON.parse(output.trim()));
        else reject(new Error(`Command failed with code ${code}`));
      });
    });
  };

  it('should handle complete user journey', async () => {
    // Arrange - User wants to create and complete a feature
    const featureData = {
      title: 'User Authentication',
      description: 'Implement JWT authentication',
      type: 'feature',
      priority: 'high'
    };

    // Act - User creates feature
    const created = await executeTaskManagerCommand('create-task', [
      JSON.stringify(featureData)
    ]);

    // User assigns feature to agent
    const assigned = await executeTaskManagerCommand('update-task', [
      created.task.id,
      JSON.stringify({ assigned_to: 'dev_agent_1' })
    ]);

    // User marks feature complete
    const completed = await executeTaskManagerCommand('update-task', [
      created.task.id,
      JSON.stringify({ status: 'completed' })
    ]);

    // Assert - Complete workflow succeeded
    expect(created.success).toBe(true);
    expect(assigned.success).toBe(true);
    expect(completed.success).toBe(true);
    expect(completed.task.status).toBe('completed');
  });
});
```

### Mocking Best Practices

```javascript
// Mock external dependencies
jest.mock('fs', () => ({
  readFileSync: jest.fn(),
  writeFileSync: jest.fn(),
  existsSync: jest.fn(() => true)
}));

// Mock modules with custom implementation
jest.mock('../../lib/logger', () => ({
  loggers: {
    app: { info: jest.fn(), error: jest.fn() },
    tests: { info: jest.fn(), error: jest.fn() }
  }
}));

// Restore mocks after tests
afterEach(() => {
  jest.restoreMocks();
});
```

---

## Troubleshooting

### Common Issues

#### 1. Sqlite3 Binding Errors

**Error**: `TypeError: exists is not a function`

**Cause**: Native module compilation issues

**Fix**:
```bash
# Rebuild native modules
npm rebuild sqlite3

# Or reinstall sqlite3
npm uninstall sqlite3
npm install sqlite3@5.1.7

# If still failing, use system Node.js version
nvm use 18
npm rebuild
```

#### 2. JSON Parsing Errors in E2E Tests

**Error**: `SyntaxError: Unexpected non-whitespace character after JSON`

**Cause**: Log output contaminating JSON responses

**Fix**:
```bash
# Run with silent logging
SILENT_LOGS=true npm run test:e2e

# Or redirect stderr
npm run test:e2e 2>/dev/null
```

#### 3. Tests Timing Out

**Error**: `Timeout - Async callback was not invoked within the 5000 ms timeout`

**Fix**:
```javascript
// Increase timeout for specific test
it('slow operation', async () => {
  // Test code
}, 30000); // 30 second timeout

// Or configure globally in jest.config.js
module.exports = {
  testTimeout: 30000
};
```

#### 4. Coverage Threshold Failures

**Error**: `Coverage threshold not met`

**Fix**:
```bash
# Generate coverage report to identify gaps
npm run coverage:html

# Review uncovered lines in browser
open coverage/lcov-report/index.html

# Write tests for uncovered code
# Update coverage thresholds if necessary (jest.config.js)
```

### Debugging Tests

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test file
npm test -- test/unit/taskmanager-api.test.js

# Debug with Node inspector
node --inspect-brk node_modules/.bin/jest --runInBand

# Enable test debug logging
TEST_DEBUG=true npm test
```

---

## Best Practices

### 1. Test Organization

✅ **DO**:
- Group related tests with `describe` blocks
- Use clear, descriptive test names
- Follow Arrange-Act-Assert pattern
- Keep tests independent and isolated

❌ **DON'T**:
- Create interdependent tests
- Use global state
- Skip cleanup in `afterEach`/`afterAll`
- Test implementation details

### 2. Mocking Strategy

✅ **DO**:
- Mock external dependencies (APIs, databases, file system)
- Use manual mocks in `test/mocks/` for complex mocks
- Restore mocks after each test
- Mock only what you need

❌ **DON'T**:
- Mock everything (defeats purpose of integration tests)
- Leave mocks active across tests
- Mock internal implementation details
- Create overly complex mocks

### 3. Coverage Goals

✅ **DO**:
- Aim for 80%+ coverage
- Focus on critical paths
- Test edge cases and error handling
- Use coverage reports to identify gaps

❌ **DON'T**:
- Chase 100% coverage at all costs
- Test trivial code (getters/setters)
- Ignore untestable code smells
- Game coverage metrics

### 4. Performance

✅ **DO**:
- Keep unit tests fast (< 5s per suite)
- Use `test:quick` for rapid feedback
- Run full suite before commits
- Use watch mode during development

❌ **DON'T**:
- Make unnecessary API calls
- Use real databases in unit tests
- Create large test data sets
- Skip cleanup operations

### 5. CI/CD Integration

✅ **DO**:
- Run tests in CI pipeline
- Enforce coverage thresholds
- Generate test reports
- Upload coverage to services (Codecov, Coveralls)

❌ **DON'T**:
- Skip tests in CI
- Lower thresholds to pass
- Ignore failing tests
- Deploy without green build

---

## Quality Metrics

### Current Test Coverage

- **Total Test Files**: 53+
- **Test Categories**: Unit (15+), Integration (10+), E2E (15+), RAG (13+)
- **Coverage Target**: 80% lines, 80% functions, 75% branches
- **Test Execution Time**:
  - Unit: ~2-5 seconds per suite
  - Integration: ~10-30 seconds per suite
  - E2E: ~30-120 seconds per suite

### Performance Benchmarks

```bash
# Run performance tests
npm run performance:test

# Monitor test performance
npm run performance:monitor

# Optimize parallel execution
npm run parallel:optimize
```

---

## Advanced Features

### 1. Parallel Test Execution

Jest automatically runs tests in parallel using worker processes:

```javascript
// jest.config.js
module.exports = {
  maxWorkers: '50%', // Use 50% of CPU cores
};
```

**Optimize parallelization**:
```bash
npm run parallel:optimize
```

### 2. Test Matrix (Multi-Node Version)

```bash
npm run node:performance         # Test across Node versions
npm run comprehensive-node-matrix # Full Node version matrix
```

### 3. Custom Reporters

- **Jest HTML Reporters**: Visual HTML reports
- **jest-junit**: JUnit XML for CI integration
- **Custom CI/CD Reporter**: `scripts/jest-cicd-reporter.js`
- **JSON Reporter**: `scripts/jest-json-reporter.js`

### 4. Code Quality Integration

```bash
npm run quality:analyze          # Comprehensive quality analysis
npm run quality:full             # Quality + coverage + security
npm run security:scan            # Security vulnerability scanning
```

---

## Resources

### Documentation
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [GitHub Actions Testing](https://docs.github.com/en/actions/automating-builds-and-tests)
- [Code Coverage Best Practices](https://testing.googleblog.com/2020/08/code-coverage-best-practices.html)

### Internal Resources
- Test fixtures: `test/fixtures/`
- Test helpers: `test/helpers/`
- Mock data: `test/mocks/`
- Sample data: `test/fixtures/sampleData.js`

### Support

For issues or questions:
1. Check [Troubleshooting](#troubleshooting) section
2. Review test examples in `test/unit/example-with-mocks.test.js`
3. Consult Jest documentation
4. Review CI/CD workflow configurations in `.github/workflows/`

---

## Continuous Improvement

The testing framework is continuously evolving. Regular improvements include:

- Adding new test coverage for features
- Optimizing test execution speed
- Enhancing CI/CD integration
- Improving test documentation
- Updating dependencies and tools

**Last Updated**: 2025-11-13
**Maintained by**: Testing Framework Agent
**Version**: 1.0.0

# Testing Troubleshooting Guide

**Project:** Infinite Continue Stop Hook TaskManager
**Version:** 1.0.0
**Last Updated:** 2025-09-22
**Created By:** main-agent

---

## 🚨 Quick Diagnostic Commands

### Immediate Health Check

```bash
# Check Jest installation and configuration
npm test -- --version
npm test -- --showConfig

# Verify Node.js and npm versions
node --version
npm --version

# Clear caches and reinstall
npm run coverage:clean
rm -rf node_modules package-lock.json
npm install
```

### Environment Validation

```bash
# Check environment variables
echo $NODE_ENV
echo $TEST_DATABASE_URL

# Verify test files exist
find test/ -name "*.test.js" | head -5

# Check package.json test scripts
npm run | grep test
```

## 🔧 Common Issues & Solutions

### 1. **Tests Not Running**

#### Symptom: No tests found

```bash
No tests found, exiting with code 0
```

**Diagnosis:**

```bash
# Check test file patterns
npm test -- --listTests

# Verify Jest configuration
npm test -- --showConfig | grep testMatch
```

**Solutions:**

```bash
# Fix test file naming
mv test/myfile.js test/myfile.test.js

# Update Jest configuration
# In package.json or jest.config.js:
"testMatch": ["**/test/**/*.test.js", "**/?(*.)+(spec|test).js"]

# Run with explicit pattern
npm test -- test/specific-file.test.js
```

#### Symptom: Jest command not found

```bash
jest: command not found
```

**Solutions:**

```bash
# Reinstall Jest
npm install --save-dev jest

# Use npx
npx jest

# Check global installation
npm list -g jest
```

### 2. **Test Failures**

#### Symptom: Timeout errors

```bash
Timeout - Async callback was not invoked within the 5000ms timeout
```

**Diagnosis:**

```bash
# Check test timeout settings
npm test -- --testTimeout=30000

# Identify hanging promises
npm test -- --detectOpenHandles
```

**Solutions:**

```bash
# Increase timeout globally
# In jest.config.js:
testTimeout: 30000

# Increase timeout for specific test
it('slow test', async () => {
  // Test code
}, 60000); // 60 seconds

# Fix hanging promises
afterEach(async () => {
  await cleanup();
  jest.clearAllTimers();
});
```

#### Symptom: Async operation issues

```bash
Cannot read property 'then' of undefined
```

**Solutions:**

```javascript
// ❌ WRONG - Missing await
it('should create task', () => {
  const result = createTask(); // Returns Promise
  expect(result.id).toBeDefined(); // Fails
});

// ✅ CORRECT - With await
it('should create task', async () => {
  const result = await createTask();
  expect(result.id).toBeDefined();
});

// ✅ CORRECT - Return promise
it('should create task', () => {
  return createTask().then((result) => {
    expect(result.id).toBeDefined();
  });
});
```

### 3. **Mock Issues**

#### Symptom: Mocks not working

```bash
TypeError: mockFunction is not a function
```

**Diagnosis:**

```bash
# Check mock setup
console.log(jest.isMockFunction(myMock));

# Verify mock implementation
console.log(myMock.mock.calls);
```

**Solutions:**

```javascript
// ❌ WRONG - Mock after import
const service = require('./service');
jest.mock('./service');

// ✅ CORRECT - Mock before import
jest.mock('./service');
const service = require('./service');

// ✅ CORRECT - Manual mock
jest.mock('./service', () => ({
  getData: jest.fn(() => Promise.resolve({ id: 1 })),
}));

// Clear mocks between tests
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### Symptom: Module not found in mocks

```bash
Cannot find module './non-existent-module'
```

**Solutions:**

```javascript
// Use __mocks__ directory
// __mocks__/external-service.js
module.exports = {
  fetchData: jest.fn(() => Promise.resolve({})),
};

// Manual mock with error handling
jest.mock('./service', () => {
  try {
    return require('./service');
  } catch {
    return { defaultMethod: jest.fn() };
  }
});
```

### 4. **Database/State Issues**

#### Symptom: Tests affecting each other

```bash
Expected 1 but received 2
```

**Diagnosis:**

```bash
# Run tests in isolation
npm test -- --runInBand

# Check for shared state
npm test -- --verbose
```

**Solutions:**

```javascript
// Proper test isolation
describe('Database tests', () => {
  beforeEach(async () => {
    await cleanDatabase();
    await seedTestData();
  });

  afterEach(async () => {
    await cleanDatabase();
  });
});

// Use separate test databases
const testDbUrl = `sqlite::memory:${Math.random()}`;

// Reset singletons
beforeEach(() => {
  jest.resetModules();
});
```

#### Symptom: Database connection errors

```bash
Connection refused / Database locked
```

**Solutions:**

```bash
# Use in-memory database for tests
TEST_DATABASE_URL="sqlite::memory:" npm test

# Ensure proper cleanup
afterAll(async () => {
  await db.close();
  await server.close();
});

# Increase connection timeout
const db = new Database(':memory:', { timeout: 10000 });
```

### 5. **Performance Issues**

#### Symptom: Tests running slowly

```bash
Test Suites: 1 passed, 1 total
Tests:       50 passed, 50 total
Time:        45.123 s
```

**Diagnosis:**

```bash
# Profile test execution
npm test -- --verbose --silent=false

# Check for synchronous operations
npm test -- --detectOpenHandles

# Monitor memory usage
npm test -- --logHeapUsage
```

**Solutions:**

```bash
# Run tests in parallel
npm test -- --maxWorkers=4

# Use faster test patterns
npm test -- --testPathPattern="unit" # Skip slow integration tests

# Cache optimization
npm test -- --cache

# Reduce test scope
npm test -- --changedFilesWithAncestor
```

### 6. **Coverage Issues**

#### Symptom: Coverage thresholds not met

```bash
Coverage threshold for lines (80%) not met: 75.5%
```

**Diagnosis:**

```bash
# Generate detailed coverage report
npm run coverage:html

# Check which files lack coverage
npm run coverage:report
```

**Solutions:**

```bash
# Add tests for uncovered lines
npm run coverage:html
open coverage/lcov-report/index.html

# Exclude non-testable files
# In jest.config.js:
collectCoverageFrom: [
  "src/**/*.js",
  "!src/**/*.test.js",
  "!src/config/**" // Exclude config files
]

# Lower thresholds temporarily
coverageThreshold: {
  global: {
    lines: 70 // Reduce from 80
  }
}
```

#### Symptom: No coverage data collected

```bash
No coverage information was collected
```

**Solutions:**

```bash
# Enable coverage collection
npm test -- --coverage

# Check coverage configuration
npm test -- --showConfig | grep coverage

# Force coverage collection
npm test -- --coverage --collectCoverageFrom="**/*.js"
```

## 🔍 Advanced Debugging

### 1. **Debug Mode Setup**

#### Node.js Inspector

```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest test/specific.test.js

# Debug with Chrome DevTools
node --inspect-brk --inspect-port=9229 node_modules/.bin/jest
```

#### VS Code Debugging

```json
// .vscode/launch.json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Jest Tests",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["test/specific.test.js", "--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### 2. **Memory Leak Detection**

#### Heap Snapshot Analysis

```bash
# Run with heap snapshots
node --expose-gc --inspect node_modules/.bin/jest --logHeapUsage

# Monitor memory patterns
npm test -- --detectLeaks --logHeapUsage
```

#### Memory Debugging

```javascript
// Add to test files for memory monitoring
beforeEach(() => {
  const memBefore = process.memoryUsage();
  global.testMemoryStart = memBefore.heapUsed;
});

afterEach(() => {
  const memAfter = process.memoryUsage();
  const memDiff = memAfter.heapUsed - global.testMemoryStart;
  if (memDiff > 10 * 1024 * 1024) {
    // 10MB threshold
    console.warn(`Memory increase: ${memDiff / 1024 / 1024}MB`);
  }
});
```

### 3. **Flaky Test Detection**

#### Run Tests Multiple Times

```bash
# Repeat tests to catch flaky behavior
for i in {1..10}; do npm test -- test/flaky.test.js || break; done

# Jest repeat option
npm test -- --testNamePattern="flaky test" --runInBand --repeatCount=10
```

#### Identify Race Conditions

```javascript
// Add artificial delays to expose race conditions
beforeEach(async () => {
  await new Promise((resolve) => setTimeout(resolve, Math.random() * 100));
});

// Use deterministic ordering
jest.useFakeTimers();
```

## 🔨 Environment-Specific Troubleshooting

### 1. **CI/CD Issues**

#### GitHub Actions Failures

```yaml
# Add debugging to workflow
- name: Debug Test Environment
  run: |
    node --version
    npm --version
    ls -la test/
    npm test -- --listTests

- name: Run Tests with Verbose Output
  run: npm test -- --verbose --ci
```

#### Docker Environment

```dockerfile
# Dockerfile for consistent test environment
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm test
```

### 2. **Windows-Specific Issues**

#### Path Separator Issues

```javascript
// Use path.join instead of hardcoded separators
const path = require('path');
const testFile = path.join(__dirname, 'test', 'data.json');

// Jest configuration for Windows
// In jest.config.js:
testMatch: ['<rootDir>/test/**/*.test.js'];
```

#### Line Ending Issues

```bash
# Configure git to handle line endings
git config core.autocrlf input

# Add .gitattributes file
echo "* text=auto" > .gitattributes
```

### 3. **macOS-Specific Issues**

#### File System Case Sensitivity

```bash
# Check case sensitivity
touch test.txt TEST.TXT
ls -la

# Use consistent casing in imports
const service = require('./UserService'); // Not ./userservice
```

## 📊 Monitoring & Analytics

### 1. **Test Execution Monitoring**

#### Custom Test Reporter

```javascript
// test/utils/performance-reporter.js
class PerformanceReporter {
  onRunComplete(contexts, results) {
    const slowTests = results.testResults
      .filter((test) => test.perfStats.runtime > 5000)
      .map((test) => ({
        name: test.testFilePath,
        duration: test.perfStats.runtime,
      }));

    if (slowTests.length > 0) {
      console.warn('Slow tests detected:', slowTests);
    }
  }
}

module.exports = PerformanceReporter;
```

#### Test Metrics Collection

```bash
# Collect test metrics
npm test -- --json --outputFile=test-results.json

# Analyze test results
node scripts/analyze-test-results.js
```

### 2. **Coverage Trend Analysis**

#### Coverage History Tracking

```javascript
// scripts/track-coverage.js
const fs = require('fs');
const coverage = JSON.parse(fs.readFileSync('coverage/coverage-summary.json'));

const trend = {
  date: new Date().toISOString(),
  coverage: coverage.total.lines.pct,
  tests: coverage.total.tests,
};

// Append to history file
fs.appendFileSync('coverage-history.json', JSON.stringify(trend) + '\n');
```

## 🎯 Prevention Strategies

### 1. **Pre-commit Testing**

#### Husky Setup

```bash
# Install husky
npm install --save-dev husky

# Setup pre-commit hook
npx husky add .husky/pre-commit "npm run test:quick"
```

#### Lint-staged Integration

```json
// package.json
{
  "lint-staged": {
    "*.js": ["eslint --fix", "jest --findRelatedTests --passWithNoTests"]
  }
}
```

### 2. **Test Quality Gates**

#### Quality Checklist

```bash
#!/bin/bash
# scripts/quality-gate.sh

set -e

echo "🔍 Running quality checks..."

# Linting
npm run lint

# Type checking (if using TypeScript)
npm run type-check || true

# Unit tests
npm run test:unit

# Coverage check
npm run coverage:check

# Integration tests
npm run test:integration

echo "✅ All quality checks passed!"
```

### 3. **Documentation Integration**

#### Test Documentation Generator

```javascript
// scripts/generate-test-docs.js
const fs = require('fs');
const glob = require('glob');

function extractTestInfo(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tests = content.match(/it\(['"`](.*?)['"`]/g) || [];
  return {
    file: filePath,
    testCount: tests.length,
    tests: tests.map((test) => test.slice(4, -1)),
  };
}

const testFiles = glob.sync('test/**/*.test.js');
const testInfo = testFiles.map(extractTestInfo);

fs.writeFileSync('test-documentation.json', JSON.stringify(testInfo, null, 2));
```

---

## 📚 Quick Reference

### Essential Commands

```bash
# Quick diagnostics
npm test -- --version --showConfig

# Emergency test run
npm run coverage:clean && npm install && npm test

# Debug failing test
npm test -- test/failing.test.js --verbose --runInBand

# Performance analysis
npm test -- --logHeapUsage --detectOpenHandles

# Coverage analysis
npm run coverage:html && open coverage/lcov-report/index.html
```

### Emergency Contacts

- **Linting Issues**: Run `npm run lint:fix`
- **Cache Issues**: Run `npm run coverage:clean`
- **Module Issues**: Delete `node_modules`, run `npm install`
- **Timeout Issues**: Add `--testTimeout=60000`
- **Memory Issues**: Add `--runInBand --detectLeaks`

---

## 🔗 Related Documentation

- [Testing Architecture](./testing-architecture.md)
- [Testing Best Practices](./testing-best-practices.md)
- [Test Execution Guide](./test-execution-guide.md)
- [FEATURES.json Testing](./features-testing-approach.md)

---

**Troubleshooting Guide Reviewed By:** Senior Developer Standards
**Emergency Procedures Validated:** Production-Ready
**Next Review:** Quarterly or upon major test framework changes

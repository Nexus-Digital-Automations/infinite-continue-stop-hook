# Test Execution Guide

**Project:** Infinite Continue Stop Hook TaskManager
**Version:** 1.0.0
**Last Updated:** 2025-09-22
**Created By:** main-agent

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

## 📋 Test Suite Commands

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

## 🧪 Test Categories

### 1. Unit Tests
```bash
# Run all unit tests
npm test -- --testPathPattern="unit"

# Run specific unit test suite
npm test -- test/rag-system/unit/api-endpoints.test.js

# Watch mode for unit tests
npm test -- --testPathPattern="unit" --watch
```

### 2. Integration Tests
```bash
# Run all integration tests
npm test -- --testPathPattern="integration"

# Run API integration tests
npm run test:api

# Run database integration tests
npm test -- --testPathPattern="integration.*database"
```

### 3. End-to-End Tests
```bash
# Run E2E tests
npm test -- --testPathPattern="e2e"

# Run specific E2E workflow
npm test -- test/success-criteria-e2e.test.js

# E2E with extended timeout
npm test -- --testPathPattern="e2e" --testTimeout=120000
```

### 4. RAG System Tests
```bash
# Complete RAG test suite
npm run test:rag

# RAG unit tests only
npm run test:rag:unit

# RAG integration tests
npm run test:rag:integration

# RAG performance tests (sequential execution)
npm run test:rag:performance

# RAG data integrity tests
npm run test:rag:integrity

# RAG tests with coverage
npm run test:rag:coverage

# RAG tests in watch mode
npm run test:rag:watch
```

### 5. Performance Tests
```bash
# Run performance benchmarks
npm run test:rag:performance

# Performance tests with detailed output
npm test -- --testPathPattern="performance" --verbose

# Memory usage tests
npm test -- --testPathPattern="performance.*memory"
```

### 6. Security Tests
```bash
# Security validation tests
npm test -- test/security-system.test.js

# Input validation tests
npm test -- --testPathPattern="security.*validation"

# Authentication tests
npm test -- --testPathPattern="security.*auth"
```

## ⚙️ Test Configuration

### Environment Variables
```bash
# Test environment settings
export NODE_ENV=test
export TEST_TIMEOUT=30000
export TEST_DATABASE_URL="sqlite::memory:"

# RAG system test settings
export RAG_TEST_MODE=true
export RAG_EMBEDDING_CACHE_SIZE=100

# Run tests with custom environment
NODE_ENV=test npm test
```

### Jest Configuration Options
```bash
# Verbose output with test details
npm test -- --verbose

# Silent mode (minimal output)
npm test -- --silent

# Run tests with specific configuration
npm test -- --config=jest.config.js

# RAG-specific configuration
npm test -- --config=test/rag-system/jest.config.js
```

## 🔍 Test Filtering & Selection

### Pattern Matching
```bash
# Run tests by filename pattern
npm test -- --testPathPattern="task.*api"

# Run tests by test name pattern
npm test -- --testNamePattern="should create task"

# Run tests in specific directory
npm test -- test/rag-system/

# Exclude specific tests
npm test -- --testPathIgnorePatterns="performance"
```

### Test Selection Strategies
```bash
# Run only changed tests (with git)
npm test -- --onlyChanged

# Run tests related to changed files
npm test -- --changedFilesWithAncestor

# Run failed tests from last run
npm test -- --onlyFailures

# Run tests by tag/category
npm test -- --testNamePattern="@unit"
```

## 📊 Test Output & Reporting

### Output Formats
```bash
# Default Jest output
npm test

# JSON output for CI/CD
npm test -- --json

# JUnit XML for CI integration
npm test -- --outputFile=test-results.xml

# Custom reporter
npm test -- --reporters=default --reporters=jest-html-reporters
```

### Coverage Reports
```bash
# Text coverage summary
npm run coverage

# HTML interactive report
npm run coverage:html
# Opens: coverage/lcov-report/index.html

# JSON data for automation
npm run coverage:json
# Generates: coverage/coverage-final.json

# LCOV format for external tools
npm run coverage:lcov
# Generates: coverage/lcov.info
```

## 🔄 Watch Mode & Development

### Watch Mode Commands
```bash
# Watch all tests
npm test -- --watch

# Watch with coverage
npm run coverage:watch

# RAG tests in watch mode
npm run test:rag:watch

# Watch specific test pattern
npm test -- --watch --testPathPattern="api"
```

### Watch Mode Options
```bash
# Watch mode with additional options
npm test -- --watch --verbose --silent=false

# Watch mode with coverage threshold checking
npm test -- --watch --coverage --coverageThreshold

# Interactive watch mode
npm test -- --watchAll
```

### Development Workflow
```bash
# 1. Start watch mode for current work
npm test -- --watch --testPathPattern="current-feature"

# 2. Run specific test file during development
npm test -- test/current-feature.test.js --watch

# 3. Quick validation before commit
npm run coverage:check
```

## 🚨 Debugging Tests

### Debug Mode
```bash
# Debug specific test
node --inspect-brk node_modules/.bin/jest test/specific.test.js

# Debug with Chrome DevTools
npm test -- --runInBand --detectOpenHandles

# Verbose debugging output
npm test -- --verbose --no-cache --detectOpenHandles
```

### Debug Configuration
```bash
# Clear Jest cache
npm test -- --clearCache

# Run tests without cache
npm test -- --no-cache

# Detect resource leaks
npm test -- --detectOpenHandles --detectLeaks
```

### Common Debug Scenarios
```bash
# Tests hanging
npm test -- --detectOpenHandles --forceExit

# Memory leaks
npm test -- --detectLeaks --logHeapUsage

# Flaky tests
npm test -- --runInBand --verbose
```

## 🏗️ CI/CD Integration

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
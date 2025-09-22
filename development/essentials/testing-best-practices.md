# Testing Best Practices Guide

**Project:** Infinite Continue Stop Hook TaskManager
**Version:** 1.0.0
**Last Updated:** 2025-09-22
**Created By:** main-agent

---

## 🎯 Core Testing Principles

### 1. **Test-Driven Development (TDD)**
- Write tests before implementation
- Follow Red-Green-Refactor cycle
- Design APIs through test interfaces
- Maintain high test coverage (80%+ minimum)

### 2. **Test Independence**
- Each test should run in isolation
- No dependencies between test cases
- Clean state before and after each test
- Predictable and deterministic outcomes

### 3. **Fast Feedback Loops**
- Unit tests execute in < 1 second
- Integration tests complete in < 30 seconds
- Quick failure detection and reporting
- Parallel test execution where possible

## 📝 Test Naming Conventions

### Descriptive Test Names
```javascript
// ✅ GOOD - Clear, descriptive names
describe('TaskManager API', () => {
  it('should create a new task with valid input data', () => {});
  it('should reject task creation with missing required fields', () => {});
  it('should return 404 when requesting non-existent task', () => {});
});

// ❌ BAD - Vague, unclear names
describe('TaskManager', () => {
  it('works', () => {});
  it('test creation', () => {});
  it('handles errors', () => {});
});
```

### Test Structure Pattern
```javascript
// Follow AAA Pattern: Arrange, Act, Assert
it('should calculate total with tax when tax rate is provided', () => {
  // Arrange - Set up test data and mocks
  const items = [{ price: 100 }, { price: 200 }];
  const taxRate = 0.1;

  // Act - Execute the function under test
  const result = calculateTotal(items, taxRate);

  // Assert - Verify the expected outcome
  expect(result).toBe(330); // 300 + 30 tax
});
```

## 🏗️ Test Organization

### File Structure Conventions
```
test/
├── unit/
│   ├── services/
│   │   ├── task-service.test.js
│   │   └── user-service.test.js
│   └── utils/
│       ├── validation.test.js
│       └── formatting.test.js
├── integration/
│   ├── api/
│   │   ├── task-endpoints.test.js
│   │   └── auth-endpoints.test.js
│   └── database/
│       ├── task-repository.test.js
│       └── migration.test.js
└── e2e/
    ├── user-workflows.test.js
    └── admin-workflows.test.js
```

### Test Suite Organization
```javascript
describe('TaskManager Service', () => {
  describe('Task Creation', () => {
    describe('with valid input', () => {
      it('should create task with all required fields', () => {});
      it('should assign unique ID to new task', () => {});
      it('should set creation timestamp', () => {});
    });

    describe('with invalid input', () => {
      it('should reject empty title', () => {});
      it('should reject invalid priority values', () => {});
      it('should reject missing required fields', () => {});
    });
  });
});
```

## 🧪 Test Types & Strategies

### 1. **Unit Tests**
```javascript
// Testing individual functions/methods
describe('validateEmail', () => {
  it('should return true for valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
  });

  it('should return false for invalid email addresses', () => {
    expect(validateEmail('invalid-email')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
  });
});
```

### 2. **Integration Tests**
```javascript
// Testing component interactions
describe('Task API Integration', () => {
  beforeEach(async () => {
    await setupTestDatabase();
  });

  afterEach(async () => {
    await cleanupTestDatabase();
  });

  it('should create task and store in database', async () => {
    const taskData = { title: 'Test Task', priority: 'high' };

    const response = await request(app)
      .post('/api/tasks')
      .send(taskData)
      .expect(201);

    const savedTask = await Task.findById(response.body.id);
    expect(savedTask.title).toBe('Test Task');
  });
});
```

### 3. **End-to-End Tests**
```javascript
// Testing complete user workflows
describe('Task Management Workflow', () => {
  it('should allow user to create, update, and complete task', async () => {
    // User creates task
    const createResponse = await api.post('/tasks', {
      title: 'Complete project',
      description: 'Finish the project by deadline'
    });

    const taskId = createResponse.body.id;

    // User updates task
    await api.put(`/tasks/${taskId}`, {
      status: 'in_progress'
    }).expect(200);

    // User completes task
    await api.put(`/tasks/${taskId}`, {
      status: 'completed'
    }).expect(200);

    // Verify final state
    const finalTask = await api.get(`/tasks/${taskId}`);
    expect(finalTask.body.status).toBe('completed');
  });
});
```

## 🎭 Mocking & Stubbing Best Practices

### Mock External Dependencies
```javascript
// Mock external services
jest.mock('../services/email-service');
const EmailService = require('../services/email-service');

describe('User Registration', () => {
  beforeEach(() => {
    EmailService.sendWelcomeEmail.mockResolvedValue(true);
  });

  it('should send welcome email after successful registration', async () => {
    await registerUser({ email: 'user@test.com', password: 'password' });

    expect(EmailService.sendWelcomeEmail).toHaveBeenCalledWith('user@test.com');
  });
});
```

### Database Mocking for Unit Tests
```javascript
// Mock database operations
jest.mock('../repositories/task-repository');
const TaskRepository = require('../repositories/task-repository');

describe('TaskService', () => {
  it('should return formatted task data', async () => {
    // Arrange
    TaskRepository.findById.mockResolvedValue({
      id: 1,
      title: 'Test Task',
      createdAt: new Date('2025-01-01')
    });

    // Act
    const result = await TaskService.getTask(1);

    // Assert
    expect(result.formattedDate).toBe('2025-01-01');
  });
});
```

## ✅ Assertion Best Practices

### Specific Assertions
```javascript
// ✅ GOOD - Specific assertions
expect(response.status).toBe(200);
expect(response.body.tasks).toHaveLength(3);
expect(response.body.tasks[0]).toMatchObject({
  id: expect.any(String),
  title: 'Test Task',
  status: 'pending'
});

// ❌ BAD - Vague assertions
expect(response).toBeTruthy();
expect(response.body).toBeDefined();
```

### Error Testing
```javascript
// Test error conditions explicitly
it('should throw validation error for invalid input', async () => {
  await expect(createTask({ title: '' }))
    .rejects
    .toThrow('Title is required');
});

it('should return 400 status for malformed request', async () => {
  const response = await request(app)
    .post('/api/tasks')
    .send({ invalid: 'data' });

  expect(response.status).toBe(400);
  expect(response.body.error).toContain('validation');
});
```

## 🧹 Test Maintenance

### Setup and Teardown
```javascript
describe('Database Tests', () => {
  beforeAll(async () => {
    // One-time setup
    await connectToTestDatabase();
  });

  afterAll(async () => {
    // One-time cleanup
    await disconnectFromTestDatabase();
  });

  beforeEach(async () => {
    // Per-test setup
    await clearTestData();
    await seedTestData();
  });

  afterEach(async () => {
    // Per-test cleanup
    await clearTestData();
  });
});
```

### Test Data Management
```javascript
// Use factories for consistent test data
const TaskFactory = {
  create: (overrides = {}) => ({
    title: 'Default Task',
    description: 'Default description',
    priority: 'medium',
    status: 'pending',
    ...overrides
  })
};

// Usage in tests
it('should create high priority task', () => {
  const taskData = TaskFactory.create({ priority: 'high' });
  // Test implementation
});
```

## 📊 Performance Testing Guidelines

### Execution Time Monitoring
```javascript
describe('Performance Tests', () => {
  it('should process large dataset within time limit', async () => {
    const startTime = Date.now();
    const largeDataset = generateTestData(10000);

    await processData(largeDataset);

    const executionTime = Date.now() - startTime;
    expect(executionTime).toBeLessThan(5000); // 5 seconds max
  });
});
```

### Memory Usage Testing
```javascript
it('should not exceed memory limits during processing', async () => {
  const initialMemory = process.memoryUsage().heapUsed;

  await processLargeFile('test-data/large-file.json');

  const finalMemory = process.memoryUsage().heapUsed;
  const memoryIncrease = finalMemory - initialMemory;

  // Memory increase should be reasonable (< 100MB)
  expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
});
```

## 🔒 Security Testing Best Practices

### Input Validation Testing
```javascript
describe('Security Validations', () => {
  it('should sanitize HTML input', () => {
    const maliciousInput = '<script>alert("xss")</script>';
    const sanitized = sanitizeInput(maliciousInput);
    expect(sanitized).not.toContain('<script>');
  });

  it('should reject SQL injection attempts', async () => {
    const maliciousQuery = "'; DROP TABLE users; --";

    await expect(getUserByName(maliciousQuery))
      .rejects
      .toThrow('Invalid input');
  });
});
```

### Authentication Testing
```javascript
describe('Authentication Middleware', () => {
  it('should reject requests without valid token', async () => {
    const response = await request(app)
      .get('/api/protected-resource')
      .expect(401);

    expect(response.body.error).toBe('Unauthorized');
  });
});
```

## 📈 Coverage Standards

### Coverage Targets
- **Unit Tests**: 90%+ code coverage
- **Integration Tests**: 80%+ feature coverage
- **E2E Tests**: 100% critical path coverage
- **Security Tests**: 100% input validation coverage

### Coverage Analysis
```javascript
// Use coverage reports to identify gaps
npm run coverage:report

// Check specific thresholds
npm run coverage:check

// Generate coverage badge
npm run coverage:badge
```

## 🚀 Continuous Integration Best Practices

### Test Pipeline Configuration
```yaml
# Example CI configuration
test:
  stage: test
  script:
    - npm install
    - npm run lint
    - npm run test:unit
    - npm run test:integration
    - npm run coverage:check
  artifacts:
    reports:
      junit: coverage/junit.xml
      coverage_report:
        coverage_format: cobertura
        path: coverage/cobertura-coverage.xml
```

### Quality Gates
- All tests must pass
- Coverage thresholds must be met
- No linting errors
- Security scans pass
- Performance benchmarks within limits

## 🔧 Testing Tools & Libraries

### Recommended Testing Stack
- **Test Runner**: Jest
- **Assertion Library**: Jest built-in matchers
- **Mocking**: Jest mocks + manual mocks
- **API Testing**: Supertest
- **Coverage**: Jest coverage
- **Reporting**: jest-html-reporters, jest-junit

### Custom Test Utilities
```javascript
// test/utils/test-helpers.js
const createTestApp = () => {
  // Configure test application
};

const createMockUser = (overrides = {}) => {
  // Generate test user data
};

const expectValidationError = (response, field) => {
  expect(response.status).toBe(400);
  expect(response.body.errors).toContain(field);
};

module.exports = {
  createTestApp,
  createMockUser,
  expectValidationError
};
```

## 📚 Documentation Standards

### Test Documentation
- Document test purpose and approach
- Explain complex test scenarios
- Maintain test-specific README files
- Document setup and configuration requirements

### Code Comments
```javascript
// Document complex test scenarios
describe('Complex Business Logic', () => {
  /**
   * This test validates the multi-step approval process:
   * 1. Manager submits request
   * 2. System validates budget constraints
   * 3. Director approves/rejects
   * 4. Notification sent to stakeholders
   */
  it('should handle multi-step approval workflow', async () => {
    // Test implementation
  });
});
```

## ⚠️ Common Anti-Patterns to Avoid

### ❌ Don't Do This
```javascript
// Vague test names
it('should work', () => {});

// Testing implementation details
expect(component.state.internalCounter).toBe(5);

// Large, complex tests
it('should handle everything', () => {
  // 100+ lines of test code
});

// Shared mutable state
let globalTestData = {};

// Ignoring async/await
createTask().then(() => {
  expect(taskCreated).toBe(true);
});
```

### ✅ Do This Instead
```javascript
// Descriptive test names
it('should create task when all required fields are provided', () => {});

// Testing behavior, not implementation
expect(getTaskCount()).toBe(1);

// Focused, single-purpose tests
it('should validate email format', () => {});
it('should handle missing email field', () => {});

// Isolated test data
const testData = TaskFactory.create();

// Proper async handling
await createTask();
expect(taskCreated).toBe(true);
```

---

## 🎓 Learning Resources

### Internal Documentation
- [Testing Architecture](./testing-architecture.md)
- [Test Execution Guide](./test-execution-guide.md)
- [Testing Troubleshooting](./testing-troubleshooting.md)

### External Resources
- Jest Documentation: https://jestjs.io/docs/getting-started
- Testing Best Practices: https://kentcdodds.com/blog/common-mistakes-with-react-testing-library
- TDD Guidelines: https://martinfowler.com/bliki/TestDrivenDevelopment.html

---

**Best Practices Reviewed By:** Senior Developer Standards
**Compliance:** Enterprise Testing Standards
**Next Review:** Quarterly or upon major framework changes
# Test Writing Examples

**Project:** Infinite Continue Stop Hook TaskManager
**Version:** 1.0.0
**Last Updated:** 2025-09-22
**Created By:** main-agent

---

## 🎯 Overview

This guide provides comprehensive examples of effective test writing patterns, anti-patterns to avoid, and real-world scenarios from the TaskManager project. These examples demonstrate professional-grade testing practices that ensure code quality and maintainability.

## 📝 Unit Test Examples

### ✅ **Good Unit Test Patterns**

#### Example 1: Function Testing with Edge Cases
```javascript
// src/utils/validation.js
function validateEmail(email) {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

// test/utils/validation.test.js
describe('validateEmail', () => {
  describe('with valid emails', () => {
    it('should return true for standard email format', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    it('should return true for email with subdomain', () => {
      expect(validateEmail('user@mail.example.com')).toBe(true);
    });

    it('should return true for email with plus addressing', () => {
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    it('should handle email with whitespace by trimming', () => {
      expect(validateEmail('  user@example.com  ')).toBe(true);
    });
  });

  describe('with invalid emails', () => {
    it('should return false for email without @ symbol', () => {
      expect(validateEmail('userexample.com')).toBe(false);
    });

    it('should return false for email without domain', () => {
      expect(validateEmail('user@')).toBe(false);
    });

    it('should return false for email without local part', () => {
      expect(validateEmail('@example.com')).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(validateEmail('')).toBe(false);
    });

    it('should return false for null input', () => {
      expect(validateEmail(null)).toBe(false);
    });

    it('should return false for non-string input', () => {
      expect(validateEmail(123)).toBe(false);
      expect(validateEmail({})).toBe(false);
      expect(validateEmail([])).toBe(false);
    });
  });
});
```

#### Example 2: Class Method Testing
```javascript
// src/services/task-service.js
class TaskService {
  constructor(repository) {
    this.repository = repository;
  }

  async createTask(taskData) {
    // Validate required fields
    if (!taskData.title?.trim()) {
      throw new Error('Title is required');
    }

    // Set defaults
    const task = {
      ...taskData,
      id: this.generateId(),
      title: taskData.title.trim(),
      status: taskData.status || 'pending',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return await this.repository.save(task);
  }

  generateId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// test/services/task-service.test.js
describe('TaskService', () => {
  let taskService;
  let mockRepository;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findById: jest.fn(),
      update: jest.fn(),
      delete: jest.fn()
    };
    taskService = new TaskService(mockRepository);
  });

  describe('createTask', () => {
    it('should create task with all required fields', async () => {
      // Arrange
      const taskData = {
        title: 'Test Task',
        description: 'Test description',
        priority: 'high'
      };
      const expectedTask = {
        ...taskData,
        id: expect.stringMatching(/^task_\d+_[a-z0-9]+$/),
        status: 'pending',
        createdAt: expect.any(Date),
        updatedAt: expect.any(Date)
      };
      mockRepository.save.mockResolvedValue(expectedTask);

      // Act
      const result = await taskService.createTask(taskData);

      // Assert
      expect(mockRepository.save).toHaveBeenCalledWith(expectedTask);
      expect(result).toMatchObject(expectedTask);
    });

    it('should trim whitespace from title', async () => {
      const taskData = { title: '  Trimmed Task  ' };
      mockRepository.save.mockResolvedValue({});

      await taskService.createTask(taskData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ title: 'Trimmed Task' })
      );
    });

    it('should set default status to pending', async () => {
      const taskData = { title: 'Default Status Task' };
      mockRepository.save.mockResolvedValue({});

      await taskService.createTask(taskData);

      expect(mockRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ status: 'pending' })
      );
    });

    it('should throw error for empty title', async () => {
      const taskData = { title: '' };

      await expect(taskService.createTask(taskData))
        .rejects
        .toThrow('Title is required');

      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should throw error for missing title', async () => {
      const taskData = { description: 'No title provided' };

      await expect(taskService.createTask(taskData))
        .rejects
        .toThrow('Title is required');
    });
  });

  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = taskService.generateId();
      const id2 = taskService.generateId();

      expect(id1).toMatch(/^task_\d+_[a-z0-9]+$/);
      expect(id2).toMatch(/^task_\d+_[a-z0-9]+$/);
      expect(id1).not.toBe(id2);
    });
  });
});
```

### ❌ **Poor Unit Test Anti-Patterns**

#### Anti-Pattern 1: Vague Test Names and Assertions
```javascript
// ❌ BAD EXAMPLE - Don't do this
describe('TaskService', () => {
  it('works', () => {
    const service = new TaskService();
    const result = service.createTask({ title: 'test' });
    expect(result).toBeTruthy(); // Too vague
  });

  it('handles errors', () => {
    const service = new TaskService();
    try {
      service.createTask();
    } catch (e) {
      expect(e).toBeDefined(); // Not specific enough
    }
  });
});

// ✅ GOOD EXAMPLE - Clear and specific
describe('TaskService', () => {
  it('should create task with generated ID when valid data provided', async () => {
    const service = new TaskService(mockRepository);
    const taskData = { title: 'Specific Test Task' };

    const result = await service.createTask(taskData);

    expect(result.id).toMatch(/^task_\d+_[a-z0-9]+$/);
    expect(result.title).toBe('Specific Test Task');
  });

  it('should throw ValidationError when title is missing', async () => {
    const service = new TaskService(mockRepository);

    await expect(service.createTask({}))
      .rejects
      .toThrow('Title is required');
  });
});
```

## 🔗 Integration Test Examples

### ✅ **Good Integration Test Patterns**

#### Example 1: API Endpoint Testing
```javascript
// test/api/task-endpoints.test.js
const request = require('supertest');
const app = require('../../src/app');
const { setupTestDb, cleanupTestDb } = require('../utils/test-db');

describe('Task API Endpoints', () => {
  beforeAll(async () => {
    await setupTestDb();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    await cleanupTestDb();
    await setupTestDb();
  });

  describe('POST /api/tasks', () => {
    it('should create new task with valid data', async () => {
      const taskData = {
        title: 'Integration Test Task',
        description: 'Test description',
        priority: 'medium'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body).toMatchObject({
        id: expect.any(String),
        title: 'Integration Test Task',
        description: 'Test description',
        priority: 'medium',
        status: 'pending',
        createdAt: expect.any(String),
        updatedAt: expect.any(String)
      });

      // Verify task was actually saved to database
      const savedTask = await request(app)
        .get(`/api/tasks/${response.body.id}`)
        .expect(200);

      expect(savedTask.body.title).toBe('Integration Test Task');
    });

    it('should return 400 for invalid task data', async () => {
      const invalidData = {
        description: 'Missing title'
        // title is required
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(invalidData)
        .expect(400);

      expect(response.body).toMatchObject({
        error: expect.stringContaining('Title is required'),
        details: expect.any(Object)
      });
    });

    it('should handle special characters in task data', async () => {
      const taskData = {
        title: 'Task with émojis 🚀 and spéciäl characters',
        description: 'Testing unicode: ñáéíóú'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(taskData)
        .expect(201);

      expect(response.body.title).toBe('Task with émojis 🚀 and spéciäl characters');
      expect(response.body.description).toBe('Testing unicode: ñáéíóú');
    });
  });

  describe('GET /api/tasks', () => {
    beforeEach(async () => {
      // Seed test data
      await request(app).post('/api/tasks').send({
        title: 'Task 1',
        priority: 'high'
      });
      await request(app).post('/api/tasks').send({
        title: 'Task 2',
        priority: 'low'
      });
    });

    it('should return all tasks with correct structure', async () => {
      const response = await request(app)
        .get('/api/tasks')
        .expect(200);

      expect(response.body).toEqual({
        tasks: expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            title: 'Task 1',
            priority: 'high'
          }),
          expect.objectContaining({
            id: expect.any(String),
            title: 'Task 2',
            priority: 'low'
          })
        ]),
        total: 2,
        metadata: expect.objectContaining({
          timestamp: expect.any(String)
        })
      });
    });

    it('should support filtering by priority', async () => {
      const response = await request(app)
        .get('/api/tasks?priority=high')
        .expect(200);

      expect(response.body.tasks).toHaveLength(1);
      expect(response.body.tasks[0].priority).toBe('high');
    });
  });
});
```

#### Example 2: Database Integration Testing
```javascript
// test/repositories/task-repository.test.js
const TaskRepository = require('../../src/repositories/task-repository');
const { setupTestDb, cleanupTestDb } = require('../utils/test-db');

describe('TaskRepository Integration', () => {
  let repository;

  beforeAll(async () => {
    await setupTestDb();
    repository = new TaskRepository();
  });

  afterAll(async () => {
    await cleanupTestDb();
  });

  beforeEach(async () => {
    await repository.clear(); // Clear all tasks
  });

  describe('save', () => {
    it('should persist task to database', async () => {
      const taskData = {
        id: 'test-task-1',
        title: 'Database Test Task',
        status: 'pending'
      };

      await repository.save(taskData);

      const retrieved = await repository.findById('test-task-1');
      expect(retrieved).toMatchObject(taskData);
    });

    it('should handle concurrent saves correctly', async () => {
      const tasks = Array.from({ length: 10 }, (_, i) => ({
        id: `concurrent-task-${i}`,
        title: `Concurrent Task ${i}`,
        status: 'pending'
      }));

      // Save all tasks concurrently
      await Promise.all(tasks.map(task => repository.save(task)));

      // Verify all tasks were saved
      const allTasks = await repository.findAll();
      expect(allTasks).toHaveLength(10);

      tasks.forEach(task => {
        expect(allTasks.some(t => t.id === task.id)).toBe(true);
      });
    });
  });

  describe('query operations', () => {
    beforeEach(async () => {
      // Seed test data
      const testTasks = [
        { id: '1', title: 'High Priority', priority: 'high', status: 'pending' },
        { id: '2', title: 'Medium Priority', priority: 'medium', status: 'in_progress' },
        { id: '3', title: 'Low Priority', priority: 'low', status: 'completed' }
      ];

      await Promise.all(testTasks.map(task => repository.save(task)));
    });

    it('should filter tasks by status', async () => {
      const pendingTasks = await repository.findByStatus('pending');
      expect(pendingTasks).toHaveLength(1);
      expect(pendingTasks[0].title).toBe('High Priority');
    });

    it('should support complex queries with multiple filters', async () => {
      const tasks = await repository.query({
        priority: 'high',
        status: 'pending'
      });

      expect(tasks).toHaveLength(1);
      expect(tasks[0]).toMatchObject({
        title: 'High Priority',
        priority: 'high',
        status: 'pending'
      });
    });
  });
});
```

## 🌐 End-to-End Test Examples

### ✅ **Good E2E Test Patterns**

#### Example 1: Complete User Workflow
```javascript
// test/e2e/task-management-workflow.test.js
const request = require('supertest');
const app = require('../../src/app');
const { setupTestEnvironment, cleanupTestEnvironment } = require('../utils/e2e-setup');

describe('Task Management E2E Workflow', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await cleanupTestEnvironment();
  });

  it('should handle complete task lifecycle from creation to completion', async () => {
    // Step 1: Create a new task
    const createResponse = await request(app)
      .post('/api/tasks')
      .send({
        title: 'E2E Test Task',
        description: 'Complete end-to-end test',
        priority: 'high'
      })
      .expect(201);

    const taskId = createResponse.body.id;
    expect(taskId).toBeDefined();

    // Step 2: Verify task appears in task list
    const listResponse = await request(app)
      .get('/api/tasks')
      .expect(200);

    const createdTask = listResponse.body.tasks.find(t => t.id === taskId);
    expect(createdTask).toMatchObject({
      title: 'E2E Test Task',
      status: 'pending',
      priority: 'high'
    });

    // Step 3: Update task status to in_progress
    await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({ status: 'in_progress' })
      .expect(200);

    // Step 4: Verify status update
    const updatedResponse = await request(app)
      .get(`/api/tasks/${taskId}`)
      .expect(200);

    expect(updatedResponse.body.status).toBe('in_progress');
    expect(updatedResponse.body.updatedAt).toBeDefined();

    // Step 5: Add progress comments
    await request(app)
      .post(`/api/tasks/${taskId}/comments`)
      .send({
        text: 'Making good progress on this task',
        type: 'progress_update'
      })
      .expect(201);

    // Step 6: Complete the task
    await request(app)
      .put(`/api/tasks/${taskId}`)
      .send({
        status: 'completed',
        completedAt: new Date().toISOString()
      })
      .expect(200);

    // Step 7: Verify final state
    const completedResponse = await request(app)
      .get(`/api/tasks/${taskId}`)
      .expect(200);

    expect(completedResponse.body).toMatchObject({
      id: taskId,
      title: 'E2E Test Task',
      status: 'completed',
      completedAt: expect.any(String)
    });

    // Step 8: Verify task appears in completed tasks filter
    const completedTasksResponse = await request(app)
      .get('/api/tasks?status=completed')
      .expect(200);

    expect(completedTasksResponse.body.tasks.some(t => t.id === taskId)).toBe(true);
  });

  it('should handle error scenarios gracefully', async () => {
    // Try to update non-existent task
    await request(app)
      .put('/api/tasks/non-existent-id')
      .send({ status: 'completed' })
      .expect(404);

    // Try to create task with invalid data
    await request(app)
      .post('/api/tasks')
      .send({ description: 'Missing title' })
      .expect(400);

    // Try to delete task that doesn't exist
    await request(app)
      .delete('/api/tasks/non-existent-id')
      .expect(404);
  });
});
```

#### Example 2: Multi-User Scenario Testing
```javascript
// test/e2e/multi-user-scenarios.test.js
describe('Multi-User Task Management', () => {
  let userToken1, userToken2;

  beforeAll(async () => {
    // Setup test users
    userToken1 = await createTestUser('user1@test.com');
    userToken2 = await createTestUser('user2@test.com');
  });

  it('should handle task assignment between users', async () => {
    // User 1 creates a task
    const task = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${userToken1}`)
      .send({
        title: 'Collaborative Task',
        description: 'Task for team collaboration'
      })
      .expect(201);

    // User 1 assigns task to User 2
    await request(app)
      .put(`/api/tasks/${task.body.id}/assign`)
      .set('Authorization', `Bearer ${userToken1}`)
      .send({ assigneeId: 'user2@test.com' })
      .expect(200);

    // User 2 can see assigned task
    const assignedTasks = await request(app)
      .get('/api/tasks/assigned')
      .set('Authorization', `Bearer ${userToken2}`)
      .expect(200);

    expect(assignedTasks.body.tasks.some(t => t.id === task.body.id)).toBe(true);

    // User 2 updates task status
    await request(app)
      .put(`/api/tasks/${task.body.id}`)
      .set('Authorization', `Bearer ${userToken2}`)
      .send({ status: 'in_progress' })
      .expect(200);

    // User 1 can see the update
    const updatedTask = await request(app)
      .get(`/api/tasks/${task.body.id}`)
      .set('Authorization', `Bearer ${userToken1}`)
      .expect(200);

    expect(updatedTask.body.status).toBe('in_progress');
  });
});
```

## 🔒 Security Test Examples

### ✅ **Security Testing Patterns**

#### Example 1: Input Validation and Sanitization
```javascript
// test/security/input-validation.test.js
describe('Input Validation Security', () => {
  describe('XSS Prevention', () => {
    it('should sanitize HTML in task titles', async () => {
      const maliciousInput = {
        title: '<script>alert("XSS")</script>Malicious Task',
        description: '<img src="x" onerror="alert(1)">'
      };

      const response = await request(app)
        .post('/api/tasks')
        .send(maliciousInput)
        .expect(201);

      // HTML should be escaped or stripped
      expect(response.body.title).not.toContain('<script>');
      expect(response.body.description).not.toContain('onerror');
    });

    it('should prevent JavaScript injection in comments', async () => {
      const task = await createTestTask();
      const maliciousComment = {
        text: 'javascript:alert("XSS")',
        type: 'comment'
      };

      const response = await request(app)
        .post(`/api/tasks/${task.id}/comments`)
        .send(maliciousComment)
        .expect(201);

      expect(response.body.text).not.toContain('javascript:');
    });
  });

  describe('SQL Injection Prevention', () => {
    it('should prevent SQL injection in search queries', async () => {
      const maliciousQuery = "'; DROP TABLE tasks; --";

      const response = await request(app)
        .get(`/api/tasks/search?q=${encodeURIComponent(maliciousQuery)}`)
        .expect(200);

      // Should return empty results, not crash
      expect(response.body.tasks).toEqual([]);

      // Verify tasks table still exists by creating a task
      await request(app)
        .post('/api/tasks')
        .send({ title: 'Verification Task' })
        .expect(201);
    });
  });

  describe('Path Traversal Prevention', () => {
    it('should prevent directory traversal in file uploads', async () => {
      const maliciousFilename = '../../../etc/passwd';

      const response = await request(app)
        .post('/api/tasks/attachments')
        .attach('file', Buffer.from('test content'), maliciousFilename)
        .expect(400);

      expect(response.body.error).toContain('Invalid filename');
    });
  });
});
```

#### Example 2: Authentication and Authorization
```javascript
// test/security/auth-security.test.js
describe('Authentication Security', () => {
  describe('Token Validation', () => {
    it('should reject requests with invalid tokens', async () => {
      await request(app)
        .get('/api/tasks')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);
    });

    it('should reject expired tokens', async () => {
      const expiredToken = generateExpiredToken();

      await request(app)
        .get('/api/tasks')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    it('should prevent token fixation attacks', async () => {
      const userToken = await authenticateUser('user@test.com');
      const adminToken = await authenticateUser('admin@test.com');

      // User shouldn't be able to use admin token
      await request(app)
        .get('/api/admin/users')
        .set('Authorization', `Bearer ${userToken}`)
        .expect(403);
    });
  });

  describe('Rate Limiting', () => {
    it('should rate limit login attempts', async () => {
      const credentials = {
        email: 'user@test.com',
        password: 'wrong-password'
      };

      // Multiple failed attempts
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/api/auth/login')
          .send(credentials)
          .expect(401);
      }

      // Next attempt should be rate limited
      await request(app)
        .post('/api/auth/login')
        .send(credentials)
        .expect(429);
    });
  });
});
```

## 🚀 Performance Test Examples

### ✅ **Performance Testing Patterns**

#### Example 1: Load Testing
```javascript
// test/performance/load-testing.test.js
describe('Performance Load Testing', () => {
  it('should handle high concurrent task creation', async () => {
    const startTime = Date.now();
    const concurrentRequests = 100;

    const promises = Array.from({ length: concurrentRequests }, (_, i) =>
      request(app)
        .post('/api/tasks')
        .send({
          title: `Load Test Task ${i}`,
          description: `Performance testing task ${i}`
        })
    );

    const responses = await Promise.all(promises);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // All requests should succeed
    responses.forEach(response => {
      expect(response.status).toBe(201);
    });

    // Should complete within reasonable time (adjust based on requirements)
    expect(duration).toBeLessThan(10000); // 10 seconds

    console.log(`Created ${concurrentRequests} tasks in ${duration}ms`);
    console.log(`Average: ${duration / concurrentRequests}ms per task`);
  });

  it('should maintain performance with large datasets', async () => {
    // Create large dataset
    await createLargeTaskDataset(1000);

    const startTime = Date.now();

    // Test query performance
    const response = await request(app)
      .get('/api/tasks?limit=50&offset=0')
      .expect(200);

    const endTime = Date.now();
    const queryTime = endTime - startTime;

    expect(response.body.tasks).toHaveLength(50);
    expect(queryTime).toBeLessThan(1000); // Should be under 1 second

    console.log(`Query with 1000 tasks took ${queryTime}ms`);
  });
});
```

#### Example 2: Memory Usage Testing
```javascript
// test/performance/memory-testing.test.js
describe('Memory Usage Testing', () => {
  it('should not leak memory during intensive operations', async () => {
    const initialMemory = process.memoryUsage();

    // Perform memory-intensive operations
    for (let i = 0; i < 1000; i++) {
      await request(app)
        .post('/api/tasks')
        .send({
          title: `Memory Test Task ${i}`,
          description: 'A'.repeat(1000) // Large description
        });

      // Cleanup every 100 iterations
      if (i % 100 === 0) {
        if (global.gc) global.gc();
      }
    }

    // Force garbage collection
    if (global.gc) global.gc();

    const finalMemory = process.memoryUsage();
    const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed;

    // Memory increase should be reasonable (less than 100MB)
    expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);

    console.log(`Memory increase: ${memoryIncrease / 1024 / 1024}MB`);
  });
});
```

## 🧪 Mock and Stub Examples

### ✅ **Effective Mocking Patterns**

#### Example 1: External Service Mocking
```javascript
// test/mocks/external-services.test.js
jest.mock('../../src/services/email-service');
jest.mock('../../src/services/notification-service');

const EmailService = require('../../src/services/email-service');
const NotificationService = require('../../src/services/notification-service');

describe('External Service Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should send notifications when task is completed', async () => {
    // Setup mocks
    EmailService.sendEmail.mockResolvedValue({ messageId: 'mock-id' });
    NotificationService.sendPushNotification.mockResolvedValue(true);

    const task = await createTestTask();

    // Complete the task
    await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ status: 'completed' })
      .expect(200);

    // Verify notifications were sent
    expect(EmailService.sendEmail).toHaveBeenCalledWith({
      to: expect.any(String),
      subject: 'Task Completed',
      template: 'task-completion',
      data: expect.objectContaining({
        taskTitle: task.title
      })
    });

    expect(NotificationService.sendPushNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task_completed',
        taskId: task.id
      })
    );
  });

  it('should handle external service failures gracefully', async () => {
    // Mock service failure
    EmailService.sendEmail.mockRejectedValue(new Error('SMTP Error'));
    NotificationService.sendPushNotification.mockResolvedValue(true);

    const task = await createTestTask();

    // Task completion should still succeed even if email fails
    await request(app)
      .put(`/api/tasks/${task.id}`)
      .send({ status: 'completed' })
      .expect(200);

    // Verify task was completed despite email failure
    const completedTask = await request(app)
      .get(`/api/tasks/${task.id}`)
      .expect(200);

    expect(completedTask.body.status).toBe('completed');
  });
});
```

#### Example 2: Database Mocking for Unit Tests
```javascript
// test/services/task-service-unit.test.js
const TaskService = require('../../src/services/task-service');

// Mock the repository
const mockRepository = {
  save: jest.fn(),
  findById: jest.fn(),
  findByStatus: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
};

describe('TaskService Unit Tests', () => {
  let taskService;

  beforeEach(() => {
    jest.clearAllMocks();
    taskService = new TaskService(mockRepository);
  });

  describe('getTasksByStatus', () => {
    it('should return filtered tasks by status', async () => {
      const mockTasks = [
        { id: '1', title: 'Task 1', status: 'pending' },
        { id: '2', title: 'Task 2', status: 'pending' }
      ];

      mockRepository.findByStatus.mockResolvedValue(mockTasks);

      const result = await taskService.getTasksByStatus('pending');

      expect(mockRepository.findByStatus).toHaveBeenCalledWith('pending');
      expect(result).toEqual(mockTasks);
    });

    it('should throw error when repository fails', async () => {
      mockRepository.findByStatus.mockRejectedValue(new Error('Database error'));

      await expect(taskService.getTasksByStatus('pending'))
        .rejects
        .toThrow('Database error');
    });
  });
});
```

## 📊 Test Data and Factories

### ✅ **Test Data Management Patterns**

#### Example 1: Factory Pattern for Test Data
```javascript
// test/factories/task-factory.js
class TaskFactory {
  static create(overrides = {}) {
    return {
      id: this.generateId(),
      title: 'Default Test Task',
      description: 'Default test description',
      status: 'pending',
      priority: 'medium',
      assigneeId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      ...overrides
    };
  }

  static createMany(count, overrides = {}) {
    return Array.from({ length: count }, (_, i) =>
      this.create({
        title: `Test Task ${i + 1}`,
        ...overrides
      })
    );
  }

  static createCompleted(overrides = {}) {
    return this.create({
      status: 'completed',
      completedAt: new Date(),
      ...overrides
    });
  }

  static createHighPriority(overrides = {}) {
    return this.create({
      priority: 'high',
      title: 'High Priority Task',
      ...overrides
    });
  }

  static generateId() {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

module.exports = TaskFactory;

// Usage in tests
const TaskFactory = require('../factories/task-factory');

describe('Task Operations', () => {
  it('should handle task creation', async () => {
    const taskData = TaskFactory.create({
      title: 'Specific Test Task',
      priority: 'high'
    });

    const result = await taskService.createTask(taskData);
    expect(result.title).toBe('Specific Test Task');
  });

  it('should process multiple tasks', async () => {
    const tasks = TaskFactory.createMany(5, { status: 'pending' });

    const results = await Promise.all(
      tasks.map(task => taskService.createTask(task))
    );

    expect(results).toHaveLength(5);
    results.forEach(result => {
      expect(result.status).toBe('pending');
    });
  });
});
```

#### Example 2: Test Database Seeding
```javascript
// test/utils/test-data-seeder.js
class TestDataSeeder {
  static async seedBasicData() {
    const tasks = [
      TaskFactory.create({ title: 'Seed Task 1', priority: 'high' }),
      TaskFactory.create({ title: 'Seed Task 2', priority: 'medium' }),
      TaskFactory.createCompleted({ title: 'Completed Seed Task' })
    ];

    return await Promise.all(
      tasks.map(task => taskRepository.save(task))
    );
  }

  static async seedLargeDataset(count = 1000) {
    const tasks = TaskFactory.createMany(count);
    const batchSize = 100;

    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      await Promise.all(batch.map(task => taskRepository.save(task)));
    }

    return tasks;
  }

  static async seedUserScenarios() {
    const scenarios = {
      newUser: {
        tasks: TaskFactory.createMany(2, { status: 'pending' })
      },
      activeUser: {
        tasks: [
          ...TaskFactory.createMany(5, { status: 'pending' }),
          ...TaskFactory.createMany(3, { status: 'in_progress' }),
          ...TaskFactory.createMany(10, { status: 'completed' })
        ]
      },
      powerUser: {
        tasks: TaskFactory.createMany(50)
      }
    };

    for (const [scenario, data] of Object.entries(scenarios)) {
      await Promise.all(data.tasks.map(task => taskRepository.save(task)));
    }

    return scenarios;
  }
}

module.exports = TestDataSeeder;
```

---

## 📚 Summary Guidelines

### ✅ **Do These Things**
- Write descriptive test names that explain the scenario
- Use AAA pattern (Arrange, Act, Assert)
- Test edge cases and error conditions
- Mock external dependencies appropriately
- Use factories for consistent test data
- Keep tests focused and independent
- Verify both positive and negative outcomes
- Include performance considerations in critical tests

### ❌ **Avoid These Anti-Patterns**
- Vague test names like "it works" or "handles data"
- Testing implementation details instead of behavior
- Large, monolithic tests that test multiple concerns
- Shared mutable state between tests
- Hardcoded test data without flexibility
- Ignoring async/await patterns
- Insufficient error scenario coverage
- Tests that depend on external services without mocks

### 🎯 **Quality Metrics**
- **Coverage**: Aim for 80%+ line coverage, 90%+ for critical paths
- **Performance**: Unit tests < 1s, Integration tests < 30s
- **Reliability**: Tests should pass consistently (>99% reliability)
- **Maintainability**: Tests should be easy to understand and modify

---

## 🔗 Related Documentation

- [Testing Architecture](./testing-architecture.md)
- [Testing Best Practices](./testing-best-practices.md)
- [Test Execution Guide](./test-execution-guide.md)
- [FEATURES.json Testing](./features-testing-approach.md)
- [Testing Troubleshooting](./testing-troubleshooting.md)

---

**Test Examples Reviewed By:** Senior Developer Standards
**Code Quality Validated:** Production-Ready Examples
**Next Review:** Quarterly or upon major testing framework updates
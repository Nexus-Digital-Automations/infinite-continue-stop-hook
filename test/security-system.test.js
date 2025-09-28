/**
 * Security System Tests
 *
 * Tests for the comprehensive security framework including SecurityValidator,
 * SecurityMiddleware, And SecurityManager components.
 */

const {
  SecurityValidator,
  SecurityMiddleware,
  SecurityManager,
} = require('../lib/api-modules/security');

describe('Security System', () => {
  let securityValidator;
  let securityMiddleware;
  let securityManager;

  beforeEach(() => {
    securityValidator = new SecurityValidator();
    securityMiddleware = new SecurityMiddleware();
    securityManager = new SecurityManager();
  });

  describe('SecurityValidator', () => {
    test('should initialize with default configuration', () => {
      expect(securityValidator).toBeDefined();
      expect(securityValidator.config.maxStringLength).toBe(10000);
      expect(securityValidator.config.allowedAgentRoles).toContain(
        'development'
      );
    });

    test('should validate input data successfully', () => {
      const testData = {
        title: 'Test Task',
        description: 'Test description',
        category: 'feature',
      };

      const schema = {
        required: ['title', 'description'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
        },
      };

      const result = securityValidator.validateInput(
        testData,
        'test_endpoint',
        schema
      );
      expect(result.valid).toBe(true);
      expect(result.data).toEqual(testData);
    });

    test('should detect security threats in input', () => {
      const maliciousData = {
        title: '<script>alert("xss")</script>',
        description: 'Normal description',
      };

      const schema = {
        required: ['title', 'description'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
        },
      };

      const result = securityValidator.validateInput(
        maliciousData,
        'test_endpoint',
        schema
      );
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Security threats detected');
    });

    test('should authorize valid agent operations', () => {
      const agentId = 'development_session_1234567890_1_general_abcdef';
      const operation = 'create';
      const resource = { type: 'task', id: 'test_task' };

      const result = securityValidator.authorizeOperation(
        agentId,
        operation,
        resource
      );
      expect(result.authorized).toBe(true);
      expect(result.agentRole).toBe('development');
    });

    test('should reject invalid agent IDs', () => {
      const invalidAgentId = 'invalid_agent_id';
      const OPERATION = 'create';
      const resource = { type: 'task' };

      const result = securityValidator.authorizeOperation(
        invalidAgentId,
        operation,
        resource
      );
      expect(result.authorized).toBe(false);
      expect(result.error).toContain('Invalid agent ID format');
    });

    test('should sanitize research input data', () => {
      const maliciousInput = {
        content: '<script>alert("xss")</script>Hello World',
        data: 'SELECT * FROM users; DROP TABLE users;',
      };

      const sanitized = securityValidator.sanitizeResearchInput(maliciousInput);
      expect(sanitized.content).not.toContain('<script>');
      expect(sanitized.data).not.toContain('DROP TABLE');
    });

    test('should maintain audit trail', () => {
      securityValidator.auditLog('TEST_EVENT', {
        agentId: 'test_agent',
        operation: 'test_operation',
      });

      const auditTrail = securityValidator.getAuditTrail({
        event: 'TEST_EVENT',
      });
      expect(auditTrail.length).toBeGreaterThan(0);
      expect(auditTrail[0].event).toBe('TEST_EVENT');
    });

    test('should provide security metrics', () => {
      const metrics = securityValidator.getSecurityMetrics();
      expect(metrics).toHaveProperty('totalAuditEntries');
      expect(metrics).toHaveProperty('uptime');
      expect(metrics).toHaveProperty('memoryUsage');
    });
  });

  describe('SecurityMiddleware', () => {
    test('should initialize with default configuration', () => {
      expect(securityMiddleware).toBeDefined();
      expect(securityMiddleware.config.maxRequestsPerMinute).toBe(100);
      expect(securityMiddleware.config.maxRequestsPerHour).toBe(1000);
    });

    test('should create security middleware function', () => {
      const middleware = securityMiddleware.createSecurityMiddleware();
      expect(typeof middleware).toBe('function');
      expect(middleware.length).toBe(3); // req, res, next
    });

    test('should create response middleware function', () => {
      const responseMiddleware = securityMiddleware.createResponseMiddleware();
      expect(typeof responseMiddleware).toBe('function');
      expect(responseMiddleware.length).toBe(3); // req, res, next
    });

    test('should provide security metrics', () => {
      const metrics = securityMiddleware.getSecurityMetrics();
      expect(metrics).toHaveProperty('middleware');
      expect(metrics).toHaveProperty('rateLimiting');
      expect(metrics).toHaveProperty('validation');
    });
  });

  describe('SecurityManager', () => {
    test('should initialize with default configuration', () => {
      expect(securityManager).toBeDefined();
      expect(securityManager.config.integrationMode).toBe('full');
      expect(securityManager.config.enableAuditTrail).toBe(true);
    });

    test('should initialize with custom options', () => {
      const customOptions = {
        integrationMode: 'minimal',
        enableRateLimiting: false,
        enableAuditTrail: false,
      };

      const customManager = new SecurityManager(customOptions);
      expect(customManager.config.integrationMode).toBe('minimal');
      expect(customManager.config.enableRateLimiting).toBe(false);
      expect(customManager.config.enableAuditTrail).toBe(false);
    });

    test('should provide security status', () => {
      const status = securityManager.getSecurityStatus();
      expect(status).toHaveProperty('integrationMode');
      expect(status).toHaveProperty('components');
      expect(status).toHaveProperty('features');
      expect(status.components.validator.active).toBe(true);
      expect(status.components.middleware.active).toBe(true);
    });

    test('should shutdown cleanly', () => {
      // This should not throw an error
      expect(() => {
        securityManager.shutdown();
      }).not.toThrow();
    });
  });

  describe('Integration Tests', () => {
    test('should integrate all security components', async () => {
      const mockTaskManager = {
        createTask: jest
          .fn()
          .mockResolvedValue({ id: 'test_task', title: 'Test Task' }),
        updateTask: jest
          .fn()
          .mockResolvedValue({ id: 'test_task', updated: true }),
        completeTask: jest
          .fn()
          .mockResolvedValue({ id: 'test_task', completed: true }),
      };

      const integrationResult =
        await securityManager.initializeSecuritySystem(mockTaskManager);
      expect(integrationResult).toHaveProperty('mode');
      expect(integrationResult).toHaveProperty('features');
      expect(integrationResult).toHaveProperty('middlewares');
    });

    test('should validate complete security workflow', () => {
      const agentId = 'development_session_1234567890_1_general_abcdef';
      const taskData = {
        title: 'Security Test Task',
        description: 'Testing security validation',
        category: 'feature',
      };

      // 1. Validate input
      const schema = {
        required: ['title', 'description', 'category'],
        properties: {
          title: { type: 'string' },
          description: { type: 'string' },
          category: { type: 'string' },
        },
      };

      const inputValidation = securityValidator.validateInput(
        taskData,
        'create_task',
        schema
      );
      expect(inputValidation.valid).toBe(true);

      // 2. Authorize operation
      const authorization = securityValidator.authorizeOperation(
        agentId,
        'create',
        { type: 'task' }
      );
      expect(authorization.authorized).toBe(true);

      // 3. Sanitize data
      const sanitizedData = securityValidator.sanitizeResearchInput(
        inputValidation.data
      );
      expect(sanitizedData).toBeDefined();

      // 4. Audit the operation
      securityValidator.auditLog('TASK_CREATION_TEST', {
        agentId,
        operation: 'create',
        success: true,
      });

      const auditEntries = securityValidator.getAuditTrail({
        event: 'TASK_CREATION_TEST',
      });
      expect(auditEntries.length).toBeGreaterThan(0);
    });
  });
});

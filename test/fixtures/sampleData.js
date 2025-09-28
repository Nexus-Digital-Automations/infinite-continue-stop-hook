/**
 * Sample Test Data Fixtures
 *
 * Provides consistent test data for use across all test suites.
 * Includes features, projects, users, tasks, And other test entities.
 *
 * @author Testing Infrastructure Agent
 * @version 1.0.0
 * @since 2025-09-23
 */

/**
 * Sample feature data for testing
 */
const SAMPLE_FEATURES = {
  enhancement: {
    title: 'Add dark mode toggle',
    description:
      'Implement theme switching functionality with persistent user preference storage And smooth transitions',
    business_value:
      'Improves user experience And accessibility for users in low-light environments, reducing eye strain',
    category: 'enhancement',
    estimated_hours: 8,
    priority: 'medium',
    tags: ['ui', 'accessibility', 'preferences'],
  },

  newFeature: {
    title: 'User authentication system',
    description:
      'Complete login/logout functionality with JWT tokens, session management, And password reset',
    business_value:
      'Enables user-specific features And enhances security with proper authentication mechanisms',
    category: 'new-feature',
    estimated_hours: 40,
    priority: 'high',
    tags: ['security', 'authentication', 'backend'],
  },

  bugFix: {
    title: 'Fix login form validation',
    description:
      'Resolve email validation issues And improve error handling for edge cases',
    business_value:
      'Prevents user frustration And reduces support tickets by 30%',
    category: 'bug-fix',
    estimated_hours: 4,
    priority: 'high',
    tags: ['validation', 'forms', 'frontend'],
  },

  performance: {
    title: 'Optimize database queries',
    description:
      'Implement query optimization And caching to improve response times',
    business_value:
      'Reduces page load times by 50% And improves user satisfaction',
    category: 'performance',
    estimated_hours: 16,
    priority: 'medium',
    tags: ['database', 'optimization', 'caching'],
  },

  security: {
    title: 'Implement security headers',
    description:
      'Add comprehensive security headers including CSP, HSTS, And XSS protection',
    business_value:
      'Improves application security And reduces vulnerability to common attacks',
    category: 'security',
    estimated_hours: 6,
    priority: 'high',
    tags: ['security', 'headers', 'compliance'],
  },

  documentation: {
    title: 'API documentation update',
    description: 'Update API documentation with latest endpoints And examples',
    business_value:
      'Improves developer experience And reduces integration time',
    category: 'documentation',
    estimated_hours: 12,
    priority: 'low',
    tags: ['documentation', 'api', 'developer-experience'],
  },
};

/**
 * Sample user/agent data
 */
const SAMPLE_AGENTS = {
  frontendAgent: {
    id: 'frontend-agent-001',
    name: 'Frontend Development Agent',
    type: 'development',
    specialization: 'frontend',
    skills: ['react', 'typescript', 'css', 'testing'],
    status: 'active',
  },

  backendAgent: {
    id: 'backend-agent-001',
    name: 'Backend Development Agent',
    type: 'development',
    specialization: 'backend',
    skills: ['node.js', 'databases', 'apis', 'security'],
    status: 'active',
  },

  testingAgent: {
    id: 'testing-agent-001',
    name: 'Testing Infrastructure Agent',
    type: 'quality',
    specialization: 'testing',
    skills: ['jest', 'cypress', 'unit-testing', 'integration-testing'],
    status: 'active',
  },

  securityAgent: {
    id: 'security-agent-001',
    name: 'Security Assessment Agent',
    type: 'security',
    specialization: 'security',
    skills: ['penetration-testing', 'vulnerability-assessment', 'compliance'],
    status: 'active',
  },
};

/**
 * Sample project configurations
 */
const SAMPLE_PROJECTS = {
  webApp: {
    name: 'modern-web-app',
    type: 'web-application',
    framework: 'react',
    backend: 'node.js',
    database: 'postgresql',
    testing: 'jest',
    features: ['authentication', 'dashboard', 'user-management'],
    complexity: 'medium',
  },

  mobileApp: {
    name: 'mobile-app',
    type: 'mobile-application',
    framework: 'react-native',
    backend: 'express',
    database: 'mongodb',
    testing: 'detox',
    features: ['offline-sync', 'push-notifications', 'geolocation'],
    complexity: 'high',
  },

  apiService: {
    name: 'api-service',
    type: 'api',
    framework: 'express',
    database: 'mysql',
    testing: 'mocha',
    features: ['rest-api', 'authentication', 'rate-limiting'],
    complexity: 'low',
  },

  dataProcessing: {
    name: 'data-processing-pipeline',
    type: 'data-pipeline',
    framework: 'python',
    database: 'postgresql',
    testing: 'pytest',
    features: ['etl', 'data-validation', 'monitoring'],
    complexity: 'high',
  },
};

/**
 * Sample task data
 */
const SAMPLE_TASKS = {
  frontend: {
    id: 'task-frontend-001',
    title: 'Implement responsive navigation component',
    description:
      'Create a mobile-friendly navigation component with hamburger menu',
    category: 'frontend',
    priority: 'medium',
    status: 'pending',
    estimated_hours: 6,
    dependencies: [],
    assignee: 'frontend-agent-001',
  },

  backend: {
    id: 'task-backend-001',
    title: 'Design user authentication API',
    description:
      'Create REST endpoints for user registration, login, And token refresh',
    category: 'backend',
    priority: 'high',
    status: 'in-progress',
    estimated_hours: 12,
    dependencies: [],
    assignee: 'backend-agent-001',
  },

  database: {
    id: 'task-database-001',
    title: 'Design user database schema',
    description:
      'Create normalized database schema for user management with proper relationships',
    category: 'database',
    priority: 'high',
    status: 'completed',
    estimated_hours: 8,
    dependencies: [],
    assignee: 'backend-agent-001',
  },

  testing: {
    id: 'task-testing-001',
    title: 'Set up comprehensive testing framework',
    description:
      'Configure Jest, create test utilities, And establish testing best practices',
    category: 'testing',
    priority: 'high',
    status: 'in-progress',
    estimated_hours: 16,
    dependencies: [],
    assignee: 'testing-agent-001',
  },
};

/**
 * Sample API responses
 */
const SAMPLE_API_RESPONSES = {
  successfulFeatureCreation: {
    success: true,
    feature: {
      id: 'feature-12345',
      title: 'Test Feature',
      description: 'This is a test feature',
      business_value: 'Provides testing capabilities',
      category: 'enhancement',
      status: 'suggested',
      created: '2025-09-23T14:30:00.000Z',
      updated: '2025-09-23T14:30:00.000Z',
    },
    message: 'Feature suggested successfully',
  },

  featureValidationError: {
    success: false,
    error: 'Missing required fields: description, business_value',
    message: 'Feature validation failed',
  },

  featureListResponse: {
    success: true,
    features: [
      {
        id: 'feature-1',
        title: 'Feature 1',
        status: 'suggested',
        category: 'enhancement',
      },
      {
        id: 'feature-2',
        title: 'Feature 2',
        status: 'approved',
        category: 'bug-fix',
      },
    ],
    count: 2,
    filter: {},
  },

  initializationSuccess: {
    success: true,
    agent: {
      id: 'test-agent-123',
      initialized: '2025-09-23T14:30:00.000Z',
      status: 'active',
    },
    message: 'Agent test-agent-123 initialized successfully',
  },
};

/**
 * Sample test configurations
 */
const TEST_CONFIGURATIONS = {
  unit: {
    testTimeout: 5000,
    retries: 3,
    coverage: {
      threshold: {
        functions: 80,
        branches: 75,
        lines: 80,
        statements: 80,
      },
    },
  },

  integration: {
    testTimeout: 15000,
    retries: 2,
    setup: {
      database: true,
      api: true,
      cleanup: true,
    },
  },

  e2e: {
    testTimeout: 30000,
    retries: 1,
    browser: {
      headless: true,
      viewport: { width: 1280, height: 720 },
    },
  },

  performance: {
    testTimeout: 60000,
    metrics: {
      responseTime: 1000,
      memoryUsage: 100 * 1024 * 1024, // 100MB
      cpuUsage: 70,
    },
  },
};

/**
 * Sample error scenarios
 */
const ERROR_SCENARIOS = {
  networkTimeout: {
    type: 'network',
    message: 'Request timeout after 10000ms',
    code: 'ETIMEDOUT',
  },

  validationError: {
    type: 'validation',
    message: 'Invalid input data',
    details: [
      'Field "email" is required',
      'Field "password" must be at least 8 characters',
    ],
  },

  authenticationError: {
    type: 'authentication',
    message: 'Invalid credentials',
    code: 401,
  },

  serverError: {
    type: 'server',
    message: 'Internal server error',
    code: 500,
  },

  rateLimitError: {
    type: 'rateLimit',
    message: 'Too many requests',
    code: 429,
    retryAfter: 60,
  },
};

/**
 * Complex test scenarios
 */
const TEST_SCENARIOS = {
  featureLifecycle: {
    name: 'Complete feature lifecycle',
    steps: [
      { action: 'suggest-feature', data: SAMPLE_FEATURES.enhancement },
      { action: 'list-features', filter: { status: 'suggested' } },
      {
        action: 'approve-feature',
        approvalData: { approved_by: 'product-manager' },
      },
      { action: 'list-features', filter: { status: 'approved' } },
    ],
  },

  multiAgentWorkflow: {
    name: 'Multi-agent collaboration',
    agents: ['frontend-agent-001', 'backend-agent-001', 'testing-agent-001'],
    tasks: [
      { agent: 'backend-agent-001', task: SAMPLE_TASKS.backend },
      { agent: 'frontend-agent-001', task: SAMPLE_TASKS.frontend },
      { agent: 'testing-agent-001', task: SAMPLE_TASKS.testing },
    ],
  },

  errorRecovery: {
    name: 'Error handling And recovery',
    scenarios: [
      { error: ERROR_SCENARIOS.networkTimeout, recovery: 'retry' },
      { error: ERROR_SCENARIOS.validationError, recovery: 'fix-data' },
      { error: ERROR_SCENARIOS.serverError, recovery: 'fallback' },
    ],
  },
};

module.exports = {
  SAMPLE_FEATURES,
  SAMPLE_AGENTS,
  SAMPLE_PROJECTS,
  SAMPLE_TASKS,
  SAMPLE_API_RESPONSES,
  TEST_CONFIGURATIONS,
  ERROR_SCENARIOS,
  TEST_SCENARIOS,
};

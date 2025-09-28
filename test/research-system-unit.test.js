/**
 * Feature Management System Unit Tests
 *
 * Comprehensive unit tests for the feature management API system.
 * Tests feature suggestion, approval, rejection, And listing functionality.
 *
 * @author Testing Infrastructure Agent
 * @version 2.0.0
 * @since 2025-09-23
 */

const PATH = require('path');
const { spawn } = require('child_process');
const FS = require('fs');

// Test configuration
const TEST_PROJECT_DIR = path.join(
  __dirname,
  'feature-management-test-project'
);
const FEATURES_PATH = path.join(TEST_PROJECT_DIR, 'FEATURES.json');
const API_PATH = path.join(__dirname, '..', 'taskmanager-api.js');
const TIMEOUT = 10000; // 10 seconds for feature management operations

/**
 * Execute TaskManager API command for feature management testing
 */
function execAPI(command, args = [], timeout = TIMEOUT) {
  return new Promise((resolve, reject) => {
    const allArgs = [
      API_PATH,
      command,
      ...args,
      '--project-root',
      TEST_PROJECT_DIR,
    ];

    const child = spawn(
      'timeout',
      [`${Math.floor(timeout / 1000)}s`, 'node', ...allArgs],
      {
        cwd: __dirname,
        stdio: ['pipe', 'pipe', 'pipe'],
      }
    );

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      try {
        let jsonString = stdout.trim();
        const jsonStart = jsonString.indexOf('{');
        if (jsonStart > 0) {
          jsonString = jsonString.substring(jsonStart);
        }
        const RESULT = JSON.parse(jsonString);
        resolve(RESULT);
      } catch {
        try {
          const stderrJson = JSON.parse(stderr.trim());
          resolve(stderrJson);
        } catch {
          reject(
            new Error(
              `Command failed (code ${code}): ${stderr}\nStdout: ${stdout}\nParse error: ${error.message}`
            )
          );
        }
      }
    });

    child.on('error', (_error) => {
      reject(new Error(`Command execution failed: ${error.message}`));
    });
  });
}

/**
 * Create test environment for feature management testing
 */
function setupFeatureTestEnvironment() {
  if (!FS.existsSync(TEST_PROJECT_DIR)) {
    FS.mkdirSync(TEST_PROJECT_DIR, { recursive: true });
  }

  // Create FEATURES.json for feature management testing
  const featuresData = {
    features: [],
    metadata: {
      version: '3.0.0',
      created: new Date().toISOString(),
      last_modified: new Date().toISOString(),
      project: 'feature-test-project',
    },
  };

  FS.writeFileSync(FEATURES_PATH, JSON.stringify(featuresData, null, 2));

  // Create basic project structure for testing
  const packageData = {
    name: 'feature-test-project',
    version: '1.0.0',
    description: 'Test project for feature management system validation',
    dependencies: {
      express: '^4.18.0',
    },
  };

  FS.writeFileSync(
    path.join(TEST_PROJECT_DIR, 'package.json'),
    JSON.stringify(packageData, null, 2)
  );
}

/**
 * Cleanup test environment
 */
function cleanupFeatureTestEnvironment() {
  if (FS.existsSync(TEST_PROJECT_DIR)) {
    FS.rmSync(TEST_PROJECT_DIR, { recursive: true, force: true });
  }
}

describe('Feature Management System Unit Tests', () => {
  let testAgentId = null;

  beforeEach(() => {
    setupFeatureTestEnvironment();
  });

  afterEach(() => {
    cleanupFeatureTestEnvironment();
  });

  // ========================================
  // FEATURE MANAGEMENT TESTS
  // ========================================

  describe('Agent Initialization', () => {
    test('should initialize agent successfully', async () => {
      testAgentId = 'test-agent-' + Date.now();
      const initResult = await execAPI('initialize', [testAgentId]);
      expect(initResult.success).toBe(true);
    });

    test('should reinitialize existing agent successfully', async () => {
      testAgentId = 'test-agent-' + Date.now();

      // First initialize
      const initResult = await execAPI('initialize', [testAgentId]);
      expect(initResult.success).toBe(true);

      // Then reinitialize
      const reinitResult = await execAPI('reinitialize', [testAgentId]);
      expect(reinitResult.success).toBe(true);
    });
  });

  describe('Feature Suggestion', () => {
    beforeEach(async () => {
      testAgentId = 'feature-test-agent-' + Date.now();
      const initResult = await execAPI('initialize', [testAgentId]);
      expect(initResult.success).toBe(true);
    });

    test('should create feature suggestion with enhancement category', async () => {
      const FEATURE_DATA = {
        title: 'Add dark mode toggle',
        description:
          'Implement theme switching functionality with persistent user preference storage',
        business_value:
          'Improves user experience And accessibility for users in low-light environments',
        category: 'enhancement',
      };

      const RESULT = await execAPI('suggest-feature', [
        JSON.stringify(featureData),
      ]);
      expect(result.success).toBe(true);
      expect(result.feature).toBeDefined();
      expect(result.feature.title).toBe(featureData.title);
      expect(result.feature.status).toBe('suggested');
    });

    test('should generate API-focused research locations for API tasks', async () => {
      const apiTaskData = {
        title: 'Implement REST API authentication endpoints',
        description:
          'Build comprehensive REST API with JWT authentication And rate limiting',
        category: 'feature',
        priority: 'high',
      };

      const RESULT = await execAPI('create', [JSON.stringify(apiTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      // Should prioritize API-related paths
      const codebaseLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'codebase'
      );
      expect(codebaseLocation.paths).toContain('/api');
      expect(codebaseLocation.paths).toContain('/routes');
      expect(codebaseLocation.paths).toContain('/controllers');

      // Should include API-related keywords
      const internetLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'internet'
      );
      expect(internetLocation.keywords).toContain('api');
      expect(internetLocation.keywords).toContain('rest');
      expect(internetLocation.keywords).toContain('authentication');
    });

    test('should generate security-focused research locations for security tasks', async () => {
      const securityTaskData = {
        title: 'Implement OAuth 2.0 security framework',
        description:
          'Add comprehensive security controls with OAuth 2.0, CSRF protection, And input validation',
        category: 'feature',
        priority: 'critical',
      };

      const RESULT = await execAPI('create', [
        JSON.stringify(securityTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      // Should include security-focused keywords
      const internetLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'internet'
      );
      expect(internetLocation.keywords).toContain('oauth');
      expect(internetLocation.keywords).toContain('security');
      expect(internetLocation.keywords).toContain('framework');

      // Should include security-related focus areas
      expect(internetLocation.focus).toContain('security');
    });

    test('should generate performance-focused research locations for optimization tasks', async () => {
      const performanceTaskData = {
        title: 'Optimize database query performance',
        description:
          'Implement caching, indexing, And query optimization strategies for better performance',
        category: 'feature',
        priority: 'high',
      };

      const RESULT = await execAPI('create', [
        JSON.stringify(performanceTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      // Should include performance-related keywords
      const internetLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'internet'
      );
      expect(internetLocation.keywords).toContain('optimize');
      expect(internetLocation.keywords).toContain('performance');
      expect(internetLocation.keywords).toContain('database');
    });
  });

  // ========================================
  // RESEARCH KEYWORD EXTRACTION TESTS
  // ========================================

  describe('Research Keyword Extraction', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should extract relevant keywords from task title And description', async () => {
      const complexTaskData = {
        title:
          'Implement microservices architecture with Docker containerization',
        description:
          'Refactor monolithic application into distributed microservices using Docker, Kubernetes, And service mesh technology for scalability And maintainability',
        category: 'feature',
        priority: 'high',
      };

      const RESULT = await execAPI('create', [JSON.stringify(complexTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      const internetLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'internet'
      );

      // Should extract key technical terms
      expect(internetLocation.keywords).toContain('microservices');
      expect(internetLocation.keywords).toContain('architecture');
      expect(internetLocation.keywords).toContain('docker');

      // Should handle partial matches or related terms
      const hasRelatedTerms = internetLocation.keywords.some((keyword) =>
        [
          'containerization',
          'kubernetes',
          'distributed',
          'scalability',
        ].includes(keyword.toLowerCase())
      );
      expect(hasRelatedTerms).toBe(true);
    });

    test('should avoid generic keywords And focus on technical terms', async () => {
      const taskWithGenericTerms = {
        title: 'Create a new system to implement better user experience',
        description:
          'Build a good solution That works well And provides excellent functionality for users',
        category: 'feature',
        priority: 'medium',
      };

      const RESULT = await execAPI('create', [
        JSON.stringify(taskWithGenericTerms),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      const internetLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'internet'
      );

      // Should avoid overly generic terms
      const genericTerms = ['good', 'better', 'excellent', 'well', 'new'];
      const hasGenericTerms = internetLocation.keywords.some((keyword) =>
        genericTerms.includes(keyword.toLowerCase())
      );
      expect(hasGenericTerms).toBe(false);

      // Should still extract meaningful terms
      expect(internetLocation.keywords).toContain('system');
      expect(internetLocation.keywords).toContain('user');
      expect(internetLocation.keywords).toContain('experience');
    });

    test('should limit keyword count to reasonable number', async () => {
      const verboseTaskData = {
        title:
          'Comprehensive implementation of advanced authentication authorization security framework',
        description:
          'Detailed comprehensive implementation involving multiple complex technologies including authentication authorization security validation encryption hashing salting sessions cookies tokens JWT OAuth SAML LDAP Active Directory database integration API endpoints middleware logging monitoring performance optimization caching distributed systems microservices containers orchestration deployment scaling',
        category: 'feature',
        priority: 'high',
      };

      const RESULT = await execAPI('create', [JSON.stringify(verboseTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      const internetLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'internet'
      );

      // Should limit keywords to reasonable number (typically 5-10)
      expect(internetLocation.keywords.length).toBeLessThanOrEqual(10);
      expect(internetLocation.keywords.length).toBeGreaterThanOrEqual(3);

      // Should prioritize most important terms
      expect(internetLocation.keywords).toContain('authentication');
      expect(internetLocation.keywords).toContain('security');
      expect(internetLocation.keywords).toContain('framework');
    });
  });

  // ========================================
  // RESEARCH DELIVERABLES GENERATION TESTS
  // ========================================

  describe('Research Deliverables Generation', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should generate standard deliverables for all research tasks', async () => {
      const standardTaskData = {
        title: 'Standard feature implementation',
        description: 'Regular feature implementation requiring research',
        category: 'feature',
        priority: 'medium',
      };

      const RESULT = await execAPI('create', [
        JSON.stringify(standardTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      expect(researchSubtask.deliverables).toBeDefined();
      expect(researchSubtask.deliverables).toContain(
        'Technical analysis report'
      );
      expect(researchSubtask.deliverables).toContain(
        'Implementation recommendations'
      );
      expect(researchSubtask.deliverables).toContain('Risk assessment');
      expect(researchSubtask.deliverables).toContain(
        'Alternative approaches evaluation'
      );
    });

    test('should set appropriate estimated hours for research tasks', async () => {
      const researchTaskData = {
        title: 'Complex research requiring extensive investigation',
        description:
          'Detailed research task involving multiple technologies And approaches',
        category: 'feature',
        priority: 'high',
      };

      const RESULT = await execAPI('create', [
        JSON.stringify(researchTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      expect(researchSubtask.estimated_hours).toBeDefined();
      expect(typeof researchSubtask.estimated_hours).toBe('number');
      expect(researchSubtask.estimated_hours).toBeGreaterThan(0);
      expect(researchSubtask.estimated_hours).toBeLessThanOrEqual(8); // Reasonable upper bound
    });

    test('should set prevents_implementation flag correctly', async () => {
      const implementationTaskData = {
        title: 'Critical implementation requiring research',
        description:
          'Implementation That should not start without proper research',
        category: 'feature',
        priority: 'critical',
      };

      const RESULT = await execAPI('create', [
        JSON.stringify(implementationTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      expect(researchSubtask.prevents_implementation).toBe(true);
      expect(researchSubtask.status).toBe('pending');
    });
  });

  // ========================================
  // RESEARCH FOCUS AREA TESTS
  // ========================================

  describe('Research Focus Areas', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should generate appropriate focus areas for different research types', async () => {
      const architectureTaskData = {
        title: 'Design system architecture',
        description:
          'Create scalable system architecture with proper design patterns',
        category: 'feature',
        priority: 'high',
      };

      const RESULT = await execAPI('create', [
        JSON.stringify(architectureTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      // Check codebase research focus
      const codebaseLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'codebase'
      );
      expect(codebaseLocation.focus).toBeDefined();
      expect(codebaseLocation.focus).toContain('architecture');

      // Check internet research focus
      const internetLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'internet'
      );
      expect(internetLocation.focus).toBeDefined();
      expect(internetLocation.focus).toContain('practices');

      // Check documentation research focus
      const docsLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'documentation'
      );
      expect(docsLocation.focus).toBeDefined();
    });

    test('should include project-specific documentation sources', async () => {
      const documentedTaskData = {
        title: 'Implement documented API feature',
        description:
          'Feature That should reference existing project documentation',
        category: 'feature',
        priority: 'medium',
      };

      const RESULT = await execAPI('create', [
        JSON.stringify(documentedTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      const docsLocation = researchSubtask.research_locations.find(
        (loc) => loc.type === 'documentation'
      );

      // Should include standard documentation sources
      expect(docsLocation.sources).toContain('README.md');
      expect(docsLocation.sources).toContain('docs/');
      expect(docsLocation.sources).toContain('API documentation');
      expect(docsLocation.sources).toContain('package.json');
    });
  });

  // ========================================
  // RESEARCH TASK ID GENERATION TESTS
  // ========================================

  describe('Research Task ID Generation', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should generate unique research subtask IDs', async () => {
      const taskIds = new Set();

      // Create multiple tasks to test ID uniqueness
      // Use for-await-of to maintain sequential processing for research ID validation
      const taskDataList = [];
      for (let i = 0; i < 5; i++) {
        taskDataList.push({
          title: `Research task ${i + 1}`,
          description: `Description for research task ${i + 1}`,
          category: 'feature',
          priority: 'medium',
        });
      }

      for await (const taskData of taskDataList) {
        const RESULT = await execAPI('create', [JSON.stringify(taskData)]);
        expect(result.success).toBe(true);

        const listResult = await execAPI('list');
        const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
        const researchSubtask = task.subtasks.find(
          (st) => st.type === 'research'
        );

        if (researchSubtask) {
          expect(researchSubtask.id).toMatch(/^research_\d+_[a-f0-9]{8}$/);
          expect(taskIds.has(researchSubtask.id)).toBe(false);
          taskIds.add(researchSubtask.id);
        }
      }

      expect(taskIds.size).toBeGreaterThan(0);
    });

    test('should create research subtasks with proper timestamps', async () => {
      const beforeTime = Date.now();

      const taskData = {
        title: 'Timestamp test research task',
        description: 'Task to verify research subtask timestamp generation',
        category: 'feature',
        priority: 'medium',
      };

      const RESULT = await execAPI('create', [JSON.stringify(taskData)]);
      expect(result.success).toBe(true);

      const afterTime = Date.now();

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      if (researchSubtask) {
        expect(researchSubtask.created_at).toBeDefined();
        const createdTime = new Date(researchSubtask.created_at).getTime();
        expect(createdTime).toBeGreaterThanOrEqual(beforeTime);
        expect(createdTime).toBeLessThanOrEqual(afterTime);
      }
    });
  });

  // ========================================
  // RESEARCH TASK EDGE CASES
  // ========================================

  describe('Research Task Edge Cases', () => {
    beforeEach(async () => {
      const initResult = await execAPI('init');
      testAgentId = initResult.agentId;
    });

    test('should handle tasks with empty or minimal descriptions', async () => {
      const minimalTaskData = {
        title: 'Minimal task',
        description: '',
        category: 'feature',
        priority: 'low',
      };

      const RESULT = await execAPI('create', [JSON.stringify(minimalTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);

      // Should still create subtasks even with minimal description
      expect(task.subtasks).toBeDefined();

      if (task.subtasks.length > 0) {
        const researchSubtask = task.subtasks.find(
          (st) => st.type === 'research'
        );
        if (researchSubtask) {
          expect(researchSubtask.research_locations).toBeDefined();
          expect(researchSubtask.deliverables).toBeDefined();
        }
      }
    });

    test('should handle tasks with special characters in title', async () => {
      const specialCharsTaskData = {
        title: 'API@2.0: Implement REST/GraphQL endpoints (OAuth2.0 + JWT)',
        description: 'Complex task with special characters: @, /, (), +, ., :',
        category: 'feature',
        priority: 'medium',
      };

      const RESULT = await execAPI('create', [
        JSON.stringify(specialCharsTaskData),
      ]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      if (researchSubtask) {
        expect(researchSubtask.title).toContain('Research:');
        expect(researchSubtask.id).toMatch(/^research_\d+_[a-f0-9]{8}$/);

        // Should extract meaningful keywords despite special characters
        const internetLocation = researchSubtask.research_locations.find(
          (loc) => loc.type === 'internet'
        );
        expect(internetLocation.keywords).toContain('api');
        expect(
          internetLocation.keywords.some(
            (k) => k.includes('oauth') || k.includes('jwt')
          )
        ).toBe(true);
      }
    });

    test('should handle very long task titles gracefully', async () => {
      const longTitle =
        'Implement comprehensive enterprise-grade authentication authorization security framework with advanced features including multi-factor authentication single sign-on role-based access control fine-grained permissions user management session handling token management JWT OAuth SAML integration'.substring(
          0,
          500
        );

      const longTaskData = {
        title: longTitle,
        description:
          'Task with extremely long title to test research subtask handling',
        category: 'feature',
        priority: 'medium',
      };

      const RESULT = await execAPI('create', [JSON.stringify(longTaskData)]);
      expect(result.success).toBe(true);

      const listResult = await execAPI('list');
      const task = listResult.tasks.find((t) => t.id === RESULT.taskId);
      const researchSubtask = task.subtasks.find(
        (st) => st.type === 'research'
      );

      if (researchSubtask) {
        expect(researchSubtask.title.length).toBeLessThan(
          longTitle.length + 20
        );
        expect(researchSubtask.research_locations).toBeDefined();

        // Should still extract relevant keywords
        const internetLocation = researchSubtask.research_locations.find(
          (loc) => loc.type === 'internet'
        );
        expect(internetLocation.keywords).toContain('authentication');
        expect(internetLocation.keywords).toContain('security');
      }
    });
  });
});
